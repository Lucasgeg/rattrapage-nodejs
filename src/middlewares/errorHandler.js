/**
 * Middleware de gestion d'erreurs (doit rester le dernier middleware monte).
 */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  const status = err.status ?? 500;

  if (status >= 500) {
    console.error('[erreur]', err);
  }

  res.status(status).json({ error: err.message ?? 'Erreur interne' });
}

/**
 * Middleware 404 pour les routes inconnues.
 */
export function notFound(req, res) {
  res.status(404).json({ error: `Route ${req.method} ${req.originalUrl} inconnue` });
}
