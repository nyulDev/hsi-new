// src/app/cashflow/page.tsx
import { prisma } from "@/lib/prisma";
import { CashflowClient } from "./cashflow-client";
import { Cashflow } from "./columns";

const getData = async (): Promise<Cashflow[]> => {
  const cashflows = await prisma.cashflow.findMany({
    orderBy: {
      tanggal: "asc", // Order by date ascending to calculate saldo correctly
    },
  });

  // Convert Decimal to number
  return cashflows
    .map((item) => ({
      ...item,
      nilai: Number(item.nilai),
      saldo: Number(item.saldo),
    }))
    .sort(
      (a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()
    ); // Then sort descending for display
};

const CashflowPage = async () => {
  const data = await getData();

  return <CashflowClient data={data} />;
};

export default CashflowPage;
