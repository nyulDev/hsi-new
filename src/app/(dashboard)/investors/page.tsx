import { InvestorsClient } from "./investors-client";
import { prisma } from "../../../lib/prisma";

const getData = async () => {
  const investors = await prisma.investor.findMany({
    select: {
      id: true,
      kode: true,
      nama: true,
      rekening_bank: true,
      atas_nama_rekening: true,
      whatsapp: true,
      email: true,
    },
  });

  return investors;
};

const InvestorsPage = async () => {
  const data = await getData();
  return <InvestorsClient data={data} />;
};

export default InvestorsPage;
