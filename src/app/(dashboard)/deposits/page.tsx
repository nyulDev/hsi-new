import { DepositsClient } from "./deposits-client";
import { prisma } from "../../../lib/prisma";

const getData = async () => {
  const deposits = (
    await prisma.deposit.findMany({
      include: {
        investor: true,
      },
      where: {
        status: "ACTIVE",
      },
      orderBy: {
        createdAt: "desc",
      },
    })
  ).map((d) => ({
    ...d,
    nilai: Number(d.nilai),
    suku_bunga: Number(d.suku_bunga),
    bunga_diterima: Number(d.bunga_diterima),
    total_akhir: Number(d.total_akhir),
  }));

  const investors = await prisma.investor.findMany({
    select: {
      id: true,
      kode: true,
      nama: true,
    },
  });

  return { deposits, investors };
};

const DepositsPage = async () => {
  const { deposits, investors } = await getData();
  return <DepositsClient deposits={deposits} investors={investors} />;
};

export default DepositsPage;
