const { PrismaClient } = require("../src/generated/prisma");
const bcrypt = require("bcrypt-ts");

const prisma = new PrismaClient();

async function migrateInvestorsToUsers() {
  try {
    console.log("Starting migration of investors to users...");

    // Get all investors
    const investors = await prisma.investor.findMany({
      select: {
        id: true,
        nama: true,
        email: true,
        kode: true,
      },
    });

    console.log(`Found ${investors.length} investors to process`);

    let createdCount = 0;
    let skippedCount = 0;

    for (const investor of investors) {
      // Generate email if not exists (use kode as base)
      let email = investor.email;
      if (!email) {
        email = `${investor.kode
          .toLowerCase()
          .replace(/-/g, "")}@investor.local`;
        console.log(`Generated email for ${investor.nama}: ${email}`);
      }

      // Check if user already exists with this email
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        console.log(`User already exists for ${email} - skipping`);
        skippedCount++;
        continue;
      }

      // Generate password based on kode (e.g., INV-H-001 -> password001)
      const passwordBase = investor.kode.split("-").pop() || "123";
      const password = `password${passwordBase}`;

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = await prisma.user.create({
        data: {
          name: investor.nama,
          email,
          password: hashedPassword,
          role: "USER",
        },
      });

      console.log(
        `Created user for ${investor.nama}: ${investor.email} (password: ${password})`
      );
      createdCount++;
    }

    console.log(`\nMigration completed:`);
    console.log(`- Created: ${createdCount} users`);
    console.log(`- Skipped: ${skippedCount} investors`);
  } catch (error) {
    console.error("Error during migration:", error);
  } finally {
    await prisma.$disconnect();
  }
}

migrateInvestorsToUsers();
