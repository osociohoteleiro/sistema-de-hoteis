/**
 * Store persistente para extrações ativas
 * Substitui o Map em memória por persistência no banco de dados
 */
class ExtractionStore {
  constructor(db) {
    this.db = db;
  }

  /**
   * Registra uma extração ativa
   */
  async setActiveExtraction(hotelId, extractionData) {
    try {
      const startTime = extractionData.startTime || new Date();

      console.log(`🔄 Salvando extração ativa para hotel ${hotelId}:`);
      console.log(`   - Status: ${extractionData.status || 'RUNNING'}`);
      console.log(`   - PID: ${extractionData.process?.pid || 'null'}`);
      console.log(`   - Start Time: ${startTime}`);

      await this.db.query(`
        INSERT INTO active_extractions (
          hotel_id,
          process_pid,
          status,
          start_time,
          progress_current,
          progress_total,
          current_property,
          extracted_prices,
          logs,
          created_at,
          updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (hotel_id)
        DO UPDATE SET
          process_pid = EXCLUDED.process_pid,
          status = EXCLUDED.status,
          start_time = EXCLUDED.start_time,
          progress_current = EXCLUDED.progress_current,
          progress_total = EXCLUDED.progress_total,
          current_property = EXCLUDED.current_property,
          extracted_prices = EXCLUDED.extracted_prices,
          logs = EXCLUDED.logs,
          updated_at = EXCLUDED.updated_at
      `, [
        hotelId,
        extractionData.process?.pid || null,
        extractionData.status || 'RUNNING',
        startTime,
        extractionData.progress?.current || 0,
        extractionData.progress?.total || 0,
        extractionData.progress?.currentProperty || null,
        extractionData.progress?.extractedPrices || 0,
        JSON.stringify(extractionData.logs || []),
        new Date(),
        new Date()
      ]);

      console.log(`✅ Extração ativa registrada no store para hotel ${hotelId}`);
      return true;

    } catch (error) {
      console.error(`❌ Erro ao registrar extração ativa para hotel ${hotelId}:`, error.message);
      return false;
    }
  }

  /**
   * Obtém dados de uma extração ativa
   */
  async getActiveExtraction(hotelId) {
    try {
      console.log(`🔍 Buscando extração ativa para hotel ${hotelId}`);

      // Primeira coisa: limpar registros antigos
      await this.db.query(`
        DELETE FROM active_extractions
        WHERE hotel_id = $1
        AND (
          status != 'RUNNING'
          OR created_at < NOW() - INTERVAL '1 hour'
        )
      `, [hotelId]);

      const result = await this.db.query(`
        SELECT * FROM active_extractions
        WHERE hotel_id = $1
        AND status = 'RUNNING'
      `, [hotelId]);

      // Verificar se result e result.rows existem
      if (!result || !result.rows) {
        console.log(`⚠️ Resultado inválido para hotel ${hotelId}:`, result);
        return null;
      }

      console.log(`📊 Encontrados ${result.rows.length} registros ativos para hotel ${hotelId}`);

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];

      // Reconstituir dados no formato esperado
      return {
        hotelId: row.hotel_id,
        process: { pid: row.process_pid, killed: false }, // Simular processo
        startTime: row.start_time,
        status: row.status,
        progress: {
          current: row.progress_current || 0,
          total: row.progress_total || 0,
          currentProperty: row.current_property,
          extractedPrices: row.extracted_prices || 0
        },
        logs: JSON.parse(row.logs || '[]'),
        updatedAt: row.updated_at
      };

    } catch (error) {
      console.error(`❌ Erro ao obter extração ativa para hotel ${hotelId}:`, error.message);
      return null;
    }
  }

  /**
   * Atualiza progresso de uma extração
   */
  async updateProgress(hotelId, progressData) {
    try {
      await this.db.query(`
        UPDATE active_extractions
        SET
          progress_current = $2,
          progress_total = $3,
          current_property = $4,
          extracted_prices = $5,
          logs = $6,
          updated_at = $7
        WHERE hotel_id = $1 AND status = 'RUNNING'
      `, [
        hotelId,
        progressData.current || 0,
        progressData.total || 0,
        progressData.currentProperty || null,
        progressData.extractedPrices || 0,
        JSON.stringify(progressData.logs || []),
        new Date()
      ]);

      return true;

    } catch (error) {
      console.error(`❌ Erro ao atualizar progresso para hotel ${hotelId}:`, error.message);
      return false;
    }
  }

  /**
   * Remove extração ativa (quando termina ou é cancelada)
   */
  async removeActiveExtraction(hotelId, finalStatus = 'COMPLETED') {
    try {
      await this.db.query(`
        UPDATE active_extractions
        SET
          status = $2,
          end_time = $3,
          updated_at = $4
        WHERE hotel_id = $1
      `, [hotelId, finalStatus, new Date(), new Date()]);

      // Após algumas horas, limpar da tabela
      setTimeout(async () => {
        try {
          await this.db.query(`
            DELETE FROM active_extractions
            WHERE hotel_id = $1 AND status != 'RUNNING'
            AND updated_at < NOW() - INTERVAL '6 hours'
          `, [hotelId]);
        } catch (e) {
          console.error('Erro na limpeza automática:', e.message);
        }
      }, 1000 * 60 * 5); // 5 minutos depois

      console.log(`✅ Extração removida do store para hotel ${hotelId} com status ${finalStatus}`);
      return true;

    } catch (error) {
      console.error(`❌ Erro ao remover extração ativa para hotel ${hotelId}:`, error.message);
      return false;
    }
  }

  /**
   * Lista todas as extrações ativas
   */
  async getAllActiveExtractions() {
    try {
      const result = await this.db.query(`
        SELECT * FROM active_extractions
        WHERE status = 'RUNNING'
        AND created_at > NOW() - INTERVAL '2 hours'
        ORDER BY created_at DESC
      `);

      // Verificar se result e result.rows existem
      if (!result || !result.rows) {
        console.log(`⚠️ Resultado inválido ao listar extrações ativas:`, result);
        return [];
      }

      return result.rows.map(row => ({
        hotelId: row.hotel_id,
        process: { pid: row.process_pid, killed: false },
        startTime: row.start_time,
        status: row.status,
        progress: {
          current: row.progress_current || 0,
          total: row.progress_total || 0,
          currentProperty: row.current_property,
          extractedPrices: row.extracted_prices || 0
        },
        logs: JSON.parse(row.logs || '[]'),
        updatedAt: row.updated_at
      }));

    } catch (error) {
      console.error('❌ Erro ao listar extrações ativas:', error.message);
      return [];
    }
  }

  /**
   * Limpa extrações órfãs (mais antigas que X tempo sem update)
   */
  async cleanupStaleExtractions() {
    try {
      const result = await this.db.query(`
        UPDATE active_extractions
        SET
          status = 'CANCELLED',
          end_time = NOW(),
          updated_at = NOW()
        WHERE status = 'RUNNING'
        AND updated_at < NOW() - INTERVAL '30 minutes'
        RETURNING hotel_id
      `);

      // Verificar se result e result.rows existem
      if (!result || !result.rows) {
        console.log(`⚠️ Resultado inválido na limpeza de extrações órfãs:`, result);
        return { cleanedCount: 0, cleanedHotelIds: [] };
      }

      const cleanedCount = result.rows.length;
      const cleanedHotelIds = result.rows.map(row => row.hotel_id);

      if (cleanedCount > 0) {
        console.log(`🧹 Limpeza automática: ${cleanedCount} extrações órfãs detectadas e canceladas`);
        console.log(`🏨 Hotels afetados: ${cleanedHotelIds.join(', ')}`);
      }

      return {
        cleanedCount,
        cleanedHotelIds
      };

    } catch (error) {
      console.error('❌ Erro na limpeza de extrações órfãs:', error.message);
      return { cleanedCount: 0, cleanedHotelIds: [] };
    }
  }

  /**
   * Verifica se existe extração ativa para um hotel
   */
  async hasActiveExtraction(hotelId) {
    try {
      const result = await this.db.query(`
        SELECT COUNT(*) as count
        FROM active_extractions
        WHERE hotel_id = $1
        AND status = 'RUNNING'
        AND created_at > NOW() - INTERVAL '2 hours'
      `, [hotelId]);

      // Verificar se result e result.rows existem
      if (!result || !result.rows || result.rows.length === 0) {
        console.log(`⚠️ Resultado inválido para contagem do hotel ${hotelId}:`, result);
        return false;
      }

      return result.rows[0].count > 0;

    } catch (error) {
      console.error(`❌ Erro ao verificar extração ativa para hotel ${hotelId}:`, error.message);
      return false;
    }
  }

  /**
   * Cria tabela se não existir (migration automática)
   */
  async ensureTable() {
    try {
      await this.db.query(`
        CREATE TABLE IF NOT EXISTS active_extractions (
          id SERIAL PRIMARY KEY,
          hotel_id INTEGER NOT NULL,
          process_pid INTEGER,
          status VARCHAR(20) NOT NULL DEFAULT 'RUNNING',
          start_time TIMESTAMP WITH TIME ZONE,
          end_time TIMESTAMP WITH TIME ZONE,
          progress_current INTEGER DEFAULT 0,
          progress_total INTEGER DEFAULT 0,
          current_property TEXT,
          extracted_prices INTEGER DEFAULT 0,
          logs JSONB DEFAULT '[]',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(hotel_id)
        )
      `);

      // Criar índices para performance
      await this.db.query(`
        CREATE INDEX IF NOT EXISTS idx_active_extractions_hotel_id ON active_extractions(hotel_id);
        CREATE INDEX IF NOT EXISTS idx_active_extractions_status ON active_extractions(status);
        CREATE INDEX IF NOT EXISTS idx_active_extractions_updated_at ON active_extractions(updated_at);
      `);

      console.log('✅ Tabela active_extractions garantida');

    } catch (error) {
      console.error('❌ Erro ao criar tabela active_extractions:', error.message);
    }
  }
}

module.exports = ExtractionStore;