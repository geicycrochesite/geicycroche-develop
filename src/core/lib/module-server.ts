import 'server-only'
import { notFound } from 'next/navigation'
import { NextResponse } from 'next/server'
import { isModuleEnabled, isRouteEnabled } from './modules'
type ModuleName = 'store' | 'checkout' | 'blog' | 'portfolio' | 'services' | 'pwa'
export function requireModule(module: ModuleName): void {
  if (!isModuleEnabled(module)) notFound()
}
export function disabledModuleResponse(path: string, method: string): NextResponse | null {
  return isRouteEnabled(path, method) ? null : NextResponse.json({ error: 'Módulo indisponível.' }, {
    status: 404, headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' },
  })
}
export function withModuleApi<R extends Request, A extends unknown[]>(path: string,
  handler: (request: R, ...args: A) => Promise<Response>) {
  return async (request: R, ...args: A): Promise<Response> => {
    const disabled = disabledModuleResponse(path, request.method)
    if (disabled) return disabled
    return handler(request, ...args)
  }
}
