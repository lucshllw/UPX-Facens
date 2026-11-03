CREATE TABLE favorites (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    item_id BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_favorites_user FOREIGN KEY (user_id) REFERENCES app_users(id) ON DELETE CASCADE,
    CONSTRAINT fk_favorites_item FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
    CONSTRAINT uq_favorites_user_item UNIQUE (user_id, item_id)
);

CREATE INDEX idx_favorites_user_created_at ON favorites(user_id, created_at DESC);
CREATE INDEX idx_favorites_item ON favorites(item_id);

CREATE TABLE reservations (
    id BIGSERIAL PRIMARY KEY,
    item_id BIGINT NOT NULL,
    requester_id BIGINT NOT NULL,
    owner_id BIGINT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    note VARCHAR(500),
    reserved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    decided_at TIMESTAMPTZ,
    CONSTRAINT fk_reservations_item FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
    CONSTRAINT fk_reservations_requester FOREIGN KEY (requester_id) REFERENCES app_users(id) ON DELETE CASCADE,
    CONSTRAINT fk_reservations_owner FOREIGN KEY (owner_id) REFERENCES app_users(id) ON DELETE CASCADE,
    CONSTRAINT chk_reservations_status CHECK (status IN ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED')),
    CONSTRAINT chk_reservations_distinct_users CHECK (requester_id <> owner_id)
);

CREATE UNIQUE INDEX uq_active_reservation_per_item
    ON reservations(item_id)
    WHERE status IN ('PENDING', 'CONFIRMED');

CREATE INDEX idx_reservations_requester_created_at ON reservations(requester_id, reserved_at DESC);
CREATE INDEX idx_reservations_owner_created_at ON reservations(owner_id, reserved_at DESC);
CREATE INDEX idx_reservations_status ON reservations(status);

CREATE TABLE impact_metrics (
    id BIGSERIAL PRIMARY KEY,
    item_id BIGINT,
    user_id BIGINT,
    metric_date DATE NOT NULL DEFAULT CURRENT_DATE,
    metric_type VARCHAR(40) NOT NULL,
    kg_diverted NUMERIC(10, 2) NOT NULL DEFAULT 0,
    items_recircled INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_impact_metrics_item FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE SET NULL,
    CONSTRAINT fk_impact_metrics_user FOREIGN KEY (user_id) REFERENCES app_users(id) ON DELETE SET NULL,
    CONSTRAINT chk_impact_metrics_type CHECK (metric_type IN ('PUBLISHED', 'RESERVED', 'COMPLETED', 'MANUAL')),
    CONSTRAINT chk_impact_metrics_non_negative CHECK (kg_diverted >= 0 AND items_recircled >= 0)
);

CREATE INDEX idx_impact_metrics_date ON impact_metrics(metric_date DESC);
CREATE INDEX idx_impact_metrics_item ON impact_metrics(item_id);
CREATE INDEX idx_impact_metrics_user ON impact_metrics(user_id);
CREATE INDEX idx_impact_metrics_type ON impact_metrics(metric_type);
