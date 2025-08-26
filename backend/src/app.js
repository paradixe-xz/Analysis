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
  
  // Función para serializar objetos de forma segura
  const safeStringify = (obj) => {
    try {
      return JSON.stringify(obj, (key, value) => {
        if (typeof value === 'object' && value !== null) {
          // Manejar objetos HTTP específicos
          if (value.constructor && value.constructor.name === 'IncomingMessage') {
            return '[IncomingMessage]';
          }
          if (value.constructor && value.constructor.name === 'ServerResponse') {
            return '[ServerResponse]';
          }
          if (value.constructor && value.constructor.name === 'ClientRequest') {
            return '[ClientRequest]';
          }
          if (value.constructor && value.constructor.name === 'TLSSocket') {
            return '[TLSSocket]';
          }
          if (value.constructor && value.constructor.name === 'Socket') {
            return '[Socket]';
          }
          // Detectar referencias circulares
          if (value.hasOwnProperty && value.hasOwnProperty('_httpMessage')) {
            return '[HTTP Object with circular reference]';
          }
        }
        return value;
      });
    } catch (e) {
      return '[Circular Structure]';
    }
  };
  
  // Función para limpiar mensajes de error
  const cleanErrorMessage = (message) => {
    if (typeof message !== 'string') {
      return 'Error interno del servidor';
    }
    
    // Si el mensaje contiene referencias a objetos circulares, limpiarlo
    if (message.includes('ClientRequest') || message.includes('TLSSocket') || message.includes('circular structure')) {
      return 'Error de conexión con servicio externo';
    }
    
    return message;
  };
  
  errorLogger.error('Request error occurred', {
    error: cleanErrorMessage(err.message),
    stack: err.stack,
    url: req.url,
    method: req.method,
    body: safeStringify(req.body),
    params: safeStringify(req.params),
    query: safeStringify(req.query)
  });
  
  const cleanMessage = cleanErrorMessage(err.message);
  
  res.status(500).json({ 
    error: 'Error interno del servidor',
    requestId: req.requestId,
    message: process.env.NODE_ENV === 'development' ? cleanMessage : 'Algo salió mal'
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