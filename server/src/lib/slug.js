import slugify from 'slugify';

export const makeSlug = (text) => slugify(String(text), { lower: true, strict: true, locale: 'cs' });

/** Return a slug that does not exist yet for the given Prisma delegate. */
export async function uniqueSlug(delegate, text, excludeId) {
  const base = makeSlug(text) || 'polozka';
  let slug = base;
  for (let i = 2; ; i++) {
    const found = await delegate.findUnique({ where: { slug } });
    if (!found || found.id === excludeId) return slug;
    slug = `${base}-${i}`;
  }
}
