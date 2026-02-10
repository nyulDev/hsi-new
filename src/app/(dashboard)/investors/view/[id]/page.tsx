import { notFound } from "next/navigation";
import { prisma } from "../../../../../lib/prisma";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import Link from "next/link";

async function getInvestor(id: string) {
  const investor = await prisma.investor.findUnique({
    where: { id },
  });
  return investor;
}

export default async function ViewInvestorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const investor = await getInvestor(id);

  if (!investor) {
    notFound();
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">View Investor</h1>
      <div className="space-y-4 max-w-md">
        <div>
          <Label>ID:</Label>
          <p>{investor.id}</p>
        </div>
        <div>
          <Label>Nama:</Label>
          <p>{investor.nama || "N/A"}</p>
        </div>
        <div>
          <Label>Kode:</Label>
          <p>{investor.kode || "N/A"}</p>
        </div>
        <div>
          <Label>Email:</Label>
          <p>{investor.email || "N/A"}</p>
        </div>
        <div>
          <Label>Rekening Bank:</Label>
          <p>{investor.rekening_bank || "N/A"}</p>
        </div>
        <div>
          <Label>Atas Nama Rekening:</Label>
          <p>{investor.atas_nama_rekening || "N/A"}</p>
        </div>
        <div>
          <Label>Whatsapp:</Label>
          <p>{investor.whatsapp || "N/A"}</p>
        </div>
        <div>
          <Label>Created At:</Label>
          <p>{investor.createdAt.toLocaleString()}</p>
        </div>
        <div>
          <Label>Updated At:</Label>
          <p>{investor.updatedAt.toLocaleString()}</p>
        </div>
      </div>
      <Link href="/investors">
        <Button>Back</Button>
      </Link>
    </div>
  );
}
