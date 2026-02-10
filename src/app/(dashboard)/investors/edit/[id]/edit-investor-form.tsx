"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";

interface Investor {
  id: string;
  nama: string | null;
  kode: string | null;
  rekening_bank: string | null;
  atas_nama_rekening: string | null;
  whatsapp: string | null;
  email: string | null;
}

interface EditInvestorFormProps {
  investor: Investor;
}

export function EditInvestorForm({ investor }: EditInvestorFormProps) {
  const [formData, setFormData] = useState({
    nama: investor.nama || "",
    kode: investor.kode || "",
    rekening_bank: investor.rekening_bank || "",
    atas_nama_rekening: investor.atas_nama_rekening || "",
    whatsapp: investor.whatsapp || "",
    email: investor.email || "",
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(`/api/investors/${investor.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        router.push("/investors"); // Redirect back to investors list
      } else {
        const error = await response.json();
        alert(error.error);
      }
    } catch (error) {
      console.error("Error updating investor:", error);
      alert("Failed to update investor");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this investor?")) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/investors/${investor.id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        router.push("/investors"); // Redirect back to investors list
      } else {
        const error = await response.json();
        alert(error.error);
      }
    } catch (error) {
      console.error("Error deleting investor:", error);
      alert("Failed to delete investor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
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
        <Label htmlFor="kode">Kode</Label>
        <Input
          id="kode"
          name="kode"
          value={formData.kode}
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
      <div className="flex gap-4">
        <Button type="submit" disabled={loading}>
          {loading ? "Updating..." : "Update Investor"}
        </Button>
        <Button
          type="button"
          variant="destructive"
          onClick={handleDelete}
          disabled={loading}
        >
          {loading ? "Deleting..." : "Delete Investor"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/investors")}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
