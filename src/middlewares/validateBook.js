/**
 * Valide le corps d'une requete de creation de livre.
 */
export function validateBook(req, res, next) {
  const { title, author, stock } = req.body ?? {};
  const errors = [];

  if (!title) {
    errors.push('title est requis');
  }

  if (!author) {
    errors.push('author est requis');
  }

  if (!stock) {
    errors.push('stock est requis');
  }

  if (errors.length > 0) {
    return res.status(400).json({ error: 'Payload invalide', details: errors });
  }

  return next();
}
