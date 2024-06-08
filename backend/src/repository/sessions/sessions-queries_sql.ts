import { Sql } from "postgres";

export const createSessionQuery = `-- name: CreateSession :one
INSERT INTO sessions (telegram_id, session_token, expires_at)
VALUES ($1, $2, $3)
ON CONFLICT (telegram_id) DO UPDATE SET session_token = $2, expires_at = $3
RETURNING id, telegram_id, session_token, created_at, expires_at`;

export interface CreateSessionArgs {
    telegramId: string | null;
    sessionToken: string | null;
    expiresAt: Date | null;
}

export interface CreateSessionRow {
    id: number;
    telegramId: string | null;
    sessionToken: string | null;
    createdAt: Date | null;
    expiresAt: Date | null;
}

export async function createSession(sql: Sql, args: CreateSessionArgs): Promise<CreateSessionRow | null> {
    const rows = await sql.unsafe(createSessionQuery, [args.telegramId, args.sessionToken, args.expiresAt]).values();
    if (rows.length !== 1) {
        return null;
    }
    const row = rows[0];
    return {
        id: row[0],
        telegramId: row[1],
        sessionToken: row[2],
        createdAt: row[3],
        expiresAt: row[4]
    };
}

export const getSessionByTokenQuery = `-- name: GetSessionByToken :one
SELECT id, telegram_id, session_token, created_at, expires_at FROM sessions WHERE session_token = $1 order by id desc limit 1`;

export interface GetSessionByTokenArgs {
    sessionToken: string | null;
}

export interface GetSessionByTokenRow {
    id: number;
    telegramId: string | null;
    sessionToken: string | null;
    createdAt: Date | null;
    expiresAt: Date | null;
}

export async function getSessionByToken(sql: Sql, args: GetSessionByTokenArgs): Promise<GetSessionByTokenRow | null> {
    const rows = await sql.unsafe(getSessionByTokenQuery, [args.sessionToken]).values();
    if (rows.length !== 1) {
        return null;
    }
    const row = rows[0];
    return {
        id: row[0],
        telegramId: row[1],
        sessionToken: row[2],
        createdAt: row[3],
        expiresAt: row[4]
    };
}

export const deleteSessionByTelegramIDQuery = `-- name: DeleteSessionByTelegramID :exec
DELETE FROM sessions WHERE telegram_id = $1`;

export interface DeleteSessionByTelegramIDArgs {
    telegramId: string | null;
}

export async function deleteSessionByTelegramID(sql: Sql, args: DeleteSessionByTelegramIDArgs): Promise<void> {
    await sql.unsafe(deleteSessionByTelegramIDQuery, [args.telegramId]);
}

