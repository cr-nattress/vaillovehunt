# Security

- Dependencies: keep `npm audit` clean; renovate recommended.
- Environment: do not commit secrets. Use `.env` locally and Netlify/CI secrets in prod.
- CSP: prefer strict `script-src 'self'` and avoid inline scripts.
