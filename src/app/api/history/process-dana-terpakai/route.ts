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

    // Get 3 months ago date
    const threeMonthsAgo = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() - 3,
      1,
    );

    // Get start and end of 3 months ago month
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

    // Get all saldos for 3 months ago using same method as investments page
    const saldoMap = new Map<string, number>();
    let totalSaldo = 0;

    await Promise.all(
      investors
        .filter((investor) => investor.kode)
        .map(async (investor) => {
          const kreditSum = await prisma.mutasiRecord.aggregate({
            where: {
              investorId: investor.id,
              tanggal: { lte: endOfThreeMonthsAgo },
              mutasi: "KREDIT",
            },
            _sum: { nilai_mutasi: true },
          });

          const debetSum = await prisma.mutasiRecord.aggregate({
            where: {
              investorId: investor.id,
              tanggal: { lte: endOfThreeMonthsAgo },
              mutasi: "DEBET",
            },
            _sum: { nilai_mutasi: true },
          });

          const saldo =
            Number(kreditSum._sum.nilai_mutasi || 0) -
            Number(debetSum._sum.nilai_mutasi || 0);
          saldoMap.set(investor.id, saldo);
          totalSaldo += saldo;
        }),
    );

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

    // Dana Tersedia: total deposits (following dana page)
    const totalDanaTersedia = await prisma.deposit.aggregate({
      _sum: {
        nilai: true,
      },
    });
    const danaTersedia = Number(totalDanaTersedia._sum.nilai || 0);

    // Persen-M: modal / danaTersedia * 100
    const persenM = danaTersedia > 0 ? (modal / danaTersedia) * 100 : 0;

    for (let i = 0; i < investors.length; i++) {
      const investor = investors[i];
      if (!investor.kode) continue;

      const saldo = saldoMap.get(investor.id) || 0;

      // Calculate dana_terpakai: saldo * (persenM / 100) - same as investments page
      const dana_terpakai = saldo * (persenM / 100);

      // nilai_mutasi for kredit: dana_terpakai (3 months ago)
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

        const newSaldo = previousSaldo + nilaiMutasi; // KREDIT: add to saldo

        await prisma.mutasiRecord.create({
          data: {
            tanggal: currentDate,
            kode: investor.kode,
            nama: investor.nama,
            rekening_bank: investor.rekening_bank,
            mutasi: "KREDIT",
            nilai_mutasi: nilaiMutasi,
            saldo_akhir: newSaldo,
            keterangan: `Dana terpakai (${startOfThreeMonthsAgo.toLocaleDateString(
              "id-ID",
              { month: "long", year: "numeric" },
            )})`,
            investorId: investor.id,
          },
        });

        console.log(
          `Dana terpakai 3 bulan lalu processed for investor ${investor.kode}: ${nilaiMutasi}`,
        );
      }
    }

    return NextResponse.json({
      message: "Dana terpakai 3 bulan lalu mutations processed successfully",
    });
  } catch (error) {
    console.error("Error processing dana terpakai mutations:", error);
    return NextResponse.json(
      { error: "Internal server error during dana terpakai processing" },
      { status: 500 },
    );
  }
}
