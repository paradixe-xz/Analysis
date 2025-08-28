// Configuración de la API
const API_CONFIG = {
  baseURL: 'http://localhost:3001', // URL del backend local
  endpoints: {
    calls: '/calls',
    analysis: '/analysis',
    export: '/export',
  },
  defaultHeaders: {
    'Content-Type': 'application/json',
  },
};

export default API_CONFIG;
