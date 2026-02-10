import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deposit = await prisma.deposit.findUnique({
      where: { id },
      include: {
        investor: true,
      },
    });

    if (!deposit) {
      return NextResponse.json({ error: "Deposit not found" }, { status: 404 });
    }

    return NextResponse.json(deposit);
  } catch (error) {
    console.error("Error fetching deposit:", error);
    return NextResponse.json(
      { error: "Failed to fetch deposit" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const deposit = await prisma.deposit.update({
      where: { id },
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
      },
    });

    return NextResponse.json(deposit);
  } catch (error) {
    console.error("Error updating deposit:", error);
    return NextResponse.json(
      { error: "Failed to update deposit" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.deposit.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Deposit deleted successfully" });
  } catch (error) {
    console.error("Error deleting deposit:", error);
    return NextResponse.json(
      { error: "Failed to delete deposit" },
      { status: 500 }
    );
  }
}
