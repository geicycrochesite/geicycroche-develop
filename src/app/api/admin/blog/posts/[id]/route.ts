import { NextResponse } from 'next/server'
import { prisma } from '@/core/lib/prisma'

type Params = {
  params: Promise<{ id: string }>
}

/* =========================
   UPDATE (PATCH)
========================= */
export async function PATCH(req: Request, context: Params) {
  try {
    const { id } = await context.params
    const body = await req.json()

    if (!id) {
      return NextResponse.json(
        { message: 'ID não fornecido' },
        { status: 400 }
      )
    }

    const updatedPost = await prisma.post.update({
      where: { id },
      data: {
        title: body.title,
        content: body.content,
        excerpt: body.excerpt,
        coverImage: body.coverImage,
        published: body.published,
        categoryId: body.categoryId || null,
      },
    })

    return NextResponse.json(updatedPost)
  } catch (error) {
    console.error('Erro ao atualizar post:', error)

    return NextResponse.json(
      { message: 'Erro ao atualizar post' },
      { status: 500 }
    )
  }
}

/* =========================
   DELETE
========================= */
export async function DELETE(req: Request, context: Params) {
  try {
    const { id } = await context.params

    if (!id) {
      return NextResponse.json(
        { message: 'ID não fornecido' },
        { status: 400 }
      )
    }

    await prisma.post.delete({
      where: { id },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Erro ao deletar post:', error)

    return NextResponse.json(
      { message: 'Erro ao deletar post' },
      { status: 500 }
    )
  }
}