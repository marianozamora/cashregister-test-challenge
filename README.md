# Cash Register System

Sistema de caja registradora que calcula cambio optimizado usando TypeScript y CSV.

## Uso Rápido

```bash
# Instalar dependencias
npm install

# Ejecutar servidor API
npm start

# Interfaz web
http://localhost:3000

# Ejecutar tests
npm test
```

## API Endpoints

- `POST /api/v1/change/calculate` - Cálculo individual
- `POST /api/v1/change/batch` - Procesamiento por lotes
- `GET /api/health` - Health check

### Ejemplo de uso

```bash
curl -X POST http://localhost:3000/api/v1/change/calculate \
  -H "Content-Type: application/json" \
  -d '{"amountOwed": 2.12, "amountPaid": 3.00, "currencyCode": "USD"}'
```

## CSV Format

```csv
amountOwed,amountPaid
2.12,3.00
1.97,2.00
```

## Deployment

```bash
# Build
npm run build

# Deploy to Vercel
vercel
```

## Requirements

- Node.js 22+
- TypeScript