// PostgreSQL helper keeps the budget table compatible when Prisma's generated client is temporarily stale on Windows.
// Prisma remains the application's ORM for users and transactions; this helper automatically upgrades only the budget table.
import pg from 'pg';

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
let preparation;

export async function prepareBudgetTable() {
  // Share one preparation promise so concurrent first requests cannot run the migration twice.
  if (!preparation) {
    preparation = (async () => {
      await pool.query('ALTER TABLE budgets ADD COLUMN IF NOT EXISTS other_details VARCHAR(160)');
      await pool.query('ALTER TABLE budgets ADD COLUMN IF NOT EXISTS budget_month INTEGER NOT NULL DEFAULT 1');
      // The original one-category-per-user rule must be replaced to allow a different limit each month.
      await pool.query('ALTER TABLE budgets DROP CONSTRAINT IF EXISTS budgets_user_id_category_key');
      // Older Prisma versions created the same rule as a standalone unique index instead of a constraint.
      await pool.query('DROP INDEX IF EXISTS budgets_user_id_category_key');
      await pool.query('CREATE UNIQUE INDEX IF NOT EXISTS budgets_user_category_month_key ON budgets (user_id, category, budget_month)');
    })().catch((error) => { preparation = undefined; throw error; });
  }
  return preparation;
}

// Dashboard progress uses the same PostgreSQL records as the Budgets page, without relying on a stale generated Prisma type.
export async function getBudgetProgress(userId, month, year) {
  await prepareBudgetTable();
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 1);
  const { rows } = await pool.query(
    `SELECT b.id, b.category, b.other_details, b.monthly_limit,
       COALESCE(SUM(t.amount), 0) AS spent
     FROM budgets b
     LEFT JOIN transactions t ON t.user_id = b.user_id
       AND t.category = b.category
       AND t.type = 'expense'
       AND t.transaction_date >= $3
       AND t.transaction_date < $4
     WHERE b.user_id = $1 AND b.budget_month = $2
     GROUP BY b.id, b.category, b.other_details, b.monthly_limit
     ORDER BY b.category ASC`,
    [userId, month, monthStart, monthEnd]
  );
  return rows.map(item => {
    const monthlyLimit = Number(item.monthly_limit);
    const spent = Number(item.spent);
    return { id: item.id, category: item.category, other_details: item.other_details || '', monthly_limit: monthlyLimit, spent, percent: Math.round(spent / monthlyLimit * 100) };
  });
}

export { pool };
