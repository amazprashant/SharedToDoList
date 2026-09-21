const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return 'Email is required';
  if (!EMAIL_REGEX.test(trimmed)) return 'Enter a valid email address';
  return null;
}

export function validatePassword(value: string): string | null {
  if (!value) return 'Password is required';
  if (value.length < 6) return 'Password must be at least 6 characters';
  if (value.length > 128) return 'Password must be under 128 characters';
  return null;
}

export function validateDisplayName(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return 'Name is required';
  if (trimmed.length < 2) return 'Name must be at least 2 characters';
  if (trimmed.length > 60) return 'Name must be under 60 characters';
  return null;
}

export function validateTaskTitle(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return 'Title is required';
  if (trimmed.length < 3) return 'Title must be at least 3 characters';
  if (trimmed.length > 120) return 'Title must be under 120 characters';
  return null;
}

export const TASK_DESCRIPTION_MAX_LENGTH = 1000;

export function validateTaskDescription(value: string): string | null {
  if (!value.trim()) return null;
  if (value.length > TASK_DESCRIPTION_MAX_LENGTH) {
    return `Description must be under ${TASK_DESCRIPTION_MAX_LENGTH} characters`;
  }
  return null;
}

export function validateShareEmail(value: string): string | null {
  return validateEmail(value);
}
