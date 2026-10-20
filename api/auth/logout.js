// POST /api/auth/logout — выход: сессия удаляется из базы, cookie стирается
import { route, destroySession, sendJson } from '../_lib/core.js';

export default route({
  async POST(req, res) {
    await destroySession(req, res);
    sendJson(res, 200, { ok: true });
  },
});
