// Dashboard aggregates are calculated with Prisma data, avoiding handwritten SQL entirely.
import { Router } from 'express';
import prisma from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { transactionForClient } from '../utils/serializers.js';
import { getBudgetProgress } from '../utils/budgetStorage.js';

const router = Router();
router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const currentMonth = new Date().getMonth() + 1;
    const [income, expenses, groupedExpenses, transactions, recent] = await Promise.all([
      prisma.transaction.aggregate({ where: { userId, type: 'income' }, _sum: { amount: true } }),
      prisma.transaction.aggregate({ where: { userId, type: 'expense' }, _sum: { amount: true } }),
      prisma.transaction.groupBy({ by: ['category'], where: { userId, type: 'expense' }, _sum: { amount: true }, orderBy: { _sum: { amount: 'desc' } } }),
      prisma.transaction.findMany({ where: { userId }, select: { type: true, amount: true, transactionDate: true } }),
      prisma.transaction.findMany({ where: { userId }, orderBy: [{ transactionDate: 'desc' }, { id: 'desc' }], take: 5 })
    ]);
    const incomeTotal = Number(income._sum.amount || 0);
    const expenseTotal = Number(expenses._sum.amount || 0);
    const now = new Date();
    const flow = Array.from({ length: 6 }, (_, index) => {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - 5 + index, 1);
      return { month: monthDate.toLocaleString('en-US', { month: 'short' }), year: monthDate.getFullYear(), monthNumber: monthDate.getMonth(), income: 0, expenses: 0 };
    });
    transactions.forEach(item => {
      const date = new Date(item.transactionDate);
      const bucket = flow.find(month => month.year === date.getFullYear() && month.monthNumber === date.getMonth());
      if (bucket) bucket[item.type === 'income' ? 'income' : 'expenses'] += Number(item.amount);
    });
    const budgetProgress = await getBudgetProgress(userId, currentMonth, now.getFullYear());
    res.json({ summary: { income: incomeTotal, expenses: expenseTotal, balance: incomeTotal - expenseTotal }, breakdown: groupedExpenses.map(item => ({ category: item.category, amount: Number(item._sum.amount || 0) })), flow: flow.map(({ month, income: monthlyIncome, expenses: monthlyExpenses }) => ({ month, income: monthlyIncome, expenses: monthlyExpenses })), recent: recent.map(transactionForClient), budgetProgress });
  } catch (error) { next(error); }
});

export default router;
