const crypto = require('crypto')
const fs = require('fs')
const path = require('path')

function gerarSlug(nome) {
  return nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '')
    .replace(/[^a-z0-9]/g, '')
}

function gerarSecret() {
  return crypto.randomBytes(32).toString('hex')
}

function gerarEnv({ nome, dominio }) {
  const storeId = gerarSlug(nome)

  return `
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_UPLOAD_PRESET="ml_default"
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CLOUDINARY_URL=

DATABASE_URL=
POSTGRES_URL=
PRISMA_DATABASE_URL=

AUTH_JWT_SECRET="${gerarSecret()}"
SETUP_ADMIN_KEY="${gerarSecret()}"

MELHOR_ENVIO_TOKEN=

ASAAS_API_KEY=
ASAAS_WALLET_ID=

NEXT_PUBLIC_SITE_URL="https://${dominio}"
NEXT_PUBLIC_STORE_ID="${storeId}"
`.trim()
}

// ===== INPUT =====
const nome = process.argv[2]
const dominio = process.argv[3]

if (!nome || !dominio) {
  console.log('\n❌ Uso:')
  console.log('node scripts/novo-cliente.js "Nome da Loja" dominio.com\n')
  process.exit(1)
}

const storeId = gerarSlug(nome)
const env = gerarEnv({ nome, dominio })

const caminhoEnv = path.join(process.cwd(), '.env')

fs.writeFileSync(caminhoEnv, env + '\n', 'utf8')

console.log('\n🚀 CLIENTE GERADO:\n')
console.log('📛 Nome:', nome)
console.log('🆔 STORE_ID:', storeId)
console.log('🌐 Domínio:', dominio)
console.log('\n📄 Arquivo criado:')
console.log(caminhoEnv)

console.log('\n🔐 Conteúdo do .env:')
console.log('-------------------------')
console.log(env)
console.log('-------------------------')