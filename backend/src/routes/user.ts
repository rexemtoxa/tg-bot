import express from 'express';
import { auth } from '../middleware/auth';
import { getUserByTelegramID } from '../repository/users/users-queries_sql';
import { client } from '../utils/db';

const router = express.Router();

router.get('/user', auth, async (req, res) => {
  const { telegramID } = req.context;
  try {
    const user = await getUserByTelegramID(client, { telegramId: telegramID });
    if (user === null) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(200).json({
      telegramID: user.telegramId,
      createdAt: user.createdAt,
    });
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

export default router;
