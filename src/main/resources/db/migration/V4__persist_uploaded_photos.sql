-- Optional SQL media store for small deployments with ephemeral application disks.
CREATE TABLE uploaded_photos (
    name VARCHAR(64) PRIMARY KEY,
    content BYTEA NOT NULL,
    CONSTRAINT chk_uploaded_photo_size CHECK (octet_length(content) BETWEEN 1 AND 8388608)
);
