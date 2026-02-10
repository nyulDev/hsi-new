import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ investorId: string }> },
) {
  try {
    const { investorId } = await params;
    console.log(`Fetching investment data for investorId: ${investorId}`);

    // Find investor by kode (since investorId is actually kode in the fake dialog)
    const investor = await prisma.investor.findFirst({
      where: { kode: investorId },
    });

    if (!investor) {
      console.error(`Investor not found for kode: ${investorId}`);
      return NextResponse.json(
        { error: "Investor not found" },
        { status: 404 },
      );
    }
    console.log(`Found investor: ${investor.nama} (ID: ${investor.id})`);

    // Get current month
    const currentMonth = new Date();
    const startOfMonth = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      1,
    );
    const endOfMonth = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() + 1,
      0,
    );

    // Get latest saldo for current month
    let latestRecord = await prisma.mutasiRecord.findFirst({
      where: {
        investorId: investor.id,
        tanggal: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      orderBy: { tanggal: "desc" },
      select: { saldo_akhir: true },
    });

    // If no transaction in current month, get the latest from previous months
    if (!latestRecord) {
      latestRecord = await prisma.mutasiRecord.findFirst({
        where: { investorId: investor.id },
        orderBy: { tanggal: "desc" },
        select: { saldo_akhir: true },
      });
    }

    const saldo_akhir = latestRecord ? Number(latestRecord.saldo_akhir) : 0;
    console.log(`Saldo akhir for investor: ${saldo_akhir}`);

    // Calculate dana_terpakai: Saldo × Persen-M
    // First get modal and dana tersedia
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
    console.log(`Modal for current month: ${modal}`);

    // Dana Tersedia: total saldo per bulan (sum of all investor saldos for the month)
    const allInvestors = await prisma.investor.findMany({
      select: { id: true },
    });

    const allLatestRecords = await Promise.all(
      allInvestors.map(async (inv) => {
        let record = await prisma.mutasiRecord.findFirst({
          where: {
            investorId: inv.id,
            tanggal: {
              gte: startOfMonth,
              lte: endOfMonth,
            },
          },
          orderBy: { tanggal: "desc" },
          select: { saldo_akhir: true },
        });

        // If no transaction in current month, get the latest from previous months
        if (!record) {
          record = await prisma.mutasiRecord.findFirst({
            where: { investorId: inv.id },
            orderBy: { tanggal: "desc" },
            select: { saldo_akhir: true },
          });
        }

        return record ? Number(record.saldo_akhir) : 0;
      }),
    );

    const danaTersedia = allLatestRecords.reduce(
      (sum, saldo) => sum + saldo,
      0,
    );

    const persenM = danaTersedia > 0 ? (modal / danaTersedia) * 100 : 0;
    const dana_terpakai = saldo_akhir * (persenM / 100);

    // Calculate bagi_hasil
    const today = new Date();
    const lastDayOfMonth = new Date(
      today.getFullYear(),
      today.getMonth() + 1,
      0,
    );
    const isEndOfMonth = today.getDate() === lastDayOfMonth.getDate();

    let bagi_hasil = 0;
    if (isEndOfMonth) {
      bagi_hasil = 0.05 * modal * 0.95;
    }

    // Use the danaTersedia calculated above as totalSaldo
    const totalSaldo = danaTersedia;
    const persen = totalSaldo > 0 ? (saldo_akhir / totalSaldo) * 100 : 0;

    bagi_hasil = (persen / 100) * bagi_hasil;
    console.log(`Bagi hasil: ${bagi_hasil}`);

    return NextResponse.json({
      dana_terpakai,
      saldo_akhir,
      bagi_hasil,
    });
  } catch (error) {
    console.error("Error fetching investment data:", error);
    return NextResponse.json(
      {
        error: `Failed to fetch investment data: ${error instanceof Error ? error.message : String(error)}`,
      },
      { status: 500 },
    );
  }
}
