"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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

interface Investor {
  id: string;
  kode: string | null;
  nama: string | null;
}

interface AddDepositDialogProps {
  investors: Investor[];
}

export function AddDepositDialog({ investors }: AddDepositDialogProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    investorId: "",
    kode: "",
    nama: "",
    nilai: "",
    tanggal: "",
    term_months: "2",
    jatuh_tempo: "",
    suku_bunga: "0.05",
    bunga_diterima: "",
    net_profit: "",
  });
  const [loading, setLoading] = useState(false);
  const [dateError, setDateError] = useState("");
  const router = useRouter();

  const calculateMaturity = (startDate: string, termMonths: number) => {
    if (!startDate || !termMonths) return "";
    const start = new Date(startDate);
    // Mulai perhitungan dari 1 bulan berikutnya
    const startBaru = new Date(start.getFullYear(), start.getMonth() + 1, 1);
    const maturity = new Date(
      startBaru.getFullYear(),
      startBaru.getMonth() + termMonths,
      2
      // rubah jadi 1 jika ingin jatuh temponya di tgl 31 maret
    );
    return maturity.toISOString().split("T")[0];
  };

  const calculateInterest = (
    nilai: number,
    termMonths: number,
    rate: number
  ) => {
    if (!nilai || !termMonths || !rate) return 0;
    // Simple flat interest calculation: nilai * rate (flat rate for the term period), then cut 5%
    return nilai * rate * 0.95;
  };

  useEffect(() => {
    if (formData.tanggal && formData.term_months) {
      const maturityDate = calculateMaturity(
        formData.tanggal,
        parseInt(formData.term_months)
      );
      setFormData((prev) => ({ ...prev, jatuh_tempo: maturityDate }));

      if (formData.nilai && formData.term_months) {
        const interest = calculateInterest(
          parseFloat(formData.nilai),
          parseInt(formData.term_months),
          parseFloat(formData.suku_bunga)
        );
        setFormData((prev) => ({
          ...prev,
          bunga_diterima: interest.toFixed(2),
        }));
      }
    }
  }, [
    formData.tanggal,
    formData.term_months,
    formData.nilai,
    formData.suku_bunga,
  ]);

  const handleInvestorChange = (investorId: string) => {
    const investor = investors.find((inv) => inv.id === investorId);
    if (investor) {
      setFormData((prev) => ({
        ...prev,
        investorId,
        kode: investor.kode || "",
        nama: investor.nama || "",
      }));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    if (name === "tanggal") {
      const selectedDate = new Date(value);
      const dayOfMonth = selectedDate.getDate();
      if (dayOfMonth < 1 || dayOfMonth > 8) {
        setDateError(
          "Deposits can only be made between the 1st and 8th of each month"
        );
      } else {
        setDateError("");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const submitData = {
        ...formData,
        nilai: parseFloat(formData.nilai),
        term_months: parseInt(formData.term_months),
        suku_bunga: parseFloat(formData.suku_bunga),
        bunga_diterima: parseFloat(formData.bunga_diterima),
        tanggal: new Date(formData.tanggal),
        jatuh_tempo: new Date(formData.jatuh_tempo),
      };

      const response = await fetch("/api/deposits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
      });
      if (response.ok) {
        setOpen(false);
        setFormData({
          investorId: "",
          kode: "",
          nama: "",
          nilai: "",
          tanggal: "",
          term_months: "2",
          jatuh_tempo: "",
          suku_bunga: "0.05",
          bunga_diterima: "",
          net_profit: "",
        });
        router.refresh();
      } else {
        const error = await response.json();
        alert(error.error);
      }
    } catch (error) {
      console.error("Error adding deposit:", error);
      alert("Failed to add deposit");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add Deposit</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Deposit</DialogTitle>
          <DialogDescription>
            Fill in the details to add a new deposit.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="investorId">Investor</Label>
            <Select onValueChange={handleInvestorChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select investor" />
              </SelectTrigger>
              <SelectContent>
                {investors.map((investor) => (
                  <SelectItem key={investor.id} value={investor.id}>
                    {investor.kode} - {investor.nama}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="kode">Kode</Label>
            <Input id="kode" name="kode" value={formData.kode} disabled />
          </div>
          <div>
            <Label htmlFor="nama">Nama</Label>
            <Input id="nama" name="nama" value={formData.nama} disabled />
          </div>
          <div>
            <Label htmlFor="nilai">Nilai</Label>
            <Input
              id="nilai"
              name="nilai"
              type="number"
              step="0.01"
              value={formData.nilai}
              onChange={handleChange}
            />
          </div>
          <div>
            <Label htmlFor="tanggal">Tanggal</Label>
            <Input
              id="tanggal"
              name="tanggal"
              type="date"
              value={formData.tanggal}
              onChange={handleChange}
              max={
                new Date(new Date().getFullYear(), new Date().getMonth(), 8)
                  .toISOString()
                  .split("T")[0]
              }
            />
            {dateError && (
              <p className="text-red-500 text-sm mt-1">{dateError}</p>
            )}
          </div>
          <div>
            <Label htmlFor="term_months">Term (Months)</Label>
            <Input
              id="term_months"
              name="term_months"
              type="number"
              value={formData.term_months}
              disabled
            />
          </div>
          <div>
            <Label htmlFor="jatuh_tempo">Jatuh Tempo</Label>
            <Input
              id="jatuh_tempo"
              name="jatuh_tempo"
              type="date"
              value={formData.jatuh_tempo}
              disabled
            />
          </div>
          <div>
            <Label htmlFor="suku_bunga">Suku Bunga</Label>
            <Input
              id="suku_bunga"
              name="suku_bunga"
              type="number"
              step="0.01"
              value={formData.suku_bunga}
              onChange={handleChange}
              disabled
            />
          </div>
          <div>
            <Label htmlFor="bunga_diterima">Bunga Diterima</Label>
            <Input
              id="bunga_diterima"
              name="bunga_diterima"
              value={formData.bunga_diterima}
              disabled
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading || !!dateError}>
              {loading ? "Adding..." : "Add Deposit"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
