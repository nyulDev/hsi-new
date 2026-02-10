import { EditDepositForm } from "./edit-deposit-form";
import { prisma } from "../../../../../lib/prisma";

const getData = async (id: string) => {
  const deposit = await prisma.deposit.findUnique({
    where: { id },
    include: {
      investor: true,
    },
  });

  if (!deposit) {
    throw new Error("Deposit not found");
  }

  const investors = await prisma.investor.findMany({
    select: {
      id: true,
      kode: true,
      nama: true,
    },
  });

  return {
    deposit: {
      ...deposit,
      nilai: Number(deposit.nilai),
      suku_bunga: Number(deposit.suku_bunga),
      bunga_diterima: Number(deposit.bunga_diterima),
      total_akhir: Number(deposit.total_akhir),
    },
    investors,
  };
};

interface EditDepositPageProps {
  params: Promise<{
    id: string;
  }>;
}

const EditDepositPage = async ({ params }: EditDepositPageProps) => {
  const { id } = await params;
  const { deposit, investors } = await getData(id);

  return (
    <div className="container mx-auto py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Edit Deposit</h1>
        <p className="text-muted-foreground">
          Update the deposit information below.
        </p>
      </div>
      <EditDepositForm deposit={deposit} investors={investors} />
    </div>
  );
};

export default EditDepositPage;
