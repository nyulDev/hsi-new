const { PrismaClient } = require("../src/generated/prisma");

const prisma = new PrismaClient();

async function addAdmins() {
  try {
    // Check if admin1 exists
    let admin1 = await prisma.investor.findFirst({
      where: { kode: "admin1" },
    });

    if (!admin1) {
      admin1 = await prisma.investor.create({
        data: {
          kode: "admin1",
          nama: "Admin 1",
          rekening_bank: "Admin Bank 1",
          atas_nama_rekening: "Admin 1",
          whatsapp: "081234567890",
          email: "admin1@example.com",
        },
      });
      console.log("Added admin1:", admin1);
    } else {
      console.log("admin1 already exists");
    }

    // Check if admin2 exists
    let admin2 = await prisma.investor.findFirst({
      where: { kode: "admin2" },
    });

    if (!admin2) {
      admin2 = await prisma.investor.create({
        data: {
          kode: "admin2",
          nama: "Admin 2",
          rekening_bank: "Admin Bank 2",
          atas_nama_rekening: "Admin 2",
          whatsapp: "081234567891",
          email: "admin2@example.com",
        },
      });
      console.log("Added admin2:", admin2);
    } else {
      console.log("admin2 already exists");
    }
  } catch (error) {
    console.error("Error adding admins:", error);
  } finally {
    await prisma.$disconnect();
  }
}

addAdmins();
