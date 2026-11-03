CREATE TABLE app_users (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(160) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    neighborhood VARCHAR(120),
    role VARCHAR(20) NOT NULL DEFAULT 'USER',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_app_users_role CHECK (role IN ('USER', 'ADMIN'))
);

CREATE TABLE categories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(80) NOT NULL UNIQUE,
    slug VARCHAR(90) NOT NULL UNIQUE,
    description VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE items (
    id BIGSERIAL PRIMARY KEY,
    owner_id BIGINT NOT NULL,
    category_id BIGINT NOT NULL,
    title VARCHAR(120) NOT NULL,
    description TEXT NOT NULL,
    type VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE',
    condition_label VARCHAR(60),
    image_url VARCHAR(500),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_items_owner FOREIGN KEY (owner_id) REFERENCES app_users(id) ON DELETE CASCADE,
    CONSTRAINT fk_items_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
    CONSTRAINT chk_items_type CHECK (type IN ('DONATION', 'EXCHANGE')),
    CONSTRAINT chk_items_status CHECK (status IN ('AVAILABLE', 'RESERVED', 'FINISHED'))
);

CREATE INDEX idx_items_category_status ON items(category_id, status);
CREATE INDEX idx_items_owner ON items(owner_id);
CREATE INDEX idx_items_created_at ON items(created_at DESC);

CREATE TABLE messages (
    id BIGSERIAL PRIMARY KEY,
    item_id BIGINT NOT NULL,
    sender_id BIGINT NOT NULL,
    receiver_id BIGINT NOT NULL,
    content TEXT NOT NULL,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_messages_item FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
    CONSTRAINT fk_messages_sender FOREIGN KEY (sender_id) REFERENCES app_users(id) ON DELETE CASCADE,
    CONSTRAINT fk_messages_receiver FOREIGN KEY (receiver_id) REFERENCES app_users(id) ON DELETE CASCADE,
    CONSTRAINT chk_messages_content_not_blank CHECK (length(trim(content)) > 0),
    CONSTRAINT chk_messages_distinct_users CHECK (sender_id <> receiver_id)
);

CREATE INDEX idx_messages_item_created_at ON messages(item_id, created_at);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_receiver ON messages(receiver_id);

INSERT INTO categories (name, slug, description) VALUES
    ('Roupas', 'roupas', 'Pecas de vestuario em bom estado para circular de novo.'),
    ('Moveis', 'moveis', 'Moveis residenciais e corporativos para doacao ou troca.'),
    ('Eletronicos', 'eletronicos', 'Aparelhos, acessorios e pequenos eletronicos funcionais.'),
    ('Livros', 'livros', 'Livros, apostilas e materiais de estudo.'),
    ('Casa', 'casa', 'Utensilios, decoracao e objetos domesticos.')
ON CONFLICT (slug) DO NOTHING;
