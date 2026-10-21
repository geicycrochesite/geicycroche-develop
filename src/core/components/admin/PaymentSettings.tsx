'use client'
import { useCallback, useEffect, useState } from 'react'

type Statement = { id: string; start: string; end: string; salesCents: number; refundCents: number; feesCents: number; adjustments: number; dueCents: number }
type Data = { provider: string; connected: boolean; account: { userId: string; label: string; confirmed: boolean } | null;
  oauthReady: boolean; checkoutReady: boolean; environment: string; pendingEvents: number; statements: Statement[];
  entries: { key: string; orderId: string; kind: string; cents: number }[] }
const brl = (cents: number) => (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const buttonClass = 'border rounded-xl px-4 py-3 disabled:opacity-50'
export default function PaymentSettings() {
  const [data, setData] = useState<Data>(), [error, setError] = useState(''), [busy, setBusy] = useState(false)
  const load = useCallback(async () => {
    const response = await fetch('/api/mercado-pago/settings', { cache: 'no-store' })
    if (!response.ok) throw new Error('Não foi possível carregar as configurações.')
    setData(await response.json())
  }, [])
  useEffect(() => { void load().catch(e => setError(e.message)) }, [load])
  async function change(path: string, body: unknown) {
    setBusy(true); setError('')
    try {
      const response = await fetch('/api/mercado-pago/' + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (!response.ok) throw new Error('Não foi possível salvar. Confira a conta e a configuração da integração.')
      await load()
    } catch (e) { setError((e as Error).message) } finally { setBusy(false) }
  }
  return <div className="space-y-6 max-w-3xl">
    {error && <p role="alert">{error}</p>}
    {!data ? <p>Carregando configurações…</p> : <>
      <section className="border rounded-2xl p-5 space-y-3">
        <h2 className="text-xl font-semibold">Mercado Pago</h2>
        <p>{data.connected ? 'Conta Mercado Pago conectada' : 'Conta Mercado Pago desconectada'} · Ambiente: {data.environment}</p>
        {data.account && <p>{data.account.label} · ID {data.account.userId}</p>}
        {data.connected ? <div className="flex gap-4 flex-wrap">
          <form method="post" action="/api/mercado-pago/oauth/start"><button className={buttonClass} disabled={!data.oauthReady}>Reconectar Mercado Pago</button></form>
          <form method="post" action="/api/mercado-pago/oauth/disconnect"><button className={buttonClass}>Desconectar conta Mercado Pago</button></form>
        </div> : <form method="post" action="/api/mercado-pago/oauth/start"><button className={buttonClass} disabled={!data.oauthReady}>Conectar Mercado Pago</button></form>}
        {!data.oauthReady && <p>A conexão ainda está sendo preparada pela UpNode.</p>}
        {data.connected && data.account && (data.account.confirmed ? <p>Conta recebedora confirmada.</p> : <button className={buttonClass} disabled={busy} onClick={() => change('oauth/confirm', { userId: data.account!.userId })}>Confirmar esta conta como recebedora</button>)}
        <p>Desconectar interrompe novos pagamentos. Para processar eventos de pedidos antigos, reconecte a conta original. A troca de conta não altera os vínculos históricos.</p>
      </section>
      <section className="border rounded-2xl p-5 space-y-3"><h2>Provedor para novos pedidos</h2><p>Ativo: {data.provider === 'mercado_pago' ? 'Mercado Pago' : 'Asaas'}. Pedidos existentes mantêm seu provedor.</p><button className={buttonClass} disabled={busy || !data.checkoutReady || !data.account?.confirmed} onClick={() => change('settings', { provider: 'mercado_pago' })}>Usar Mercado Pago</button><button className={buttonClass} disabled={busy} onClick={() => change('settings', { provider: 'asaas' })}>Usar Asaas</button></section>
      <section className="border rounded-2xl p-5 space-y-3 overflow-x-auto">
        <h2 className="text-xl font-semibold">Comissões UpNode</h2>
        <p>R$ 1,00 por pedido Mercado Pago efetivamente pago. Cobrança semanal desativada durante a homologação.</p>
        <p>Eventos aguardando recuperação: {data.pendingEvents}</p>
        <table className="w-full text-left [&_th]:px-3 [&_td]:px-3 [&_th]:py-2 [&_td]:py-2"><thead><tr><th>Semana</th><th>Vendas</th><th>Estornos</th><th>Comissões</th><th>Ajustes</th><th>Devido</th></tr></thead>
          <tbody>{data.statements.map(s => <tr key={s.id}><td>{new Date(s.start).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</td><td>{brl(s.salesCents)}</td><td>{brl(s.refundCents)}</td><td>{brl(s.feesCents)}</td><td>{brl(s.adjustments)}</td><td>{brl(s.dueCents)}</td></tr>)}</tbody></table>
        {!data.statements.length && <p>Nenhuma semana encerrada.</p>}
        <h3>Lançamentos recentes</h3>
        <ul>{data.entries.map(e => <li key={e.key}>{e.orderId} · {e.kind === 'commission' ? 'Comissão' : e.kind === 'credit' ? 'Crédito' : 'Estorno'} · {brl(e.cents)}</li>)}</ul>
      </section>
    </>}
  </div>
}
