// src/app/cashflow/add-cashflow-dialog.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

const ptOptions = [
  "INVESTASI_MASUK",
  "INVESTASI_KELUAR",
  "HDN",
  "HMU",
  "HTU",
  "MANAGEMENT_FEE",
];

export function AddCashflowDialog() {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState<Date | undefined>();
  const [formData, setFormData] = useState({
    keterangan: "",
    pt: "",
    mutasi: "",
    nilai: "",
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) {
      alert("Silakan pilih tanggal");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/cashflow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, tanggal: date.toISOString() }),
      });

      if (response.ok) {
        setOpen(false);
        setDate(undefined);
        setFormData({ keterangan: "", pt: "", mutasi: "", nilai: "" });
        router.refresh();
      } else {
        const error = await response.json();
        alert(error.error || "Gagal menambahkan data");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Gagal menambahkan data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button>Tambah Cashflow</Button>
      </SheetTrigger>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Tambah Entri Cashflow</SheetTitle>
          <SheetDescription>
            Isi detail untuk data cashflow baru.
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <Label>Tanggal</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? (
                    format(date, "PPP", { locale: localeId })
                  ) : (
                    <span>Pilih tanggal</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <div>
            <Label htmlFor="keterangan">Keterangan</Label>
            <Input
              id="keterangan"
              name="keterangan"
              value={formData.keterangan}
              onChange={handleChange}
            />
          </div>
          <div>
            <Label htmlFor="pt">PT</Label>
            <Select
              required
              value={formData.pt}
              onValueChange={(value) => handleSelectChange("pt", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih PT" />
              </SelectTrigger>
              <SelectContent>
                {ptOptions.map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {opt.replace(/_/g, "-").toLowerCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="mutasi">Mutasi</Label>
            <Select
              required
              value={formData.mutasi}
              onValueChange={(value) => handleSelectChange("mutasi", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih Mutasi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="KREDIT">Kredit</SelectItem>
                <SelectItem value="DEBET">Debet</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="nilai">Nilai (Rp)</Label>
            <Input
              id="nilai"
              name="nilai"
              type="number"
              step="0.01"
              value={formData.nilai}
              onChange={handleChange}
              required
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Menambahkan..." : "Tambah Data"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
