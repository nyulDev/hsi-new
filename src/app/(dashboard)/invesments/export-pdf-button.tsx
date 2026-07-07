"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import jsPDF from "jspdf";


interface ExportPdfButtonProps {
  monthName?: string | null;
  data: any[];
  danaTersedia: number;
  modal: number;
  persenM: number;
  bagiHasil: number;
  persenB: number;
  adminFee: number;
  sisaDana: number;
}

export function ExportPdfButton({
  monthName,
  data,
  danaTersedia,
  modal,
  persenM,
  bagiHasil,
  persenB,
  adminFee,
  sisaDana,
}: ExportPdfButtonProps) {
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
      const title = monthName
        ? `Investments - ${monthName}`
        : "Semua Investments";
      pdf.text(title, 20, 30);

      // Date
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "normal");
      const currentDate = new Date().toLocaleDateString("id-ID");
      pdf.text(`Tanggal Cetak: ${currentDate}`, 20, 40);

      // Summary
      pdf.setFontSize(10);
      pdf.text(
        `Dana Tersedia: ${new Intl.NumberFormat("id-ID", {
          style: "currency",
          currency: "IDR",
          maximumFractionDigits: 0,
        }).format(danaTersedia)}`,
        20,
        50
      );
      pdf.text(
        `Modal: ${new Intl.NumberFormat("id-ID", {
          style: "currency",
          currency: "IDR",
          maximumFractionDigits: 0,
        }).format(modal)}`,
        20,
        55
      );
      pdf.text(`Persen-M: ${persenM.toFixed(2)}%`, 20, 60);

      pdf.text(
        `Bagi Hasil: ${new Intl.NumberFormat("id-ID", {
          style: "currency",
          currency: "IDR",
          maximumFractionDigits: 0,
        }).format(bagiHasil)} (Potongan admin 5%: ${new Intl.NumberFormat("id-ID", {
          style: "currency",
          currency: "IDR",
          maximumFractionDigits: 0,
        }).format(adminFee)})`,
        120,
        50
      );
      pdf.text(`Persen-B: ${persenB.toFixed(2)}%`, 120, 55);
      pdf.text(
        `Sisa Dana: ${new Intl.NumberFormat("id-ID", {
          style: "currency",
          currency: "IDR",
          maximumFractionDigits: 0,
        }).format(sisaDana)}`,
        120,
        60
      );

      // Table header
      let yPosition = 75;
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "bold");

      const headers = [
        "Kode",
        "Nama",
        "Saldo",
        "Persen",
        "Dana Terpakai",
        "Bagi Hasil",
      ];
      const columnWidths = [30, 70, 40, 20, 40, 40];
      let xPosition = 20;

      headers.forEach((header, index) => {
        if (index >= 2) {
            // align right
            pdf.text(header, xPosition + columnWidths[index], yPosition, { align: "right" });
        } else {
            pdf.text(header, xPosition, yPosition);
        }
        xPosition += columnWidths[index];
      });

      pdf.setDrawColor(0, 0, 0); // black for header line
      pdf.setLineWidth(0.5);
      pdf.line(20, yPosition + 2, pageWidth - 20, yPosition + 2);

      // Table data
      pdf.setFont("helvetica", "normal");
      yPosition += 10;

      data.forEach((item) => {
        if (yPosition > 180) {
          // Check if we need a new page
          pdf.addPage();
          yPosition = 20;
        }

        xPosition = 20;
        const rowData = [
          item.kode || "",
          item.nama || "",
          new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            maximumFractionDigits: 0,
          }).format(item.saldo || 0),
          `${(item.persen || 0).toFixed(2)}%`,
          new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            maximumFractionDigits: 0,
          }).format(item.dana_terpakai || 0),
          new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            maximumFractionDigits: 0,
          }).format(item.bagi_hasil || 0),
        ];

        rowData.forEach((dataValue, index) => {
          if (index >= 2) {
             // align right
             pdf.text(dataValue.toString(), xPosition + columnWidths[index], yPosition, { align: "right" });
          } else {
             pdf.text(dataValue.toString(), xPosition, yPosition);
          }
          xPosition += columnWidths[index];
        });

        pdf.setDrawColor(200, 200, 200); // light gray for row line
        pdf.setLineWidth(0.1);
        pdf.line(20, yPosition + 2, pageWidth - 20, yPosition + 2);

        yPosition += 8;
      });

      // Save the PDF
      const fileName = monthName
        ? `investments-${monthName.toLowerCase()}.pdf`
        : "investments.pdf";
      pdf.save(fileName);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Gagal membuat PDF. Silakan coba lagi.");
    }
  };

  return (
    <Button onClick={exportToPDF} variant="outline" size="sm">
      <Download className="mr-2 h-4 w-4" />
      Export PDF
    </Button>
  );
}
