"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface ExportPdfButtonProps {
  summary: {
    transactionCount: number;
    currentSaldo: number;
  };
  investors: Array<{
    kode: string;
    nama: string | null;
    rekening_bank: string | null;
    whatsapp: string | null;
    saldo_akhir: number;
  }>;
}

export function ExportPdfButton({ summary, investors }: ExportPdfButtonProps) {
  const exportToPDF = async () => {
    try {
      // Create a new jsPDF instance
      const pdf = new jsPDF("l", "mm", "a4");

      // Get page dimensions
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // Fetch and add logo
      const logoResponse = await fetch("/Logo-HSI.jpg");
      const logoBlob = await logoResponse.blob();
      const logoBase64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(logoBlob);
      });
      pdf.addImage(logoBase64, "JPEG", pageWidth - 40, 10, 30, 30);

      // Set font
      pdf.setFont("helvetica");

      // Title
      pdf.setFontSize(20);
      pdf.setFont("helvetica", "bold");
      const title = "Rekap Investor";
      pdf.text(title, 20, 20);

      // Summary section
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.text("Ringkasan", 20, 55);

      pdf.setFontSize(12);
      pdf.setFont("helvetica", "normal");
      pdf.text(
        `Saldo Terkini: ${new Intl.NumberFormat("id-ID").format(
          summary.currentSaldo
        )}`,
        20,
        70
      );
      pdf.text(`Total Transaksi: ${summary.transactionCount}`, 20, 80);

      // Table header
      let yPosition = 100;
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "bold");

      const headers = [
        "Kode",
        "Nama",
        "Saldo Akhir",
        "Rekening Bank",
        "WhatsApp",
      ];
      const columnWidths = [35, 75, 50, 60, 35];
      let xPosition = 20;

      // Draw table header (without borders)
      headers.forEach((header, index) => {
        if (index === 2) {
          // Saldo Akhir header - right align
          pdf.text(header, xPosition + columnWidths[index] - 2, yPosition, {
            align: "right",
          });
        } else {
          pdf.text(header, xPosition, yPosition);
        }
        xPosition += columnWidths[index];
      });

      // Table data
      pdf.setFont("helvetica", "normal");
      yPosition += 10;

      // Calculate total saldo akhir
      const totalSaldoAkhir = investors.reduce(
        (sum, investor) => sum + investor.saldo_akhir,
        0
      );

      let pageNumber = 1;
      const totalPages = Math.ceil((investors.length + 1) / 20);

      investors.forEach((investor, index) => {
        if (yPosition > 170) {
          // Add page number before new page
          pdf.setFontSize(8);
          pdf.setFont("helvetica", "normal");
          pdf.text(
            `Page ${pageNumber} of ${totalPages}`,
            pageWidth / 2,
            pageHeight - 10,
            { align: "center" }
          );
          pageNumber++;

          // Check if we need a new page
          pdf.addPage();
          yPosition = 30;

          // Redraw header on new page
          pdf.setFontSize(10);
          pdf.setFont("helvetica", "bold");
          xPosition = 20;

          headers.forEach((header, idx) => {
            if (idx === 2) {
              // Saldo Akhir header - right align
              pdf.text(header, xPosition + columnWidths[idx] - 2, yPosition, {
                align: "right",
              });
            } else {
              pdf.text(header, xPosition, yPosition);
            }
            xPosition += columnWidths[idx];
          });

          yPosition += 10;
          pdf.setFont("helvetica", "normal");
        }

        xPosition = 20;
        const rowData = [
          investor.kode,
          investor.nama || "",
          new Intl.NumberFormat("id-ID", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }).format(investor.saldo_akhir),
          investor.rekening_bank || "",
          investor.whatsapp || "",
        ];

        // Draw row (without borders)
        rowData.forEach((data, idx) => {
          const text = data.toString();
          const maxWidth = columnWidths[idx] - 2;
          const truncatedText =
            pdf.getTextWidth(text) > maxWidth
              ? text.substring(
                  0,
                  Math.floor(maxWidth / pdf.getTextWidth("W"))
                ) + "..."
              : text;

          if (idx === 2) {
            // Saldo Akhir - right align
            pdf.text(
              truncatedText,
              xPosition + columnWidths[idx] - 2,
              yPosition,
              { align: "right" }
            );
          } else {
            pdf.text(truncatedText, xPosition + 1, yPosition);
          }
          xPosition += columnWidths[idx];
        });

        yPosition += 8;
      });

      // Add total row
      if (yPosition > 170) {
        pdf.setFontSize(8);
        pdf.setFont("helvetica", "normal");
        pdf.text(
          `Page ${pageNumber} of ${totalPages}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: "center" }
        );
        pageNumber++;
        pdf.addPage();
        yPosition = 30;
      }

      pdf.setFontSize(10);
      pdf.setFont("helvetica", "bold");
      xPosition = 20;

      const totalRowData = [
        "TOTAL",
        "",
        new Intl.NumberFormat("id-ID", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(totalSaldoAkhir),
        "",
        "",
      ];

      totalRowData.forEach((data, idx) => {
        if (idx === 2) {
          // Saldo Akhir - right align
          pdf.text(data, xPosition + columnWidths[idx] - 2, yPosition, {
            align: "right",
          });
        } else {
          pdf.text(data, xPosition + 1, yPosition);
        }
        xPosition += columnWidths[idx];
      });

      // Add page number to last page
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "normal");
      pdf.text(
        `Page ${pageNumber} of ${totalPages}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: "center" }
      );

      // Save the PDF
      const fileName = "rekap-investor.pdf";
      pdf.save(fileName);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert(
        `Gagal membuat PDF: ${
          error instanceof Error ? error.message : "Unknown error"
        }. Silakan coba lagi.`
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
