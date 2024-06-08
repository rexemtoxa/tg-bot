-- migrate:up
ALTER TABLE users
ADD COLUMN if NOT EXISTS created_at TIMESTAMP DEFAULT NOW(),
ADD COLUMN if NOT EXISTS password TEXT,
ADD COLUMN if NOT EXISTS token TEXT;

-- migrate:down

