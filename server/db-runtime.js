import { initializeDatabase as initializeBase, query as execute } from "./.runtime-db.mjs";

const transientCodes = new Set([
  "PROTOCOL_CONNECTION_LOST",
  "PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR",
  "ECONNRESET",
  "ECONNREFUSED",
  "ETIMEDOUT",
  "EPIPE",
]);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function query(sql, params = []) {
  let lastError;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await execute(sql, params);
    } catch (error) {
      lastError = error;
      if (!transientCodes.has(error?.code) || attempt === 2) throw error;
      await sleep(250 * (attempt + 1));
    }
  }
  throw lastError;
}

export async function initializeDatabase() {
  return initializeBase();
}
