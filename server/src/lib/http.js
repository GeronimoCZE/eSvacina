export class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export const badRequest = (msg, details) => new HttpError(400, msg, details);
export const unauthorized = (msg = 'Pro tuto akci se musíte přihlásit.') => new HttpError(401, msg);
export const forbidden = (msg = 'K této akci nemáte oprávnění.') => new HttpError(403, msg);
export const notFound = (msg = 'Nenalezeno.') => new HttpError(404, msg);

/** Parse a request part with a zod schema, throwing a 400 with field errors. */
export function parse(schema, data) {
  const result = schema.safeParse(data);
  if (!result.success) {
    const details = result.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message }));
    throw badRequest(details[0]?.message || 'Neplatná data.', details);
  }
  return result.data;
}

export const toInt = (v, fallback) => {
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : fallback;
};
