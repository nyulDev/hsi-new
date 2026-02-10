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
      "nama",
      "rekening_bank",
      "atas_nama_rekening",
      "whatsapp",
      "email",
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
        const investorData = {
          kode: String(row.kode || "").trim(),
          nama: String(row.nama || "").trim(),
          rekening_bank: String(row.rekening_bank || "").trim(),
          atas_nama_rekening: String(row.atas_nama_rekening || "").trim(),
          whatsapp: String(row.whatsapp || "").trim(),
          email: String(row.email || "").trim(),
        };

        // Validate required fields
        if (!investorData.kode || !investorData.nama) {
          results.errors.push(`Row ${rowNumber}: kode and nama are required`);
          continue;
        }

        // Check if investor already exists
        const existingInvestor = await prisma.investor.findFirst({
          where: { kode: investorData.kode },
        });

        if (existingInvestor) {
          results.duplicates.push(
            `Row ${rowNumber}: Investor with kode ${investorData.kode} already exists`,
          );
          continue;
        }

        // Create investor
        await prisma.investor.create({
          data: investorData,
        });

        results.success++;
      } catch (error) {
        results.errors.push(
          `Row ${rowNumber}: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    }

    return NextResponse.json({
      message: `Upload completed. ${results.success} investors added successfully.`,
      results,
    });
  } catch (error) {
    console.error("Error uploading investors:", error);
    return NextResponse.json(
      { error: "Failed to upload investors" },
      { status: 500 },
    );
  }
}
