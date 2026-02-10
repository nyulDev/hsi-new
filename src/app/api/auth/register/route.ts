import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as bcrypt from "bcrypt-ts";
import * as z from "zod";

const registerSchema = z.object({
  name: z.string().min(1),
  kode: z.string().min(1),
  password: z.string().min(8),
  role: z.enum(["USER", "ADMIN1", "ADMIN2", "SUPER_ADMIN"]),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, kode, password, role } = registerSchema.parse(body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { kode },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Kode already registered" },
        { status: 400 },
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        kode,
        password: hashedPassword,
        role,
      },
    });

    // Return success without password
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json(
      { message: "User created successfully", user: userWithoutPassword },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input data", details: error.errors },
        { status: 400 },
      );
    }

    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
