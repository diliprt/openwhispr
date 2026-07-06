const fs = require("fs");
const path = require("path");

const testDir = __dirname;

for (const file of fs.readdirSync(testDir).sort()) {
  if (file.endsWith(".test.js")) {
    require(path.join(testDir, file));
  }
}
