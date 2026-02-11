import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import * as z from "zod";
import * as bcrypt from "bcrypt-ts";

const updateUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().optional(),
  kode: z.string().optional(),
  role: z.enum(["USER", "ADMIN", "ADMIN_1", "ADMIN_2", "SUPER_ADMIN"]),
  password: z.string().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = await auth();

    if (
      !session ||
      !session.user ||
      !(session.user as any).role ||
      ((session.user as any).role !== "ADMIN" &&
        (session.user as any).role !== "SUPER_ADMIN")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        kode: true,
        role: true,
        emailVerified: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = await auth();

    if (
      !session ||
      !session.user ||
      !(session.user as any).role ||
      ((session.user as any).role !== "ADMIN" &&
        (session.user as any).role !== "SUPER_ADMIN")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Prevent deleting SUPER_ADMIN users
    const userToDelete = await prisma.user.findUnique({
      where: { id },
      select: { role: true },
    });

    if (!userToDelete) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (userToDelete.role === "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Cannot delete SUPER_ADMIN users" },
        { status: 403 },
      );
    }

    await prisma.user.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = await auth();

    if (
      !session ||
      !session.user ||
      !(session.user as any).role ||
      ((session.user as any).role !== "ADMIN" &&
        (session.user as any).role !== "SUPER_ADMIN")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const { name, email, kode, role, password } = updateUserSchema.parse(body);

    // Check if email is already taken by another user (only if email is provided)
    if (email && email.trim() !== "") {
      const existingUser = await prisma.user.findFirst({
        where: {
          email: email.trim(),
          NOT: {
            id,
          },
        },
      });

      if (existingUser) {
        return NextResponse.json(
          { error: "Email already taken" },
          { status: 400 },
        );
      }
    }

    // Check if kode is already taken by another user
    if (kode && kode.trim() !== "") {
      const existingKodeUser = await prisma.user.findFirst({
        where: {
          kode: kode.trim(),
          NOT: {
            id,
          },
        },
      });

      if (existingKodeUser) {
        return NextResponse.json(
          { error: "Kode already taken" },
          { status: 400 },
        );
      }
    }

    const updateData: any = {
      name,
      email,
      role,
    };

    if (kode && kode.trim() !== "") {
      updateData.kode = kode.trim();
    }

    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: {
        id,
      },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        emailVerified: true,
      },
    });

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input data", details: error.errors },
        { status: 400 },
      );
    }

    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
