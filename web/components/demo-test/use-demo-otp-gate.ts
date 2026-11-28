import { useEffect, useMemo, useState } from "react";

export interface DemoOtpPublicStatus {
  isAvailable: boolean;
  isMockMode: boolean;
  expirySeconds: number;
  resendCooldownSeconds: number;
  maxAttempts: number;
}

export function extractIndianDigits(raw: string): string {
  let digits = raw.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) {
    digits = digits.slice(2);
  } else if (digits.length === 11 && digits.startsWith("0")) {
    digits = digits.slice(1);
  }
  return digits.slice(0, 10);
}

export function maskTenDigits(digits: string): string {
  if (digits.length < 4) return "+91 **********";
  return `+91 ******${digits.slice(-4)}`;
}

export function useDemoOtpGate({
  otpStatus,
  onVerified,
}: {
  otpStatus?: DemoOtpPublicStatus | null;
  onVerified: () => void;
}) {
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

  return {
    step,
    setStep,
    phoneDigits,
    setPhoneDigits,
    marketingConsent,
    setMarketingConsent,
    otpValue,
    setOtpValue,
    resendCooldown,
    expiryRemaining,
    loading,
    resending,
    errorMsg,
    setErrorMsg,
    infoMsg,
    setInfoMsg,
    isMockMode,
    isPhoneValid,
    phoneValidationMessage,
    handleRequestOtp,
    handleResendOtp,
    handleVerifyOtp,
  };
}
