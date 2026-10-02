// API serializers keep the existing frontend response shape while Prisma uses ergonomic camelCase fields.
export function transactionForClient(transaction) {
  return { ...transaction, amount: Number(transaction.amount), other_details: transaction.otherDetails || '', transaction_date: transaction.transactionDate.toISOString().slice(0, 10), payment_method: transaction.paymentMethod.replaceAll('_', ' ') };
}
