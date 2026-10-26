import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff } from "lucide-react";
import { api } from "@/services/api";
import { AuthLayout, ErrorMessage, Field } from "@/components/site";
import { meta } from "@/lib/meta";

export const Route = createFileRoute("/login")({
  head: () => meta("Login", "Log in to JYC Connect with your student email or roll number."),
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<"identifier" | "password", string>>>({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const errs: Partial<Record<"identifier" | "password", string>> = {};
    if (!identifier.trim()) errs.identifier = "Enter your email or roll number";
    if (password.length < 8) errs.password = "Password must be at least 8 characters";
    setErrors(errs);
    setServerError("");
    if (Object.keys(errs).length) return;
    setLoading(true);
    try {
      await api.login({ identifier: identifier.trim(), password });
      const pendingFormUrl = sessionStorage.getItem("jyc-pending-registration-url");
      if (pendingFormUrl) {
        sessionStorage.removeItem("jyc-pending-registration-url");
        await navigate({ to: "/" });
        return;
      }
      await navigate({ to: "/dashboard" });
    } catch (err) {
      setServerError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout title="Welcome Back!" subtitle="Log in to your account to continue with JYC Connect." backgroundSlot="login">
      <h1 className="text-2xl font-bold">Login</h1>
      <p className="mt-1 text-sm text-muted-foreground">Don't have an account? <Link to="/register" className="font-semibold text-brand">Register</Link></p>
      <form onSubmit={submit} noValidate className="mt-6 space-y-4">
        <Field id="identifier" label="Email or Roll Number" required value={identifier} onChange={(e) => setIdentifier(e.target.value)} error={errors.identifier} placeholder="Enter your email or roll number" autoComplete="username" />
        <div className="relative">
          <Field id="password" label="Password" required type={show ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} error={errors.password} placeholder="Enter your password" autoComplete="current-password" />
          <button type="button" onClick={() => setShow(!show)} aria-label={show ? "Hide password" : "Show password"} className="absolute right-3 top-9 text-muted-foreground">
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {serverError && <ErrorMessage message={serverError} />}
        <button disabled={loading} className="w-full rounded-lg bg-primary py-3 font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60">{loading ? "Logging in…" : "Login"}</button>
      </form>
      <p className="mt-6 text-center text-sm"><Link to="/dashboard" className="text-muted-foreground underline">Preview the student dashboard</Link></p>
    </AuthLayout>
  );
}
