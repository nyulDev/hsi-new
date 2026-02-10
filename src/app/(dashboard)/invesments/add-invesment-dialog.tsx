"use client";

import { useState, useEffect } from "react";
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
import { useRouter } from "next/navigation";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

type Investor = {
  kode: string;
  nama: string;
  rekening_bank: string;
};

export function AddInvesmentDialog() {
  const [open, setOpen] = useState(false);
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [selectedInvestor, setSelectedInvestor] = useState<Investor | null>(
    null
  );
  const [formData, setFormData] = useState({
    tanggal: new Date(),
    nilai_mutasi: "",
    keterangan: "",
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (open) {
      fetchInvestors();
    }
  }, [open]);

  const fetchInvestors = async () => {
    try {
      const response = await fetch("/api/investors");
      const data = await response.json();
      setInvestors(data);
    } catch (error) {
      console.error("Error fetching investors:", error);
    }
  };

  const handleInvestorChange = (kode: string) => {
    const investor = investors.find((inv) => inv.kode === kode);
    setSelectedInvestor(investor || null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedInvestor) {
      alert("Please select an investor");
      return;
    }

    if (!formData.nilai_mutasi || parseFloat(formData.nilai_mutasi) <= 0) {
      alert("Please enter a valid investment amount");
      return;
    }

    setLoading(true);
    try {
      // Get last saldo for this investor
      const saldoResponse = await fetch(
        `/api/investors?action=lastSaldo&kode=${selectedInvestor.kode}`
      );
      const saldoData = await saldoResponse.json();
      const lastSaldo = parseFloat(saldoData.lastSaldo || "0");
      const nilaiMutasi = parseFloat(formData.nilai_mutasi);
      const newSaldo = lastSaldo + nilaiMutasi;

      // Create mutasi record
      const mutasiData = {
        tanggal: formData.tanggal.toISOString(),
        kode: selectedInvestor.kode,
        nama: selectedInvestor.nama,
        rekening_bank: selectedInvestor.rekening_bank,
        mutasi: "KREDIT",
        nilai_mutasi: nilaiMutasi,
        saldo: newSaldo,
        keterangan: formData.keterangan || "Investasi baru",
      };

      // Create transaction
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mutasiData),
      });

      if (response.ok) {
        setOpen(false);
        setSelectedInvestor(null);
        setFormData({
          tanggal: new Date(),
          nilai_mutasi: "",
          keterangan: "",
        });
        router.refresh();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to add investment");
      }
    } catch (error) {
      console.error("Error adding investment:", error);
      alert("Failed to add investment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button>Add Investment</Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Add New Investment</SheetTitle>
          <SheetDescription>
            Add investment for an existing investor.
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <Label htmlFor="investor">Investor</Label>
            <Select onValueChange={handleInvestorChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select investor" />
              </SelectTrigger>
              <SelectContent>
                {investors.map((investor) => (
                  <SelectItem key={investor.kode} value={investor.kode}>
                    {investor.kode} - {investor.nama}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedInvestor && (
            <>
              <div>
                <Label>Nama</Label>
                <Input value={selectedInvestor.nama} disabled />
              </div>
              <div>
                <Label>Rekening Bank</Label>
                <Input value={selectedInvestor.rekening_bank} disabled />
              </div>
            </>
          )}

          <div>
            <Label htmlFor="tanggal">Tanggal</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.tanggal && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.tanggal ? (
                    format(formData.tanggal, "PPP")
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.tanggal}
                  onSelect={(date) =>
                    setFormData({ ...formData, tanggal: date || new Date() })
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Label htmlFor="nilai_mutasi">Nilai Investasi</Label>
            <Input
              id="nilai_mutasi"
              name="nilai_mutasi"
              type="number"
              step="0.01"
              value={formData.nilai_mutasi}
              onChange={handleChange}
              placeholder="0"
              required
            />
          </div>

          <div>
            <Label htmlFor="keterangan">Keterangan</Label>
            <Input
              id="keterangan"
              name="keterangan"
              value={formData.keterangan}
              onChange={handleChange}
              placeholder="Optional notes"
            />
          </div>

          <Button type="submit" disabled={loading || !selectedInvestor}>
            {loading ? "Adding..." : "Add Investment"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
