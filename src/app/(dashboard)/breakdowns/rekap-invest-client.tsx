"use client";

import { RekapInvest, getColumns } from "./columns";
import { DataTable } from "./data-table";
import { Input } from "@/components/ui/input";
import React from "react";
import { MonthFilter } from "./month-filter";
import { AddBreakdownDialog } from "./add-breakdown-dialog";
import { ExportPdfButton } from "./export-pdf-button";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

interface RekapInvestClientProps {
  data: RekapInvest[];
  month?: string;
  monthName?: string | null;
  totalCards: React.ReactNode;
  showMonthFilter?: boolean;
  showAddBreakdown?: boolean;
  userRole?: string;
  totalNilai: number;
  totalProfit: number;
  totalInvestorShare: number;
  totalHSIShare: number;
}

export function RekapInvestClient({
  data,
  month,
  monthName,
  totalCards,
  showMonthFilter = true,
  showAddBreakdown = true,
  userRole,
  totalNilai,
  totalProfit,
  totalInvestorShare,
  totalHSIShare,
}: RekapInvestClientProps) {
  const [searchText, setSearchText] = React.useState("");
  const [rowSelection, setRowSelection] = React.useState({});
  const [uploading, setUploading] = React.useState(false);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);

  const filteredData = React.useMemo(
    () =>
      data.filter(
        (item: any) =>
          item.kode?.toLowerCase().includes(searchText.toLowerCase()) ||
          item.project_pt?.toLowerCase().includes(searchText.toLowerCase()) ||
          item.keterangan?.toLowerCase().includes(searchText.toLowerCase()),
      ),
    [data, searchText],
  );

  const selectedRows = React.useMemo(() => {
    return Object.keys(rowSelection).filter(
      (key) => (rowSelection as any)[key],
    );
  }, [rowSelection]);

  const handleFileUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch("/api/breakdowns/upload", {
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
    <div className="">
      <div className="mb-8 px-4 py-2 bg-secondary rounded-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
          <h1 className="font-semibold">
            {monthName ? `Breakdown Invest - ${monthName}` : "Breakdown Invest"}
          </h1>
          {showMonthFilter && <MonthFilter currentMonth={month} />}
          <Input
            placeholder="Cari kode, project, keterangan..."
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            className="max-w-sm"
          />
        </div>
        <div className="flex gap-2">
          {userRole !== "USER" && (
            <>
              <Input
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
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
            </>
          )}
          <ExportPdfButton
            monthName={monthName}
            totalNilai={totalNilai}
            totalProfit={totalProfit}
            totalInvestorShare={totalInvestorShare}
            totalHSIShare={totalHSIShare}
            data={filteredData}
          />
          {showAddBreakdown && <AddBreakdownDialog />}
        </div>
      </div>
      {userRole === "USER" && totalCards}
      <DataTable
        columns={getColumns(userRole)}
        data={filteredData}
        rowSelection={rowSelection}
        setRowSelection={setRowSelection}
      />
    </div>
  );
}
