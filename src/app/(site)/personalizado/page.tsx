import { prisma } from "@/core/lib/prisma"
import { notFound } from "next/navigation"

type FAQItem = {
  question: string
  answer: string
}

async function getPage() {
  return prisma.customPage.findUnique({
    where: {
        slug: "personalizado"
    }
  })
}

export default async function PersonalizadosPage() {
  const page = await getPage()
  if (!page) return notFound()

  const faqs = (page.faq as FAQItem[]) || []

  return (
    <div className="max-w-4xl mx-auto py-10 space-y-8 bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] min-h-screen">

      <h1 className="text-3xl font-bold">{page.title}</h1>

      {/* Intro */}
      <p className="text-[var(--color-text-secondary)]">{page.introText}</p>

      {/* FAQ */}
      <div className="space-y-4">
        {faqs.map((item: any, i: number) => (
          <div key={i} className="border border-[var(--color-border)] rounded-2xl p-4 bg-[var(--color-bg-card)]">
            <h2 className="font-semibold">{item.pergunta}</h2>
            <p className="text-[var(--color-text-secondary)] mt-2">{item.resposta}</p>
          </div>
        ))}
      </div>


    </div>
  )
}