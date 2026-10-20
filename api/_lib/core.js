// Общие функции серверной части: база, пароли, сессии, ответы.
// Файлы в папке api/_lib не становятся отдельными эндпоинтами Vercel.
import { neon } from '@neondatabase/serverless';
import { scrypt, randomBytes, timingSafeEqual, createHash } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt);

const SESSION_COOKIE = 'sid';
const SESSION_DAYS = 30;
const SCRYPT = { N: 16384, r: 8, p: 1, keylen: 64 };
export const MAX_LOGIN_ATTEMPTS = 10; // за 15 минут на один email

let client;
/** Клиент Neon создаётся при первом обращении */
export function db() {
  if (!process.env.DATABASE_URL) throw new HttpError(500, 'Сервер не настроен: нет подключения к базе');
  if (!client) client = neon(process.env.DATABASE_URL);
  return client;
}

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

/** Обёртка обработчика: разрешённые методы, защита от CSRF, единый формат ошибок */
export function route(handlers) {
  return async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    try {
      const handler = handlers[req.method];
      if (!handler) {
        res.setHeader('Allow', Object.keys(handlers).join(', '));
        throw new HttpError(405, 'Метод не поддерживается');
      }
      if (req.method !== 'GET') assertSameOrigin(req);
      await handler(req, res);
    } catch (err) {
      const status = err instanceof HttpError ? err.status : 500;
      if (status === 500) console.error(err);
      sendJson(res, status, { error: status === 500 && !(err instanceof HttpError) ? 'Внутренняя ошибка сервера' : err.message });
    }
  };
}

export function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

/** Изменяющие запросы принимаются только со своего сайта и только в формате JSON */
function assertSameOrigin(req) {
  const origin = req.headers.origin;
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  if (origin) {
    let originHost;
    try { originHost = new URL(origin).host; } catch { originHost = null; }
    if (originHost !== host) throw new HttpError(403, 'Запрос с чужого сайта отклонён');
  }
  if (!String(req.headers['content-type'] || '').includes('application/json')) {
    throw new HttpError(415, 'Ожидается JSON');
  }
}

export async function readJson(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch { throw new HttpError(400, 'Некорректный JSON'); }
  }
  return {};
}

/* ---------- Учётные данные ---------- */
export function normalizeEmail(value) {
  const email = String(value || '').trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new HttpError(400, 'Введите корректный email');
  }
  return email;
}

export function validatePassword(value) {
  const password = String(value || '');
  if (password.length < 8) throw new HttpError(400, 'Пароль должен быть не короче 8 символов');
  if (password.length > 128) throw new HttpError(400, 'Пароль слишком длинный');
  return password;
}

export async function hashPassword(password) {
  const salt = randomBytes(16);
  const key = await scryptAsync(password, salt, SCRYPT.keylen, { N: SCRYPT.N, r: SCRYPT.r, p: SCRYPT.p });
  return ['scrypt', SCRYPT.N, SCRYPT.r, SCRYPT.p, salt.toString('base64'), key.toString('base64')].join('$');
}

// Хеш-пустышка: проверка занимает одинаковое время, даже если email не найден
const DUMMY_HASH = 'scrypt$16384$8$1$AAAAAAAAAAAAAAAAAAAAAA==$' + Buffer.alloc(64).toString('base64');

export async function verifyPassword(password, stored = DUMMY_HASH) {
  const [scheme, N, r, p, saltB64, keyB64] = stored.split('$');
  if (scheme !== 'scrypt') return false;
  const expected = Buffer.from(keyB64, 'base64');
  const actual = await scryptAsync(password, Buffer.from(saltB64, 'base64'), expected.length, { N: Number(N), r: Number(r), p: Number(p) });
  return timingSafeEqual(expected, actual) && stored !== DUMMY_HASH;
}

/* ---------- Сессии ---------- */
const sha256 = (value) => createHash('sha256').update(value).digest('hex');

function parseCookies(req) {
  return Object.fromEntries(String(req.headers.cookie || '')
    .split(';')
    .map((part) => part.trim().split('='))
    .filter(([name]) => name)
    .map(([name, ...rest]) => [name, decodeURIComponent(rest.join('='))]));
}

function isHttps(req) {
  return req.headers['x-forwarded-proto'] === 'https';
}

function setSessionCookie(req, res, token, maxAge) {
  const parts = [`${SESSION_COOKIE}=${token}`, 'Path=/', 'HttpOnly', 'SameSite=Lax', `Max-Age=${maxAge}`];
  if (isHttps(req)) parts.push('Secure');
  res.setHeader('Set-Cookie', parts.join('; '));
}

export async function createSession(req, res, userId) {
  const token = randomBytes(32).toString('base64url');
  const expires = new Date(Date.now() + SESSION_DAYS * 86400000);
  const sql = db();
  await sql`INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (${sha256(token)}, ${userId}, ${expires})`;
  // Заодно чистим просроченные сессии пользователя
  await sql`DELETE FROM sessions WHERE user_id = ${userId} AND expires_at < now()`;
  setSessionCookie(req, res, token, SESSION_DAYS * 86400);
}

export async function destroySession(req, res) {
  const token = parseCookies(req)[SESSION_COOKIE];
  if (token) await db()`DELETE FROM sessions WHERE token_hash = ${sha256(token)}`;
  setSessionCookie(req, res, '', 0);
}

/** Текущий пользователь по cookie или null */
export async function getUser(req) {
  const token = parseCookies(req)[SESSION_COOKIE];
  if (!token) return null;
  const rows = await db()`
    SELECT u.id, u.email, u.created_at
    FROM sessions s JOIN users u ON u.id = s.user_id
    WHERE s.token_hash = ${sha256(token)} AND s.expires_at > now()`;
  return rows[0] || null;
}

export async function requireUser(req) {
  const user = await getUser(req);
  if (!user) throw new HttpError(401, 'Войдите в аккаунт');
  return user;
}
