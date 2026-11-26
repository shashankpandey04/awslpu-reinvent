"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Lock,
  User,
  Tag,
} from "lucide-react";
import { useAuth } from "@/providers/auth-provider";

function normalizePhone(value: string) {
  const cleaned = value.replace(/[^\d+]/g, "");

  if (/^\d{10}$/.test(cleaned)) {
    return `+91${cleaned}`;
  }

  return cleaned;
}

function getSafeRedirect(rawRedirect: string | null): string {
  if (!rawRedirect) return "/dashboard";
  const trimmed = rawRedirect.trim();
  if (
    trimmed.startsWith("/") &&
    !trimmed.startsWith("//") &&
    !trimmed.startsWith("/\\")
  ) {
    try {
      const parsed = new URL(trimmed, "http://localhost");
      if (parsed.origin === "http://localhost") {
        return parsed.pathname + parsed.search + parsed.hash;
      }
    } catch {
      return "/dashboard";
    }
  }
  return "/dashboard";
}

function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, register } = useAuth();

  const initialMode =
    searchParams.get("mode") === "login" ? "login" : "register";

  const [authMode, setAuthMode] = useState<"login" | "register">(initialMode);
  const [loading, setLoading] = useState(false);

  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");
  const [workspaceId, setWorkspaceId] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [referralCode, setReferralCode] = useState("");

  useEffect(() => {
    const mode = searchParams.get("mode");
    if (mode === "login" || mode === "register") {
      setAuthMode(mode);
    }
    const refParam = searchParams.get("ref") || searchParams.get("referral");
    if (refParam) {
      setReferralCode(refParam.trim().toUpperCase());
    }
  }, [searchParams]);

  const redirectTarget = getSafeRedirect(searchParams.get("redirect"));
  const rawRedirect = searchParams.get("redirect");
  const safeParam = rawRedirect ? getSafeRedirect(rawRedirect) : null;
  const redirectQuery =
    safeParam && safeParam !== "/dashboard"
      ? `&redirect=${encodeURIComponent(safeParam)}`
      : "";

  const switchMode = (mode: "login" | "register") => {
    setAuthMode(mode);
    setStatusMessage(null);
    router.replace(`/auth?mode=${mode}${redirectQuery}`, { scroll: false });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setStatusMessage(null);

    try {
      const normalizedEmail = email.trim().toLowerCase();

      if (authMode === "register") {
        await register({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          email: normalizedEmail,
          phone: normalizePhone(phone),
          workspace_name: workspaceName.trim(),
          workspace_uid: workspaceId.trim(),
          referral_code: referralCode.trim() ? referralCode.trim().toUpperCase() : null,
          password,
        });

        setStatusMessage({
          type: "success",
          text: "Account created successfully! Redirecting...",
        });

        setTimeout(() => router.push(redirectTarget), 1000);
        return;
      }

      await login({
        email: normalizedEmail,
        password,
      });

      setStatusMessage({
        type: "success",
        text: "Welcome back! Redirecting...",
      });

      setTimeout(() => router.push(redirectTarget), 1000);
    } catch (err) {
      setStatusMessage({
        type: "error",
        text:
          err instanceof Error
            ? err.message
            : "Authentication failed. Please verify your details.",
      });
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full bg-transparent py-3.5 text-base text-white placeholder-white/25 outline-none transition-colors focus:placeholder-white/15 sm:py-4";

  const labelClass =
    "mb-1 block text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45";

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050505] text-white">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -left-40 top-0 h-[420px] w-[420px] rounded-full bg-[#6C00FF]/10 blur-[130px] sm:h-[600px] sm:w-[600px] sm:bg-[#6C00FF]/15" />
        <div className="absolute -right-40 bottom-0 h-[420px] w-[420px] rounded-full bg-[#FF00D4]/8 blur-[130px] sm:h-[600px] sm:w-[600px] sm:bg-[#FF00D4]/10" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,5,5,0.2),transparent_50%,rgba(5,5,5,0.3))]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-[100svh] max-w-[1700px] flex-col px-4 pb-6 pt-24 sm:min-h-screen sm:px-10 sm:pb-10 sm:pt-28 lg:px-16 lg:pt-32">
        <div className="grid flex-1 content-start items-center gap-0 py-2 sm:gap-16 sm:py-12 lg:grid-cols-[1.1fr_0.9fr] lg:content-center lg:gap-24 lg:py-16">
          <section className="relative order-2 hidden sm:block lg:order-1 lg:py-8">
            <p className="mb-3 flex items-center gap-2 text-[9px] font-semibold tracking-[0.18em] text-[#FF2D87] sm:mb-8 sm:gap-3 sm:text-xs sm:tracking-[0.22em]">
              <span className="h-px w-5 bg-[#FF00D4] sm:w-8" />
              YOUR JOURNEY STARTS HERE
            </p>

            <h1 className="text-[clamp(2.55rem,12vw,4.5rem)] font-extrabold leading-[0.82] tracking-[-0.09em] sm:text-[clamp(4rem,9vw,9rem)]">
              BE PART <span className="sm:hidden">OF THE</span>
              <br className="hidden sm:block" />
              <span className="hidden sm:inline">OF THE<br /></span>
              <span className="text-[#FF00D4]">FUTURE.</span>
            </h1>

            <p className="mt-4 max-w-lg text-xs leading-5 text-white/55 sm:mt-10 sm:text-lg sm:leading-8">
              One community. Five days. Countless possibilities. Create your
              account and get ready to experience Re:Invent Fest.
            </p>

            <div className="mt-5 hidden flex-wrap gap-x-12 gap-y-6 border-t border-white/15 pt-7 sm:flex sm:mt-16">
              <div>
                <p className="text-2xl font-bold tracking-tight">05</p>
                <p className="mt-1 text-[10px] tracking-[0.16em] text-white/40">
                  DAYS
                </p>
              </div>

              <div>
                <p className="text-2xl font-bold tracking-tight">01</p>
                <p className="mt-1 text-[10px] tracking-[0.16em] text-white/40">
                  COMMUNITY
                </p>
              </div>

              <div>
                <p className="text-2xl font-bold tracking-tight">∞</p>
                <p className="mt-1 text-[10px] tracking-[0.16em] text-white/40">
                  POSSIBILITIES
                </p>
              </div>
            </div>

            <div className="mt-16 hidden items-center gap-3 text-[10px] tracking-[0.18em] text-white/30 lg:flex">
              <span className="h-px w-8 bg-white/20" />
              AWS STUDENT BUILDER GROUP · LPU
            </div>
          </section>

          <section className="relative order-1 mx-auto w-full max-w-[520px] lg:order-2 lg:ml-auto">
            <div className="mb-5 sm:mb-12">
              <p className="mb-2 text-[10px] font-semibold tracking-[0.2em] text-[#FF2D87] sm:mb-5 sm:text-xs">
                {authMode === "register"
                  ? "GET STARTED"
                  : "GOOD TO HAVE YOU BACK"}
              </p>

              <h2 className="text-3xl font-bold tracking-[-0.06em] sm:text-5xl">
                {authMode === "register" ? (
                  <>
                    Create your
                    <br />
                    <span className="text-white/40">account.</span>
                  </>
                ) : (
                  <>
                    Welcome
                    <br />
                    <span className="text-white/40">back.</span>
                  </>
                )}
              </h2>

              <p className="mt-2 text-xs leading-5 text-white/45 sm:mt-5 sm:text-sm sm:leading-7">
                {authMode === "register"
                  ? "A few details and you're ready to go."
                  : "Sign in to continue to your festival experience."}
              </p>
            </div>

            <div className="mb-6 flex border-b border-white/15 sm:mb-10">
              <button
                type="button"
                onClick={() => switchMode("register")}
                className={`relative flex-1 pb-3 text-left text-[10px] font-semibold tracking-[0.12em] transition-colors sm:pb-4 sm:text-xs sm:tracking-[0.15em] ${
                  authMode === "register"
                    ? "text-[#FF00D4]"
                    : "text-white/35 hover:text-white"
                }`}
              >
                CREATE ACCOUNT
                {authMode === "register" && (
                  <span className="absolute inset-x-0 bottom-[-1px] h-[2px] bg-[#FF00D4]" />
                )}
              </button>

              <button
                type="button"
                onClick={() => switchMode("login")}
                className={`relative flex-1 pb-3 text-left text-[10px] font-semibold tracking-[0.12em] transition-colors sm:pb-4 sm:text-xs sm:tracking-[0.15em] ${
                  authMode === "login"
                    ? "text-[#FF00D4]"
                    : "text-white/35 hover:text-white"
                }`}
              >
                SIGN IN
                {authMode === "login" && (
                  <span className="absolute inset-x-0 bottom-[-1px] h-[2px] bg-[#FF00D4]" />
                )}
              </button>
            </div>

            {statusMessage && (
              <div
                className={`mb-5 flex items-start gap-3 rounded-xl border p-3 text-xs font-mono sm:mb-8 sm:p-4 ${
                  statusMessage.type === "success"
                    ? "border-emerald-500/40 bg-emerald-950/20 text-emerald-300"
                    : statusMessage.text.toLowerCase().includes("blocked")
                    ? "border-rose-500 bg-rose-950/40 text-rose-200 shadow-[0_0_25px_rgba(244,63,94,0.2)]"
                    : "border-rose-500/30 bg-rose-950/20 text-rose-300"
                }`}
              >
                {statusMessage.type === "success" ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                ) : (
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
                )}
                <div className="flex-1">
                  <p className="font-semibold">{statusMessage.text}</p>
                  {statusMessage.text.toLowerCase().includes("blocked") && (
                    <p className="mt-1.5 text-[11px] text-rose-300/80 font-sans leading-relaxed">
                      Your access has been restricted by event operations. If you believe this is an error, please contact the festival desk at{" "}
                      <span className="underline text-white">awsbuilders@awslpu.in</span>.
                    </p>
                  )}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-7">
              {authMode === "register" && (
                <>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
                    <div className="border-b border-white/20 transition-colors focus-within:border-[#FF00D4]">
                      <label className={labelClass}>First Name *</label>
                      <div className="flex items-center gap-3">
                        <User className="h-4 w-4 shrink-0 text-white/30" />
                        <input
                          type="text"
                          required
                          autoComplete="given-name"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          placeholder="First name"
                          className={inputClass}
                        />
                      </div>
                    </div>

                    <div className="border-b border-white/20 transition-colors focus-within:border-[#FF00D4]">
                      <label className={labelClass}>Last Name *</label>
                      <input
                        type="text"
                        required
                        autoComplete="family-name"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Last name"
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div className="border-b border-white/20 transition-colors focus-within:border-[#FF00D4]">
                    <label className={labelClass}>Workspace/College/University Name *</label>
                    <input
                      type="text"
                      required
                      value={workspaceName}
                      onChange={(e) => setWorkspaceName(e.target.value)}
                      placeholder="Your workspace name"
                      className={inputClass}
                    />
                  </div>

                  <div className="border-b border-white/20 transition-colors focus-within:border-[#FF00D4]">
                    <label className={labelClass}>Workspace/College/University ID *</label>
                    <input
                      type="text"
                      required
                      value={workspaceId}
                      onChange={(e) => setWorkspaceId(e.target.value)}
                      placeholder="Your workspace ID"
                      className={inputClass}
                    />
                  </div>

                  <div className="border-b border-white/20 transition-colors focus-within:border-[#FF00D4]">
                    <label className={labelClass}>Phone Number *</label>
                    <input
                      type="tel"
                      required
                      autoComplete="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className={inputClass}
                    />
                  </div>

                  <div className="border-b border-white/20 transition-colors focus-within:border-[#FF00D4]">
                    <div className="flex items-center justify-between">
                      <label className={labelClass}>Referral Code (Optional)</label>
                      {referralCode.trim() && (
                        <span className="text-[10px] font-mono text-emerald-400 font-semibold">
                          Code applied
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <Tag className="h-4 w-4 shrink-0 text-white/30" />
                      <input
                        type="text"
                        autoCapitalize="characters"
                        value={referralCode}
                        onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                        placeholder="e.g. CAMPUS2026, AMBASSADOR"
                        className={`${inputClass} font-mono tracking-wider`}
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="border-b border-white/20 transition-colors focus-within:border-[#FF00D4]">
                <label className={labelClass}>Email Address *</label>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className={inputClass}
                />
              </div>

              <div className="border-b border-white/20 transition-colors focus-within:border-[#FF00D4]">
                <label className={labelClass}>Password *</label>
                <div className="flex items-center gap-3">
                  <Lock className="h-4 w-4 shrink-0 text-white/30" />
                  <input
                    type="password"
                    required
                    autoComplete={
                      authMode === "register"
                        ? "new-password"
                        : "current-password"
                    }
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className={inputClass}
                  />
                </div>
              </div>

              {authMode === "login" && (
                <p className="-mt-4 text-right text-xs text-white/45">
                  Forgot your password?{" "}
                  <a
                    href="mailto:awsbuilders@awslpu.in?subject=Password%20Reset%20Request"
                    className="font-semibold text-white underline transition-colors hover:text-[#FF00D4]"
                  >
                    Email us: awsbuilders@awslpu.in
                  </a>
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="group flex min-h-12 w-full items-center justify-between rounded-lg bg-[#FF00D4] px-5 py-3.5 text-xs font-bold tracking-[0.12em] text-black transition-all hover:bg-[#FF2D87] disabled:cursor-not-allowed disabled:opacity-50 sm:py-5 sm:text-sm"
              >
                <span>
                  {loading
                    ? "PROCESSING..."
                    : authMode === "register"
                      ? "CREATE MY ACCOUNT"
                      : "SIGN IN"}
                </span>

                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </button>
            </form>

            <p className="mt-5 text-center text-xs leading-6 text-white/45 sm:mt-8 sm:text-white/35">
              {authMode === "register"
                ? "Already have an account?"
                : "New to Re:Invent Fest?"}{" "}
              <button
                type="button"
                onClick={() =>
                  switchMode(authMode === "register" ? "login" : "register")
                }
                className="font-semibold text-white transition-colors hover:text-[#FF00D4]"
              >
                {authMode === "register" ? "Sign in" : "Create an account"}
              </button>
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#050505] text-xs tracking-[0.2em] text-white/40">
          LOADING...
        </main>
      }
    >
      <AuthForm />
    </Suspense>
  );
}