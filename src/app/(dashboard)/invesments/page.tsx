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

  // Calculate date range for saldo calculation
  let startOfMonth: Date;
  let endOfMonth: Date;
  let isAllTime = false;

  if (month && month !== "all") {
    const monthNum = parseInt(month);
    const currentYear = new Date().getFullYear();
    startOfMonth = new Date(currentYear, monthNum - 1, 1);
    endOfMonth = new Date(currentYear, monthNum, 0);
  } else if (month === "all") {
    // For "all", use all time
    startOfMonth = new Date(2000, 0, 1); // Far past date
    endOfMonth = new Date(); // Current date
    isAllTime = true;
  } else {
    // Default to current month
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

  // Calculate modal from total investasi per bulan from breakdowns
  const breakdowns = await prisma.breakdown.findMany({
    select: {
      tanggal: true,
      nilai: true,
    },
  });

  let filteredBreakdowns = breakdowns;
  if (month && month !== "all") {
    const monthNum = parseInt(month);
    filteredBreakdowns = breakdowns.filter(
      (d) => new Date(d.tanggal).getMonth() + 1 === monthNum,
    );
  } else if (!month || month === "all") {
    // For "all" or default, use all
    filteredBreakdowns = breakdowns;
  }

  const modalValue = filteredBreakdowns.reduce(
    (sum, b) => sum + Number(b.nilai),
    0,
  );

  // Get all approved mutasi records for all investors up to the end of the selected period
  const mutasiWhereCondition: any = {
    investorId: { in: investors.map((inv) => inv.id) },
    admin2_status: "APPROVE",
    tanggal: { lte: endOfMonthForSaldo },
  };

  const allMutasiRecords = await prisma.mutasiRecord.findMany({
    where: mutasiWhereCondition,
    select: {
      investorId: true,
      mutasi: true,
      nilai_mutasi: true,
    },
  });

  // Group by investorId and calculate saldo
  const saldoByInvestor = new Map<string, number>();
  for (const record of allMutasiRecords) {
    const currentSaldo = saldoByInvestor.get(record.investorId) || 0;
    const nilai = Number(record.nilai_mutasi);
    if (record.mutasi === "KREDIT") {
      saldoByInvestor.set(record.investorId, currentSaldo + nilai);
    } else {
      saldoByInvestor.set(record.investorId, currentSaldo - nilai);
    }
  }

  // Set saldos for each investor
  for (const investor of investors) {
    const saldo = saldoByInvestor.get(investor.id) || 0;
    saldoMap.set(investor.id, saldo);
    totalSaldo += saldo;
  }

  // Dana Tersedia: total saldo per bulan (sum of all investor saldos for the month)
  const danaTersedia = totalSaldo;

  // Modal: total investasi per bulan from breakdowns
  const modal = modalValue;

  // Persen-M: modal / danaTersedia * 100, capped at 100%
  const persenM =
    danaTersedia > 0 ? Math.min(100, (modal / danaTersedia) * 100) : 0;

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
      key={effectiveMonth}
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
