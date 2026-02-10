const { PrismaClient } = require("../src/generated/prisma");

const prisma = new PrismaClient();

async function checkData() {
  try {
    const investorCount = await prisma.investor.count();
    console.log(`Investor count: ${investorCount}`);

    const mutasiCount = await prisma.mutasiRecord.count();
    console.log(`Mutasi record count: ${mutasiCount}`);

    const breakdownCount = await prisma.breakdown.count();
    console.log(`Breakdown count: ${breakdownCount}`);

    if (investorCount > 0) {
      const investors = await prisma.investor.findMany({
        take: 5,
        select: { kode: true, nama: true },
      });
      console.log("Sample investors:", investors);
    }

    if (mutasiCount > 0) {
      const mutasis = await prisma.mutasiRecord.findMany({
        take: 5,
        select: { kode: true, saldo_akhir: true, tanggal: true },
      });
      console.log("Sample mutasi records:", mutasis);
    }

    if (breakdownCount > 0) {
      const breakdowns = await prisma.breakdown.findMany({
        take: 5,
        select: { nilai: true, tanggal: true },
      });
      console.log("Sample breakdowns:", breakdowns);
    }
  } catch (error) {
    console.error("Error checking data:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();
