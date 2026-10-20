// GET    /api/auth/me — текущий пользователь
// DELETE /api/auth/me — удаление аккаунта со всеми данными (нужен пароль)
import { route, readJson, db, requireUser, verifyPassword, destroySession, sendJson, HttpError } from '../_lib/core.js';

export default route({
  async GET(req, res) {
    const user = await requireUser(req);
    sendJson(res, 200, { user: { email: user.email, createdAt: user.created_at } });
  },

  async DELETE(req, res) {
    const user = await requireUser(req);
    const { password } = await readJson(req);
    const [row] = await db()`SELECT password_hash FROM users WHERE id = ${user.id}`;
    if (!(await verifyPassword(String(password || ''), row.password_hash))) {
      throw new HttpError(403, 'Неверный пароль');
    }
    await destroySession(req, res);
    // Сессии и данные удалятся каскадно
    await db()`DELETE FROM users WHERE id = ${user.id}`;
    sendJson(res, 200, { ok: true });
  },
});
