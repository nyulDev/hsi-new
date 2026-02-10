// src/app/api/cashflow/[id]/route.ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.cashflow.delete({
      where: { id },
    });
    // Peringatan: Menghapus entri akan membuat histori saldo tidak akurat.
    // Di aplikasi production, Anda mungkin ingin mengkalkulasi ulang semua saldo
    // setelah entri ini atau menggunakan soft delete.
    return NextResponse.json({ message: "Data berhasil dihapus" });
  } catch (error) {
    console.error("Error deleting cashflow:", error);
    return NextResponse.json(
      { error: "Gagal menghapus data" },
      { status: 500 }
    );
  }
}
