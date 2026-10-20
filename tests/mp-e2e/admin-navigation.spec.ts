import { test, expect, type Page } from '@playwright/test'
import pg from 'pg'
import jwt from 'jsonwebtoken'

test.describe.configure({ timeout: 300000 })
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const routes = [
  '/admin', '/admin/pedidos', '/admin/pedidos/navigation-order',
  '/admin/products', '/admin/products/new', '/admin/products/synthetic-product/edit',
  '/admin/blog/posts', '/admin/blog/posts/new', '/admin/blog/posts/navigation-post/edit',
  '/admin/blog/categories', '/admin/blog/categories/new', '/admin/blog/categories/navigation-category/edit',
  '/admin/custom-page', '/admin/custom-page/navigation-page', '/admin/etiquetas', '/admin/configuracoes/pagamentos',
]

test.beforeAll(async () => {
  if (process.env.UPNODE_MP_ISOLATED_TEST !== 'yes' || !new URL(process.env.DATABASE_URL!).pathname.startsWith('/upnode_mp_')) throw Error('Isolated database required')
  await pool.query(`INSERT INTO "Order" (id,"fullName",email,cpf,phone,address,frete,total,"statusPagamento") VALUES ('navigation-order','Pessoa Sintética','nav@example.invalid','00000000000','11999999999','{}',0,10,'pending') ON CONFLICT (id) DO NOTHING`)
  await pool.query(`INSERT INTO "BlogCategory" (id,name,slug,"updatedAt") VALUES ('navigation-category','Categoria de teste','navigation-category',now()) ON CONFLICT (id) DO NOTHING`)
  await pool.query(`INSERT INTO "Post" (id,title,slug,content,"updatedAt") VALUES ('navigation-post','Post de teste','navigation-post','Conteúdo sintético',now()) ON CONFLICT (id) DO NOTHING`)
  await pool.query(`INSERT INTO "CustomPage" (id,slug,title,"updatedAt") VALUES ('navigation-page','navigation-page','Página de teste',now()) ON CONFLICT (id) DO NOTHING`)
})
test.afterAll(() => pool.end())

async function login(page: Page) {
  const response = await page.request.post('/api/auth/login', { data: { email: 'admin@synthetic.invalid', password: 'synthetic-test-password' } })
  expect(response.status()).toBe(200)
}
async function noOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
}

test('todas as rotas existentes continuam acessíveis com autenticação no servidor', async ({ page, browser }) => {
  // Sixteen cold Next dev compilations are not a navigation performance benchmark.
  test.setTimeout(1200000)
  await login(page)
  await page.setViewportSize({ width: 390, height: 844 })
  for (const path of routes) {
    const response = await page.goto(path)
    expect(response?.status(), path).toBe(200)
    await expect(page.locator('main#admin-content')).toBeVisible()
    await expect(page.getByRole('navigation', { name: 'Navegação administrativa mobile' })).toBeVisible()
    await noOverflow(page)
  }
  const anonymous = await browser.newContext()
  for (const path of ['/admin', '/admin/products/new', '/admin/pedidos/navigation-order']) {
    const response = await anonymous.request.get(path, { maxRedirects: 0 })
    expect(response.status()).toBe(307)
    expect(response.headers().location).toContain('/admin/login')
  }
  expect((await anonymous.request.get('/api/admin/orders')).status()).toBe(401)
  for (const [role, expiresIn] of [['admin', -1], ['buyer', 3600]] as const) {
    const token = jwt.sign({ id: 'synthetic-admin', email: 'admin@synthetic.invalid', role }, process.env.AUTH_JWT_SECRET!, { expiresIn })
    expect((await anonymous.request.get('/api/admin/orders', { headers: { cookie: 'auth_token=' + token } })).status()).not.toBe(200)
  }
  await anonymous.close()
})

for (const width of [320, 390, 768, 1280]) {
  test(`navegação responsiva, ativa e acessível em ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 })
    await login(page)
    await page.goto('/admin')
    await expect(page.locator('meta[name="viewport"]')).toHaveAttribute('content', /viewport-fit=cover/)
    const mobile = width < 1024
    const nav = page.getByRole('navigation', { name: mobile ? 'Navegação administrativa mobile' : 'Navegação administrativa desktop' })
    await expect(nav).toBeVisible()
    await expect(nav.getByRole('link', { name: 'Início', exact: true })).toHaveAttribute('aria-current', 'page')
    const create = page.getByRole('link', { name: 'Cadastrar produto', exact: true })
    await expect(create).toBeInViewport()
    await expect(create).toHaveAttribute('href', '/admin/products/new')
    await noOverflow(page)
    await nav.getByRole('link', { name: 'Pedidos', exact: true }).click()
    await expect(page).toHaveURL(/\/admin\/pedidos$/)
    await expect(nav.getByRole('link', { name: 'Pedidos', exact: true })).toHaveAttribute('aria-current', 'page')
    await nav.getByRole('link', { name: 'Produtos', exact: true }).click()
    await expect(page.getByRole('link', { name: 'Cadastrar produto', exact: true })).toBeInViewport()
    await page.getByRole('link', { name: 'Cadastrar produto', exact: true }).click()
    await expect(page).toHaveURL(/\/admin\/products\/new$/)
    await expect(nav.getByRole('link', { name: 'Produtos', exact: true })).toHaveAttribute('aria-current', 'page')
    await noOverflow(page)

    if (mobile) {
      const more = nav.getByRole('button', { name: 'Mais', exact: true })
      await more.click()
      const dialog = page.getByRole('dialog', { name: 'Mais opções', exact: true })
      await expect(dialog).toBeVisible()
      await expect(more).toHaveAttribute('aria-expanded', 'true')
      for (const name of ['Conteúdo', 'Ferramentas', 'Configurações']) await expect(dialog.getByRole('heading', { name, exact: true })).toBeVisible()
      for (const name of ['Posts do blog', 'Categorias do blog', 'Páginas personalizadas', 'Etiquetas Shopee', 'Pagamentos', 'Ver loja', 'Ver site']) await expect(dialog.getByRole('link', { name, exact: true })).toBeVisible()
      await expect(dialog.getByRole('button', { name: 'Sair', exact: true })).toBeVisible()
      await page.keyboard.press('Shift+Tab')
      expect(await dialog.evaluate(d => d.contains(document.activeElement))).toBe(true)
      await page.keyboard.press('Tab')
      await expect(dialog.getByRole('button', { name: 'Fechar menu Mais' })).toBeFocused()
      await page.keyboard.press('Escape')
      await expect(dialog).not.toBeVisible()
      await expect(more).toBeFocused()
      await expect(more).toHaveAttribute('aria-expanded', 'false')
      const targets = await nav.locator('a,button').evaluateAll(elements => elements.map(e => ({ width: e.getBoundingClientRect().width, height: e.getBoundingClientRect().height })))
      expect(targets).toHaveLength(4)
      for (const target of targets) { expect(target.width).toBeGreaterThanOrEqual(44); expect(target.height).toBeGreaterThanOrEqual(44) }
      await more.click()
      await dialog.getByRole('link', { name: 'Pagamentos', exact: true }).click()
      await expect(page).toHaveURL(/\/admin\/configuracoes\/pagamentos$/)
      await expect(dialog).not.toBeVisible()
      await expect(more).toHaveAttribute('data-active', 'true')
      await more.click()
      await expect(dialog.getByRole('link', { name: 'Pagamentos', exact: true })).toHaveAttribute('aria-current', 'page')
      await page.getByRole('button', { name: 'Fechar menu Mais' }).click()
    } else {
      await expect(page.getByRole('navigation', { name: 'Navegação administrativa mobile' })).not.toBeVisible()
      await nav.getByRole('link', { name: 'Pagamentos', exact: true }).click()
      await expect(nav.getByRole('link', { name: 'Pagamentos', exact: true })).toHaveAttribute('aria-current', 'page')
    }
    await noOverflow(page)
    await page.screenshot({ path: `.mp-validation/admin-nav-${width}.png`, fullPage: true })
  })
}

test('login/setup fora do shell; teclado virtual não fica coberto; logout real', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  for (const path of ['/admin/login', '/admin/setup-admin']) {
    await page.goto(path)
    await expect(page.getByRole('navigation')).toHaveCount(0)
  }
  await login(page)
  await page.goto('/admin/products/new')
  await page.getByLabel('Nome', { exact: true }).focus()
  await page.evaluate(() => {
    Object.defineProperty(window.visualViewport!, 'height', { configurable: true, value: 400 })
    window.visualViewport!.dispatchEvent(new Event('resize'))
  })
  const nav = page.getByRole('navigation', { name: 'Navegação administrativa mobile' })
  await expect(nav).not.toBeVisible()
  await page.evaluate(() => {
    Object.defineProperty(window.visualViewport!, 'height', { configurable: true, value: 844 })
    window.visualViewport!.dispatchEvent(new Event('resize'))
  })
  await expect(nav).toBeVisible()
  await nav.getByRole('button', { name: 'Mais', exact: true }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Sair', exact: true }).click()
  await expect(page).toHaveURL(/\/admin\/login$/)
  await expect(page.getByRole('navigation')).toHaveCount(0)
  expect((await page.request.get('/api/admin/orders')).status()).toBe(401)
  await login(page)
  await page.goto('/admin')
  await expect(page.getByRole('button', { name: 'Mais', exact: true })).toHaveAttribute('aria-expanded', 'false')
})
