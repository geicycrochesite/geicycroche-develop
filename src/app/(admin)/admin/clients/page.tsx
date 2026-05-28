// app/(admin)/admin/clients/page.tsx
'use client'

import { useState, FormEvent } from 'react'

export default function AdminClientsPage() {
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setStatus(null)
    setIsSubmitting(true)

    const formData = new FormData(event.currentTarget)
    const payload = {
      name: String(formData.get('name') || '').trim(),
      email: String(formData.get('email') || '').trim(),
      cpf: String(formData.get('cpf') || '').trim(),
      birthDate: String(formData.get('birthDate') || '').trim(),
      phone: String(formData.get('phone') || '').trim(),
    }

    if (!payload.name || !payload.email || !payload.cpf || !payload.birthDate) {
      setError('Nome, email, CPF e data de nascimento são obrigatórios.')
      setIsSubmitting(false)
      return
    }

    try {
      const response = await fetch('/api/asaas/create-customer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const body = await response.json().catch(() => null)
        setError(body?.details?.join(' | ') || body?.error || 'Erro ao criar cliente')
        return
      }

      setStatus('Cliente criado com sucesso e vinculado ao Asaas.')
      event.currentTarget.reset()
    } catch (err) {
      setError('Erro de conexão ao criar cliente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Cadastro de Clientes</h1>
        <p className="text-sm text-slate-500">Crie um cliente e vincule a conta no Asaas automaticamente.</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium text-slate-700">
            Nome
            <input
              name="name"
              type="text"
              autoComplete="name"
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
              required
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Email
            <input
              name="email"
              type="email"
              autoComplete="email"
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
              required
            />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium text-slate-700">
            CPF
            <input
              name="cpf"
              type="text"
              autoComplete="off"
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
              required
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Data de nascimento
            <input
              name="birthDate"
              type="date"
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
              required
            />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium text-slate-700">
            Telefone
            <input
              name="phone"
              type="tel"
              autoComplete="tel"
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
            />
          </label>
        </div>

        <div className="flex flex-col gap-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isSubmitting ? 'Enviando...' : 'Criar cliente'}
          </button>

          {status ? <p className="text-sm text-emerald-600">{status}</p> : null}
          {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        </div>
      </form>
    </div>
  )
}