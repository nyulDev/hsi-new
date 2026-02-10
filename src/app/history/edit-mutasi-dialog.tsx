"use client";

import { useState, useEffect } from "react";
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
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CalendarIcon, Edit } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";

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
  nilai_mutasi: z.number().positive("Nilai mutasi harus positif"),
  keterangan: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface Investor {
  id: string;
  kode: string | null;
  nama: string | null;
  rekening_bank: string | null;
}

interface EditMutasiDialogProps {
  recordId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EditMutasiDialog({
  recordId,
  open,
  onOpenChange,
  onSuccess,
}: EditMutasiDialogProps) {
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role;
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingRecord, setFetchingRecord] = useState(false);
  const [buktiTransfer, setBuktiTransfer] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const form = useForm<FormData>({
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

  useEffect(() => {
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
  }, []);

  useEffect(() => {
    if (recordId && open) {
      const fetchRecord = async () => {
        setFetchingRecord(true);
        try {
          const res = await fetch(`/api/history/${recordId}`);
          if (res.ok) {
            const record = await res.json();
            form.reset({
              tanggal: new Date(record.tanggal),
              kode: record.kode,
              nama: record.nama || "",
              rekening_bank: record.rekening_bank || "",
              mutasi: record.mutasi,
              nilai_mutasi: Number(record.nilai_mutasi),
              keterangan: record.keterangan || "",
            });
            setBuktiTransfer(null); // Reset file input
          }
        } catch (error) {
          console.error("Error fetching record:", error);
        } finally {
          setFetchingRecord(false);
        }
      };
      fetchRecord();
    }
  }, [recordId, open, form]);

  const onSubmit = async (data: FormData) => {
    if (!recordId) return;

    setLoading(true);
    try {
      let buktiTransferUrl = null;

      // Upload file if present
      if (buktiTransfer) {
        setUploading(true);
        const formData = new FormData();
        formData.append("file", buktiTransfer);

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          buktiTransferUrl = uploadData.url;
        } else {
          alert("Gagal mengupload bukti transfer");
          setUploading(false);
          setLoading(false);
          return;
        }
        setUploading(false);
      }

      const payload = {
        tanggal: format(data.tanggal, "yyyy-MM-dd"), // YYYY-MM-DD
        kode: data.kode,
        nama: data.nama,
        rekening_bank: data.rekening_bank,
        mutasi: data.mutasi,
        nilai_mutasi: data.nilai_mutasi,
        keterangan: data.keterangan || "",
        bukti_transfer: buktiTransferUrl,
      };

      const res = await fetch(`/api/history/${recordId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        onOpenChange(false);
        onSuccess();
      } else {
        const error = await res.json();
        alert(error.error || "Gagal mengupdate mutasi");
      }
    } catch (error) {
      console.error("Error updating mutasi:", error);
      alert("Terjadi kesalahan saat mengupdate mutasi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Mutasi</DialogTitle>
          <DialogDescription>
            Ubah detail mutasi untuk investor.
          </DialogDescription>
        </DialogHeader>
        {fetchingRecord ? (
          <div>Loading...</div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="tanggal"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Tanggal</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground",
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pilih tanggal</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="kode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kode Investor</FormLabel>
                    <FormControl>
                      <Input {...field} readOnly />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="nama"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Investor</FormLabel>
                    <FormControl>
                      <Input {...field} readOnly />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="rekening_bank"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nomor Rekening</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="mutasi"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jenis Mutasi</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih jenis mutasi" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="KREDIT">KREDIT</SelectItem>
                        <SelectItem value="DEBET">DEBET</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="nilai_mutasi"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nilai Mutasi</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        {...field}
                        onChange={(e) =>
                          field.onChange(Number(e.target.value) || 0)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="keterangan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Keterangan</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {(userRole === "SUPER_ADMIN" || userRole === "ADMIN2") &&
              form.watch("mutasi") === "DEBET" ? (
                <FormItem>
                  <FormLabel>Upload Bukti Transfer</FormLabel>
                  <FormControl>
                    <Input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        setBuktiTransfer(file);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              ) : null}
              <DialogFooter>
                <Button type="submit" disabled={loading || uploading}>
                  {loading || uploading
                    ? uploading
                      ? "Mengupload..."
                      : "Menyimpan..."
                    : "Simpan"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
