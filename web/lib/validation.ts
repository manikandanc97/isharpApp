// Basic structural check; Supabase validates deliverability authoritatively.
export const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const phonePattern = /^\+?[0-9]{8,15}$/;

export function normalizePhone(value: string): string {
  return value.replace(/[\s()-]/g, "");
}

export function isValidEmail(value: string): boolean {
  return emailPattern.test(value.trim());
}

export function isValidPhone(value: string): boolean {
  return phonePattern.test(normalizePhone(value.trim()));
}

export function validateIdentifier(value: string): string | undefined {
  const identifier = value.trim();

  if (!identifier) {
    return "Enter your email or mobile number.";
  }

  if (!isValidEmail(identifier) && !isValidPhone(identifier)) {
    return "Enter a valid email or mobile number.";
  }
}

export type RegistrationFieldErrors = {
  email?: string;
  password?: string;
  confirmPassword?: string;
};

export function validateRegistration({
  email,
  password,
  confirmPassword,
}: {
  email: string;
  password: string;
  confirmPassword?: string;
}): RegistrationFieldErrors {
  const errors: RegistrationFieldErrors = {};
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail) {
    errors.email = "Enter your email address.";
  } else if (!isValidEmail(normalizedEmail)) {
    errors.email = "Enter a valid email address.";
  }

  if (!password) {
    errors.password = "Create a password.";
  } else if (password.length < 8) {
    errors.password = "Use at least 8 characters.";
  }

  if (confirmPassword !== undefined) {
    if (!confirmPassword) {
      errors.confirmPassword = "Confirm your password.";
    } else if (password !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match.";
    }
  }

  return errors;
}
