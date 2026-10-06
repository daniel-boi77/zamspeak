import http from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("./public/", import.meta.url));
const port = Number(process.env.PORT || 8787);

const model = String(process.env.AI_MODEL || "gemini-2.0-flash").trim();

const provider = String(
  process.env.AI_PROVIDER || (process.env.GEMINI_API_KEY ? "gemini" : "openai"),
)
  .toLowerCase()
  .trim();

const key = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;

const base = String(
  process.env.OPENAI_API_BASE || "https://api.openai.com/v1",
).replace(/\/+$/, "");

const names = {
  English: "English",
  Bemba: "Bemba (Chibemba)",
  Nyanja: "Nyanja (Chichewa)",
  Tonga: "Tonga (Chitonga)",
  Lozi: "Lozi (Silozi)",
};

const system = `
You are ZamSpeak™, a careful language assistant for Zambia.

Help tourists and people who are not confident in English communicate respectfully
with local communities.

Support:
- English
- Bemba (Chibemba)
- Nyanja (Chichewa)
- Tonga (Chitonga)
- Lozi (Silozi)

Preserve meaning, names, numbers, and politeness.

Say when you are uncertain about a dialect.
Do not invent a translation.
Do not claim to be an official government, medical, legal, immigration,
emergency, or certified translation service.

Keep answers concise and practical.
`;

function json(res, status, body) {
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  });

  res.end(JSON.stringify(body));
}

function safeFile(pathname) {
  const clean = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");

  const full = normalize(join(root, clean));

  return full.startsWith(root) ? full : null;
}

async function readBody(req) {
  let body = "";

  for await (const chunk of req) {
    body += chunk;
  }

  if (body.length > 200000) {
    throw new Error("Request too large");
  }

  return JSON.parse(body || "{}");
}

async function translate(req, res) {
  if (!key) {
    return json(res, 503, {
      error:
        "AI is not configured. Add GEMINI_API_KEY to .env and restart ZamSpeak.",
    });
  }

  let input;

  try {
    input = await readBody(req);
  } catch {
    return json(res, 400, {
      error: "Invalid request.",
    });
  }

  const text = String(input.text || "").trim();

  const source = names[input.sourceLanguage] || "English";

  const target = names[input.targetLanguage] || "English";

  if (!text) {
    return json(res, 400, {
      error: "Please enter text to translate.",
    });
  }

  const prompt = `
${system}

Translate from ${source} to ${target}.

Return JSON only with exactly two string fields:

{
  "translation": "...",
  "explanation": "..."
}

The explanation should briefly describe context or formality.
Mention uncertainty if appropriate.

Text:
${text}
`;

  try {
    /*
     * =========================
     * GEMINI
     * =========================
     */

    if (provider === "gemini") {
      console.log("ZamSpeak Gemini request");
      console.log("Model:", model);

      const url =
        `https://generativelanguage.googleapis.com/v1beta/models/` +
        `${encodeURIComponent(model)}:generateContent` +
        `?key=${encodeURIComponent(key)}`;

      console.log("Gemini endpoint:", url.replace(key, "***"));

      const response = await fetch(url, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],

          generationConfig: {
            temperature: 0.25,
            responseMimeType: "application/json",
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Gemini API error:", JSON.stringify(data, null, 2));

        return json(res, response.status, {
          error: data?.error?.message || "Google Gemini returned an error.",
        });
      }

      const raw =
        data?.candidates?.[0]?.content?.parts
          ?.map((part) => part.text || "")
          .join("") || "";

      if (!raw) {
        return json(res, 502, {
          error: "Gemini returned an empty response.",
        });
      }

      let parsed;

      try {
        parsed = JSON.parse(
          raw
            .replace(/^```json\s*/i, "")
            .replace(/\s*```$/i, "")
            .trim(),
        );
      } catch {
        console.error("Gemini returned invalid JSON:", raw);

        return json(res, 502, {
          error: "Gemini returned invalid JSON.",
        });
      }

      return json(res, 200, {
        translation: String(parsed.translation || ""),
        explanation: String(
          parsed.explanation ||
            "AI-generated result; verify important wording with a fluent speaker.",
        ),
      });
    }

    /*
     * =========================
     * OPENAI-COMPATIBLE PROVIDER
     * =========================
     */

    if (provider === "openai") {
      const response = await fetch(`${base}/chat/completions`, {
        method: "POST",

        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          model,

          messages: [
            {
              role: "system",
              content: system,
            },
            {
              role: "user",
              content: prompt,
            },
          ],

          temperature: 0.25,

          response_format: {
            type: "json_object",
          },

          max_tokens: 500,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return json(res, response.status, {
          error: data?.error?.message || "AI provider returned an error.",
        });
      }

      const content = data?.choices?.[0]?.message?.content || "{}";

      let parsed;

      try {
        parsed = JSON.parse(content);
      } catch {
        return json(res, 502, {
          error: "AI provider returned invalid JSON.",
        });
      }

      return json(res, 200, {
        translation: String(parsed.translation || ""),
        explanation: String(
          parsed.explanation ||
            "AI-generated result; verify important wording with a fluent speaker.",
        ),
      });
    }

    return json(res, 500, {
      error: `Unsupported AI provider: ${provider}`,
    });
  } catch (error) {
    console.error("AI request failed:", error);

    return json(res, 502, {
      error: `AI connection or response failed: ${error.message}`,
    });
  }
}

/*
 * =========================
 * HTTP SERVER
 * =========================
 */

const server = http.createServer(async (req, res) => {
  if (
    req.method === "POST" &&
    (req.url === "/api/translate" || req.url === "/api/chat")
  ) {
    return translate(req, res);
  }

  if (req.method !== "GET" && req.method !== "HEAD") {
    return json(res, 405, {
      error: "Method not allowed.",
    });
  }

  const pathname = req.url.split("?")[0];

  const file = safeFile(pathname);

  if (!file) {
    return json(res, 403, {
      error: "Forbidden.",
    });
  }

  try {
    const data = await readFile(file);

    const type =
      {
        ".html": "text/html",
        ".js": "text/javascript",
        ".css": "text/css",
        ".json": "application/json",
        ".svg": "image/svg+xml",
      }[extname(file)] || "application/octet-stream";

    res.writeHead(200, {
      "content-type": `${type}; charset=utf-8`,
    });

    if (req.method === "HEAD") {
      return res.end();
    }

    res.end(data);
  } catch {
    return json(res, 404, {
      error: "Not found.",
    });
  }
});

server.listen(port, "0.0.0.0", () => {
  console.log("");
  console.log("=================================");
  console.log("       ZamSpeak™ Server");
  console.log("=================================");
  console.log(`URL: http://localhost:${port}`);
  console.log(`Provider: ${provider}`);
  console.log(`Model: ${model}`);
  console.log("=================================");
  console.log("");
});
