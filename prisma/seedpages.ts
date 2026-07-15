// prisma/seed.ts
import 'dotenv/config'
import { PrismaClient } from '../src/generated/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import bcrypt from 'bcryptjs'

const pool = new Pool({ connectionString: process.env.DATABASE_URL! })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🧹 Limpando Paginas...')


  await prisma.customPage.deleteMany()

  console.log('✅ Paginas limpas!')

  // ─────────────────────────────────────────
  // 📄 PÁGINAS CUSTOMIZADAS
  // ─────────────────────────────────────────
 await prisma.customPage.createMany({
  data: [
    {
      slug: 'sobre',
      title: 'Sobre a Geicy Crochê',
      introText:
        'A Geicy Crochê é uma marca artesanal especializada em peças de crochê feminino feitas à mão, com foco em moda, acessórios e decoração para o lar. Cada peça é produzida com cuidado, qualidade e muito estilo.',
      section1Title: 'Crochê com personalidade e carinho',
      section1Text:
        'A Geicy Crochê nasceu da paixão pelo artesanato e da vontade de criar peças que unem beleza, funcionalidade e identidade. Do guarda-roupa à decoração da casa, nossas criações em crochê são pensadas para mulheres que valorizam o feito à mão e buscam algo verdadeiramente exclusivo. Trabalhamos com roupas, bolsas, acessórios e itens para o lar — sempre com acabamento cuidadoso e produção artesanal.',
    },
    {
      slug: 'personalizado',
      title: 'Peças de crochê do seu jeito',
      introText:
        'Na Geicy Crochê, você pode encomendar peças personalizadas nas suas cores, medidas e estilo. Cada encomenda é tratada com atenção especial para entregar exatamente o que você imaginou.',
      section1Title: 'O que podemos personalizar?',
      section1Text:
        'Roupas com medidas sob consulta, bolsas em cores exclusivas, itens de decoração no padrão da sua casa e muito mais. A personalização é parte do nosso DNA — acreditamos que cada cliente merece uma peça única.',
      faq: [
        {
          pergunta: 'Posso encomendar roupas no meu tamanho?',
          resposta:
            'Sim! Trabalhamos com encomendas de roupas ajustadas ao seu biotipo. Entre em contato com suas medidas e a gente cria a peça ideal para você.',
        },
        {
          pergunta: 'Vocês fazem jogos de banheiro personalizados?',
          resposta:
            'Sim, fazemos jogos de banheiro, tapetes e passadeiras em crochê com as cores e tamanhos que você precisar.',
        },
        {
          pergunta: 'Qual o prazo para encomendas?',
          resposta:
            'O prazo varia de acordo com a peça e a quantidade. Em média, de 7 a 20 dias úteis após a confirmação do pedido.',
        },
        {
          pergunta: 'Como faço para encomendar?',
          resposta:
            'Entre em contato pelo WhatsApp, descreva a peça desejada, informe as cores e medidas se necessário, e a gente te passa um orçamento rapidinho.',
        },
      ],
    },
  ],
})
console.log('✅ Páginas sobre e personalizado criadas — geicycroche.com.br')

}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })