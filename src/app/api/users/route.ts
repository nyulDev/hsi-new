import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    console.log("Session:", session);
    console.log("Session user:", session?.user);
    console.log("Session user role:", (session?.user as any)?.role);

    if (
      !session ||
      !session.user ||
      !(session.user as any).role ||
      ((session.user as any).role !== "ADMIN" &&
        (session.user as any).role !== "SUPER_ADMIN")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const kode = searchParams.get("kode");

    if (kode) {
      // Fetch single user by kode
      const user = await prisma.user.findUnique({
        where: { kode },
        select: {
          id: true,
          kode: true,
          name: true,
          email: true,
          role: true,
          emailVerified: true,
        },
      });

      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      return NextResponse.json({ user });
    }

    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const search = searchParams.get("search") || "";
    const offset = (page - 1) * limit;

    const whereClause = search
      ? {
          OR: [
            { kode: { contains: search, mode: "insensitive" as const } },
            { name: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          kode: true,
          name: true,
          email: true,
          role: true,
          emailVerified: true,
        },
        orderBy: {
          name: "asc",
        },
        skip: offset,
        take: limit,
      }),
      prisma.user.count({
        where: whereClause,
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
