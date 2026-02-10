import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const currentDay = now.getDate();

    // Allow manual trigger without date restriction
    // Only run on or after the 7th of the month for automatic cron
    // if (currentDay < 7) {
    //   return NextResponse.json(
    //     {
    //       message: "Auto rollover only runs on or after the 7th of each month",
    //     },
    //     { status: 200 }
    //   );
    // }

    // Find deposits that are due in the current month, are ACTIVE, and have matured (jatuh_tempo <= now)
    const dueDeposits = await prisma.deposit.findMany({
      where: {
        status: "ACTIVE",
        jatuh_tempo: {
          gte: new Date(currentYear, currentMonth, 1),
          lt: new Date(currentYear, currentMonth + 1, 1),
          lte: now,
        },
      },
      include: { investor: true },
    });

    if (dueDeposits.length === 0) {
      return NextResponse.json(
        { message: "No deposits due for rollover this month" },
        { status: 200 }
      );
    }

    const rolloverResults = [];

    for (const deposit of dueDeposits) {
      try {
        // Create new deposit with total_akhir as new nilai
        const newTanggal = new Date();
        // Follow the same maturity calculation as in add-deposit-dialog
        const start = new Date(deposit.jatuh_tempo);
        // Mulai perhitungan dari 1 bulan berikutnya
        const startBaru = new Date(
          start.getFullYear(),
          start.getMonth() + 1,
          1
        );
        const newJatuhTempo = new Date(
          startBaru.getFullYear(),
          startBaru.getMonth() + deposit.term_months,
          1
        );

        const newBungaDiterima =
          Number(deposit.total_akhir) * Number(deposit.suku_bunga);
        const newTotalAkhir = Number(deposit.total_akhir) + newBungaDiterima;

        const newDeposit = await prisma.deposit.create({
          data: {
            investorId: deposit.investorId,
            kode: deposit.kode,
            nama: deposit.nama,
            nilai: deposit.total_akhir,
            tanggal: newTanggal,
            term_months: deposit.term_months,
            jatuh_tempo: newJatuhTempo,
            suku_bunga: deposit.suku_bunga,
            bunga_diterima: newBungaDiterima,
            total_akhir: newTotalAkhir,
            keterangan: `deposit ${newTanggal
              .toLocaleString("id-ID", { month: "long", year: "numeric" })
              .toLowerCase()}`,
            status: "ACTIVE",
          },
        });

        // Update the old deposit status to ROLLED_OVER
        await prisma.deposit.update({
          where: { id: deposit.id },
          data: { status: "ROLLED_OVER" },
        });

        // Get investor details for transaction record
        const investor = await prisma.investor.findUnique({
          where: { id: deposit.investorId },
          select: { kode: true, nama: true, rekening_bank: true },
        });

        if (!investor || !investor.kode || !investor.nama) {
          console.error(
            `Investor not found or missing fields for deposit ${deposit.kode}`
          );
          continue;
        }

        // Get the last transaction for this investor to calculate new saldo
        const lastTransaction = await prisma.mutasiRecord.findFirst({
          where: { investorId: deposit.investorId },
          orderBy: { createdAt: "desc" },
          select: { saldo_akhir: true },
        });

        const lastSaldo = lastTransaction
          ? Number(lastTransaction.saldo_akhir)
          : 0;
        const newSaldo = lastSaldo + Number(deposit.total_akhir);

        // Create transaction record for the auto rollover deposit
        await prisma.mutasiRecord.create({
          data: {
            tanggal: newTanggal,
            kode: investor.kode,
            nama: investor.nama,
            rekening_bank: investor.rekening_bank,
            mutasi: "KREDIT",
            nilai_mutasi: deposit.total_akhir,
            saldo_akhir: newSaldo,
            keterangan: `deposit ${newTanggal
              .toLocaleString("id-ID", { month: "long", year: "numeric" })
              .toLowerCase()}`,
            investorId: deposit.investorId,
          },
        });

        rolloverResults.push({
          originalDeposit: deposit.kode,
          newDeposit: newDeposit,
          success: true,
        });
      } catch (error) {
        console.error(`Error rolling over deposit ${deposit.kode}:`, error);
        rolloverResults.push({
          originalDeposit: deposit.kode,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return NextResponse.json({
      message: `Auto rollover completed. Processed ${dueDeposits.length} deposits.`,
      results: rolloverResults,
    });
  } catch (error) {
    console.error("Error during auto rollover:", error);
    return NextResponse.json(
      { error: "Internal server error during auto rollover" },
      { status: 500 }
    );
  }
}
