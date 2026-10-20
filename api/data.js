// GET /api/data — данные трекера текущего пользователя
// PUT /api/data — сохранение { data, version }.
//   version — номер версии, с которой клиент начинал правки. Если в базе уже
//   более новая версия (правки с другого устройства), вернётся 409 и актуальные данные.
import { route, readJson, db, requireUser, sendJson, HttpError } from './_lib/core.js';

const MAX_SIZE = 2 * 1024 * 1024; // 2 МБ JSON — с большим запасом для личного учёта

function validateData(data) {
  const ok = data && typeof data === 'object'
    && Array.isArray(data.transactions)
    && Array.isArray(data.categories)
    && data.settings && typeof data.settings === 'object';
  if (!ok) throw new HttpError(400, 'Неверный формат данных');
  const json = JSON.stringify(data);
  if (json.length > MAX_SIZE) throw new HttpError(413, 'Слишком много данных для сохранения');
  return json;
}

export default route({
  async GET(req, res) {
    const user = await requireUser(req);
    const [row] = await db()`SELECT data, version, updated_at FROM user_data WHERE user_id = ${user.id}`;
    sendJson(res, 200, row
      ? { data: row.data, version: row.version, updatedAt: row.updated_at }
      : { data: null, version: 0, updatedAt: null });
  },

  async PUT(req, res) {
    const user = await requireUser(req);
    const body = await readJson(req);
    const json = validateData(body.data);
    const version = Number(body.version);
    if (!Number.isInteger(version) || version < 0) throw new HttpError(400, 'Неверная версия данных');
    const sql = db();

    const rows = version === 0
      ? await sql`
          INSERT INTO user_data (user_id, data, version) VALUES (${user.id}, ${json}::jsonb, 1)
          ON CONFLICT (user_id) DO NOTHING
          RETURNING version, updated_at`
      : await sql`
          UPDATE user_data SET data = ${json}::jsonb, version = version + 1, updated_at = now()
          WHERE user_id = ${user.id} AND version = ${version}
          RETURNING version, updated_at`;

    if (!rows.length) {
      const [current] = await sql`SELECT data, version, updated_at FROM user_data WHERE user_id = ${user.id}`;
      return sendJson(res, 409, {
        error: 'Данные изменились на другом устройстве',
        data: current ? current.data : null,
        version: current ? current.version : 0,
      });
    }
    sendJson(res, 200, { version: rows[0].version, updatedAt: rows[0].updated_at });
  },
});
