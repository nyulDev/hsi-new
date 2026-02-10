import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "../../../lib/prisma";
import { MonthFilter } from "./month-filter";

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

const getData = async (month?: string) => {
  // Total Dana Tersedia: sum of deposit.nilai
  const totalDanaTersedia = await prisma.deposit.aggregate({
    _sum: {
      nilai: true,
    },
  });
  const danaTersedia = Number(totalDanaTersedia._sum.nilai || 0);

  // Calculate start and end of month
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
      1
    );
    endOfMonth = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() + 1,
      0
    );
  }

  // Check if today is the last day of the month
  const today = new Date();
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const isEndOfMonth = today.getDate() === lastDayOfMonth.getDate();

  // Total Dana Terpakai: sum of breakdown.nilai for selected month, only if end of month
  let danaTerpakai = 0;
  if (isEndOfMonth) {
    const totalDanaTerpakai = await prisma.breakdown.aggregate({
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
    danaTerpakai = Number(totalDanaTerpakai._sum.nilai || 0);
  }

  // PersenA: (Dana Terpakai / Dana Tersedia) * 100
  const persenA = danaTersedia > 0 ? (danaTerpakai / danaTersedia) * 100 : 0;

  // Bagi Hasil: 5% of Dana Terpakai, then deduct 5% admin fee
  const bagiHasil = 0.05 * danaTerpakai * 0.95;

  // PersenB: (Bagi Hasil / Dana Terpakai) * 100
  const persenB = danaTerpakai > 0 ? (bagiHasil / danaTerpakai) * 100 : 0;

  return {
    danaTersedia,
    danaTerpakai,
    persenA,
    bagiHasil,
    persenB,
  };
};

const DanaPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) => {
  const { month } = await searchParams;
  const { danaTersedia, danaTerpakai, persenA, bagiHasil, persenB } =
    await getData(month);
  const potonganFee = 0.05 * danaTerpakai * 0.05; // 5% of the 5% bagi hasil
  const monthName = month
    ? months.find((m) => m.month === parseInt(month))?.name
    : null;

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold">
          {monthName ? `Dana - ${monthName}` : "Dana"}
        </h1>
        <MonthFilter currentMonth={month} />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dana Tersedia</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-indigo-700">
              {new Intl.NumberFormat("id-ID", {
                style: "currency",
                currency: "IDR",
              }).format(danaTersedia)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dana Terpakai</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-emerald-600">
              {new Intl.NumberFormat("id-ID", {
                style: "currency",
                currency: "IDR",
              }).format(danaTerpakai)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Persen A</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-cyan-600">
              {persenA.toFixed(2)}%
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bagi Hasil</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-rose-700">
              {new Intl.NumberFormat("id-ID", {
                style: "currency",
                currency: "IDR",
              }).format(bagiHasil)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Setelah potongan 5% fee admin (
              {new Intl.NumberFormat("id-ID", {
                style: "currency",
                currency: "IDR",
              }).format(potonganFee)}
              )
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Persen B</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-cyan-600">
              {persenB.toFixed(2)}%
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DanaPage;
