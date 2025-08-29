// Configuración de la API
const API_CONFIG = {
  baseURL: 'http://localhost:3001/api', // URL base del backend con prefijo /api
  endpoints: {
    calls: '/calls',
    analysis: '/analysis/analyze-calls', // Ajustado para coincidir con la ruta del backend
    export: '/export',
  },
  defaultHeaders: {
    'Content-Type': 'application/json',
  },
};

export default API_CONFIG;
