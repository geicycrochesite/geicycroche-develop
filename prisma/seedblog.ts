// prisma/seedBlogGeicyCroche.ts

import 'dotenv/config'
import { PrismaClient } from '../src/generated/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL! })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🧹 Resetando blog (GeicyCroche)...')

  await prisma.postSEO.deleteMany()
  await prisma.post.deleteMany()
  await prisma.blogCategory.deleteMany()

  console.log('✅ Blog limpo!')

  // ─────────────────────────────────────────
  // 📂 CATEGORIAS (GEICYCROCHE)
  // ─────────────────────────────────────────
  const [modaCopa, modaPraia, decoracaoCasa, cuidadosCroche] = await Promise.all([
    prisma.blogCategory.create({
      data: {
        name: 'Moda Copa e Verão',
        slug: 'moda-copa-verao',
        description: 'Tops de crochê, looks brasileiros e tendências para o verão.',
        image: '/produtos/top-copa-croche.jpg',
        showOnHome: true,
        featured: true,
        order: 1,
      },
    }),

    prisma.blogCategory.create({
      data: {
        name: 'Moda Praia em Crochê',
        slug: 'moda-praia-croche',
        description: 'Saídas de praia, biquínis e peças artesanais para o litoral.',
        image: '/produtos/saida-praia-croche.jpg',
        showOnHome: true,
        featured: false,
        order: 2,
      },
    }),

    prisma.blogCategory.create({
      data: {
        name: 'Crochê para Casa',
        slug: 'croche-para-casa',
        description: 'Tapetes, jogos de banheiro, passadeiras e mesa posta artesanal.',
        image: '/produtos/tapete-croche-sala.jpg',
        showOnHome: true,
        featured: false,
        order: 3,
      },
    }),

    prisma.blogCategory.create({
      data: {
        name: 'Dicas e Cuidados',
        slug: 'dicas-cuidados-croche',
        description: 'Como cuidar, conservar e valorizar suas peças de crochê.',
        image: '/produtos/cuidados-croche.jpg',
        showOnHome: true,
        featured: false,
        order: 4,
      },
    }),
  ])

  // ─────────────────────────────────────────
  // 📝 POSTS (GEICYCROCHE)
  // ─────────────────────────────────────────
  const posts = [
    // 1. Tops Copa
    {
      title:
        'Tops de Crochê para a Copa do Mundo: O Look Brasileiro Que Vai Dominar o Verão',
      slug: 'tops-de-croche-copa-do-mundo',
      excerpt:
        'Os tops de crochê inspirados na Copa do Mundo são a grande tendência do verão, unindo moda artesanal, estilo brasileiro e conforto.',
      content: `
## Tops de crochê para a Copa do Mundo: o look brasileiro do verão

A moda artesanal nunca esteve tão em alta, e os tops de crochê para a Copa do Mundo provaram isso. Inspirados nas cores do Brasil, esses modelos unem autenticidade, conforto e aquele toque exclusivo que só o crochê artesanal oferece.

Além de serem perfeitos para assistir aos jogos, os tops também combinam com saídas de praia, shorts jeans, saias e até produções mais modernas para festivais e eventos de verão.

O grande diferencial está na exclusividade das peças. Cada top artesanal possui detalhes únicos, acabamento feito à mão e personalidade própria. Isso transforma o visual em algo muito mais sofisticado e especial do que peças industrializadas.

Outra vantagem é a versatilidade. Os modelos podem ser usados:

- 💚 Na praia
- 💛 Em festas temáticas
- 💙 Em viagens de verão
- 💚 Em looks casuais do dia a dia
- 💛 Em eventos esportivos

As cores verde, amarelo e azul ganham ainda mais destaque quando combinadas com pontos artesanais modernos e modelagens atuais.

Quem busca um visual estiloso, confortável e cheio de personalidade encontra nos tops de crochê da Copa a escolha perfeita para este verão.
      `,
      categoryId: modaCopa.id,
      seo: {
        metaTitle:
          'Tops de crochê da Copa: look brasileiro para o verão',
        metaDesc:
          'Veja por que os tops de crochê inspirados na Copa do Mundo são a grande tendência do verão e como usar em diferentes looks.',
        keywords:
          'top de crochê copa do mundo, top de crochê brasil, moda copa do mundo feminina, top artesanal brasileiro, crochê verão, moda praia artesanal, top verde e amarelo, top de crochê feminino',
      },
    },

    // 2. Looks com top de crochê
    {
      title: 'Como Montar Looks Incríveis com Tops de Crochê da Copa',
      slug: 'looks-com-top-de-croche-copa',
      excerpt:
        'Aprenda combinações modernas com tops de crochê da Copa para praia, festas e eventos esportivos.',
      content: `
## Como montar looks incríveis com tops de crochê da Copa

Os tops de crochê inspirados na Copa do Mundo se tornaram uma verdadeira febre na moda feminina. Além do visual artesanal sofisticado, eles oferecem inúmeras possibilidades de combinações.

Para um look casual e confortável:

- 💚 Top de crochê + short jeans
- 💛 Top artesanal + saia branca
- 💙 Top da Copa + calça pantalona leve

Já para a praia, a combinação perfeita é:

- 💚 Top de crochê + saída de praia artesanal
- 💛 Biquíni neutro + top vazado
- 💙 Chapéu de palha + acessórios naturais

O grande segredo está nos detalhes. Bolsas de crochê, pulseiras artesanais e sandálias rasteiras ajudam a criar um visual ainda mais elegante.

As peças feitas à mão carregam autenticidade e valorizam a moda artesanal brasileira, tornando cada produção mais exclusiva e cheia de personalidade.
      `,
      categoryId: modaCopa.id,
      seo: {
        metaTitle:
          'Looks com top de crochê da Copa: combinações para o verão',
        metaDesc:
          'Descubra como usar tops de crochê da Copa em looks casuais, de praia e para eventos esportivos com muito estilo.',
        keywords:
          'looks com top de crochê, top copa do mundo feminino, moda artesanal verão, como usar top de crochê, saída de praia artesanal, tendências verão crochê',
      },
    },

    // 3. Saída de praia
    {
      title: 'Saída de Praia em Crochê: Elegância e Conforto Para o Verão',
      slug: 'saida-de-praia-em-croche',
      excerpt:
        'As saídas de praia em crochê são tendência absoluta para quem busca conforto, exclusividade e elegância no verão.',
      content: `
## Saída de praia em crochê: elegância e conforto no verão

As saídas de praia em crochê conquistaram espaço definitivo na moda praia feminina. Leves, elegantes e extremamente versáteis, elas combinam perfeitamente com biquínis, maiôs e acessórios naturais.

O crochê artesanal oferece um acabamento sofisticado que valoriza qualquer produção. Além disso, cada peça possui detalhes únicos, tornando o visual muito mais exclusivo.

Entre os modelos mais procurados estão:

- 🌴 Saída longa vazada
- ☀️ Kimono de crochê
- 🌊 Vestido curto artesanal
- 🐚 Saída com franjas

As cores neutras continuam em alta, mas tons vibrantes também aparecem com força neste verão.

Além da beleza, o conforto é outro diferencial. O crochê permite ventilação natural, tornando as peças ideais para dias quentes.
      `,
      categoryId: modaPraia.id,
      seo: {
        metaTitle:
          'Saída de praia em crochê: elegância artesanal para o verão',
        metaDesc:
          'Conheça os modelos de saída de praia em crochê que unem conforto, sofisticação e exclusividade na moda praia.',
        keywords:
          'saída de praia em crochê, moda praia artesanal, saída de praia feminina, crochê verão, saída de praia elegante, roupa artesanal feminina',
      },
    },

    // 4. Jogo de banheiro
    {
      title: 'Jogo de Banheiro em Crochê: Charme Artesanal Para Sua Casa',
      slug: 'jogo-de-banheiro-em-croche',
      excerpt:
        'Descubra como os jogos de banheiro em crochê deixam o ambiente mais aconchegante, elegante e personalizado.',
      content: `
## Jogo de banheiro em crochê: charme artesanal para sua casa

Os jogos de banheiro em crochê continuam entre os itens mais desejados na decoração artesanal. Além de deixarem o ambiente mais bonito, também trazem sensação de aconchego e cuidado nos detalhes.

Os kits geralmente incluem:

- 🛁 Tapete para vaso
- 🚿 Tapete para pia
- 🧼 Capa para tampa do vaso

As peças artesanais permitem combinações de cores e estilos para todos os tipos de decoração, desde ambientes modernos até os mais clássicos.

Outra vantagem é a durabilidade. Quando produzidos com fios de qualidade, os jogos de banheiro mantêm beleza e resistência por muito mais tempo.

O crochê artesanal valoriza a decoração da casa e transforma ambientes simples em espaços muito mais acolhedores.
      `,
      categoryId: decoracaoCasa.id,
      seo: {
        metaTitle:
          'Jogo de banheiro em crochê: decoração artesanal aconchegante',
        metaDesc:
          'Veja como jogos de banheiro em crochê deixam o ambiente mais bonito, acolhedor e cheio de detalhes artesanais.',
        keywords:
          'jogo de banheiro em crochê, decoração artesanal, tapete de banheiro crochê, kit banheiro crochê, crochê para casa',
      },
    },

    // 5. Passadeiras
    {
      title: 'Passadeiras de Crochê: Beleza e Funcionalidade na Decoração',
      slug: 'passadeiras-de-croche-decoracao',
      excerpt:
        'As passadeiras em crochê unem decoração, conforto e praticidade para cozinhas e corredores.',
      content: `
## Passadeiras de crochê: beleza e praticidade na decoração

As passadeiras de crochê são peças clássicas da decoração artesanal brasileira. Elas ajudam a proteger o piso, aumentam o conforto e ainda deixam os ambientes muito mais elegantes.

Na cozinha, as passadeiras criam sensação de aconchego e valorizam o ambiente. Já em corredores, trazem charme e personalidade.

Os modelos mais procurados incluem:

- 🌿 Passadeiras modernas
- 🧶 Passadeiras florais
- ✨ Modelos minimalistas
- 🏡 Estilo rústico artesanal

As combinações de cores ajudam a harmonizar a decoração da casa e permitem criar ambientes mais sofisticados.
      `,
      categoryId: decoracaoCasa.id,
      seo: {
        metaTitle:
          'Passadeiras de crochê: decoração artesanal para cozinha e corredores',
        metaDesc:
          'Conheça modelos de passadeiras de crochê que unem beleza, funcionalidade e aconchego na decoração.',
        keywords:
          'passadeira de crochê, decoração artesanal, tapete passadeira crochê, passadeira para cozinha, crochê para decoração',
      },
    },

    // 6. Tapetes
    {
      title: 'Tapetes de Crochê: Tendência na Decoração Artesanal',
      slug: 'tapetes-de-croche-tendencia',
      excerpt:
        'Os tapetes de crochê estão em alta na decoração por trazerem conforto, exclusividade e charme artesanal.',
      content: `
## Tapetes de crochê: tendência forte na decoração artesanal

Os tapetes de crochê são muito mais do que itens decorativos. Eles representam cuidado, tradição e valorização do trabalho artesanal.

Além de lindos, ajudam a criar ambientes mais confortáveis e acolhedores.

Os modelos redondos, ovais e modernos são tendência para:

- 🏡 Sala
- 🌿 Quarto
- ☕ Cozinha
- 🛋️ Varanda

As peças feitas à mão oferecem detalhes únicos e acabamento diferenciado, valorizando qualquer decoração.
      `,
      categoryId: decoracaoCasa.id,
      seo: {
        metaTitle:
          'Tapetes de crochê: conforto e beleza na decoração artesanal',
        metaDesc:
          'Veja como tapetes de crochê deixam sala, quarto, cozinha e varanda mais aconchegantes e elegantes.',
        keywords:
          'tapete de crochê, decoração artesanal moderna, tapete artesanal, crochê para casa, tapete feito à mão',
      },
    },

    // 7. Souplat / mesa posta
    {
      title:
        'Mesa Posta com Souplat de Crochê: Elegância Artesanal nas Refeições',
      slug: 'souplat-de-croche-mesa-posta',
      excerpt:
        'Os kits de souplat em crochê são perfeitos para deixar a mesa posta mais elegante, aconchegante e especial.',
      content: `
## Souplat de crochê: elegância artesanal na mesa posta

A mesa posta ganhou enorme destaque nos últimos anos, e os souplats de crochê se tornaram protagonistas dessa tendência.

Além de protegerem a mesa, eles deixam qualquer refeição mais elegante e especial.

Os kits artesanais combinam perfeitamente com:

- 🍽️ Louças neutras
- 🌿 Decoração natural
- 🕯️ Jantares especiais
- ☕ Cafés da manhã sofisticados

As peças em crochê valorizam a decoração e criam uma experiência muito mais aconchegante para receber amigos e família.
      `,
      categoryId: decoracaoCasa.id,
      seo: {
        metaTitle:
          'Souplat de crochê: mesa posta artesanal e elegante',
        metaDesc:
          'Descubra como souplats de crochê deixam a mesa posta mais sofisticada, acolhedora e cheia de charme.',
        keywords:
          'souplat de crochê, mesa posta artesanal, kit mesa posta crochê, decoração de mesa, crochê elegante',
      },
    },

    // 8. Moda artesanal em alta
    {
      title: 'Moda Artesanal: Por Que o Crochê Está em Alta',
      slug: 'moda-artesanal-croche-em-alta',
      excerpt:
        'Entenda por que o crochê voltou com força total e se tornou símbolo de exclusividade, estilo e autenticidade.',
      content: `
## Moda artesanal: por que o crochê está em alta

A moda artesanal vive um dos seus maiores momentos. O crochê deixou de ser apenas tradição e passou a ocupar espaço nas principais tendências fashion.

O grande diferencial das peças handmade está na exclusividade. Cada produto possui detalhes únicos e acabamento especial.

Além disso, o consumidor moderno busca:

- 🌱 Sustentabilidade
- 🧶 Produção artesanal
- ✨ Exclusividade
- 💛 Valorização do trabalho manual

Tops, saídas de praia, tapetes e peças decorativas ganharam enorme destaque justamente por carregarem autenticidade.
      `,
      categoryId: modaPraia.id,
      seo: {
        metaTitle:
          'Moda artesanal em crochê: por que essa tendência está em alta',
        metaDesc:
          'Saiba por que o crochê voltou com força total na moda artesanal e se tornou símbolo de exclusividade e autenticidade.',
        keywords:
          'moda artesanal, crochê tendência, handmade brasileiro, peças em crochê, decoração artesanal',
      },
    },

    // 9. Cuidados com o crochê
    {
      title: 'Como Cuidar das Peças de Crochê e Aumentar a Durabilidade',
      slug: 'como-cuidar-das-pecas-de-croche',
      excerpt:
        'Dicas simples para lavar, secar e guardar peças de crochê artesanal e preservar a beleza por muito mais tempo.',
      content: `
## Como cuidar das peças de crochê e aumentar a durabilidade

Peças de crochê artesanal merecem cuidados especiais para preservar a beleza e o acabamento.

Algumas dicas importantes:

- 🧼 Lavar manualmente
- ☀️ Secar à sombra
- 🧺 Evitar torcer
- 🧶 Guardar em local seco

Produtos artesanais feitos com fios de qualidade possuem ótima durabilidade, especialmente quando recebem manutenção adequada.

Esses cuidados ajudam a conservar:

- Tops de crochê
- Saídas de praia
- Tapetes
- Jogos de banheiro
- Souplats
      `,
      categoryId: cuidadosCroche.id,
      seo: {
        metaTitle:
          'Como cuidar de peças de crochê: guia para conservar seu artesanato',
        metaDesc:
          'Confira dicas simples para lavar, secar e guardar peças de crochê artesanal e aumentar a durabilidade.',
        keywords:
          'como cuidar de crochê, lavar peças de crochê, conservação de crochê, crochê artesanal cuidados',
      },
    },

    // 10. Presentes artesanais em crochê
    {
      title: 'Presentes Artesanais em Crochê: Delicadeza Que Encanta',
      slug: 'presentes-artesanais-em-croche',
      excerpt:
        'Ideias criativas de presentes em crochê para quem valoriza produtos únicos, feitos à mão e cheios de carinho.',
      content: `
## Presentes artesanais em crochê: delicadeza que encanta

Dar um presente artesanal é oferecer algo muito mais especial e cheio de significado.

As peças de crochê encantam pela delicadeza, exclusividade e acabamento feito à mão.

Entre os presentes mais procurados estão:

- 🎁 Kits de souplat
- 🧶 Tapetes decorativos
- 🌴 Saídas de praia
- 💚 Tops de crochê
- 🛁 Jogos de banheiro

Além da beleza, os produtos artesanais carregam personalidade e tornam qualquer ocasião ainda mais especial.
      `,
      categoryId: decoracaoCasa.id,
      seo: {
        metaTitle:
          'Presentes artesanais em crochê: ideias criativas e delicadas',
        metaDesc:
          'Veja ideias de presentes em crochê artesanal para surpreender com exclusividade, beleza e carinho.',
        keywords:
          'presente artesanal, crochê para presente, produtos em crochê, decoração artesanal, moda artesanal feminina',
      },
    },
  ]

  for (const p of posts) {
    await prisma.post.create({
      data: {
        title: p.title,
        slug: p.slug,
        excerpt: p.excerpt,
        content: p.content,
        categoryId: p.categoryId,
        published: true,
        seo: {
          create: p.seo,
        },
      },
    })
  }

  console.log('🎉 Blog GeicyCroche com artigos e SEO pronto!')
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })