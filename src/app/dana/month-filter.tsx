"use client";

import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const months = [
  { name: "Semua", month: null },
  { name: "Januari", month: 1 },
  { name: "Februari", month: 2 },
  { name: "Maret", month: 3 },
  { name: "April", month: 4 },
  { name: "Mei", month: 5 },
  { name: "Juni", month: 6 },
  { name: "Juli", month: 7 },
  { name: "Agustus", month: 8 },
  { name: "September", month: 9 },
  { name: "Oktober", month: 10 },
  { name: "November", month: 11 },
  { name: "Desember", month: 12 },
];

interface MonthFilterProps {
  currentMonth?: string;
}

export function MonthFilter({ currentMonth }: MonthFilterProps) {
  const router = useRouter();

  const handleMonthChange = (value: string) => {
    if (value === "null") {
      router.push("/dana");
    } else {
      router.push(`/dana?month=${value}`);
    }
  };

  const currentValue = currentMonth || "null";

  return (
    <Select value={currentValue} onValueChange={handleMonthChange}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Pilih Bulan" />
      </SelectTrigger>
      <SelectContent>
        {months.map((month) => (
          <SelectItem
            key={month.month || "null"}
            value={month.month?.toString() || "null"}
          >
            {month.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
