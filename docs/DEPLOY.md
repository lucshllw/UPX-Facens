# Deploy do UPX Facens / ReUse+

O mesmo servidor Java entrega a interface, API e fotos. O banco e PostgreSQL 16 e o schema e criado/atualizado automaticamente pelo Flyway. Nao e necessario publicar um frontend separado.

## Caminho rapido: Docker Compose

Requisitos: Git, Node.js 20 ou superior para gerar o ambiente e Docker com Compose v2. O build da imagem inclui Maven e Java 17; nao usa as ferramentas privadas do computador do autor.

```sh
git clone https://github.com/lucshllw/UPX-Facens.git
cd UPX-Facens
node tools/setup-env.js
docker compose up --build -d
```

Abra http://localhost:8080. O cadastro cria a primeira conta; nao existem usuarios ou anuncios ficticios no banco novo.

```sh
docker compose ps
docker compose logs --tail=100 app
curl --fail http://localhost:8080/api/health
```

A resposta saudavel e `{"status":"UP"}`. HTTP 503 indica que o banco nao esta acessivel; nao basta a pagina HTML abrir. O Compose aguarda o PostgreSQL ficar saudavel antes de iniciar a aplicacao.

Os volumes `reuseplus_pgdata` e `reuseplus_uploads` conservam banco e fotos. `docker compose down` para a aplicacao conservando volumes; nao use `down -v` se deseja preservar os dados. O banco nao expoe porta publica no Compose.

## Servidor com banco gerenciado

1. Importe este repositorio no provedor e selecione build pelo `Dockerfile` da raiz, ou compile o JAR com Java 17 e Maven.
2. Crie um PostgreSQL 16 vazio para a aplicacao, com backup habilitado conforme os recursos do provedor.
3. Defina as variaveis abaixo no painel do provedor. Nao envie os valores reais para commits, issues ou mensagens.
4. Monte um disco persistente gravavel pelo usuario 10001 da imagem em `/app/uploads`.
5. Configure a verificacao de saude para `GET /api/health`. A porta interna vem de `PORT` (padrao 8080).
6. Associe dominio/HTTPS no provedor e teste cadastro, upload, publicacao, reserva e mensagens usando duas contas.

| Variavel | Valor/configuracao |
| --- | --- |
| `DB_URL` | `jdbc:postgresql://HOST:5432/BANCO?sslmode=require` para banco remoto que exige TLS |
| `DB_USER` | Usuario do banco fornecido pelo provedor |
| `DB_PASSWORD` | Senha do banco; obrigatoria fora do perfil dev |
| `JWT_SECRET` | Chave exclusiva, aleatoria, com pelo menos 64 bytes; gerada pelo script para uso local ou pelo gerenciador do provedor |
| `PORT` | Porta do servidor determinada pelo provedor, normalmente 8080 |
| `UPLOAD_DIRECTORY` | `/app/uploads` no volume persistente da imagem |
| `CORS_ALLOWED_ORIGINS` | Somente se houver frontend separado: origens HTTPS exatas, separadas por virgula; a interface desta imagem usa a mesma origem |
| `DB_POOL_SIZE` | Opcional; padrao 10, ajuste conforme o limite do banco |

Uma URL `postgres://usuario:senha@host/banco` nao deve ser colada inteira em `DB_URL`. Separe usuario e senha nas variaveis correspondentes e use o prefixo JDBC mostrado na tabela. Se usar banco na rede interna do mesmo provedor, siga as exigencias de TLS desse banco.

Nao ative `SPRING_PROFILES_ACTIVE=dev` no deploy: esse perfil e exclusivamente H2 local. As migracoes V1, V2 e V3 devem permanecer imutaveis; mudancas futuras exigem uma nova versao SQL. O JAR de producao nao depende do H2.

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

Esse perfil verifica migracoes reais, CRUD, cadastro/login, favoritos, fotos, mensagens e reserva concorrente. Ele exige o nome isolado do banco para impedir apontamento acidental para a comunidade de producao. Os testes criam contas ficticias nesse banco de teste.

Depois, configure DB_URL/DB_USER/DB_PASSWORD/JWT_SECRET/UPLOAD_DIRECTORY no ambiente e execute:

```sh
java -jar target/reuse-plus-0.0.1-SNAPSHOT.jar
```

A variavel `.env` e lida automaticamente pelo Docker Compose, mas nao pelo comando `java`; nesse caso exporte as variaveis do sistema ou configure-as no painel do provedor.

## Atualizacao e backup

Atualize codigo com `git pull`, depois `docker compose up --build -d`. Preserve o mesmo ambiente e os volumes. Mudar POSTGRES_USER/DB_PASSWORD apos a primeira inicializacao nao altera automaticamente os usuarios de um volume existente: atualize as credenciais do banco de maneira coordenada.

Antes de mudar schema ou ambiente, faca backup do PostgreSQL e das fotos. Em PowerShell, use `pg_dump --file` dentro do container e `docker compose cp` para exportar o arquivo; evite redirecionar um dump binario com `>` em shells que alteram a codificacao.

## Trabalho em dupla

O proprietario convidou `leoesmeraldino` com permissao de escrita. O colega deve aceitar em https://github.com/lucshllw/UPX-Facens/invitations ou pelas notificacoes do GitHub. O convite depende da aceitacao na conta correta.

Depois de aceitar, ele pode clonar o repositorio, conectar o proprio provedor de hospedagem e configurar os segredos nesse provedor. Para mudancas, crie uma branch e abra pull request. A verificacao GitHub Actions testa a interface, Java e PostgreSQL e constroi/inicia a imagem Docker. Nao e necessario receber acesso administrativo ao repositorio para contribuir.

Este guia prepara o deploy. Criar o repositorio, enviar o codigo ou ter CI verde nao significa que um endereco publico de aplicacao foi ativado. Confira a secao de resultados no README para a cobertura efetivamente executada.

## Fontes tecnicas

- [Ordem de inicializacao e healthcheck no Compose](https://docs.docker.com/compose/how-tos/startup-order/).
- [PostgreSQL para Windows e binarios portateis](https://www.postgresql.org/download/windows/). Na validacao local sem Docker, foram usados binarios PostgreSQL 16.15 distribuidos pelo projeto [Zonky](https://github.com/zonkyio/embedded-postgres), apenas como ferramenta de teste, fora do repositorio e da imagem de producao.
