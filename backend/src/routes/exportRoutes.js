const express = require('express');
const router = express.Router();
const ExcelJS = require('exceljs');
const moment = require('moment');
const logger = require('../utils/logger');

/**
 * POST /api/export/excel
 * Exporta resultados de análisis a Excel
 */
router.post('/excel', async (req, res) => {
  try {
    const { results, stats, dateRange } = req.body;
    
    // Validación de datos
    if (!results || !Array.isArray(results)) {
      return res.status(400).json({
        error: 'Se requiere un array de resultados para exportar'
      });
    }

    if (results.length === 0) {
      return res.status(400).json({
        error: 'No hay datos para exportar'
      });
    }

    logger.info(`Generando archivo Excel con ${results.length} registros`);
    
    // Crear workbook
    const workbook = new ExcelJS.Workbook();
    
    // Metadatos del archivo
    workbook.creator = 'Call Analysis System';
    workbook.lastModifiedBy = 'B2J Team';
    workbook.created = new Date();
    workbook.modified = new Date();
    
    // Hoja de resultados
    const worksheet = workbook.addWorksheet('Análisis de Llamadas');
    
    // Configurar columnas
    worksheet.columns = [
      { header: 'ID', key: 'id', width: 15 },
      { header: 'Nombre', key: 'name', width: 20 },
      { header: 'Teléfono', key: 'phone', width: 15 },
      { header: 'Estado', key: 'status', width: 15 },
      { header: 'Duración (seg)', key: 'duration', width: 15 },
      { header: 'Fecha Inicio', key: 'startTime', width: 20 },
      { header: 'Fecha Fin', key: 'endTime', width: 20 },
      { header: 'Categoría', key: 'category', width: 20 },
      { header: 'Comentarios', key: 'comment', width: 40 },
      { header: 'Confianza (%)', key: 'confidence', width: 15 },
      { header: 'Transcripción', key: 'transcript', width: 60 }
    ];
    
    // Estilo del header
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    };
    worksheet.getRow(1).font.color = { argb: 'FFFFFFFF' };
    
    // Agregar datos
    results.forEach(result => {
      worksheet.addRow({
        id: result.id,
        name: result.name,
        phone: result.phone,
        status: result.status,
        duration: result.duration,
        startTime: result.startTime,
        endTime: result.endTime,
        category: result.analysis.category,
        comment: result.analysis.comment,
        confidence: result.analysis.confidence,
        transcript: result.transcript
      });
    });
    
    // Aplicar colores por categoría
    const categoryColors = {
      'Lead': 'FF90EE90',
      'Completed': 'FF32CD32',
      'Not Interested': 'FFFFB6C1',
      'No Answer': 'FFFFD700',
      'Failed': 'FFFF6B6B',
      'Hangup': 'FFFFA500',
      'Voicemail': 'FFADD8E6',
      'Wrong Number': 'FFDDA0DD',
      'Recall': 'FF98FB98',
      'Non-Viable Client': 'FFF0E68C'
    };
    
    // Aplicar formato condicional
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) { // Skip header
        const category = row.getCell('category').value;
        const color = categoryColors[category] || 'FFFFFFFF';
        
        row.eachCell((cell) => {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: color }
          };
        });
      }
    });
    
    // Hoja de estadísticas
    if (stats) {
      const statsWorksheet = workbook.addWorksheet('Estadísticas');
      
      statsWorksheet.columns = [
        { header: 'Categoría', key: 'category', width: 25 },
        { header: 'Cantidad', key: 'count', width: 15 },
        { header: 'Porcentaje', key: 'percentage', width: 15 }
      ];
      
      // Estilo del header
      statsWorksheet.getRow(1).font = { bold: true };
      statsWorksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' }
      };
      statsWorksheet.getRow(1).font.color = { argb: 'FFFFFFFF' };
      
      // Agregar estadísticas
      const totalCalls = results.length;
      Object.entries(stats).forEach(([category, count]) => {
        if (category !== 'averageConfidence') {
          const percentage = ((count / totalCalls) * 100).toFixed(1);
          statsWorksheet.addRow({
            category,
            count,
            percentage: `${percentage}%`
          });
        }
      });
      
      // Agregar información adicional
      statsWorksheet.addRow({});
      statsWorksheet.addRow({ category: 'Total de Llamadas', count: totalCalls });
      if (stats.averageConfidence) {
        statsWorksheet.addRow({ category: 'Confianza Promedio', count: `${stats.averageConfidence}%` });
      }
      if (dateRange) {
        statsWorksheet.addRow({ category: 'Rango de Fechas', count: `${dateRange.startDate} a ${dateRange.endDate}` });
      }
      statsWorksheet.addRow({ category: 'Generado el', count: moment().format('YYYY-MM-DD HH:mm:ss') });
    }
    
    // Configurar respuesta
    const fileName = `analisis_llamadas_${moment().format('YYYY-MM-DD_HH-mm-ss')}.xlsx`;
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    
    // Escribir archivo
    await workbook.xlsx.write(res);
    
    logger.info(`Archivo Excel generado exitosamente: ${fileName}`);
    
  } catch (error) {
    logger.error('Error generando archivo Excel:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

/**
 * GET /api/export/health
 * Health check para el servicio de exportación
 */
router.get('/health', (req, res) => {
  res.json({
    service: 'export',
    status: 'OK',
    timestamp: new Date().toISOString(),
    endpoints: [
      'POST /api/export/excel',
      'GET /api/export/health'
    ],
    supportedFormats: ['Excel (.xlsx)']
  });
});

module.exports = router;