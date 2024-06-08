-- queries/users.sql

-- name: CreateUser :one
INSERT INTO users (telegram_id, first_name)
VALUES ($1, $2)
RETURNING *;

-- name: GetUserByTelegramID :one
SELECT * FROM users WHERE telegram_id = $1;

-- name: UpdateUserToken :exec
UPDATE users SET token = $2 WHERE telegram_id = $1;

-- name: SaveUserPassword :exec
UPDATE users SET password = $2 WHERE telegram_id = $1;
