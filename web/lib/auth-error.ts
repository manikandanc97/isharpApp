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

  return error.message;
}
