#!/usr/bin/env node

/**
 * Test Runner Script
 * Provides a unified interface for running different types of tests
 */

const { execSync, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

function log(message, color = 'white') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

function formatTime(ms) {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

async function runCommand(command, cwd = process.cwd(), silent = false) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, [], {
      shell: true,
      cwd,
      stdio: silent ? 'pipe' : 'inherit',
    });

    let output = '';
    if (silent) {
      child.stdout.on('data', (data) => {
        output += data.toString();
      });
      child.stderr.on('data', (data) => {
        output += data.toString();
      });
    }

    child.on('close', (code) => {
      if (code === 0) {
        resolve({ success: true, output });
      } else {
        reject({ success: false, code, output });
      }
    });
  });
}

async function checkDependencies() {
  log('🔍 Checking dependencies...', 'cyan');
  
  const checks = [
    { name: 'Node.js', command: 'node --version' },
    { name: 'npm', command: 'npm --version' },
    { name: 'Rust', command: 'rustc --version' },
    { name: 'Playwright', command: 'npx playwright --version' },
  ];

  for (const check of checks) {
    try {
      const result = await runCommand(check.command, process.cwd(), true);
      log(`✅ ${check.name}: Available`, 'green');
    } catch (error) {
      log(`❌ ${check.name}: Not available`, 'red');
      if (check.name === 'Playwright') {
        log('   Run: npx playwright install', 'yellow');
      }
    }
  }
}

async function runPackageTests(packageName, options = {}) {
  const packagePath = path.join(process.cwd(), 'packages', packageName);
  
  if (!fs.existsSync(packagePath)) {
    log(`❌ Package ${packageName} not found`, 'red');
    return false;
  }

  log(`🧪 Testing package: ${packageName}`, 'blue');
  const startTime = Date.now();

  try {
    const testCommand = options.coverage ? 'npm run test:coverage' : 'npm test';
    await runCommand(testCommand, packagePath);
    
    const duration = Date.now() - startTime;
    log(`✅ ${packageName} tests passed (${formatTime(duration)})`, 'green');
    return true;
  } catch (error) {
    const duration = Date.now() - startTime;
    log(`❌ ${packageName} tests failed (${formatTime(duration)})`, 'red');
    return false;
  }
}

async function runAppTests(appName, options = {}) {
  const appPath = path.join(process.cwd(), 'apps', appName);
  
  if (!fs.existsSync(appPath)) {
    log(`❌ App ${appName} not found`, 'red');
    return false;
  }

  log(`🧪 Testing app: ${appName}`, 'blue');
  const startTime = Date.now();

  try {
    const testCommand = options.coverage ? 'npm run test:coverage' : 'npm test';
    await runCommand(testCommand, appPath);
    
    const duration = Date.now() - startTime;
    log(`✅ ${appName} tests passed (${formatTime(duration)})`, 'green');
    return true;
  } catch (error) {
    const duration = Date.now() - startTime;
    log(`❌ ${appName} tests failed (${formatTime(duration)})`, 'red');
    return false;
  }
}

async function runE2ETests() {
  log('🎭 Running E2E tests...', 'blue');
  const startTime = Date.now();

  try {
    await runCommand('npx playwright test');
    const duration = Date.now() - startTime;
    log(`✅ E2E tests passed (${formatTime(duration)})`, 'green');
    return true;
  } catch (error) {
    const duration = Date.now() - startTime;
    log(`❌ E2E tests failed (${formatTime(duration)})`, 'red');
    return false;
  }
}

async function runPerformanceTests() {
  log('⚡ Running performance tests...', 'blue');
  const startTime = Date.now();

  try {
    // Run performance tests for each package
    const packages = ['ai-engine', 'shared-ui', 'file-system'];
    for (const pkg of packages) {
      await runCommand(`npm run test -- --testNamePattern="performance|Performance"`, 
        path.join(process.cwd(), 'packages', pkg));
    }
    
    const duration = Date.now() - startTime;
    log(`✅ Performance tests passed (${formatTime(duration)})`, 'green');
    return true;
  } catch (error) {
    const duration = Date.now() - startTime;
    log(`❌ Performance tests failed (${formatTime(duration)})`, 'red');
    return false;
  }
}

async function generateCoverageReport() {
  log('📊 Generating coverage report...', 'cyan');
  
  try {
    // Generate coverage for all packages
    const packages = ['ai-engine', 'shared-ui', 'file-system'];
    for (const pkg of packages) {
      await runCommand('npm run test:coverage', path.join(process.cwd(), 'packages', pkg));
    }
    
    // Combine coverage reports
    await runCommand('mkdir -p coverage-combined');
    await runCommand('npx nyc merge packages/*/coverage/coverage-final.json coverage-combined/coverage.json');
    await runCommand('npx nyc report --reporter=html --temp-dir=coverage-combined --report-dir=coverage-combined');
    
    log('✅ Coverage report generated in coverage-combined/', 'green');
    return true;
  } catch (error) {
    log('❌ Failed to generate coverage report', 'red');
    return false;
  }
}

async function runLinting() {
  log('🔍 Running linting...', 'cyan');
  
  try {
    await runCommand('npm run lint');
    await runCommand('npm run typecheck');
    log('✅ Linting passed', 'green');
    return true;
  } catch (error) {
    log('❌ Linting failed', 'red');
    return false;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const options = {
    coverage: args.includes('--coverage'),
    e2e: args.includes('--e2e'),
    performance: args.includes('--performance'),
    lint: args.includes('--lint'),
    packages: args.includes('--packages'),
    apps: args.includes('--apps'),
    all: args.includes('--all') || args.length === 0,
  };

  log('🚀 Productivity Suite Test Runner', 'cyan');
  log('=====================================', 'cyan');

  await checkDependencies();
  console.log();

  const startTime = Date.now();
  let allPassed = true;

  // Run linting first if requested or running all
  if (options.lint || options.all) {
    const lintPassed = await runLinting();
    allPassed = allPassed && lintPassed;
    console.log();
  }

  // Run package tests
  if (options.packages || options.all) {
    log('📦 Testing Packages', 'yellow');
    log('===================', 'yellow');
    
    const packages = ['ai-engine', 'shared-ui', 'file-system'];
    for (const pkg of packages) {
      const passed = await runPackageTests(pkg, options);
      allPassed = allPassed && passed;
    }
    console.log();
  }

  // Run app tests
  if (options.apps || options.all) {
    log('📱 Testing Applications', 'yellow');
    log('=======================', 'yellow');
    
    const apps = ['copilot-nest', 'copilot-doc', 'copilot-grid', 'copilot-inbox', 'mini-claude-code'];
    for (const app of apps) {
      const passed = await runAppTests(app, options);
      allPassed = allPassed && passed;
    }
    console.log();
  }

  // Run E2E tests
  if (options.e2e || options.all) {
    const e2ePassed = await runE2ETests();
    allPassed = allPassed && e2ePassed;
    console.log();
  }

  // Run performance tests
  if (options.performance || options.all) {
    const perfPassed = await runPerformanceTests();
    allPassed = allPassed && perfPassed;
    console.log();
  }

  // Generate coverage report
  if (options.coverage) {
    await generateCoverageReport();
    console.log();
  }

  const totalTime = Date.now() - startTime;
  log('=====================================', 'cyan');
  
  if (allPassed) {
    log(`🎉 All tests passed! (${formatTime(totalTime)})`, 'green');
    process.exit(0);
  } else {
    log(`💥 Some tests failed! (${formatTime(totalTime)})`, 'red');
    process.exit(1);
  }
}

// Show help if requested
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
Productivity Suite Test Runner

Usage: node scripts/test-runner.js [options]

Options:
  --all          Run all tests (default)
  --packages     Run package tests only
  --apps         Run application tests only
  --e2e          Run E2E tests only
  --performance  Run performance tests only
  --lint         Run linting only
  --coverage     Generate coverage report
  --help, -h     Show this help message

Examples:
  node scripts/test-runner.js                    # Run all tests
  node scripts/test-runner.js --packages         # Run package tests only
  node scripts/test-runner.js --e2e --coverage   # Run E2E tests with coverage
  node scripts/test-runner.js --lint             # Run linting only
`);
  process.exit(0);
}

main().catch((error) => {
  log(`💥 Test runner failed: ${error.message}`, 'red');
  process.exit(1);
});