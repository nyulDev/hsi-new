"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Wallet,
  TrendingUp,
  DollarSign,
  User,
  Bell,
  Check,
  X,
} from "lucide-react";

export function SectionCards() {
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role;
  const [investorCount, setInvestorCount] = useState(0);
  const [currentSaldo, setCurrentSaldo] = useState(0);
  const [totalInvestasiYear, setTotalInvestasiYear] = useState(0);
  const [totalProfitYear, setTotalProfitYear] = useState(0);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [quickTransactions, setQuickTransactions] = useState<any[]>([]);

  const fetchRecentTransactions = async () => {
    try {
      const response = await fetch("/api/history");
      if (response.ok) {
        const data = await response.json();
        // Get current time and time 7 days ago
        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        // Filter transactions from the last 7 days
        const recent = data.filter((transaction: any) => {
          const transactionDate = new Date(
            transaction.createdAt || transaction.tanggal,
          );
          return transactionDate >= oneWeekAgo;
        });

        // Sort by date descending (newest first)
        const sortedRecent = recent.sort((a: any, b: any) => {
          const dateA = new Date(a.createdAt || a.tanggal);
          const dateB = new Date(b.createdAt || b.tanggal);
          return dateB.getTime() - dateA.getTime();
        });

        setRecentTransactions(sortedRecent);
        console.log("Recent transactions:", recent);
      }
    } catch (error) {
      console.error("Failed to fetch recent transactions:", error);
    }
  };

  const fetchQuickTransactions = async () => {
    try {
      const response = await fetch("/api/history?action=recent");
      if (response.ok) {
        const data = await response.json();
        console.log("Quick transactions:", data);
        setQuickTransactions(data);
      }
    } catch (error) {
      console.error("Failed to fetch quick transactions:", error);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const res = await fetch(`/api/history/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "APPROVE" }),
      });
      if (res.ok) {
        // Refresh quick transactions
        fetchQuickTransactions();
        alert("Transaction approved successfully");
      } else {
        alert("Failed to approve transaction");
      }
    } catch (error) {
      console.error("Error approving transaction:", error);
      alert("Error approving transaction");
    }
  };

  const handleReject = async (id: string) => {
    try {
      const res = await fetch(`/api/history/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "REJECT" }),
      });
      if (res.ok) {
        // Refresh quick transactions
        fetchQuickTransactions();
        alert("Transaction rejected successfully");
      } else {
        alert("Failed to reject transaction");
      }
    } catch (error) {
      console.error("Error rejecting transaction:", error);
      alert("Error rejecting transaction");
    }
  };

  useEffect(() => {
    const fetchInvestorCount = async () => {
      try {
        const response = await fetch("/api/investors?action=totalCount");
        const data = await response.json();
        setInvestorCount(data.total);
      } catch (error) {
        console.error("Failed to fetch investor count:", error);
      }
    };
    fetchInvestorCount();
  }, []);

  useEffect(() => {
    const fetchCurrentSaldo = async () => {
      try {
        const response = await fetch("/api/history?action=currentSaldo");
        if (response.ok) {
          const data = await response.json();
          setCurrentSaldo(data.totalSaldo);
        }
      } catch (error) {
        console.error("Failed to fetch current saldo:", error);
      }
    };
    fetchCurrentSaldo();
  }, []);

  useEffect(() => {
    const fetchTotalInvestasiYear = async () => {
      try {
        const response = await fetch("/api/breakdowns");
        if (response.ok) {
          const data = await response.json();
          // Calculate total investasi for the year (sum of nilai from all breakdowns)
          const totalInvestasi = data.reduce(
            (sum: number, breakdown: any) => sum + Number(breakdown.nilai),
            0,
          );
          setTotalInvestasiYear(totalInvestasi);
          // Calculate total profit for the year (sum of nilai * 0.08 from all breakdowns)
          const totalProfit = data.reduce(
            (sum: number, breakdown: any) =>
              sum + Number(breakdown.nilai) * 0.08,
            0,
          );
          setTotalProfitYear(totalProfit);
        }
      } catch (error) {
        console.error("Failed to fetch total investasi:", error);
      }
    };
    fetchTotalInvestasiYear();
  }, []);

  useEffect(() => {
    const fetchRecentTransactions = async () => {
      try {
        const response = await fetch("/api/history?action=recent");
        if (response.ok) {
          const data = await response.json();
          setRecentTransactions(data);
        }
      } catch (error) {
        console.error("Failed to fetch recent transactions:", error);
      }
    };

    // Fetch immediately
    fetchRecentTransactions();

    // Set up interval to check every 5 minutes
    const interval = setInterval(fetchRecentTransactions, 5 * 60 * 1000);

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Fetch quick transactions immediately
    fetchQuickTransactions();

    // Set up interval to check every 5 minutes
    const interval = setInterval(fetchQuickTransactions, 5 * 60 * 1000);

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Total Investors</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[150px]/card:text-3xl flex items-center gap-2">
              {investorCount}
              {/* <IconUsers className="w-10 h-10" /> */}
            </CardTitle>
            <CardAction>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardAction>
          </CardHeader>
          {/* <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              Steady performance increase <IconTrendingUp className="size-4" />
            </div>
            <div className="text-muted-foreground">Meets growth projections</div>
          </CardFooter> */}
        </Card>
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Saldo Terkini</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {new Intl.NumberFormat("id-ID").format(currentSaldo)}
            </CardTitle>
            <CardAction>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              {/* Trending up this month <IconTrendingUp className="size-4" /> */}
            </div>
            <div className="text-muted-foreground">
              Total saldo semua investor
            </div>
          </CardFooter>
        </Card>
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Total Investasi selama setahun</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {new Intl.NumberFormat("id-ID", {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }).format(totalInvestasiYear)}
            </CardTitle>
            <CardAction>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              {/* Down 20% this period <IconTrendingDown className="size-4" /> */}
            </div>
            <div className="text-muted-foreground">
              Total investasi dalam satu tahun
            </div>
          </CardFooter>
        </Card>
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Total Profit Selama setahun</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {new Intl.NumberFormat("id-ID", {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }).format(totalProfitYear)}
            </CardTitle>
            <CardAction>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              {/* Strong user retention <IconTrendingUp className="size-4" /> */}
            </div>
            <div className="text-muted-foreground">
              Total profit dalam satu tahun
            </div>
          </CardFooter>
        </Card>
      </div>
      {quickTransactions.length > 0 && (
        <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
          {true && (
            <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950 @xl/main:col-span-2 @5xl/main:col-span-3">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Bell className="h-4 w-4 text-blue-600" />
                  Quick Transaksi
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {quickTransactions.slice(0, 10).map((transaction, index) => (
                    <div key={index} className="flex flex-col gap-1 text-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {transaction.investor?.kode} -{" "}
                            {transaction.investor?.nama || "Unknown"}
                          </span>
                          <Badge
                            variant={
                              transaction.mutasi === "KREDIT"
                                ? "default"
                                : "destructive"
                            }
                            className={
                              transaction.mutasi === "KREDIT"
                                ? "text-xs bg-green-100 text-green-800 hover:bg-green-200"
                                : "text-xs bg-red-100 text-red-800 hover:bg-red-200"
                            }
                          >
                            {transaction.mutasi === "KREDIT"
                              ? "Kredit"
                              : "Debet"}
                          </Badge>
                          <Badge
                            variant="outline"
                            className="text-xs bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                          >
                            {transaction.admin1_status === "APPROVE" &&
                            transaction.admin2_status === "APPROVE"
                              ? "APPROVED"
                              : transaction.admin1_status === "REJECT" ||
                                  transaction.admin2_status === "REJECT"
                                ? "REJECTED"
                                : transaction.admin1_status === "PROSES" ||
                                    transaction.admin2_status === "PROSES"
                                  ? "PROSES"
                                  : "PENDING"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1">
                          {session &&
                            (userRole === "ADMIN" ||
                              userRole === "SUPER_ADMIN") &&
                            transaction.status === "PROSES" && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-6 px-2 text-xs bg-green-50 hover:bg-green-100 border-green-200"
                                  onClick={() => handleApprove(transaction.id)}
                                >
                                  <Check className="h-3 w-3 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-6 px-2 text-xs bg-red-50 hover:bg-red-100 border-red-200"
                                  onClick={() => handleReject(transaction.id)}
                                >
                                  <X className="h-3 w-3 mr-1" />
                                  Reject
                                </Button>
                              </>
                            )}
                          <span className="text-muted-foreground font-medium ml-2">
                            {new Intl.NumberFormat("id-ID").format(
                              transaction.nilai_mutasi,
                            )}
                          </span>
                        </div>
                      </div>
                      {/* {transaction.keterangan && (
                        <div className="text-xs text-muted-foreground pl-2 border-l-2 border-muted">
                          {transaction.keterangan}
                        </div>
                      )} */}
                      {transaction.bukti_transfer && (
                        <div className="text-xs pl-2 border-l-2 border-muted">
                          <a
                            href={transaction.bukti_transfer}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 underline"
                          >
                            Lihat Bukti Transfer
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                  {quickTransactions.length > 10 && (
                    <div className="text-xs text-muted-foreground pt-1">
                      +{quickTransactions.length - 10} transaksi lainnya
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
