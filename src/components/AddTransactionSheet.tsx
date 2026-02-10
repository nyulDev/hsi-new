"use client";

import React, { useState, useEffect } from "react";

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
import { useSession } from "next-auth/react";

interface Transaction {
  id: string;
  tanggal: string;
  kode: string;
  nama: string;
  rekening_bank: string;
  mutasi: string;
  nilai_mutasi: number;
  saldo: number;
  keterangan: string;
  bukti_transfer?: string;
}

interface AddTransactionSheetProps {
  transaction?: Transaction;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function AddTransactionSheet({
  transaction,
  open: propOpen,
  onOpenChange: propOnOpenChange,
}: AddTransactionSheetProps = {}) {
  const isEdit = !!transaction;
  const [internalOpen, setInternalOpen] = useState(false);
  const open = propOpen !== undefined ? propOpen : internalOpen;
  const setOpen = propOnOpenChange || setInternalOpen;
  const [formData, setFormData] = useState({
    tanggal: "",
    kode: "",
    nama: "",
    rekening_bank: "",
    mutasi: "",
    nilai_mutasi: "",
    saldo: "",
    keterangan: "",
  });
  const [buktiTransferFile, setBuktiTransferFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { data: session, status } = useSession();

  const [investors, setInvestors] = useState<
    { kode: string; nama: string; rekening_bank: string }[]
  >([]);
  const [lastSaldo, setLastSaldo] = useState(0);
  const [hasActiveDeposits, setHasActiveDeposits] = useState(false);
  const [isLastDayOfMonth, setIsLastDayOfMonth] = useState(false);
  const [isBuktiRequired, setIsBuktiRequired] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      setIsBuktiRequired(session?.user?.role === "USER");
    }
  }, [session, status]);

  useEffect(() => {
    async function fetchInvestors() {
      try {
        const res = await fetch("/api/investors");
        if (res.ok) {
          const data = await res.json();
          setInvestors(data);
        } else {
          console.error("Failed to fetch investors");
        }
      } catch (error) {
        console.error("Error fetching investors:", error);
      }
    }
    fetchInvestors();
  }, []);

  useEffect(() => {
    if (transaction) {
      setFormData({
        tanggal: new Date(transaction.tanggal).toISOString().split("T")[0],
        kode: transaction.kode,
        nama: transaction.nama,
        rekening_bank: transaction.rekening_bank,
        mutasi: transaction.mutasi,
        nilai_mutasi: transaction.nilai_mutasi.toString(),
        saldo: transaction.saldo.toString(),
        keterangan: transaction.keterangan,
      });
    }
  }, [transaction]);

  useEffect(() => {
    if (formData.kode) {
      async function fetchLastSaldoAndDeposits() {
        try {
          const res = await fetch(
            `/api/investors?action=lastSaldo&kode=${formData.kode}`,
          );
          if (res.ok) {
            const data = await res.json();
            const lastSaldoValue = Number(data.lastSaldo);
            setLastSaldo(lastSaldoValue);
            setFormData((prev) => ({
              ...prev,
              saldo: lastSaldoValue.toString(),
            }));
          } else {
            setLastSaldo(0);
            setFormData((prev) => ({ ...prev, saldo: "0" }));
          }

          // Check for active deposits
          const depositRes = await fetch(
            `/api/deposits?investorKode=${formData.kode}&status=ACTIVE`,
          );
          if (depositRes.ok) {
            const deposits = await depositRes.json();
            setHasActiveDeposits(deposits.length > 0);
          } else {
            setHasActiveDeposits(false);
          }
        } catch (error) {
          console.error("Error fetching last saldo:", error);
          setLastSaldo(0);
          setHasActiveDeposits(false);
          setFormData((prev) => ({ ...prev, saldo: "0" }));
        }
      }
      fetchLastSaldoAndDeposits();
    } else {
      setLastSaldo(0);
      setHasActiveDeposits(false);
      setFormData((prev) => ({ ...prev, saldo: "" }));
    }
  }, [formData.kode]);

  useEffect(() => {
    if (formData.tanggal) {
      const transactionDate = new Date(formData.tanggal);
      const lastDayOfMonth = new Date(
        transactionDate.getFullYear(),
        transactionDate.getMonth() + 1,
        0,
      );
      setIsLastDayOfMonth(
        transactionDate.getDate() === lastDayOfMonth.getDate(),
      );
    } else {
      setIsLastDayOfMonth(false);
    }
  }, [formData.tanggal]);

  useEffect(() => {
    if (formData.mutasi && formData.nilai_mutasi) {
      const nilai = Number(formData.nilai_mutasi);
      let newSaldo = lastSaldo;
      if (formData.mutasi === "KREDIT") {
        newSaldo = lastSaldo + nilai;
      } else if (formData.mutasi === "DEBET") {
        newSaldo = lastSaldo - nilai;
      }
      setFormData((prev) => ({ ...prev, saldo: newSaldo.toString() }));
    } else {
      setFormData((prev) => ({ ...prev, saldo: "" }));
    }
  }, [formData.mutasi, formData.nilai_mutasi, lastSaldo]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const newFormData = { ...prev, [name]: value };
      if (name === "kode") {
        const selectedInvestor = investors.find((inv) => inv.kode === value);
        if (selectedInvestor) {
          newFormData.nama = selectedInvestor.nama;
          newFormData.rekening_bank = selectedInvestor.rekening_bank;
        } else {
          newFormData.nama = "";
          newFormData.rekening_bank = "";
        }
      }
      return newFormData;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if bukti_transfer is required for USER role
    if (session?.user?.role === "USER" && !buktiTransferFile) {
      alert("Bukti Transfer is required for your role.");
      return;
    }

    setLoading(true);
    try {
      let buktiTransferUrl = "";

      // Upload file if exists
      if (buktiTransferFile) {
        const formDataUpload = new FormData();
        formDataUpload.append("file", buktiTransferFile);
        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: formDataUpload,
        });
        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          buktiTransferUrl = uploadData.url;
        } else {
          alert("Failed to upload file");
          setLoading(false);
          return;
        }
      }

      const url = isEdit
        ? `/api/transactions/${transaction?.id}`
        : "/api/history";
      const method = isEdit ? "PUT" : "POST";
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, bukti_transfer: buktiTransferUrl }),
      });
      if (response.ok) {
        setOpen(false);
        setFormData({
          tanggal: "",
          kode: "",
          nama: "",
          rekening_bank: "",
          mutasi: "",
          nilai_mutasi: "",
          saldo: "",
          keterangan: "",
        });
        setBuktiTransferFile(null);
        router.refresh(); // Refresh the page to show new data
      } else {
        const error = await response.json();
        alert(error.error);
      }
    } catch (error) {
      console.error("Error adding/updating transaction:", error);
      alert("Failed to add/update transaction");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {!isEdit && (
        <SheetTrigger asChild>
          <Button>Penarikan Dana</Button>
        </SheetTrigger>
      )}
      <SheetContent className="overflow-y-auto h-full max-h-[90vh]">
        <SheetHeader className="mb-2">
          <SheetTitle>
            {isEdit ? "Edit Transaction" : "Add New Transaction"}
          </SheetTitle>
          <SheetDescription>
            {isEdit
              ? "Update the transaction details."
              : "Fill in the details to add a new transaction."}
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="space-y-2 mt-2">
          <div>
            <Label htmlFor="kode">Kode</Label>
            <Select
              value={formData.kode}
              onValueChange={(value) => {
                const event = {
                  target: { name: "kode", value },
                } as React.ChangeEvent<HTMLSelectElement>;
                handleChange(event);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {investors.map((inv) => (
                  <SelectItem key={inv.kode} value={inv.kode}>
                    {inv.kode}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="tanggal">Tanggal</Label>
            <Input
              id="tanggal"
              name="tanggal"
              type="date"
              value={formData.tanggal}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <Label htmlFor="nama">Nama</Label>
            <Input
              id="nama"
              name="nama"
              value={formData.nama}
              onChange={handleChange}
              readOnly
            />
          </div>
          <div>
            <Label htmlFor="rekening_bank">Rekening Bank</Label>
            <Input
              id="rekening_bank"
              name="rekening_bank"
              value={formData.rekening_bank}
              onChange={handleChange}
              readOnly
            />
          </div>
          <div>
            <Label htmlFor="mutasi">Mutasi</Label>
            <Select
              value={formData.mutasi}
              onValueChange={(value) => {
                const event = {
                  target: { name: "mutasi", value },
                } as React.ChangeEvent<HTMLSelectElement>;
                handleChange(event);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="KREDIT">KREDIT</SelectItem>
                <SelectItem value="DEBET">DEBET</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="nilai_mutasi">Nilai Mutasi</Label>
            <Input
              id="nilai_mutasi"
              name="nilai_mutasi"
              type="number"
              value={formData.nilai_mutasi}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <Label htmlFor="saldo">Saldo</Label>
            <Input
              id="saldo"
              name="saldo"
              type="number"
              value={formData.saldo}
              readOnly
            />
          </div>
          <div>
            <Label htmlFor="keterangan">Keterangan</Label>
            <textarea
              id="keterangan"
              name="keterangan"
              value={formData.keterangan}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <Label htmlFor="bukti_transfer">Bukti Transfer</Label>
            <Input
              id="bukti_transfer"
              name="bukti_transfer"
              type="file"
              accept="image/*,.pdf"
              required={isBuktiRequired}
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                setBuktiTransferFile(file);
              }}
            />
          </div>
          <Button type="submit" disabled={loading} className="mt-2">
            {loading
              ? isEdit
                ? "Updating..."
                : "Adding..."
              : isEdit
                ? "Update Transaction"
                : "Add Transaction"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
