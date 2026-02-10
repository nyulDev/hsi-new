import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const investorKode = searchParams.get("investorKode");
    const status = searchParams.get("status");

    let whereClause = {};

    if (investorKode) {
      whereClause = {
        investor: {
          kode: investorKode,
        },
      };
    }

    if (status) {
      whereClause = {
        ...whereClause,
        status: status,
      };
    }

    const deposits = await prisma.deposit.findMany({
      where: whereClause,
      include: {
        investor: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Convert Decimal to number
    const formattedDeposits = deposits.map((d) => ({
      ...d,
      nilai: Number(d.nilai),
      suku_bunga: Number(d.suku_bunga),
      bunga_diterima: Number(d.bunga_diterima),
      total_akhir: Number(d.total_akhir),
    }));

    return NextResponse.json(formattedDeposits);
  } catch (error) {
    console.error("Error fetching deposits:", error);
    return NextResponse.json(
      { error: "Failed to fetch deposits" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      investorId,
      kode,
      nama,
      nilai,
      tanggal,
      term_months,
      jatuh_tempo,
      suku_bunga,
      bunga_diterima,
    } = body;

    // Calculate total_akhir: nilai + bunga_diterima (bunga_diterima already cut 5%)
    const netProfit = nilai + bunga_diterima;

    // Validate that deposit can only be made between 1st and 8th of the month
    const depositDate = new Date(tanggal);
    const dayOfMonth = depositDate.getDate();
    if (dayOfMonth < 1 || dayOfMonth > 8) {
      return NextResponse.json(
        {
          error:
            "Deposits can only be made between the 1st and 8th of each month",
        },
        { status: 400 }
      );
    }

    const deposit = await prisma.deposit.create({
      data: {
        investorId,
        kode,
        nama,
        nilai,
        tanggal,
        term_months,
        jatuh_tempo,
        suku_bunga,
        bunga_diterima,
        total_akhir: netProfit,
        status: "ACTIVE",
      },
    });

    // Get investor details for transaction record
    const investor = await prisma.investor.findUnique({
      where: { id: investorId },
      select: { kode: true, nama: true, rekening_bank: true },
    });

    if (!investor) {
      return NextResponse.json(
        { error: "Investor not found" },
        { status: 400 }
      );
    }

    // Calculate correct saldo based on all transactions for this investor
    const allTransactions = await prisma.mutasiRecord.findMany({
      where: { investorId },
      orderBy: { tanggal: "asc", createdAt: "asc" },
      select: { mutasi: true, nilai_mutasi: true },
    });

    let runningBalance = 0;
    for (const t of allTransactions) {
      if (t.mutasi === "KREDIT") {
        runningBalance += Number(t.nilai_mutasi);
      } else if (t.mutasi === "DEBET") {
        runningBalance -= Number(t.nilai_mutasi);
      }
    }

    const newSaldo = runningBalance + Number(nilai);

    // Create transaction record for the deposit
    await prisma.mutasiRecord.create({
      data: {
        tanggal: depositDate,
        kode: investor.kode || kode,
        nama: investor.nama || nama,
        rekening_bank: investor.rekening_bank,
        mutasi: "KREDIT",
        nilai_mutasi: nilai,
        saldo_akhir: newSaldo,
        keterangan: `Deposit ${kode} - ${nama}`,
        investorId,
      },
    });

    return NextResponse.json(
      {
        ...deposit,
        nilai: Number(deposit.nilai),
        suku_bunga: Number(deposit.suku_bunga),
        bunga_diterima: Number(deposit.bunga_diterima),
        total_akhir: Number(deposit.total_akhir),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating deposit:", error);
    return NextResponse.json(
      { error: "Failed to create deposit" },
      { status: 500 }
    );
  }
}
