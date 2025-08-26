# Call Analysis Backend API

Backend API para el sistema de análisis de llamadas de ElevenLabs.

## Características

- 🚀 API REST con Express.js
- 📊 Análisis automático de llamadas con 10 categorías
- 📅 Filtrado por rango de fechas
- 📈 Estadísticas y analytics
- 📄 Exportación a Excel
- 🔒 Seguridad con Helmet y Rate Limiting
- 📝 Logging completo con Winston

## Instalación

```bash
# Instalar dependencias
npm install

# Copiar archivo de configuración
cp .env.example .env

# Configurar variables de entorno en .env
# ELEVENLABS_API_KEY=tu_api_key
# ELEVENLABS_AGENT_ID=tu_agent_id
```

## Uso

```bash
# Desarrollo
npm run dev

# Producción
npm start

# Tests
npm test
```

## API Endpoints

### Llamadas
- `GET /api/calls/date-range` - Obtener llamadas por rango de fechas
- `GET /api/calls/:id/transcript` - Obtener transcript de una llamada
- `GET /api/calls/health` - Health check del servicio

### Análisis
- `POST /api/analysis/analyze-calls` - Analizar llamadas por rango de fechas
- `POST /api/analysis/analyze-single` - Analizar una llamada individual
- `GET /api/analysis/categories` - Obtener categorías disponibles
- `GET /api/analysis/health` - Health check del servicio

### Exportación
- `POST /api/export/excel` - Exportar resultados a Excel
- `GET /api/export/health` - Health check del servicio

## Categorías de Clasificación

1. **Failed** - Llamadas fallidas
2. **Hangup** - Llamadas colgadas
3. **Lead** - Prospectos interesados
4. **No Answer** - Sin respuesta
5. **Non-Viable Client** - Cliente no viable
6. **Not Interested** - No interesado
7. **Recall** - Volver a llamar
8. **Voicemail** - Buzón de voz
9. **Wrong Number** - Número equivocado
10. **Completed** - Completadas exitosamente

## Estructura del Proyecto

```
backend/
├── src/
│   ├── config/          # Configuración
│   ├── controllers/     # Controladores (futuro)
│   ├── middleware/      # Middleware personalizado (futuro)
│   ├── models/          # Modelos de datos (futuro)
│   ├── routes/          # Rutas de la API
│   ├── services/        # Lógica de negocio
│   ├── utils/           # Utilidades
│   └── app.js           # Aplicación principal
├── data/                # Datos locales
├── logs/                # Archivos de log
├── package.json
└── README.md
```

## Variables de Entorno

```env
# Servidor
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# ElevenLabs
ELEVENLABS_API_KEY=your_api_key
ELEVENLABS_AGENT_ID=your_agent_id
ELEVENLABS_BASE_URL=https://api.elevenlabs.io/v1

# Configuración
DATA_DIRECTORY=./data
LOGS_DIRECTORY=./logs
MAX_CALLS_PER_REQUEST=1000
ANALYSIS_TIMEOUT=30000
EXCEL_MAX_ROWS=10000
```

## Desarrollo

El servidor incluye:
- Hot reload con nodemon
- Logging detallado
- Manejo de errores
- Validación de entrada
- Rate limiting
- CORS configurado
- Seguridad con Helmet

## Logs

Los logs se guardan en:
- `logs/combined.log` - Todos los logs
- `logs/error.log` - Solo errores

En desarrollo también se muestran en consola.