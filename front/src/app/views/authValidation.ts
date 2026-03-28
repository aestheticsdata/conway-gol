import { AUTH_VALIDATION_TEXTS } from "@texts";

export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 24;
export const PASSWORD_MIN_LENGTH = 8;
export const RECOVERY_PASSPHRASE_MIN_LENGTH = 10;

function normalizeCredentialValue(value: string): string {
  return value.trim();
}

export function getUsernameValidationError(username: string): string {
  const normalized = normalizeCredentialValue(username);

  if (normalized.length === 0) {
    return AUTH_VALIDATION_TEXTS.username.required;
  }

  if (normalized.length < USERNAME_MIN_LENGTH || normalized.length > USERNAME_MAX_LENGTH) {
    return AUTH_VALIDATION_TEXTS.username.length;
  }

  if (!/^[A-Za-z0-9_-]+$/.test(normalized)) {
    return AUTH_VALIDATION_TEXTS.username.characters;
  }

  return "";
}

export function isStrongPassword(password: string): boolean {
  const normalized = normalizeCredentialValue(password);

  return (
    normalized.length >= PASSWORD_MIN_LENGTH &&
    /[a-z]/.test(normalized) &&
    /[A-Z]/.test(normalized) &&
    /\d/.test(normalized) &&
    /[^A-Za-z0-9]/.test(normalized)
  );
}

export function getPasswordValidationError(password: string): string {
  if (normalizeCredentialValue(password).length === 0) {
    return AUTH_VALIDATION_TEXTS.password.required;
  }

  if (!isStrongPassword(password)) {
    return AUTH_VALIDATION_TEXTS.password.rule;
  }

  return "";
}

export function getPasswordConfirmationValidationError(password: string, confirmation: string): string {
  if (normalizeCredentialValue(confirmation).length === 0) {
    return AUTH_VALIDATION_TEXTS.password.confirmRequired;
  }

  if (normalizeCredentialValue(password) !== normalizeCredentialValue(confirmation)) {
    return AUTH_VALIDATION_TEXTS.password.mismatch;
  }

  return "";
}

export function getRecoveryPassphraseValidationError(passphrase: string): string {
  const normalized = normalizeCredentialValue(passphrase);

  if (normalized.length === 0) {
    return AUTH_VALIDATION_TEXTS.recoveryPassphrase.required;
  }

  if (normalized.length < RECOVERY_PASSPHRASE_MIN_LENGTH) {
    return AUTH_VALIDATION_TEXTS.recoveryPassphrase.rule;
  }

  return "";
}

export function getRecoveryPassphraseConfirmationValidationError(passphrase: string, confirmation: string): string {
  if (normalizeCredentialValue(confirmation).length === 0) {
    return AUTH_VALIDATION_TEXTS.recoveryPassphrase.confirmRequired;
  }

  if (normalizeCredentialValue(passphrase) !== normalizeCredentialValue(confirmation)) {
    return AUTH_VALIDATION_TEXTS.recoveryPassphrase.mismatch;
  }

  return "";
}

export function getCurrentRecoveryPassphraseValidationError(currentValue: string, storedValue: string | null): string {
  const normalizedCurrentValue = normalizeCredentialValue(currentValue);

  if (normalizedCurrentValue.length === 0) {
    return AUTH_VALIDATION_TEXTS.recoveryPassphrase.currentRequired;
  }

  const normalizedStoredValue = normalizeCredentialValue(storedValue ?? "");
  if (normalizedStoredValue.length > 0 && normalizedCurrentValue !== normalizedStoredValue) {
    return AUTH_VALIDATION_TEXTS.recoveryPassphrase.currentInvalid;
  }

  return "";
}
