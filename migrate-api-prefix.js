const fs = require("fs");
const path = require("path");

const PROJECT_DIRECTORY = path.resolve(__dirname);

const OLD_VALUE = "/api/admin";
const NEW_VALUE = "/api/v1";

const ALLOWED_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".json",
  ".md",
  ".env",
  ".css",
]);

const IGNORED_DIRECTORIES = new Set([
  "node_modules",
  ".next",
  ".git",
  ".tmp",
  "backups",
  "dist",
  "build",
  "coverage",
]);

let scannedFiles = 0;
let changedFiles = 0;
let replacements = 0;

function countOccurrences(content, value) {
  return content.split(value).length - 1;
}

function processDirectory(directory) {
  const entries = fs.readdirSync(directory, {
    withFileTypes: true,
  });

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      if (!IGNORED_DIRECTORIES.has(entry.name)) {
        processDirectory(fullPath);
      }

      continue;
    }

    const extension = path.extname(entry.name).toLowerCase();

    if (!ALLOWED_EXTENSIONS.has(extension)) {
      continue;
    }

    scannedFiles++;

    const originalContent = fs.readFileSync(fullPath, "utf8");

    if (!originalContent.includes(OLD_VALUE)) {
      continue;
    }

    const occurrenceCount = countOccurrences(
      originalContent,
      OLD_VALUE
    );

    const updatedContent = originalContent.replaceAll(
      OLD_VALUE,
      NEW_VALUE
    );

    fs.writeFileSync(fullPath, updatedContent, "utf8");

    changedFiles++;
    replacements += occurrenceCount;

    console.log(
      `Alterado: ${path.relative(PROJECT_DIRECTORY, fullPath)} ` +
      `(${occurrenceCount} substituição(ões))`
    );
  }
}

try {
  console.log(`Procurando por: ${OLD_VALUE}`);
  console.log(`Substituindo por: ${NEW_VALUE}`);
  console.log("");

  processDirectory(PROJECT_DIRECTORY);

  console.log("");
  console.log("Migração concluída.");
  console.log(`Arquivos verificados: ${scannedFiles}`);
  console.log(`Arquivos alterados: ${changedFiles}`);
  console.log(`Substituições realizadas: ${replacements}`);
} catch (error) {
  console.error("Erro durante a migração:", error);
  process.exitCode = 1;
}