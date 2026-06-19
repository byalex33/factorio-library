#!/usr/bin/env node
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";

const projectRoot = process.cwd();
const defaultDataPath = path.join(projectRoot, "public", "data", "data.json");
const defaultOutputRoot = path.join(projectRoot, "public", "data");
const modPathAliases = new Map([
  ["base", "base"],
  ["core", "core"],
  ["space-age", "space-age"],
  ["quality", "quality"],
  ["elevated-rails", "elevated-rails"],
]);

function usage() {
  console.log(`Build local Factorio sprite assets for the blueprint viewer.

This script reads sprite references from public/data/data.json, copies nothing from
third-party sources, and converts PNG files from your local Factorio install to
Basis Universal .basis files under public/data/.

Usage:
  node scripts/build-local-factorio-sprites.mjs --factorio <install-path> [options]
  node scripts/build-local-factorio-sprites.mjs <install-path> [options]

Options:
  --factorio <path>       Factorio install root. Can also use FACTORIO_INSTALL_PATH.
  --basisu <path>         basisu encoder binary. Default: BASISU_BIN or "basisu".
  --data <path>           Factorio data JSON. Default: public/data/data.json.
  --out <path>            Output root. Default: public/data.
  --limit <number>        Convert only the first N missing assets, useful for testing.
  --force                 Rebuild files that already exist.
  --dry-run               Print what would be converted without writing files.
  --help                  Show this message.

Examples:
  npm run sprites:local -- "C:\\Program Files (x86)\\Steam\\steamapps\\common\\Factorio"
  node scripts/build-local-factorio-sprites.mjs --factorio "C:\\Program Files (x86)\\Steam\\steamapps\\common\\Factorio"
  FACTORIO_INSTALL_PATH=/Applications/factorio.app/Contents/data node scripts/build-local-factorio-sprites.mjs
`);
}

function parseArgs(argv) {
  const args = {
    factorio: process.env.FACTORIO_INSTALL_PATH,
    basisu: process.env.BASISU_BIN || "basisu",
    data: defaultDataPath,
    out: defaultOutputRoot,
    limit: undefined,
    force: false,
    dryRun: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      usage();
      process.exit(0);
    }
    if (arg === "--force") {
      args.force = true;
      continue;
    }
    if (arg === "--dry-run") {
      args.dryRun = true;
      continue;
    }

    if (!arg.startsWith("--")) {
      if (!args.factorio) {
        args.factorio = arg;
        continue;
      }
      throw new Error(`Unknown positional argument ${arg}`);
    }

    const next = argv[i + 1];
    if (!next || next.startsWith("--")) throw new Error(`Missing value for ${arg}`);
    i += 1;

    if (arg === "--factorio") args.factorio = next;
    else if (arg === "--basisu") args.basisu = next;
    else if (arg === "--data") args.data = next;
    else if (arg === "--out") args.out = next;
    else if (arg === "--limit") args.limit = Number.parseInt(next, 10);
    else throw new Error(`Unknown option ${arg}`);
  }

  if (!args.factorio) throw new Error("Missing --factorio <install-path> or FACTORIO_INSTALL_PATH.");
  if (args.limit !== undefined && (!Number.isFinite(args.limit) || args.limit < 1)) {
    throw new Error("--limit must be a positive number.");
  }

  args.factorio = path.resolve(args.factorio);
  args.data = path.resolve(args.data);
  args.out = path.resolve(args.out);
  return args;
}

function collectSpritePaths(value, paths = new Set()) {
  if (typeof value === "string") {
    for (const match of value.matchAll(/__([a-z0-9_-]+)__\/[^\s"')]+?\.png/gi)) {
      paths.add(match[0]);
    }
    return paths;
  }

  if (Array.isArray(value)) {
    for (const item of value) collectSpritePaths(item, paths);
    return paths;
  }

  if (value && typeof value === "object") {
    for (const item of Object.values(value)) collectSpritePaths(item, paths);
  }

  return paths;
}

function resolveFactorioDataRoot(factorioPath) {
  // Accept either the install root (.../Factorio) or the data folder itself.
  if (existsSync(path.join(factorioPath, "base")) || existsSync(path.join(factorioPath, "core"))) {
    return factorioPath;
  }
  return path.join(factorioPath, "data");
}

function safeJoin(root, ...segments) {
  const resolvedRoot = path.resolve(root);
  const resolvedPath = path.resolve(resolvedRoot, ...segments);
  const relative = path.relative(resolvedRoot, resolvedPath);

  if (relative.startsWith("..") || path.isAbsolute(relative)) return null;
  return resolvedPath;
}

function sourcePathForVirtualPath(dataRoot, virtualPath) {
  const match = virtualPath.match(/^__([a-z0-9_-]+)__\/(.+)$/i);
  if (!match) return null;

  const [, modName, relativePath] = match;
  const folderName = modPathAliases.get(modName) || modName;
  return safeJoin(dataRoot, folderName, relativePath);
}

function outputPathForVirtualPath(outRoot, virtualPath) {
  return safeJoin(outRoot, virtualPath.replace(/\.png$/i, ".basis"));
}

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stderr = "";
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} exited with ${code}${stderr ? `\n${stderr}` : ""}`));
    });
  });
}

async function convertWithBasisu(basisu, source, output) {
  await mkdir(path.dirname(output), { recursive: true });
  await run(basisu, ["-output_file", output, source]);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const dataRoot = resolveFactorioDataRoot(args.factorio);
  const dataJson = JSON.parse(await readFile(args.data, "utf8"));
  const spritePaths = [...collectSpritePaths(dataJson)].sort();

  const missingSources = [];
  const pending = [];
  let alreadyBuilt = 0;

  for (const virtualPath of spritePaths) {
    const source = sourcePathForVirtualPath(dataRoot, virtualPath);
    const output = outputPathForVirtualPath(args.out, virtualPath);

    if (!source || !output || !existsSync(source)) {
      missingSources.push({ virtualPath, source });
      continue;
    }

    if (!args.force && existsSync(output)) {
      alreadyBuilt += 1;
      continue;
    }

    pending.push({ virtualPath, source, output });
  }

  const conversions = args.limit ? pending.slice(0, args.limit) : pending;

  console.log(`Found ${spritePaths.length.toLocaleString()} referenced PNG sprite(s).`);
  console.log(`${alreadyBuilt.toLocaleString()} .basis file(s) already exist.`);
  console.log(`${pending.length.toLocaleString()} .basis file(s) need conversion.`);
  if (args.limit) console.log(`Limit enabled: converting ${conversions.length.toLocaleString()} file(s).`);
  if (missingSources.length) {
    console.warn(`${missingSources.length.toLocaleString()} referenced source PNG(s) were not found in the local install.`);
    console.warn("First few missing sources:");
    for (const item of missingSources.slice(0, 10)) console.warn(`  ${item.virtualPath} -> ${item.source}`);
  }

  if (args.dryRun) {
    for (const item of conversions.slice(0, 25)) console.log(`${item.source} -> ${item.output}`);
    if (conversions.length > 25) console.log(`...and ${(conversions.length - 25).toLocaleString()} more`);
    return;
  }

  for (let i = 0; i < conversions.length; i += 1) {
    const item = conversions[i];
    process.stdout.write(`[${i + 1}/${conversions.length}] ${item.virtualPath}\n`);
    await convertWithBasisu(args.basisu, item.source, item.output);
  }

  const manifest = {
    generatedAt: new Date().toISOString(),
    source: args.factorio,
    referencedSprites: spritePaths.length,
    existingBeforeRun: alreadyBuilt,
    convertedThisRun: conversions.length,
    missingSources: missingSources.length,
  };

  await writeFile(path.join(args.out, "factorio-sprites-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  console.log("Done. Wrote public/data/factorio-sprites-manifest.json.");
}

main().catch((error) => {
  console.error(error.message);
  console.error("\nRun with --help for usage.");
  process.exit(1);
});
