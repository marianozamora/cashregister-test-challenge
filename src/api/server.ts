import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { ChangeCalculatorController } from './controllers/ChangeCalculatorController';
import { ErrorHandler } from './middleware/ErrorHandler';
import { swaggerSpec } from '../config/swagger';

export class CashRegisterServer {
  private app: express.Application;
  private readonly port: number;
  private readonly isVercel: boolean;

  constructor(port = 3000, isVercel = false) {
    this.app = express();
    this.port = port;
    this.isVercel = isVercel;
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupMiddleware(): void {
    this.app.use(
      helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", 'data:'],
          },
        },
      }),
      cors(),
      compression(),
      morgan('combined')
    );
    this.app.use(express.json({ limit: '10mb' }), express.urlencoded({ extended: true }));
  }

  private setupRoutes(): void {
    if (!this.isVercel) {
      this.app.use(express.static('public'));
      this.app.use('/examples', express.static('examples'));
    }

    // Swagger documentation routes
    this.app.use(
      '/api-docs',
      swaggerUi.serve,
      swaggerUi.setup(swaggerSpec, {
        explorer: true,
        customSiteTitle: 'Cash Register API Documentation',
      })
    );

    // API spec JSON endpoint
    this.app.get('/api-docs.json', (req, res) => {
      res.setHeader('Content-Type', 'application/json');
      res.send(swaggerSpec);
    });

    this.app.get('/health', (req, res) => res.json({ status: 'healthy', timestamp: new Date().toISOString() }));

    // Configure routes based on environment
    if (this.isVercel) {
      // In Vercel, the /api prefix is handled by the routing, so we handle paths directly
      this.app.use('/v1/change', ChangeCalculatorController.getRouter());
      // Root route for API
      this.app.get('/', (req, res) =>
        res.json({
          message: 'Cash Register API',
          version: '1.0.0',
          timestamp: new Date().toISOString(),
          endpoints: {
            health: '/api/health',
            change: '/api/v1/change/calculate',
            batch: '/api/v1/change/batch',
            docs: '/api-docs',
          },
        })
      );
      // Handle any unmatched API routes
      this.app.get('*', (req, res) => {
        console.log(`Vercel API route not found: ${req.path}`);
        res.status(404).json({ error: 'API route not found', path: req.path });
      });
    } else {
      // Local development routes
      this.app.use('/api/v1/change', ChangeCalculatorController.getRouter());
      this.app.get('/api', (req, res) =>
        res.json({
          message: 'Cash Register API',
          version: '1.0.0',
          timestamp: new Date().toISOString(),
          endpoints: {
            health: '/api/health',
            change: '/api/v1/change/calculate',
            batch: '/api/v1/change/batch',
            docs: '/api-docs',
          },
        })
      );
    }
  }
  private setupErrorHandling(): void {
    this.app.use(ErrorHandler.handleNotFound);
    this.app.use(ErrorHandler.handleError);
  }

  public start(): void {
    this.app.listen(this.port, () => {
      console.log(`Cash Register API server running on port ${this.port}`);
      console.log(`Web interface available at http://localhost:${this.port}`);
    });
  }

  public getApp(): express.Application {
    return this.app;
  }
}
