/**
 * Utility functions for emitting Socket.io events
 */

/**
 * Emit extraction progress update to connected clients
 * @param {Object} io - Socket.io server instance
 * @param {string|number} hotelIdentifier - Hotel UUID or ID
 * @param {Object} progressData - Progress data to emit
 */
const emitExtractionProgress = (io, hotelIdentifier, progressData) => {
  const roomName = `hotel-${hotelIdentifier}`;
  
  io.to(roomName).emit('extraction-progress', {
    searchId: progressData.searchId,
    progress: {
      id: progressData.id,
      status: progressData.status,
      processed_dates: progressData.processed_dates,
      total_dates: progressData.total_dates,
      progress_percentage: progressData.progress_percentage,
      total_prices_found: progressData.total_prices_found,
      duration_seconds: progressData.duration_seconds,
      started_at: progressData.started_at,
      completed_at: progressData.completed_at,
      property_name: progressData.property_name,
      error_log: progressData.error_log
    },
    timestamp: new Date().toISOString()
  });

  console.log(`📡 Emitido progresso para sala ${roomName}:`, {
    searchId: progressData.searchId,
    status: progressData.status,
    progress: progressData.progress_percentage + '%',
    dates: `${progressData.processed_dates}/${progressData.total_dates}`
  });
};

/**
 * Emit extraction status change to connected clients
 * @param {Object} io - Socket.io server instance
 * @param {string|number} hotelIdentifier - Hotel UUID or ID
 * @param {Object} statusData - Status data to emit
 */
const emitExtractionStatus = (io, hotelIdentifier, statusData) => {
  const roomName = `hotel-${hotelIdentifier}`;
  
  io.to(roomName).emit('extraction-status', {
    searchId: statusData.searchId,
    status: statusData.status,
    message: statusData.message,
    timestamp: new Date().toISOString()
  });

  console.log(`📡 Emitido status para sala ${roomName}:`, statusData);
};

/**
 * Emit new search created event
 * @param {Object} io - Socket.io server instance
 * @param {string|number} hotelIdentifier - Hotel UUID or ID
 * @param {Object} searchData - New search data
 */
const emitNewSearch = (io, hotelIdentifier, searchData) => {
  const roomName = `hotel-${hotelIdentifier}`;
  
  io.to(roomName).emit('new-search-created', {
    search: searchData,
    timestamp: new Date().toISOString()
  });

  console.log(`📡 Nova busca emitida para sala ${roomName}:`, searchData.id);
};

/**
 * Emit search deleted event
 * @param {Object} io - Socket.io server instance
 * @param {string|number} hotelIdentifier - Hotel UUID or ID
 * @param {Object} deletedData - Deleted search data
 */
const emitSearchDeleted = (io, hotelIdentifier, deletedData) => {
  const roomName = `hotel-${hotelIdentifier}`;

  io.to(roomName).emit('search-deleted', {
    searchId: deletedData.id,
    message: `Busca "${deletedData.property_name || `#${deletedData.id}`}" foi excluída`,
    timestamp: new Date().toISOString()
  });

  console.log(`📡 Exclusão emitida para sala ${roomName}:`, deletedData.id);
};

/**
 * Emit extraction paused event
 * @param {Object} io - Socket.io server instance
 * @param {string|number} hotelIdentifier - Hotel UUID or ID
 * @param {Object} pauseData - Pause data to emit
 */
const emitExtractionPaused = (io, hotelIdentifier, pauseData) => {
  const roomName = `hotel-${hotelIdentifier}`;

  io.to(roomName).emit('extraction-paused', {
    searchId: pauseData.searchId,
    status: 'PAUSED',
    message: `Extração de "${pauseData.property_name || `Search #${pauseData.searchId}`}" foi pausada`,
    progress_preserved: pauseData.progress_preserved,
    total_dates: pauseData.total_dates,
    prices_found: pauseData.prices_found,
    can_resume: true,
    timestamp: new Date().toISOString()
  });

  console.log(`📡 Pause emitido para sala ${roomName}:`, {
    searchId: pauseData.searchId,
    progress: `${pauseData.progress_preserved}/${pauseData.total_dates}`
  });
};

/**
 * Emit extraction resumed event
 * @param {Object} io - Socket.io server instance
 * @param {string|number} hotelIdentifier - Hotel UUID or ID
 * @param {Object} resumeData - Resume data to emit
 */
const emitExtractionResumed = (io, hotelIdentifier, resumeData) => {
  const roomName = `hotel-${hotelIdentifier}`;

  io.to(roomName).emit('extraction-resumed', {
    searchId: resumeData.searchId,
    status: 'RUNNING',
    message: `Extração de "${resumeData.property_name || `Search #${resumeData.searchId}`}" foi retomada`,
    resumed_from_date: resumeData.resumed_from_date,
    progress_preserved: resumeData.progress_preserved,
    total_dates: resumeData.total_dates,
    resume_mode: true,
    timestamp: new Date().toISOString()
  });

  console.log(`📡 Resume emitido para sala ${roomName}:`, {
    searchId: resumeData.searchId,
    resumedFrom: resumeData.resumed_from_date
  });
};

/**
 * Emit extraction cancelled event
 * @param {Object} io - Socket.io server instance
 * @param {string|number} hotelIdentifier - Hotel UUID or ID
 * @param {Object} cancelData - Cancel data to emit
 */
const emitExtractionCancelled = (io, hotelIdentifier, cancelData) => {
  const roomName = `hotel-${hotelIdentifier}`;

  io.to(roomName).emit('extraction-cancelled', {
    searchId: cancelData.searchId,
    status: 'CANCELLED',
    message: `Extração de "${cancelData.property_name || `Search #${cancelData.searchId}`}" foi cancelada definitivamente`,
    timestamp: new Date().toISOString()
  });

  console.log(`📡 Cancel emitido para sala ${roomName}:`, cancelData.searchId);
};

module.exports = {
  emitExtractionProgress,
  emitExtractionStatus,
  emitNewSearch,
  emitSearchDeleted,
  emitExtractionPaused,
  emitExtractionResumed,
  emitExtractionCancelled
};