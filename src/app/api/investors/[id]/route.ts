import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { nama, kode, rekening_bank, atas_nama_rekening, whatsapp, email } =
      body;

    // Check if investor exists
    const existingInvestor = await prisma.investor.findUnique({
      where: { id },
    });

    if (!existingInvestor) {
      return NextResponse.json(
        { error: "Investor not found" },
        { status: 404 }
      );
    }

    // Removed email uniqueness check to allow duplicate emails

    const updatedInvestor = await prisma.investor.update({
      where: { id },
      data: {
        nama,
        kode,
        rekening_bank,
        atas_nama_rekening,
        whatsapp,
        email,
      },
    });

    // Update related MutasiRecord with new kode, nama, rekening_bank
    console.log("Updating MutasiRecord for investorId:", id, "with data:", {
      kode,
      nama,
      rekening_bank,
    });
    const updateResult = await prisma.mutasiRecord.updateMany({
      where: { investorId: id },
      data: {
        kode,
        nama,
        rekening_bank,
      },
    });
    console.log("Update result:", updateResult);

    return NextResponse.json(updatedInvestor);
  } catch (error) {
    console.error("Error updating investor:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const investor = await prisma.investor.findUnique({
      where: { id },
    });

    if (!investor) {
      return NextResponse.json(
        { error: "Investor not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(investor);
  } catch (error) {
    console.error("Error fetching investor:", error);
    return NextResponse.json(
      { error: "Internal server error" },
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

    // Check if investor exists
    const existingInvestor = await prisma.investor.findUnique({
      where: { id },
    });

    if (!existingInvestor) {
      return NextResponse.json(
        { error: "Investor not found" },
        { status: 404 }
      );
    }

    await prisma.investor.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Investor deleted successfully" });
  } catch (error) {
    console.error("Error deleting investor:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
