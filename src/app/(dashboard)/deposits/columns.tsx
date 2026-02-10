"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { cn } from "@/lib/utils";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export type Deposit = {
  id: string;
  investorId: string;
  investor: {
    id: string;
    kode: string | null;
    nama: string | null;
  };
  kode: string | null;
  nama: string | null;
  nilai: number;
  tanggal: Date;
  term_months: number;
  jatuh_tempo: Date;
  suku_bunga: number;
  bunga_diterima: number;
  total_akhir: number;
  keterangan: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
};

export const columns: ColumnDef<Deposit>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        checked={row.getIsSelected()}
      />
    ),
  },
  {
    accessorKey: "kode",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Kode
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },

  //   {
  //     accessorKey: "nama",
  //     header: "Nama",
  //   },
  //   {
  //     accessorKey: "investor.kode",
  //     header: "Investor Kode",
  //     cell: ({ row }) => row.original.investor?.kode || "-",
  //   },
  {
    accessorKey: "investor.nama",
    header: "Investor Nama",
    cell: ({ row }) => row.original.investor?.nama || "-",
  },
  {
    accessorKey: "nilai",
    header: "Nilai",
    cell: ({ row }) => {
      const nilai = row.getValue("nilai") as number;
      return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
      }).format(nilai);
    },
  },
  {
    accessorKey: "tanggal",
    header: "Tanggal",
    cell: ({ row }) => {
      const date = row.getValue("tanggal") as Date;
      const day = date.getDate().toString().padStart(2, "0");
      const month = date.toLocaleDateString("id-ID", { month: "short" });
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    },
  },
  // {
  //   accessorKey: "term_months",
  //   header: "Bulan",
  // },
  {
    accessorKey: "jatuh_tempo",
    header: "Jatuh Tempo",
    cell: ({ row }) => {
      const date = row.getValue("jatuh_tempo") as Date;
      const now = new Date();
      const isExpired = date < now;
      const day = date.getDate().toString().padStart(2, "0");
      const month = date.toLocaleDateString("id-ID", { month: "short" });
      const year = date.getFullYear();
      const formattedDate = `${day}/${month}/${year}`;
      return (
        <span
          className={cn(
            isExpired ? "text-green-600 font-bold" : "text-red-600 font-bold"
          )}
        >
          {formattedDate}
        </span>
      );
    },
  },
  // {
  //   accessorKey: "suku_bunga",
  //   header: "Bagi Hasil",
  //   cell: ({ row }) => {
  //     const rate = row.getValue("suku_bunga") as number;
  //     return `${(rate * 100).toFixed(2)}%`;
  //   },
  // },
  {
    accessorKey: "bunga_diterima",
    header: "Bagi Hasil",
    cell: ({ row }) => {
      const bunga = row.getValue("bunga_diterima") as number;
      const jatuhTempo = row.getValue("jatuh_tempo") as Date;
      const now = new Date();
      const isExpired = jatuhTempo < now;
      const formattedBunga = new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
      }).format(bunga);
      return (
        <span
          className={cn(
            isExpired ? "text-green-600 font-bold" : "text-red-600 font-bold"
          )}
        >
          {formattedBunga}
        </span>
      );
    },
  },
  {
    accessorKey: "total_akhir",
    header: "Total",
    cell: ({ row }) => {
      const totalAkhir = row.getValue("total_akhir") as number;
      const jatuhTempo = row.getValue("jatuh_tempo") as Date;
      const now = new Date();
      const isExpired = jatuhTempo < now;
      const formattedTotal = new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
      }).format(totalAkhir);
      return (
        <span
          className={cn(
            isExpired ? "text-green-600 font-bold" : "text-red-600 font-bold"
          )}
        >
          {formattedTotal}
        </span>
      );
    },
  },
  {
    accessorKey: "keterangan",
    header: "Keterangan",
  },
  // {
  //   accessorKey: "status",
  //   header: "Status",
  //   cell: ({ row }) => {
  //     const status = row.getValue("status") as string;
  //     return (
  //       <span
  //         className={cn(
  //           status === "ACTIVE" ? "text-red-600 font-bold" : "text-green-600"
  //         )}
  //       >
  //         {status}
  //       </span>
  //     );
  //   },
  // },

  {
    id: "actions",
    cell: ({ row }) => {
      const deposit = row.original;
      const router = useRouter();

      const handleDelete = async () => {
        if (
          !confirm(`Are you sure you want to delete deposit "${deposit.kode}"?`)
        ) {
          return;
        }

        try {
          const response = await fetch(`/api/deposits/${deposit.id}`, {
            method: "DELETE",
          });

          if (response.ok) {
            // Refresh the page to reflect the changes
            router.refresh();
          } else {
            const error = await response.json();
            alert(error.error || "Failed to delete deposit");
          }
        } catch (error) {
          console.error("Error deleting deposit:", error);
          alert("Failed to delete deposit");
        }
      };

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => {
                router.push(`/deposits/edit/${deposit.id}`);
              }}
            >
              Edit Deposit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                router.push(`/transactions?investorId=${deposit.investorId}`);
              }}
            >
              View Transactions
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleDelete}
              className="text-red-600 focus:text-red-600"
            >
              Delete Deposit
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
