"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2, GraduationCap, Eye, EyeOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { authApi } from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

function LoginForm({ role }: { role: "STUDENT" | "TEACHER" }) {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setIsLoading(true);
    try {
      const data = await authApi.login(values);
      const { accessToken, user } = data as any;
      if (user.role !== role) {
        toast.error(`This account is registered as a ${user.role.toLowerCase()}. Please use the correct tab.`);
        return;
      }
      setAuth(user, accessToken);
      toast.success(`Welcome back, ${user.firstName}!`);
      if (user.role === "TEACHER") {
        router.replace("/teacher/dashboard");
      } else {
        router.replace("/student/dashboard");
      }
    } catch (err: any) {
      const msg: string = err.message || "Login failed. Please check your credentials.";
      if (msg.toLowerCase().includes("password")) {
        form.setError("password", { message: "Incorrect password" });
      } else if (msg.toLowerCase().includes("email") || msg.toLowerCase().includes("user") || msg.toLowerCase().includes("not found")) {
        form.setError("email", { message: "No account found with this email" });
      } else {
        toast.error(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <fieldset disabled={isLoading} className="space-y-4 border-0 p-0 m-0 min-w-0">
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
                  <Input placeholder="••••••••" type={showPassword ? "text" : "password"} autoComplete="current-password" {...field} className="pr-10" />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex items-center justify-end -mt-2">
          <Link href="/auth/forgot-password" className="text-xs text-muted-foreground hover:text-primary hover:underline">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" className="w-full h-10 font-semibold" disabled={isLoading}>
          {isLoading && <Loader2 className="animate-spin" />}
          Sign In
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link
            href={role === "STUDENT" ? "/auth/student/register" : "/auth/teacher/register"}
            className="text-primary hover:underline font-medium"
          >
            Register
          </Link>
        </p>
        </fieldset>
      </form>
    </Form>
  );
}

export default function LoginPage() {
  return (
    <Card className="shadow-xl border-0">
      <CardHeader className="text-center space-y-2 pb-4 pt-7">
        <div className="flex justify-center">
          <div className="rounded-full bg-primary/10 p-3">
            <GraduationCap className="h-7 w-7 text-primary" />
          </div>
        </div>
        <CardTitle className="text-xl font-bold">Sign in to ThinkBloom</CardTitle>
        <CardDescription>Choose your role and enter your credentials</CardDescription>
      </CardHeader>
      <CardContent className="px-6 pb-7">
        <Tabs defaultValue="student" className="w-full">
          <TabsList className="grid grid-cols-2 w-full mb-5">
            <TabsTrigger value="student" className="text-sm">Student</TabsTrigger>
            <TabsTrigger value="teacher" className="text-sm">Teacher</TabsTrigger>
          </TabsList>
          <TabsContent value="student">
            <LoginForm role="STUDENT" />
          </TabsContent>
          <TabsContent value="teacher">
            <LoginForm role="TEACHER" />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
