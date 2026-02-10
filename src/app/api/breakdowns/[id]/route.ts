import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const breakdown = await prisma.breakdown.findUnique({
      where: { id },
    });

    if (!breakdown) {
      return NextResponse.json(
        { error: "Breakdown not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(breakdown);
  } catch (error) {
    console.error("Error fetching breakdown:", error);
    return NextResponse.json(
      { error: "Failed to fetch breakdown" },
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
      tanggal,
      project_pt,
      keterangan,
      nilai,
      tempo,
      bagi_hasil,
      hari,
      bagi_hasil_per_bulan,
    } = body;

    const updatedBreakdown = await prisma.breakdown.update({
      where: { id },
      data: {
        tanggal: tanggal ? new Date(tanggal) : undefined,
        project_pt,
        keterangan,
        nilai: nilai ? parseFloat(nilai) : undefined,
        tempo: tempo ? parseInt(tempo) : undefined,
        bagi_hasil: bagi_hasil ? parseFloat(bagi_hasil) : undefined,
        hari: hari ? parseInt(hari) : null,
        bagi_hasil_per_bulan: bagi_hasil_per_bulan
          ? parseFloat(bagi_hasil_per_bulan)
          : null,
      },
    });

    return NextResponse.json(updatedBreakdown);
  } catch (error) {
    console.error("Error updating breakdown:", error);
    return NextResponse.json(
      { error: "Failed to update breakdown" },
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
    await prisma.breakdown.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Breakdown deleted successfully" });
  } catch (error) {
    console.error("Error deleting breakdown:", error);
    return NextResponse.json(
      { error: "Failed to delete breakdown" },
      { status: 500 }
    );
  }
}
