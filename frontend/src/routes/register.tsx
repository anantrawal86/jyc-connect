import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, Eye, EyeOff } from "lucide-react";
import { z } from "zod";
import { api, ApiError } from "@/services/api";
import { AuthLayout, ErrorMessage, Field } from "@/components/site";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { meta } from "@/lib/meta";

export const Route = createFileRoute("/register")({
  head: () => meta("Register", "Create your JYC Connect account with your student email."),
  component: Register,
});

const schema = z
  .object({
    fullName: z.string().trim().min(2, "Enter your full name").max(100),
    email: z.string().trim().email("Enter a valid student email").max(255),
    rollNumber: z
      .string()
      .trim()
      .regex(/^[0-9A-Za-z]{6,15}$/, "Enter a valid roll number"),
    department: z
      .string()
      .trim()
      .min(2, "Enter your department")
      .max(100, "Department name is too long"),
    password: z
      .string()
      .min(10, "At least 10 characters")
      .max(72, "Maximum 72 characters")
      .regex(/[A-Za-z]/, "Include a letter")
      .regex(/[0-9]/, "Include a number"),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, { path: ["confirm"], message: "Passwords don't match" });

type Step = 1 | 2 | 3;

function Register() {
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    rollNumber: "",
    department: "",
    password: "",
    confirm: "",
  });
  const [errors, setErrors] = useState<
    Partial<
      Record<"fullName" | "email" | "rollNumber" | "department" | "password" | "confirm", string>
    >
  >({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);
  const [otp, setOtp] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [token, setToken] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [k]: e.target.value });

  async function requestCode(e?: React.FormEvent) {
    e?.preventDefault();
    setServerError("");
    const r = schema.safeParse(form);
    if (!r.success) {
      setErrors(
        Object.fromEntries(r.error.issues.map((i) => [i.path[0] as string, i.message])) as Record<
          string,
          string
        >,
      );
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      const response = await api.requestOtp({
        fullName: r.data.fullName,
        email: r.data.email,
        rollNumber: r.data.rollNumber,
        department: r.data.department,
      });
      setStep(2);
      setCountdown(response.resendAfter);
    } catch (err) {
      setServerError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setServerError("");
    if (otp.length !== 6) return setServerError("Enter the 6-digit code.");
    setLoading(true);
    try {
      const res = await api.verifyOtp({ email: form.email.trim(), otp });
      setToken(res.verificationToken);
      setStep(3);
    } catch (err) {
      const code = err instanceof ApiError ? err.code : undefined;
      setServerError(
        code === "OTP_INVALID"
          ? "That code is incorrect or has expired. Request a new one if needed."
          : (err as Error).message,
      );
    } finally {
      setLoading(false);
    }
  }

  async function complete() {
    setServerError("");
    setLoading(true);
    try {
      await api.completeRegistration({
        verificationToken: token,
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        rollNumber: form.rollNumber.trim(),
        department: form.department.trim(),
        password: form.password,
      });
      setDone(true);
      setForm((f) => ({ ...f, password: "", confirm: "" }));
    } catch (err) {
      setServerError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Join JYC Connect"
      subtitle="Create your account and be part of the campus community."
      backgroundSlot="register"
    >
      <h1 className="text-2xl font-bold">Create Account</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link to="/login" className="font-semibold text-brand">
          Login
        </Link>
      </p>

      <ol
        className="mt-6 flex items-center gap-2 text-xs font-semibold"
        aria-label="Registration steps"
      >
        {["Details", "Verify email", "Finish"].map((label, i) => (
          <li key={label} className="flex flex-1 items-center gap-2">
            <span
              className={`grid h-7 w-7 shrink-0 place-items-center rounded-full ${step > i ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
              aria-current={step === i + 1 ? "step" : undefined}
            >
              {i + 1}
            </span>
            <span className={step > i ? "text-foreground" : "text-muted-foreground"}>{label}</span>
          </li>
        ))}
      </ol>

      {step === 1 && (
        <form onSubmit={requestCode} noValidate className="mt-6 space-y-4">
          <Field
            id="fullName"
            label="Full Name"
            required
            value={form.fullName}
            onChange={set("fullName")}
            error={errors.fullName}
            autoComplete="name"
            placeholder="Enter your full name"
          />
          <Field
            id="email"
            label="Student Email"
            required
            type="email"
            value={form.email}
            onChange={set("email")}
            error={errors.email}
            autoComplete="email"
            placeholder="Enter your student email"
          />
          <Field
            id="rollNumber"
            label="Roll Number"
            required
            value={form.rollNumber}
            onChange={set("rollNumber")}
            error={errors.rollNumber}
            placeholder="Enter your roll number"
          />
          <Field
            id="department"
            label="Department"
            required
            value={form.department}
            onChange={set("department")}
            error={errors.department}
            placeholder="Enter your department"
            autoComplete="organization"
          />
          <div className="relative">
            <Field
              id="password"
              label="Password"
              required
              type={show ? "text" : "password"}
              value={form.password}
              onChange={set("password")}
              error={errors.password}
              autoComplete="new-password"
              placeholder="At least 8 characters"
            />
            <button
              type="button"
              onClick={() => setShow(!show)}
              aria-label={show ? "Hide password" : "Show password"}
              className="absolute right-3 top-9 text-muted-foreground"
            >
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <Field
            id="confirm"
            label="Confirm Password"
            required
            type={show ? "text" : "password"}
            value={form.confirm}
            onChange={set("confirm")}
            error={errors.confirm}
            autoComplete="new-password"
            placeholder="Re-enter your password"
          />
          {serverError && <ErrorMessage message={serverError} />}
          <button
            disabled={loading}
            className="w-full rounded-lg bg-primary py-3 font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
          >
            {loading ? "Sending code…" : "Send verification code"}
          </button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={verify} className="mt-6 space-y-5">
          <p className="text-sm text-muted-foreground">
            Enter the 6-digit code sent to{" "}
            <span className="font-semibold text-foreground">{form.email}</span>.
          </p>
          <InputOTP maxLength={6} value={otp} onChange={setOtp} aria-label="Verification code">
            <InputOTPGroup>
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <InputOTPSlot key={i} index={i} />
              ))}
            </InputOTPGroup>
          </InputOTP>
          {serverError && <ErrorMessage message={serverError} />}
          <button
            disabled={loading}
            className="w-full rounded-lg bg-primary py-3 font-semibold text-primary-foreground disabled:opacity-60"
          >
            {loading ? "Verifying…" : "Verify"}
          </button>
          <div className="flex justify-between text-sm">
            <button
              type="button"
              onClick={() => {
                setStep(1);
                setOtp("");
                setServerError("");
              }}
              className="text-muted-foreground"
            >
              ← Edit details
            </button>
            <button
              type="button"
              disabled={countdown > 0 || loading}
              onClick={() => requestCode()}
              className="font-semibold text-brand disabled:text-muted-foreground"
            >
              {countdown > 0 ? `Resend in ${countdown}s` : "Resend code"}
            </button>
          </div>
        </form>
      )}

      {step === 3 && (
        <div className="mt-6 space-y-4">
          {done ? (
            <div className="rounded-xl border border-success/30 bg-success/5 p-5 text-center">
              <CheckCircle2 className="mx-auto h-10 w-10 text-success" />
              <p className="mt-2 font-semibold">Registration complete</p>
              <Link
                to="/dashboard"
                className="mt-4 inline-block rounded-lg bg-primary px-5 py-2.5 font-semibold text-primary-foreground"
              >
                Go to Dashboard
              </Link>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 rounded-xl bg-success/10 p-3 text-sm font-medium text-success">
                <CheckCircle2 className="h-5 w-5" /> Email verified
              </div>
              {serverError && <ErrorMessage message={serverError} />}
              <button
                onClick={complete}
                disabled={loading}
                className="w-full rounded-lg bg-primary py-3 font-semibold text-primary-foreground disabled:opacity-60"
              >
                {loading ? "Creating account…" : "Complete registration"}
              </button>
            </>
          )}
        </div>
      )}
    </AuthLayout>
  );
}
