import { createRequire } from "module";
import { pathToFileURL } from "url";

const require = createRequire(import.meta.url);
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: "commonjs" });

// Minimal inline: mirror faq parse + score imports are TS — use dynamic import via tsx
const { spawnSync } = await import("child_process");
const r = spawnSync(
  "npx",
  ["tsx", "-e", `
import { retrieveForQuery } from "./lib/chatbot/rag.ts";
const q = process.argv[1] || "환불은 언제 되나요?";
const ctx = retrieveForQuery(q, "ko");
console.log("query:", q);
console.log("top FAQ:", ctx.faqHits.slice(0, 3).map(h => ({ q: h.row.question.slice(0,40), score: h.score })));
`],
  { cwd: new URL("..", import.meta.url).pathname.replace(/^\\//, ""), encoding: "utf8", shell: true },
);
console.log(r.stdout || r.stderr);
