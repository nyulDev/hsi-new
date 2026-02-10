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

    // Get current month start and end
    const startOfMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1
    );
    const endOfMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      0
    );

    // Get all saldos using the same method as investments page (sum kredit - sum debet up to current date)
    const saldoMap = new Map<string, number>();
    let totalSaldo = 0;

    await Promise.all(
      investors
        .filter((investor) => investor.kode)
        .map(async (investor) => {
          const kreditSum = await prisma.mutasiRecord.aggregate({
            where: {
              investorId: investor.id,
              tanggal: { lte: currentDate },
              mutasi: "KREDIT",
            },
            _sum: { nilai_mutasi: true },
          });

          const debetSum = await prisma.mutasiRecord.aggregate({
            where: {
              investorId: investor.id,
              tanggal: { lte: currentDate },
              mutasi: "DEBET",
            },
            _sum: { nilai_mutasi: true },
          });

          const saldo =
            Number(kreditSum._sum.nilai_mutasi || 0) -
            Number(debetSum._sum.nilai_mutasi || 0);
          saldoMap.set(investor.id, saldo);
          totalSaldo += saldo;
        })
    );

    const allLatestRecords = investors.map(
      (investor) => saldoMap.get(investor.id) || 0
    );

    // Calculate modal: sum of nilai from breakdowns for current month
    const modalAggregate = await prisma.breakdown.aggregate({
      where: {
        tanggal: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      _sum: {
        nilai: true,
      },
    });
    const modal = modalAggregate._sum?.nilai
      ? Number(modalAggregate._sum.nilai)
      : 0;

    // Persen-M: modal / totalSaldo * 100
    const persenM = totalSaldo > 0 ? (modal / totalSaldo) * 100 : 0;

    for (let i = 0; i < investors.length; i++) {
      const investor = investors[i];
      if (!investor.kode) continue;

      const saldo = allLatestRecords[i];

      // Calculate dana_terpakai: saldo * (persenM / 100)
      const dana_terpakai = saldo * (persenM / 100);

      // nilai_mutasi for debet: dana_terpakai
      const nilaiMutasi = dana_terpakai;

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

        const newSaldo = previousSaldo - nilaiMutasi;

        await prisma.mutasiRecord.create({
          data: {
            tanggal: currentDate,
            kode: investor.kode,
            nama: investor.nama,
            rekening_bank: investor.rekening_bank,
            mutasi: "DEBET",
            nilai_mutasi: nilaiMutasi,
            saldo_akhir: newSaldo,
            keterangan: `Dana terpakai ${monthNames[currentDate.getMonth()]}`,
            investorId: investor.id,
          },
        });

        console.log(
          `Debet processed for investor ${investor.kode}: ${nilaiMutasi}`
        );
      }
    }

    return NextResponse.json({
      message: "Debet mutations processed successfully",
    });
  } catch (error) {
    console.error("Error processing debet mutations:", error);
    return NextResponse.json(
      { error: "Internal server error during debet processing" },
      { status: 500 }
    );
  }
}
