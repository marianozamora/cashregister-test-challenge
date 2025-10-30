# Cash Register System

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=flat&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-404D59?style=flat&logo=express&logoColor=white)
![Jest](https://img.shields.io/badge/Jest-323330?style=flat&logo=jest&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat&logo=vercel&logoColor=white)

Professional cash register system that calculates optimal change using the Strategy pattern. Built with TypeScript, Express.js, and designed for production deployment on Vercel.

## ✨ Features

- 🧮 **Optimal Change Calculation** - Greedy algorithm for minimum coin/bill count
- 🌐 **REST API** - Full Express.js API with OpenAPI documentation
- 📁 **CSV Processing** - Web interface for batch transaction processing
- 🎯 **TypeScript** - 100% type-safe codebase with strict mode
- 🚀 **Production Ready** - Vercel deployment with serverless functions
- 🧪 **Comprehensive Tests** - Jest test suite with 95%+ coverage
- 📚 **API Documentation** - Interactive Swagger UI
- 🔧 **CI/CD Pipeline** - GitHub Actions with automated testing
- 🎨 **Code Quality** - ESLint, Prettier, and pre-commit hooks

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm start

# Access web interface
open http://localhost:3000

# Run tests
npm test

# View API documentation
open http://localhost:3000/api-docs
```

## 📖 API Reference

### Core Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/change/calculate` | Calculate change for single transaction |
| `POST` | `/api/v1/change/batch` | Process multiple transactions from CSV |
| `GET` | `/api/health` | Service health check |
| `GET` | `/api-docs` | Interactive API documentation |

### Example Usage

```bash
# Single calculation
curl -X POST http://localhost:3000/api/v1/change/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "amountOwed": 2.12,
    "amountPaid": 3.00,
    "currencyCode": "USD"
  }'

# Response
{
  "success": true,
  "data": {
    "totalChangeInCents": 88,
    "denominations": {
      "quarters": 3,
      "dimes": 1,
      "pennies": 3
    },
    "formattedOutput": "3 quarters + 1 dime + 3 pennies"
  }
}
```

## 📁 CSV Format

Upload CSV files with the following format:

```csv
amountOwed,amountPaid
2.12,3.00
1.97,2.00
3.33,5.00
```

## 🏗️ Architecture

The system follows clean architecture principles:

```
src/
├── domain/           # Business logic and entities
├── infrastructure/   # External services and data access
├── api/             # REST API controllers and middleware
└── config/          # Configuration and setup
```

## 🛠️ Development

```bash
# Install dependencies
npm install

# Development with hot reload
npm run dev

# Build for production
npm run build

# Run linting
npm run lint

# Format code
npm run format
```

## 🚀 Deployment

### Vercel (Recommended)

```bash
# Deploy to Vercel
vercel

# Or configure automatic deployments via GitHub integration
```

### Manual Deployment

```bash
# Build the project
npm run build

# Start production server
npm start
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## 📋 Requirements

- **Node.js** 22.0.0 or higher
- **npm** 8.0.0 or higher
- **TypeScript** 5.2.0 or higher

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -m 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.