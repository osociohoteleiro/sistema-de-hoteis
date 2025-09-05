/**
 * Utility functions for emitting Socket.io events
 */

/**
 * Emit extraction progress update to connected clients
 * @param {Object} io - Socket.io server instance
 * @param {number} hotelId - Hotel ID
 * @param {Object} progressData - Progress data to emit
 */
const emitExtractionProgress = (io, hotelId, progressData) => {
  const roomName = `hotel-${hotelId}`;
  
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
    progress: progressData.progress_percentage + '%',
    dates: `${progressData.processed_dates}/${progressData.total_dates}`
  });
};

/**
 * Emit extraction status change to connected clients
 * @param {Object} io - Socket.io server instance
 * @param {number} hotelId - Hotel ID
 * @param {Object} statusData - Status data to emit
 */
const emitExtractionStatus = (io, hotelId, statusData) => {
  const roomName = `hotel-${hotelId}`;
  
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
 * @param {number} hotelId - Hotel ID
 * @param {Object} searchData - New search data
 */
const emitNewSearch = (io, hotelId, searchData) => {
  const roomName = `hotel-${hotelId}`;
  
  io.to(roomName).emit('new-search-created', {
    search: searchData,
    timestamp: new Date().toISOString()
  });

  console.log(`📡 Nova busca emitida para sala ${roomName}:`, searchData.id);
};

/**
 * Emit search deleted event
 * @param {Object} io - Socket.io server instance  
 * @param {number} hotelId - Hotel ID
 * @param {Object} deletedData - Deleted search data
 */
const emitSearchDeleted = (io, hotelId, deletedData) => {
  const roomName = `hotel-${hotelId}`;
  
  io.to(roomName).emit('search-deleted', {
    searchId: deletedData.id,
    message: `Busca "${deletedData.property_name || `#${deletedData.id}`}" foi excluída`,
    timestamp: new Date().toISOString()
  });

  console.log(`📡 Exclusão emitida para sala ${roomName}:`, deletedData.id);
};

module.exports = {
  emitExtractionProgress,
  emitExtractionStatus,
  emitNewSearch,
  emitSearchDeleted
};