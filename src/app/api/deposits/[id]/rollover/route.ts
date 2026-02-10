import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const depositId = id;

    // Fetch the deposit to rollover
    const deposit = await prisma.deposit.findUnique({
      where: { id: depositId },
      include: { investor: true },
    });

    if (!deposit) {
      return NextResponse.json({ error: "Deposit not found" }, { status: 404 });
    }

    const now = new Date();
    const isDue = deposit.jatuh_tempo <= now;

    if (!isDue) {
      return NextResponse.json(
        {
          error: "Deposit can only be rolled over if it is due",
        },
        { status: 400 }
      );
    }

    // Update status to ROLLED_OVER
    await prisma.deposit.update({
      where: { id: deposit.id },
      data: { status: "ROLLED_OVER" },
    });

    // Create new deposit with total_akhir as new nilai
    const newTanggal = new Date();
    const newJatuhTempo = new Date(deposit.jatuh_tempo);
    newJatuhTempo.setMonth(newJatuhTempo.getMonth() + deposit.term_months);

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
        keterangan: `Deposit rollover bulan ${newJatuhTempo.toLocaleString(
          "id-ID",
          { month: "long", year: "numeric" }
        )}`,
        status: "ACTIVE",
      },
    });

    // Get investor details for transaction record
    const investor = await prisma.investor.findUnique({
      where: { id: deposit.investorId },
      select: { kode: true, nama: true, rekening_bank: true },
    });

    if (!investor || !investor.kode || !investor.nama) {
      return NextResponse.json(
        { error: "Investor not found or missing required fields" },
        { status: 400 }
      );
    }

    // Get the last transaction for this investor to calculate new saldo
    const lastTransaction = await prisma.mutasiRecord.findFirst({
      where: { investorId: deposit.investorId },
      orderBy: { createdAt: "desc" },
      select: { saldo_akhir: true },
    });

    const lastSaldo = lastTransaction ? Number(lastTransaction.saldo_akhir) : 0;
    const newSaldo = lastSaldo + Number(deposit.total_akhir);

    // Create transaction record for the rollover deposit
    await prisma.mutasiRecord.create({
      data: {
        tanggal: newTanggal,
        kode: investor.kode,
        nama: investor.nama,
        rekening_bank: investor.rekening_bank,
        mutasi: "KREDIT",
        nilai_mutasi: deposit.total_akhir,
        saldo_akhir: newSaldo,
        keterangan: `Rollover Deposit ${deposit.kode} - ${deposit.nama}`,
        investorId: deposit.investorId,
      },
    });

    return NextResponse.json({ message: "Rollover successful", newDeposit });
  } catch (error) {
    console.error("Error during rollover:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
