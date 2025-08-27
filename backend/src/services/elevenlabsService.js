const axios = require('axios');
const moment = require('moment');
const logger = require('../utils/logger');

class ElevenLabsService {
  constructor() {
    this.apiKey = process.env.ELEVENLABS_API_KEY;
    this.agentId = process.env.ELEVENLABS_AGENT_ID;
    this.baseUrl = process.env.ELEVENLABS_BASE_URL || 'https://api.elevenlabs.io/v1';
    
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
      
      const response = await axios.get(
        `${this.baseUrl}/convai/conversations`,
        {
          headers: {
            'xi-api-key': this.apiKey
          },
          params: {
            agent_id: this.agentId,
            start_time: startTimestamp,
            end_time: endTimestamp,
            page_size: 1000
          }
        }
      );

      // Limpiar datos de respuesta para evitar referencias circulares
      const cleanResponseData = this.cleanResponseData(response.data);
      const calls = cleanResponseData.conversations || [];
      
      logger.info(`Se obtuvieron ${calls.length} llamadas`);
      
      return calls.map(call => this.formatCallData(call));
    } catch (error) {
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
    return {
      id: call.conversation_id,
      name: call.caller_name || 'Desconocido',
      phone: call.caller_phone || '',
      status: call.status || 'unknown',
      duration: call.duration || 0,
      transcript: call.transcript || '',
      startTime: call.start_time ? moment.unix(call.start_time).format('YYYY-MM-DD HH:mm:ss') : null,
      endTime: call.end_time ? moment.unix(call.end_time).format('YYYY-MM-DD HH:mm:ss') : null
      // Eliminamos rawData: call para evitar referencias circulares
    };
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