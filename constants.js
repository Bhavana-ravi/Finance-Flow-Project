// Shared option lists ensure every form sends category and payment values accepted by the API.
export const CATEGORIES = ['Food', 'Rent', 'Salary', 'Utilities', 'Entertainment', 'Transport', 'Shopping', 'Health', 'Other'];
export const PAYMENT_METHODS = ['Cash', 'Credit Card', 'UPI', 'Bank Transfer'];
// All displayed monetary values use US dollars with comma grouping and two decimal places.
export const money = (value) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value));
