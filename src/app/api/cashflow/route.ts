// src/app/api/cashflow/route.ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const cashflows = await prisma.cashflow.findMany({
      orderBy: {
        tanggal: "desc",
      },
    });
    return NextResponse.json(cashflows);
  } catch (error) {
    console.error("Error fetching cashflows:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data cashflow" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tanggal, keterangan, pt, mutasi, nilai } = body;

    if (!tanggal || !pt || !mutasi || nilai === undefined) {
      return NextResponse.json(
        { error: "Field yang diperlukan tidak lengkap" },
        { status: 400 }
      );
    }

    const nilaiNum = parseFloat(nilai);

    // Get the last cashflow entry to calculate the new saldo
    const lastCashflow = await prisma.cashflow.findFirst({
      orderBy: {
        tanggal: "desc",
      },
    });

    let lastSaldo = lastCashflow ? Number(lastCashflow.saldo) : 0;

    let newSaldo = lastSaldo;
    if (mutasi === "KREDIT") {
      newSaldo += nilaiNum;
    } else if (mutasi === "DEBET") {
      newSaldo -= nilaiNum;
    }

    const newCashflow = await prisma.cashflow.create({
      data: {
        tanggal: new Date(tanggal),
        keterangan,
        pt,
        mutasi,
        nilai: nilaiNum,
        saldo: newSaldo,
      },
    });

    return NextResponse.json(newCashflow, { status: 201 });
  } catch (error) {
    console.error("Error creating cashflow:", error);
    return NextResponse.json(
      { error: "Gagal membuat data cashflow" },
      { status: 500 }
    );
  }
}
