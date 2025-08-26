const logger = require('../utils/logger');
const ollamaService = require('./ollamaService');

class AnalysisService {
  constructor() {
    // Categorías de clasificación
    this.categories = {
      FAILED: 'Failed',
      HANGUP: 'Hangup',
      LEAD: 'Lead',
      NO_ANSWER: 'No Answer',
      NON_VIABLE_CLIENT: 'Non-Viable Client',
      NOT_INTERESTED: 'Not Interested',
      RECALL: 'Recall',
      VOICEMAIL: 'Voicemail',
      WRONG_NUMBER: 'Wrong Number',
      COMPLETED: 'Completed'
    };
  }

  /**
   * Analiza una llamada usando Ollama IA
   */
  async analyzeCall(call) {
    try {
      logger.info(`Analizando llamada ${call.id} con Ollama IA`);
      return await ollamaService.analyzeCall(call);
    } catch (error) {
      logger.error('Error en análisis con Ollama:', error);
      // Fallback al análisis por keywords
      return this.analyzeCallFallback(call);
    }
  }

  /**
   * Análisis de respaldo por keywords (método original)
   */
  analyzeCallFallback(call) {
    try {
      const transcript = (call.transcript || '').toLowerCase();
      const status = (call.status || '').toLowerCase();
      const duration = call.duration || 0;

      // Análisis basado en duración
      if (duration < 5) {
        return this.createAnalysisResult(
          call,
          this.categories.NO_ANSWER,
          'Llamada muy corta, probablemente no contestaron',
          0.8
        );
      }

      // Análisis basado en status de ElevenLabs
      const statusCategory = this.analyzeByStatus(status);
      if (statusCategory) {
        return this.createAnalysisResult(
          call,
          statusCategory.category,
          statusCategory.comment,
          statusCategory.confidence
        );
      }

      // Análisis basado en transcript
      const transcriptAnalysis = this.analyzeTranscript(transcript);
      if (transcriptAnalysis) {
        return this.createAnalysisResult(
          call,
          transcriptAnalysis.category,
          transcriptAnalysis.comment,
          transcriptAnalysis.confidence
        );
      }

      // Clasificación por defecto
      return this.createAnalysisResult(
        call,
        this.categories.FAILED,
        'No se pudo clasificar automáticamente',
        0.3
      );

    } catch (error) {
      logger.error('Error analizando llamada:', error);
      return this.createAnalysisResult(
        call,
        this.categories.FAILED,
        'Error en el análisis',
        0.1
      );
    }
  }

  /**
   * Analiza basado en el status de ElevenLabs
   * @param {string} status - Status de la llamada
   * @returns {Object|null} Resultado del análisis
   */
  analyzeByStatus(status) {
    const statusMappings = {
      'completed': {
        category: this.categories.COMPLETED,
        comment: 'Llamada completada según ElevenLabs',
        confidence: 0.9
      },
      'no_answer': {
        category: this.categories.NO_ANSWER,
        comment: 'No hubo respuesta',
        confidence: 0.9
      },
      'busy': {
        category: this.categories.FAILED,
        comment: 'Línea ocupada',
        confidence: 0.8
      },
      'failed': {
        category: this.categories.FAILED,
        comment: 'Llamada falló',
        confidence: 0.9
      }
    };

    return statusMappings[status] || null;
  }

  /**
   * Analiza el transcript para clasificar
   * @param {string} transcript - Transcript de la llamada
   * @returns {Object|null} Resultado del análisis
   */
  analyzeTranscript(transcript) {
    if (!transcript || transcript.length < 10) {
      return {
        category: this.categories.NO_ANSWER,
        comment: 'Transcript muy corto o vacío',
        confidence: 0.7
      };
    }

    let bestMatch = null;
    let highestScore = 0;

    // Buscar coincidencias con palabras clave
    for (const [category, keywords] of Object.entries(this.keywords)) {
      const score = this.calculateKeywordScore(transcript, keywords);
      if (score > highestScore) {
        highestScore = score;
        bestMatch = {
          category,
          score,
          confidence: Math.min(score / keywords.length, 0.95)
        };
      }
    }

    if (bestMatch && bestMatch.confidence > 0.4) {
      return {
        category: bestMatch.category,
        comment: `Clasificado por análisis de transcript (confianza: ${Math.round(bestMatch.confidence * 100)}%)`,
        confidence: bestMatch.confidence
      };
    }

    return null;
  }

  /**
   * Calcula el score de palabras clave en el transcript
   * @param {string} transcript - Transcript a analizar
   * @param {Array} keywords - Palabras clave a buscar
   * @returns {number} Score de coincidencias
   */
  calculateKeywordScore(transcript, keywords) {
    let score = 0;
    for (const keyword of keywords) {
      if (transcript.includes(keyword.toLowerCase())) {
        score += 1;
      }
    }
    return score;
  }

  /**
   * Crea el resultado del análisis
   * @param {Object} call - Datos de la llamada
   * @param {string} category - Categoría asignada
   * @param {string} comment - Comentario del análisis
   * @param {number} confidence - Nivel de confianza
   * @returns {Object} Resultado formateado
   */
  createAnalysisResult(call, category, comment, confidence) {
    return {
      id: call.id,
      name: call.name,
      phone: call.phone,
      status: call.status,
      duration: call.duration,
      transcript: call.transcript,
      startTime: call.startTime,
      endTime: call.endTime,
      analysis: {
        category,
        comment,
        confidence: Math.round(confidence * 100),
        analyzedAt: new Date().toISOString()
      }
    };
  }

  /**
   * Analiza múltiples llamadas
   */
  async analyzeCalls(calls) {
    logger.info(`Iniciando análisis de ${calls.length} llamadas con IA`);
    
    const results = [];
    
    // Procesar llamadas en lotes para no sobrecargar Ollama
    const batchSize = 5;
    for (let i = 0; i < calls.length; i += batchSize) {
      const batch = calls.slice(i, i + batchSize);
      const batchPromises = batch.map(call => this.analyzeCall(call));
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Pequeña pausa entre lotes
      if (i + batchSize < calls.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    const stats = this.generateAnalysisStats(results);
    
    return {
      results,
      stats,
      totalCalls: calls.length,
      analyzedAt: new Date().toISOString()
    };
  }

  /**
   * Genera estadísticas del análisis
   * @param {Array} results - Resultados del análisis
   * @returns {Object} Estadísticas
   */
  generateAnalysisStats(results) {
    const stats = {};
    
    // Contar por categoría
    Object.values(this.categories).forEach(category => {
      stats[category] = results.filter(r => r.analysis.category === category).length;
    });
    
    // Confianza promedio
    const avgConfidence = results.reduce((sum, r) => sum + r.analysis.confidence, 0) / results.length;
    stats.averageConfidence = Math.round(avgConfidence);
    
    return stats;
  }
}

module.exports = new AnalysisService();