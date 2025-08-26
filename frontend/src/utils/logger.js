class Logger {
  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  debug(message, data = {}) {
    if (this.isDevelopment) {
      console.log(`🐛 [DEBUG] ${message}`, data);
    }
  }

  info(message, data = {}) {
    if (this.isDevelopment) {
      console.log(`ℹ️ [INFO] ${message}`, data);
    }
  }

  warn(message, data = {}) {
    console.warn(`⚠️ [WARN] ${message}`, data);
  }

  error(message, error = null, data = {}) {
    console.error(`❌ [ERROR] ${message}`, { error, ...data });
    
    // En producción, podrías enviar errores a un servicio de monitoreo
    if (!this.isDevelopment && error) {
      // Ejemplo: enviar a Sentry, LogRocket, etc.
    }
  }

  api(method, url, data = {}) {
    if (this.isDevelopment) {
      console.log(`🌐 [API] ${method} ${url}`, data);
    }
  }
}

export default new Logger();