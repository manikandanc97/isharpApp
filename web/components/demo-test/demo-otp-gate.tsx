"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  LoaderCircle,
  Lock,
  Phone,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export interface DemoOtpPublicStatus {
  isAvailable: boolean;
  isMockMode: boolean;
  expirySeconds: number;
  resendCooldownSeconds: number;
  maxAttempts: number;
}

interface DemoOtpGateProps {
  otpStatus?: DemoOtpPublicStatus | null;
  onVerified: () => void;
  onCancel?: () => void;
}

function extractIndianDigits(raw: string): string {
  let digits = raw.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) {
    digits = digits.slice(2);
  } else if (digits.length === 11 && digits.startsWith("0")) {
    digits = digits.slice(1);
  }
  return digits.slice(0, 10);
}

function maskTenDigits(digits: string): string {
  if (digits.length < 4) return "+91 **********";
  return `+91 ******${digits.slice(-4)}`;
}

export function DemoOtpGate({
  otpStatus,
  onVerified,
  onCancel,
}: DemoOtpGateProps) {
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phoneDigits, setPhoneDigits] = useState("");
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [otpValue, setOtpValue] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [expiryRemaining, setExpiryRemaining] = useState(0);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [infoMsg, setInfoMsg] = useState("");
  const [otpMockMode, setOtpMockMode] = useState<boolean | null>(null);
  const isMockMode = otpMockMode ?? Boolean(otpStatus?.isMockMode);

  useEffect(() => {
    if (resendCooldown <= 0 && expiryRemaining <= 0) return;
    const timer = window.setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      setExpiryRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [resendCooldown, expiryRemaining]);

  const isPhoneValid = useMemo(
    () => /^[6-9]\d{9}$/.test(phoneDigits),
    [phoneDigits],
  );

  const phoneValidationMessage = useMemo(() => {
    if (!phoneDigits) return "";
    if (phoneDigits.length < 10) {
      return "Enter a 10-digit Indian mobile number.";
    }
    if (!isPhoneValid) {
      return "Indian mobile numbers must start with 6, 7, 8, or 9.";
    }
    return "";
  }, [phoneDigits, isPhoneValid]);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setInfoMsg("");

    if (!isPhoneValid) {
      setErrorMsg(
        phoneValidationMessage ||
          "Please enter a valid 10-digit Indian mobile number.",
      );
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/demo/otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: `+91${phoneDigits}`,
          marketingConsent,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        challengeId?: string;
        expiresInSeconds?: number;
        resendCooldownSeconds?: number;
        isMockMode?: boolean;
        message?: string;
      };

      if (!res.ok || !data.challengeId) {
        setErrorMsg(data.message || "Unable to send OTP. Please try again.");
        return;
      }

      setChallengeId(data.challengeId);
      setOtpValue("");
      setOtpMockMode(Boolean(data.isMockMode));
      setResendCooldown(data.resendCooldownSeconds ?? 60);
      setExpiryRemaining(data.expiresInSeconds ?? 300);
      setInfoMsg(data.message || "Verification code ready.");
      setStep("otp");
    } catch {
      setErrorMsg("Network error while requesting OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!challengeId || resendCooldown > 0 || resending) return;
    setErrorMsg("");
    setInfoMsg("");
    setResending(true);
    try {
      const res = await fetch("/api/demo/otp/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeId }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        expiresInSeconds?: number;
        resendCooldownSeconds?: number;
        isMockMode?: boolean;
        message?: string;
      };
      if (!res.ok) {
        setErrorMsg(data.message || "Unable to resend OTP.");
        return;
      }
      setOtpMockMode(Boolean(data.isMockMode));
      setResendCooldown(data.resendCooldownSeconds ?? 60);
      setExpiryRemaining(data.expiresInSeconds ?? 300);
      setInfoMsg(data.message || "OTP refreshed.");
    } catch {
      setErrorMsg("Network error while resending OTP.");
    } finally {
      setResending(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    if (!challengeId) {
      setErrorMsg("OTP session missing. Please request a new OTP.");
      setStep("phone");
      return;
    }
    const cleanOtp = otpValue.replace(/\D/g, "").slice(0, 6);
    if (cleanOtp.length !== 6) {
      setErrorMsg("Please enter the 6-digit OTP.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/demo/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challengeId,
          otp: cleanOtp,
          marketingConsent,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        verified?: boolean;
        message?: string;
      };
      if (!res.ok || !data.verified) {
        setErrorMsg(data.message || "OTP verification failed.");
        return;
      }
      onVerified();
    } catch {
      setErrorMsg("Network error while verifying OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const unavailable = otpStatus && !otpStatus.isAvailable;

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-rose-50 text-brand-red">
          <ShieldCheck className="size-5" />
        </span>
        <div>
          <h2 className="text-base font-bold text-slate-950 sm:text-lg">
            Attend Free Demo Test
          </h2>
          <p className="mt-0.5 text-xs text-slate-600">
            Verify your mobile number with a one-time code to start the demo examination.
          </p>
        </div>
      </div>

      {isMockMode && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs text-amber-900">
          <p className="font-semibold">Development Mock OTP Mode Active</p>
          <p className="mt-0.5 text-amber-800">
            SMS is not sent in local development. Enter your backend-configured development OTP to continue.
          </p>
        </div>
      )}

      {unavailable && (
        <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-xs text-rose-800">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>
            Demo Test OTP verification is currently unavailable. Please contact iSharp Academy.
          </span>
        </div>
      )}

      {errorMsg && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-800"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {infoMsg && !errorMsg && (
        <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs font-medium text-emerald-800">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
          <span>{infoMsg}</span>
        </div>
      )}

      {step === "phone" ? (
        <form onSubmit={(e) => void handleRequestOtp(e)} className="space-y-4">
          <div>
            <label
              htmlFor="demo-mobile-input"
              className="block text-xs font-semibold text-slate-700"
            >
              Mobile Number
            </label>
            <div className="mt-1.5 flex items-center overflow-hidden rounded-xl border border-slate-300 bg-white focus-within:border-brand-red focus-within:ring-2 focus-within:ring-brand-red/15">
              <span className="flex items-center gap-1.5 border-r border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold text-slate-700">
                <Phone className="size-3.5 text-slate-500" />
                +91
              </span>
              <input
                id="demo-mobile-input"
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                placeholder="Enter 10-digit mobile number"
                value={phoneDigits}
                onChange={(e) => {
                  setErrorMsg("");
                  setPhoneDigits(extractIndianDigits(e.target.value));
                }}
                disabled={loading || Boolean(unavailable)}
                className="w-full px-3 py-2.5 text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400 disabled:bg-slate-50"
              />
            </div>
            {phoneValidationMessage && (
              <p className="mt-1 text-2xs font-medium text-rose-600">
                {phoneValidationMessage}
              </p>
            )}
          </div>

          <p className="rounded-xl bg-slate-50 px-3 py-2 text-2xs leading-relaxed text-slate-600">
            Your mobile number is collected for Demo Test access verification. If you are under 18, please have a parent or guardian enter their mobile number and provide consent.
          </p>

          <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-700 hover:bg-slate-50">
            <input
              type="checkbox"
              checked={marketingConsent}
              onChange={(e) => setMarketingConsent(e.target.checked)}
              className="mt-0.5 size-4 rounded border-slate-300 text-brand-red focus:ring-brand-red"
            />
            <span className="leading-relaxed">
              I agree to receive academy admission-related calls and messages from iSharp Academy{" "}
              <span className="text-slate-400">(optional)</span>.
            </span>
          </label>

          <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="rounded-full text-xs font-semibold"
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              disabled={loading || !isPhoneValid || Boolean(unavailable)}
              className="w-full gap-2 rounded-full bg-brand-red text-xs font-bold text-white hover:bg-brand-red-hover sm:w-auto"
            >
              {loading && <LoaderCircle className="size-4 animate-spin" />}
              <span>Send OTP</span>
            </Button>
          </div>
        </form>
      ) : (
        <form onSubmit={(e) => void handleVerifyOtp(e)} className="space-y-4">
          <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3.5 py-2.5 text-xs">
            <span className="font-semibold text-slate-700">
              Mobile: {maskTenDigits(phoneDigits)}
            </span>
            <button
              type="button"
              onClick={() => {
                setStep("phone");
                setOtpValue("");
                setErrorMsg("");
                setInfoMsg("");
              }}
              className="font-semibold text-brand-red hover:underline"
            >
              Change number
            </button>
          </div>

          <div>
            <label
              htmlFor="demo-otp-input"
              className="block text-xs font-semibold text-slate-700"
            >
              Enter 6-Digit OTP
            </label>
            <input
              id="demo-otp-input"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="••••••"
              value={otpValue}
              onChange={(e) => {
                setErrorMsg("");
                setOtpValue(e.target.value.replace(/\D/g, "").slice(0, 6));
              }}
              className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-center font-mono text-xl font-bold tracking-[0.5em] text-slate-950 outline-none focus:border-brand-red focus:ring-2 focus:ring-brand-red/15"
            />
            <div className="mt-2 flex items-center justify-between text-2xs text-slate-500">
              <span className="inline-flex items-center gap-1">
                <Lock className="size-3" />
                {expiryRemaining > 0
                  ? `Expires in ${Math.floor(expiryRemaining / 60)}:${String(expiryRemaining % 60).padStart(2, "0")}`
                  : "OTP expired — request a new code"}
              </span>
              <button
                type="button"
                disabled={resendCooldown > 0 || resending}
                onClick={() => void handleResendOtp()}
                className="inline-flex items-center gap-1 font-semibold text-brand-red disabled:cursor-not-allowed disabled:text-slate-400"
              >
                <RefreshCw className={`size-3 ${resending ? "animate-spin" : ""}`} />
                {resendCooldown > 0
                  ? `Resend in ${resendCooldown}s`
                  : "Resend OTP"}
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="rounded-full text-xs font-semibold"
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              disabled={loading || otpValue.length !== 6}
              className="w-full gap-2 rounded-full bg-brand-red text-xs font-bold text-white hover:bg-brand-red-hover sm:w-auto"
            >
              {loading && <LoaderCircle className="size-4 animate-spin" />}
              <span>Verify &amp; Start Demo Test</span>
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
