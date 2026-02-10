const { PrismaClient } = require("../src/generated/prisma");

const prisma = new PrismaClient();

async function correctSaldoAkhir() {
  try {
    // Get all investors who have transactions
    const investors = await prisma.investor.findMany({
      include: {
        mutasiRecords: {
          orderBy: [{ tanggal: "asc" }, { createdAt: "asc" }],
        },
      },
    });

    for (const investor of investors) {
      const transactions = investor.mutasiRecords;
      let runningBalance = 0;

      for (const transaction of transactions) {
        // Only include APPROVE transactions in balance calculation
        if (transaction.status === "APPROVE") {
          if (transaction.mutasi === "KREDIT") {
            runningBalance += Number(transaction.nilai_mutasi);
          } else if (transaction.mutasi === "DEBET") {
            runningBalance -= Number(transaction.nilai_mutasi);
          }
        }

        // Update the saldo_akhir
        await prisma.mutasiRecord.update({
          where: { id: transaction.id },
          data: { saldo_akhir: runningBalance },
        });
      }
    }

    console.log("Saldo akhir corrected for all transactions.");
  } catch (error) {
    console.error("Error correcting saldo akhir:", error);
  } finally {
    await prisma.$disconnect();
  }
}

correctSaldoAkhir();
