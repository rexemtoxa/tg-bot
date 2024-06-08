-- migrate:up
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    telegram_id VARCHAR(255) UNIQUE,
    first_name TEXT
)

-- migrate:down

