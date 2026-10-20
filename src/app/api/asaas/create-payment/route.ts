import { prisma } from '@/core/lib/prisma'
import { canAccessOrder } from '@/core/lib/order-access'
import { payableTotal } from '@/core/lib/commerce-security'
import { mutationGuard, privateJson } from '@/core/lib/request-security'
import { NextRequest, NextResponse } from 'next/server';
import { asaasFetch, AsaasPayment } from '@/core/lib/asaas';
import * as yup from 'yup';

export const runtime = 'nodejs';

const creditCardSchema = yup.object({
  creditCardNumber: yup.string().matches(/^\d{16}$/).required(),
  creditCardExpirationMonth: yup.string().matches(/^(0[1-9]|1[0-2])$/).required(),
  creditCardExpirationYear: yup.string().matches(/^\d{4}$/).required(),
  creditCardCvv: yup.string().matches(/^\d{3,4}$/).required(),
  creditCardHolderName: yup.string().required(),
});

const createPaymentSchema = yup.object({
  customerId: yup.string().required(),
  orderId: yup.string().required(),
  total: yup.number().required().positive(),

  billingType: yup
    .string()
    .oneOf(['CREDIT_CARD', 'PIX'])
    .required(),

  creditCardData: yup
    .object({
      creditCardNumber: yup.string().matches(/^\d{16}$/),
      creditCardExpirationMonth: yup.string().matches(/^(0[1-9]|1[0-2])$/),
      creditCardExpirationYear: yup.string().matches(/^\d{4}$/),
      creditCardCvv: yup.string().matches(/^\d{3,4}$/),
      creditCardHolderName: yup.string(),
    })
    .nullable()
    .notRequired()
    .when('billingType', {
      is: 'CREDIT_CARD',
      then: (schema) =>
        schema.shape({
          creditCardNumber: yup.string().matches(/^\d{16}$/).required(),
          creditCardExpirationMonth: yup.string().matches(/^(0[1-9]|1[0-2])$/).required(),
          creditCardExpirationYear: yup.string().matches(/^\d{4}$/).required(),
          creditCardCvv: yup.string().matches(/^\d{3,4}$/).required(),
          creditCardHolderName: yup.string().required(),
        }),
    }),

  dueDate: yup.string().optional(),
});

type CreatePaymentRequest = yup.InferType<typeof createPaymentSchema>;

export async function POST(req: NextRequest) {
  try {
    const guard = mutationGuard(req, 'asaas-payment')
    if (guard) return guard
    const body = await req.json();
    if (typeof body?.orderId !== 'string' || !await canAccessOrder(body.orderId)) return privateJson({ error: 'Pedido não encontrado.' }, 404)
    const order = await prisma.order.findUnique({ where: { id: body.orderId } })
    if (!order || order.paymentProvider !== 'asaas' || !order.customerId) return privateJson({ error: 'Provedor ou pagador divergente.' }, 409)
    if (['approved','CONFIRMED','RECEIVED','refunded','refund_pending','disputed'].includes(order.statusPagamento ?? '')) return privateJson({ error: 'Pedido já liquidado.' }, 409)
    body.customerId = order.customerId
    body.total = payableTotal(order)

    let validatedData: CreatePaymentRequest;
    try {
      validatedData = await createPaymentSchema.validate(body, {
        abortEarly: false,
      });
    } catch (validationError: any) {
      return NextResponse.json(
        { error: 'Validação falhou', details: validationError.errors },
        { status: 400 }
      );
    }

    // 🔥 validação manual (mais confiável que when)
    if (validatedData.billingType === 'CREDIT_CARD') {
      if (!validatedData.creditCardData) {
        return NextResponse.json(
          { error: 'creditCardData é obrigatório para cartão' },
          { status: 400 }
        );
      }
    }

    const remoteIp =
      req.headers.get('x-forwarded-for') ||
      req.headers.get('x-real-ip') ||
      '127.0.0.1';

    const dueDate = ensureFutureDate(
      validatedData.dueDate || getDefaultDueDate(validatedData.billingType)
    );

    const payload: any = {
      customer: validatedData.customerId,
      billingType: validatedData.billingType,
      value: validatedData.total,
      dueDate,
      description: `Pedido #${validatedData.orderId}`,
      externalReference: validatedData.orderId,
      remoteIp,
    };

    // 💳 CARTÃO
    if (validatedData.billingType === 'CREDIT_CARD' && validatedData.creditCardData) {
      payload.creditCard = {
        holderName: validatedData.creditCardData.creditCardHolderName,
        number: validatedData.creditCardData.creditCardNumber,
        expiryMonth: validatedData.creditCardData.creditCardExpirationMonth,
        expiryYear: validatedData.creditCardData.creditCardExpirationYear,
        ccv: validatedData.creditCardData.creditCardCvv,
      };

      // ⚠️ ESSENCIAL pro Asaas
      payload.creditCardHolderInfo = {
        name: validatedData.creditCardData.creditCardHolderName,
        email: 'cliente@email.com',
        cpfCnpj: '12345678909',
        postalCode: '00000000',
        addressNumber: '1',
        phone: '11999999999',
      };
    }

    console.log('[Asaas Create Payment] Payload:', {
      billingType: payload.billingType,
      value: payload.value,
      orderId: validatedData.orderId,
      customerId: validatedData.customerId,
      dueDate: payload.dueDate,
    });

    const payment = await asaasFetch<AsaasPayment>(
      '/payments',
      'POST',
      payload
    );

    console.log('[Asaas Create Payment] Success:', payment.id);

    return NextResponse.json({
      success: true,
      paymentId: payment.id,
      payment,
    });
  } catch (error: any) {
    console.error('[Asaas Create Payment Error]:', error);

    return NextResponse.json(
      {
        error: error.message || 'Erro ao criar cobrança no Asaas',
      },
      { status: 400 }
    );
  }
}

/**
 * 📅 regras de data
 */
function getDefaultDueDate(billingType: string): string {
  const date = new Date();

  if (billingType === 'CREDIT_CARD') {
    date.setDate(date.getDate() + 1);
  } else {
    date.setDate(date.getDate() + 30);
  }

  return formatDate(date);
}

function ensureFutureDate(dateStr: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const input = new Date(dateStr);
  input.setHours(0, 0, 0, 0);

  if (input <= today) {
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    return formatDate(tomorrow);
  }

  return dateStr;
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}