/**
 * Creates a new customer in Asaas
 * POST /api/asaas/create-customer
 * 
 * Body:
 * {
 *   name: string (required)
 *   email: string (required)
 *   cpf: string (required, 11 digits)
 *   birthDate: string (required, YYYY-MM-DD)
 *   phone?: string
 *   address?: {
 *     street: string
 *     number: string
 *     neighborhood: string
 *     city: string
 *     state: string
 *     zipCode: string
 *     complement?: string
 *   }
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { asaasFetch, AsaasCustomer } from '@/core/lib/asaas';
import * as yup from 'yup';

export const runtime = 'nodejs';

const createCustomerSchema = yup.object({
  name: yup.string().required('Nome é obrigatório').min(3, 'Nome deve ter pelo menos 3 caracteres'),
  email: yup.string().email('E-mail inválido').required('E-mail é obrigatório'),
  cpf: yup
    .string()
    .required('CPF é obrigatório')
    .matches(/^\d{11}$/, 'CPF deve conter 11 dígitos sem formatação'),
  birthDate: yup
    .string()
    .required('Data de nascimento é obrigatória')
    .matches(/^\d{4}-\d{2}-\d{2}$/, 'Data de nascimento deve estar no formato YYYY-MM-DD'),
  phone: yup.string().matches(/^\d{10,11}$/, 'Telefone deve conter 10 ou 11 dígitos'),
  address: yup.object({
    street: yup.string(),
    number: yup.string(),
    neighborhood: yup.string(),
    city: yup.string(),
    state: yup.string(),
    zipCode: yup.string().matches(/^\d{8}$/, 'CEP deve conter 8 dígitos'),
    complement: yup.string(),
  }),
});

type CreateCustomerRequest = yup.InferType<typeof createCustomerSchema>;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validate request body
    let validatedData: CreateCustomerRequest;
    try {
      validatedData = await createCustomerSchema.validate(body, { abortEarly: false });
    } catch (validationError: any) {
      return NextResponse.json(
        { error: 'Validação falhou', details: validationError.errors },
        { status: 400 }
      );
    }
    
    // Format CPF and phone (remove any non-digits)
    const cpfClean = validatedData.cpf.replace(/\D/g, '');
    const phoneClean = validatedData.phone?.replace(/\D/g, '');
    
    // Build Asaas payload
    const payload: any = {
      name: validatedData.name.trim(),
      email: validatedData.email.trim(),
      cpfCnpj: cpfClean,
      birthDate: validatedData.birthDate,
    };
    
    if (phoneClean) {
      payload.mobilePhone = phoneClean;
    }
    
    if (validatedData.address) {
      payload.address = {
        street: validatedData.address.street?.trim(),
        number: validatedData.address.number?.trim(),
        neighborhood: validatedData.address.neighborhood?.trim(),
        city: validatedData.address.city?.trim(),
        state: validatedData.address.state?.trim(),
        zipCode: validatedData.address.zipCode?.replace(/\D/g, ''),
        ...(validatedData.address.complement && {
          complement: validatedData.address.complement.trim(),
        }),
      };
    }
    
    console.log('[Asaas Create Customer] Payload:', {
      name: payload.name,
      email: payload.email,
      document: cpfClean,
      birthDate: payload.birthDate,
    });
    
    // Create customer in Asaas
    const customer = await asaasFetch<AsaasCustomer>('/customers', 'POST', payload);
    
    console.log('[Asaas Create Customer] Success:', customer.id);
    
    return NextResponse.json({
      success: true,
      customerId: customer.id,
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        document: customer.document,
      },
    });
  } catch (error: any) {
    console.error('[Asaas Create Customer Error]:', error);
    
    return NextResponse.json(
      {
        error: error.message || 'Erro ao criar cliente no Asaas',
      },
      { status: 400 }
    );
  }
}