const { PrismaClient } = require("../src/generated/prisma");

const prisma = new PrismaClient();

async function migrateStatus() {
  try {
    console.log("Starting status migration...");

    // Get all mutasi records
    const records = await prisma.mutasiRecord.findMany();

    for (const record of records) {
      let admin1_status = "PROSES";
      let admin2_status = "PENDING";

      if (record.status === "FIRST_APPROVED") {
        admin1_status = "APPROVE";
        admin2_status = "PROSES";
      } else if (record.status === "APPROVED") {
        admin1_status = "APPROVE";
        admin2_status = "APPROVE";
      } else if (record.status === "REJECT") {
        admin1_status = "REJECT";
        admin2_status = "REJECT";
      }
      // For 'PROSES', keep defaults

      await prisma.mutasiRecord.update({
        where: { id: record.id },
        data: {
          admin1_status,
          admin2_status,
        },
      });
    }

    console.log("Migration completed successfully.");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

migrateStatus();
