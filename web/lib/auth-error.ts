type AuthErrorLike = {
  code?: string;
  message: string;
  status?: number;
};

export function getSignupErrorMessage(error: AuthErrorLike) {
  const message = error.message.toLowerCase();

  if (
    error.code === "over_email_send_rate_limit" ||
    message.includes("email rate limit exceeded")
  ) {
    return "Confirmation email service is temporarily busy. Please try again later, or continue with Google to create your account now.";
  }

  if (error.code === "email_address_not_authorized") {
    return "Confirmation email cannot be sent to this address yet. Please continue with Google or contact I-Sharp support.";
  }

  if (
    message.includes("already registered") ||
    message.includes("already been registered")
  ) {
    return "This email already has an account. Sign in instead, or use Forgot password.";
  }

  if (message.includes("email") && message.includes("invalid")) {
    return "Use a real, deliverable email address. Any valid email can create an account; only an exact I-Sharp roster match receives free access.";
  }

  // Don't expose raw server error messages to users.
  return "Something went wrong. Please try again or contact I-Sharp support.";
}

export function getLoginErrorMessage(error: unknown): string {
  if (!error || typeof error !== "object") {
    return "Invalid email or password.";
  }

  const err = error as {
    code?: string;
    message?: string;
    name?: string;
    status?: number;
  };
  const message = (err.message ?? "").toLowerCase();

  const isRateLimited =
    err.status === 429 ||
    err.code === "over_request_rate_limit" ||
    message.includes("rate limit") ||
    message.includes("too many requests");
  if (isRateLimited) {
    return "Too many sign-in attempts. Please wait a minute and try again.";
  }

  const isNetworkError =
    err.name === "AuthRetryableFetchError" ||
    err.status === 0 ||
    message.includes("fetch failed") ||
    message.includes("failed to fetch") ||
    message.includes("network error");
  if (isNetworkError) {
    return "Cannot connect to the server. Please check your connection.";
  }

  const isTimeout =
    err.status === 408 ||
    message.includes("timed out") ||
    message.includes("timeout");
  if (isTimeout) {
    return "The request timed out. Please check your connection and try again.";
  }

  const isServerError =
    (typeof err.status === "number" && err.status >= 500) ||
    message.includes("internal server error") ||
    message.includes("service unavailable");
  if (isServerError) {
    return "Unable to sign in right now. Please try again.";
  }

  return "Invalid email or password.";
}
