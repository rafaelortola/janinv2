import express from 'express';
import compression from 'compression';
import { createProxyMiddleware } from 'http-proxy-middleware';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;
const API_URL = process.env.API_URL || 'http://127.0.0.1:8000';

app.use(compression());
app.use('/api', createProxyMiddleware({ target: API_URL, changeOrigin: true }));
app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Frontend server running on http://localhost:${PORT}`);
});
