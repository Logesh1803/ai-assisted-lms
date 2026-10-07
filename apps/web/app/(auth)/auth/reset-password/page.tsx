"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2, KeyRound, ArrowLeft, Eye, EyeOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { authApi } from "@/lib/api";
import { getFriendlyError } from "@/lib/errors";
import { STRONG_PASSWORD_HINT, strongPasswordSchema } from "@/lib/password";

const resetSchema = z
  .object({
    password: strongPasswordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ResetFormValues = z.infer<typeof resetSchema>;

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const form = useForm<ResetFormValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const onSubmit = async (values: ResetFormValues) => {
    if (!token || !email) return;
    setIsLoading(true);
    try {
      await authApi.resetPassword(token, { email, password: values.password });
      toast.success("Password updated. Please sign in.");
      router.push("/auth/login");
    } catch (err) {
      toast.error(getFriendlyError(err));
    } finally {
      setIsLoading(false);
    }
  };

  if (!token || !email) {
    return (
      <div className="text-center space-y-4">
        <div className="rounded-lg bg-muted p-4">
          <p className="font-medium">This reset link is invalid or incomplete</p>
          <p className="text-sm mt-1">Request a new link and use it from the latest email.</p>
        </div>
        <Link href="/auth/forgot-password">
          <Button variant="outline" className="w-full">
            Request a new link
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <fieldset disabled={isLoading} className="space-y-4 border-0 p-0 m-0 min-w-0">
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>New Password</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input placeholder="••••••••" type={showPassword ? "text" : "password"} autoComplete="new-password" {...field} className="pr-10" />
                  <button type="button" onClick={() => setShowPassword((isVisible) => !isVisible)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" tabIndex={-1}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </FormControl>
              <FormDescription>{STRONG_PASSWORD_HINT}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm Password</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input placeholder="••••••••" type={showConfirm ? "text" : "password"} autoComplete="new-password" {...field} className="pr-10" />
                  <button type="button" onClick={() => setShowConfirm((isVisible) => !isVisible)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" tabIndex={-1}>
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full h-10 font-semibold" disabled={isLoading}>
          {isLoading && <Loader2 className="animate-spin" />}
          Set New Password
        </Button>
        <div className="text-center">
          <Link href="/auth/login" className="text-sm text-primary hover:underline inline-flex items-center gap-1">
            <ArrowLeft className="h-3 w-3" />
            Back to Login
          </Link>
        </div>
        </fieldset>
      </form>
    </Form>
  );
}

export default function ResetPasswordPage() {
  return (
    <Card className="shadow-xl border-0">
      <CardHeader className="text-center space-y-2 pb-4 pt-7">
        <div className="flex justify-center">
          <div className="rounded-full bg-primary/10 p-3">
            <KeyRound className="h-7 w-7 text-primary" />
          </div>
        </div>
        <CardTitle className="text-xl font-bold">Set a New Password</CardTitle>
        <CardDescription>Choose a new password for your account</CardDescription>
      </CardHeader>
      <CardContent className="px-6 pb-7">
        {/* useSearchParams needs a Suspense boundary so Next can prerender the page. */}
        <Suspense
          fallback={
            <div className="flex justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          }
        >
          <ResetPasswordForm />
        </Suspense>
      </CardContent>
    </Card>
  );
}
