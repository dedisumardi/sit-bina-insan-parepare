const { randomBytes, createHash, scryptSync, timingSafeEqual } = require('node:crypto');
const { database } = require('./database');
function hashPassword(password, salt = randomBytes(16).toString('hex')) {
  return `${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
}
function verifyPassword(password, encoded) {
  const [salt, hash] = encoded.split(':');
  const expected = Buffer.from(hash || '', 'hex');
  const actual = scryptSync(password, salt, 64);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
function tokenHash(token) { return createHash('sha256').update(token).digest('hex'); }
function cookie(req) {
  return (req.headers.cookie || '').split(';').map(v => v.trim()).find(v => v.startsWith('sipintu_admin='))?.slice(14) || '';
}
async function isAdmin(req) {
  const token = cookie(req);
  if (!/^[a-f0-9]{64}$/.test(token)) return false;
  const result = await database().query('SELECT 1 FROM sipintu_sessions WHERE token_hash=$1 AND expires_at>now()', [tokenHash(token)]);
  return result.rowCount > 0;
}
async function createSession(res) {
  const token = randomBytes(32).toString('hex');
  await database().query("INSERT INTO sipintu_sessions(token_hash, expires_at) VALUES($1, now()+interval '8 hours')", [tokenHash(token)]);
  res.setHeader('Set-Cookie', `sipintu_admin=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=28800`);
}
async function logout(req, res) {
  if (cookie(req)) await database().query('DELETE FROM sipintu_sessions WHERE token_hash=$1', [tokenHash(cookie(req))]);
  res.setHeader('Set-Cookie', 'sipintu_admin=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0');
}
module.exports = { hashPassword, verifyPassword, isAdmin, createSession, logout };
