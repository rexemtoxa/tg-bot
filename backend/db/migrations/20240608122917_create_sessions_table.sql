-- migrate:up
CREATE TABLE sessions (
    id SERIAL PRIMARY KEY,
    telegram_id TEXT UNIQUE,
    session_token TEXT UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP
);

-- migrate:down

