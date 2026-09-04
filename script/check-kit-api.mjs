/**
 * Checks every component this canvas claims against a gpui-kit checkout.
 *
 * `KindSpec.api` in lib/tokens.ts goes straight into the generated prompt, so a
 * path that does not exist becomes an instruction to write code against an
 * invented API. This reads each one back out of the Rust source and fails when
 * it cannot be found. It also lists the component modules gpui-kit ships that
 * the parts palette does not cover yet.
 *
 *   node script/check-kit-api.mjs [path-to-gpui-kit]
 */
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const KIT = resolve(process.argv[2] ?? process.env.GPUI_KIT ?? join(here, "..", "..", "gpui-kit"));
const COMPONENT = join(KIT, "crates", "component", "src");
const BASE = join(KIT, "crates", "base", "src");

if (!existsSync(COMPONENT)) {
  console.error(`No gpui-kit checkout at ${KIT}. Pass its path, or set GPUI_KIT.`);
  process.exit(2);
}

/* ---------- what the canvas claims ---------- */

const tokens = readFileSync(join(here, "..", "lib", "tokens.ts"), "utf8");
const claims = [...tokens.matchAll(/^ {2}(\w+): \{\n(?:.*\n)*? {4}api: "([^"]+)",/gm)].map((m) => ({
  kind: m[1],
  api: m[2],
}));
if (!claims.length) {
  console.error("Found no `api:` entries in lib/tokens.ts — has KindSpec changed shape?");
  process.exit(2);
}

/** the module::Type pairs an api string names; prose around them is ignored */
function pathsOf(api) {
  const out = [];
  for (const m of api.matchAll(/([a-z_][a-z_0-9]*)::\{([^}]+)\}/g))
    for (const t of m[2].split(",")) out.push([m[1], t.trim()]);
  for (const m of api.matchAll(/([a-z_][a-z_0-9]*)::([A-Za-z]\w*)/g)) out.push([m[1], m[2]]);
  /* a bare `{Icon, IconName}` or `TitleBar` is re-exported at the component
   * root. Only an api that is nothing but a type list is read this way, so
   * prose describing a composition is never mistaken for a type. */
  if (!out.length && /^\{?[A-Z]\w*(?:,\s*[A-Z]\w*)*\}?$/.test(api.trim()))
    for (const m of api.matchAll(/\b([A-Z]\w+)\b/g)) out.push([null, m[1]]);
  return out;
}

/* ---------- what gpui-kit has ---------- */

const rustFiles = (dir) => {
  const out = [];
  const walk = (d) => {
    for (const name of readdirSync(d)) {
      const full = join(d, name);
      if (statSync(full).isDirectory()) walk(full);
      else if (name.endsWith(".rs")) out.push(full);
    }
  };
  if (existsSync(dir)) walk(dir);
  return out;
};

/* `gpui_kit::*` is GPUI itself, so a bare `gpui_kit::X` lives in the gpui crate
 * rather than in this checkout. Find it where cargo unpacked it. */
function gpuiSource() {
  if (process.env.GPUI_SRC) return existsSync(process.env.GPUI_SRC) ? process.env.GPUI_SRC : null;
  const registry = join(process.env.HOME ?? "", ".cargo", "registry", "src");
  if (!existsSync(registry)) return null;
  for (const index of readdirSync(registry)) {
    const dir = join(registry, index);
    if (!statSync(dir).isDirectory()) continue;
    const crate = readdirSync(dir)
      .filter((name) => /^gpui-\d/.test(name))
      .sort()
      .pop();
    if (crate && existsSync(join(dir, crate, "src"))) return join(dir, crate, "src");
  }
  return null;
}

const sourceOf = new Map();
const read = (paths) => paths.map((p) => readFileSync(p, "utf8")).join("\n");
/** Index every module by its own name, at any depth: `date_picker` is published
 *  as its own path even though it lives under a private `time` parent. */
function indexModules(dir) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      sourceOf.set(name, (sourceOf.get(name) ?? "") + "\n" + read(rustFiles(full)));
      indexModules(full);
    } else if (name.endsWith(".rs") && name !== "mod.rs" && name !== "lib.rs") {
      const mod = name.slice(0, -3);
      sourceOf.set(mod, (sourceOf.get(mod) ?? "") + "\n" + readFileSync(full, "utf8"));
    }
  }
}
for (const base of [COMPONENT, BASE]) indexModules(base);
const allSource = [...sourceOf.values()].join("\n");
const componentLib = readFileSync(join(COMPONENT, "lib.rs"), "utf8");
const GPUI = gpuiSource();
const gpuiText = GPUI ? read(rustFiles(GPUI)) : "";

const defines = (text, type) =>
  new RegExp(`pub (?:struct|enum|trait|type|fn) ${type}\\b`).test(text) ||
  new RegExp(`pub use [^;]*\\b${type}\\b`).test(text);

/** The component modules gpui-kit publishes, which is the list a palette should
 *  track. Some are declared outright and some are re-exported from a private
 *  parent — `calendar` and `date_picker` come through `pub use time::{...}` —
 *  so both forms are collected. */
const realModules = [
  ...[...componentLib.matchAll(/^pub mod ([a-z_0-9]+)/gm)].map((m) => m[1]),
  ...[...componentLib.matchAll(/^pub use [a-z_0-9]+::\{([^}]+)\};/gm)].flatMap((m) =>
    m[1].split(",").map((name) => name.trim()),
  ),
]
  /* a re-export list mixes modules with free functions; only a name backed by a
   * source file or directory is a module */
  .filter((name) => /^[a-z_][a-z_0-9]*$/.test(name) && sourceOf.has(name))
  /* infrastructure, not something to drop on a canvas */
  .filter((name) => !["global_state", "highlighter", "history", "theme"].includes(name));

/* ---------- check ---------- */

let failed = 0;
const covered = new Set();
for (const { kind, api } of claims) {
  const paths = pathsOf(api);
  if (!paths.length) {
    /* an api that names a composition rather than a component, e.g. an h_flex row */
    console.log(`  ~  ${kind.padEnd(14)} ${api}   (composition, nothing to check)`);
    continue;
  }
  for (const [mod, type] of paths) {
    const fromGpui = mod === "gpui_kit";
    if (mod && !fromGpui) covered.add(mod);
    let ok;
    let where;
    if (fromGpui) {
      /* GPUI's own surface; unchecked rather than failed when it is not unpacked */
      if (!GPUI) {
        console.log(`  ~  ${kind.padEnd(14)} ${`${mod}::${type}`.padEnd(34)}  gpui crate not found, skipped`);
        continue;
      }
      ok = defines(gpuiText, type);
      where = "GPUI";
    } else {
      const text = mod ? (sourceOf.get(mod) ?? "") : allSource;
      ok = mod
        ? defines(text, type) || new RegExp(`\\b${type}\\b`).test(componentLib)
        : defines(allSource, type) || new RegExp(`icon_named!\\(${type}`).test(allSource);
      where = "gpui-kit";
    }
    if (!ok) failed++;
    console.log(`  ${ok ? "ok" : "!!"} ${kind.padEnd(14)} ${(mod ? `${mod}::${type}` : type).padEnd(34)}${ok ? "" : `  NOT IN ${where}`}`);
  }
}

const uncovered = realModules.filter((m) => !covered.has(m)).sort();
console.log(`\n${claims.length} parts checked against ${KIT}`);
console.log(`gpui-kit component modules: ${realModules.length}, referenced by the palette: ${covered.size}`);
if (uncovered.length) console.log(`not in the palette yet: ${uncovered.join(", ")}`);

if (failed) {
  console.error(`\n${failed} path(s) do not exist in gpui-kit.`);
  process.exit(1);
}
console.log("\nEvery path the palette claims exists in gpui-kit.");
