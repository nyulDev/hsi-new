// src/app/cashflow/cashflow-client.tsx
"use client";

import React from "react";
import { Cashflow, columns } from "./columns";
import { AddCashflowDialog } from "./add-cashflow-dialog";
import { DataTable } from "@/app/(dashboard)/breakdowns/data-table"; // Re-use data-table from breakdowns
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

interface CashflowClientProps {
  data: Cashflow[];
}

export const CashflowClient: React.FC<CashflowClientProps> = ({ data }) => {
  const [searchText, setSearchText] = React.useState("");
  const [rowSelection, setRowSelection] = React.useState({});

  const filteredData = React.useMemo(
    () =>
      data.filter(
        (item: any) =>
          item.keterangan?.toLowerCase().includes(searchText.toLowerCase()) ||
          item.pt?.toLowerCase().includes(searchText.toLowerCase())
      ),
    [data, searchText]
  );

  const selectedRows = React.useMemo(() => {
    return Object.keys(rowSelection).filter(
      (key) => (rowSelection as any)[key]
    );
  }, [rowSelection]);

  const handleBulkDelete = async () => {
    if (selectedRows.length === 0) return;
    if (
      !confirm(
        `Apakah Anda yakin ingin menghapus ${selectedRows.length} data yang dipilih?`
      )
    )
      return;

    try {
      const deletePromises = selectedRows.map((index) => {
        const item = filteredData[parseInt(index)];
        return fetch(`/api/cashflow/${item.id}`, { method: "DELETE" });
      });

      const responses = await Promise.all(deletePromises);
      const allOk = responses.every((res) => res.ok);

      if (allOk) {
        window.location.reload();
      } else {
        alert("Gagal menghapus beberapa data.");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Terjadi kesalahan.");
    }
  };

  return (
    <div className="">
      <div className="mb-8 px-4 py-2 bg-secondary rounded-md flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h1 className="font-semibold">Cashflow</h1>
          <Input
            placeholder="Cari keterangan, PT..."
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            className="max-w-sm"
          />
          {selectedRows.length > 0 && (
            <Button
              variant="destructive"
              onClick={handleBulkDelete}
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Hapus {selectedRows.length} Terpilih
            </Button>
          )}
        </div>
        <AddCashflowDialog />
      </div>
      <DataTable
        columns={columns}
        data={filteredData}
        rowSelection={rowSelection}
        setRowSelection={setRowSelection}
      />
    </div>
  );
};
