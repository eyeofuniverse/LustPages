import Database from "better-sqlite3";
import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = join(__dirname, "../prisma/dev.db");

const db = new Database(dbPath, { readonly: true });

const data = {
  users: db.prepare("SELECT * FROM User").all(),
  categories: db.prepare("SELECT * FROM Category").all(),
  authors: db.prepare("SELECT * FROM Author").all(),
  stories: db.prepare("SELECT * FROM Story").all(),
  likes: db.prepare("SELECT * FROM Like").all(),
  bookmarks: db.prepare("SELECT * FROM Bookmark").all(),
  comments: db.prepare("SELECT * FROM Comment").all(),
};

db.close();

const outPath = join(__dirname, "exported-data.json");
writeFileSync(outPath, JSON.stringify(data, null, 2));

console.log("Export complete:");
for (const [table, rows] of Object.entries(data)) {
  console.log(`  ${table}: ${rows.length} rows`);
}
console.log(`Saved to: ${outPath}`);
