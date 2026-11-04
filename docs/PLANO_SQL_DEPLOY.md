# Java + PostgreSQL e entrega para deploy

Pedido: concluir os fluxos existentes com SQL real e entregar o projeto no GitHub para deploy pelo grupo. Java 17/Spring Boot e PostgreSQL 16 sao mantidos; interface aprovada preservada.

## Tarefas e verificações
- [x] Reutilizar o contrato de fluxos existente em H2 e em PostgreSQL real/Flyway. Validar concorrencia de reservas, migrações e persistência.
- [x] Implementar readiness do banco, configuração por ambiente, CORS configuravel, erros de requisicao coerentes e recuperacao de sessao expirada. Testar falhas antes das correcoes.
- [x] Entregar Dockerfile, Compose completo com volumes, exemplo de ambiente, script de preparacao e guia de deploy/colaboracao. CI compila/testa PostgreSQL e verifica a imagem Docker.
- [x] Executar verificações frontend, testes Java/PostgreSQL, aplicação empacotada e fluxos HTTP/navegador. Conferir persistência após reiniciar. Registrar limites concretos.
- [x] Commit/push no repositório publico, acompanhar CI, atualizar ficha/capsula/índice. Convidar colega somente quando o usuário GitHub for informado.

## Pontos de revisao
Segredos ausentes no Git; fotos e banco sobrevivem a reinicio; schema criado por Flyway; disputa de reserva so tem um vencedor; sessao expirada não bloqueia catalogo; Docker não depende das ferramentas privadas do computador.

Concluído em 03/11/2026: PostgreSQL real, persistência após reinício, 13 testes Java, 5 frontend, HTTP e UI. CI inicial confirmou build/inicialização Docker. Configuração final inclui ações oficiais atuais e validação de Compose; ver a execução correspondente ao HEAD no GitHub para o resultado. Nenhuma hospedagem externa foi ativada.

Revisão adicional: regressão reproduzida e corrigida para impedir que uma edição simultânea sobrescreva a reserva. Todos os 13 testes Java passaram após a correção.
