const db = require('../config/database');

class PMSService {
    
    /**
     * Cria uma integração PMS para um hotel (especialmente Artax)
     */
    async createPMSIntegration(hotelUuid, systemName, credentials = {}) {
        try {
            console.log(`🔗 Criando integração PMS para hotel UUID ${hotelUuid}, sistema: ${systemName}...`);
            
            // Verificar se o sistema é Artax (case insensitive)
            const isArtax = systemName.toLowerCase() === 'artax' || systemName.toLowerCase() === 'artaxnet';
            
            // Suportar ambos os formatos: client_id/clientid e client_secret/clientsecret
            const clientId = credentials.client_id || credentials.clientid;
            const clientSecret = credentials.client_secret || credentials.clientsecret;
            
            if (isArtax && clientId && clientSecret) {
                // Verificar se já existe uma integração para este sistema e hotel
                const existingIntegrations = await db.query(`
                    SELECT id FROM Integracoes 
                    WHERE hotel_uuid = $1 AND integration_name = $2
                `, [hotelUuid, systemName]);
                
                if (existingIntegrations.length > 0) {
                    // Atualizar integração existente
                    await db.query(`
                        UPDATE Integracoes SET
                            client_id = $1,
                            client_secret = $2,
                            updated_at = NOW()
                        WHERE hotel_uuid = $3 AND integration_name = $4
                    `, [clientId, clientSecret, hotelUuid, systemName]);
                    
                    console.log(`✅ Integração ${systemName} atualizada para hotel ${hotelUuid}`);
                } else {
                    // Criar nova integração
                    await db.query(`
                        INSERT INTO Integracoes (
                            integration_name,
                            hotel_uuid,
                            client_id,
                            client_secret
                        ) VALUES ($1, $2, $3, $4)
                    `, [
                        systemName,
                        hotelUuid,
                        clientId,
                        clientSecret
                    ]);
                    
                    console.log(`✅ Nova integração ${systemName} criada para hotel ${hotelUuid}`);
                }
                
                return {
                    success: true,
                    hotel_uuid: hotelUuid,
                    integration_name: systemName,
                    message: `Integração ${systemName} processada com sucesso`
                };
            } else {
                console.log(`ℹ️ Sistema ${systemName} não requer integração automática ou não possui credenciais necessárias`);
                return {
                    success: true,
                    message: 'Sistema não requer integração automática'
                };
            }
            
        } catch (error) {
            console.error(`❌ Erro ao criar integração PMS:`, error);
            throw error;
        }
    }
    
    /**
     * Lista sistemas PMS/Motor/Channel para um hotel
     */
    async getHotelPMSSystems(hotelUuid) {
        try {
            console.log(`🔍 Buscando sistemas PMS/Motor/Channel do hotel UUID ${hotelUuid}...`);
            
            const systems = await db.query(`
                SELECT 
                    pmc.id,
                    pmc.name,
                    pmc.type,
                    pmc.type_connect,
                    pmc.credentials,
                    pmc.auth_type,
                    pmc.endpoint_url,
                    pmc.is_active,
                    pmc.created_at,
                    sc.description as system_description
                FROM pms_motor_channel pmc
                LEFT JOIN systems_catalog sc ON pmc.system_id = sc.id
                WHERE pmc.hotel_uuid = $1 AND pmc.is_active = TRUE
                ORDER BY pmc.name
            `, [hotelUuid]);
            
            console.log(`✅ Encontrados ${systems.length} sistemas para o hotel UUID ${hotelUuid}`);
            return {
                success: true,
                hotel_uuid: hotelUuid,
                total: systems.length,
                systems: systems,
                message: 'Sistemas PMS/Motor/Channel listados com sucesso'
            };
        } catch (error) {
            console.error(`❌ Erro ao buscar sistemas do hotel ${hotelUuid}:`, error);
            throw error;
        }
    }
    
    /**
     * Remove integração PMS de um hotel
     */
    async removePMSIntegration(hotelUuid, systemName) {
        try {
            console.log(`🗑️ Removendo integração ${systemName} do hotel UUID ${hotelUuid}...`);
            
            await db.query(`
                DELETE FROM Integracoes 
                WHERE hotel_uuid = $1 AND integration_name = $2
            `, [hotelUuid, systemName]);
            
            console.log(`✅ Integração ${systemName} removida do hotel ${hotelUuid}`);
            
            return {
                success: true,
                hotel_uuid: hotelUuid,
                integration_name: systemName,
                message: `Integração ${systemName} removida com sucesso`
            };
        } catch (error) {
            console.error(`❌ Erro ao remover integração PMS:`, error);
            throw error;
        }
    }
    
    /**
     * Processa credenciais de sistemas PMS com base no tipo
     */
    async processSystemCredentials(systemName, credentials, authType) {
        let processedCredentials = {};
        
        // Normalizar nomes de campos (suportar ambos os formatos)
        const clientId = credentials.client_id || credentials.clientid;
        const clientSecret = credentials.client_secret || credentials.clientsecret;
        const apiKey = credentials.api_key || credentials.apikey;
        const accessToken = credentials.access_token || credentials.accesstoken;
        
        switch (authType) {
            case 'oauth':
                if (clientId && clientSecret) {
                    processedCredentials.client_id = clientId;
                    processedCredentials.client_secret = clientSecret;
                }
                break;
            case 'api_key':
                if (apiKey) {
                    processedCredentials.api_key = apiKey;
                }
                break;
            case 'token':
                if (accessToken) {
                    processedCredentials.access_token = accessToken;
                }
                break;
            default:
                // Para outros tipos, normalizar campos comuns se existirem
                if (clientId) processedCredentials.client_id = clientId;
                if (clientSecret) processedCredentials.client_secret = clientSecret;
                if (apiKey) processedCredentials.api_key = apiKey;
                if (accessToken) processedCredentials.access_token = accessToken;
                
                // Se não encontrou campos conhecidos, retorna as credenciais como estão
                if (Object.keys(processedCredentials).length === 0) {
                    processedCredentials = credentials;
                }
        }
        
        return processedCredentials;
    }
}

module.exports = new PMSService();