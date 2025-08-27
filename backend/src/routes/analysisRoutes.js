const express = require('express');
const router = express.Router();
const elevenlabsService = require('../services/elevenlabsService');
const analysisService = require('../services/analysisService');
const logger = require('../utils/logger');

/**
 * POST /api/analysis/analyze-calls
 * Analiza llamadas por rango de fechas
 */
router.post('/analyze-calls', async (req, res) => {
  const startTime = Date.now();
  const contextLogger = req.logger || logger.withContext({
    service: 'analysis-routes',
    operation: 'analyze-calls',
    requestId: req.requestId
  });
  
  try {
    const { startDate, endDate } = req.body;
    
    contextLogger.info('Received analyze-calls request', {
      startDate,
      endDate,
      clientIP: req.ip
    });
    
    // Validación de parámetros
    if (!startDate || !endDate) {
      contextLogger.warn('Missing required parameters', {
        providedParams: { startDate: !!startDate, endDate: !!endDate }
      });
      
      return res.status(400).json({
        error: 'Se requieren startDate y endDate en el body',
        example: { startDate: '2024-01-01', endDate: '2024-01-31' }
      });
    }

    // Paginación (opcional)
    const page = Math.max(1, parseInt(req.body.page, 10) || 1);
    const rawPageSize = parseInt(req.body.pageSize, 10) || 100;
    const pageSize = Math.min(Math.max(1, rawPageSize), 200); // cap de seguridad

    // Validación de formato de fecha
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
      contextLogger.warn('Invalid date format', {
        startDate,
        endDate,
        expectedFormat: 'YYYY-MM-DD'
      });
      
      return res.status(400).json({
        error: 'Formato de fecha inválido. Use YYYY-MM-DD'
      });
    }

    contextLogger.info('Starting call retrieval from ElevenLabs');
    
    // Obtener llamadas de ElevenLabs (todas las páginas)
    const calls = await elevenlabsService.getCallsByDateRange(startDate, endDate);
    
    contextLogger.info('Calls retrieved from ElevenLabs', {
      totalCalls: calls.length,
      dateRange: { startDate, endDate }
    });
    
    if (calls.length === 0) {
      contextLogger.info('No calls found in date range');
      
      return res.json({
        success: true,
        message: 'No se encontraron llamadas en el rango de fechas especificado',
        data: {
          results: [],
          stats: { averageConfidence: 0 },
          totalCalls: 0,
          analyzedAt: new Date().toISOString(),
          page,
          pageSize,
          totalPages: 0,
          hasMore: false
        },
        dateRange: { startDate, endDate }
      });
    }

    // Calcular paginación
    const totalCalls = calls.length;
    const totalPages = Math.max(1, Math.ceil(totalCalls / pageSize));
    const currentPage = Math.min(page, totalPages);
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalCalls);
    const pageCalls = calls.slice(startIndex, endIndex);

    contextLogger.info('Starting call analysis process', {
      page: currentPage,
      pageSize,
      startIndex,
      endIndex
    });
    
    // Analizar llamadas de la página
    const analysisResult = await analysisService.analyzeCalls(pageCalls);
    
    logger.performance('Complete analysis process', startTime, {
      totalCalls,
      page: currentPage,
      pageSize,
      dateRange: { startDate, endDate },
      requestId: req.requestId
    });
    
    contextLogger.info('Analysis process completed successfully', {
      totalAnalyzed: analysisResult.totalCalls,
      categoriesFound: Object.keys(analysisResult.stats).length
    });
    
    // Inyectar metadatos de paginación y total global
    const responseData = {
      ...analysisResult,
      totalCalls,
      page: currentPage,
      pageSize,
      totalPages,
      hasMore: currentPage < totalPages
    };
    
    res.json({
      success: true,
      data: responseData,
      dateRange: { startDate, endDate }
    });
    
  } catch (error) {
    contextLogger.error('Error in analyze-calls endpoint', {
      error: error.message,
      stack: error.stack,
      requestBody: req.body
    });
    
    res.status(500).json({
      error: 'Error interno del servidor',
      message: error.message,
      requestId: req.requestId
    });
  }
});

/**
 * POST /api/analysis/analyze-single
 * Analiza una sola llamada
 */
router.post('/analyze-single', async (req, res) => {
  try {
    const callData = req.body;
    
    // Validación básica
    if (!callData || !callData.id) {
      return res.status(400).json({
        error: 'Datos de llamada requeridos con ID'
      });
    }

    logger.info(`Analizando llamada individual: ${callData.id}`);
    
    const result = await analysisService.analyzeCall(callData);
    
    res.json({
      success: true,
      data: result
    });
    
  } catch (error) {
    logger.error('Error analizando llamada individual:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

/**
 * GET /api/analysis/categories
 * Obtiene las categorías disponibles para clasificación
 */
router.get('/categories', (req, res) => {
  try {
    const categories = Object.values(analysisService.categories);
    
    res.json({
      success: true,
      data: {
        categories,
        total: categories.length,
        description: 'Categorías disponibles para clasificación de llamadas'
      }
    });
    
  } catch (error) {
    logger.error('Error obteniendo categorías:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

/**
 * GET /api/analysis/health
 * Health check para el servicio de análisis
 */
router.get('/health', (req, res) => {
  res.json({
    service: 'analysis',
    status: 'OK',
    timestamp: new Date().toISOString(),
    endpoints: [
      'POST /api/analysis/analyze-calls',
      'POST /api/analysis/analyze-single',
      'GET /api/analysis/categories',
      'GET /api/analysis/health'
    ]
  });
});

module.exports = router;