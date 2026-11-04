# Java + PostgreSQL e entrega para deploy

Pedido: concluir os fluxos existentes com SQL real e entregar o projeto no GitHub para deploy pelo grupo. Java 17/Spring Boot e PostgreSQL 16 sao mantidos; interface aprovada preservada.

## Tarefas e verificacoes
- [ ] Reutilizar o contrato de fluxos existente em H2 e em PostgreSQL real/Flyway. Validar concorrencia de reservas, migracoes e persistencia.
- [ ] Implementar readiness do banco, configuracao por ambiente, CORS configuravel, erros de requisicao coerentes e recuperacao de sessao expirada. Testar falhas antes das correcoes.
- [ ] Entregar Dockerfile, Compose completo com volumes, exemplo de ambiente, script de preparacao e guia de deploy/colaboracao. CI compila/testa PostgreSQL e verifica a imagem Docker.
- [ ] Executar verificacoes frontend, testes Java/PostgreSQL, aplicacao empacotada e fluxos HTTP/navegador. Conferir persistencia apos reiniciar. Registrar limites concretos.
- [ ] Commit/push no repositorio publico, acompanhar CI, atualizar ficha/capsula/indice. Convidar colega somente quando o usuario GitHub for informado.

## Pontos de revisao
Segredos ausentes no Git; fotos e banco sobrevivem a reinicio; schema criado por Flyway; disputa de reserva so tem um vencedor; sessao expirada nao bloqueia catalogo; Docker nao depende das ferramentas privadas do computador.
