"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface ExportPdfButtonProps {
  monthName?: string | null;
  totalNilai: number;
  totalProfit: number;
  totalInvestorShare: number;
  totalHSIShare: number;
  data: any[];
}

export function ExportPdfButton({
  monthName,
  totalNilai,
  totalProfit,
  totalInvestorShare,
  totalHSIShare,
  data,
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
        ? `Breakdown Invest- ${monthName}`
        : "Breakdown Invest";
      pdf.text(title, 20, 30);

      // Date
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "normal");
      const currentDate = new Date().toLocaleDateString("id-ID");
      pdf.text(`Tanggal: ${currentDate}`, 20, 45);

      // Summary section
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.text("Ringkasan", 20, 65);

      pdf.setFontSize(12);
      pdf.setFont("helvetica", "normal");
      pdf.text(
        `Total Investasi: ${new Intl.NumberFormat("id-ID", {
          style: "currency",
          currency: "IDR",
          maximumFractionDigits: 0,
        }).format(totalNilai)}`,
        20,
        80,
      );
      pdf.text(
        `Total Profit: ${new Intl.NumberFormat("id-ID", {
          style: "currency",
          currency: "IDR",
          maximumFractionDigits: 0,
        }).format(totalProfit)}`,
        20,
        90,
      );
      pdf.text(
        `Investor 62.5%: ${new Intl.NumberFormat("id-ID", {
          style: "currency",
          currency: "IDR",
          maximumFractionDigits: 0,
        }).format(totalInvestorShare - totalInvestorShare * 0.05)}`,
        20,
        100,
      );
      pdf.text(
        `HSI 37.5%: ${new Intl.NumberFormat("id-ID", {
          style: "currency",
          currency: "IDR",
          maximumFractionDigits: 0,
        }).format(totalHSIShare + totalInvestorShare * 0.05)}`,
        20,
        110,
      );

      // Table header
      let yPosition = 130;
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "bold");

      const headers = [
        "Tanggal",
        "Project",
        "Keterangan",
        "Investasi",
        "Profit",
        "Investor",
        "HSI",
      ];
      const columnWidths = [30, 50, 50, 40, 40, 40, 40];
      let xPosition = 20;

      headers.forEach((header, index) => {
        pdf.text(header, xPosition, yPosition);
        xPosition += columnWidths[index];
      });

      // Table data
      pdf.setFont("helvetica", "normal");
      yPosition += 10;

      data.forEach((item) => {
        if (yPosition > 180) {
          // Check if we need a new page
          pdf.addPage();
          yPosition = 30;
        }

        xPosition = 20;
        const rowData = [
          new Date(item.tanggal).toLocaleDateString("id-ID"),
          item.project_pt || "",
          item.keterangan || "",
          new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            maximumFractionDigits: 0,
          }).format(item.nilai),
          new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            maximumFractionDigits: 0,
          }).format(item.profit),
          new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            maximumFractionDigits: 0,
          }).format(item.investorShare),
          new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            maximumFractionDigits: 0,
          }).format(item.hsiShare),
        ];

        rowData.forEach((data, index) => {
          pdf.text(data.toString(), xPosition, yPosition);
          xPosition += columnWidths[index];
        });

        yPosition += 8;
      });

      // Save the PDF
      const fileName = monthName
        ? `rekap-invest-${monthName.toLowerCase()}.pdf`
        : "rekap-invest.pdf";
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
