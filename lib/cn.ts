type ClassValue = string | false | null | undefined;

/** Tiny className joiner. */
export function cn(...classes: ClassValue[]): string {
  return classes.filter(Boolean).join(" ");
}
