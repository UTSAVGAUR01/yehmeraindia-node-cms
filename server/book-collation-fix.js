import express from "express";

const previousPut = express.application.put;

function normalizeKeywords(value) {
  const source = Array.isArray(value) ? value : String(value || "").split(/[,\n]+/);
  return [...new Set(source.map((item) => String(item).trim().replace(/^#+/, "")).filter(Boolean))]
    .slice(0, 30)
    .map((item) => item.slice(0, 60))
    .join(", ");
}

function normalizeExternalUrl(value, label) {
  const text = String(value || "").trim();
  if (!text) throw Object.assign(new Error(`${label} is required.`), { statusCode: 400 });
  if (text.length > 2000)
    throw Object.assign(new Error(`${label} is too long.`), { statusCode: 400 });
  try {
    const url = new URL(text);
    if (!["http:", "https:"].includes(url.protocol)) throw new Error();
    return url.toString();
  } catch {
    throw Object.assign(new Error(`${label} must be a complete http or https link.`), {
      statusCode: 400,
    });
  }
}

function mapBook(row) {
  return {
    id: String(row.id),
    title: row.title,
    description: row.description || "",
    purchaseUrl: row.purchase_url || "",
    coverImage: row.cover_image || "",
    imagePrompt: row.image_prompt || "",
    keywords: String(row.keywords || "").split(/[,\n]+/).map((item) => item.trim()).filter(Boolean),
    status: row.status,
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    authorId: row.author_id ? String(row.author_id) : null,
    authorName: row.author_name || "",
  };
}

function sendBookError(error, res, next) {
  if (error?.statusCode)
    return res.status(error.statusCode).json({ message: error.message });

  const code = String(error?.code || "");
  const messages = {
    ER_CANT_AGGREGATE_2COLLATIONS: "The database text collations do not match. The update was not applied.",
    ER_NET_PACKET_TOO_LARGE: "The cover image is too large for the database. Upload a smaller WebP or JPEG image.",
    ER_DATA_TOO_LONG: "One of the book fields is too large for its database column.",
    ER_BAD_NULL_ERROR: "A required book field is missing.",
    ER_NO_REFERENCED_ROW_2: "The assigned author account no longer exists.",
  };

  if (code.startsWith("ER_")) {
    return res.status(code === "ER_NET_PACKET_TOO_LARGE" ? 413 : 422).json({
      message: messages[code] || `The book could not be saved because MariaDB returned ${code}.`,
      code: code.slice(0, 80),
    });
  }

  return next(error);
}

express.application.put = function collationSafePut(path, ...handlers) {
  if (path === "/api/admin/books/:id" && handlers.length) {
    const routeIndex = handlers.length - 1;
    handlers[routeIndex] = async function updateBookWithoutSqlTextComparison(req, res, next) {
      try {
        const { query } = await import("./db.js");
        const rows = await query("SELECT * FROM books WHERE id = ? LIMIT 1", [req.params.id]);
        if (!rows.length) return res.status(404).json({ message: "Book not found." });

        const existing = rows[0];
        const canManage = req.user?.role === "admin" ||
          (req.user?.role === "author" && String(existing.author_id) === String(req.user.id));
        if (!canManage)
          return res.status(403).json({ message: "You can only update your own books." });

        const body = req.body || {};
        const title = String(body.title || "").trim();
        const description = String(body.description || "").trim();
        if (!title || !description)
          return res.status(400).json({ message: "Book title and description are required." });
        if (title.length > 220)
          return res.status(400).json({ message: "Book title must be 220 characters or fewer." });

        const purchaseUrl = normalizeExternalUrl(body.purchaseUrl, "Purchase link");
        const status = body.status === "published" ? "published" : "draft";
        const imagePrompt = String(body.imagePrompt || "");
        const keywords = normalizeKeywords(body.keywords);
        const requestedCover = Object.prototype.hasOwnProperty.call(body, "coverImage")
          ? String(body.coverImage || "")
          : String(existing.cover_image || "");
        const coverChanged = requestedCover !== String(existing.cover_image || "");

        if (coverChanged && Buffer.byteLength(requestedCover, "utf8") > 7 * 1024 * 1024) {
          return res.status(413).json({
            message: "The new cover image is too large. Upload a smaller WebP or JPEG image under 5 MB.",
          });
        }

        const publishedAt = status === "published"
          ? (existing.published_at || new Date())
          : null;

        const assignments = [
          "title = ?",
          "description = ?",
          "purchase_url = ?",
          "image_prompt = ?",
          "keywords = ?",
          "status = ?",
          "published_at = ?",
        ];
        const params = [
          title,
          description,
          purchaseUrl,
          imagePrompt,
          keywords,
          status,
          publishedAt,
        ];

        if (coverChanged) {
          assignments.push("cover_image = ?");
          params.push(requestedCover);
        }

        params.push(req.params.id);
        await query(`UPDATE books SET ${assignments.join(", ")} WHERE id = ?`, params);

        const savedRows = await query(
          `SELECT b.*, u.name AS author_name
             FROM books b
             LEFT JOIN users u ON u.id = b.author_id
            WHERE b.id = ? LIMIT 1`,
          [req.params.id],
        );
        return res.json(mapBook(savedRows[0]));
      } catch (error) {
        return sendBookError(error, res, next);
      }
    };
  }

  return previousPut.call(this, path, ...handlers);
};
