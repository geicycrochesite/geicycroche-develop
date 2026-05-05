// prisma/seed-pages.ts
import 'dotenv/config'
import { PrismaClient } from '../src/generated/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL! })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🧹 Limpando páginas customizadas...')

  await prisma.customPage.deleteMany()

  console.log('✅ Limpas!')

  // ─────────────────────────────────────────
  // 📄 SOBRE (SEO + CONVERSÃO)
  // ─────────────────────────────────────────
  const sobre = await prisma.customPage.create({
    data: {
      slug: 'sobre',
      title: 'Sobre a Geicy Crochê',

      coverImage: '/bg-gc-croche-com-elegancia-e-estilo.png',

      introText: `
A Geicy Crochê é especializada na criação de peças artesanais em crochê feitas à mão com alto padrão de qualidade.

Cada produto é desenvolvido com atenção aos detalhes, garantindo acabamento impecável, durabilidade e um design exclusivo que valoriza o estilo de quem usa.

Trabalhamos com crochê moderno e sofisticado, criando desde roupas femininas até acessórios e itens de decoração para casa.
      `,

      section1Title: 'Crochê artesanal com qualidade e exclusividade',

      section1Text: `
Ao escolher uma peça da Geicy Crochê, você leva muito mais do que um produto — leva um trabalho artesanal único.

✔ Produção manual peça por peça  
✔ Design exclusivo e personalizado  
✔ Materiais selecionados para maior durabilidade  
✔ Acabamento profissional  

Nosso objetivo é oferecer peças que unam conforto, beleza e autenticidade, valorizando o feito à mão em cada detalhe.

Se você busca crochê diferenciado, com identidade e sofisticação, aqui é o lugar certo.
      `,
    },
  })

  console.log('✅ Página SOBRE criada!')

  // ─────────────────────────────────────────
  // 📄 PERSONALIZADO (SEO + CONVERSÃO)
  // ─────────────────────────────────────────
  const personalizado = await prisma.customPage.create({
    data: {
      slug: 'personalizado',
      title: 'Encomendas Personalizadas em Crochê',

      coverImage: '/top-de-croche-frente-unica-vermelho.png',

      introText: `
Na Geicy Crochê você pode criar uma peça totalmente personalizada, feita sob medida para o seu estilo.

Produzimos roupas, bolsas e itens decorativos em crochê de acordo com sua ideia, permitindo escolher cores, modelos e acabamentos.
      `,

      section1Title: 'Como funciona o crochê sob encomenda',

      section1Text: `
O processo de encomenda é simples e pensado para facilitar sua experiência:

1. Entre em contato pelo WhatsApp  
2. Envie referências ou descreva o modelo desejado  
3. Escolha cores, tamanho e detalhes  
4. Receba o prazo de produção  
5. A peça é produzida manualmente com todo cuidado  

Cada encomenda é única e feita especialmente para você.
      `,

      faq: [
        {
          question: 'Posso escolher qualquer cor?',
          answer: 'Sim, você pode escolher as cores conforme sua preferência e disponibilidade dos fios.'
        },
        {
          question: 'Vocês fazem peças sob medida?',
          answer: 'Sim, trabalhamos com medidas personalizadas para melhor ajuste e conforto.'
        },
        {
          question: 'Qual o prazo de produção?',
          answer: 'O prazo varia conforme o tipo de peça e demanda, sendo informado antes do início.'
        },
        {
          question: 'Fazem entrega para todo o Brasil?',
          answer: 'Sim, enviamos para todo o Brasil com embalagem segura.'
        },
        {
          question: 'Posso pedir algo que vi na internet?',
          answer: 'Sim! Você pode enviar referências e adaptamos o modelo para crochê artesanal.'
        },
        {
          question: 'Os produtos são iguais às fotos?',
          answer: 'Por serem feitos à mão, podem ter pequenas variações, garantindo exclusividade.'
        }
      ],
    },
  })

  console.log('✅ Página PERSONALIZADO criada!')

  console.log('')
  console.log('🎉 Seed finalizado com sucesso!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })