const express = require('express');
const router = express.Router();
const elevenlabsService = require('../services/elevenlabsService');
const logger = require('../utils/logger');

/**
 * GET /api/calls/date-range
 * Obtiene llamadas por rango de fechas
 */
router.get('/date-range', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Validación de parámetros
    if (!startDate || !endDate) {
      return res.status(400).json({
        error: 'Se requieren startDate y endDate',
        example: '/api/calls/date-range?startDate=2024-01-01&endDate=2024-01-31'
      });
    }

    // Validación de formato de fecha
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
      return res.status(400).json({
        error: 'Formato de fecha inválido. Use YYYY-MM-DD'
      });
    }

    // Validación de rango de fechas
    if (new Date(startDate) > new Date(endDate)) {
      return res.status(400).json({
        error: 'La fecha de inicio debe ser anterior a la fecha de fin'
      });
    }

    logger.info(`Solicitando llamadas desde ${startDate} hasta ${endDate}`);
    
    const calls = await elevenlabsService.getCallsByDateRange(startDate, endDate);
    
    res.json({
      success: true,
      data: calls,
      count: calls.length,
      dateRange: { startDate, endDate },
      retrievedAt: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('Error obteniendo llamadas por rango de fechas:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

/**
 * GET /api/calls/:id/transcript
 * Obtiene el transcript completo de una llamada específica
 */
router.get('/:id/transcript', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        error: 'ID de conversación requerido'
      });
    }

    logger.info(`Obteniendo transcript para conversación ${id}`);
    
    const transcript = await elevenlabsService.getConversationTranscript(id);
    
    res.json({
      success: true,
      data: {
        conversationId: id,
        transcript,
        retrievedAt: new Date().toISOString()
      }
    });
    
  } catch (error) {
    logger.error(`Error obteniendo transcript para ${req.params.id}:`, error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

/**
 * GET /api/calls/health
 * Health check para el servicio de llamadas
 */
router.get('/health', (req, res) => {
  res.json({
    service: 'calls',
    status: 'OK',
    timestamp: new Date().toISOString(),
    endpoints: [
      'GET /api/calls/date-range',
      'GET /api/calls/:id/transcript',
      'GET /api/calls/health'
    ]
  });
});

module.exports = router;