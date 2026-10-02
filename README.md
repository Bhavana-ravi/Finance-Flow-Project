# FinanceFlow — Smart Finance & Budgeting Dashboard

FinanceFlow is a full-stack personal-finance web application. In simple words: a user creates an account, adds income and expenses, sets monthly spending limits, and uses the dashboard to understand their money.

The project uses React for the screens, Node.js/Express for the API, PostgreSQL for data storage, and Prisma for automatic database table management.

## What the application can do

- Create an account and sign in securely.
- Show/hide passwords; registration checks that password and confirm password match.
- Save passwords securely with bcrypt hashing. Plain passwords are never stored in PostgreSQL.
- Create a JWT token after login. The frontend saves it locally and Axios sends it automatically for protected requests.
- Add income and expense transactions with title, amount, type, category, optional Other-category detail, date, and payment method.
- Edit or delete transactions directly from the transaction list.
- Format transaction amounts with commas and stop invalid amounts below `$0.01` or above `$9,999,999,999.99`.
- Search, filter, sort, and paginate the transaction history.
- Create one budget per category per month. For example, Food can have separate April and September limits.
- Edit a saved budget inside its own budget card or delete it.
- Calculate actual expense spending against every saved budget.
- Show a yellow **Near limit** warning from 80% to 99% used and a red **Over budget** state at 100% or higher.
- Show detailed budget-alert popups on the Budget and Overview pages.
- Show a spending breakdown doughnut chart and a six-month income-versus-expense chart.
- Use the sidebar **Add transaction** action from any page. It navigates to Overview, opens the form, and returns the page to the top.

## Technology used

| Part | Technology | What it does |
| --- | --- | --- |
| Frontend | React + Vite | Builds the website screens quickly. |
| Navigation | React Router | Switches between Login, Overview, Transactions, Budgets, and About. |
| Styling | CSS | Creates the responsive cards, gradients, sidebar, forms, and alerts. |
| Charts | Recharts | Draws the spending pie chart and cash-flow line chart. |
| API calls | Axios | Talks to the backend and automatically attaches the JWT token. |
| Backend | Node.js + Express | Validates requests and provides REST API routes. |
| Database | PostgreSQL | Stores users, transactions, and budgets. |
| ORM | Prisma | Creates Prisma models and handles User/Transaction database operations. |
| Security | bcrypt + JWT | Hashes passwords and protects private user data. |

## How FinanceFlow works

```text
Browser (React)
      |
      | Axios request + JWT token
      v
Express API (Node.js)
      |
      | Prisma ORM / safe PostgreSQL helper
      v
PostgreSQL database
      |
      v
pgAdmin 4 can display the same tables and records locally
```

### 1. Account creation and login

1. The user enters name, email, and password.
2. The backend checks the input.
3. bcrypt converts the password into a secure hash.
4. PostgreSQL saves the user name, email, password hash, and creation date.
5. The backend returns a JWT token.
6. The browser stores the token in `localStorage`.
7. Axios reads that token and adds it to every protected API request.

If login details are wrong, the user sees: `Username/password do not match.`

### 2. Transactions

When a transaction is saved, React sends it to the API. The API validates it a second time, saves it for only the signed-in user, and returns the result.

The Transactions page calls the API with optional search, filters, sorting, and page number. The API returns a small page of records plus metadata such as `page`, `pages`, and `total`.

### 3. Budgets and alerts

A budget has a category, a month, and a monthly limit. For example:

```text
Food | September | $600.00
```

The app totals expense transactions with the same category and month. It then uses this formula:

```text
percentage used = (amount spent / monthly limit) × 100
```

| Percentage | Result |
| --- | --- |
| 0%–79% | Normal progress bar |
| 80%–99% | Yellow Near limit warning |
| 100% or higher | Red Over budget state |

### 4. Charts and Overview

The dashboard API calculates totals and sends simple prepared data to React:

- Total balance = total income − total expenses.
- Spending breakdown groups all expenses by category.
- Cash flow groups income and expenses for the last six calendar months.
- Recent Activity shows the newest five transactions.
- Smart Budgeting Goals shows current-month budget progress and alert status.

## Database tables

Prisma creates the core database structure from `server/prisma/schema.prisma`.

| Table | Stores |
| --- | --- |
| `users` | Name, email, secure password hash, account creation date. |
| `transactions` | Each user’s income and expense records. |
| `budgets` | Category limits, selected month, optional Other-category details. |

You do **not** need to write `CREATE TABLE` queries yourself. Prisma and the app setup command create/update the tables automatically.

## Prisma and pgAdmin 4

Both are used together, but they do different jobs:

| Tool | Purpose |
| --- | --- |
| Prisma | Used by the backend code to describe database models and perform most database operations. |
| pgAdmin 4 | A local PostgreSQL visual tool. Use it to see tables and data; it does not run the app. |

To see the data in pgAdmin 4:

1. Open pgAdmin 4.
2. Expand **Servers → PostgreSQL → Databases**.
3. Open the database named in `server/.env`, normally `financeflow`.
4. Expand **Schemas → public → Tables**.
5. Right-click a table such as `transactions` → **View/Edit Data → All Rows**.

## How to run the project on Windows

Open this exact folder in VS Code or PowerShell:

```text
C:\Users\BHAVANA R\Documents\Codex\2026-09-21\coding-assignment-smart-finance-budgeting-dashboard-2
```

### Prerequisites

- Node.js 20+ (Node 24 also works).
- PostgreSQL installed and running locally.
- pgAdmin 4 is optional but recommended for viewing the database.

### Step 1: Configure the database

Create `server/.env` from `server/.env.example`. Use your own PostgreSQL password:

```env
PORT=5000
DATABASE_URL=postgresql://postgres:YOUR_POSTGRES_PASSWORD@localhost:5432/financeflow
JWT_SECRET=replace-this-with-a-long-random-private-secret
CLIENT_URL=http://localhost:5173
```

Only the database name at the end of `DATABASE_URL` needs to be chosen by you. The setup command creates it if it does not exist.

### Step 2: Install packages

From the project root, run once:

```powershell
npm install
npm run install:all
```

If npm asks for package install-script approval, run from the `server` folder:

```powershell
npm install-scripts approve --all
```

### Step 3: Create/update PostgreSQL tables automatically

From the project root:

```powershell
npm run db:setup --prefix server
```

This command creates the `financeflow` database when needed and synchronizes tables from Prisma’s schema. No manual SQL is needed.

After changing `server/prisma/schema.prisma`, stop the backend first, then run:

```powershell
npm run db:setup --prefix server
npm run db:generate --prefix server
```

### Step 4: Start backend and frontend

Use **two PowerShell terminals**.

Terminal 1 — backend:

```powershell
cd "C:\Users\BHAVANA R\Documents\Codex\2026-09-21\coding-assignment-smart-finance-budgeting-dashboard-2"
npm run dev --prefix server
```

Keep it open. It must say:

```text
FinanceFlow API running on port 5000
```

Terminal 2 — frontend:

```powershell
cd "C:\Users\BHAVANA R\Documents\Codex\2026-09-21\coding-assignment-smart-finance-budgeting-dashboard-2"
npm run dev --prefix client
```

Open the exact `Local:` address printed by Vite, usually:

```text
http://localhost:5173/
```

Do not use `npm run dev` in the root if Windows reports `spawn cmd.exe ENOENT`; use the two commands above instead.

## Important files and what each one does

### Root

| File/folder | Purpose |
| --- | --- |
| `README.md` | This guide. |
| `package.json` | Root helper scripts and package configuration. |
| `client/` | The React website. |
| `server/` | The Express API, Prisma schema, and database scripts. |

### Frontend: `client/src`

| File/folder | Purpose |
| --- | --- |
| `main.jsx` | Starts React and imports all global styles. |
| `App.jsx` | Defines routes and blocks unauthenticated users from private pages. |
| `api.js` | Creates Axios, reads the saved JWT, and sends it in request headers. |
| `constants.js` | Shared category names, payment methods, and money formatter. |
| `components/Layout.jsx` | Sidebar, profile menu, logout logic, and Add transaction sidebar action. |
| `components/TransactionForm.jsx` | Reusable form for adding/editing transactions and validating amount input. |
| `pages/AuthPage.jsx` | Login and registration screen. |
| `pages/Dashboard.jsx` | Overview cards, budget progress, charts, recent activity, popup alerts, and Add Transaction form. |
| `pages/Transactions.jsx` | Search/filter/sort controls, pagination, delete action, and inline transaction editor. |
| `pages/Budgets.jsx` | Monthly budget form, all saved budget cards, inline budget editor, and popup alerts. |
| `pages/About.jsx` | Simple explanation of FinanceFlow and its main benefits. |
| `styles.css` | Global typography, layout, forms, tables, and reusable UI rules. |
| `dashboard.css` | Extra sizing for Overview cards, charts, and Recent Activity. |
| `transactions.css` | Transaction filters, table, pagination, and inline-edit appearance. |
| `budget-layout.css` | Budget form, cards, and inline budget editor appearance. |
| `budget-alert.css` | Yellow/red popup alert appearance. |
| `layout.css` | Expanded/collapsed sidebar and profile dropdown behavior. |
| `page-gradients.css` | Green-teal gradient styling for Overview, Transactions, and Budgets boxes. |
| `about.css`, `about-scroll.css` | About-page hero, features, responsive layout, and decoration. |

### Backend: `server/src`

| File/folder | Purpose |
| --- | --- |
| `server.js` | Starts Express, enables CORS/JSON, and registers API routes. |
| `db.js` | Creates the reusable Prisma client connection. |
| `routes/auth.js` | Register/login logic, bcrypt hashing, and JWT creation. |
| `routes/transactions.js` | Transaction create/read/update/delete, filtering, sorting, pagination, and new-expense budget alerts. |
| `routes/budgets.js` | Saves/deletes budgets and calculates matching month/category spending. |
| `routes/dashboard.js` | Builds totals, charts, recent activity, and Overview budget-progress data. |
| `middleware/auth.js` | Checks JWT tokens before protected routes are allowed. |
| `middleware/errorHandler.js` | Sends consistent 404 and safe 500 API messages. |
| `utils/validation.js` | Allowed categories/payment methods and server-side transaction checks. |
| `utils/serializers.js` | Converts Prisma field names into the JSON field names the frontend expects. |
| `utils/budgetStorage.js` | Safely prepares legacy budget-table columns/indexes and runs budget storage operations. |

### Prisma and configuration: `server/`

| File | Purpose |
| --- | --- |
| `prisma/schema.prisma` | Single source of truth for User, Transaction, Budget models, enums, and PostgreSQL columns. |
| `.env` | Your private local database URL and JWT secret. Never share it publicly. |
| `.env.example` | Safe example environment configuration. |
| `scripts/setup-database.js` | Creates the configured PostgreSQL database when it is missing. |
| `package.json` | Backend scripts: server start, database setup, Prisma generation, and Prisma Studio. |

## API endpoints

| Method | Endpoint | What it does | Login required |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | Creates an account and returns a JWT. | No |
| POST | `/api/auth/login` | Checks credentials and returns a JWT. | No |
| GET | `/api/dashboard` | Returns cards, charts, recent activity, and current-month budget goals. | Yes |
| GET | `/api/transactions` | Returns filtered/sorted/paginated transactions. | Yes |
| POST | `/api/transactions` | Saves a transaction. | Yes |
| PUT | `/api/transactions/:id` | Updates an owned transaction. | Yes |
| DELETE | `/api/transactions/:id` | Deletes an owned transaction. | Yes |
| GET | `/api/budgets` | Returns all saved budgets with spending progress for each budget month. | Yes |
| POST | `/api/budgets` | Creates or updates a category/month budget. | Yes |
| DELETE | `/api/budgets/:id` | Deletes an owned budget. | Yes |

## Common problems and fixes

| Problem | Meaning | Fix |
| --- | --- | --- |
| `EADDRINUSE: port 5000` | The backend is already running. | Do not start it twice. Use the existing server or stop the process on port 5000. |
| `ENOENT ... server\server\package.json` | `--prefix server` was used while already inside `server`. | Inside `server`, use `npm run dev` without `--prefix`. |
| Browser says Network Error | Backend is stopped or browser points to wrong port. | Start the server and check `http://localhost:5000/api/health`. |
| Generic 500 error | Backend/database process needs inspection. | Look at the backend terminal output first; then confirm `.env` and restart the server. |
| Prisma `EPERM` on Windows | A Node/Prisma process is locking a generated engine file. | Stop backend/frontend terminals, then run `npm run db:generate --prefix server` again. |
| pgAdmin shows no tables | Database setup has not run or pgAdmin needs refresh. | Run `npm run db:setup --prefix server`, then refresh pgAdmin’s Tables node. |
| Login fails | Password/email does not match. | Use the correct account or register a new one. |

## Security notes

- Passwords are hashed with bcrypt.
- JWTs protect private API routes.
- Every transaction and budget request is scoped to the authenticated user ID.
- Server-side validation is always used; browser validation alone is not trusted.
- Keep `.env` private. Do not commit PostgreSQL passwords or JWT secrets.

## Suggested future improvements

- Add a year picker for historical budget limits.
- Use Prisma migrations for production release history.
- Add password-reset email flow and rate limiting for login attempts.
- Add downloadable CSV/PDF reports.
- Use httpOnly cookies instead of localStorage JWTs in a production deployment.
