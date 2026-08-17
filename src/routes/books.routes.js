import { Router } from 'express';

import * as booksService from '../services/books.service.js';
import { validateBook } from '../middlewares/validateBook.js';
import { HttpError } from '../lib/httpError.js';

const router = Router();

// GET /api/books?page=1&limit=5&q=zola
router.get('/', async (req, res, next) => {
  try {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 5);
    const result = await booksService.listBooks({ page, limit, q: req.query.q });

    res.json(result);
  } catch (err) {
    next(err);
  }
});

// GET /api/books/available
router.get('/available', async (req, res, next) => {
  try {
    const books = await booksService.listAvailableBooks();

    res.json(books);
  } catch (err) {
    next(err);
  }
});

// GET /api/books/:id
router.get('/:id', async (req, res, next) => {
  try {
    const book = await booksService.getBookById(req.params.id);

    if (!book) {
      throw new HttpError(404, `Livre ${req.params.id} introuvable`);
    }

    res.json(book);
  } catch (err) {
    next(err);
  }
});

// POST /api/books
router.post('/', validateBook, async (req, res, next) => {
  try {
    const book = await booksService.createBook(req.body);

    res.status(201).json(book);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/books/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const deleted = await booksService.deleteBook(req.params.id);

    if (!deleted) {
      throw new HttpError(404, `Livre ${req.params.id} introuvable`);
    }

    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
