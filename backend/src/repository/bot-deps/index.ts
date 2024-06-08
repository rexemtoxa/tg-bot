import { DataBaseDeps } from '../../bot';
import { createUser, CreateUserRow, getUserByTelegramID, GetUserByTelegramIDRow } from '../users/users-queries_sql';
import postgres from 'postgres'

export const getBotDeps = (sql: postgres.Sql<{}>): DataBaseDeps => {
  return {
    createUser: async (args: { telegramId: string, firstName: string }): Promise<CreateUserRow | null> => {
      return await createUser(sql, args);
    },
    getUserByTelegramID: async (args: { telegramId: string }): Promise<GetUserByTelegramIDRow | null> => {
      return await getUserByTelegramID(sql, args);
    }
  }
}