// Starts a disposable localhost PostgreSQL. Never reads project .env credentials.
import EmbeddedPostgres from 'embedded-postgres'
import { randomBytes } from 'node:crypto'
import path from 'node:path'
import fs from 'node:fs'
import { spawn, execFileSync } from 'node:child_process'
import net from 'node:net'
const root = process.cwd(), name = 'upnode_mp_' + randomBytes(6).toString('hex')
const directory = path.resolve(root, '.mp-validation', name)
if (!directory.startsWith(path.resolve(root, '.mp-validation') + path.sep)) throw Error('Unsafe test path')
fs.mkdirSync(directory, { recursive: true })
const listener = net.createServer()
await new Promise(resolve => listener.listen(0, '127.0.0.1', resolve))
const port = listener.address().port, password = randomBytes(24).toString('hex')
await new Promise(resolve => listener.close(resolve))
const pg = new EmbeddedPostgres({ databaseDir: path.join(directory, 'data'), user: 'postgres', password, port, persistent: true,
  initdbFlags: ['--encoding=UTF8'], postgresFlags: ['-h', '127.0.0.1'], onLog(message) { fs.appendFileSync(path.join(directory, 'postgres.log'), String(message)) }, onError() {} })
function run(args, env, cwd = root) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, { cwd, env, stdio: 'inherit', windowsHide: true })
    child.on('error', reject); child.on('exit', code => code === 0 ? resolve() : reject(Error('Test command failed: ' + code)))
  })
}
const env = { ...process.env, MP_TEST_PRODUCTION: process.argv.includes('--dev-server') ? 'false' : 'true', DATABASE_URL: `postgresql://postgres:${password}@127.0.0.1:${port}/${name}`, UPNODE_MP_ISOLATED_TEST: 'yes',
  MP_TOKEN_ENCRYPTION_KEY: randomBytes(32).toString('base64'), MP_CLIENT_ID: '12345', MP_CLIENT_SECRET: 'synthetic-secret', MP_BASE_URL: 'http://localhost:3222',
  MP_INSTANCE_ID: 'synthetic-dev', MP_ENVIRONMENT: 'test', MP_TEST_SELLER_IDS: '123,456', MP_PAYMENTS_ENABLED: 'true', MP_PUBLIC_KEY: 'synthetic-public-key', MP_WEBHOOK_SECRET: 'synthetic-webhook', MP_WEBHOOK_CONFIGURED: 'true',
  AUTH_JWT_SECRET: 'synthetic-test-secret-with-more-than-thirty-two-characters', NEXT_PUBLIC_SITE_URL: 'http://localhost:3222', NEXT_TELEMETRY_DISABLED: '1' }
env.POSTGRES_URL = env.DATABASE_URL
env.PRISMA_DATABASE_URL = env.DATABASE_URL
env.MERCADO_PAGO_ACCESS_TOKEN = 'synthetic-disabled'
env.ASAAS_API_KEY = 'synthetic-disabled'
env.ASAAS_WEBHOOK_TOKEN = 'synthetic-disabled'
env.MELHOR_ENVIO_TOKEN = 'synthetic-disabled'
let failed = false
try {
  await pg.initialise(); await pg.start(); await pg.createDatabase(name)
  console.log('PostgreSQL local descartável iniciado; sem banco externo.')
  await run(['node_modules/prisma/build/index.js', 'migrate', 'deploy'], env)
  if (process.argv.includes('--browser')) {
    await run(['--conditions=react-server', '--import', 'tsx', 'scripts/seed-mp-test.ts'], env)
    // Reuse only ignored local build artifacts; PostgreSQL and all fixtures remain fresh.
    const previousApps = fs.readdirSync(path.resolve(root, '.mp-validation'), { withFileTypes: true })
      .filter(entry => entry.isDirectory() && entry.name.startsWith('upnode_mp_'))
      .map(entry => path.resolve(root, '.mp-validation', entry.name, 'app'))
      .filter(candidate => fs.existsSync(candidate))
      .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs)
    const target = previousApps[0] ?? path.join(directory, 'app')
    fs.mkdirSync(target, { recursive: true })
    const appFiles = ['src', 'public', 'package.json', 'tsconfig.json', 'next.config.ts', 'postcss.config.mjs']
    if (process.argv.includes('--index')) {
      // Verify the reviewed index without incorporating unrelated working-tree changes.
      const git = args => execFileSync('git', ['-c', 'safe.directory=' + root.replaceAll('\\', '/'), ...args], { cwd: root, maxBuffer: 200 * 1024 * 1024 })
      const tree = git(['write-tree']).toString().trim()
      for (const folder of ['src', 'public']) {
        const copy = path.resolve(target, folder)
        if (!copy.startsWith(path.resolve(root, '.mp-validation') + path.sep) || (fs.existsSync(copy) && fs.lstatSync(copy).isSymbolicLink())) throw Error('Unsafe source copy')
        fs.rmSync(copy, { recursive: true, force: true })
      }
      execFileSync('tar', ['-xf', '-', '-C', target], { input: git(['archive', '--format=tar', tree, ...appFiles]) })
      console.log('Build local utiliza somente os arquivos revisados no índice Git.')
    } else for (const file of appFiles) fs.cpSync(path.join(root, file), path.join(target, file), { recursive: true })
    if (!fs.existsSync(path.join(target, 'node_modules'))) fs.symlinkSync(path.join(root, 'node_modules'), path.join(target, 'node_modules'), 'junction')
    const client = path.join(target, 'src/core/lib/mp/client.ts')
    fs.writeFileSync(client, "import { mpTestFetch } from './test-fetch'\n" + fs.readFileSync(client, 'utf8').replace('const response = await fetch(', 'const response = await mpTestFetch('))
    fs.copyFileSync(path.join(root, 'tests/fixtures/mp-fetch.ts'), path.join(target, 'src/core/lib/mp/test-fetch.ts'))
    const checkout = path.join(target, 'src/app/api/orders/route.ts')
    fs.writeFileSync(checkout, fs.readFileSync(checkout, 'utf8').replace('} catch (error) {', "} catch (error) { console.error('Isolated checkout failure:', error instanceof Error ? error.name + ': ' + error.message : 'unknown');"))
    if (env.MP_TEST_PRODUCTION === 'true') {
      const buildPath = path.resolve(target, '.next')
      if (!buildPath.startsWith(path.resolve(root, '.mp-validation') + path.sep)) throw Error('Unsafe build path')
      if (fs.existsSync(buildPath)) {
        if (fs.lstatSync(buildPath).isSymbolicLink()) throw Error('Unexpected build symlink')
        fs.rmSync(buildPath, { recursive: true, force: true })
      }
      const nextConfig = path.join(target, 'next.config.ts')
      fs.writeFileSync(nextConfig, fs.readFileSync(nextConfig, 'utf8').replace('export default nextConfig', 'nextConfig.experimental = { ...nextConfig.experimental, cpus: 2 };\nexport default nextConfig'))
      await run([path.join(root, 'node_modules/next/dist/bin/next'), 'build', target, '--webpack'], { ...env, NODE_ENV: 'production' }, target)
    }
    await run(['node_modules/@playwright/test/cli.js', 'test', '--config', 'playwright.mp.config.ts', ...(process.argv.includes('--checkout') ? ['checkout.spec.ts'] : process.argv.includes('--navigation') ? ['admin-navigation.spec.ts', ...(process.argv.includes('--routes') ? ['--grep', 'todas as rotas'] : [])] : [])], { ...env, MP_TEST_APP_DIR: target, PLAYWRIGHT_BROWSERS_PATH: process.env.PLAYWRIGHT_BROWSERS_PATH ?? path.join(root, '.playwright-browsers') })
  } else await run(['--conditions=react-server', '--import', 'tsx', '--test', 'tests/mp-db.test.ts'], env)
} catch (error) { failed = true; console.error(error?.message ?? 'PostgreSQL não iniciou; confira postgres.log na pasta descartável.'); process.exitCode = 1 }
finally {
  let timer
  await Promise.race([pg.stop().catch(() => {}), new Promise(resolve => { timer = setTimeout(resolve, 5000) })])
  clearTimeout(timer)
  console.log('PostgreSQL de teste encerrado. Dados somente na pasta ignorada .mp-validation.')
  if (failed) process.exitCode = 1
}

process.exit(failed ? 1 : 0)
