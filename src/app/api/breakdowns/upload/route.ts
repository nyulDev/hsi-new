import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";

export async function POST(request: NextRequest) {
  try {
    const data = await request.formData();
    const file: File | null = data.get("file") as unknown as File;

    if (!file) {
      return NextResponse.json({ error: "No file received" }, { status: 400 });
    }

    // Check file type
    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      return NextResponse.json(
        { error: "File must be Excel format (.xlsx or .xls)" },
        { status: 400 },
      );
    }

    const bytes = await file.arrayBuffer();
    const workbook = XLSX.read(bytes, { type: "array" });

    // Assume first sheet
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Convert to JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    if (jsonData.length === 0) {
      return NextResponse.json(
        { error: "Excel file is empty" },
        { status: 400 },
      );
    }

    // Validate headers
    const firstRow = jsonData[0] as any;
    const requiredColumns = [
      "kode",
      "tanggal",
      "project_pt",
      "keterangan",
      "nilai",
    ];
    const missingColumns = requiredColumns.filter((col) => !(col in firstRow));

    if (missingColumns.length > 0) {
      return NextResponse.json(
        {
          error: `Missing required columns: ${missingColumns.join(", ")}`,
        },
        { status: 400 },
      );
    }

    // Process each row
    const results = {
      success: 0,
      errors: [] as string[],
      duplicates: [] as string[],
    };

    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i] as any;
      const rowNumber = i + 2; // +2 because Excel starts at 1 and header is row 1

      try {
        const kode = String(row.kode || "").trim();
        const tanggalStr = String(row.tanggal || "").trim();
        const project_pt = String(row.project_pt || "").trim();
        const keterangan = String(row.keterangan || "").trim();
        const nilaiStr = String(row.nilai || "").trim();

        // Validate required fields
        if (!kode || !tanggalStr || !project_pt || !nilaiStr) {
          results.errors.push(
            `Row ${rowNumber}: kode, tanggal, project_pt, and nilai are required`,
          );
          continue;
        }

        // Parse nilai
        const nilai = parseFloat(nilaiStr);
        if (isNaN(nilai)) {
          results.errors.push(`Row ${rowNumber}: nilai must be a valid number`);
          continue;
        }

        // Parse tanggal
        let tanggal: Date;
        if (typeof row.tanggal === "number") {
          // Excel date serial number
          tanggal = new Date((row.tanggal - 25569) * 86400 * 1000);
        } else {
          tanggal = new Date(tanggalStr);
        }
        if (isNaN(tanggal.getTime())) {
          results.errors.push(`Row ${rowNumber}: tanggal must be a valid date`);
          continue;
        }

        // Check if breakdown already exists
        const existingBreakdown = await prisma.breakdown.findFirst({
          where: { kode },
        });

        if (existingBreakdown) {
          results.duplicates.push(
            `Row ${rowNumber}: Breakdown with kode ${kode} already exists`,
          );
          continue;
        }

        // Calculate fields
        const tempo = 60;
        const bagi_hasil = nilai * 0.05;

        // Calculate hari: last day of month - input date
        const year = tanggal.getFullYear();
        const month = tanggal.getMonth();
        const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
        const inputDate = tanggal.getDate();
        const hari = lastDayOfMonth - inputDate;

        // Calculate bagi_hasil_per_bulan: (hari / tempo) * bagi_hasil
        const bagi_hasil_per_bulan = (hari / tempo) * bagi_hasil;

        // Create breakdown
        await prisma.breakdown.create({
          data: {
            kode,
            tanggal,
            project_pt,
            keterangan,
            nilai,
            tempo,
            bagi_hasil,
            hari,
            bagi_hasil_per_bulan,
          },
        });

        results.success++;
      } catch (error) {
        results.errors.push(
          `Row ${rowNumber}: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    }

    return NextResponse.json({
      message: `Upload completed. ${results.success} breakdowns added successfully.`,
      results,
    });
  } catch (error) {
    console.error("Error uploading breakdowns:", error);
    return NextResponse.json(
      { error: "Failed to upload breakdowns" },
      { status: 500 },
    );
  }
}
