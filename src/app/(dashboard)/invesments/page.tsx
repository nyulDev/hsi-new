import { Investment } from "./columns";
import { prisma } from "@/lib/prisma";
import { InvestmentsClient } from "./invesments-client";

const months = [
  { name: "Januari", month: 1 },
  { name: "Februari", month: 2 },
  { name: "Maret", month: 3 },
  { name: "April", month: 4 },
  { name: "Mei", month: 5 },
  { name: "Juni", month: 6 },
  { name: "Juli", month: 7 },
  { name: "Agustus", month: 8 },
  { name: "September", month: 9 },
  { name: "Oktober", month: 10 },
  { name: "November", month: 11 },
  { name: "Desember", month: 12 },
];

const getData = async (
  month?: string,
): Promise<{
  investments: Investment[];
  modal: number;
  persenM: number;
  bagiHasil: number;
  persenB: number;
  adminFee: number;
  danaTersedia: number;
}> => {
  const investors = await prisma.investor.findMany({
    select: {
      id: true,
      kode: true,
      nama: true,
    },
  });

  // Get all latest saldos to calculate total
  const saldoMap = new Map<string, number>();
  let totalSaldo = 0;

  await Promise.all(
    investors.map(async (investor) => {
      // Get saldo for the selected month or current month, limited to 8th
      let startOfMonth: Date;
      let endOfMonth: Date;

      if (month) {
        const monthNum = parseInt(month);
        const currentYear = new Date().getFullYear();
        startOfMonth = new Date(currentYear, monthNum - 1, 1);
        endOfMonth = new Date(currentYear, monthNum, 0);
      } else {
        const currentMonth = new Date();
        startOfMonth = new Date(
          currentMonth.getFullYear(),
          currentMonth.getMonth(),
          1,
        );
        endOfMonth = new Date(
          currentMonth.getFullYear(),
          currentMonth.getMonth() + 1,
          0,
        );
      }

      // For current month, use current date; for past months, use end of month
      const currentDate = new Date();
      const isCurrentMonth =
        startOfMonth.getMonth() === currentDate.getMonth() &&
        startOfMonth.getFullYear() === currentDate.getFullYear();
      const endOfMonthForSaldo = isCurrentMonth ? currentDate : endOfMonth;

      const kreditSum = await prisma.mutasiRecord.aggregate({
        where: {
          investorId: investor.id,
          tanggal: { lte: endOfMonthForSaldo },
          mutasi: "KREDIT",
        },
        _sum: { nilai_mutasi: true },
      });

      const debetSum = await prisma.mutasiRecord.aggregate({
        where: {
          investorId: investor.id,
          tanggal: { lte: endOfMonthForSaldo },
          mutasi: "DEBET",
        },
        _sum: { nilai_mutasi: true },
      });

      const saldo =
        Number(kreditSum._sum.nilai_mutasi || 0) -
        Number(debetSum._sum.nilai_mutasi || 0);
      saldoMap.set(investor.id, saldo);
      totalSaldo += saldo;
    }),
  );

  // Dana Tersedia: total saldo per bulan (sum of all investor saldos for the month)
  const danaTersedia = totalSaldo;

  // Calculate Modal: total nilai from breakdowns for selected month or current month
  let startOfMonth: Date;
  let endOfMonth: Date;

  if (month) {
    const monthNum = parseInt(month);
    const currentYear = new Date().getFullYear();
    startOfMonth = new Date(currentYear, monthNum - 1, 1);
    endOfMonth = new Date(currentYear, monthNum, 0);
  } else {
    const currentMonth = new Date();
    startOfMonth = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      1,
    );
    endOfMonth = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() + 1,
      0,
    );
  }

  const modalAggregate = await prisma.breakdown.aggregate({
    where: {
      tanggal: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
    },
    _sum: {
      nilai: true,
    },
  });
  const modal = modalAggregate._sum?.nilai
    ? Number(modalAggregate._sum.nilai)
    : 0;

  // Persen-M: modal / danaTersedia * 100 (following Persen A formula from dana page)
  const persenM = danaTersedia > 0 ? (modal / danaTersedia) * 100 : 0;

  // Bagi Hasil: 5% of modal, then deduct 5% admin fee (following dana page formula)
  const bagiHasil = 0.05 * modal * 0.95;
  const adminFee = 0.05 * modal * 0.05;

  // Persen-B: bagiHasil / modal * 100 (following dana page formula)
  const persenB = modal > 0 ? (bagiHasil / modal) * 100 : 0;

  const investments = await Promise.all(
    investors.map(async (investor) => {
      const saldo = saldoMap.get(investor.id) || 0;

      // Calculate persen
      const persen = totalSaldo > 0 ? (saldo / totalSaldo) * 100 : 0;

      // Calculate dana_terpakai: Saldo × Persen-M
      const dana_terpakai = saldo * (persenM / 100);

      // Calculate bagi_hasil: persen / 100 * bagiHasil
      const bagi_hasil = (persen / 100) * bagiHasil;

      return {
        id: investor.id,
        kode: investor.kode,
        nama: investor.nama,
        saldo,
        persen,
        dana_terpakai,
        bagi_hasil,
      };
    }),
  );
  return {
    investments,
    modal,
    persenM,
    bagiHasil,
    persenB,
    adminFee,
    danaTersedia,
  };
};

const InvestmentsPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) => {
  const { month } = await searchParams;
  const currentMonth = new Date().getMonth() + 1;
  const effectiveMonth = month || currentMonth.toString();
  const {
    investments,
    modal,
    persenM,
    bagiHasil,
    persenB,
    adminFee,
    danaTersedia,
  } = await getData(effectiveMonth);
  const monthName =
    months.find((m) => m.month === parseInt(effectiveMonth))?.name || null;

  return (
    <InvestmentsClient
      data={investments}
      modal={modal}
      persenM={persenM}
      bagiHasil={bagiHasil}
      persenB={persenB}
      adminFee={adminFee}
      danaTersedia={danaTersedia}
      month={month}
      monthName={monthName}
    />
  );
};

export default InvestmentsPage;
