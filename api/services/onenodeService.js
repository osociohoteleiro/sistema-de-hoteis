const db = require('../config/database');

class OneNodeService {
    
    /**
     * Cria uma integração OneNode para um hotel
     */
    async createOnenodeIntegration(hotelUuid, workspaceName, apiKey, url) {
        try {
            console.log(`🔗 Criando integração OneNode para hotel UUID ${hotelUuid}...`);
            
            // Verificar se já existe uma integração OneNode para este hotel
            const existingIntegrations = await db.query(`
                SELECT id FROM Integracoes 
                WHERE hotel_uuid = $1 AND integration_name = 'onenode'
            `, [hotelUuid]);
            
            if (existingIntegrations.length > 0) {
                // Atualizar integração existente
                await db.query(`
                    UPDATE Integracoes SET
                        instancia_name = $1,
                        apikey = $2,
                        url_api = $3
                    WHERE hotel_uuid = $4 AND integration_name = 'onenode'
                `, [workspaceName, apiKey, url, hotelUuid]);
                
                console.log(`✅ Integração OneNode atualizada para hotel ${hotelUuid}`);
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
                    'onenode',
                    hotelUuid,
                    apiKey,
                    workspaceName,
                    url
                ]);
                
                console.log(`✅ Nova integração OneNode criada para hotel ${hotelUuid}`);
            }
            
            return {
                success: true,
                hotel_uuid: hotelUuid,
                message: 'Integração OneNode processada com sucesso'
            };
            
        } catch (error) {
            console.error(`❌ Erro ao criar integração OneNode:`, error);
            throw error;
        }
    }
    
    /**
     * Lista workspaces do OneNode para um hotel
     */
    async getHotelWorkspaces(hotelUuid) {
        try {
            console.log(`🔍 Buscando workspaces OneNode do hotel UUID ${hotelUuid}...`);
            
            const workspaces = await db.query(`
                SELECT 
                    ow.id,
                    ow.name,
                    ow.api_key,
                    ow.url,
                    ow.active,
                    ow.created_at
                FROM onenode_workspaces ow
                INNER JOIN hotels h ON ow.hotel_id = h.id
                WHERE h.hotel_uuid = $1 AND ow.active = TRUE
                ORDER BY ow.name
            `, [hotelUuid]);
            
            console.log(`✅ Encontrados ${workspaces.length} workspaces para o hotel UUID ${hotelUuid}`);
            return {
                success: true,
                hotel_uuid: hotelUuid,
                total: workspaces.length,
                workspaces: workspaces,
                message: 'Workspaces OneNode listados com sucesso'
            };
        } catch (error) {
            console.error(`❌ Erro ao buscar workspaces do hotel ${hotelUuid}:`, error);
            throw error;
        }
    }
    
    /**
     * Remove integração OneNode de um hotel
     */
    async removeOnenodeIntegration(hotelUuid) {
        try {
            console.log(`🗑️ Removendo integração OneNode do hotel UUID ${hotelUuid}...`);
            
            // Verificar se ainda existem workspaces ativos para o hotel
            const remainingWorkspaces = await db.query(`
                SELECT COUNT(*) as count 
                FROM onenode_workspaces ow
                INNER JOIN hotels h ON ow.hotel_id = h.id
                WHERE h.hotel_uuid = $1 AND ow.active = TRUE
            `, [hotelUuid]);
            
            const hasOtherWorkspaces = remainingWorkspaces[0].count > 0;
            
            if (!hasOtherWorkspaces) {
                // Só remove a integração se não houver mais workspaces ativos
                await db.query(`
                    DELETE FROM Integracoes 
                    WHERE hotel_uuid = $1 AND integration_name = 'onenode'
                `, [hotelUuid]);
                
                console.log(`✅ Integração OneNode removida do hotel ${hotelUuid} (não há mais workspaces)`);
            } else {
                console.log(`⚠️ Integração OneNode mantida para hotel ${hotelUuid} (ainda possui workspaces ativos)`);
            }
        } catch (error) {
            console.error(`❌ Erro ao remover integração OneNode:`, error);
            throw error;
        }
    }
}

module.exports = new OneNodeService();