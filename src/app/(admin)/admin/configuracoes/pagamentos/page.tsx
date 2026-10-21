import { requireModule } from '@/core/lib/module-server'
import { requireAdminPage } from '@/core/lib/admin-access'
import PaymentSettings from '@/core/components/admin/PaymentSettings'
export const dynamic = 'force-dynamic'
export default async function PaymentsPage() {
  await requireAdminPage()
  requireModule('checkout')
  return <div style={{ color: 'var(--color-admin-text)' }}><h1 className="text-2xl font-bold mb-6">Configurações → Pagamentos</h1><PaymentSettings /></div>
}
