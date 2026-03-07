const UNITS = ["B", "KB", "MB", "GB"] as const;

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";

  let unitIndex = 0;
  let size = bytes;

  while (size >= 1024 && unitIndex < UNITS.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  if (unitIndex === 0) {
    return `${size} ${UNITS[unitIndex]}`;
  }

  return `${size.toFixed(1)} ${UNITS[unitIndex]}`;
}
