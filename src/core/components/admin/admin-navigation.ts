import { BookOpen, CreditCard, FileText, Home, LayoutGrid, Package, ShoppingBag, Tags, Ticket } from 'lucide-react'
import { isPublicLinkEnabled, isModuleEnabled } from '@/core/lib/modules'

// Both layouts use the same destinations and existing module visibility rules.
export const adminPrimaryLinks = [
  { href: '/admin', label: 'Início', icon: Home },
  { href: '/admin/pedidos', label: 'Pedidos', icon: ShoppingBag },
  { href: '/admin/products', label: 'Produtos', icon: Package },
].filter(link => isPublicLinkEnabled(link.href) && (link.href === '/admin' || isModuleEnabled('store')))

export const adminSecondaryGroups = [
  { label: 'Conteúdo', links: [
    { href: '/admin/blog/posts', label: 'Posts do blog', icon: BookOpen },
    { href: '/admin/blog/categories', label: 'Categorias do blog', icon: Tags },
    { href: '/admin/custom-page', label: 'Páginas personalizadas', icon: FileText },
  ] },
  { label: 'Ferramentas', links: [
    { href: '/admin/etiquetas', label: 'Etiquetas Shopee', icon: Ticket },
  ] },
  { label: 'Configurações', links: [
    { href: '/admin/configuracoes/pagamentos', label: 'Pagamentos', icon: CreditCard },
    { href: '/admin/clients', label: 'Clientes Asaas', icon: CreditCard },
  ] },
].map(group => ({ ...group, links: group.links.filter(link => isPublicLinkEnabled(link.href) && (!['/admin/configuracoes/pagamentos', '/admin/clients'].includes(link.href) || isModuleEnabled('checkout'))) }))
  .filter(group => group.links.length)

export function isAdminLinkActive(pathname: string, href: string) {
  return pathname === href || (href !== '/admin' && pathname.startsWith(href + '/'))
}

export const AdminMoreIcon = LayoutGrid
