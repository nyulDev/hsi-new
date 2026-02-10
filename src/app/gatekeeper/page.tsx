"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { motion } from "framer-motion";
import { Shield, Eye, EyeOff } from "lucide-react";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const formSchema = z.object({
  kode: z.string().min(1, {
    message: "Kode is required.",
  }),
  password: z.string().min(1, {
    message: "Password is required.",
  }),
});

export default function GatekeeperPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      kode: "",
      password: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await signIn("credentials", {
        kode: values.kode,
        password: values.password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid kode or password");
      } else {
        // Get user session to check role
        const sessionRes = await fetch("/api/auth/session");
        const sessionData = await sessionRes.json();
        const userRole = (sessionData?.user as any)?.role;

        if (userRole === "SUPER_ADMIN" || userRole === "ADMIN") {
          router.push("/");
          router.refresh();
        } else {
          setError("Access denied. Admin privileges required.");
          // Sign out the user since they don't have admin access
          await signIn("credentials", { redirect: false });
        }
      }
    } catch (error) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-red-950 via-red-800 to-orange-950 flex items-center justify-center relative overflow-hidden p-0">
      {/* Background Elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-gradient-to-r from-red-600/20 to-orange-600/20"></div>
      </div>

      {/* Floating Icons */}
      <div className="absolute top-10 left-10 text-red-400 opacity-20 animate-pulse">
        <Shield size={80} />
      </div>

      <div className="absolute bottom-10 right-10 text-red-300 opacity-20 animate-bounce">
        <Shield size={60} />
      </div>
      <div className="absolute top-1/3 right-20 text-orange-400 opacity-20 animate-spin">
        <Shield size={50} />
      </div>
      <div className="absolute bottom-1/3 left-20 text-orange-500 opacity-20 animate-pulse">
        <Shield size={50} />
      </div>

      {/* Content */}
      <div className="w-full max-w-md relative z-10">
        <Card className="text-card-foreground flex flex-col gap-6 rounded-xl border py-6 bg-white/10 backdrop-blur-lg border-white/20 shadow-2xl w-full max-w-md">
          <CardHeader className="text-center pb-2">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-lg"
            >
              <Image
                src="/light.png"
                alt="HSI Logo"
                width={65}
                height={65}
                unoptimized={true}
              />
            </motion.div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Admin Gatekeeper
            </CardTitle>
            <CardDescription className="text-white/60">
              Restricted access for administrators only
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="kode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/70 font-medium">
                        Admin Kode
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            placeholder="Enter admin kode"
                            className="pl-10 border-gray-300 focus:border-red-500 focus:ring-red-500"
                            {...field}
                          />
                          <Shield className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/70 font-medium">
                        Password
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter password"
                            className="pl-10 pr-10 border-gray-300 focus:border-red-500 focus:ring-red-500"
                            {...field}
                          />
                          <Shield className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {error && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200"
                  >
                    {error}
                  </motion.div>
                )}
                <Button
                  type="submit"
                  className="w-full bg-linear-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-medium py-2.5 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Authenticating...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <Shield className="h-4 w-4 mr-2" />
                      Enter Admin Area
                    </div>
                  )}
                </Button>
              </form>
            </Form>
            <div className="mt-6 text-center">
              <Link
                href="/login"
                className="text-sm text-blue-400 hover:text-blue-300 hover:underline transition-colors"
              >
                Back to regular login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
