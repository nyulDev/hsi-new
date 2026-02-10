import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type } = body; // 'debet', 'kredit', or 'all'

    if (type === "debet") {
      await processDebetMutations();
      return NextResponse.json({
        message: "Debet mutations processed successfully",
      });
    }

    if (type === "kredit") {
      await processKreditMutations();
      return NextResponse.json({
        message: "Kredit mutations processed successfully",
      });
    }

    if (type === "all") {
      await processDebetMutations();
      // Wait 2 minutes before processing kredit (as per todo.md)
      setTimeout(
        async () => {
          await processKreditMutations();
        },
        2 * 60 * 1000,
      );
      return NextResponse.json({
        message: "All mutations scheduled for processing",
      });
    }

    return NextResponse.json(
      { error: "Invalid type. Use debet, kredit, or all" },
      { status: 400 },
    );
  } catch (error) {
    console.error("Error in auto mutation:", error);
    return NextResponse.json(
      { error: "Internal server error during auto mutation" },
      { status: 500 },
    );
  }
}

async function processDebetMutations() {
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
      1,
    );
    const endOfMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      0,
    );

    // Get all starting saldos for the month (up to 8th or latest before)
    const endOfMonthForSaldo = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      8,
    );

    const allLatestRecords = await Promise.all(
      investors
        .filter((investor) => investor.kode)
        .map(async (investor) => {
          let latestRecord = await prisma.mutasiRecord.findFirst({
            where: {
              investorId: investor.id,
              tanggal: {
                gte: startOfMonth,
                lte: endOfMonthForSaldo,
              },
            },
            orderBy: { tanggal: "desc" },
            select: { saldo_akhir: true },
          });

          // If no transaction in current month up to 8th, get the latest from previous months
          if (!latestRecord) {
            latestRecord = await prisma.mutasiRecord.findFirst({
              where: {
                investorId: investor.id,
                tanggal: {
                  lt: startOfMonth,
                },
              },
              orderBy: { tanggal: "desc" },
              select: { saldo_akhir: true },
            });
          }

          return latestRecord ? Number(latestRecord.saldo_akhir) : 0;
        }),
    );

    const totalSaldo = allLatestRecords.reduce((sum, saldo) => sum + saldo, 0);

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

    // Persen-M: modal / totalSaldo * 100, capped at 100%
    const persenM =
      totalSaldo > 0 ? Math.min(100, (modal / totalSaldo) * 100) : 0;

    for (let i = 0; i < investors.length; i++) {
      const investor = investors[i];
      if (!investor.kode) continue;

      const saldo = allLatestRecords[i];

      // Calculate dana_terpakai: saldo * (persenM / 100)
      const dana_terpakai = saldo * (persenM / 100);

      // nilai_mutasi for debet: dana_terpakai
      const nilaiMutasi = dana_terpakai;

      if (nilaiMutasi > 0) {
        // Use the starting saldo for the month as previousSaldo
        const previousSaldo = saldo;

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
          `Debet processed for investor ${investor.kode}: ${nilaiMutasi}`,
        );
      }
    }

    console.log("Debet mutations processed successfully");
  } catch (error) {
    console.error("Error processing debet mutations:", error);
    throw error;
  }
}

async function processKreditMutations() {
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
      1,
    );
    const endOfMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      0,
    );

    // Get all latest saldos to calculate total
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

    // Calculate Modal: total nilai from breakdowns for current month
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

    // Dana Tersedia: total deposits (following dana page)
    const totalDanaTersedia = await prisma.deposit.aggregate({
      _sum: {
        nilai: true,
      },
    });
    const danaTersedia = Number(totalDanaTersedia._sum.nilai || 0);

    // Persen-M: modal / danaTersedia * 100
    const persenM = danaTersedia > 0 ? (modal / danaTersedia) * 100 : 0;

    // Bagi Hasil: sum of bagi_hasil_per_bulan from breakdowns for current month, minus 5% admin fee
    const bagiHasilAggregate = await prisma.breakdown.aggregate({
      where: {
        tanggal: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      _sum: {
        bagi_hasil_per_bulan: true,
      },
    });
    const totalBagiHasilPerBulan = bagiHasilAggregate._sum?.bagi_hasil_per_bulan
      ? Number(bagiHasilAggregate._sum.bagi_hasil_per_bulan)
      : 0;
    const adminFee = totalBagiHasilPerBulan * 0.05;
    const totalBagiHasil = totalBagiHasilPerBulan - adminFee;

    console.log(`Processing kredit for ${investors.length} investors`);
    console.log(
      `Total saldo: ${totalSaldo}, Modal: ${modal}, Persen-M: ${persenM}`,
    );
    console.log(
      `Total bagi hasil per bulan: ${totalBagiHasilPerBulan}, Admin fee: ${adminFee}, Net bagi hasil: ${totalBagiHasil}`,
    );

    for (let i = 0; i < investors.length; i++) {
      const investor = investors[i];
      if (!investor.kode) continue;

      const saldo = allLatestRecords[i];

      // Calculate persen
      const persen = totalSaldo > 0 ? (saldo / totalSaldo) * 100 : 0;

      // Calculate bagi_hasil: persen / 100 * totalBagiHasil
      const bagiHasil = (persen / 100) * totalBagiHasil;

      console.log(
        `Investor ${investor.kode}: Saldo ${saldo}, Persen ${persen}%, Bagi hasil ${bagiHasil}`,
      );

      if (bagiHasil > 0) {
        // Get last saldo for this investor (same as history API)
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
        const newSaldo = previousSaldo + bagiHasil;

        await prisma.mutasiRecord.create({
          data: {
            tanggal: currentDate,
            kode: investor.kode,
            nama: investor.nama,
            rekening_bank: investor.rekening_bank,
            mutasi: "KREDIT",
            nilai_mutasi: bagiHasil,
            saldo_akhir: newSaldo,
            keterangan: `Bagi hasil ${monthNames[currentDate.getMonth()]}`,
            investorId: investor.id,
          },
        });

        console.log(
          `Kredit processed for investor ${investor.kode}: ${bagiHasil}`,
        );
      }
    }

    console.log("Kredit mutations processed successfully");
  } catch (error) {
    console.error("Error processing kredit mutations:", error);
    throw error;
  }
}
