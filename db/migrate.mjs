// Применяет db/schema.sql к базе Neon.
// Запуск: npm run db:migrate (строка подключения берётся из DATABASE_URL или файла .env.local)
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { neon } from '@neondatabase/serverless';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function loadEnvFile(file) {
  const path = join(root, file);
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?(.*?)"?\s*$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2];
  }
}

loadEnvFile('.env.local');

if (!process.env.DATABASE_URL) {
  console.error('Не задана переменная DATABASE_URL (ни в окружении, ни в .env.local)');
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);
const statements = readFileSync(join(root, 'db', 'schema.sql'), 'utf8')
  .split('\n')
  .filter((line) => !line.trim().startsWith('--'))
  .join('\n')
  .split(';')
  .map((s) => s.trim())
  .filter(Boolean);

for (const statement of statements) {
  await sql.query(statement);
  console.log('✓', statement.split('\n')[0]);
}
console.log(`Готово: применено ${statements.length} команд.`);
