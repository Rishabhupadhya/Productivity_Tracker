/**
 * SMS Parser Test Runner
 * 
 * Run this file to test all bank parsers with sample SMS messages
 * 
 * Usage: ts-node testRunner.ts
 */

import { IciciSmsParser } from "../parsers/iciciParser";
import { HdfcSmsParser } from "../parsers/hdfcParser";
import { SbiSmsParser } from "../parsers/sbiParser";
import { AxisSmsParser } from "../parsers/axisParser";
import { SmsParserFactory } from "../smsParser.interface";
import {
  iciciSamples,
  hdfcSamples,
  sbiSamples,
  axisSamples,
  nonTransactionSamples,
  runTests
} from "./smsParser.test";

console.log("=".repeat(60));
console.log("SMS PARSER TEST SUITE");
console.log("=".repeat(60));

// Test individual parsers
console.log("\n📱 ICICI Bank Parser Tests:");
const iciciParser = new IciciSmsParser();
const iciciResults = runTests(iciciParser, iciciSamples);
iciciResults.forEach(r => {
  console.log(`  Test ${r.testCase}: ${r.passed ? "✅ PASS" : "❌ FAIL"}`);
  if (!r.passed) {
    console.log(`    Expected: ${JSON.stringify(r.expected)}`);
    console.log(`    Actual: ${JSON.stringify(r.actual)}`);
  }
});

console.log("\n💳 HDFC Bank Parser Tests:");
const hdfcParser = new HdfcSmsParser();
const hdfcResults = runTests(hdfcParser, hdfcSamples);
hdfcResults.forEach(r => {
  console.log(`  Test ${r.testCase}: ${r.passed ? "✅ PASS" : "❌ FAIL"}`);
  if (!r.passed) {
    console.log(`    Expected: ${JSON.stringify(r.expected)}`);
    console.log(`    Actual: ${JSON.stringify(r.actual)}`);
  }
});

console.log("\n🏦 SBI Parser Tests:");
const sbiParser = new SbiSmsParser();
const sbiResults = runTests(sbiParser, sbiSamples);
sbiResults.forEach(r => {
  console.log(`  Test ${r.testCase}: ${r.passed ? "✅ PASS" : "❌ FAIL"}`);
  if (!r.passed) {
    console.log(`    Expected: ${JSON.stringify(r.expected)}`);
    console.log(`    Actual: ${JSON.stringify(r.actual)}`);
  }
});

console.log("\n🔷 Axis Bank Parser Tests:");
const axisParser = new AxisSmsParser();
const axisResults = runTests(axisParser, axisSamples);
axisResults.forEach(r => {
  console.log(`  Test ${r.testCase}: ${r.passed ? "✅ PASS" : "❌ FAIL"}`);
  if (!r.passed) {
    console.log(`    Expected: ${JSON.stringify(r.expected)}`);
    console.log(`    Actual: ${JSON.stringify(r.actual)}`);
  }
});

// Test factory with non-transaction messages
console.log("\n🚫 Non-Transaction SMS Tests (should all return null):");
const factory = new SmsParserFactory();
factory.registerParser(iciciParser);
factory.registerParser(hdfcParser);
factory.registerParser(sbiParser);
factory.registerParser(axisParser);

nonTransactionSamples.forEach((sms, index) => {
  const parsed = factory.parse(sms, new Date());
  const passed = parsed === null;
  console.log(`  Test ${index + 1}: ${passed ? "✅ PASS" : "❌ FAIL"}`);
  if (!passed) {
    console.log(`    SMS: ${sms}`);
    console.log(`    Unexpected parse result: ${JSON.stringify(parsed)}`);
  }
});

// Summary
const allResults = [...iciciResults, ...hdfcResults, ...sbiResults, ...axisResults];
const totalTests = allResults.length + nonTransactionSamples.length;
const passedTests = allResults.filter(r => r.passed).length + nonTransactionSamples.length;

console.log("\n" + "=".repeat(60));
console.log(`SUMMARY: ${passedTests}/${totalTests} tests passed`);
console.log("=".repeat(60));

if (passedTests === totalTests) {
  console.log("✅ All tests passed!");
} else {
  console.log(`❌ ${totalTests - passedTests} tests failed`);
  process.exit(1);
}
