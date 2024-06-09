import express from 'express';
import { auth } from '../middleware/auth';
import { deleteSessionByTelegramID, saveTempToken } from '../repository/sessions/sessions-queries_sql';
import { getUserByTelegramID, saveUserPassword, updateUserToken } from '../repository/users/users-queries_sql';
import { client } from '../utils/db';
import { generateToken } from '../utils/token';
import { generateSession, validateTempToken, validateUserAndToken } from './token-validation';

const router = express.Router();

router.post('/signup', async (req, res) => {
  const { telegramID, password, token } = req.body;
  try {
    await saveUserPassword(client, { telegramId: telegramID, password: password });
    await updateUserToken(client, { telegramId: telegramID, token: token });
    res.status(200).json({ success: true });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Database error' });
  }
});

router.post('/login', async (req, res) => {
  const { telegramID, password } = req.body;
  try {
    const user = await getUserByTelegramID(client, { telegramId: telegramID });
    if (user === null) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    if (user.password === password) {
      const { token, hash } = generateToken();
      await saveTempToken(client, { telegramId: telegramID, code: hash });
      return res.status(200).json({
        telegramID: user.telegramId,
        tempToken: token,
      });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

router.post('/verify-token', async (req, res) => {
  const { telegramID, token, tempToken } = req.body;
  if (!telegramID || !token || !tempToken) {
    return res.status(400).json({ error: 'Invalid request' });
  }

  try {
    const user = await validateUserAndToken(telegramID, token);
    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const tempTokenHash = await validateTempToken(telegramID, tempToken);
    if (!tempTokenHash) {
      return res.status(401).json({ error: 'Invalid temp token' });
    }

    const { sessionToken, expires } = await generateSession(telegramID);

    res.cookie('session', sessionToken, { httpOnly: true, secure: true, expires });
    return res.status(200).json({
      telegramID: user.telegramId,
      createdAt: user.createdAt,
    });
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

router.post('/logout', auth, async (req, res) => {
  const { telegramID } = req.context;
  try {
    await deleteSessionByTelegramID(client, { telegramId: telegramID });
    res.clearCookie('session');
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

export default router;
