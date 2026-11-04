"use strict";
const fs = require("node:fs");
const path = require("node:path");
const { randomBytes } = require("node:crypto");
const destination = path.resolve(__dirname, "..", ".env");
const content = `POSTGRES_DB=reuseplus\nPOSTGRES_USER=reuseplus\nDB_PASSWORD=${randomBytes(24).toString("base64url")}\nJWT_SECRET=${randomBytes(64).toString("base64url")}\nAPP_PORT=8080\nCORS_ALLOWED_ORIGINS=http://localhost:8080\n`;
try {
  fs.writeFileSync(destination, content, { flag: "wx", mode: 0o600 });
  console.log(".env criado com valores exclusivos. Preserve-o fora do Git e use docker compose up --build -d.");
} catch (error) {
  if (error.code === "EEXIST") console.log(".env existente preservado. Nenhuma credencial foi alterada.");
  else { console.error("Nao foi possivel preparar .env:", error.code); process.exitCode = 1; }
}
