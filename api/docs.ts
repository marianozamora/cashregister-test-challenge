import { VercelRequest, VercelResponse } from '@vercel/node';
import { swaggerSpec } from '../src/config/swagger';

export default function handler(req: VercelRequest, res: VercelResponse): void {
  // For Vercel, just return the JSON spec
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).json(swaggerSpec);
}
