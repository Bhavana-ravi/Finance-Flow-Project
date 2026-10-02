// Prisma Client is generated from prisma/schema.prisma and replaces handwritten SQL queries.
import { PrismaClient } from '@prisma/client';

// Query logging is the Prisma equivalent of Spring's `spring.jpa.show-sql=true`.
// Prisma creates the SQL; this only prints it to the backend terminal for learning/debugging.
const prisma = new PrismaClient({ log: ['query', 'warn', 'error'] });
export default prisma;
