import "dotenv/config";

function clean(value) {
  return String(value ?? "").trim();
}

export function normalizeDatabaseEnvironment() {
  const databaseUrl = clean(process.env.DATABASE_URL || process.env.MYSQL_URL);
  if (databaseUrl) {
    const url = new URL(databaseUrl);
    if (!["mysql:", "mysql2:"].includes(url.protocol)) {
      throw new Error("DATABASE_URL must use mysql:// or mysql2://.");
    }
    process.env.DB_HOST = decodeURIComponent(url.hostname);
    process.env.DB_PORT = url.port || process.env.DB_PORT || "3306";
    process.env.DB_USER = decodeURIComponent(url.username);
    process.env.DB_PASSWORD = decodeURIComponent(url.password);
    process.env.DB_NAME = decodeURIComponent(url.pathname.replace(/^\//, ""));
  }

  process.env.DB_HOST = clean(process.env.DB_HOST || process.env.MYSQL_HOST || "127.0.0.1");
  process.env.DB_PORT = clean(process.env.DB_PORT || process.env.MYSQL_PORT || "3306");
  process.env.DB_USER = clean(process.env.DB_USER || process.env.MYSQL_USER);
  process.env.DB_PASSWORD = String(process.env.DB_PASSWORD ?? process.env.MYSQL_PASSWORD ?? "");
  process.env.DB_NAME = clean(process.env.DB_NAME || process.env.MYSQL_DATABASE);
  process.env.DB_CONNECTION_LIMIT = clean(process.env.DB_CONNECTION_LIMIT || "10");

  const missing = ["DB_HOST", "DB_USER", "DB_NAME"].filter((key) => !process.env[key]);
  if (missing.length) throw new Error(`Missing database environment variables: ${missing.join(", ")}.`);
  if (!/^\d+$/.test(process.env.DB_PORT)) throw new Error("DB_PORT must be numeric.");
}
