const shortSuffix = () => {
  // globalThis.crypto.randomUUID() is available in both Node 19+ and Edge runtimes.
  return globalThis.crypto.randomUUID().replace(/-/g, '').slice(0, 6);
};

const slugify = (input: string) =>
  (input ?? '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);

/**
 * Generate a URL-friendly id for a text-PK row from a human title.
 * Always appends a short random suffix so concurrent inserts of the same
 * title don't collide on the primary key.
 */
export function slugId(title: string): string {
  const base = slugify(title) || 'item';
  return `${base}-${shortSuffix()}`;
}

/**
 * Generate an opaque id for rows that aren't routed by id (e.g. questions).
 */
export function opaqueId(prefix = 'row'): string {
  return `${prefix}-${globalThis.crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`;
}
