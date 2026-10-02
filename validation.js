// Small reusable validation helpers make error messages predictable without extra libraries.
export const CATEGORIES = ['Food', 'Rent', 'Salary', 'Utilities', 'Entertainment', 'Transport', 'Shopping', 'Health', 'Other'];
export const PAYMENT_METHODS = ['Cash', 'Credit Card', 'UPI', 'Bank Transfer'];
// PostgreSQL Decimal(12,2) supports a maximum of $9,999,999,999.99 per transaction.
export const MAX_TRANSACTION_AMOUNT = 9999999999.99;

export function validateTransaction(data) {
  const { title, amount, type, category, transaction_date, payment_method } = data;
  if (!title?.trim()) return 'A transaction title is required.';
  if (!Number.isFinite(Number(amount)) || Number(amount) < 0.01) return 'Amount must be greater than $0.01.';
  if (Number(amount) > MAX_TRANSACTION_AMOUNT) return 'Amount cannot exceed $9,999,999,999.99 per transaction.';
  if (!['income', 'expense'].includes(type)) return 'Type must be income or expense.';
  if (!CATEGORIES.includes(category)) return 'Please select a valid category.';
  if (!PAYMENT_METHODS.includes(payment_method)) return 'Please select a valid payment method.';
  if (!transaction_date || Number.isNaN(Date.parse(transaction_date))) return 'Please provide a valid date.';
  return null;
}
