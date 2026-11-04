# UPX Facens

**ReUse+ — plataforma de reutilização e economia circular.**

Encontre objetos. Conecte pessoas. Faça circular.

Interface em HTML, CSS e JavaScript, com uma galeria clara, identidade verde, fotos reais nos anúncios, publicação em três etapas e conversas por objeto. Não há anúncios fictícios pré-carregados.

A abertura tem uma cena Three.js com cinco objetos ilustrativos: cadeira, luminária, livros, vaso e mesa pequena. Mova o mouse para inclinar ou arraste na horizontal para girar. No celular, a rolagem vertical continua livre. O botão de embaralhar mostra outro objeto; o botão de pausa também interrompe os movimentos tipográficos. Com a cena focada, use setas, Home, N e espaço. A preferência de movimento reduzido é respeitada.

## Executar completo: Java + PostgreSQL

```sh
git clone https://github.com/lucshllw/UPX-Facens.git
cd UPX-Facens
node tools/setup-env.js
docker compose up --build -d
```

Abra **http://localhost:8080**. O servidor Java entrega a interface e a API, e as migrações criam o banco automaticamente. PostgreSQL e fotos ficam em volumes persistentes. Nenhum usuário ou anúncio e pre-carregado.

Precisa de Docker com Compose v2 e Node.js 22+ para gerar `.env`. O build inclui Java 17 e Maven. Não e necessário receber as ferramentas privadas do computador do autor.

**Para o membro do grupo:** [guia de deploy e trabalho em dupla](docs/DEPLOY.md). [Estrutura SQL](docs/BANCO_SQL.md).

## Verificar

```sh
npm run check
mvn -B verify
```

Para testar migrações e fluxos em PostgreSQL real, crie um banco isolado chamado `reuseplus_test`, configure `TEST_DB_URL`, `TEST_DB_USER` e `TEST_DB_PASSWORD`, e rode:

```sh
mvn -B -Ppostgres-it verify
```

A verificação automatica no GitHub tambem constroi e inicia a imagem Docker com PostgreSQL. `GET /api/health` responde UP apenas quando o banco aceita conexões.

## Previa da interface sem servidor Java

`npm start` abre a versão independente em http://localhost:4173. Ela guarda dados somente no navegador e serve para experimentar a interface; para compartilhar contas/anúncios/mensagens entre pessoas use a versão Java/PostgreSQL acima.

## Desenvolvimento H2 opcional

Com Java 17 e Maven instalados:

```sh
npm run sync
mvn -Pdev package
java -jar target/reuse-plus-0.0.1-SNAPSHOT.jar --spring.profiles.active=dev --server.address=127.0.0.1
```

Esse perfil conserva o H2 local em `.reuse-data/`; não e o perfil de deploy e não altera PostgreSQL existente. O script `tools/start-backend.ps1` e uma alternativa exclusiva da copia original que contem as ferramentas portateis não versionadas.

## Funcionalidades

- Exploração pública; busca por texto e localização; categoria, condição, modalidade e ordenação.
- Cadastro, login, favoritos por usuário e anúncios próprios.
- Publicação e edição com rascunho, progresso, até quatro fotos, prévia e revisão.
- Galeria com miniaturas e zoom por botões ou teclado.
- Reserva, cancelamento autorizado e confirmação de reutilização pelo anunciante.
- Conversas privadas entre interessado e anunciante; seleção de conversa para responder.
- Estados de carregamento, erro, sucesso e ausência de resultados.
- Navegação móvel, filtros em diálogo, foco acessível e movimento reduzido.

Doação e troca são as modalidades do escopo original. Não há venda, pagamentos ou envio de mensagens externas.

## Acabamento da versão aprovada

A versão 0.5.0 mantém a experiência Three.js e os fluxos existentes, com uma camada editorial em `assets/refinement.css`, tokens compartilhados, Lora Italic auto-hospedada, materiais procedurais e filtros ativos removíveis. Os diálogos mantêm o foco com Tab/Shift+Tab; a cena pausa enquanto eles estão abertos.

A versão 0.5.1 acrescenta a barra superior preta com fundo verde animado e o símbolo ReUse+ girando em CSS 3D. A marca escrita permanece estável. Pausa e movimento reduzido também se aplicam à barra.

## Configuração e publicação

O repositório é público em [UPX Facens](https://github.com/lucshllw/UPX-Facens). A disponibilização do código no GitHub não publica automaticamente a aplicação nem o banco de dados.

O deploy exige credenciais próprias; o script gera os valores sem imprimi-los. O fallback JWT existe somente no perfil dev. Antes de disponibilizar o servidor em outro ambiente, defina `DB_URL`, `DB_USER`, `DB_PASSWORD` e uma `JWT_SECRET` exclusiva pelas variáveis do ambiente. Não envie arquivos `.env`, senhas reais, tokens, dados da comunidade ou chaves privadas ao repositório.

Three.js e Lora mantêm suas licenças em `assets/vendor/THREE-LICENSE.txt` e `assets/LORA-LICENSE.txt`. As fontes e a procedência dos recursos visuais estão documentadas em `assets/SCENE-RESOURCES.md`.

## Verificação da entrega SQL (03/11/2026)

- 17 testes Java aprovados: 10 verificações no ambiente H2 e 7 no PostgreSQL 16 real, incluindo concorrencia de reservas e migrações Flyway.
- 5 testes frontend aprovados, alem de sintaxe, contraste, sincronizacao e limites de tamanho.
- 34 verificações HTTP contra o JAR conectado ao PostgreSQL: cadastro/login, fotos, CRUD, favoritos, reservas e privacidade de mensagens.
- 14 verificações adicionais após reiniciar o banco e o JAR confirmaram persistência; foto comparada por SHA-256.
- Banco indisponível retorna HTTP 503; upload acima de 8 MB retorna HTTP 413.
- Edição simultânea com reserva preserva o estado e a pessoa que reservou, com teste de regressão em PostgreSQL.
- Sessão expirada não bloqueia mais o catálogo público; o navegador permite continuar explorando e entrar novamente.

[Ver a verificação automatica no GitHub](https://github.com/lucshllw/UPX-Facens/actions/workflows/ci.yml). O resultado de cada execucao esta no proprio Actions; envio do código não e confirmacao de hospedagem externa. Frontend Netlify e Java/PostgreSQL no Render foram ativados em 03/11/2026, com fluxos públicos verificados.

O colaborador **leoesmeraldino** aceitou o convite e possui permissão de escrita no repositório.


## Chat e publicação no Netlify

O chat agora separa cada interessado por anúncio, atualiza automaticamente e mostra mensagens não lidas e confirmação de leitura. O servidor mantém a autorização e persistência SQL.

Site público: https://reuse-upx-facens.netlify.app, conectado à API https://reuse-upx-api.onrender.com e ao PostgreSQL do Render. `API_BASE_URL` já foi configurada no Netlify. Consulte [o guia](docs/DEPLOY.md#netlify--servidor-java-no-render-03112026). `render.yaml` prepara Java/PostgreSQL gratuitos para demonstração, com fotos em SQL; banco Free expira após 30 dias.


### Verificação do ambiente publicado

Em 03/11/2026: 23 verificações HTTP passaram no domínio Netlify, cobrindo cadastro/login, fotos, anúncio, favoritos, reserva, chat, leitura individual e privacidade. Edge confirmou login e envio no site público, teclado, celular 390×844 e zero erros de console. [CI da implementação aprovado](https://github.com/lucshllw/UPX-Facens/actions/runs/41753279377).

PostgreSQL gratuito expira em **03/12/2026, às 22h29 (Brasília)**, conforme retorno do provedor. Exportar/migrar ou escolher plano pago antes do vencimento. O servidor Free suspende por inatividade e pode demorar na primeira abertura. Nenhum plano pago foi contratado; H2 local não foi importado.
