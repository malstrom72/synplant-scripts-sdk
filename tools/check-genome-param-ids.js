#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

function usage() {
  console.error("usage: check-genome-param-ids.js <live-genes-json-file|- > [declaration-file]");
  console.error("");
  console.error("Generate live genes with:");
  console.error("  sp_eval(\"JSON.stringify(GENES.map(function (g) { return g.NAME; }))\")");
  process.exit(1);
}

function readInput(file) {
  if (file === "-") {
    return fs.readFileSync(0, "utf8");
  }
  return fs.readFileSync(file, "utf8");
}

function parseGenomeParamIds(declarationText) {
  const match = declarationText.match(/declare\s+type\s+GenomeParamId\s*=\s*([\s\S]*?)(?:\n\s*\n|declare\s+type\s+ParamId\b)/);
  if (!match) {
    throw new Error("Could not find GenomeParamId union in declaration file");
  }

  const ids = [];
  const re = /"([^"]+)"/g;
  let item;
  while ((item = re.exec(match[1])) !== null) {
    ids.push(item[1]);
  }

  if (ids.length === 0) {
    throw new Error("GenomeParamId union did not contain any string literals");
  }
  return ids;
}

function parseLiveGenes(text) {
  const data = JSON.parse(text);
  if (!Array.isArray(data) || data.some((item) => typeof item !== "string")) {
    throw new Error("Live genes JSON must be an array of strings");
  }
  return data;
}

function diffLists(expected, actual) {
  const expectedSet = new Set(expected);
  const actualSet = new Set(actual);

  return {
    missing: actual.filter((id) => !expectedSet.has(id)),
    extra: expected.filter((id) => !actualSet.has(id)),
    orderMismatches: actual
      .map((id, index) => ({ id, index, declared: expected[index] }))
      .filter((item) => item.declared !== item.id),
  };
}

function printList(label, items) {
  if (items.length === 0) {
    return;
  }
  console.error(label + ":");
  for (const item of items) {
    console.error("  " + item);
  }
}

if (process.argv.length < 3 || process.argv.length > 4) {
  usage();
}

const rootDir = path.resolve(__dirname, "..");
const liveGenesFile = process.argv[2];
const declarationFile = process.argv[3] || path.join(rootDir, "ts", "COJSEngine.d.ts");

try {
  const liveGenes = parseLiveGenes(readInput(liveGenesFile));
  const declaredGenes = parseGenomeParamIds(fs.readFileSync(declarationFile, "utf8"));
  const diff = diffLists(declaredGenes, liveGenes);
  const ok =
    diff.missing.length === 0 &&
    diff.extra.length === 0 &&
    diff.orderMismatches.length === 0;

  if (!ok) {
    console.error("GenomeParamId does not match live GENES.");
    printList("Missing from declaration", diff.missing);
    printList("Extra in declaration", diff.extra);
    if (diff.orderMismatches.length > 0) {
      console.error("Order mismatches:");
      for (const item of diff.orderMismatches) {
        console.error("  index " + item.index + ": live " + item.id + ", declaration " + item.declared);
      }
    }
    process.exit(1);
  }

  console.log("GenomeParamId matches live GENES (" + liveGenes.length + " genes).");
} catch (err) {
  console.error(err.message);
  process.exit(1);
}
