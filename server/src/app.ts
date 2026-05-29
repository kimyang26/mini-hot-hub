import cors from 'cors';
import express from 'express';
import { hotRouter } from './routes/hot';
import { env } from './utils/env';

export const app = express();

app.use(
  cors({
    origin: env.CLIENT_ORIGIN,
  }),
);
app.use(express.json());

app.get('/api/health', (_request, response) => {
  response.json({ ok: true });
});

app.use('/api/hot', hotRouter);
