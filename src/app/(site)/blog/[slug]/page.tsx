import { prisma } from '@/core/lib/prisma'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import Image from 'next/image'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const post = await prisma.post.findFirst({
    where: { slug, published: true },
    select: {
      title: true,
      excerpt: true,
      coverImage: true,
    },
  })

  if (!post) {
    return {
      title: 'Post não encontrado',
    }
  }

  return {
    title: post.title,
    description: post.excerpt || '',
    openGraph: {
      title: post.title,
      description: post.excerpt || '',
      images: post.coverImage ? [{ url: post.coverImage }] : [],
    },
  }
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params
  const post = await prisma.post.findFirst({
    where: { slug, published: true },
    select: {
      id: true,
      title: true,
      content: true,
      coverImage: true,
      createdAt: true,
      excerpt: true,
    },
  })

  if (!post) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]">
      <article className="max-w-4xl mx-auto px-4 py-8">
        {post.coverImage && (
          <div className="relative h-64 md:h-96 mb-8 rounded-lg overflow-hidden">
            <Image
              src={post.coverImage}
              alt={post.title}
              fill
              className="object-cover"
            />
          </div>
        )}

        <header className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{post.title}</h1>
          <p className="text-[var(--color-text-secondary)]">
            {new Date(post.createdAt).toLocaleDateString('pt-BR')}
          </p>
        </header>

<div className="prose prose-lg prose-invert max-w-none whitespace-pre-line">
  {post.content}
</div>
      </article>
    </div>
  )
}