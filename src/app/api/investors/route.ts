import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    const action = searchParams.get("action");

    if (action === "lastKode") {
      // Get the last kode investor ordered descending
      const lastInvestor = await prisma.investor.findFirst({
        orderBy: {
          createdAt: "desc",
        },
        select: {
          kode: true,
        },
      });
      return NextResponse.json({ lastKode: lastInvestor?.kode || null });
    }

    if (action === "lastSaldo") {
      const kode = searchParams.get("kode");
      if (!kode) {
        return NextResponse.json(
          { error: "Kode is required" },
          { status: 400 }
        );
      }
      // Calculate the last saldo for the investor with this kode
      const transactions = await prisma.mutasiRecord.findMany({
        where: { kode },
        orderBy: { tanggal: "asc", createdAt: "asc" },
        select: { mutasi: true, nilai_mutasi: true },
      });

      let lastSaldo = 0;
      for (const t of transactions) {
        if (t.mutasi === "KREDIT") {
          lastSaldo += Number(t.nilai_mutasi);
        } else if (t.mutasi === "DEBET") {
          lastSaldo -= Number(t.nilai_mutasi);
        }
      }
      return NextResponse.json({ lastSaldo });
    }

    if (action === "totalCount") {
      const total = await prisma.investor.count();
      return NextResponse.json({ total });
    }

    if (action === "lastInvestors") {
      const lastInvestors = await prisma.investor.findMany({
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
        select: {
          kode: true,
          nama: true,
          createdAt: true,
        },
      });
      return NextResponse.json({ lastInvestors });
    }

    if (action === "topTierInvestors") {
      // Get latest saldo_akhir per investor
      const transactions = await prisma.mutasiRecord.findMany({
        orderBy: {
          tanggal: "desc",
          createdAt: "desc",
        },
        select: {
          kode: true,
          nama: true,
          saldo_akhir: true,
        },
      });

      // Group by kode and take the latest saldo_akhir
      const latestSaldoMap = new Map<
        string,
        { kode: string; nama: string; saldo_akhir: number }
      >();
      for (const t of transactions) {
        if (!latestSaldoMap.has(t.kode)) {
          latestSaldoMap.set(t.kode, {
            kode: t.kode,
            nama: t.nama || "",
            saldo_akhir: Number(t.saldo_akhir),
          });
        }
      }

      // Sort by saldo_akhir descending and take top 5
      const topTier = Array.from(latestSaldoMap.values())
        .sort((a, b) => b.saldo_akhir - a.saldo_akhir)
        .slice(0, 5);

      return NextResponse.json({ topTier });
    }

    const investors = await prisma.investor.findMany({
      select: {
        kode: true,
        nama: true,
        rekening_bank: true,
      },
    });
    return NextResponse.json(investors);
  } catch (error) {
    console.error("Error fetching investors:", error);
    return NextResponse.json(
      { error: "Failed to fetch investors" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nama, kode, rekening_bank, atas_nama_rekening, whatsapp, email } =
      body;

    // If kode is not provided, generate it
    let finalKode = kode;
    if (!finalKode) {
      // Get the last kode
      const lastInvestor = await prisma.investor.findFirst({
        orderBy: {
          createdAt: "desc",
        },
        select: {
          kode: true,
        },
      });
      let nextNumber = 1;
      if (lastInvestor?.kode && lastInvestor.kode.startsWith("INV-H-")) {
        const lastNumber = parseInt(lastInvestor.kode.split("-")[2]);
        nextNumber = lastNumber + 1;
      }
      finalKode = `INV-H-${nextNumber.toString().padStart(3, "0")}`;
    }

    const newInvestor = await prisma.investor.create({
      data: {
        nama,
        kode: finalKode,
        rekening_bank,
        atas_nama_rekening,
        whatsapp,
        email,
      },
    });

    return NextResponse.json(newInvestor, { status: 201 });
  } catch (error) {
    console.error("Error creating investor:", error);
    return NextResponse.json(
      { error: "Failed to create investor" },
      { status: 500 }
    );
  }
}
