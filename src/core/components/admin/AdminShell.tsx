'use client'

import { siteConfig } from '@/client/config/site.config'
import type { ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ExternalLink, Store, X } from 'lucide-react'
import { isPublicLinkEnabled } from '@/core/lib/modules'
import { adminPrimaryLinks, adminSecondaryGroups, AdminMoreIcon, isAdminLinkActive } from './admin-navigation'
import AdminBackButton from './AdminBackButton'
import { LogoutButton } from './LogoutButton'
import styles from './AdminShell.module.css'

export default function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? '/admin'
  const dialog = useRef<HTMLDialogElement>(null)
  const moreButton = useRef<HTMLButtonElement>(null)
  const [moreOpen, setMoreOpen] = useState(false)
  const [keyboardOpen, setKeyboardOpen] = useState(false)
  const authPage = pathname === '/admin/login' || pathname === '/admin/setup-admin'
  const secondaryActive = !adminPrimaryLinks.some(link => isAdminLinkActive(pathname, link.href))

  function closeMore() { dialog.current?.close() }

  useEffect(() => {
    // Closing on navigation also handles browser back/forward within the menu.
    dialog.current?.close()
  }, [pathname])

  useEffect(() => {
    const viewport = window.visualViewport
    const desktop = window.matchMedia('(min-width: 1024px)')
    let baselineHeight = window.innerHeight
    let baselineWidth = window.innerWidth
    function update() {
      const editing = document.activeElement?.matches('input:not([type="checkbox"]):not([type="radio"]), textarea, [contenteditable="true"]')
      if (window.innerWidth !== baselineWidth) {
        baselineWidth = window.innerWidth
        baselineHeight = window.innerHeight
      }
      baselineHeight = Math.max(baselineHeight, window.innerHeight)
      setKeyboardOpen(!!editing && !!viewport && baselineHeight - viewport.height > 120)
      if (desktop.matches) dialog.current?.close()
    }
    viewport?.addEventListener('resize', update)
    desktop.addEventListener('change', update)
    document.addEventListener('focusin', update)
    document.addEventListener('focusout', update)
    return () => {
      viewport?.removeEventListener('resize', update)
      desktop.removeEventListener('change', update)
      document.removeEventListener('focusin', update)
      document.removeEventListener('focusout', update)
    }
  }, [])

  function secondaryLinks() {
    return <>
      {adminSecondaryGroups.map(group => <section className={styles.group} key={group.label} aria-label={group.label}>
        <h3 className={styles.groupTitle}>{group.label}</h3>
        {group.links.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className={styles.link}
          aria-current={isAdminLinkActive(pathname, href) ? 'page' : undefined} onClick={closeMore}>
          <Icon aria-hidden="true" /><span>{label}</span>
        </Link>)}
      </section>)}
      <div className={styles.utility}>
        {isPublicLinkEnabled('/loja') && <Link href="/loja" className={styles.link} onClick={closeMore}><Store aria-hidden="true" />Ver loja</Link>}
        <Link href="/" className={styles.link} onClick={closeMore}><ExternalLink aria-hidden="true" />Ver site</Link>
        <LogoutButton onLoggedOut={closeMore} />
      </div>
    </>
  }

  if (authPage) return <main id="admin-content" className="min-h-dvh px-4 py-8">{children}</main>

  return <div className={`${styles.shell} ${keyboardOpen ? styles.keyboardOpen : ''}`}>
    <a className={styles.skip} href="#admin-content">Ir para o conteúdo</a>
    <aside className={styles.sidebar} aria-label="Menu lateral">
      <div className={styles.brand}>{siteConfig.nome}<small>Painel da loja</small></div>
      <nav aria-label="Navegação administrativa desktop">
        {adminPrimaryLinks.map(({ href, label, icon: Icon }) => <Link href={href} key={href} className={styles.link}
          aria-current={isAdminLinkActive(pathname, href) ? 'page' : undefined}><Icon aria-hidden="true" />{label}</Link>)}
        {secondaryLinks()}
      </nav>
    </aside>
    <header className={styles.header}><div className={styles.brand}>{siteConfig.nome}<small>Painel da loja</small></div><span className="text-sm">Administração</span></header>
    <main id="admin-content" tabIndex={-1} className={styles.content}>
      <AdminBackButton />
      {children}
    </main>
    <nav className={styles.bottom} aria-label="Navegação administrativa mobile">
      {adminPrimaryLinks.map(({ href, label, icon: Icon }) => <Link href={href} key={href} className={styles.tab}
        aria-current={isAdminLinkActive(pathname, href) ? 'page' : undefined}><Icon aria-hidden="true" /><span>{label}</span></Link>)}
      <button type="button" ref={moreButton} className={styles.tab} data-active={secondaryActive || moreOpen}
        aria-haspopup="dialog" aria-expanded={moreOpen} aria-controls="admin-more"
        onClick={() => { dialog.current?.showModal(); setMoreOpen(true) }}><AdminMoreIcon aria-hidden="true" /><span>Mais</span></button>
    </nav>
    <dialog id="admin-more" ref={dialog} className={styles.dialog} aria-labelledby="admin-more-title"
      onClose={() => { setMoreOpen(false); moreButton.current?.focus() }}
      onKeyDown={event => {
        if (event.key !== 'Tab') return
        const targets = event.currentTarget.querySelectorAll<HTMLElement>('a[href], button:not(:disabled)')
        const first = targets[0], last = targets[targets.length - 1]
        if (event.shiftKey && (document.activeElement === first || document.activeElement === event.currentTarget)) {
          event.preventDefault(); last?.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault(); first?.focus()
        }
      }}
      onClick={event => { if (event.target === event.currentTarget) {
        const bounds = event.currentTarget.getBoundingClientRect()
        if (event.clientY < bounds.top || event.clientX < bounds.left || event.clientX > bounds.right) closeMore()
      } }}>
      <div className={styles.dialogHeader}><h2 id="admin-more-title">Mais opções</h2><button type="button" className={styles.close} aria-label="Fechar menu Mais" onClick={closeMore}><X aria-hidden="true" /></button></div>
      <nav className={styles.dialogBody} aria-label="Mais opções administrativas">{secondaryLinks()}</nav>
    </dialog>
  </div>
}
