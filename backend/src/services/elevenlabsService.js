const axios = require('axios');
const moment = require('moment');
const logger = require('../utils/logger');

class ElevenLabsService {
  constructor() {
    this.apiKey = process.env.ELEVENLABS_API_KEY;
    this.agentId = process.env.ELEVENLABS_AGENT_ID;
    this.baseUrl = process.env.ELEVENLABS_BASE_URL || 'https://api.elevenlabs.io/v1';
    
    // Debug logging
    logger.info('ElevenLabs Service initialized with:', {
      apiKey: this.apiKey ? `${this.apiKey.substring(0, 10)}...` : 'undefined',
      agentId: this.agentId,
      baseUrl: this.baseUrl
    });
    
    if (!this.apiKey || !this.agentId) {
      throw new Error('ElevenLabs API key y Agent ID son requeridos');
    }
  }

  /**
   * Limpia errores de axios para evitar referencias circulares
   */
  cleanAxiosError(error) {
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

  /**
   * Limpia datos de respuesta para evitar referencias circulares
   */
  cleanResponseData(data) {
    try {
      if (typeof data === 'object' && data !== null) {
        // Remover propiedades que pueden causar referencias circulares
        const cleanData = { ...data };
        delete cleanData._events;
        delete cleanData._eventsCount;
        delete cleanData._maxListeners;
        delete cleanData.socket;
        delete cleanData.connection;
        delete cleanData.httpVersion;
        delete cleanData.httpVersionMajor;
        delete cleanData.httpVersionMinor;
        delete cleanData.complete;
        delete cleanData.headers;
        delete cleanData.rawHeaders;
        delete cleanData.trailers;
        delete cleanData.rawTrailers;
        delete cleanData.upgrade;
        delete cleanData.url;
        delete cleanData.method;
        delete cleanData.statusCode;
        delete cleanData.statusMessage;
        delete cleanData.rawTrailers;
        delete cleanData.aborted;
        delete cleanData.abort;
        delete cleanData.destroy;
        delete cleanData.end;
        delete cleanData.write;
        delete cleanData.setTimeout;
        delete cleanData.setNoDelay;
        delete cleanData.setKeepAlive;
        delete cleanData.pipe;
        delete cleanData.unpipe;
        delete cleanData.on;
        delete cleanData.addListener;
        delete cleanData.removeListener;
        delete cleanData.removeAllListeners;
        delete cleanData.listeners;
        delete cleanData.listenerCount;
        delete cleanData.emit;
        delete cleanData.once;
        delete cleanData.prependListener;
        delete cleanData.prependOnceListener;
        delete cleanData.off;
        delete cleanData.setMaxListeners;
        delete cleanData.getMaxListeners;
        delete cleanData.eventNames;
        delete cleanData.rawListeners;
        delete cleanData.setMaxListeners;
        delete cleanData.getMaxListeners;
        delete cleanData.eventNames;
        delete cleanData.rawListeners;
        return cleanData;
      }
      return data;
    } catch (cleanError) {
      return '[Data cleaning error]';
    }
  }

  /**
   * Obtiene llamadas de ElevenLabs en un rango de fechas
   * @param {string} startDate - Fecha de inicio (YYYY-MM-DD)
   * @param {string} endDate - Fecha de fin (YYYY-MM-DD)
   * @returns {Promise<Array>} Array de llamadas
   */
  async getCallsByDateRange(startDate, endDate) {
    try {
      logger.info(`Obteniendo llamadas desde ${startDate} hasta ${endDate}`);
      
      const startTimestamp = moment(startDate).startOf('day').unix();
      const endTimestamp = moment(endDate).endOf('day').unix();
      
      // Debug logging de la request
      const requestUrl = `${this.baseUrl}/convai/conversations`;
      const requestParams = {
        agent_id: this.agentId,
        start_time: startTimestamp,
        end_time: endTimestamp,
        page_size: 100  // Reducido de 1000 a 100
      };
      
      logger.info('Making request to ElevenLabs:', {
        url: requestUrl,
        params: requestParams,
        headers: {
          'xi-api-key': this.apiKey ? `${this.apiKey.substring(0, 10)}...` : 'undefined'
        }
      });
      
      const response = await axios.get(requestUrl, {
        headers: {
          'xi-api-key': this.apiKey
        },
        params: requestParams
      });

      // Debug logging de la respuesta
      logger.info('=== RESPUESTA DE ELEVENLABS ===');
      logger.info('Status:', response.status);
      logger.info('Status Text:', response.statusText);
      logger.info('Response data type:', typeof response.data);
      logger.info('Response data keys:', Object.keys(response.data || {}));
      logger.info('Conversations array type:', typeof response.data.conversations);
      logger.info('Conversations array length:', response.data.conversations ? response.data.conversations.length : 'undefined');
      
      if (response.data.conversations && response.data.conversations.length > 0) {
        logger.info('Primera conversación:', JSON.stringify(response.data.conversations[0], null, 2));
      }
      logger.info('=== FIN RESPUESTA DE ELEVENLABS ===');

      // Procesar conversaciones
      const calls = [];
      if (response.data.conversations && Array.isArray(response.data.conversations)) {
        logger.info(`Procesando ${response.data.conversations.length} conversaciones`);
        
        for (let i = 0; i < response.data.conversations.length; i++) {
          const conversation = response.data.conversations[i];
          logger.info(`Procesando conversación ${i + 1}/${response.data.conversations.length}:`, {
            conversationId: conversation.conversation_id, // Usar el nombre correcto del campo
            status: conversation.status
          });
          
          const formattedCall = this.formatCallData(conversation);
          if (formattedCall) {
            calls.push(formattedCall);
            logger.info(`Conversación ${i + 1} formateada exitosamente`);
          } else {
            logger.error(`Conversación ${i + 1} falló al formatear`);
          }
        }
      } else {
        logger.error('No se encontraron conversaciones en la respuesta o no es un array');
        logger.error('Tipo de conversations:', typeof response.data.conversations);
        logger.error('Valor de conversations:', response.data.conversations);
      }
      
      logger.info(`Total de llamadas procesadas: ${calls.length}`);
      
      return calls;
    } catch (error) {
      // Debug logging del error
      logger.error('Error completo de Axios:', {
        message: error.message,
        code: error.code,
        response: error.response ? {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        } : 'no response',
        request: error.request ? 'request object exists' : 'no request'
      });
      
      const cleanError = this.cleanAxiosError(error);
      logger.error('Error obteniendo llamadas de ElevenLabs:', cleanError);
      throw new Error(`Error al obtener llamadas: ${cleanError.message}`);
    }
  }

  /**
   * Formatea los datos de una llamada
   * @param {Object} call - Datos raw de la llamada
   * @returns {Object} Datos formateados
   */
  formatCallData(call) {
    // Debug logging completo para ver qué datos recibimos
    logger.info('=== INICIO FORMATTING CALL DATA ===');
    logger.info('Call object completo:', JSON.stringify(call, null, 2));
    logger.info('Call type:', typeof call);
    logger.info('Call keys:', Object.keys(call || {}));
    
    // Verificar si call es válido
    if (!call || typeof call !== 'object') {
      logger.error('Call es null, undefined o no es un objeto:', call);
      return null;
    }
    
    // Logging de campos específicos usando los nombres REALES de ElevenLabs
    logger.info('Campos específicos (nombres reales de ElevenLabs):', {
      conversation_id: call.conversation_id,
      agent_name: call.agent_name,
      start_time_unix_secs: call.start_time_unix_secs,
      call_duration_secs: call.call_duration_secs,
      message_count: call.message_count,
      status: call.status,
      call_successful: call.call_successful,
      direction: call.direction,
      transcript_summary: call.transcript_summary,
      call_summary_title: call.call_summary_title
    });

    // Crear objeto formateado con los nombres CORRECTOS de ElevenLabs
    const formattedCall = {
      id: call.conversation_id || `unknown_${Date.now()}`,
      name: call.call_summary_title || call.agent_name || 'Sin título',
      phone: '', // ElevenLabs no proporciona número de teléfono
      status: call.status || 'unknown',
      duration: call.call_duration_secs || 0,
      messageCount: call.message_count || 0,
      callSuccessful: call.call_successful || false,
      direction: call.direction || 'inbound',
      timestamp: call.start_time_unix_secs ? new Date(call.start_time_unix_secs * 1000).toISOString() : new Date().toISOString(),
      transcript: call.transcript_summary || '',
      agentName: call.agent_name || 'Unknown Agent'
    };
    
    logger.info('Call formateado resultante:', formattedCall);
    logger.info('=== FIN FORMATTING CALL DATA ===');
    
    return formattedCall;
  }

  /**
   * Obtiene el transcript completo de una conversación
   * @param {string} conversationId - ID de la conversación
   * @returns {Promise<string>} Transcript completo
   */
  async getConversationTranscript(conversationId) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/convai/conversations/${conversationId}`,
        {
          headers: {
            'xi-api-key': this.apiKey
          }
        }
      );

      // Limpiar datos de respuesta para evitar referencias circulares
      const cleanResponseData = this.cleanResponseData(response.data);
      return cleanResponseData.transcript || '';
    } catch (error) {
      const cleanError = this.cleanAxiosError(error);
      logger.error(`Error obteniendo transcript para ${conversationId}:`, cleanError);
      return '';
    }
  }
}

module.exports = new ElevenLabsService();