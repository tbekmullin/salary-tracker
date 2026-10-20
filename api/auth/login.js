// POST /api/auth/login — вход по email и паролю
import { route, readJson, db, normalizeEmail, verifyPassword, createSession, sendJson, HttpError, MAX_LOGIN_ATTEMPTS } from '../_lib/core.js';

export default route({
  async POST(req, res) {
    const body = await readJson(req);
    const email = normalizeEmail(body.email);
    const password = String(body.password || '');
    const sql = db();

    // Защита от подбора пароля: не больше 10 ошибок за 15 минут
    const [{ count }] = await sql`
      SELECT count(*)::int AS count FROM login_attempts
      WHERE email = ${email} AND created_at > now() - interval '15 minutes'`;
    if (count >= MAX_LOGIN_ATTEMPTS) {
      throw new HttpError(429, 'Слишком много попыток входа. Подождите 15 минут и попробуйте снова');
    }

    const [user] = await sql`SELECT id, email, password_hash FROM users WHERE email = ${email}`;
    const ok = await verifyPassword(password, user ? user.password_hash : undefined);
    if (!user || !ok) {
      await sql`INSERT INTO login_attempts (email) VALUES (${email})`;
      throw new HttpError(401, 'Неверный email или пароль');
    }

    await sql`DELETE FROM login_attempts WHERE email = ${email} OR created_at < now() - interval '1 day'`;
    await createSession(req, res, user.id);
    sendJson(res, 200, { user: { email: user.email } });
  },
});
