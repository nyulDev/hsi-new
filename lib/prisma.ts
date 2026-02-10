import { PrismaClient } from "../src/generated/prisma";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Note: Middleware $use is not available in this Prisma setup.
// To auto-populate kode, nama, rekening_bank in MutasiRecord,
// fetch the investor data and include it when creating MutasiRecord.
// Example:
// const investor = await prisma.investor.findUnique({ where: { id: investorId }, select: { kode: true, nama: true, rekening_bank: true } });
// const mutasi = await prisma.mutasiRecord.create({ data: { ...data, kode: investor.kode, nama: investor.nama, rekening_bank: investor.rekening_bank } });
