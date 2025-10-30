#!/usr/bin/env node

// Check Node.js version requirement
const nodeVersion = parseInt(process.version.substring(1).split('.')[0]!, 10);
if (nodeVersion < 22) {
  console.error(`Error: Node.js 22 or higher is required. Current version: ${process.version}`);
  process.exit(1);
}

import { CLIRunner } from './infrastructure/CLIRunner';
import { US_CURRENCY } from './config/currencies';
import { SpecialRuleConfig } from './domain/Currency';

/**
 * Main entry point for the cash register CLI application
 */
async function main(): Promise<void> {
  try {
    // Parse command line arguments
    const args = process.argv.slice(2);
    const { inputFile, outputFile } = CLIRunner.validateArgs(args);

    // Configure the application
    const specialRuleConfig: SpecialRuleConfig = {
      divisor: 3,
      description: 'Use random denominations when change is divisible by 3',
    };

    const config = {
      currency: US_CURRENCY,
      specialRuleConfig,
    };

    // Run the application
    const runner = new CLIRunner(config);
    await runner.run(inputFile, outputFile);

    console.log('Cash register processing completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Application failed:', (error as Error).message);
    process.exit(1);
  }
}

// Run the application if this file is executed directly
if (require.main === module) {
  void main();
}
