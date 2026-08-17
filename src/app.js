import express from 'express';

import booksRouter from './routes/books.routes.js';
import loansRouter from './routes/loans.routes.js';
import { errorHandler, notFound } from './middlewares/errorHandler.js';

export function createApp() {
  const app = express();

  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/api/books', booksRouter);
  app.use('/api/loans', loansRouter);

  app.use(express.json());

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
