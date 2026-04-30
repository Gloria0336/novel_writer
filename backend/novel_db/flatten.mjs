import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const WORKSPACE_ROOT = path.resolve(SCRIPT_DIR, "..", "..");
const CONFIG_PATH = path.join(SCRIPT_DIR, "flatten.config.json");
const CURSOR_RULES_FILENAME = ".cursorrules";

function toPosixPath(input) {
  return input.split(path.sep).join("/");
}

function projectPath(absolutePath) {
  return toPosixPath(path.relative(WORKSPACE_ROOT, absolutePath));
}

function isWithin(parent, child) {
  const relativePath = path.relative(parent, child);
  return relativePath === "" || (!relativePath.startsWith("..") && !path.isAbsolute(relativePath));
}

function escapeFence(content) {
  return content.replaceAll("```", "``\\`");
}

function extensionFor(filePath) {
  return path.extname(filePath).toLowerCase();
}

function fenceLanguage(filePath) {
  const extension = extensionFor(filePath);
  if (extension === ".yaml" || extension === ".yml") return "yaml";
  if (extension === ".json") return "json";
  if (extension === ".md") return "markdown";
  if (extension === ".txt") return "text";
  if (path.basename(filePath) === CURSOR_RULES_FILENAME) return "text";
  return "";
}

function slugFor(value) {
  const slug = value
    .toLowerCase()
    .replaceAll("\\", "/")
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "file";
}

function normalizeConfig(rawConfig) {
  if (rawConfig.version !== 1) {
    throw new Error("flatten.config.json version must be 1.");
  }

  const requiredArrays = ["targets", "includeExtensions", "sectionOrder"];
  for (const key of requiredArrays) {
    if (!Array.isArray(rawConfig[key])) {
      throw new Error(`flatten.config.json ${key} must be an array.`);
    }
  }

  if (!rawConfig.sourceRoot || !rawConfig.outputDir || !rawConfig.outputSuffix) {
    throw new Error("flatten.config.json must define sourceRoot, outputDir, and outputSuffix.");
  }

  return {
    ...rawConfig,
    includeExtensions: rawConfig.includeExtensions.map((item) => item.toLowerCase()),
    exclude: {
      dirs: rawConfig.exclude?.dirs ?? [],
      filenames: rawConfig.exclude?.filenames ?? [],
      novelDirs: rawConfig.exclude?.novelDirs ?? [],
    },
    secretHandling: rawConfig.secretHandling ?? {
      includeSecretsLockbox: true,
      notice: "",
    },
  };
}

async function loadConfig() {
  const raw = await readFile(CONFIG_PATH, "utf8");
  return normalizeConfig(JSON.parse(raw));
}

function sectionRank(relativePath, sectionOrder) {
  const firstSegment = relativePath.split("/")[0];
  const firstIndex = sectionOrder.indexOf(firstSegment);
  if (firstIndex !== -1) return firstIndex;

  const fullIndex = sectionOrder.indexOf(relativePath);
  if (fullIndex !== -1) return fullIndex;

  return sectionOrder.length;
}

function compareFiles(left, right, sectionOrder) {
  const leftRank = sectionRank(left.relativePath, sectionOrder);
  const rightRank = sectionRank(right.relativePath, sectionOrder);
  if (leftRank !== rightRank) return leftRank - rightRank;
  return left.relativePath.localeCompare(right.relativePath, "en");
}

function shouldIncludeFile(relativePath, config) {
  const basename = path.posix.basename(relativePath);
  if (config.exclude.filenames.includes(basename)) return false;
  if (basename === CURSOR_RULES_FILENAME) return true;
  return config.includeExtensions.includes(extensionFor(relativePath));
}

async function collectFiles(targetRoot, config) {
  const files = [];
  const excludedDirs = new Set(config.exclude.dirs);

  async function walk(directoryPath) {
    const entries = (await readdir(directoryPath, { withFileTypes: true })).sort((left, right) => left.name.localeCompare(right.name, "en"));

    for (const entry of entries) {
      const absolutePath = path.join(directoryPath, entry.name);
      const relativePath = toPosixPath(path.relative(targetRoot, absolutePath));

      if (entry.isDirectory()) {
        if (excludedDirs.has(entry.name)) continue;
        await walk(absolutePath);
        continue;
      }

      if (!entry.isFile() || !shouldIncludeFile(relativePath, config)) {
        continue;
      }

      files.push({
        absolutePath,
        relativePath,
      });
    }
  }

  await walk(targetRoot);
  return files.sort((left, right) => compareFiles(left, right, config.sectionOrder));
}

function buildHeader({ target, targetProjectPath, config, files }) {
  const excludedDirs = config.exclude.dirs.length ? config.exclude.dirs.join(", ") : "(none)";
  const excludedFilenames = config.exclude.filenames.length ? config.exclude.filenames.join(", ") : "(none)";
  const extensions = config.includeExtensions.join(", ");
  const lines = [
    `# ${target} Flattened Novel Context`,
    "",
    "This file is generated from a novel directory so AI tools can read the project as one Markdown document without relying on folder traversal.",
    "",
    "## Scope",
    `- Source: \`${targetProjectPath}\``,
    `- Files included: ${files.length}`,
    `- Included extensions: ${extensions}, plus ${CURSOR_RULES_FILENAME}`,
    `- Excluded directories: ${excludedDirs}`,
    `- Excluded filenames: ${excludedFilenames}`,
    "",
  ];

  if (config.secretHandling.includeSecretsLockbox && config.secretHandling.notice) {
    lines.push("## Secret Handling", config.secretHandling.notice, "");
  }

  lines.push("## Table of Contents");
  for (const file of files) {
    lines.push(`- [${file.relativePath}](#${slugFor(file.relativePath)})`);
  }
  lines.push("");
  lines.push("---");
  lines.push("");

  return lines.join("\n");
}

async function renderFile(targetRoot, file, config) {
  const projectFilePath = projectPath(file.absolutePath);
  const language = fenceLanguage(file.relativePath);
  const rawContent = await readFile(file.absolutePath, "utf8");
  const lines = [
    `## ${file.relativePath}`,
    "",
    `<!-- file_path: ${projectFilePath} -->`,
    "",
  ];

  if (config.secretHandling.includeSecretsLockbox && file.relativePath.toLowerCase() === "context/secrets-lockbox.md") {
    lines.push("> Secret handling: this section contains author/director-only unrevealed planning. Treat it as independent hidden knowledge, not public canon or character-known information.", "");
  }

  lines.push(`\`\`\`${language}`, escapeFence(rawContent).replace(/\s+$/u, ""), "```", "");
  return lines.join("\n");
}

async function renderTarget(target, config, sourceRoot, outputDir) {
  if (config.exclude.novelDirs.includes(target)) {
    return null;
  }

  const targetRoot = path.resolve(sourceRoot, target);
  if (!isWithin(sourceRoot, targetRoot)) {
    throw new Error(`Target must stay within sourceRoot: ${target}`);
  }

  const files = await collectFiles(targetRoot, config);
  const targetProjectPath = projectPath(targetRoot);
  const header = buildHeader({ target, targetProjectPath, config, files });
  const bodyParts = [];

  for (const file of files) {
    bodyParts.push(await renderFile(targetRoot, file, config));
  }

  const outputPath = path.join(outputDir, `${target}${config.outputSuffix}`);
  const content = `${header}${bodyParts.join("\n---\n\n")}`.replace(/\s+$/u, "") + "\n";
  await writeFile(outputPath, content, "utf8");
  return {
    target,
    outputPath,
    fileCount: files.length,
  };
}

async function main() {
  const config = await loadConfig();
  const sourceRoot = path.resolve(WORKSPACE_ROOT, config.sourceRoot);
  const outputDir = path.resolve(WORKSPACE_ROOT, config.outputDir);

  if (!isWithin(WORKSPACE_ROOT, sourceRoot)) {
    throw new Error("sourceRoot must stay within the workspace.");
  }
  if (!isWithin(WORKSPACE_ROOT, outputDir)) {
    throw new Error("outputDir must stay within the workspace.");
  }

  await mkdir(outputDir, { recursive: true });

  const results = [];
  for (const target of config.targets) {
    const result = await renderTarget(target, config, sourceRoot, outputDir);
    if (result) results.push(result);
  }

  for (const result of results) {
    console.log(`Wrote ${projectPath(result.outputPath)} (${result.fileCount} files).`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
