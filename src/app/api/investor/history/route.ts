import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userKode = session.user.kode;

    if (!userKode) {
      return NextResponse.json(
        { error: "User kode not found" },
        { status: 400 },
      );
    }

    // Find investor by user kode
    const investor = await prisma.investor.findFirst({
      where: { kode: userKode },
    });

    if (!investor) {
      return NextResponse.json(
        { error: "Investor not found" },
        { status: 404 },
      );
    }

    // Get all mutasi records for this investor
    const historyRecords = await prisma.mutasiRecord.findMany({
      where: {
        investorId: investor.id,
      },
      orderBy: [
        {
          tanggal: "desc",
        },
        {
          createdAt: "desc",
        },
      ],
    });

    // Calculate summary statistics
    const totalKredit = historyRecords
      .filter((record) => record.mutasi === "KREDIT")
      .reduce((sum, record) => sum + Number(record.nilai_mutasi), 0);

    const totalDebet = historyRecords
      .filter((record) => record.mutasi === "DEBET")
      .reduce((sum, record) => sum + Number(record.nilai_mutasi), 0);

    const currentSaldo =
      historyRecords.length > 0 ? Number(historyRecords[0].saldo_akhir) : 0;

    // Convert Decimal to number for client
    const formattedHistory = historyRecords.map((h) => ({
      id: h.id,
      tanggal: h.tanggal,
      kode: h.kode,
      nama: h.nama,
      rekening_bank: h.rekening_bank,
      mutasi: h.mutasi,
      nilai_mutasi: Number(h.nilai_mutasi),
      saldo_akhir: Number(h.saldo_akhir),
      keterangan: h.keterangan,
      bukti_transfer: h.bukti_transfer,
      admin1_status: h.admin1_status,
      admin2_status: h.admin2_status,
    }));

    return NextResponse.json({
      investor: {
        nama: investor.nama,
        kode: investor.kode,
        rekening_bank: investor.rekening_bank,
        atas_nama_rekening: investor.atas_nama_rekening,
        whatsapp: investor.whatsapp,
        email: investor.email,
      },
      summary: {
        currentSaldo,
        totalKredit,
        totalDebet,
        transactionCount: historyRecords.length,
      },
      transactions: formattedHistory,
    });
  } catch (error) {
    console.error("Error fetching investor history:", error);
    return NextResponse.json(
      { error: "Failed to fetch investor history" },
      { status: 500 },
    );
  }
}
