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
      
      // Paginación: recorrer todas las páginas usando next_cursor
      const allCalls = [];
      let nextCursor = null;
      const pageSize = 100; // permitido por la API
      let page = 1;
      const maxPages = 100; // seguridad para evitar bucles infinitos

      do {
        // Debug logging de la request
        const requestUrl = `${this.baseUrl}/convai/conversations`;
        const requestParams = {
          agent_id: this.agentId,
          start_time: startTimestamp,
          end_time: endTimestamp,
          page_size: pageSize,
          cursor: nextCursor || undefined
        };
        
        logger.info('Making request to ElevenLabs (paged):', {
          url: requestUrl,
          page,
          cursor: nextCursor,
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

        // Resumen de la página
        const conversations = Array.isArray(response.data?.conversations) ? response.data.conversations : [];
        logger.info('Página recibida de ElevenLabs:', {
          page,
          received: conversations.length,
          has_more: response.data?.has_more,
          next_cursor: response.data?.next_cursor
        });

        // Formatear y acumular
        for (let i = 0; i < conversations.length; i++) {
          const formatted = this.formatCallData(conversations[i]);
          if (formatted) {
            // Obtener el transcript completo para esta conversación
            try {
              const fullTranscript = await this.getConversationTranscript(conversations[i].conversation_id);
              formatted.transcript = fullTranscript || formatted.transcript;
            } catch (error) {
              logger.error(`Error obteniendo transcript para ${conversations[i].conversation_id}:`, error);
              // Mantener el resumen del transcript si hay un error
            }
            allCalls.push(formatted);
          }
        }

        // Actualizar cursor/página
        nextCursor = response.data?.next_cursor || null;
        page += 1;
      } while (nextCursor && page <= maxPages);

      logger.info(`Total de llamadas procesadas (todas las páginas): ${allCalls.length}`);
      
      return allCalls;
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
      logger.info(`Solicitando transcript para conversación: ${conversationId}`);
      
      const response = await axios.get(
        `${this.baseUrl}/convai/conversations/${conversationId}`,
        {
          headers: {
            'xi-api-key': this.apiKey,
            'Content-Type': 'application/json'
          },
          timeout: 30000 // 30 segundos de timeout
        }
      );

      // Limpiar datos de respuesta para evitar referencias circulares
      const cleanResponseData = this.cleanResponseData(response.data);
      
      // Verificar si hay un transcript en la respuesta
      if (cleanResponseData.transcript) {
        logger.info(`Transcript obtenido para ${conversationId} (${cleanResponseData.transcript.length} caracteres)`);
        return cleanResponseData.transcript;
      } 
      
      // Si no hay transcript, intentar extraerlo de los mensajes
      if (cleanResponseData.messages && Array.isArray(cleanResponseData.messages)) {
        const transcript = cleanResponseData.messages
          .map(msg => `${msg.role === 'user' ? 'Cliente' : 'Agente'}: ${msg.text || ''}`)
          .join('\n\n');
          
        if (transcript) {
          logger.info(`Transcript construido a partir de mensajes para ${conversationId}`);
          return transcript;
        }
      }
      
      logger.warn(`No se pudo obtener el transcript para ${conversationId}`, {
        responseKeys: Object.keys(cleanResponseData)
      });
      
      return '';
    } catch (error) {
      const cleanError = this.cleanAxiosError(error);
      logger.error(`Error obteniendo transcript para ${conversationId}:`, cleanError);
      return '';
    }
  }
}

module.exports = new ElevenLabsService();