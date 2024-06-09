import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import authRoutes from './routes/auth';
import userRoutes from './routes/user';

dotenv.config();

const app = express();
const port = 3000;

app.use(express.json());
app.use(cookieParser());

const staticPath = process.env.PATH_TO_STATIC || path.join(__dirname, '../../frontend/public');
app.use(express.static(staticPath));

app.use('/api', authRoutes);
app.use('/api', userRoutes);

app.get('*', (req, res) => {
  res.sendFile(staticPath + '/index.html');
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
