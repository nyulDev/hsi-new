import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { ids } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "IDs array is required and must not be empty" },
        { status: 400 },
      );
    }

    // Delete multiple breakdowns
    const result = await prisma.breakdown.deleteMany({
      where: {
        id: {
          in: ids,
        },
      },
    });

    return NextResponse.json({
      message: `${result.count} breakdowns deleted successfully`,
      deletedCount: result.count,
    });
  } catch (error) {
    console.error("Error deleting breakdowns:", error);
    return NextResponse.json(
      { error: "Failed to delete breakdowns" },
      { status: 500 },
    );
  }
}
