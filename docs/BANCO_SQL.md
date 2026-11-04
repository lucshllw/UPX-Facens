# Banco SQL

PostgreSQL 16; Spring Data JPA nas entidades de usuarios, categorias, itens e mensagens, JdbcTemplate parametrizado nas operacoes de engajamento. Flyway aplica `src/main/resources/db/migration/V1...V3` antes de o Hibernate validar o schema. Nao rode esses arquivos manualmente depois do Flyway.

```mermaid
erDiagram
  app_users ||--o{ items : publica
  categories ||--o{ items : classifica
  app_users ||--o{ favorites : salva
  items ||--o{ favorites : recebe
  items ||--o{ reservations : reserva
  app_users ||--o{ reservations : participa
  items ||--o{ messages : conversa
  app_users ||--o{ messages : envia_recebe
  items |o--o{ impact_metrics : relaciona
```

- `app_users`: email unico, senha BCrypt e papel de acesso.
- `categories`: cinco categorias iniciais; nao sao anuncios ficticios.
- `items`: proprietario, categoria, descricao, modalidade, estado, galeria, localizacao e identificador de quem reservou.
- `favorites`: par usuario/item unico, persistente e privado por conta.
- `reservations`: historico; indice parcial garante no maximo uma reserva ativa por item. A transacao trava o item antes de reservar/cancelar/concluir.
- `messages`: remetente, destinatario, item e conteudo; endpoints limitam cada conversa aos participantes.
- `impact_metrics`: tabela legada de indicadores, preservada. A interface usa contagens reais de anuncios e estados; nao estima impacto ambiental nem preenche essa tabela com numeros ficticios.

Estados do item: AVAILABLE -> RESERVED -> FINISHED, com cancelamento RESERVED -> AVAILABLE. Somente o proprietario conclui/remove; proprietario e solicitante podem cancelar uma reserva. Chaves estrangeiras e exclusao transacional mantem favoritos, reservas e mensagens coerentes ao remover um anuncio.

O perfil dev e um banco H2 independente. Bancos e fotos antigos sao preservados em disco; mudar o ambiente para PostgreSQL nao importa dados H2 automaticamente. O deploy novo inicia uma comunidade vazia. O teste SQL usa somente `reuseplus_test`, separado da comunidade.
