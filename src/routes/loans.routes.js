import { Router } from 'express';

import * as loansService from '../services/loans.service.js';

const router = Router();

// GET /api/loans
router.get('/', (req, res) => {
  res.json(loansService.listLoans());
});

// POST /api/loans
router.post('/', async (req, res) => {
  const loan = await loansService.createLoan(req.body ?? {});

  res.status(201).json(loan);
});

export default router;
