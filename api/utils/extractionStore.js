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
   * @param {string} hotelUuid - UUID do hotel (sempre usar UUID, nunca ID numérico)
   */
  async setActiveExtraction(hotelUuid, extractionData) {
    try {
      const startTime = extractionData.startTime || new Date();

      console.log(`🔄 Salvando extração ativa para hotel UUID ${hotelUuid}:`);
      console.log(`   - Status: ${extractionData.status || 'RUNNING'}`);
      console.log(`   - PID: ${extractionData.process?.pid || 'null'}`);
      console.log(`   - Start Time: ${startTime}`);

      // Buscar hotel_id pelo UUID para compatibilidade
      const Hotel = require('../models/Hotel');
      const hotel = await Hotel.findByUuid(hotelUuid);
      const hotelId = hotel ? hotel.id : null;

      await this.db.query(`
        INSERT INTO active_extractions (
          hotel_id,
          hotel_uuid,
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
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON CONFLICT (hotel_uuid)
        DO UPDATE SET
          hotel_id = EXCLUDED.hotel_id,
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
        hotelUuid,
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

      console.log(`✅ Extração ativa registrada no store para hotel UUID ${hotelUuid}`);
      return true;

    } catch (error) {
      console.error(`❌ Erro ao registrar extração ativa para hotel UUID ${hotelUuid}:`, error.message);
      return false;
    }
  }

  /**
   * Obtém dados de uma extração ativa
   * @param {string} hotelUuid - UUID do hotel (sempre usar UUID, nunca ID numérico)
   */
  async getActiveExtraction(hotelUuid) {
    try {
      console.log(`🔍 Buscando extração ativa para hotel UUID ${hotelUuid}`);

      // Primeira coisa: limpar registros antigos
      await this.db.query(`
        DELETE FROM active_extractions
        WHERE hotel_uuid = $1
        AND (
          status != 'RUNNING'
          OR created_at < NOW() - INTERVAL '1 hour'
        )
      `, [hotelUuid]);

      const result = await this.db.query(`
        SELECT * FROM active_extractions
        WHERE hotel_uuid = $1
        AND status = 'RUNNING'
      `, [hotelUuid]);

      // Verificar se result e result.rows existem
      if (!result || !result.rows) {
        console.log(`⚠️ Resultado inválido para hotel UUID ${hotelUuid}:`, result);
        return null;
      }

      console.log(`📊 Encontrados ${result.rows.length} registros ativos para hotel UUID ${hotelUuid}`);

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];

      // Reconstituir dados no formato esperado
      return {
        hotelUuid: row.hotel_uuid, // Usar UUID em vez de ID
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
      console.error(`❌ Erro ao obter extração ativa para hotel UUID ${hotelUuid}:`, error.message);
      return null;
    }
  }

  /**
   * Atualiza progresso de uma extração
   * @param {string} hotelUuid - UUID do hotel (sempre usar UUID, nunca ID numérico)
   */
  async updateProgress(hotelUuid, progressData) {
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
        WHERE hotel_uuid = $1 AND status = 'RUNNING'
      `, [
        hotelUuid,
        progressData.current || 0,
        progressData.total || 0,
        progressData.currentProperty || null,
        progressData.extractedPrices || 0,
        JSON.stringify(progressData.logs || []),
        new Date()
      ]);

      return true;

    } catch (error) {
      console.error(`❌ Erro ao atualizar progresso para hotel UUID ${hotelUuid}:`, error.message);
      return false;
    }
  }

  /**
   * Pausa extração ativa (para ser retomada depois)
   * @param {string} hotelUuid - UUID do hotel (sempre usar UUID, nunca ID numérico)
   * @param {string} pauseStatus - Status de pause ('PAUSED')
   */
  async pauseActiveExtraction(hotelUuid, pauseStatus = 'PAUSED') {
    try {
      await this.db.query(`
        UPDATE active_extractions
        SET
          status = $2,
          paused_at = $3,
          updated_at = $4
        WHERE hotel_uuid = $1 AND status = 'RUNNING'
      `, [hotelUuid, pauseStatus, new Date(), new Date()]);

      console.log(`⏸️  Extração pausada no store para hotel UUID ${hotelUuid} com status ${pauseStatus}`);
      return true;

    } catch (error) {
      console.error(`❌ Erro ao pausar extração ativa para hotel UUID ${hotelUuid}:`, error.message);
      return false;
    }
  }

  /**
   * Retoma extração pausada
   * @param {string} hotelUuid - UUID do hotel (sempre usar UUID, nunca ID numérico)
   */
  async resumeActiveExtraction(hotelUuid) {
    try {
      await this.db.query(`
        UPDATE active_extractions
        SET
          status = 'RUNNING',
          resumed_at = $2,
          updated_at = $3
        WHERE hotel_uuid = $1 AND status = 'PAUSED'
      `, [hotelUuid, new Date(), new Date()]);

      console.log(`▶️  Extração retomada no store para hotel UUID ${hotelUuid}`);
      return true;

    } catch (error) {
      console.error(`❌ Erro ao retomar extração ativa para hotel UUID ${hotelUuid}:`, error.message);
      return false;
    }
  }

  /**
   * Busca extrações pausadas
   * @param {string} hotelUuid - UUID do hotel específico (opcional)
   */
  async getPausedExtractions(hotelUuid = null) {
    try {
      let query = `
        SELECT * FROM active_extractions
        WHERE status = 'PAUSED'
        AND created_at > NOW() - INTERVAL '24 hours'
      `;
      let params = [];

      if (hotelUuid) {
        query += ` AND hotel_uuid = $1`;
        params.push(hotelUuid);
      }

      query += ` ORDER BY paused_at DESC`;

      const result = await this.db.query(query, params);

      if (!result || !result.rows) {
        return [];
      }

      return result.rows.map(row => ({
        hotelUuid: row.hotel_uuid,
        process: { pid: row.process_pid, killed: false },
        startTime: row.start_time,
        pausedAt: row.paused_at,
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
      console.error('❌ Erro ao buscar extrações pausadas:', error.message);
      return [];
    }
  }

  /**
   * Remove extração ativa (quando termina ou é cancelada)
   * @param {string} hotelUuid - UUID do hotel (sempre usar UUID, nunca ID numérico)
   */
  async removeActiveExtraction(hotelUuid, finalStatus = 'COMPLETED') {
    try {
      await this.db.query(`
        UPDATE active_extractions
        SET
          status = $2,
          end_time = $3,
          updated_at = $4
        WHERE hotel_uuid = $1
      `, [hotelUuid, finalStatus, new Date(), new Date()]);

      // Após algumas horas, limpar da tabela
      setTimeout(async () => {
        try {
          await this.db.query(`
            DELETE FROM active_extractions
            WHERE hotel_uuid = $1 AND status != 'RUNNING' AND status != 'PAUSED'
            AND updated_at < NOW() - INTERVAL '6 hours'
          `, [hotelUuid]);
        } catch (e) {
          console.error('Erro na limpeza automática:', e.message);
        }
      }, 1000 * 60 * 5); // 5 minutos depois

      console.log(`✅ Extração removida do store para hotel UUID ${hotelUuid} com status ${finalStatus}`);
      return true;

    } catch (error) {
      console.error(`❌ Erro ao remover extração ativa para hotel UUID ${hotelUuid}:`, error.message);
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
        hotelUuid: row.hotel_uuid, // Usar UUID em vez de ID
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
        RETURNING hotel_uuid
      `);

      // Verificar se result e result.rows existem
      if (!result || !result.rows) {
        console.log(`⚠️ Resultado inválido na limpeza de extrações órfãs:`, result);
        return { cleanedCount: 0, cleanedHotelUuids: [] };
      }

      const cleanedCount = result.rows.length;
      const cleanedHotelUuids = result.rows.map(row => row.hotel_uuid);

      if (cleanedCount > 0) {
        console.log(`🧹 Limpeza automática: ${cleanedCount} extrações órfãs detectadas e canceladas`);
        console.log(`🏨 Hotel UUIDs afetados: ${cleanedHotelUuids.join(', ')}`);
      }

      return {
        cleanedCount,
        cleanedHotelUuids
      };

    } catch (error) {
      console.error('❌ Erro na limpeza de extrações órfãs:', error.message);
      return { cleanedCount: 0, cleanedHotelUuids: [] };
    }
  }

  /**
   * Verifica se existe extração ativa para um hotel
   * @param {string} hotelUuid - UUID do hotel (sempre usar UUID, nunca ID numérico)
   */
  async hasActiveExtraction(hotelUuid) {
    try {
      const result = await this.db.query(`
        SELECT COUNT(*) as count
        FROM active_extractions
        WHERE hotel_uuid = $1
        AND status = 'RUNNING'
        AND created_at > NOW() - INTERVAL '2 hours'
      `, [hotelUuid]);

      // Verificar se result e result.rows existem
      if (!result || !result.rows || result.rows.length === 0) {
        console.log(`⚠️ Nenhum resultado encontrado para contagem do hotel UUID ${hotelUuid}`);
        return false;
      }

      // Se chegou aqui, o resultado é válido

      return result.rows[0].count > 0;

    } catch (error) {
      console.error(`❌ Erro ao verificar extração ativa para hotel UUID ${hotelUuid}:`, error.message);
      return false;
    }
  }

  /**
   * Cria tabela se não existir (migration automática)
   * IMPORTANTE: Agora usa hotel_uuid como chave em vez de hotel_id
   */
  async ensureTable() {
    try {
      // Verificar se a tabela existe com a estrutura antiga
      const tableCheckResult = await this.db.query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'active_extractions'
        AND column_name IN ('hotel_id', 'hotel_uuid')
      `);

      const hasOldStructure = tableCheckResult.rows?.some(row => row.column_name === 'hotel_id');
      const hasNewStructure = tableCheckResult.rows?.some(row => row.column_name === 'hotel_uuid');

      if (hasOldStructure && !hasNewStructure) {
        console.log('🔄 Migrando tabela active_extractions para usar UUID...');

        // Adicionar coluna hotel_uuid
        await this.db.query(`
          ALTER TABLE active_extractions
          ADD COLUMN IF NOT EXISTS hotel_uuid VARCHAR(36)
        `);

        // Migrar dados existentes (se houver)
        await this.db.query(`
          UPDATE active_extractions
          SET hotel_uuid = h.hotel_uuid
          FROM hotels h
          WHERE active_extractions.hotel_id = h.id
          AND active_extractions.hotel_uuid IS NULL
        `);

        // Remover constraint antiga e adicionar nova
        await this.db.query(`
          ALTER TABLE active_extractions
          DROP CONSTRAINT IF EXISTS active_extractions_hotel_id_key
        `);

        await this.db.query(`
          ALTER TABLE active_extractions
          ADD CONSTRAINT active_extractions_hotel_uuid_key UNIQUE (hotel_uuid)
        `);

        // Remover coluna antiga após migração
        await this.db.query(`
          ALTER TABLE active_extractions
          DROP COLUMN IF EXISTS hotel_id
        `);

        console.log('✅ Migração concluída: active_extractions agora usa hotel_uuid');
      }

      // Criar tabela com estrutura nova se não existir
      await this.db.query(`
        CREATE TABLE IF NOT EXISTS active_extractions (
          id SERIAL PRIMARY KEY,
          hotel_uuid VARCHAR(36) NOT NULL,
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
          UNIQUE(hotel_uuid)
        )
      `);

      // Criar índices para performance
      await this.db.query(`
        CREATE INDEX IF NOT EXISTS idx_active_extractions_hotel_uuid ON active_extractions(hotel_uuid);
        CREATE INDEX IF NOT EXISTS idx_active_extractions_status ON active_extractions(status);
        CREATE INDEX IF NOT EXISTS idx_active_extractions_updated_at ON active_extractions(updated_at);
      `);

      console.log('✅ Tabela active_extractions garantida com UUID');

    } catch (error) {
      console.error('❌ Erro ao criar/migrar tabela active_extractions:', error.message);
    }
  }
}

module.exports = ExtractionStore;