-- name: CreateSession :one
INSERT INTO sessions (telegram_id, session_token, expires_at)
VALUES ($1, $2, $3)
ON CONFLICT (telegram_id) DO UPDATE SET session_token = $2, expires_at = $3
RETURNING *;

-- name: GetSessionByToken :one
SELECT * FROM sessions WHERE session_token = $1 order by id desc limit 1;

-- name: DeleteSessionByTelegramID :exec
DELETE FROM sessions WHERE telegram_id = $1;
