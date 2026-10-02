// Application bootstrap wires HTTP middleware, API routes, and database error handling together.
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import transactionRoutes from './routes/transactions.js';
import budgetRoutes from './routes/budgets.js';
import dashboardRoutes from './routes/dashboard.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

dotenv.config();
if (!process.env.JWT_SECRET || !process.env.DATABASE_URL) console.warn('Missing DATABASE_URL or JWT_SECRET: configure server/.env before using the API.');
const app = express();
// Vite may select 5173, 5174, or another free localhost port during development.
// Permit only local development origins plus the explicit configured production client URL.
app.use(cors({ origin: (origin, callback) => {
  const isLocalVite = !origin || /^http:\/\/localhost:\d+$/.test(origin);
  const isConfiguredClient = origin === process.env.CLIENT_URL;
  callback(null, isLocalVite || isConfiguredClient);
} }));
app.use(express.json({ limit: '100kb' }));
app.get('/api/health/:id', (req, res) => res.json({ status: 'ok' }));
app.use('/api/auth/:id', authRoutes);
app.use('/api/transactions/:id', transactionRoutes);
app.use('/api/budgets/:id', budgetRoutes);
app.use('/api/dashboard/:id', dashboardRoutes);
app.use(notFound);
app.use(errorHandler);
app.listen(process.env.PORT || 5000, () => console.log(`FinanceFlow API running on port ${process.env.PORT || 5000}`));
