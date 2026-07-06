const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const Module = require("node:module");

let userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "openwhispr-snippets-db-"));
const originalLoad = Module._load;

Module._load = function patchedLoad(request, parent, isMain) {
  if (request === "electron") {
    return {
      app: {
        getPath: () => userDataDir,
        getAppPath: () => process.cwd(),
        isReady: () => false,
      },
    };
  }
  return originalLoad.call(this, request, parent, isMain);
};

process.env.NODE_ENV = "test";

const DatabaseManager = require("../../src/helpers/database.js");

function createDb(t) {
  userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "openwhispr-snippets-db-"));
  try {
    const BetterSqlite = require("better-sqlite3");
    const probe = new BetterSqlite(path.join(userDataDir, "probe.db"));
    probe.close();
    fs.rmSync(path.join(userDataDir, "probe.db"), { force: true });
  } catch (error) {
    if (String(error?.message || error).includes("NODE_MODULE_VERSION")) {
      t.skip("better-sqlite3 native binding is not compiled for this Node runtime");
      return null;
    }
    throw error;
  }

  try {
    return new DatabaseManager();
  } catch (error) {
    if (String(error?.message || error).includes("NODE_MODULE_VERSION")) {
      t.skip("better-sqlite3 native binding is not compiled for this Node runtime");
      return null;
    }
    throw error;
  }
}

test("snippets diff trims, dedupes, and updates local rows", (t) => {
  const db = createDb(t);
  if (!db) return;
  db.setSnippets([
    { trigger: "  signoff  ", replacement: "  Regards  " },
    { trigger: "SIGNOFF", replacement: "Ignored duplicate" },
  ]);

  assert.deepEqual(db.getSnippets(), [{ trigger: "signoff", replacement: "Regards" }]);

  db.setSnippets([{ trigger: "signoff", replacement: "Regards" }]);
  assert.deepEqual(db.getSnippets(), [{ trigger: "signoff", replacement: "Regards" }]);

  db.setSnippets([{ trigger: "signoff", replacement: "Best regards" }]);
  assert.deepEqual(db.getSnippets(), [{ trigger: "signoff", replacement: "Best regards" }]);
});

test("snippet removals delete local rows", (t) => {
  const db = createDb(t);
  if (!db) return;

  db.setSnippets([{ trigger: "temp", replacement: "Temporary" }]);
  db.setSnippets([]);
  assert.equal(db.db.prepare("SELECT COUNT(*) AS count FROM snippets").get().count, 0);
});

test("setSnippets drops triggers longer than the sync limit", (t) => {
  const db = createDb(t);
  if (!db) return;

  db.setSnippets([
    { trigger: "x".repeat(101), replacement: "too long" },
    { trigger: "ok", replacement: "fine" },
  ]);

  assert.deepEqual(db.getSnippets(), [{ trigger: "ok", replacement: "fine" }]);
});
