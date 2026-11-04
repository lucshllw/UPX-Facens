# Deploy do UPX Facens / ReUse+

O mesmo servidor Java entrega a interface, API e fotos. O banco e PostgreSQL 16 e o schema e criado/atualizado automaticamente pelo Flyway. Não e necessário publicar um frontend separado.

## Caminho rapido: Docker Compose

Requisitos: Git, Node.js 22 ou superior para gerar o ambiente e Docker com Compose v2. O build da imagem inclui Maven e Java 17; não usa as ferramentas privadas do computador do autor.

```sh
git clone https://github.com/lucshllw/UPX-Facens.git
cd UPX-Facens
node tools/setup-env.js
docker compose up --build -d
```

Abra http://localhost:8080. O cadastro cria a primeira conta; não existem usuários ou anúncios ficticios no banco novo.

```sh
docker compose ps
docker compose logs --tail=100 app
curl --fail http://localhost:8080/api/health
```

A resposta saudável e `{"status":"UP"}`. HTTP 503 indica que o banco não esta acessivel; não basta a pagina HTML abrir. O Compose aguarda o PostgreSQL ficar saudável antes de iniciar a aplicação.

Os volumes `reuseplus_pgdata` e `reuseplus_uploads` conservam banco e fotos. `docker compose down` para a aplicação conservando volumes; não use `down -v` se deseja preservar os dados. O banco não expoe porta publica no Compose.

## Servidor com banco gerenciado

1. Importe este repositório no provedor e selecione build pelo `Dockerfile` da raiz, ou compile o JAR com Java 17 e Maven.
2. Crie um PostgreSQL 16 vazio para a aplicação, com backup habilitado conforme os recursos do provedor.
3. Defina as variáveis abaixo no painel do provedor. Não envie os valores reais para commits, issues ou mensagens.
4. Monte um disco persistente gravavel pelo usuário 10001 da imagem em `/app/uploads`.
5. Configure a verificação de saúde para `GET /api/health`. A porta interna vem de `PORT` (padrão 8080).
6. Associe dominio/HTTPS no provedor e teste cadastro, upload, publicação, reserva e mensagens usando duas contas.

| Variavel | Valor/configuração |
| --- | --- |
| `DB_URL` | `jdbc:postgresql://HOST:5432/BANCO?sslmode=require` para banco remoto que exige TLS |
| `DB_USER` | Usuario do banco fornecido pelo provedor |
| `DB_PASSWORD` | Senha do banco; obrigatoria fora do perfil dev |
| `JWT_SECRET` | Chave exclusiva, aleatória, com pelo menos 64 bytes; gerada pelo script para uso local ou pelo gerenciador do provedor |
| `PORT` | Porta do servidor determinada pelo provedor, normalmente 8080 |
| `UPLOAD_DIRECTORY` | `/app/uploads` no volume persistente da imagem |
| `CORS_ALLOWED_ORIGINS` | Somente se houver frontend separado: origens HTTPS exatas, separadas por virgula; a interface desta imagem usa a mesma origem |
| `DB_POOL_SIZE` | Opcional; padrão 10, ajuste conforme o limite do banco |

Uma URL `postgres://usuário:senha@host/banco` não deve ser colada inteira em `DB_URL`. Separe usuário e senha nas variáveis correspondentes e use o prefixo JDBC mostrado na tabela. Se usar banco na rede interna do mesmo provedor, siga as exigencias de TLS desse banco.

Não ative `SPRING_PROFILES_ACTIVE=dev` no deploy: esse perfil e exclusivamente H2 local. As migrações V1, V2 e V3 devem permanecer imutaveis; mudancas futuras exigem uma nova versão SQL. O JAR de produção não depende do H2.

## Build e testes sem Docker

```sh
npm run sync
npm run check
mvn -B verify
```

Os testes rapidos usam H2 em memoria. Para conferir PostgreSQL real, prepare um banco de teste com o nome exato `reuseplus_test` e configure `TEST_DB_URL`, `TEST_DB_USER` e `TEST_DB_PASSWORD` antes de executar:

```sh
mvn -B -Ppostgres-it verify
```

Esse perfil verifica migrações reais, CRUD, cadastro/login, favoritos, fotos, mensagens e reserva concorrente. Ele exige o nome isolado do banco para impedir apontamento acidental para a comunidade de produção. Os testes criam contas ficticias nesse banco de teste.

Depois, configure DB_URL/DB_USER/DB_PASSWORD/JWT_SECRET/UPLOAD_DIRECTORY no ambiente e execute:

```sh
java -jar target/reuse-plus-0.0.1-SNAPSHOT.jar
```

A variavel `.env` e lida automaticamente pelo Docker Compose, mas não pelo comando `java`; nesse caso exporte as variáveis do sistema ou configure-as no painel do provedor.

## Atualizacao e backup

Atualize código com `git pull`, depois `docker compose up --build -d`. Preserve o mesmo ambiente e os volumes. Mudar POSTGRES_USER/DB_PASSWORD após a primeira inicializacao não altera automaticamente os usuários de um volume existente: atualize as credenciais do banco de maneira coordenada.

Antes de mudar schema ou ambiente, faca backup do PostgreSQL e das fotos. Em PowerShell, use `pg_dump --file` dentro do container e `docker compose cp` para exportar o arquivo; evite redirecionar um dump binario com `>` em shells que alteram a codificacao.

## Trabalho em dupla

O colaborador `leoesmeraldino` aceitou o convite e possui permissão de escrita, confirmada pela API do GitHub em 03/11/2026.

Ele pode clonar o repositório, conectar o proprio provedor de hospedagem e configurar os segredos nesse provedor. Para mudancas, crie uma branch e abra pull request. A verificação GitHub Actions testa a interface, Java e PostgreSQL e constroi/inicia a imagem Docker. Não e necessário receber acesso administrativo ao repositório para contribuir.

Este guia prepara o deploy. Criar o repositório, enviar o código ou ter CI verde não significa que um endereco publico de aplicação foi ativado. Confira a secao de resultados no README para a cobertura efetivamente executada.

## Fontes técnicas

- [Ordem de inicializacao e healthcheck no Compose](https://docs.docker.com/compose/how-tos/startup-order/).
- [PostgreSQL para Windows e binários portateis](https://www.postgresql.org/download/windows/). Na validação local sem Docker, foram usados binários PostgreSQL 16.15 distribuidos pelo projeto [Zonky](https://github.com/zonkyio/embedded-postgres), apenas como ferramenta de teste, fora do repositório e da imagem de produção.


## Netlify + servidor Java no Render (03/11/2026)

Site criado no Netlify: https://reuse-upx-facens.netlify.app. A publicação do frontend e a ativação do backend são etapas distintas. `netlify.toml` publica somente `dist/`, gerado por `node tools/build-netlify.js`; arquivos privados, banco, fontes e evidências ficam fora dessa distribuição.

1. Crie o backend e PostgreSQL pelo `render.yaml`: [configurar Blueprint no Render](https://dashboard.render.com/select-repo?type=blueprint&repo=https%3A%2F%2Fgithub.com%2Flucshllw%2FUPX-Facens).
2. O blueprint fornece DB_HOST/DB_NAME/DB_USER/DB_PASSWORD e JWT_SECRET próprio. UPLOAD_STORAGE=database guarda fotos no PostgreSQL sem depender do filesystem efêmero; o padrão local continua disk. Fotos antigas em disco não são importadas nem apagadas.
3. Após `/api/health` retornar UP no endereço HTTPS atribuído pelo Render, configure API_BASE_URL no Netlify com essa origem, por exemplo `https://seu-servidor.onrender.com` (sem `/api`). Nunca use localhost ou inclua credenciais.
4. Refazer o build/deploy gera proxies `/api/*` e `/uploads/*` para o Java. Login, autorização e leitura das conversas continuam verificados pelo servidor.
5. Sem API_BASE_URL, a interface exibe indisponibilidade explícita; não cria uma comunidade simulada no armazenamento do navegador.

Os planos Free do Render têm limites: backend suspende por inatividade e PostgreSQL expira em 30 dias. Não são retenção permanente. Para continuar após o prazo, o grupo precisa migrar/exportar ou escolher um plano pago; nenhum plano pago foi autorizado nesta etapa. O SQL de fotos serve ao porte acadêmico; armazenamento de objetos dedicado é preferível quando o volume crescer.

Chat: conversas são separadas por anúncio e interessado, com horário, leitura individual e badge de não lidas. Atualização automática por HTTP a cada 5 s na conversa/caixa aberta e 20 s na página visível; pausa em aba oculta. Não usa WebSocket nem notificações push. Os textos digitados permanecem no campo quando envio ou conexão falha.

Fontes: [Netlify proxies](https://docs.netlify.com/manage/routing/redirects/rewrites-proxies/), [limites Free do Render](https://render.com/docs/free).
