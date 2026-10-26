import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, MapPin, Phone } from "lucide-react";
import { z } from "zod";
import { api } from "@/services/api";
import { ErrorMessage, Field, PageHeader, RequiredMark, SiteLayout } from "@/components/site";
import { meta } from "@/lib/meta";

export const Route = createFileRoute("/contact")({
  head: () => meta("Contact", "Get in touch with JYC at Jaypee University, Anoopshahr."),
  component: Contact,
});

const schema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(100),
  email: z.string().trim().email("Enter a valid email").max(255),
  message: z.string().trim().min(10, "Message must be at least 10 characters").max(1000),
});

function Contact() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [errors, setErrors] = useState<Partial<Record<"name" | "email" | "message", string>>>({});
  const [serverError, setServerError] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setServerError("");
    const r = schema.safeParse(form);
    if (!r.success) return setErrors(Object.fromEntries(r.error.issues.map((i) => [i.path[0] as string, i.message])) as Record<string, string>);
    setErrors({});
    setLoading(true);
    try { await api.sendContact(r.data); setSent(true); } catch (err) { setServerError((err as Error).message); } finally { setLoading(false); }
  }

  return (
    <SiteLayout>
      <PageHeader title="Get in Touch" subtitle="Have questions? Reach out to us." />
      <div className="container-page mt-10 grid gap-8 lg:grid-cols-[1fr_1.4fr]">
        <ul className="space-y-4">
          {[
            { i: Mail, l: "Official Email", v: "To be provided by JYC" },
            { i: Phone, l: "Phone", v: "To be provided by JYC" },
            { i: MapPin, l: "Location", v: "Jaypee University, Anoopshahr" },
          ].map((c) => (
            <li key={c.l} className="flex items-center gap-4 rounded-2xl border bg-card p-5 shadow-card">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground"><c.i className="h-5 w-5" /></span>
              <div><p className="text-sm text-muted-foreground">{c.l}</p><p className="font-semibold">{c.v}</p></div>
            </li>
          ))}
        </ul>
        <form onSubmit={submit} noValidate className="space-y-4 rounded-2xl border bg-card p-6 shadow-card">
          <h2 className="text-lg font-bold">Send us a Message</h2>
          {sent ? <p className="rounded-lg bg-success/10 p-3 text-sm font-medium text-success">Thanks — your message was sent.</p> : (
            <>
              <Field id="name" label="Full Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={errors.name} />
              <Field id="email" label="Email" required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} error={errors.email} />
              <div className="space-y-1.5">
                <label htmlFor="message" className="text-sm font-semibold">Message<RequiredMark /></label>
                <textarea id="message" required rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} aria-invalid={!!errors.message}
                  className="field-control w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 aria-[invalid=true]:border-destructive" />
                {errors.message && <p className="text-xs text-destructive">{errors.message}</p>}
              </div>
              {serverError && <ErrorMessage message={serverError} />}
              <button disabled={loading} className="w-full rounded-lg bg-primary py-3 font-semibold text-primary-foreground disabled:opacity-60">{loading ? "Sending…" : "Send Message"}</button>
            </>
          )}
        </form>
      </div>
    </SiteLayout>
  );
}
