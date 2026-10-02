// Transaction endpoints provide ownership-scoped CRUD plus flexible history filtering.
import { Router } from 'express';
import prisma from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { validateTransaction } from '../utils/validation.js';
import { transactionForClient } from '../utils/serializers.js';

const router = Router();
router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    const { search = '', type = 'all', category = 'all', startDate, endDate, sort = 'date_desc', page = 1, limit = 8 } = req.query;
    const where = { userId: req.user.id };
    if (search) where.title = { contains: search, mode: 'insensitive' };
    if (type !== 'all') where.type = type;
    if (category !== 'all') where.category = category;
    if (startDate || endDate) where.transactionDate = { ...(startDate && { gte: new Date(startDate) }), ...(endDate && { lte: new Date(`${endDate}T23:59:59`) }) };
    // “Newest first” means most recently added, even if its selected transaction date is older.
    const orderMap = { date_desc: [{ createdAt: 'desc' }], date_asc: [{ createdAt: 'asc' }], amount_desc: [{ amount: 'desc' }, { createdAt: 'desc' }], amount_asc: [{ amount: 'asc' }, { createdAt: 'desc' }] };
    const safeSort = orderMap[sort] || orderMap.date_desc;
    const safeLimit = Math.min(Math.max(Number(limit) || 8, 1), 50);
    const safePage = Math.max(Number(page) || 1, 1);
    const [total, transactions] = await prisma.$transaction([prisma.transaction.count({ where }), prisma.transaction.findMany({ where, orderBy: safeSort, take: safeLimit, skip: (safePage - 1) * safeLimit })]);
    res.json({ transactions: transactions.map(transactionForClient), total, page: safePage, pages: Math.max(1, Math.ceil(total / safeLimit)) });
  } catch (error) { next(error); }
});

router.post('/', async (req, res, next) => {
  try {
    const message = validateTransaction(req.body);
    if (message) return res.status(400).json({ message });
    const { title, amount, type, category, other_details, transaction_date, payment_method } = req.body;
    const transaction = await prisma.transaction.create({ data: { userId: req.user.id, title: title.trim(), amount, type, category, otherDetails: category === 'Other' ? other_details?.trim() || null : null, transactionDate: new Date(transaction_date), paymentMethod: payment_method.replaceAll(' ', '_') } });
    // Return a non-blocking alert when a new expense has crossed its current monthly category budget.
    let budgetAlert = null;
    if (type === 'expense') {
      // An optional alert must never prevent a valid expense from being recorded.
      try {
        // Budgets are month-specific, so compare this expense with its matching category/month limit.
        const transactionMonth = transaction.transactionDate.getMonth() + 1;
        const budget = await prisma.budget.findFirst({ where: { userId: req.user.id, category, budgetMonth: transactionMonth } });
        if (budget) {
          const monthStart = new Date(transaction.transactionDate.getFullYear(), transaction.transactionDate.getMonth(), 1);
          const totals = await prisma.transaction.aggregate({ where: { userId: req.user.id, category, type: 'expense', transactionDate: { gte: monthStart } }, _sum: { amount: true } });
          const spent = Number(totals._sum.amount || 0); const limit = Number(budget.monthlyLimit);
          // The immediate in-app alert follows the same 80% warning / 100% danger thresholds as the budget cards.
          const percent = Math.round(spent / limit * 100);
          if (percent >= 80) budgetAlert = { category, spent, limit, percent, level: percent >= 100 ? 'danger' : 'warning' };
        }
      } catch (alertError) { console.warn('Budget alert skipped:', alertError.message); }
    }
    res.status(201).json({ ...transactionForClient(transaction), budgetAlert });
  } catch (error) { next(error); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const message = validateTransaction(req.body);
    if (message) return res.status(400).json({ message });
    const { title, amount, type, category, other_details, transaction_date, payment_method } = req.body;
    const found = await prisma.transaction.findFirst({ where: { id: Number(req.params.id), userId: req.user.id } });
    if (!found) return res.status(404).json({ message: 'Transaction was not found.' });
    const transaction = await prisma.transaction.update({ where: { id: found.id }, data: { title: title.trim(), amount, type, category, otherDetails: category === 'Other' ? other_details?.trim() || null : null, transactionDate: new Date(transaction_date), paymentMethod: payment_method.replaceAll(' ', '_') } });
    res.json(transactionForClient(transaction));
  } catch (error) { next(error); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const result = await prisma.transaction.deleteMany({ where: { id: Number(req.params.id), userId: req.user.id } });
    if (!result.count) return res.status(404).json({ message: 'Transaction was not found.' });
    res.json({ message: 'Transaction deleted.' });
  } catch (error) { next(error); }
});

export default router;
