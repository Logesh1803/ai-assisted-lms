"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2, BookOpen, Eye, EyeOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { authApi } from "@/lib/api";

const registerSchema = z
  .object({
    firstName: z.string().min(2, "First name must be at least 2 characters").max(50, "First name is too long"),
    lastName: z.string().max(50, "Last name is too long").optional(),
    email: z.string().email("Enter a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Za-z]/, "Password must contain at least one letter")
      .regex(/[\d\W]/, "Password must contain at least one number or symbol"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function TeacherRegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: RegisterFormValues) => {
    setIsLoading(true);
    try {
      await authApi.register({
        firstName: values.firstName,
        lastName: values.lastName || undefined,
        email: values.email,
        password: values.password,
        role: "TEACHER",
      });
      toast.success("Teacher account created! Please sign in.");
      router.push("/auth/login");
    } catch (err: any) {
      const msg: string = err.message || "Registration failed. Please try again.";
      if (msg.toLowerCase().includes("email")) {
        form.setError("email", { message: "An account with this email already exists" });
      } else {
        toast.error(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="shadow-xl border-0">
      <CardHeader className="text-center space-y-2 pb-4 pt-7">
        <div className="flex justify-center">
          <div className="rounded-full bg-primary/10 p-3">
            <BookOpen className="h-7 w-7 text-primary" />
          </div>
        </div>
        <CardTitle className="text-xl font-bold">Create teacher account</CardTitle>
        <CardDescription>Join ThinkBloom and start teaching today</CardDescription>
      </CardHeader>
      <CardContent className="px-6 pb-7">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <fieldset disabled={isLoading} className="space-y-4 border-0 p-0 m-0 min-w-0">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Jane" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Smith" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="you@example.com" type="email" autoComplete="email" {...field} />
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
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input placeholder="••••••••" type={showPassword ? "text" : "password"} autoComplete="new-password" {...field} className="pr-10" />
                      <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" tabIndex={-1}>
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </FormControl>
                  <FormDescription>At least 8 characters with a letter and a number or symbol.</FormDescription>
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
                      <button type="button" onClick={() => setShowConfirm((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" tabIndex={-1}>
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
              Create Teacher Account
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/auth/login" className="text-primary hover:underline font-medium">
                Sign in
              </Link>
            </p>
            </fieldset>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
