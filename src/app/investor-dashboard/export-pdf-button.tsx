"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import jsPDF from "jspdf";

interface Transaction {
  id: string;
  tanggal: string;
  kode: string;
  nama: string | null;
  rekening_bank: string | null;
  mutasi: "KREDIT" | "DEBET";
  nilai_mutasi: number;
  saldo_akhir: number;
  keterangan: string | null;
}

interface Investor {
  nama: string;
  kode: string;
  rekening_bank: string;
  atas_nama_rekening: string;
  whatsapp: string;
  email: string;
}

interface ExportPdfButtonProps {
  investor: Investor;
  transactions: Transaction[];
}

export function ExportPdfButton({
  investor,
  transactions,
}: ExportPdfButtonProps) {
  console.log(
    "ExportPdfButton rendered with investor:",
    investor.kode,
    "transactions:",
    transactions.length,
  );

  const exportToPDF = async () => {
    try {
      // Filter transactions for last 3 months
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

      const recentTransactions = transactions.filter(
        (transaction) => new Date(transaction.tanggal) >= threeMonthsAgo,
      );

      // Calculate summary for last 3 months
      recentTransactions.sort(
        (a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime(),
      );
      const totalSaldo =
        recentTransactions.length > 0 ? recentTransactions[0].saldo_akhir : 0;

      // Calculate Dana Tersedia: latest saldo_akhir in the current month
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth(); // 0-based
      const currentMonthTransactions = transactions.filter((t) => {
        const date = new Date(t.tanggal);
        return (
          date.getFullYear() === currentYear && date.getMonth() === currentMonth
        );
      });
      currentMonthTransactions.sort(
        (a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime(),
      );
      const availableFunds =
        currentMonthTransactions.length > 0
          ? currentMonthTransactions[0].saldo_akhir
          : 0;

      // Calculate Held Funds (Dana Ditahan): Total Saldo Investor - Dana Tersedia
      const heldFunds = totalSaldo - availableFunds;

      // Create PDF
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // Add logo
      try {
        const logoResponse = await fetch("/light.png");
        const logoBlob = await logoResponse.blob();
        const logoBase64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(logoBlob);
        });
        pdf.addImage(logoBase64, "PNG", pageWidth - 40, 10, 30, 30);
      } catch (error) {
        console.warn("Logo not found, continuing without logo");
      }

      // Title
      pdf.setFontSize(20);
      pdf.setFont("helvetica", "bold");
      pdf.text("Laporan Mutasi Transaksi", 20, 25);

      // Period
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "normal");
      const periodText = `Periode: ${threeMonthsAgo.toLocaleDateString(
        "id-ID",
      )} - ${new Date().toLocaleDateString("id-ID")}`;
      pdf.text(periodText, 20, 35);

      // Investor Info
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.text("Informasi Investor", 20, 50);

      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      pdf.text(`Kode: ${investor.kode}`, 20, 68);
      pdf.text(`Nama: ${investor.nama}`, 20, 60);
      pdf.text(`Email: ${investor.email}`, 20, 76);
      pdf.text(`Rekening: ${investor.rekening_bank}`, 20, 84);

      // Summary
      // pdf.setFontSize(14);
      // pdf.setFont("helvetica", "bold");
      // pdf.text("Ringkasan 3 Bulan Terakhir", 110, 50);

      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      pdf.text(
        `Dana Tersedia : ${new Intl.NumberFormat("id-ID", {
          style: "decimal",
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(availableFunds)}`,
        110,
        60,
      );
      pdf.text(
        `Dana Ditahan : ${new Intl.NumberFormat("id-ID", {
          style: "decimal",
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(heldFunds)}`,
        110,
        68,
      );
      pdf.text(
        `Total Saldo Investor: ${new Intl.NumberFormat("id-ID", {
          style: "decimal",
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(totalSaldo)}`,
        110,
        76,
      );
      // pdf.text(`Jumlah Transaksi: ${recentTransactions.length}`, 20, 144);

      // Transactions Table
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.text("Detail Transaksi", 20, 100);

      let yPosition = 110;
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "bold");

      const headers = [
        "Tanggal",
        "Jenis",
        "Nilai",
        "Saldo Akhir",
        "Keterangan",
      ];
      const columnWidths = [25, 20, 35, 35, 55];
      let xPosition = 20;

      headers.forEach((header, index) => {
        if (index === 2 || index === 3) {
          pdf.text(header, xPosition + columnWidths[index] - 2, yPosition, {
            align: "right",
          });
        } else {
          pdf.text(header, xPosition, yPosition);
        }
        xPosition += columnWidths[index];
      });

      pdf.setFont("helvetica", "normal");
      yPosition += 8;

      let pageNumber = 1;
      const itemsPerPage = 25;

      for (let i = 0; i < recentTransactions.length; i++) {
        const transaction = recentTransactions[i];

        if (yPosition > pageHeight - 30) {
          // Add page number
          pdf.setFontSize(8);
          pdf.text(`Halaman ${pageNumber}`, pageWidth / 2, pageHeight - 10, {
            align: "center",
          });
          pageNumber++;

          // New page
          pdf.addPage();
          yPosition = 30;

          // Redraw headers
          pdf.setFontSize(9);
          pdf.setFont("helvetica", "bold");
          xPosition = 20;
          headers.forEach((header, index) => {
            if (index === 2 || index === 3) {
              pdf.text(header, xPosition + columnWidths[index] - 2, yPosition, {
                align: "right",
              });
            } else {
              pdf.text(header, xPosition, yPosition);
            }
            xPosition += columnWidths[index];
          });
          pdf.setFont("helvetica", "normal");
          yPosition += 8;
        }

        xPosition = 20;
        const rowData = [
          new Date(transaction.tanggal).toLocaleDateString("id-ID"),
          transaction.mutasi,
          new Intl.NumberFormat("id-ID", {
            style: "decimal",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }).format(transaction.nilai_mutasi),
          new Intl.NumberFormat("id-ID", {
            style: "decimal",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }).format(transaction.saldo_akhir),
          transaction.keterangan || "",
        ];

        rowData.forEach((data, idx) => {
          const text = data.toString();
          const maxWidth = columnWidths[idx] - 2;
          const truncatedText =
            pdf.getTextWidth(text) > maxWidth
              ? text.substring(
                  0,
                  Math.floor(maxWidth / pdf.getTextWidth("W")),
                ) + "..."
              : text;

          if (idx === 2 || idx === 3) {
            pdf.text(
              truncatedText,
              xPosition + columnWidths[idx] - 2,
              yPosition,
              { align: "right" },
            );
          } else {
            pdf.text(truncatedText, xPosition + 1, yPosition);
          }
          xPosition += columnWidths[idx];
        });

        yPosition += 6;
      }

      // Add final page number
      pdf.setFontSize(8);
      pdf.text(`Halaman ${pageNumber}`, pageWidth / 2, pageHeight - 10, {
        align: "center",
      });

      // Save PDF
      const fileName = `mutasi-${investor.kode}-${
        new Date().toISOString().split("T")[0]
      }.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert(
        `Gagal membuat PDF: ${
          error instanceof Error ? error.message : "Unknown error"
        }. Silakan coba lagi.`,
      );
    }
  };

  return (
    <Button onClick={exportToPDF} variant="outline" size="sm">
      <Download className="mr-2 h-4 w-4" />
      Export PDF
    </Button>
  );
}
