const { Ollama } = require('ollama');
const logger = require('../utils/logger');

class OllamaService {
  constructor() {
    this.ollama = new Ollama({
      host: process.env.OLLAMA_HOST || 'http://localhost:11434'
    });
    // Usar específicamente el modelo callAnalyser
    this.model = 'callAnalyser';
    
    // Categorías disponibles para clasificación
    this.categories = [
      'Failed', 'Hangup', 'Lead', 'No Answer', 'Non-Viable Client',
      'Not Interested', 'Recall', 'Voicemail', 'Wrong Number', 'Completed'
    ];
  }

  /**
   * Analiza una llamada usando el modelo callAnalyser de Ollama
   */
  async analyzeCall(call) {
    try {
      logger.info(`Analizando llamada ${call.id} con modelo callAnalyser`);
      
      const prompt = this.createAnalysisPrompt(call);
      
      const response = await this.ollama.chat({
        model: this.model,
        messages: [{
          role: 'user',
          content: prompt
        }],
        stream: false,
        options: {
          temperature: 0.3, // Más determinístico para clasificación
          top_p: 0.9
        }
      });

      return this.parseAnalysisResponse(response.message.content, call);
    } catch (error) {
      logger.error('Error analizando llamada con callAnalyser:', error);
      // Fallback al análisis por keywords si Ollama falla
      return this.fallbackAnalysis(call);
    }
  }

  /**
   * Crea el prompt especializado para análisis de llamadas
   */
  createAnalysisPrompt(call) {
    return `
Eres un experto analista de llamadas telefónicas de ventas. Tu tarea es clasificar la siguiente llamada en una de estas categorías EXACTAS:

CATEGORÍAS DISPONIBLES:
- Failed: Llamada falló técnicamente
- Hangup: Cliente colgó abruptamente
- Lead: Cliente mostró interés genuino
- No Answer: No hubo respuesta
- Non-Viable Client: Cliente no califica para el producto/servicio
- Not Interested: Cliente expresó desinterés claramente
- Recall: Cliente pidió ser contactado más tarde
- Voicemail: Se dejó mensaje en buzón de voz
- Wrong Number: Número equivocado
- Completed: Llamada completada exitosamente

DATOS DE LA LLAMADA:
- Nombre: ${call.caller_name || 'N/A'}
- Teléfono: ${call.caller_number || 'N/A'}
- Duración: ${call.duration_seconds || 0} segundos
- Estado: ${call.status || 'N/A'}
- Transcripción: ${call.transcript || 'Sin transcripción disponible'}

INSTRUCCIONES:
1. Analiza cuidadosamente la transcripción y el contexto
2. Considera la duración de la llamada
3. Evalúa el tono y contenido de la conversación
4. Asigna una categoría que mejor represente el resultado
5. Proporciona un comentario específico y útil
6. Califica tu confianza del 0 al 1

Responde ÚNICAMENTE en este formato JSON:
{
  "category": "[una de las categorías exactas]",
  "comment": "[comentario específico de 10-50 palabras explicando la clasificación]",
  "confidence": [número decimal entre 0 y 1]
}

No incluyas texto adicional fuera del JSON.`;
  }

  /**
   * Parsea la respuesta del modelo callAnalyser
   */
  parseAnalysisResponse(response, call) {
    try {
      // Extraer JSON de la respuesta
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No se encontró JSON válido en la respuesta del modelo');
      }

      const analysis = JSON.parse(jsonMatch[0]);
      
      // Validar categoría
      if (!this.categories.includes(analysis.category)) {
        logger.warn(`Categoría inválida detectada: ${analysis.category}`);
        analysis.category = 'Failed';
        analysis.comment = 'Categoría no válida detectada por IA, clasificado como Failed';
        analysis.confidence = 0.3;
      }

      // Validar confidence
      if (typeof analysis.confidence !== 'number' || analysis.confidence < 0 || analysis.confidence > 1) {
        analysis.confidence = 0.5;
      }

      // Validar comment
      if (!analysis.comment || typeof analysis.comment !== 'string') {
        analysis.comment = 'Análisis automático con callAnalyser';
      }

      return {
        id: call.id,
        name: call.caller_name || 'Desconocido',
        phone: call.caller_number || 'N/A',
        status: call.status || 'unknown',
        duration: call.duration_seconds || 0,
        transcript: call.transcript || '',
        startTime: call.created_at || new Date().toISOString(),
        endTime: call.updated_at || new Date().toISOString(),
        analysis: {
          category: analysis.category,
          comment: analysis.comment,
          confidence: analysis.confidence,
          analyzedAt: new Date().toISOString(),
          model: 'callAnalyser'
        }
      };
    } catch (error) {
      logger.error('Error parseando respuesta de callAnalyser:', error);
      return this.fallbackAnalysis(call);
    }
  }

  /**
   * Análisis de respaldo si el modelo callAnalyser falla
   */
  fallbackAnalysis(call) {
    let category = 'Failed';
    let comment = 'Análisis de respaldo - modelo callAnalyser no disponible';
    let confidence = 0.4;

    // Análisis básico por estado y duración
    if (call.status) {
      const status = call.status.toLowerCase();
      if (status.includes('completed') || status.includes('answered')) {
        category = 'Completed';
        comment = 'Llamada completada según estado del sistema';
        confidence = 0.7;
      } else if (status.includes('no-answer') || status.includes('unanswered')) {
        category = 'No Answer';
        comment = 'Sin respuesta según estado del sistema';
        confidence = 0.8;
      } else if (status.includes('busy')) {
        category = 'Failed';
        comment = 'Línea ocupada según estado del sistema';
        confidence = 0.8;
      }
    }

    // Considerar duración
    if (call.duration_seconds) {
      if (call.duration_seconds < 10) {
        category = 'Hangup';
        comment = 'Llamada muy corta, posible colgada';
        confidence = 0.6;
      } else if (call.duration_seconds > 60) {
        category = 'Completed';
        comment = 'Llamada larga, probablemente completada';
        confidence = 0.6;
      }
    }

    return {
      id: call.id,
      name: call.caller_name || 'Desconocido',
      phone: call.caller_number || 'N/A',
      status: call.status || 'unknown',
      duration: call.duration_seconds || 0,
      transcript: call.transcript || '',
      startTime: call.created_at || new Date().toISOString(),
      endTime: call.updated_at || new Date().toISOString(),
      analysis: {
        category,
        comment,
        confidence,
        analyzedAt: new Date().toISOString(),
        model: 'fallback'
      }
    };
  }

  /**
   * Verifica si el modelo callAnalyser está disponible
   */
  async checkHealth() {
    try {
      const models = await this.ollama.list();
      const hasCallAnalyser = models.models.some(model => model.name === this.model);
      
      if (!hasCallAnalyser) {
        return { 
          status: 'model_not_found', 
          error: `Modelo '${this.model}' no encontrado. Modelos disponibles: ${models.models.map(m => m.name).join(', ')}` 
        };
      }
      
      return { status: 'healthy', model: this.model };
    } catch (error) {
      logger.error('Ollama no disponible:', error);
      return { status: 'unhealthy', error: error.message };
    }
  }

  /**
   * Obtiene información del modelo callAnalyser
   */
  async getModelInfo() {
    try {
      const info = await this.ollama.show({ model: this.model });
      return {
        name: this.model,
        size: info.size,
        modified: info.modified_at,
        details: info.details
      };
    } catch (error) {
      logger.error('Error obteniendo información del modelo:', error);
      return null;
    }
  }
}

module.exports = new OllamaService();