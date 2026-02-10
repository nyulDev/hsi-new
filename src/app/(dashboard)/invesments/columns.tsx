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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export type Investment = {
  id: string;
  kode: string | null;
  nama: string | null;
  saldo: number | null;
  persen: number | null;
  dana_terpakai: number | null;
  bagi_hasil: number | null;
};

const ActionsCell = ({ row }: { row: any }) => {
  const router = useRouter();
  const investment = row.original;
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/investors/${investment.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.refresh(); // Refresh the page to show updated data
      } else {
        const error = await response.json();
        alert(error.error || "Gagal menghapus investment");
      }
    } catch (error) {
      console.error("Error deleting investment:", error);
      alert("Gagal menghapus investment");
    } finally {
      setIsDeleting(false);
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
            router.push(`/investors/edit/${investment.id}`);
          }}
        >
          Edit Investment
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            router.push(`/investors/view/${investment.id}`);
          }}
        >
          View Investment
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <DropdownMenuItem
              onSelect={(e) => e.preventDefault()}
              className="text-red-600 focus:text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle>
              <AlertDialogDescription>
                Tindakan ini tidak dapat dibatalkan. Ini akan menghapus
                investment secara permanen dan menghapus data dari server.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700"
              >
                {isDeleting ? "Menghapus..." : "Hapus"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export const columns: ColumnDef<Investment>[] = [
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
  {
    accessorKey: "nama",
    header: "Nama",
  },
  {
    accessorKey: "saldo",
    header: () => <div className="text-right">Saldo</div>,
    cell: ({ row }) => {
      const saldo = parseFloat(row.getValue("saldo"));
      const formatted = saldo.toLocaleString("id-ID", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      });

      return <div className="text-right font-medium">{formatted}</div>;
    },
  },
  {
    accessorKey: "persen",
    header: () => <div className="text-right">Persen</div>,
    cell: ({ row }) => {
      const persen = parseFloat(row.getValue("persen"));
      const formatted = `${persen.toFixed(2)}%`;

      return <div className="text-right font-medium">{formatted}</div>;
    },
  },
  {
    accessorKey: "dana_terpakai",
    header: () => <div className="text-right">Dana Terpakai</div>,
    cell: ({ row }) => {
      const dana = parseFloat(row.getValue("dana_terpakai"));
      const formatted = dana.toLocaleString("id-ID", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      });

      return <div className="text-right font-medium">{formatted}</div>;
    },
  },
  {
    accessorKey: "bagi_hasil",
    header: () => <div className="text-right">Bagi Hasil</div>,
    cell: ({ row }) => {
      const bagi = parseFloat(row.getValue("bagi_hasil"));
      const formatted = bagi.toLocaleString("id-ID", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      });

      return <div className="text-right font-medium">{formatted}</div>;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <ActionsCell row={row} />,
  },
];
