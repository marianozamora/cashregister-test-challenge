#!/usr/bin/env node

// Check Node.js version requirement
const nodeVersion = parseInt(process.version.substring(1).split('.')[0]!, 10);
if (nodeVersion < 22) {
  console.error(`Error: Node.js 22 or higher is required. Current version: ${process.version}`);
  process.exit(1);
}

import { CashRegisterServer } from './api/server';

/**
 * API server entry point
 */
async function startServer(): Promise<void> {
  try {
    const port = parseInt(process.env['PORT'] || '3000', 10);
    const server = new CashRegisterServer(port);
    server.start();

    // Keep the process alive
    process.on('SIGTERM', () => {
      console.log('SIGTERM received, shutting down gracefully');
      process.exit(0);
    });

    process.on('SIGINT', () => {
      console.log('SIGINT received, shutting down gracefully');
      process.exit(0);
    });
  } catch (error) {
    console.error('Failed to start server:', (error as Error).message);
    process.exit(1);
  }
}

// Start the server if this file is executed directly
if (require.main === module) {
  void startServer();
}

export { CashRegisterServer };
