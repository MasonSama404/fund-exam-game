#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const sandbox = { window: {} };
vm.createContext(sandbox);

const files = [
  "src/data/levels_act1.js",
  "src/data/levels_act2_a.js",
  "src/data/levels_act2_b.js"
];

for (const rel of files) {
  const full = path.join(root, rel);
  const code = fs.readFileSync(full, "utf8");
  vm.runInContext(code, sandbox, { filename: rel });
}

const a1 = sandbox.window.LEVELS_ACT1 || [];
const a2a = sandbox.window.LEVELS_ACT2_A || [];
const a2b = sandbox.window.LEVELS_ACT2_B || [];
const all = [...a1, ...a2a, ...a2b];

let errors = [];
if (a1.length !== 8) errors.push(`LEVELS_ACT1 length=${a1.length}, expected 8`);
if (a2a.length !== 9) errors.push(`LEVELS_ACT2_A length=${a2a.length}, expected 9`);
if (a2b.length !== 9) errors.push(`LEVELS_ACT2_B length=${a2b.length}, expected 9`);
if (all.length !== 26) errors.push(`Total levels=${all.length}, expected 26`);

const validDesks = new Set(["product", "compliance", "trading"]);

all.forEach((lv, i) => {
  const expectedFloor = i + 1;
  if (lv.floor !== expectedFloor) errors.push(`Index ${i}: floor=${lv.floor}, expected ${expectedFloor}`);
  if (lv.act !== (expectedFloor <= 8 ? 1 : 2)) errors.push(`Floor ${lv.floor}: wrong act ${lv.act}`);
  if (!lv.deptName || lv.deptName.length > 9) errors.push(`Floor ${lv.floor}: invalid deptName "${lv.deptName}"`);
  if (!Array.isArray(lv.cheatSheet) || lv.cheatSheet.length !== 4) {
    errors.push(`Floor ${lv.floor}: cheatSheet count !== 4`);
  }
  if (!Array.isArray(lv.workOrders) || lv.workOrders.length !== 4) {
    errors.push(`Floor ${lv.floor}: workOrders count !== 4`);
  } else {
    lv.workOrders.forEach((wo, wi) => {
      if (!validDesks.has(wo.desk)) errors.push(`Floor ${lv.floor} WO#${wi}: invalid desk ${wo.desk}`);
      if (!Array.isArray(wo.options) || wo.options.length !== 3) {
        errors.push(`Floor ${lv.floor} WO#${wi}: options length !== 3`);
      } else {
        const okCount = wo.options.filter((o) => o.ok === true).length;
        if (okCount !== 1) errors.push(`Floor ${lv.floor} WO#${wi}: okCount=${okCount}`);
      }
    });
  }
  if (!Array.isArray(lv.bossQuestions) || lv.bossQuestions.length !== 3) {
    errors.push(`Floor ${lv.floor}: bossQuestions count !== 3`);
  } else {
    lv.bossQuestions.forEach((bq, bi) => {
      if (!Array.isArray(bq.opts) || bq.opts.length !== 4) {
        errors.push(`Floor ${lv.floor} BQ#${bi}: opts length !== 4`);
      }
      if (typeof bq.ans !== "number" || bq.ans < 0 || bq.ans > 3) {
        errors.push(`Floor ${lv.floor} BQ#${bi}: invalid ans=${bq.ans}`);
      }
    });
  }
});

if (errors.length) {
  console.error("Validation errors:\n" + errors.join("\n"));
  process.exit(1);
}

console.log(
  `✅ Validated all ${all.length} floors (${all.length * 4} cheat cards, ${all.length * 4} work orders, ${all.length * 3} boss exam questions)!`
);
