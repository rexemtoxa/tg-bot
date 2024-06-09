CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    telegram_id TEXT UNIQUE,
    first_name TEXT,
    password TEXT,
    token TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sessions (
    id SERIAL PRIMARY KEY,
    telegram_id TEXT UNIQUE,
    session_token TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS verification_codes (
    telegram_id TEXT PRIMARY KEY,
    code TEXT NOT NULL,
    expires_at TIMESTAMP NOT NULL default (NOW() + INTERVAL '1 day')
);
