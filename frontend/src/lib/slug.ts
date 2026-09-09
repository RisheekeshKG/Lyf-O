/** Data files are addressed by name on disk, so the filename is derived, not stored. */
export function toFileName(name: string): string {
  return `${name.trim().replace(/\s+/g, "_").toLowerCase()}.json`;
}
