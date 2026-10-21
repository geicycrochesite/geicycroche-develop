'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function LogoutButton({ onLoggedOut }: { onLoggedOut?: () => void }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleLogout = async () => {
    setLoading(true)

    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (response.ok) {
        onLoggedOut?.()
        router.push('/admin/login')
      } else {
        alert('Erro ao fazer logout. Tente novamente.')
      }
    } catch {
      alert('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      type="button"
      className="mt-2 flex min-h-12 min-w-11 w-full items-center rounded-xl border border-white/25 px-3 py-3 text-left text-white hover:bg-[var(--color-bg-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:opacity-50"
    >
      {loading ? 'Saindo...' : 'Sair'}
    </button>
  )
}
