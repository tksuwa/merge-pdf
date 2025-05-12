export const MAX_FILENAME_LENGTH = 100;

export interface FilenameValidationResult {
  isValid: boolean;
  error?: string;
}

export function validateFilename(
  filename: string,
  maxLength: number = MAX_FILENAME_LENGTH
): FilenameValidationResult {
  if (filename.length > maxLength) {
    return {
      isValid: false,
      error: `errors.fileNameTooLong`,
    };
  }

  return { isValid: true };
}