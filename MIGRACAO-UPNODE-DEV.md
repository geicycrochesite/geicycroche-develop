# Migração UpNode — auditoria e procedimento DEV

## Matriz de compatibilidade (20/10/2026)

| Projeto | Repositório DEV | Branch local | Compatibilidade e cuidados |
|---|---|---|---|
| Template | geisabitt/upnode-template | desenvolvimento | Matriz com módulos e autenticação forte; migração aditiva Orders, manter Asaas e marca configurável. Branch local contém melhorias anteriores ao develop remoto. |
| Artesanaio | artesanaiosite/artesanaio-develop | desenvolvimento | Checkout antigo; alterações SEO locais preexistentes devem permanecer fora do commit. |
| E&L | lojageisabitt/elvidracaria | desenvolvimento | Loja desativada: preservar store.enabled=false; não ativar comércio. |
| Geicy | geicycrochesite/geicycroche-develop | develop | Dois commits remotos de PWA à frente; package.json local alterado e seed administrativo particular. |
| Teixeiras | lojateixeirassite/lojaxeixeiras-dev | develop | Quatro commits remotos à frente; home/componentes personalizados locais sobrepostos. |
| Maribela | maribelasite/soumaribela-dev | desenvolvimento | Históricos divergentes: segurança/SEO locais e PWA remoto precisam ser conciliados. |

Não modificar remotos origin de produção dos clientes com repositórios separados. Nenhum banco externo foi migrado. URLs DEV dos clientes ainda não comprovadas. Não executar testes publicados nesta etapa.

## Arquitetura

AdminShell compartilhado, marca via siteConfig.nome e cores do tema de cada instalação. Navegação inferior no celular e lateral a partir de 1024px; login e configuração inicial separados. Categorias, páginas, blog, etiquetas e Asaas continuam acessíveis.

Orders utiliza o token do lojista conectado. Pedidos antigos conservam paymentProvider; Asaas continua padrão até seleção explícita no painel. Comissões em centavos, chave única por pedido, créditos de estorno e fechamento semanal sem criação de cobrança. O cron autenticado recupera a inbox e tentativas incertas com a mesma chave de idempotência.

## Variáveis de servidor

- MP_INSTANCE_ID: identificador único e permanente por instalação/ambiente (letras minúsculas, números, hífen, underscore).
- MP_CLIENT_ID e MP_CLIENT_SECRET: aplicação comum UpNode, configurados manualmente no gerenciador seguro do ambiente DEV. Nunca copiar arquivos .env entre clientes.
- MP_TOKEN_ENCRYPTION_KEY: 32 bytes aleatórios em base64, exclusiva da instalação e do ambiente; manter backup seguro. A criptografia inclui MP_INSTANCE_ID como contexto autenticado.
- MP_BASE_URL: origem HTTPS real do ambiente. Callback: /api/mercado-pago/oauth/callback.
- MP_ENVIRONMENT=test para contas de teste; MP_TEST_SELLER_IDS lista os vendedores de teste autorizados.
- MP_PAYMENTS_ENABLED=false inicialmente; habilitar somente após configurar e homologar.
- MP_WEBHOOK_SECRET: assinatura da aplicação. MP_WEBHOOK_CONFIGURED=false até confirmar roteamento.
- CRON_SECRET: segredo exclusivo para GET /api/mercado-pago/jobs. Programar recuperação por agendador autorizado; nenhum serviço pago necessário por esta mudança.
- AUTH_JWT_SECRET e DATABASE_URL: preservar configuração segura da instalação. Nunca usar banco PROD para homologação.

Não há valores secretos neste documento. Não replicar tokens, refresh tokens, usuários, sessões OAuth ou registros da BittUp. Cada lojista conecta e confirma sua própria conta pelo painel. Desconectar limpa os tokens locais; não revoga globalmente o consentimento da aplicação compartilhada, pois isso pode afetar outras instalações do mesmo titular.

## Aplicação OAuth comum: pendências externas

A documentação oficial prevê autorização de terceiros com state, PKCE e redirect_uri estática cadastrada. Cadastrar o callback exato de cada domínio autorizado, após confirmar os limites e as permissões da aplicação UpNode. Não há justificativa confirmada para criar um callback central neste momento.

Orders configura notificações na aplicação, não por notification_url em cada pedido. Portanto, não marcar vários endpoints independentes como prontos usando uma única URL do painel. É necessário confirmar suporte do painel a múltiplos destinos ou aprovar um roteador de webhooks para destinos DEV fixos e autenticados, com persistência, reentrega e isolamento. Esse roteamento não foi homologado e pagamentos devem permanecer desativados nas novas instâncias até sua conclusão. Não cadastrar domínios fictícios nem substituir o webhook da BittUp.

Referências: https://www.mercadopago.com.br/developers/pt/docs/security/oauth/creation e https://www.mercadopago.com.br/developers/pt/docs/checkout-api-orders/integration-model

## Banco e testes

Migrações Orders e public key são aditivas; não copiar a migração mercado_pago_only da BittUp. Confirmar identidade e isolamento do PostgreSQL DEV antes de aplicar. Template e E&L possuem arquivos que apontam para bancos coincidentes; E&L .env.local coincide com .env.prod. Não confiar no nome do arquivo.

npm run test:security: regras existentes, rede externa bloqueada.
npm run test:mp: PostgreSQL temporário em loopback e API simulada; não equivale à homologação Mercado Pago.
npm run test:admin: Playwright local em 320/390/768/1280px, PostgreSQL isolado e contas sintéticas.
npm run typecheck: fontes do projeto, sem pastas temporárias de validação.

Após testes e revisão, commit e push exclusivamente DEV. Não fazer merge, não publicar via CLI, não testar sites publicados até retorno do responsável. Homologação externa, aplicação de migrações DEV e configuração OAuth/webhook permanecem etapas distintas.

## Particularidades desta instalação: geicycroche

Atualizações PWA remotas preservadas. Script seeda e seed administrativo locais preexistentes devem continuar fora do commit desta missão.

Regressão identificada na compra pelo navegador: duas adições ao carrinho antigo geravam quantidade 3 no Strict Mode. Transportadas da BittUp a atualização imutável da quantidade e a persistência somente após carregar o carrinho salvo. Não há mudança de preços ou regras comerciais.

## Checkpoint de entrega local

Build local e sete cenários Playwright aprovados a partir do índice Git, sem o script/seed administrativo particular. Dez testes PostgreSQL isolados, dois de isolamento e um de política PWA aprovados. Navegação validada em 320/390/768/1280px. OAuth e SDK simulados; service workers bloqueados somente no cenário com interceptação do provedor. Política PWA de produção verificada separadamente.

Nenhum banco externo migrado ou cobrança real executada. Migrações aditivas pendentes de confirmação do banco DEV. Configuração segura da aplicação comum, callbacks, roteamento de webhooks e conexão individual do lojista pendentes. Não testar sites publicados até o retorno do responsável.
