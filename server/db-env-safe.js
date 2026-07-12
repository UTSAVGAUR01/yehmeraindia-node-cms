export function applyDatabaseDefaults() {
  const clean = (value) => String(value ?? "").trim();
  process.env.DB_HOST = clean(process.env.DB_HOST || process.env.MYSQL_HOST || "127.0.0.1");
  process.env.DB_PORT = clean(process.env.DB_PORT || process.env.MYSQL_PORT || "3306");
  process.env.DB_USER = clean(process.env.DB_USER || process.env.MYSQL_USER || "");
  process.env.DB_PASSWORD = String(process.env.DB_PASSWORD ?? process.env.MYSQL_PASSWORD ?? "");
  process.env.DB_NAME = clean(process.env.DB_NAME || process.env.MYSQL_DATABASE || "");
  process.env.DB_CONNECTION_LIMIT = clean(process.env.DB_CONNECTION_LIMIT || "5");
}
