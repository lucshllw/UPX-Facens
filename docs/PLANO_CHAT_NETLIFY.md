# Chat privado e publicação — 03/11/2026

Pedido direto: chat anunciante/interessado e deploy no Netlify, incluindo configuração de hospedagem Java e SQL.

Decisão: evoluir mensagens existentes, sem migração de frontend e sem substituir Java. Conversas por anúncio + pessoa, leitura por destinatário, atualização a cada 5 segundos com chat aberto e 20 segundos na página ativa; pausa em aba oculta. Não adicionar WebSocket, biblioteca ou serviço de mensagens neste porte. Manter histórico SQL e textos digitados em falhas. Netlify publica somente distribuição pública; API/uploads usam proxy HTTPS para o Java hospedado externamente. Sem backend configurado, retornar indisponibilidade explícita em vez de modo local.

- [x] Regressão de leitura e isolamento, inicialmente falhando, depois implementada na API existente.
- [x] Separar módulo de chat do catálogo e preservar interface aprovada.
- [ ] Verificar duas contas no navegador, celular, reconexão e atualização automática.
- [ ] Validar build seguro do Netlify e publicar.
- [ ] Provisionar Java/PostgreSQL mediante conexão confirmada do provedor; nenhum plano pago automaticamente.
- [ ] Atualizar relatório e continuidade com evidências e limitações.

Acesso Netlify confirmado; novo site reuse-upx-facens criado. Integração Render oferecida; conexão ainda necessária. Render gratuito tem PostgreSQL com expiração de 30 dias e serviço com filesystem efêmero; não prometer retenção permanente nesse plano.
