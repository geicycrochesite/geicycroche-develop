// src/client/home/HomePage.tsx
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/core/lib/prisma";
import { siteConfig } from "@/client/config/site.config";

export default async function HomePage() {
  const categories = await prisma.blogCategory.findMany({
    where: { showOnHome: true },
    orderBy: { order: "asc" },
    take: 3,
  });

  return (
    <main
      className="w-full"
      style={{
        backgroundColor: "var(--color-bg-primary)",
        color: "var(--color-text-primary)",
      }}
    >

      {/* HERO */}
      <section className="relative w-full min-h-[90vh] flex items-center py-8">
        <Image
          src="/bg-gc-croche-com-elegancia-e-estilo.png"
          alt="Crochê elegante feito à mão Geicy Crochê"
          fill
          priority
          className="object-cover object-center"
        />

        <div
          className="absolute inset-0"
          style={{
            backgroundColor:
              "color-mix(in srgb, var(--color-overlay) 60%, transparent)",
          }}
        />

        <div className="relative z-10 max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <Image
              src="/logo-geicy-croche-vertical.png"
              alt="Geicy Crochê logo"
              width={220}
              height={120}
              className="mb-6"
            />

            <Image
              src="/txt-gc-croche-com-estilo-e-elegancia.png"
              alt="Crochê com estilo e elegância"
              width={500}
              height={200}
              className="mb-6"
            />

            <p
              className="text-sm md:text-base max-w-md mb-8"
              style={{ color: "var(--color-text-hero-muted)" }}
            >
              Peças exclusivas feitas à mão com amor e dedicação.
            </p>

            <div className="flex flex-wrap gap-4">
              <a
                href="/loja"
                className="inline-block px-6 py-3 font-semibold transition rounded-lg hover:opacity-80"
                style={{
                  backgroundColor: "var(--color-accent)",
                  color: "var(--color-text-light)",
                }}
              >
                Conheça nossas peças
              </a>

              <a
                href="/personalizado"
                className="inline-block px-6 py-3 transition rounded-lg hover:opacity-80"
                style={{
                  border: "1px solid var(--color-accent)",
                  color: "var(--color-accent-light)",
                }}
              >
                Encomenda personalizada
              </a>
            </div>
          </div>

          <div />
        </div>
      </section>

      {/* CATEGORIAS DO BLOG */}
      {categories.length > 0 && (
        <section
          className="py-16 px-6"
          style={{ backgroundColor: "var(--color-bg-tertiary)" }}
        >
          <div className="max-w-6xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-semibold mb-4">
              Conteúdos do Blog
            </h2>

            <p
              className="mb-10 max-w-xl mx-auto"
              style={{ color: "var(--color-text-muted)" }}
            >
              Dicas, inspirações e conteúdos exclusivos sobre crochê.
            </p>

            <div className="grid md:grid-cols-3 gap-6">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/blog/categoria/${cat.slug}`}
                  className="group block rounded-xl p-6 text-left transition hover:opacity-90"
                  style={{
                    backgroundColor: "var(--color-bg-primary)",
                    border: "1px solid var(--color-bg-hover)",
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
                    style={{
                      backgroundColor:
                        "color-mix(in srgb, var(--color-accent) 10%, transparent)",
                    }}
                  >
                    <span
                      className="text-xl"
                      style={{ color: "var(--color-accent)" }}
                    >
                      🧶
                    </span>
                  </div>

                  <h3 className="text-lg font-semibold mb-2">
                    {cat.name}
                  </h3>

                  <p
                    className="text-sm"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    {cat.description ??
                      "Explore conteúdos exclusivos sobre crochê."}
                  </p>

                  <p
                    className="text-sm font-semibold mt-4"
                    style={{ color: "var(--color-accent)" }}
                  >
                    Clique para saber mais →
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* SOBRE */}
      <section className="py-20 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-semibold mb-6">
            Crochê com Qualidade e Sofisticação
          </h2>

          <p
            className="leading-relaxed mb-8"
            style={{ color: "var(--color-text-muted)" }}
          >
            Cada peça é feita manualmente com atenção aos detalhes,
            garantindo exclusividade, beleza e durabilidade.
          </p>

          <a
            href="/loja"
            className="inline-block px-8 py-4 transition rounded-lg hover:opacity-80"
            style={{
              backgroundColor: "var(--color-accent)",
              color: "var(--color-text-light)",
            }}
          >
            Veja nossas coleções exclusivas
          </a>
        </div>
      </section>

      {/* CTA FINAL */}
      <section
        className="py-20 px-6 text-center"
        style={{
          backgroundColor:
            "color-mix(in srgb, var(--color-accent) 10%, transparent)",
          borderTop:
            "1px solid color-mix(in srgb, var(--color-accent) 20%, transparent)",
        }}
      >
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Faça sua encomenda personalizada
          </h2>

          <p
            className="mb-8"
            style={{ color: "var(--color-text-muted)" }}
          >
            Fale direto no WhatsApp e peça sua peça exclusiva.
          </p>

          <a
            href={`https://wa.me/${siteConfig.whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-8 py-4 font-semibold transition rounded-lg text-lg hover:opacity-80"
            style={{
              backgroundColor: "var(--color-accent)",
              color: "var(--color-text-light)",
            }}
          >
            Pedir no WhatsApp →
          </a>
        </div>
      </section>

    </main>
  );
}