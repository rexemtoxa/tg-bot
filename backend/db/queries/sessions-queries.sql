-- name: CreateSession :one
INSERT INTO sessions (telegram_id, session_token, expires_at)
VALUES ($1, $2, NOW() + INTERVAL '1 day')
ON CONFLICT (telegram_id) DO UPDATE SET session_token = $2, expires_at = NOW() + INTERVAL '1 day'
RETURNING *;

-- name: GetSessionByToken :one
SELECT * FROM sessions WHERE session_token = $1 order by id desc limit 1;

-- name: DeleteSessionByTelegramID :exec
DELETE FROM sessions WHERE telegram_id = $1;

-- name: SaveTempToken :one
INSERT INTO verification_codes (telegram_id, code) VALUES ($1, $2) ON CONFLICT (telegram_id) DO UPDATE SET code = $2, expires_at = NOW() + INTERVAL '1 day' RETURNING *;

-- name: GetTempTokeByTelegramID :one
SELECT * FROM verification_codes WHERE telegram_id = $1;

-- name: DeleteTempTokenByTelegramID :exec
DELETE FROM verification_codes WHERE telegram_id = $1;