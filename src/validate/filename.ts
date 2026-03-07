export const MAX_FILENAME_LENGTH = 255;
const FORBIDDEN_CHARS = /[/\\:*?"<>|]/;

export interface FilenameValidationResult {
  isValid: boolean;
  error?: string;
}

export function validateFilename(
  filename: string,
  maxLength: number = MAX_FILENAME_LENGTH
): FilenameValidationResult {
  if (filename.length === 0) {
    return { isValid: false, error: "errors.fileNameEmpty" };
  }

  if (FORBIDDEN_CHARS.test(filename)) {
    return { isValid: false, error: "errors.fileNameForbiddenChars" };
  }

  if (filename.length > maxLength) {
    return { isValid: false, error: "errors.fileNameTooLong" };
  }

  return { isValid: true };
}
