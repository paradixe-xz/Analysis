const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();
const { v4: uuidv4 } = require('uuid'); // Agregar esta dependencia

const logger = require('./utils/logger');
const callRoutes = require('./routes/callRoutes');
const analysisRoutes = require('./routes/analysisRoutes');
const exportRoutes = require('./routes/exportRoutes');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware de seguridad
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100 // límite de 100 requests por ventana de tiempo
});
app.use(limiter);

// Middleware para parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Middleware de logging mejorado
app.use((req, res, next) => {
  // Generar ID único para la request
  req.requestId = uuidv4();
  req.startTime = Date.now();
  
  // Logger contextual para esta request
  req.logger = logger.withContext({
    requestId: req.requestId,
    service: 'api'
  });
  
  req.logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    body: req.method === 'POST' ? req.body : undefined
  });
  
  // Log cuando la response termine
  res.on('finish', () => {
    const duration = Date.now() - req.startTime;
    req.logger.info(`${req.method} ${req.path} completed`, {
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      contentLength: res.get('Content-Length')
    });
  });
  
  next();
});

// Rutas
app.use('/api/calls', callRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/export', exportRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Error handling middleware mejorado
app.use((err, req, res, next) => {
  const errorLogger = req.logger || logger;
  
  errorLogger.error('Request error occurred', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    body: req.body,
    params: req.params,
    query: req.query
  });
  
  res.status(500).json({ 
    error: 'Error interno del servidor',
    requestId: req.requestId,
    message: process.env.NODE_ENV === 'development' ? err.message : 'Algo salió mal'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint no encontrado' });
});

app.listen(PORT, () => {
  logger.info(`Servidor corriendo en puerto ${PORT}`);
  console.log(`🚀 Servidor iniciado en http://localhost:${PORT}`);
});

module.exports = app;