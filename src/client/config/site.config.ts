// src/client/config/site.config.ts

export const siteConfig = {
  nome: "Geicy Crochê",

  // Logo
  logoHorizontal: "/logo-geicy-croche-horizontal.png",
  logoVertical: "/logo-geicy-croche-vertical.png",
  logoAlt: "Geicy Crochê",

  // WhatsApp (PEGUEI DA IMAGEM)
  whatsapp: "5521986483118",
  whatsappDisplay: "(21) 98648-3118",
  whatsappMensagem: "Olá! Vim pelo site e gostaria de fazer uma encomenda.",

  // Header
  headerCta: "Peça sob encomenda",

  // Redes sociais (não apareceu na imagem)
  instagram: "",
  facebook: "",
  tiktok: "",

  cidade: "Rio de Janeiro, RJ",

  // Navegação desktop
  navLinks: [
    { label: "Início", href: "/" },
    { label: "Sobre", href: "/sobre" },
    { label: "Loja", href: "/loja" },
    { label: "Contato", href: "https://wa.me/5521986483118" },
  ],

  // Navegação mobile
  mobileNavLinks: [
    { label: "Início", href: "/" },
    { label: "Sobre", href: "/sobre" },
    { label: "Loja", href: "/loja" },
    { label: "Carrinho", href: "/loja/carrinho" },
    { label: "Contato", href: "https://wa.me/5521986483118" },
  ],

  // Footer — benefícios (EXATAMENTE DA IMAGEM)
  benefits: [
    {
      title: "Feito à Mão",
      description: "Cada peça com cuidado artesanal",
    },
    {
      title: "Peças Exclusivas",
      description: "Produção sob encomenda",
    },
    {
      title: "Entrega no Brasil",
      description: "Envios para todo o país",
    },
  ],

  // Footer — links
  footerNavLinks: [
    { label: "Início", href: "/" },
    { label: "Peças em Crochê", href: "/loja" },
    { label: "Sobre", href: "/sobre" },
    { label: "Contato", href: "https://wa.me/5521986483118" },
  ],

  footerDescription:
    "Crochê artesanal com estilo e elegância. Peças feitas à mão sob encomenda, incluindo roupas, acessórios e itens para casa.",

  copyrightTagline:
    "Crochê com Estilo e Elegância",

  seo: {
    titulo: "Geicy Crochê – Crochê com Estilo e Elegância",
    descricao:
      "Peças exclusivas em crochê feitas à mão. Roupas, acessórios e itens para casa com qualidade e sofisticação.",
    url: "https://geicycroche.com.br",
    ogImage: "/og-image.png",
    keywords: [
      "crochê",
      "crochê artesanal",
      "roupas em crochê",
      "acessórios em crochê",
      "crochê sob encomenda",
    ],
  },

  // 🎨 TEMA 100% BASEADO NA IMAGEM
  theme: {
    // BACKGROUND
    bgPrimary: "#000000",
    bgSecondary: "#0B0B0B",
    bgTertiary: "#111111",
    bgCard: "#1a1a1a",
    bgHover: "#222222",
    overlay: "#0A0A0F",

    // TEXT (AJUSTADO PRO BEGE DA IMAGEM)
    textPrimary: "#9b7d3c",
    textSecondary: "#D6C7A8",
    textTertiary: "#B8A98A",
    textMuted: "#CFC2A8",
    textLight: "#ffffff",
    textHeroMuted: "#D6C7A8",

    // ACCENT (DOURADO)
    accent: "#C8A96A",
    accentHover: "#B89A5A",
    accentLight: "#EADCC6",

    // STATUS
    error: "#dc2626",
    success: "#16a34a",
    info: "#C8A96A",

    // BORDER
    border: "#333333",
    borderLight: "#444444",

    // ADMIN
    adminBg: "#1a1a1a",
    adminText: "#EADCC6",
    adminBorder: "#333333",
  },
};