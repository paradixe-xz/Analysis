const path = require('path');

module.exports = {
  // Configuración del servidor
  server: {
    port: process.env.PORT || 3001,
    env: process.env.NODE_ENV || 'development',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000'
  },

  // Configuración de ElevenLabs
  elevenlabs: {
    apiKey: process.env.ELEVENLABS_API_KEY,
    agentId: process.env.ELEVENLABS_AGENT_ID,
    baseUrl: process.env.ELEVENLABS_BASE_URL || 'https://api.elevenlabs.io/v1',
    timeout: parseInt(process.env.ELEVENLABS_TIMEOUT) || 30000
  },

  // Configuración de archivos y directorios
  paths: {
    data: process.env.DATA_DIRECTORY || path.join(__dirname, '../../data'),
    logs: process.env.LOGS_DIRECTORY || path.join(__dirname, '../../logs'),
    syncConversations: path.join(__dirname, '../../../syncConversations')
  },

  // Configuración de análisis
  analysis: {
    maxCallsPerRequest: parseInt(process.env.MAX_CALLS_PER_REQUEST) || 1000,
    timeout: parseInt(process.env.ANALYSIS_TIMEOUT) || 30000,
    defaultConfidenceThreshold: 0.4
  },

  // Configuración de exportación
  export: {
    maxRows: parseInt(process.env.EXCEL_MAX_ROWS) || 10000,
    defaultFormat: 'xlsx'
  },

  // Configuración de rate limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // máximo 100 requests por ventana
    message: 'Demasiadas solicitudes, intente de nuevo más tarde'
  },

  // Configuración de CORS
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    optionsSuccessStatus: 200
  },

  // Configuración de logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    maxFileSize: 5242880, // 5MB
    maxFiles: 5
  }
};