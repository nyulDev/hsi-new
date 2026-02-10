import { RekapInvest } from "./columns";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { prisma } from "../../../lib/prisma";
import { RekapInvestClient } from "./rekap-invest-client";
import { auth } from "../../../lib/auth";

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
  data: RekapInvest[];
  totalNilai: number;
  totalProfit: number;
  totalInvestorShare: number;
  totalHSIShare: number;
}> => {
  const breakdowns = await prisma.breakdown.findMany({
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      kode: true,
      tanggal: true,
      project_pt: true,
      keterangan: true,
      nilai: true,
      bagi_hasil_per_bulan: true,
    },
  });

  // Convert Decimal to number for client-side rendering
  let data = breakdowns.map((breakdown) => ({
    ...breakdown,
    nilai: Number(breakdown.nilai),
    bagi_hasil_per_bulan: breakdown.bagi_hasil_per_bulan
      ? Number(breakdown.bagi_hasil_per_bulan)
      : null,
    profit: Number(breakdown.nilai) * 0.08,
    investorShare: Number(breakdown.nilai) * 0.08 * 0.625,
    hsiShare: Number(breakdown.nilai) * 0.08 * 0.375,
  }));

  // Filter by month if provided and not "null"
  if (month && month !== "null") {
    const monthNum = parseInt(month);
    data = data.filter((d) => new Date(d.tanggal).getMonth() + 1 === monthNum);
  }

  const totalNilai = data.reduce((sum, item) => sum + item.nilai, 0);
  const totalProfit = data.reduce((sum, item) => sum + item.profit, 0);
  const totalInvestorShare = data.reduce(
    (sum, item) => sum + item.investorShare,
    0,
  );
  const totalHSIShare = data.reduce((sum, item) => sum + item.hsiShare, 0);

  return {
    data,
    totalNilai,
    totalProfit,
    totalInvestorShare,
    totalHSIShare,
  };
};

const RekapInvestPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) => {
  const session = await auth();
  const userRole = session?.user?.role;

  const { month } = await searchParams;
  // Allow all roles to select month, default to current month
  const currentMonth = new Date().getMonth() + 1;
  const effectiveMonth = month || currentMonth.toString();
  const { data, totalNilai, totalProfit, totalInvestorShare, totalHSIShare } =
    await getData(effectiveMonth);
  const monthName =
    months.find((m) => m.month === parseInt(effectiveMonth))?.name || null;

  const totalCards = (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Investasi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-xl font-bold text-indigo-700">
            {new Intl.NumberFormat("id-ID", {
              style: "currency",
              currency: "IDR",
              maximumFractionDigits: 0,
            }).format(totalNilai)}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-xl font-bold text-emerald-600">
            {new Intl.NumberFormat("id-ID", {
              style: "currency",
              currency: "IDR",
              maximumFractionDigits: 0,
            }).format(totalProfit)}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Investor 62.5%</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-xl font-bold text-cyan-600">
            {new Intl.NumberFormat("id-ID", {
              style: "currency",
              currency: "IDR",
              maximumFractionDigits: 0,
            }).format(totalInvestorShare - totalInvestorShare * 0.05)}
          </div>
          <p className="text-sm text-muted-foreground">
            Potongan admin 5%:{" "}
            {new Intl.NumberFormat("id-ID", {
              style: "currency",
              currency: "IDR",
              maximumFractionDigits: 0,
            }).format(totalInvestorShare * 0.05)}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">HSI 37.5%</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-xl font-bold text-rose-700">
            {new Intl.NumberFormat("id-ID", {
              style: "currency",
              currency: "IDR",
              maximumFractionDigits: 0,
            }).format(totalHSIShare + totalInvestorShare * 0.05)}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <RekapInvestClient
      data={data}
      month={effectiveMonth}
      monthName={monthName}
      totalCards={totalCards}
      showMonthFilter={true}
      showAddBreakdown={userRole === "SUPER_ADMIN"}
      userRole={userRole}
      totalNilai={totalNilai}
      totalProfit={totalProfit}
      totalInvestorShare={totalInvestorShare}
      totalHSIShare={totalHSIShare}
    />
  );
};

export default RekapInvestPage;
