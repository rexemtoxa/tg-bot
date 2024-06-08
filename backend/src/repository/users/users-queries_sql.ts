import { Sql } from "postgres";

export const createUserQuery = `-- name: CreateUser :one
INSERT INTO users (telegram_id, first_name)
VALUES ($1, $2)
RETURNING id, telegram_id, first_name, password, token, created_at`;

export interface CreateUserArgs {
    telegramId: string | null;
    firstName: string | null;
}

export interface CreateUserRow {
    id: number;
    telegramId: string | null;
    firstName: string | null;
    password: string | null;
    token: string | null;
    createdAt: Date | null;
}

export async function createUser(sql: Sql, args: CreateUserArgs): Promise<CreateUserRow | null> {
    const rows = await sql.unsafe(createUserQuery, [args.telegramId, args.firstName]).values();
    if (rows.length !== 1) {
        return null;
    }
    const row = rows[0];
    return {
        id: row[0],
        telegramId: row[1],
        firstName: row[2],
        password: row[3],
        token: row[4],
        createdAt: row[5]
    };
}

export const getUserByTelegramIDQuery = `-- name: GetUserByTelegramID :one
SELECT id, telegram_id, first_name, password, token, created_at FROM users WHERE telegram_id = $1`;

export interface GetUserByTelegramIDArgs {
    telegramId: string | null;
}

export interface GetUserByTelegramIDRow {
    id: number;
    telegramId: string | null;
    firstName: string | null;
    password: string | null;
    token: string | null;
    createdAt: Date | null;
}

export async function getUserByTelegramID(sql: Sql, args: GetUserByTelegramIDArgs): Promise<GetUserByTelegramIDRow | null> {
    const rows = await sql.unsafe(getUserByTelegramIDQuery, [args.telegramId]).values();
    if (rows.length !== 1) {
        return null;
    }
    const row = rows[0];
    return {
        id: row[0],
        telegramId: row[1],
        firstName: row[2],
        password: row[3],
        token: row[4],
        createdAt: row[5]
    };
}

export const updateUserTokenQuery = `-- name: UpdateUserToken :exec
UPDATE users SET token = $2 WHERE telegram_id = $1`;

export interface UpdateUserTokenArgs {
    telegramId: string | null;
    token: string | null;
}

export async function updateUserToken(sql: Sql, args: UpdateUserTokenArgs): Promise<void> {
    await sql.unsafe(updateUserTokenQuery, [args.telegramId, args.token]);
}

export const saveUserPasswordQuery = `-- name: SaveUserPassword :exec
UPDATE users SET password = $2 WHERE telegram_id = $1`;

export interface SaveUserPasswordArgs {
    telegramId: string | null;
    password: string | null;
}

export async function saveUserPassword(sql: Sql, args: SaveUserPasswordArgs): Promise<void> {
    await sql.unsafe(saveUserPasswordQuery, [args.telegramId, args.password]);
}

