# UPX Facens

**ReUse+ — plataforma de reutilização e economia circular.**

Encontre objetos. Conecte pessoas. Faça circular.

Interface em HTML, CSS e JavaScript, com uma galeria clara, identidade verde, fotos reais nos anúncios, publicação em três etapas e conversas por objeto. Não há anúncios fictícios pré-carregados.

A abertura tem uma cena Three.js com cinco objetos ilustrativos: cadeira, luminária, livros, vaso e mesa pequena. Mova o mouse para inclinar ou arraste na horizontal para girar. No celular, a rolagem vertical continua livre. O botão de embaralhar mostra outro objeto; o botão de pausa também interrompe os movimentos tipográficos. Com a cena focada, use setas, Home, N e espaço. A preferência de movimento reduzido é respeitada.

## Endereços após iniciar localmente

- Comunidade com servidor e banco local de desenvolvimento: **http://localhost:8080**.
- Versão que guarda dados apenas no navegador: **http://localhost:4173**.

O rodapé e a janela “Sobre esta comunidade” identificam a versão. Os dados locais do navegador e os dados do servidor são independentes.

## Executar a versão local

```powershell
npm start
```

Abra http://localhost:4173. O botão de demonstração fica na janela de acesso. Essa conta começa sem anúncios; não representa uma comunidade conectada.

## Executar o servidor sem Docker

Pré-requisitos: Node.js para a prévia e as verificações, Java 17 e Maven para o servidor. Na cópia local original, ferramentas portáteis ficam em `.reuse-tools/`; elas não são distribuídas no repositório. O script abaixo depende dessas ferramentas portáteis. Em um clone novo, use os comandos com Java e Maven instalados apresentados a seguir.

```powershell
powershell -ExecutionPolicy Bypass -File tools/start-backend.ps1
```

O comando sincroniza a interface, prepara a aplicação e abre http://localhost:8080. Crie uma conta pela interface. O perfil `dev` usa H2 persistente em `.reuse-data/community.mv.db`; as fotos enviadas ficam em `.reuse-data/uploads/`. Ele não altera um banco PostgreSQL existente.

Se preferir usar Java 17 e Maven já instalados:

```powershell
npm run sync
mvn -Pdev package -DskipTests
java -jar target/reuse-plus-0.0.1-SNAPSHOT.jar --spring.profiles.active=dev --server.address=127.0.0.1
```

Executar o JAR evita problemas de codificação em caminhos Windows com acentos. O script usa os arquivos estáticos do projeto para permitir atualizações da interface durante desenvolvimento.

## PostgreSQL

A configuração original continua disponível. São necessárias as ferramentas Java 17, Maven e Docker.

```powershell
docker compose up -d
npm run sync
mvn package -DskipTests
java -jar target/reuse-plus-0.0.1-SNAPSHOT.jar
```

Configure `DB_URL`, `DB_USER`, `DB_PASSWORD`, `JWT_SECRET` e `PORT` conforme o ambiente. A migração Flyway V3 adiciona galeria, localização e identificação de quem reservou. V1 e V2 foram preservadas.

## Verificação

```powershell
npm run check
mvn -Pdev test
```

Os testes Java usam um banco em memória separado. Para usar as ferramentas portáteis:

```powershell
$reuseJdk = Get-ChildItem .reuse-tools/jdk -Directory | Select-Object -First 1
$env:JAVA_HOME = $reuseJdk.FullName
& ./.reuse-tools/apache-maven-3.9.9/bin/mvn.cmd -Pdev test '-Dmaven.repo.local=.reuse-tools/repository'
```

Capturas, logs, relatórios internos, bancos, uploads e ferramentas portáteis ficam somente na cópia local e não são versionados. O repositório contém o código da aplicação, os recursos visuais e os testes.

A página isolada http://localhost:8080/assets/scene-check.html verifica renderização, interações, descarte, movimento reduzido e fallback, sem criar dados da comunidade. Os modelos são geometria original deste projeto; Three.js 0.180.0 usa licença MIT, incluída em `assets/vendor/THREE-LICENSE.txt`.

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

As credenciais padrão do Docker e a chave JWT de fallback no código são exemplos locais de desenvolvimento. Antes de disponibilizar o servidor em outro ambiente, defina `DB_URL`, `DB_USER`, `DB_PASSWORD` e uma `JWT_SECRET` exclusiva pelas variáveis do ambiente. Não envie arquivos `.env`, senhas reais, tokens, dados da comunidade ou chaves privadas ao repositório.

Three.js e Lora mantêm suas licenças em `assets/vendor/THREE-LICENSE.txt` e `assets/LORA-LICENSE.txt`. As fontes e a procedência dos recursos visuais estão documentadas em `assets/SCENE-RESOURCES.md`.
