export function getJWTSecret() {
  if (!process.env.JWT_SECRET) throw Object.assign(new Error('JWT_SECRET must be configured'), { code: 'AUTH_CONFIGURATION' });
  return process.env.JWT_SECRET;
}
