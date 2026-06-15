"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff, GraduationCap, BookOpen } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { authApi } from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";

const loginSchema = z.object({
  email:    z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

function LoginForm({ role }: { role: "STUDENT" | "TEACHER" }) {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [isLoading, setIsLoading]     = useState(false);
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
        toast.error(
          `This account is registered as a ${user.role.toLowerCase()}. Please use the correct tab.`
        );
        return;
      }
      setAuth(user, accessToken);
      toast.success(`Welcome back, ${user.firstName}!`);
      router.replace(user.role === "TEACHER" ? "/teacher/dashboard" : "/student/dashboard");
    } catch (err: any) {
      const msg: string = err.message || "Login failed. Please check your credentials.";
      if (msg.toLowerCase().includes("password")) {
        form.setError("password", { message: "Incorrect password" });
      } else if (
        msg.toLowerCase().includes("email") ||
        msg.toLowerCase().includes("user") ||
        msg.toLowerCase().includes("not found")
      ) {
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
                <FormLabel className="text-sm font-medium">Email address</FormLabel>
                <FormControl>
                  <Input
                    placeholder="you@example.com"
                    type="email"
                    autoComplete="email"
                    {...field}
                  />
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
                <div className="flex items-center justify-between">
                  <FormLabel className="text-sm font-medium">Password</FormLabel>
                  <Link
                    href="/auth/forgot-password"
                    className="text-xs font-medium transition-colors"
                    style={{ color: "var(--primary)" }}
                  >
                    Forgot password?
                  </Link>
                </div>
                <FormControl>
                  <div className="relative">
                    <Input
                      placeholder="••••••••"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      {...field}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword
                        ? <EyeOff className="h-4 w-4" />
                        : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full h-11 text-sm font-semibold mt-1"
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="animate-spin" />}
            {isLoading ? "Signing in…" : "Sign in"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link
              href={role === "STUDENT" ? "/auth/student/register" : "/auth/teacher/register"}
              className="font-semibold transition-colors hover:underline"
              style={{ color: "var(--primary)" }}
            >
              Create one
            </Link>
          </p>
        </fieldset>
      </form>
    </Form>
  );
}

export default function LoginPage() {
  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="space-y-1.5">
        <h1 className="text-2xl font-extrabold tracking-tight">Welcome back</h1>
        <p className="text-sm text-muted-foreground">
          Sign in to continue your learning journey.
        </p>
      </div>

      {/* Role tabs + form */}
      <Tabs defaultValue="student" className="w-full">
        <TabsList
          className="grid grid-cols-2 w-full mb-6 rounded-xl p-1 h-auto"
          style={{
            background: "var(--secondary)",
            border: "1px solid var(--border)",
          }}
        >
          <TabsTrigger
            value="student"
            className="rounded-lg py-2.5 text-sm font-semibold flex items-center gap-2 data-[state=active]:shadow-md transition-all"
            style={
              {
                "--tw-data-active-bg": "white",
              } as React.CSSProperties
            }
          >
            <GraduationCap className="h-4 w-4" />
            Student
          </TabsTrigger>
          <TabsTrigger
            value="teacher"
            className="rounded-lg py-2.5 text-sm font-semibold flex items-center gap-2 data-[state=active]:shadow-md transition-all"
          >
            <BookOpen className="h-4 w-4" />
            Teacher
          </TabsTrigger>
        </TabsList>

        <TabsContent value="student" className="mt-0">
          <LoginForm role="STUDENT" />
        </TabsContent>
        <TabsContent value="teacher" className="mt-0">
          <LoginForm role="TEACHER" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
