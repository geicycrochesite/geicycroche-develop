import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { prisma } from '@/core/lib/prisma'
import { AUTH_COOKIE_NAME, verifyAdminToken } from '@/core/lib/auth-token'
import { isSameOriginMutation, privateJson, readCookie } from '@/core/lib/request-security'

export async function authenticateAdmin(token: string | undefined) {
  if (!token) return { status: 401 as const }
  const session = await verifyAdminToken(token)
  if (!session) return { status: 401 as const }
  if (session.role !== 'admin') return { status: 403 as const }
  const user = await prisma.adminUser.findUnique({
    where: { id: session.id }, select: { id: true, email: true, role: true },
  })
  if (!user || user.email !== session.email) return { status: 401 as const }
  if (user.role !== 'admin') return { status: 403 as const }
  return { status: 200 as const, user }
}

export async function requestAdmin(request: Request) {
  return authenticateAdmin(readCookie(request.headers.get('cookie'), AUTH_COOKIE_NAME))
}

export async function requireAdminPage() {
  const result = await authenticateAdmin((await cookies()).get(AUTH_COOKIE_NAME)?.value)
  if (result.status !== 200) redirect('/admin/login')
  return result.user
}

export function withAdmin<R extends Request, A extends unknown[]>(handler: (request: R, ...args: A) => Promise<Response>) {
  return async (request: R, ...args: A): Promise<Response> => {
    try {
      const auth = await requestAdmin(request)
      if (auth.status !== 200) return privateJson({ error: auth.status === 401 ? 'Autenticação necessária.' : 'Acesso não permitido.' }, auth.status)
      if (!isSameOriginMutation(request)) return privateJson({ error: 'Origem não permitida.' }, 403)
      const response = await handler(request, ...args)
      response.headers.set('Cache-Control', 'private, no-store')
      return response
    } catch {
      return privateJson({ error: 'Não foi possível concluir a operação.' }, 500)
    }
  }
}
