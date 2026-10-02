// Budget endpoints automatically save limits per category and month, then calculate spending progress.
import { Router } from 'express';
import prisma from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { CATEGORIES } from '../utils/validation.js';
import { pool, prepareBudgetTable } from '../utils/budgetStorage.js';

const MAX_BUDGET_LIMIT = 9999999999.99;
const router = Router();

router.use(requireAuth);
router.use(async (req, res, next) => {
  try { await prepareBudgetTable(); next(); } catch (error) { next(error); }
});

const selectedMonthFrom = value => Math.min(Math.max(Number(value) || new Date().getMonth() + 1, 1), 12);

router.get('/', async (req, res, next) => {
  try {
    // The month picker controls saving; the list deliberately shows every saved monthly budget.
    const { rows: budgets } = await pool.query(
      'SELECT id, category, other_details, budget_month, monthly_limit FROM budgets WHERE user_id = $1 ORDER BY budget_month ASC, category ASC',
      [req.user.id]
    );
    const { rows: spending } = await pool.query(
      `SELECT category, EXTRACT(MONTH FROM transaction_date)::integer AS budget_month, COALESCE(SUM(amount), 0) AS spent
       FROM transactions WHERE user_id = $1 AND type = 'expense'
       GROUP BY category, EXTRACT(MONTH FROM transaction_date)`,
      [req.user.id]
    );
    const spentByBudget = new Map(spending.map(item => [`${item.category}:${item.budget_month}`, Number(item.spent)]));
    res.json(budgets.map(item => ({ ...item, other_details: item.other_details || '', monthly_limit: Number(item.monthly_limit), spent: spentByBudget.get(`${item.category}:${item.budget_month}`) || 0 })));
  } catch (error) { next(error); }
});

router.post('/', async (req, res, next) => {
  try {
    const { category, other_details, budget_month, monthly_limit } = req.body;
    const month = Number(budget_month);
    const limit = Number(monthly_limit);
    if (!CATEGORIES.includes(category)) return res.status(400).json({ message: 'Please choose a valid budget category.' });
    if (!Number.isInteger(month) || month < 1 || month > 12) return res.status(400).json({ message: 'Please choose a valid budget month.' });
    if (!Number.isFinite(limit) || limit < 0.01) return res.status(400).json({ message: 'Monthly limit must be greater than $0.01.' });
    if (limit > MAX_BUDGET_LIMIT) return res.status(400).json({ message: 'Monthly limit cannot exceed $9,999,999,999.99.' });
    const details = category === 'Other' ? other_details?.trim() || null : null;
    const { rows } = await pool.query(
      `INSERT INTO budgets (user_id, category, other_details, budget_month, monthly_limit)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, category, budget_month)
       DO UPDATE SET monthly_limit = EXCLUDED.monthly_limit, other_details = EXCLUDED.other_details
       RETURNING id, category, other_details, budget_month, monthly_limit`,
      [req.user.id, category, details, month, limit]
    );
    const budget = rows[0];
    res.status(201).json({ ...budget, other_details: budget.other_details || '', monthly_limit: Number(budget.monthly_limit) });
  } catch (error) { next(error); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM budgets WHERE id = $1 AND user_id = $2', [Number(req.params.id), req.user.id]);
    if (!rowCount) return res.status(404).json({ message: 'Budget was not found.' });
    res.json({ message: 'Budget removed.' });
  } catch (error) { next(error); }
});

export default router;
