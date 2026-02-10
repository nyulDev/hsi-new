"use client";

import { Deposit, columns } from "./columns";
import { DataTable } from "./data-table";
import { AddDepositDialog } from "./add-deposit-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2 } from "lucide-react";
import React from "react";

interface DepositsClientProps {
  deposits: Deposit[];
  investors: { id: string; kode: string | null; nama: string | null }[];
}

export function DepositsClient({ deposits, investors }: DepositsClientProps) {
  const [searchText, setSearchText] = React.useState("");
  const [rowSelection, setRowSelection] = React.useState({});

  const filteredData = React.useMemo(
    () =>
      deposits.filter(
        (item: any) =>
          item.kode?.toLowerCase().includes(searchText.toLowerCase()) ||
          item.nama?.toLowerCase().includes(searchText.toLowerCase()) ||
          item.investor?.kode
            ?.toLowerCase()
            .includes(searchText.toLowerCase()) ||
          item.investor?.nama?.toLowerCase().includes(searchText.toLowerCase())
      ),
    [deposits, searchText]
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
        `Apakah Anda yakin ingin menghapus ${selectedRows.length} deposit yang dipilih?`
      )
    )
      return;

    try {
      const deletePromises = selectedRows.map((index) => {
        const item = deposits[parseInt(index)];
        return fetch(`/api/deposits/${item.id}`, { method: "DELETE" });
      });

      const responses = await Promise.all(deletePromises);
      const allOk = responses.every((res) => res.ok);

      if (allOk) {
        window.location.reload();
      } else {
        alert("Gagal menghapus beberapa deposit.");
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
          <h1 className="font-semibold">All Deposits</h1>
          <Input
            placeholder="Cari kode, nama, ..."
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
        <AddDepositDialog investors={investors} />
      </div>
      <DataTable
        columns={columns}
        data={filteredData}
        rowSelection={rowSelection}
        setRowSelection={setRowSelection}
      />
    </div>
  );
}
