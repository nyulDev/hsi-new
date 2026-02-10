import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    const action = searchParams.get("action");

    if (action === "lastKode") {
      // Get the last kode breakdown ordered descending
      const lastBreakdown = await prisma.breakdown.findFirst({
        orderBy: {
          createdAt: "desc",
        },
        select: {
          kode: true,
        },
      });
      return NextResponse.json({ lastKode: lastBreakdown?.kode || null });
    }

    if (action === "totalCount") {
      const total = await prisma.breakdown.count();
      return NextResponse.json({ total });
    }

    const breakdowns = await prisma.breakdown.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });
    return NextResponse.json(breakdowns);
  } catch (error) {
    console.error("Error fetching breakdowns:", error);
    return NextResponse.json(
      { error: "Failed to fetch breakdowns" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
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
      kode,
    } = body;

    // If kode is not provided, generate it
    let finalKode = kode;
    if (!finalKode) {
      // Get the last kode
      const lastBreakdown = await prisma.breakdown.findFirst({
        orderBy: {
          createdAt: "desc",
        },
        select: {
          kode: true,
        },
      });
      let nextNumber = 1;
      if (lastBreakdown?.kode && lastBreakdown.kode.startsWith("BRK-")) {
        const lastNumber = parseInt(lastBreakdown.kode.split("-")[1]);
        nextNumber = lastNumber + 1;
      }
      finalKode = `BRK-${nextNumber.toString().padStart(3, "0")}`;
    }

    const newBreakdown = await prisma.breakdown.create({
      data: {
        kode: finalKode,
        tanggal: new Date(tanggal),
        project_pt,
        keterangan,
        nilai: parseFloat(nilai),
        tempo: parseInt(tempo),
        bagi_hasil: parseFloat(bagi_hasil),
        hari: hari ? parseInt(hari) : null,
        bagi_hasil_per_bulan: bagi_hasil_per_bulan
          ? parseFloat(bagi_hasil_per_bulan)
          : null,
      },
    });

    return NextResponse.json(newBreakdown, { status: 201 });
  } catch (error) {
    console.error("Error creating breakdown:", error);
    return NextResponse.json(
      { error: "Failed to create breakdown" },
      { status: 500 }
    );
  }
}
