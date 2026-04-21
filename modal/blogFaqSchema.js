import mongoose from "mongoose";

/** One FAQ row on a blog (stored as subdocuments on Blog). */
export const blogFaqItemSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
      trim: true,
    },
    answer: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false },
);

function mapFaqRows(arr) {
  return arr
    .map((item) => ({
      question: String(item?.question ?? item?.Question ?? "").trim(),
      answer: String(item?.answer ?? item?.Answer ?? "").trim(),
    }))
    .filter((row) => row.question.length > 0 && row.answer.length > 0);
}

/**
 * Normalize `faqs` from Postman / multipart / JSON.
 * - JSON string → array of `{ question, answer }`
 * - Array of objects (already parsed) → normalized rows
 * - Array of strings (duplicate multipart fields) → joined then JSON.parse
 * - Single object with question/answer → one row
 * - Accepts `Question` / `Answer` casing.
 * @throws {Error} code `INVALID_FAQ_JSON` | `INVALID_FAQ_SHAPE`
 */
export function normalizeBlogFaqsInput(raw) {
  if (raw == null || raw === "") return [];

  let data = raw;
  if (typeof Buffer !== "undefined" && Buffer.isBuffer(data)) {
    data = data.toString("utf8");
  }

  if (Array.isArray(data)) {
    if (data.length > 0 && data.every((x) => typeof x === "string")) {
      data = data.join("").trim();
    } else {
      return mapFaqRows(data);
    }
  }

  if (typeof data === "string") {
    const s = data.trim();
    if (!s) return [];
    try {
      data = JSON.parse(s);
    } catch {
      const err = new Error("Invalid FAQ JSON");
      err.code = "INVALID_FAQ_JSON";
      throw err;
    }
  }

  if (!Array.isArray(data)) {
    if (data && typeof data === "object" && ("question" in data || "answer" in data || "Question" in data || "Answer" in data)) {
      data = [data];
    } else {
      const err = new Error("faqs must be a JSON array of objects with question and answer");
      err.code = "INVALID_FAQ_SHAPE";
      throw err;
    }
  }

  return mapFaqRows(data);
}
