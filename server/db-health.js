export function registerDatabaseHealth(app, query) {
  app.get("/api/health/database", async (_req, res) => {
    try {
      const rows = await query("SELECT DATABASE() AS database_name, NOW() AS server_time");
      res.json({
        connected: true,
        database: rows[0]?.database_name || null,
        host: process.env.DB_HOST || null,
        port: Number(process.env.DB_PORT || 3306),
        serverTime: rows[0]?.server_time || null,
      });
    } catch (error) {
      const connectivityCodes = new Set([
        "ECONNREFUSED",
        "ETIMEDOUT",
        "ENOTFOUND",
        "PROTOCOL_CONNECTION_LOST",
        "ECONNRESET",
      ]);
      const isConnectionError = connectivityCodes.has(error?.code);
      res.status(isConnectionError ? 503 : 500).json({
        connected: false,
        type: isConnectionError ? "connection" : "database",
        code: String(error?.code || "UNKNOWN").slice(0, 80),
        host: process.env.DB_HOST || null,
        port: Number(process.env.DB_PORT || 3306),
        database: process.env.DB_NAME || null,
      });
    }
  });
}
