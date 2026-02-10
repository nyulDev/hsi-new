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

export type RekapInvest = {
  id: string;
  kode: string | null;
  tanggal: Date;
  project_pt: string | null;
  keterangan: string | null;
  nilai: number;
  profit: number;
  investorShare: number;
  hsiShare: number;
};

const ActionsCell = ({ row }: { row: any }) => {
  const router = useRouter();
  const rekapInvest = row.original;
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/breakdowns/${rekapInvest.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.refresh(); // Refresh the page to show updated data
      } else {
        const error = await response.json();
        alert(error.error || "Gagal menghapus breakdown");
      }
    } catch (error) {
      console.error("Error deleting breakdown:", error);
      alert("Gagal menghapus breakdown");
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
                breakdown secara permanen dan menghapus data dari server.
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

export const getColumns = (userRole?: string): ColumnDef<RekapInvest>[] => {
  const baseColumns: ColumnDef<RekapInvest>[] = [
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
        const date = new Date(row.getValue("tanggal"));
        return <div>{date.toLocaleDateString("id-ID")}</div>;
      },
    },
    {
      accessorKey: "project_pt",
      header: "Project",
    },
    {
      accessorKey: "keterangan",
      header: "Keterangan",
    },
    {
      accessorKey: "nilai",
      header: () => <div className="text-right">Investasi Nilai</div>,
      cell: ({ row }) => {
        const nilai = parseFloat(row.getValue("nilai"));
        const formatted = new Intl.NumberFormat("id-ID", {
          style: "currency",
          currency: "IDR",
          maximumFractionDigits: 0,
        }).format(nilai);

        return <div className="text-right font-medium">{formatted}</div>;
      },
    },
    {
      accessorKey: "profit",
      header: () => <div className="text-right">Profit</div>,
      cell: ({ row }) => {
        const profit = parseFloat(row.getValue("profit"));
        const formatted = new Intl.NumberFormat("id-ID", {
          style: "currency",
          currency: "IDR",
          maximumFractionDigits: 0,
        }).format(profit);

        return <div className="text-right font-medium">{formatted}</div>;
      },
    },
    {
      accessorKey: "investorShare",
      header: () => <div className="text-right">Investor 62.5%</div>,
      cell: ({ row }) => {
        const investorShare = parseFloat(row.getValue("investorShare"));
        const formatted = new Intl.NumberFormat("id-ID", {
          style: "currency",
          currency: "IDR",
          maximumFractionDigits: 0,
        }).format(investorShare);

        return <div className="text-right font-medium">{formatted}</div>;
      },
    },
    {
      accessorKey: "hsiShare",
      header: () => <div className="text-right">HSI 37.5%</div>,
      cell: ({ row }) => {
        const hsiShare = parseFloat(row.getValue("hsiShare"));
        const formatted = new Intl.NumberFormat("id-ID", {
          style: "currency",
          currency: "IDR",
          maximumFractionDigits: 0,
        }).format(hsiShare);

        return <div className="text-right font-medium">{formatted}</div>;
      },
    },
  ];

  // Only add actions column if user is not "USER"
  if (userRole !== "USER") {
    baseColumns.push({
      id: "actions",
      cell: ({ row }) => <ActionsCell row={row} />,
    });
  }

  return baseColumns;
};
