// POST /api/auth/register — регистрация по email и паролю
import { route, readJson, db, normalizeEmail, validatePassword, hashPassword, createSession, sendJson, HttpError } from '../_lib/core.js';

export default route({
  async POST(req, res) {
    const body = await readJson(req);
    const email = normalizeEmail(body.email);
    const password = validatePassword(body.password);
    const passwordHash = await hashPassword(password);

    const rows = await db()`
      INSERT INTO users (email, password_hash) VALUES (${email}, ${passwordHash})
      ON CONFLICT (email) DO NOTHING
      RETURNING id, email`;
    if (!rows.length) throw new HttpError(409, 'Аккаунт с таким email уже существует — войдите');

    await createSession(req, res, rows[0].id);
    sendJson(res, 201, { user: { email: rows[0].email } });
  },
});
