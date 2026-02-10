"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ApproveWithUploadDialogProps {
  recordId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ApproveWithUploadDialog({
  recordId,
  open,
  onOpenChange,
  onSuccess,
}: ApproveWithUploadDialogProps) {
  const [buktiTransfer, setBuktiTransfer] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const onSubmit = async () => {
    if (!recordId || !buktiTransfer) return;

    setUploading(true);
    try {
      // Upload file
      const formData = new FormData();
      formData.append("file", buktiTransfer);

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        alert("Gagal mengupload bukti transfer");
        setUploading(false);
        return;
      }

      const uploadData = await uploadRes.json();
      const buktiTransferUrl = uploadData.url;

      // Approve with bukti transfer
      const res = await fetch(`/api/history/${recordId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "APPROVE",
          bukti_transfer: buktiTransferUrl,
        }),
      });

      if (res.ok) {
        onOpenChange(false);
        setBuktiTransfer(null);
        onSuccess();
      } else {
        alert("Failed to approve transaction");
      }
    } catch (error) {
      console.error("Error approving transaction:", error);
      alert("Error approving transaction");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Approve with Bukti Transfer</DialogTitle>
          <DialogDescription>
            Upload bukti transfer untuk menyetujui transaksi.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bukti_transfer">Upload Bukti Transfer</Label>
            <Input
              id="bukti_transfer"
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                setBuktiTransfer(file);
              }}
              required
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={onSubmit} disabled={!buktiTransfer || uploading}>
            {uploading ? "Mengupload..." : "Approve"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
