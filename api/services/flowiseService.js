const db = require('../config/database');

class FlowiseService {
    
    /**
     * Cria uma integração Flowise para um hotel
     */
    async createFlowiseIntegration(hotelUuid, botName, predictionUrl) {
        try {
            console.log(`🔗 Criando integração Flowise para hotel UUID ${hotelUuid}, bot: ${botName}...`);
            
            // API Key fixa conforme especificado
            const fixedApiKey = 'Bearer shrq4KZg2IGHJFA4ZikqjrXpf46jU7hXfFKXSQUS84M';
            
            // Verificar se já existe uma integração Flowise para este hotel
            const existingIntegrations = await db.query(`
                SELECT id FROM Integracoes 
                WHERE hotel_uuid = $1 AND integration_name = 'Flowise'
            `, [hotelUuid]);
            
            if (existingIntegrations.length > 0) {
                // Atualizar integração existente
                await db.query(`
                    UPDATE Integracoes SET
                        instancia_name = $1,
                        apikey = $2,
                        url_api = $3,
                        updated_at = NOW()
                    WHERE hotel_uuid = $4 AND integration_name = 'Flowise'
                `, [botName, fixedApiKey, predictionUrl, hotelUuid]);
                
                console.log(`✅ Integração Flowise atualizada para hotel ${hotelUuid}`);
            } else {
                // Criar nova integração
                await db.query(`
                    INSERT INTO Integracoes (
                        integration_name,
                        hotel_uuid,
                        apikey,
                        instancia_name,
                        url_api
                    ) VALUES ($1, $2, $3, $4, $5)
                `, [
                    'Flowise',
                    hotelUuid,
                    fixedApiKey,
                    botName,
                    predictionUrl
                ]);
                
                console.log(`✅ Nova integração Flowise criada para hotel ${hotelUuid}`);
            }
            
            return {
                success: true,
                hotel_uuid: hotelUuid,
                bot_name: botName,
                prediction_url: predictionUrl,
                message: 'Integração Flowise processada com sucesso'
            };
            
        } catch (error) {
            console.error(`❌ Erro ao criar integração Flowise:`, error);
            throw error;
        }
    }
    
    /**
     * Lista bots Flowise para um hotel
     */
    async getHotelFlowiseBots(hotelUuid) {
        try {
            console.log(`🔍 Buscando bots Flowise do hotel UUID ${hotelUuid}...`);
            
            const bots = await db.query(`
                SELECT 
                    id,
                    bot_name,
                    bot_description,
                    bot_type,
                    prediction_url,
                    upsert_url,
                    bot_id,
                    active,
                    created_at
                FROM flowise_bots
                WHERE hotel_uuid = $1 AND active = TRUE
                ORDER BY bot_name
            `, [hotelUuid]);
            
            console.log(`✅ Encontrados ${bots.length} bots Flowise para o hotel UUID ${hotelUuid}`);
            return {
                success: true,
                hotel_uuid: hotelUuid,
                total: bots.length,
                bots: bots,
                message: 'Bots Flowise listados com sucesso'
            };
        } catch (error) {
            console.error(`❌ Erro ao buscar bots Flowise do hotel ${hotelUuid}:`, error);
            throw error;
        }
    }
    
    /**
     * Remove integração Flowise de um hotel
     */
    async removeFlowiseIntegration(hotelUuid) {
        try {
            console.log(`🗑️ Removendo integração Flowise do hotel UUID ${hotelUuid}...`);
            
            // Verificar se ainda existem bots ativos para o hotel
            const remainingBots = await db.query(`
                SELECT COUNT(*) as count FROM flowise_bots 
                WHERE hotel_uuid = $1 AND active = TRUE
            `, [hotelUuid]);
            
            const hasOtherBots = remainingBots[0].count > 0;
            
            if (!hasOtherBots) {
                // Só remove a integração se não houver mais bots ativos
                await db.query(`
                    DELETE FROM Integracoes 
                    WHERE hotel_uuid = $1 AND integration_name = 'Flowise'
                `, [hotelUuid]);
                
                console.log(`✅ Integração Flowise removida do hotel ${hotelUuid} (não há mais bots)`);
            } else {
                console.log(`⚠️ Integração Flowise mantida para hotel ${hotelUuid} (ainda possui bots ativos)`);
            }
            
            return {
                success: true,
                hotel_uuid: hotelUuid,
                message: hasOtherBots ? 
                    'Integração mantida (bots ativos existentes)' : 
                    'Integração Flowise removida com sucesso'
            };
        } catch (error) {
            console.error(`❌ Erro ao remover integração Flowise:`, error);
            throw error;
        }
    }
    
    /**
     * Cria um novo bot Flowise e sua integração automaticamente
     */
    async createBotWithIntegration(hotelUuid, botData) {
        try {
            console.log(`🤖 Criando bot Flowise com integração para hotel UUID ${hotelUuid}...`);
            
            // Inserir o bot na tabela flowise_bots
            const botResult = await db.query(`
                INSERT INTO flowise_bots (
                    bot_name,
                    bot_description,
                    bot_type,
                    prediction_url,
                    upsert_url,
                    bot_id,
                    hotel_uuid,
                    active
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE)
            `, [
                botData.bot_name,
                botData.bot_description,
                botData.bot_type,
                botData.prediction_url,
                botData.upsert_url,
                botData.bot_id,
                hotelUuid
            ]);
            
            console.log(`✅ Bot Flowise criado com ID: ${botResult.insertId}`);
            
            // Criar integração automaticamente
            await this.createFlowiseIntegration(hotelUuid, botData.bot_name, botData.prediction_url);
            
            return {
                success: true,
                bot_id: botResult.insertId,
                hotel_uuid: hotelUuid,
                message: 'Bot Flowise criado e integração configurada com sucesso'
            };
            
        } catch (error) {
            console.error(`❌ Erro ao criar bot Flowise com integração:`, error);
            throw error;
        }
    }
    
    /**
     * Atualiza um bot Flowise e sua integração
     */
    async updateBotWithIntegration(botId, hotelUuid, botData) {
        try {
            console.log(`🔄 Atualizando bot Flowise ID ${botId} com integração...`);
            
            // Atualizar o bot na tabela flowise_bots
            await db.query(`
                UPDATE flowise_bots SET
                    bot_name = $1,
                    bot_description = $2,
                    bot_type = $3,
                    prediction_url = $4,
                    upsert_url = $5,
                    updated_at = NOW()
                WHERE id = $6 AND hotel_uuid = $7
            `, [
                botData.bot_name,
                botData.bot_description,
                botData.bot_type,
                botData.prediction_url,
                botData.upsert_url,
                botId,
                hotelUuid
            ]);
            
            console.log(`✅ Bot Flowise atualizado: ${botId}`);
            
            // Atualizar integração automaticamente
            await this.createFlowiseIntegration(hotelUuid, botData.bot_name, botData.prediction_url);
            
            return {
                success: true,
                bot_id: botId,
                hotel_uuid: hotelUuid,
                message: 'Bot Flowise atualizado e integração sincronizada com sucesso'
            };
            
        } catch (error) {
            console.error(`❌ Erro ao atualizar bot Flowise com integração:`, error);
            throw error;
        }
    }
}

module.exports = new FlowiseService();