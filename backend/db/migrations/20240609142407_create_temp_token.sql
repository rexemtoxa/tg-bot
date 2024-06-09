-- migrate:up
CREATE TABLE IF NOT EXISTS verification_codes (
    telegram_id TEXT PRIMARY KEY,
    code TEXT NOT NULL,
    expires_at TIMESTAMP NOT NULL default (NOW() + INTERVAL '1 day')
);


-- migrate:down

