/**
 * Validation Boundaries
 * Provides validation contracts and lightweight validators for domain inputs.
 */

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: Record<string, string[]>;
}

export function validateSymbol(symbol: string): ValidationResult<string> {
  const trimmed = symbol.trim().toUpperCase();
  if (!trimmed) {
    return {
      success: false,
      errors: { symbol: ["Symbol cannot be empty."] },
    };
  }
  if (!/^[A-Z0-9.\-_]{1,20}$/.test(trimmed)) {
    return {
      success: false,
      errors: { symbol: ["Invalid symbol format. Symbols should be alphanumeric up to 20 characters."] },
    };
  }
  return { success: true, data: trimmed };
}

export function validateWatchlistName(name: string): ValidationResult<string> {
  const trimmed = name.trim();
  if (!trimmed) {
    return {
      success: false,
      errors: { name: ["Watchlist name cannot be empty."] },
    };
  }
  if (trimmed.length > 50) {
    return {
      success: false,
      errors: { name: ["Watchlist name cannot exceed 50 characters."] },
    };
  }
  return { success: true, data: trimmed };
}
