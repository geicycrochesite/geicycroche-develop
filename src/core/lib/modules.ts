import { siteConfig } from '@/client/config/site.config'
const storeEnabled = (siteConfig as { store?: { enabled: boolean } }).store?.enabled !== false
export const isModuleEnabled = (module: string) => !['store','checkout'].includes(module) || storeEnabled
export function isRouteEnabled(path: string, method = 'GET') {
  if (storeEnabled) return true
  const commercial = ['/loja','/carrinho','/checkout','/pedido','/minha-conta','/api/products','/api/categorias','/api/orders','/api/frete','/api/asaas','/api/mercado-pago','/api/clients']
  if (commercial.some(p => path === p || path.startsWith(p + '/'))) return false
  if (['/api/admin/products','/api/admin/orders'].some(p => path === p || path.startsWith(p + '/'))) return ['GET','HEAD','OPTIONS'].includes(method.toUpperCase())
  return true
}
export const isPublicLinkEnabled = (path: string) => isRouteEnabled(path) && (storeEnabled || !['/admin/products','/admin/pedidos','/admin/clients','/admin/configuracoes/pagamentos'].some(p => path === p || path.startsWith(p + '/')))
