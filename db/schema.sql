-- Схема базы данных трекера (Neon / PostgreSQL).
-- Скрипт идемпотентный: его можно запускать повторно.

-- Пользователи. Пароль хранится только в виде хеша scrypt.
CREATE TABLE IF NOT EXISTS users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email         text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Сессии. В базе лежит SHA-256 от токена, сам токен — только в cookie браузера.
CREATE TABLE IF NOT EXISTS sessions (
  token_hash text PRIMARY KEY,
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions (user_id);

-- Данные трекера: один JSON-документ на пользователя.
-- version защищает от перезаписи изменений, сделанных на другом устройстве.
CREATE TABLE IF NOT EXISTS user_data (
  user_id    uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  data       jsonb NOT NULL,
  version    integer NOT NULL DEFAULT 1,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Неудачные попытки входа — защита от подбора пароля.
CREATE TABLE IF NOT EXISTS login_attempts (
  id         bigserial PRIMARY KEY,
  email      text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS login_attempts_email_idx ON login_attempts (email, created_at);
