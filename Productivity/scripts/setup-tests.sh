#!/bin/bash

# Test Setup Script for Productivity Suite
# This script sets up the testing environment and installs dependencies

set -e

echo "🚀 Setting up Productivity Suite Testing Environment"
echo "=================================================="

# Check Node.js version
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node --version)"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Install Playwright browsers
echo "🎭 Installing Playwright browsers..."
npx playwright install

# Setup Rust for Tauri (if not already installed)
if ! command -v rustc &> /dev/null; then
    echo "🦀 Installing Rust..."
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    source ~/.cargo/env
else
    echo "✅ Rust is already installed: $(rustc --version)"
fi

# Build packages
echo "🔨 Building packages..."
npm run build

# Make test runner executable
chmod +x scripts/test-runner.js

# Create test directories if they don't exist
mkdir -p test-results
mkdir -p coverage-combined
mkdir -p performance-results

echo "✅ Test environment setup complete!"
echo ""
echo "Available test commands:"
echo "  npm test                    # Run all tests"
echo "  npm run test:unit           # Run unit tests only"
echo "  npm run test:integration    # Run integration tests"
echo "  npm run test:e2e            # Run E2E tests"
echo "  npm run test:coverage       # Run tests with coverage"
echo "  node scripts/test-runner.js # Use custom test runner"
echo ""
echo "For more options, run: node scripts/test-runner.js --help"