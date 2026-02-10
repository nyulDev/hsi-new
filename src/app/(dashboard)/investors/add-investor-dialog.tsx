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
import { useRouter } from "next/navigation";

export function AddInvestorDialog() {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    kode: "",
    nama: "",
    rekening_bank: "",
    atas_nama_rekening: "",
    whatsapp: "",
    email: "",
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Removed auto-fill for kode to allow manual input

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch("/api/investors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        setOpen(false);
        setFormData({
          kode: "",
          nama: "",
          rekening_bank: "",
          atas_nama_rekening: "",
          whatsapp: "",
          email: "",
        });
        router.refresh(); // Refresh the page to show new data
      } else {
        const error = await response.json();
        alert(error.error);
      }
    } catch (error) {
      console.error("Error adding investor:", error);
      alert("Failed to add investor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button>Add Investor</Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Add New Investor</SheetTitle>
          <SheetDescription>
            Fill in the details to add a new investor.
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <Label htmlFor="kode">Kode</Label>
            <Input
              id="kode"
              name="kode"
              value={formData.kode}
              onChange={handleChange}
              placeholder="Masukkan kode investor (opsional)"
            />
          </div>
          <div>
            <Label htmlFor="nama">Nama</Label>
            <Input
              id="nama"
              name="nama"
              value={formData.nama}
              onChange={handleChange}
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
            />
          </div>
          <div>
            <Label htmlFor="rekening_bank">Rekening Bank</Label>
            <Input
              id="rekening_bank"
              name="rekening_bank"
              value={formData.rekening_bank}
              onChange={handleChange}
            />
          </div>
          <div>
            <Label htmlFor="atas_nama_rekening">Atas Nama Rekening</Label>
            <Input
              id="atas_nama_rekening"
              name="atas_nama_rekening"
              value={formData.atas_nama_rekening}
              onChange={handleChange}
            />
          </div>
          <div>
            <Label htmlFor="whatsapp">Whatsapp</Label>
            <Input
              id="whatsapp"
              name="whatsapp"
              value={formData.whatsapp}
              onChange={handleChange}
            />
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? "Adding..." : "Add Investor"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
