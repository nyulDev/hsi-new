// src/app/cashflow/columns.tsx
"use client";

import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
// import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";

import { Checkbox } from "@/components/ui/checkbox";
import { ArrowUpDown, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

export type Cashflow = {
  id: string;
  tanggal: Date;
  keterangan: string | null;
  pt: string;
  mutasi: "DEBET" | "KREDIT";
  nilai: number;
  saldo: number;
};

const handleDelete = async (id: string) => {
  if (!confirm("Apakah Anda yakin ingin menghapus data ini?")) return;
  try {
    const response = await fetch(`/api/cashflow/${id}`, { method: "DELETE" });
    if (response.ok) {
      window.location.reload();
    } else {
      alert("Gagal menghapus data.");
    }
  } catch (error) {
    console.error("Error:", error);
    alert("Terjadi kesalahan.");
  }
};

export const columns: ColumnDef<Cashflow>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "tanggal",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Tanggal
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const date = row.getValue("tanggal") as Date;
      return format(new Date(date), "dd MMM yyyy", { locale: localeId });
    },
  },
  {
    accessorKey: "pt",
    header: "PT",
    cell: ({ row }) => {
      const pt = row.original.pt.replace(/_/g, "-").toLowerCase();
      return <Badge variant="outline">{pt}</Badge>;
    },
  },
  {
    accessorKey: "mutasi",
    header: "Mutasi",
    cell: ({ row }) => {
      const mutasi = row.original.mutasi;
      const variant = mutasi === "KREDIT" ? "default" : "destructive";
      return <Badge variant={variant}>{mutasi}</Badge>;
    },
  },
  {
    accessorKey: "nilai",
    header: () => <div className="text-right">Nilai</div>,
    cell: ({ row }) => {
      const formatted = new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
      }).format(row.original.nilai);
      return <div className="text-right font-medium">{formatted}</div>;
    },
  },
  {
    accessorKey: "saldo",
    header: () => <div className="text-right">Saldo</div>,
    cell: ({ row }) => {
      const formatted = new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
      }).format(row.original.saldo);
      return <div className="text-right font-medium">{formatted}</div>;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Buka menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Aksi</DropdownMenuLabel>
          <DropdownMenuItem
            onClick={() => handleDelete(row.original.id)}
            className="text-red-600"
          >
            Hapus
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
];
