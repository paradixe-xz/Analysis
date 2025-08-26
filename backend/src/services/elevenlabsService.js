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

      const calls = response.data.conversations || [];
      logger.info(`Se obtuvieron ${calls.length} llamadas`);
      
      return calls.map(call => this.formatCallData(call));
    } catch (error) {
      logger.error('Error obteniendo llamadas de ElevenLabs:', error);
      throw new Error(`Error al obtener llamadas: ${error.message}`);
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
      endTime: call.end_time ? moment.unix(call.end_time).format('YYYY-MM-DD HH:mm:ss') : null,
      rawData: call
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

      return response.data.transcript || '';
    } catch (error) {
      logger.error(`Error obteniendo transcript para ${conversationId}:`, error);
      return '';
    }
  }
}

module.exports = new ElevenLabsService();