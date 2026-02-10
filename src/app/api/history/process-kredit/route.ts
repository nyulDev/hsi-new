import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const investors = await prisma.investor.findMany({
      select: {
        id: true,
        kode: true,
        nama: true,
        rekening_bank: true,
      },
    });

    const currentDate = new Date();
    const monthNames = [
      "Januari",
      "Februari",
      "Maret",
      "April",
      "Mei",
      "Juni",
      "Juli",
      "Agustus",
      "September",
      "Oktober",
      "November",
      "Desember",
    ];

    // Get 3 months ago start and end
    const threeMonthsAgo = new Date(currentDate);
    threeMonthsAgo.setMonth(currentDate.getMonth() - 3);
    const startOfThreeMonthsAgo = new Date(
      threeMonthsAgo.getFullYear(),
      threeMonthsAgo.getMonth(),
      1,
    );
    const endOfThreeMonthsAgo = new Date(
      threeMonthsAgo.getFullYear(),
      threeMonthsAgo.getMonth() + 1,
      0,
    );

    // Get all latest saldos for current month to calculate total
    const startOfCurrentMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1,
    );
    const endOfCurrentMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      0,
    );

    const allLatestRecords = await Promise.all(
      investors
        .filter((investor) => investor.kode)
        .map(async (investor) => {
          const latestRecord = await prisma.mutasiRecord.findFirst({
            where: { investorId: investor.id },
            orderBy: { createdAt: "desc" },
            select: { saldo_akhir: true },
          });
          return latestRecord ? Number(latestRecord.saldo_akhir) : 0;
        }),
    );

    const totalSaldo = allLatestRecords.reduce((sum, saldo) => sum + saldo, 0);

    // Calculate Modal: total nilai from breakdowns for 3 months ago
    const modalAggregate = await prisma.breakdown.aggregate({
      where: {
        tanggal: {
          gte: startOfThreeMonthsAgo,
          lte: endOfThreeMonthsAgo,
        },
      },
      _sum: {
        nilai: true,
      },
    });
    const modal = modalAggregate._sum?.nilai
      ? Number(modalAggregate._sum.nilai)
      : 0;

    // Persen-M: modal / totalSaldo * 100, capped at 100%
    const persenM =
      totalSaldo > 0 ? Math.min(100, (modal / totalSaldo) * 100) : 0;

    // Bagi Hasil: 5% of modal, then deduct 5% admin fee
    const bagiHasil = 0.05 * modal * 0.95;

    for (let i = 0; i < investors.length; i++) {
      const investor = investors[i];
      if (!investor.kode) continue;

      const saldo = allLatestRecords[i];

      // Calculate persen
      const persen = totalSaldo > 0 ? (saldo / totalSaldo) * 100 : 0;

      // Calculate bagi_hasil: persen / 100 * bagiHasil
      const bagi_hasil = (persen / 100) * bagiHasil;

      // nilai_mutasi for kredit: bagi_hasil
      const nilaiMutasi = bagi_hasil;

      if (nilaiMutasi > 0) {
        // Get last saldo for this investor
        const lastTransaction = await prisma.mutasiRecord.findFirst({
          where: { investorId: investor.id },
          orderBy: [
            {
              tanggal: "desc",
            },
            {
              createdAt: "desc",
            },
          ],
          select: { saldo_akhir: true },
        });

        const previousSaldo = lastTransaction
          ? Number(lastTransaction.saldo_akhir)
          : 0;

        const newSaldo = previousSaldo + nilaiMutasi;

        await prisma.mutasiRecord.create({
          data: {
            tanggal: currentDate,
            kode: investor.kode,
            nama: investor.nama,
            rekening_bank: investor.rekening_bank,
            mutasi: "KREDIT",
            nilai_mutasi: nilaiMutasi,
            saldo_akhir: newSaldo,
            keterangan: `Profit Sharing (${
              monthNames[threeMonthsAgo.getMonth()]
            })`,
            investorId: investor.id,
          },
        });

        console.log(
          `Kredit processed for investor ${investor.kode}: ${nilaiMutasi}`,
        );
      }
    }

    return NextResponse.json({
      message: "Kredit mutations processed successfully",
    });
  } catch (error) {
    console.error("Error processing kredit mutations:", error);
    return NextResponse.json(
      { error: "Internal server error during kredit processing" },
      { status: 500 },
    );
  }
}
