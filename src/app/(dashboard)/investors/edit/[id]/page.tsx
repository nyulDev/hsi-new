import { notFound } from "next/navigation";
import { prisma } from "../../../../../lib/prisma";
import { EditInvestorForm } from "@/app/(dashboard)/investors/edit/[id]/edit-investor-form";

async function getInvestor(id: string) {
  const investor = await prisma.investor.findUnique({
    where: { id },
  });
  return investor;
}

export default async function EditInvestorPage({
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
      <h1 className="text-2xl font-bold mb-6">Edit Investor</h1>
      <EditInvestorForm investor={investor} />
    </div>
  );
}
