/**
 * Seed script — creates the default Administrator account if it doesn't exist.
 * Run: pnpm --filter @workspace/api-server run seed:admin
 *
 * Default credentials:
 *   Email:    admin@rosemary.local
 *   Password: Admin@123456   (change immediately after first login)
 */

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import bcrypt from "bcryptjs";

const { Pool } = pg;

async function main() {
  if (!process.env["DATABASE_URL"]) {
    throw new Error("DATABASE_URL is required");
  }

  const pool = new Pool({ connectionString: process.env["DATABASE_URL"] });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  const email = process.env["ADMIN_EMAIL"] ?? "admin@rosemary.local";
  const password = process.env["ADMIN_PASSWORD"] ?? "Admin@123456";
  const name = "Administrator";

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`Admin user already exists: ${email}`);
    await prisma.$disconnect();
    await pool.end();
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      email,
      name,
      role: "Administrator",
      passwordHash,
    },
  });

  console.log(`✅ Created admin user: ${user.email} (id=${user.id})`);
  console.log(`   Password: ${password}`);
  console.log("   ⚠️  Change the password immediately after first login.");

  await prisma.$disconnect();
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
