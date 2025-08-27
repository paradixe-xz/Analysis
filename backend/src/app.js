const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();
const { v4: uuidv4 } = require('uuid');

const logger = require('./utils/logger');
const callRoutes = require('./routes/callRoutes');
const analysisRoutes = require('./routes/analysisRoutes');
const exportRoutes = require('./routes/exportRoutes');

const app = express();
const PORT = process.env.PORT || 3001;

// Configurar trust proxy para manejar headers de proxy correctamente
// Esto es necesario cuando la app está detrás de un proxy (como en RunPod)
app.set('trust proxy', true);

// Middleware de seguridad
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting con configuración mejorada para proxies
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // límite de 100 requests por ventana de tiempo
  standardHeaders: true,
  legacyHeaders: false,
  // Configuración específica para proxies
  validate: {
    xForwardedForHeader: false, // Deshabilitar validación del header X-Forwarded-For
    trustProxy: false // Deshabilitar validación de trust proxy
  },
  // Función personalizada para generar keys que evite problemas con headers
  keyGenerator: (req) => {
    // Usar IP real del cliente, considerando el proxy
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
    return clientIP;
  }
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
          if (value.constructor && value.constructor.name === 'HttpClientResponse') {
            return '[HttpClientResponse]';
          }
          if (value.constructor && value.constructor.name === 'HttpClientRequest') {
            return '[HttpClientRequest]';
          }
          // Detectar referencias circulares
          if (value.hasOwnProperty && value.hasOwnProperty('_httpMessage')) {
            return '[HTTP Object with circular reference]';
          }
          // Detectar objetos de Axios
          if (value.config && value.request) {
            return '[Axios Response Object]';
          }
          if (value.headers && value.status) {
            return '[HTTP Response Object]';
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
    if (message.includes('ClientRequest') || message.includes('TLSSocket') || 
        message.includes('circular structure') || message.includes('Converting circular structure')) {
      return 'Error de conexión con servicio externo';
    }
    
    return message;
  };
  
  // Función para limpiar el stack trace
  const cleanStack = (stack) => {
    if (typeof stack !== 'string') return '';
    
    // Remover líneas que contengan referencias circulares
    return stack
      .split('\n')
      .filter(line => !line.includes('circular structure') && !line.includes('Converting circular'))
      .slice(0, 10) // Limitar a 10 líneas
      .join('\n');
  };
  
  errorLogger.error('Request error occurred', {
    error: cleanErrorMessage(err.message),
    stack: cleanStack(err.stack),
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