import { signShippingQuote } from '@/core/lib/commerce-security'
// src/app/api/frete/route.ts
import { NextResponse } from 'next/server'

interface MelhorEnvioResponse {
  id: number
  name: string
  price?: string
  delivery_time?: number
  error?: string
}

export async function POST(request: Request) {
  try {
    const { cepDestino, quantidade } = await request.json()

    console.log('📦 REQUEST:', { cepDestino, quantidade })

    const response = await fetch(
      'https://www.melhorenvio.com.br/api/v2/me/shipment/calculate',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.MELHOR_ENVIO_TOKEN}`,
        },
        body: JSON.stringify({
          from: { postal_code: '25935506' },
          to: { postal_code: cepDestino },
          products: [
            {
              id: '1',
              quantity: quantidade,
              weight: 0.2,
              width: 20,
              height: 5,
              length: 20,
              insurance_value: 100,
            },
          ],
        }),
      }
    )

    const data = await response.json()

    console.log('🚚 RESPOSTA BRUTA:', data)

    if (!response.ok) {
      console.error('❌ ERRO API:', data)
      return NextResponse.json({ error: 'Erro na API' }, { status: 400 })
    }

    // 🎯 FILTRO FINAL (PAC + SEDEX válidos)
    const resultado = data
      .filter((service: MelhorEnvioResponse) => {
        const nome = service.name?.toLowerCase() || ''

        const isPacOrSedex =
          nome === 'pac' || nome === 'sedex'

        const hasError =
          service.error &&
          service.error.includes('não atende')

        return isPacOrSedex && !hasError && service.price
      })
      .map((service: MelhorEnvioResponse) => ({
        id: service.id,
        name: service.name,
        price: Number(service.price).toFixed(2),
        quoteToken: signShippingQuote(cepDestino.replace(/\D/g, ''), quantidade, Number(service.price).toFixed(2), service.id),
        delivery_time: service.delivery_time,
      }))

    console.log('✅ RESULTADO FINAL:', resultado)

    return NextResponse.json(resultado)
  } catch (err: any) {
    console.error('💥 ERRO:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}