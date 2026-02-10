"use client";

import { Investor, columns } from "./colomns";
import { DataTable } from "./data-table";
import { AddInvestorDialog } from "./add-investor-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Upload } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import React from "react";

interface InvestorsClientProps {
  data: Investor[];
}

export function InvestorsClient({ data }: InvestorsClientProps) {
  const [searchText, setSearchText] = React.useState("");
  const [rowSelection, setRowSelection] = React.useState({});
  const [uploading, setUploading] = React.useState(false);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);

  const filteredData = React.useMemo(
    () =>
      data.filter(
        (item: any) =>
          item.kode?.toLowerCase().includes(searchText.toLowerCase()) ||
          item.nama?.toLowerCase().includes(searchText.toLowerCase()) ||
          item.rekening_bank
            ?.toLowerCase()
            .includes(searchText.toLowerCase()) ||
          item.atas_nama_rekening
            ?.toLowerCase()
            .includes(searchText.toLowerCase()) ||
          item.whatsapp?.toLowerCase().includes(searchText.toLowerCase()) ||
          item.email?.toLowerCase().includes(searchText.toLowerCase()),
      ),
    [data, searchText],
  );

  const selectedRows = React.useMemo(() => {
    return Object.keys(rowSelection).filter(
      (key) => (rowSelection as any)[key],
    );
  }, [rowSelection]);

  const handleBulkDelete = async () => {
    if (selectedRows.length === 0) return;
    if (
      !confirm(
        `Apakah Anda yakin ingin menghapus ${selectedRows.length} investor yang dipilih?`,
      )
    )
      return;

    try {
      const deletePromises = selectedRows.map((index) => {
        const item = data[parseInt(index)];
        return fetch(`/api/investors/${item.id}`, { method: "DELETE" });
      });

      const responses = await Promise.all(deletePromises);
      const allOk = responses.every((res) => res.ok);

      if (allOk) {
        window.location.reload();
      } else {
        alert("Gagal menghapus beberapa investor.");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Terjadi kesalahan.");
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch("/api/investors/upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        alert(result.message);
        if (result.results.errors.length > 0) {
          alert(`Errors: ${result.results.errors.join("\n")}`);
        }
        if (result.results.duplicates.length > 0) {
          alert(`Duplicates: ${result.results.duplicates.join("\n")}`);
        }
        window.location.reload();
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Terjadi kesalahan saat upload.");
    } finally {
      setUploading(false);
      setSelectedFile(null);
    }
  };

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="px-4 lg:px-6">
            <Card className="mx-4">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-center">
                  All Investors
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-8 px-4 py-2 bg-secondary rounded-md flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <h1 className="font-semibold">All Investors</h1>
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
                  <div className="flex items-center gap-4">
                    <Input
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={(e) =>
                        setSelectedFile(e.target.files?.[0] || null)
                      }
                      className="max-w-xs"
                    />
                    <Button
                      onClick={handleFileUpload}
                      disabled={!selectedFile || uploading}
                      className="flex items-center gap-2"
                    >
                      <Upload className="h-4 w-4" />
                      {uploading ? "Uploading..." : "Upload Excel"}
                    </Button>
                    <AddInvestorDialog />
                  </div>
                </div>
                <DataTable
                  columns={columns}
                  data={filteredData}
                  rowSelection={rowSelection}
                  setRowSelection={setRowSelection}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
