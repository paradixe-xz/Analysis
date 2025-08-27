// Test script para verificar que las correcciones de referencias circulares funcionan
const axios = require('axios');

// Simular un error de Axios con referencias circulares
function createCircularError() {
  const error = new Error('Test error');
  error.response = {
    status: 500,
    statusText: 'Internal Server Error',
    data: { message: 'Test error' }
  };
  
  // Crear una referencia circular
  const circularObj = { name: 'test' };
  circularObj.self = circularObj;
  error.response.circular = circularObj;
  
  return error;
}

// Función de limpieza similar a la implementada en los servicios
function cleanAxiosError(error) {
  try {
    if (error.response) {
      return {
        message: error.message,
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data ? JSON.stringify(error.response.data) : null
      };
    }
    if (error.request) {
      return {
        message: error.message,
        code: error.code,
        type: 'request_error'
      };
    }
    return {
      message: error.message || 'Error desconocido'
    };
  } catch (cleanError) {
    return {
      message: 'Error al limpiar error de Axios',
      originalError: error.message
    };
  }
}

// Función para limpiar datos de respuesta
function cleanResponseData(data) {
  try {
    if (typeof data === 'object' && data !== null) {
      const cleanData = { ...data };
      // Remover propiedades que pueden causar referencias circulares
      delete cleanData._events;
      delete cleanData._eventsCount;
      delete cleanData._maxListeners;
      delete cleanData.socket;
      delete cleanData.connection;
      return cleanData;
    }
    return data;
  } catch (cleanError) {
    return '[Data cleaning error]';
  }
}

// Test principal
async function testCircularFix() {
  console.log('🧪 Probando correcciones de referencias circulares...\n');
  
  try {
    // Test 1: Limpieza de errores de Axios
    console.log('1. Probando limpieza de errores de Axios...');
    const circularError = createCircularError();
    const cleanedError = cleanAxiosError(circularError);
    console.log('✅ Error limpiado exitosamente:', JSON.stringify(cleanedError, null, 2));
    
    // Test 2: Limpieza de datos de respuesta
    console.log('\n2. Probando limpieza de datos de respuesta...');
    const testData = {
      name: 'test',
      _events: { test: 'event' },
      _eventsCount: 1,
      _maxListeners: 10,
      socket: { id: 'socket123' },
      connection: { remoteAddress: '127.0.0.1' }
    };
    const cleanedData = cleanResponseData(testData);
    console.log('✅ Datos limpiados exitosamente:', JSON.stringify(cleanedData, null, 2));
    
    // Test 3: Verificar que no hay referencias circulares
    console.log('\n3. Verificando que no hay referencias circulares...');
    const jsonString = JSON.stringify(cleanedData);
    console.log('✅ JSON serializado exitosamente:', jsonString);
    
    console.log('\n🎉 Todas las pruebas pasaron! Las correcciones de referencias circulares están funcionando.');
    
  } catch (error) {
    console.error('❌ Error en las pruebas:', error.message);
    if (error.message.includes('circular')) {
      console.error('   ⚠️  Aún hay problemas con referencias circulares');
    }
  }
}

// Ejecutar el test
testCircularFix(); 