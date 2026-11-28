"use client";

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
import {
  extractIndianDigits,
  maskTenDigits,
  useDemoOtpGate,
  type DemoOtpPublicStatus,
} from "./use-demo-otp-gate";

export type { DemoOtpPublicStatus };

interface DemoOtpGateProps {
  otpStatus?: DemoOtpPublicStatus | null;
  onVerified: () => void;
  onCancel?: () => void;
}

export function DemoOtpGate({
  otpStatus,
  onVerified,
  onCancel,
}: DemoOtpGateProps) {
  const otp = useDemoOtpGate({ otpStatus, onVerified });
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
            Verify your mobile number with a one-time code to start the demo
            examination.
          </p>
        </div>
      </div>

      {otp.isMockMode && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs text-amber-900">
          <p className="font-semibold">Development Mock OTP Mode Active</p>
          <p className="mt-0.5 text-amber-800">
            SMS is not sent in local development. Enter your backend-configured
            development OTP to continue.
          </p>
        </div>
      )}

      {unavailable && (
        <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-xs text-rose-800">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>
            Demo Test OTP verification is currently unavailable. Please contact
            iSharp Academy.
          </span>
        </div>
      )}

      {otp.errorMsg && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-800"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>{otp.errorMsg}</span>
        </div>
      )}

      {otp.infoMsg && !otp.errorMsg && (
        <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs font-medium text-emerald-800">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
          <span>{otp.infoMsg}</span>
        </div>
      )}

      {otp.step === "phone" ? (
        <form
          onSubmit={(e) => void otp.handleRequestOtp(e)}
          className="space-y-4"
        >
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
                value={otp.phoneDigits}
                onChange={(e) => {
                  otp.setErrorMsg("");
                  otp.setPhoneDigits(extractIndianDigits(e.target.value));
                }}
                disabled={otp.loading || Boolean(unavailable)}
                className="w-full px-3 py-2.5 text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400 disabled:bg-slate-50"
              />
            </div>
            {otp.phoneValidationMessage && (
              <p className="mt-1 text-2xs font-medium text-rose-600">
                {otp.phoneValidationMessage}
              </p>
            )}
          </div>

          <p className="rounded-xl bg-slate-50 px-3 py-2 text-2xs leading-relaxed text-slate-600">
            Your mobile number is collected for Demo Test access verification.
            If you are under 18, please have a parent or guardian enter their
            mobile number and provide consent.
          </p>

          <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-700 hover:bg-slate-50">
            <input
              type="checkbox"
              checked={otp.marketingConsent}
              onChange={(e) => otp.setMarketingConsent(e.target.checked)}
              className="mt-0.5 size-4 rounded border-slate-300 text-brand-red focus:ring-brand-red"
            />
            <span className="leading-relaxed">
              I agree to receive academy admission-related calls and messages
              from iSharp Academy{" "}
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
              disabled={
                otp.loading || !otp.isPhoneValid || Boolean(unavailable)
              }
              className="w-full gap-2 rounded-full bg-brand-red text-xs font-bold text-white hover:bg-brand-red-hover sm:w-auto"
            >
              {otp.loading && <LoaderCircle className="size-4 animate-spin" />}
              <span>Send OTP</span>
            </Button>
          </div>
        </form>
      ) : (
        <form
          onSubmit={(e) => void otp.handleVerifyOtp(e)}
          className="space-y-4"
        >
          <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3.5 py-2.5 text-xs">
            <span className="font-semibold text-slate-700">
              Mobile: {maskTenDigits(otp.phoneDigits)}
            </span>
            <button
              type="button"
              onClick={() => {
                otp.setStep("phone");
                otp.setOtpValue("");
                otp.setErrorMsg("");
                otp.setInfoMsg("");
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
              value={otp.otpValue}
              onChange={(e) => {
                otp.setErrorMsg("");
                otp.setOtpValue(e.target.value.replace(/\D/g, "").slice(0, 6));
              }}
              className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-center font-mono text-xl font-bold tracking-[0.5em] text-slate-950 outline-none focus:border-brand-red focus:ring-2 focus:ring-brand-red/15"
            />
            <div className="mt-2 flex items-center justify-between text-2xs text-slate-500">
              <span className="inline-flex items-center gap-1">
                <Lock className="size-3" />
                {otp.expiryRemaining > 0
                  ? `Expires in ${Math.floor(otp.expiryRemaining / 60)}:${String(otp.expiryRemaining % 60).padStart(2, "0")}`
                  : "OTP expired — request a new code"}
              </span>
              <button
                type="button"
                disabled={otp.resendCooldown > 0 || otp.resending}
                onClick={() => void otp.handleResendOtp()}
                className="inline-flex items-center gap-1 font-semibold text-brand-red disabled:cursor-not-allowed disabled:text-slate-400"
              >
                <RefreshCw
                  className={`size-3 ${otp.resending ? "animate-spin" : ""}`}
                />
                {otp.resendCooldown > 0
                  ? `Resend in ${otp.resendCooldown}s`
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
              disabled={otp.loading || otp.otpValue.length !== 6}
              className="w-full gap-2 rounded-full bg-brand-red text-xs font-bold text-white hover:bg-brand-red-hover sm:w-auto"
            >
              {otp.loading && <LoaderCircle className="size-4 animate-spin" />}
              <span>Verify &amp; Start Demo Test</span>
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
