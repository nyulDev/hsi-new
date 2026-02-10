"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CalendarIcon, Plus } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  tanggal: z.date({
    required_error: "Tanggal wajib diisi",
  }),
  kode: z.string().min(1, "Kode investor wajib diisi"),
  nama: z.string().min(1, "Nama investor wajib diisi"),
  rekening_bank: z.string().optional(),
  mutasi: z.enum(["KREDIT", "DEBET"], {
    required_error: "Jenis mutasi wajib dipilih",
  }),
  nilai_mutasi: z.number().min(0, "Nilai mutasi harus 0 atau lebih"),
  keterangan: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface Investor {
  kode: string | null;
  nama: string | null;
  rekening_bank: string | null;
}

interface InvestmentData {
  dana_terpakai: number;
  saldo_akhir: number;
  bagi_hasil: number;
}

interface AddMutasiDialogProps {
  onSuccess: () => void;
  isUserMode?: boolean;
  userKode?: string;
  disabled?: boolean;
}

export function AddMutasiDialog({
  onSuccess,
  isUserMode = false,
  userKode,
  disabled = false,
}: AddMutasiDialogProps) {
  const [open, setOpen] = useState(false);
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [loading, setLoading] = useState(false);
  const [investmentData, setInvestmentData] = useState<InvestmentData | null>(
    null,
  );
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [buktiTransferFile, setBuktiTransferFile] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tanggal: new Date(),
      kode: "",
      nama: "",
      rekening_bank: "",
      mutasi: "KREDIT",
      nilai_mutasi: 0,
      keterangan: "",
    },
  });

  // Watch values untuk reactive updates
  const tanggalValue = watch("tanggal");
  const kodeValue = watch("kode");
  const mutasiValue = watch("mutasi");

  // Fungsi untuk mengambil data investasi
  const fetchInvestmentData = useCallback(async (investorId: string) => {
    try {
      const res = await fetch(
        `/api/investment/${encodeURIComponent(investorId)}`,
      );
      if (res.ok) {
        const data = await res.json();
        setInvestmentData(data);
      } else {
        let errorDetails = `Status: ${res.status} ${res.statusText}`;
        try {
          const errorBody = await res.json();
          errorDetails += `, Response: ${JSON.stringify(errorBody)}`;
        } catch {
          errorDetails += ", Response: Unable to parse error body";
        }
        console.error("Error fetching investment data:", errorDetails);
      }
    } catch (error) {
      console.error("Error fetching investment data:", error);
    }
  }, []);

  useEffect(() => {
    if (isUserMode && userKode) {
      // In user mode, fetch all investors and find the one with matching kode
      const fetchUserInvestor = async () => {
        setIsLoadingData(true);
        try {
          const res = await fetch("/api/investors");
          if (res.ok) {
            const data = await res.json();
            const investor = data.find(
              (inv: Investor) => inv.kode === userKode,
            );
            if (investor) {
              setValue("kode", investor.kode || "");
              setValue("nama", investor.nama || "");
              setValue("rekening_bank", investor.rekening_bank || "");
              // Fetch investment data for the user
              fetchInvestmentData(userKode);
            }
          }
        } catch (error) {
          console.error("Error fetching user investor:", error);
        } finally {
          setIsLoadingData(false);
        }
      };
      fetchUserInvestor();
    } else {
      // Normal mode: fetch all investors
      const fetchInvestors = async () => {
        try {
          const res = await fetch("/api/investors");
          if (res.ok) {
            const data = await res.json();
            setInvestors(data);
          }
        } catch (error) {
          console.error("Error fetching investors:", error);
        }
      };
      fetchInvestors();
    }
  }, [isUserMode, userKode, setValue, fetchInvestmentData]);

  // Saat investor dipilih
  const handleInvestorSelect = (investorKode: string) => {
    const investor = investors.find((inv) => inv.kode === investorKode);
    if (investor) {
      setValue("kode", investor.kode || "");
      setValue("nama", investor.nama || "");
      setValue("rekening_bank", investor.rekening_bank || "");

      // Ambil data investasi
      fetchInvestmentData(investorKode);
    }
  };

  const onSubmit = async (data: FormData) => {
    // Check if bukti transfer is required for user mode and KREDIT transactions
    if (isUserMode && data.mutasi === "KREDIT" && !buktiTransferFile) {
      alert("Bukti Transfer wajib diisi untuk pengguna.");
      return;
    }

    // Check if DEBET and insufficient balance
    if (
      data.mutasi === "DEBET" &&
      investmentData &&
      data.nilai_mutasi > investmentData.saldo_akhir
    ) {
      alert("Maaf Saldo Anda Tidak Cukup");
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

      const payload = {
        tanggal: format(data.tanggal, "yyyy-MM-dd"),
        kode: data.kode,
        nama: data.nama,
        rekening_bank: data.rekening_bank,
        mutasi: data.mutasi,
        nilai_mutasi: data.nilai_mutasi,
        keterangan: data.keterangan || "",
        bukti_transfer: buktiTransferUrl,
        status: "PROSES",
      };

      const res = await fetch("/api/history", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setOpen(false);
        reset();
        setBuktiTransferFile(null);
        onSuccess();
      } else {
        const error = await res.json();
        alert(error.error || "Gagal menambah mutasi");
      }
    } catch (error) {
      console.error("Error adding mutasi:", error);
      alert("Terjadi kesalahan saat menambah mutasi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={disabled}>
          <Plus className="mr-2 h-4 w-4" />
          Add Transaction
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tambah Mutasi Baru</DialogTitle>
          <DialogDescription>
            Masukkan detail mutasi untuk investor.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Field Tanggal */}
          <div className="flex flex-col space-y-2">
            <label className="text-sm font-medium">Tanggal</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full pl-3 text-left font-normal",
                    !tanggalValue && "text-muted-foreground",
                  )}
                >
                  {tanggalValue ? (
                    format(tanggalValue, "PPP")
                  ) : (
                    <span>Pilih tanggal</span>
                  )}
                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={tanggalValue}
                  onSelect={(date) => setValue("tanggal", date || new Date())}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {errors.tanggal && (
              <p className="text-sm text-red-500">{errors.tanggal.message}</p>
            )}
          </div>

          {/* Field Kode Investor */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Kode Investor</label>
            {isUserMode ? (
              <Input
                value={isLoadingData ? "Loading..." : watch("kode")}
                readOnly
              />
            ) : (
              <Select onValueChange={handleInvestorSelect} value={kodeValue}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih investor" />
                </SelectTrigger>
                <SelectContent>
                  {investors.map((investor) => (
                    <SelectItem key={investor.kode} value={investor.kode || ""}>
                      {investor.kode} - {investor.nama}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {errors.kode && (
              <p className="text-sm text-red-500">{errors.kode.message}</p>
            )}
          </div>

          {/* Field Nama */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Nama Investor</label>
            <Input
              value={isLoadingData ? "Loading..." : watch("nama")}
              onChange={(e) => setValue("nama", e.target.value)}
              readOnly
            />
            {errors.nama && (
              <p className="text-sm text-red-500">{errors.nama.message}</p>
            )}
          </div>

          {/* Field Rekening Bank */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Nomor Rekening</label>
            <Input
              value={watch("rekening_bank")}
              onChange={(e) => setValue("rekening_bank", e.target.value)}
            />
            {errors.rekening_bank && (
              <p className="text-sm text-red-500">
                {errors.rekening_bank.message}
              </p>
            )}
          </div>

          {/* Field Jenis Mutasi */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Jenis Mutasi</label>
            <Select
              onValueChange={(value: string) => {
                setValue("mutasi", value as "KREDIT" | "DEBET");
              }}
              value={mutasiValue}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih jenis mutasi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem key="kredit" value="KREDIT">
                  KREDIT
                </SelectItem>
                <SelectItem key="debet" value="DEBET">
                  DEBET
                </SelectItem>
              </SelectContent>
            </Select>
            {errors.mutasi && (
              <p className="text-sm text-red-500">{errors.mutasi.message}</p>
            )}
          </div>

          {/* Field Nilai Mutasi */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Nilai Mutasi</label>
            <Input
              type="number"
              step="0.01"
              value={watch("nilai_mutasi")}
              onChange={(e) =>
                setValue("nilai_mutasi", parseFloat(e.target.value) || 0)
              }
            />
            {errors.nilai_mutasi && (
              <p className="text-sm text-red-500">
                {errors.nilai_mutasi.message}
              </p>
            )}
          </div>

          {/* Field Keterangan */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Keterangan</label>
            <Textarea
              value={watch("keterangan")}
              onChange={(e) => setValue("keterangan", e.target.value)}
            />
            {errors.keterangan && (
              <p className="text-sm text-red-500">
                {errors.keterangan.message}
              </p>
            )}
          </div>

          {/* Field Bukti Transfer - Only show for KREDIT */}
          {mutasiValue === "KREDIT" && (
            <div className="space-y-2">
              <Label htmlFor="bukti_transfer">
                Bukti Transfer {isUserMode && "*"}
              </Label>
              <Input
                id="bukti_transfer"
                name="bukti_transfer"
                type="file"
                accept="image/*,.pdf"
                required={isUserMode}
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setBuktiTransferFile(file);
                }}
              />
              {isUserMode && (
                <p className="text-sm text-gray-500">
                  Bukti transfer wajib diisi untuk pengguna.
                </p>
              )}
            </div>
          )}

          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
