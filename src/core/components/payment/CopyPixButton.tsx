'use client'

import { useState } from 'react'
import { Check, Copy } from 'lucide-react'

export default function CopyPixButton({ code }: { code: string | null | undefined }) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [error, setError] = useState('')

  async function copy() {
    if (!code) return
    setError('')
    setCopiedCode(null)
    try {
      try {
        if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable')
        await navigator.clipboard.writeText(code)
      } catch {
        const field = document.createElement('textarea')
        const previousFocus = document.activeElement
        field.value = code
        field.readOnly = true
        field.style.cssText = 'position:fixed;top:0;left:0;opacity:0;font-size:16px;'
        document.body.appendChild(field)
        try {
          field.focus()
          field.select()
          field.setSelectionRange(0, code.length)
          if (!document.execCommand('copy')) throw new Error('Copy failed')
        } finally {
          field.remove()
          if (previousFocus instanceof HTMLElement) previousFocus.focus()
        }
      }
      setCopiedCode(code)
    } catch {
      setError('Não foi possível copiar automaticamente. Selecione o código PIX acima e copie manualmente.')
    }
  }

  const copied = !!code && copiedCode === code
  return <div className="space-y-2">
    <button type="button" disabled={!code} onClick={() => { void copy() }}
      className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/30 bg-[var(--color-accent)] px-5 py-3 font-semibold text-white transition hover:brightness-125 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-50">
      {copied ? <Check aria-hidden="true" className="h-5 w-5" /> : <Copy aria-hidden="true" className="h-5 w-5" />}
      {copied ? 'PIX copiado!' : 'Copiar PIX'}
    </button>
    <span role="status" className="sr-only">{copied ? 'Código PIX copiado para a área de transferência.' : ''}</span>
    {error && <p role="alert" className="text-sm text-white">{error}</p>}
  </div>
}
