CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    telegram_id TEXT UNIQUE,
    first_name TEXT,
    password TEXT,
    token TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
