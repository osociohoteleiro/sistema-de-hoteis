const axios = require('axios');
const db = require('../config/database');

class QdrantService {
    constructor() {
        // Configuração do cliente Qdrant
        this.qdrantUrl = 'https://osh-ia-qdrant.d32pnk.easypanel.host';
        this.apiKey = 'kZDY]:V%X4wV6[SXBHyX';
        
        // Configurar axios para Qdrant
        this.qdrantClient = axios.create({
            baseURL: this.qdrantUrl,
            headers: {
                'api-key': this.apiKey,
                'Content-Type': 'application/json'
            },
            timeout: 30000 // 30 segundos
        });
    }

    /**
     * Lista todas as collections do Qdrant
     */
    async getQdrantCollections() {
        try {
            console.log('🔍 Buscando collections do Qdrant...');
            const response = await this.qdrantClient.get('/collections');
            
            console.log('✅ Collections encontradas:', response.data?.result?.collections || []);
            return response.data?.result?.collections || [];
        } catch (error) {
            console.error('❌ Erro ao buscar collections do Qdrant:', error.response?.data || error.message);
            throw new Error(`Erro ao conectar com Qdrant: ${error.response?.data?.message || error.message}`);
        }
    }

    /**
     * Obtém informações detalhadas de uma collection específica
     */
    async getCollectionInfo(collectionName) {
        try {
            console.log(`🔍 Buscando informações da collection: ${collectionName}`);
            const response = await this.qdrantClient.get(`/collections/${collectionName}`);
            
            console.log(`✅ Informações da collection ${collectionName}:`, response.data?.result);
            return response.data?.result;
        } catch (error) {
            console.error(`❌ Erro ao buscar informações da collection ${collectionName}:`, error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Lista collections da base de dados local
     */
    async getDatabaseCollections() {
        try {
            const rows = await db.query(`
                SELECT 
                    id,
                    collection_name,
                    hotel_id,
                    description,
                    vector_size,
                    distance_metric,
                    qdrant_status,
                    total_vectors,
                    last_sync,
                    config,
                    created_at,
                    updated_at
                FROM vector_collections 
                ORDER BY collection_name
            `);
            
            console.log('📋 Collections na base de dados:', rows.length);
            return rows;
        } catch (error) {
            console.error('❌ Erro ao buscar collections da base de dados:', error);
            throw error;
        }
    }

    /**
     * Sincroniza collections do Qdrant com a base de dados
     */
    async syncCollections() {
        try {
            console.log('🔄 Iniciando sincronização das collections...');
            
            // 1. Buscar collections do Qdrant
            const qdrantCollections = await this.getQdrantCollections();
            console.log(`📊 Encontradas ${qdrantCollections.length} collections no Qdrant`);

            // 2. Buscar collections da base de dados
            const dbCollections = await this.getDatabaseCollections();
            console.log(`📊 Encontradas ${dbCollections.length} collections na base de dados`);

            // 3. Criar um mapa das collections existentes na BD
            const dbCollectionMap = new Map();
            dbCollections.forEach(col => {
                dbCollectionMap.set(col.collection_name, col);
            });

            let syncStats = {
                created: 0,
                updated: 0,
                errors: 0,
                total: qdrantCollections.length
            };

            // 4. Para cada collection do Qdrant, sincronizar com a BD
            for (const qdrantCol of qdrantCollections) {
                try {
                    const collectionName = qdrantCol.name;
                    console.log(`🔄 Processando collection: ${collectionName}`);

                    // Buscar informações detalhadas da collection
                    let collectionInfo;
                    try {
                        collectionInfo = await this.getCollectionInfo(collectionName);
                    } catch (infoError) {
                        console.warn(`⚠️ Não foi possível obter informações detalhadas da collection ${collectionName}:`, infoError.message);
                        collectionInfo = null;
                    }

                    const vectorSize = collectionInfo?.config?.params?.vectors?.size || 1536;
                    const distanceMetric = collectionInfo?.config?.params?.vectors?.distance || 'Cosine';
                    const totalVectors = collectionInfo?.vectors_count || 0;

                    if (dbCollectionMap.has(collectionName)) {
                        // Collection já existe na BD - atualizar
                        await db.query(`
                            UPDATE vector_collections SET
                                vector_size = $1,
                                distance_metric = $2,
                                qdrant_status = 'ACTIVE',
                                total_vectors = $3,
                                last_sync = NOW(),
                                config = $4,
                                updated_at = NOW()
                            WHERE collection_name = $5
                        `, [
                            vectorSize,
                            distanceMetric,
                            totalVectors,
                            JSON.stringify(collectionInfo || {}),
                            collectionName
                        ]);

                        syncStats.updated++;
                        console.log(`✅ Collection atualizada: ${collectionName}`);
                    } else {
                        // Collection nova - criar na BD
                        await db.query(`
                            INSERT INTO vector_collections (
                                collection_name,
                                hotel_id,
                                description,
                                vector_size,
                                distance_metric,
                                qdrant_status,
                                total_vectors,
                                last_sync,
                                config
                            ) VALUES ($1, NULL, $2, $3, $4, 'ACTIVE', $5, NOW(), $6)
                        `, [
                            collectionName,
                            `Collection sincronizada automaticamente do Qdrant`,
                            vectorSize,
                            distanceMetric,
                            totalVectors,
                            JSON.stringify(collectionInfo || {})
                        ]);

                        syncStats.created++;
                        console.log(`✅ Collection criada: ${collectionName}`);
                    }
                } catch (error) {
                    console.error(`❌ Erro ao processar collection ${qdrantCol.name}:`, error);
                    syncStats.errors++;
                }
            }

            // 5. Marcar collections que não existem mais no Qdrant como INACTIVE
            const qdrantCollectionNames = qdrantCollections.map(col => col.name);
            if (qdrantCollectionNames.length > 0) {
                const placeholders = qdrantCollectionNames.map(() => '?').join(',');
                await db.query(`
                    UPDATE vector_collections 
                    SET qdrant_status = 'INACTIVE', updated_at = NOW()
                    WHERE collection_name NOT IN (${placeholders}) AND qdrant_status = 'ACTIVE'
                `, qdrantCollectionNames);
            }

            console.log('✅ Sincronização concluída:', syncStats);
            return {
                success: true,
                stats: syncStats,
                collections: qdrantCollections
            };

        } catch (error) {
            console.error('❌ Erro na sincronização:', error);
            throw error;
        }
    }

    /**
     * Cria uma nova collection no Qdrant
     */
    async createCollection(collectionName, vectorSize = 1536, distanceMetric = 'Cosine', hotelId = null, hotelUuid = null) {
        try {
            console.log(`🚀 Criando collection no Qdrant: ${collectionName}`);

            const payload = {
                vectors: {
                    size: vectorSize,
                    distance: distanceMetric
                }
            };

            const createResponse = await this.qdrantClient.put(`/collections/${collectionName}`, payload);
            console.log(`✅ Collection criada no Qdrant: ${collectionName}`);

            // Salvar na base de dados
            await db.query(`
                INSERT INTO vector_collections (
                    collection_name,
                    hotel_id,
                    hotel_uuid,
                    description,
                    vector_size,
                    distance_metric,
                    qdrant_status,
                    total_vectors,
                    last_sync,
                    config
                ) VALUES ($1, $2, $3, $4, $5, $6, 'ACTIVE', 0, NOW(), $7)
            `, [
                collectionName,
                hotelId,
                hotelUuid,
                `Collection criada via API`,
                vectorSize,
                distanceMetric,
                JSON.stringify({ created_via_api: true })
            ]);

            console.log(`✅ Collection salva na base de dados: ${collectionName}`);

            return {
                success: true,
                collection_name: collectionName,
                message: 'Collection criada com sucesso'
            };

        } catch (error) {
            console.error(`❌ Erro ao criar collection ${collectionName}:`, error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Remove uma collection do Qdrant
     */
    async deleteCollection(collectionName) {
        try {
            console.log(`🗑️ Removendo collection do Qdrant: ${collectionName}`);

            await this.qdrantClient.delete(`/collections/${collectionName}`);
            console.log(`✅ Collection removida do Qdrant: ${collectionName}`);

            // Atualizar status na base de dados
            await db.query(`
                UPDATE vector_collections 
                SET qdrant_status = 'INACTIVE', updated_at = NOW()
                WHERE collection_name = $1
            `, [collectionName]);

            console.log(`✅ Status da collection atualizado na base de dados: ${collectionName}`);

            return {
                success: true,
                collection_name: collectionName,
                message: 'Collection removida com sucesso'
            };

        } catch (error) {
            console.error(`❌ Erro ao remover collection ${collectionName}:`, error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Conta collections de um hotel específico
     */
    async getHotelCollectionsCount(hotelUuid) {
        try {
            console.log(`🔢 Contando collections do hotel: ${hotelUuid}`);
            
            // Primeiro, buscar informações do hotel (id e nome) pelo hotel_uuid
            const hotelRows = await db.query(`
                SELECT id, name FROM hotels WHERE hotel_uuid = $1
            `, [hotelUuid]);
            
            if (hotelRows.length === 0) {
                console.log(`⚠️ Hotel não encontrado com UUID: ${hotelUuid}`);
                throw new Error('Hotel não encontrado');
            }
            
            const hotelId = hotelRows[0].id;
            const hotelName = hotelRows[0].name;
            console.log(`📋 Hotel encontrado: ID=${hotelId}, Nome="${hotelName}" para UUID: ${hotelUuid}`);
            
            // Criar padrão de busca baseado no nome do hotel
            // "O Sócio Hoteleiro Treinamentos" -> "osociohoteleiro"
            // Remover acentos, espaços, caracteres especiais e converter para lowercase
            const hotelPrefix = hotelName
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '') // Remove acentos
                .toLowerCase()
                .replace(/[^a-z0-9]/g, '') // Remove tudo que não seja letra ou número
                .replace(/^o/, ''); // Remove "O" inicial se existir
                
            console.log(`🔍 Padrão de busca criado: "${hotelPrefix}" baseado no nome "${hotelName}"`);
            
            // Buscar collections que começam com o prefixo do hotel OU estão relacionadas diretamente
            const collectionsDetails = await db.query(`
                SELECT collection_name, hotel_id, hotel_uuid, qdrant_status
                FROM vector_collections 
                WHERE (LOWER(collection_name) LIKE $1 OR hotel_uuid = $2) AND qdrant_status = 'ACTIVE'
            `, [`${hotelPrefix}%`, hotelUuid]);
            
            const count = collectionsDetails.length;
            console.log(`✅ Hotel ${hotelUuid} possui ${count} collections relacionadas`);
            console.log(`🔍 Collections encontradas:`, collectionsDetails);
            
            return {
                success: true,
                hotel_uuid: hotelUuid,
                hotel_name: hotelName,
                hotel_prefix: hotelPrefix,
                collections_count: count,
                collections_details: collectionsDetails,
                message: 'Contagem realizada com sucesso'
            };
        } catch (error) {
            console.error(`❌ Erro ao contar collections do hotel ${hotelUuid}:`, error);
            throw error;
        }
    }

    /**
     * Lista collections disponíveis para relacionar com hotéis
     */
    async getAvailableCollections() {
        try {
            console.log('📋 Buscando collections disponíveis para relacionar...');
            
            // Buscar collections do Qdrant
            const qdrantCollections = await this.getQdrantCollections();
            
            // Buscar collections já relacionadas na base de dados
            const dbCollections = await db.query(`
                SELECT collection_name, hotel_uuid, description, qdrant_status
                FROM vector_collections 
                WHERE qdrant_status = 'ACTIVE'
                ORDER BY collection_name
            `);
            
            // Criar mapa das collections já relacionadas
            const relatedCollections = new Map();
            dbCollections.forEach(col => {
                relatedCollections.set(col.collection_name, {
                    hotel_uuid: col.hotel_uuid,
                    description: col.description,
                    status: col.qdrant_status
                });
            });
            
            // Processar collections do Qdrant
            const availableCollections = qdrantCollections.map(qdrantCol => {
                const related = relatedCollections.get(qdrantCol.name);
                return {
                    name: qdrantCol.name,
                    vectors_count: qdrantCol.vectors_count || 0,
                    is_related: !!related?.hotel_uuid,
                    related_hotel_uuid: related?.hotel_uuid || null,
                    description: related?.description || `Collection ${qdrantCol.name}`,
                    status: related?.status || 'AVAILABLE'
                };
            });
            
            console.log(`✅ Encontradas ${availableCollections.length} collections disponíveis`);
            return {
                success: true,
                total: availableCollections.length,
                collections: availableCollections,
                message: 'Collections listadas com sucesso'
            };
        } catch (error) {
            console.error('❌ Erro ao listar collections disponíveis:', error);
            throw error;
        }
    }

    /**
     * Cria uma integração Qdrant para um hotel
     */
    async createQdrantIntegration(hotelUuid, collectionName) {
        try {
            console.log(`🔗 Criando integração Qdrant para hotel ${hotelUuid} com collection ${collectionName}...`);
            
            // Verificar se já existe uma integração Qdrant para este hotel
            const existingIntegrations = await db.query(`
                SELECT id FROM Integracoes 
                WHERE hotel_uuid = $1 AND integration_name = 'Qdrant'
            `, [hotelUuid]);
            
            if (existingIntegrations.length > 0) {
                // Atualizar integração existente com a nova collection
                await db.query(`
                    UPDATE Integracoes SET
                        instancia_name = $1,
                        apikey = 'Bearer kZDY]:V%X4wV6[SXBHyX',
                        url_api = 'https://osh-ia-qdrant.d32pnk.easypanel.host'
                    WHERE hotel_uuid = $2 AND integration_name = 'Qdrant'
                `, [collectionName, hotelUuid]);
                
                console.log(`✅ Integração Qdrant atualizada para hotel ${hotelUuid}`);
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
                    'Qdrant',
                    hotelUuid,
                    'Bearer kZDY]:V%X4wV6[SXBHyX',
                    collectionName,
                    'https://osh-ia-qdrant.d32pnk.easypanel.host'
                ]);
                
                console.log(`✅ Nova integração Qdrant criada para hotel ${hotelUuid}`);
            }
        } catch (error) {
            console.error(`❌ Erro ao criar integração Qdrant:`, error);
            throw error;
        }
    }

    /**
     * Relaciona uma collection a um hotel específico
     */
    async relateCollectionToHotel(collectionName, hotelUuid) {
        try {
            console.log(`🔗 Relacionando collection ${collectionName} ao hotel ${hotelUuid}...`);
            
            // Verificar se o hotel existe
            const hotelRows = await db.query(`
                SELECT id, hotel_nome as name FROM hotels WHERE hotel_uuid = $1
            `, [hotelUuid]);
            
            if (hotelRows.length === 0) {
                throw new Error('Hotel não encontrado');
            }
            
            const hotel = hotelRows[0];
            
            // Verificar se a collection existe no Qdrant
            try {
                await this.getCollectionInfo(collectionName);
            } catch (error) {
                throw new Error(`Collection '${collectionName}' não encontrada no Qdrant`);
            }
            
            // Verificar se a collection já está na base de dados
            const existingRows = await db.query(`
                SELECT id, hotel_uuid FROM vector_collections WHERE collection_name = $1
            `, [collectionName]);
            
            if (existingRows.length > 0) {
                // Atualizar relacionamento existente
                await db.query(`
                    UPDATE vector_collections SET
                        hotel_id = $1,
                        hotel_uuid = $2,
                        description = $3,
                        updated_at = NOW()
                    WHERE collection_name = $4
                `, [
                    hotel.id,
                    hotelUuid,
                    `Collection relacionada ao hotel ${hotel.name}`,
                    collectionName
                ]);
                
                console.log(`✅ Collection ${collectionName} relacionada ao hotel ${hotel.name}`);
            } else {
                // Criar novo registro
                const collectionInfo = await this.getCollectionInfo(collectionName);
                const vectorSize = collectionInfo?.config?.params?.vectors?.size || 1536;
                const distanceMetric = collectionInfo?.config?.params?.vectors?.distance || 'Cosine';
                const totalVectors = collectionInfo?.vectors_count || 0;
                
                await db.query(`
                    INSERT INTO vector_collections (
                        collection_name,
                        hotel_id,
                        hotel_uuid,
                        description,
                        vector_size,
                        distance_metric,
                        qdrant_status,
                        total_vectors,
                        last_sync,
                        config
                    ) VALUES ($1, $2, $3, $4, $5, $6, 'ACTIVE', $7, NOW(), $8)
                `, [
                    collectionName,
                    hotel.id,
                    hotelUuid,
                    `Collection relacionada ao hotel ${hotel.name}`,
                    vectorSize,
                    distanceMetric,
                    totalVectors,
                    JSON.stringify(collectionInfo || {})
                ]);
                
                console.log(`✅ Collection ${collectionName} criada e relacionada ao hotel ${hotel.name}`);
            }
            
            // Criar/atualizar integração Qdrant automaticamente
            await this.createQdrantIntegration(hotelUuid, collectionName);
            
            return {
                success: true,
                collection_name: collectionName,
                hotel_uuid: hotelUuid,
                hotel_name: hotel.name,
                message: `Collection '${collectionName}' relacionada ao hotel '${hotel.name}' com sucesso e integração Qdrant criada`
            };
            
        } catch (error) {
            console.error(`❌ Erro ao relacionar collection ${collectionName} ao hotel ${hotelUuid}:`, error);
            throw error;
        }
    }

    /**
     * Remove integração Qdrant de um hotel
     */
    async removeQdrantIntegration(hotelUuid) {
        try {
            console.log(`🗑️ Removendo integração Qdrant do hotel ${hotelUuid}...`);
            
            // Verificar se ainda existem outras collections relacionadas ao hotel
            const remainingCollections = await db.query(`
                SELECT COUNT(*) as count FROM vector_collections 
                WHERE hotel_uuid = $1 AND qdrant_status = 'ACTIVE'
            `, [hotelUuid]);
            
            const hasOtherCollections = remainingCollections[0].count > 0;
            
            if (!hasOtherCollections) {
                // Só remove a integração se não houver mais collections relacionadas
                await db.query(`
                    DELETE FROM Integracoes 
                    WHERE hotel_uuid = $1 AND integration_name = 'Qdrant'
                `, [hotelUuid]);
                
                console.log(`✅ Integração Qdrant removida do hotel ${hotelUuid} (não há mais collections)`);
            } else {
                console.log(`⚠️ Integração Qdrant mantida para hotel ${hotelUuid} (ainda possui collections ativas)`);
            }
        } catch (error) {
            console.error(`❌ Erro ao remover integração Qdrant:`, error);
            throw error;
        }
    }

    /**
     * Remove o relacionamento entre uma collection e um hotel
     */
    async unrelateCollectionFromHotel(collectionName, hotelUuid) {
        try {
            console.log(`🔓 Removendo relacionamento da collection ${collectionName} do hotel ${hotelUuid}...`);
            
            // Verificar se a collection está realmente relacionada a este hotel
            const collectionRows = await db.query(`
                SELECT hotel_uuid FROM vector_collections WHERE collection_name = $1 AND hotel_uuid = $2
            `, [collectionName, hotelUuid]);
            
            if (collectionRows.length === 0) {
                throw new Error(`Você precisa selecionar um hotel para remover suas Collections.`);
            }
            
            // Remover relacionamento (não excluir a collection, apenas definir hotel_id como NULL)
            await db.query(`
                UPDATE vector_collections SET
                    hotel_id = NULL,
                    hotel_uuid = NULL,
                    description = $1,
                    updated_at = NOW()
                WHERE collection_name = $2 AND hotel_uuid = $3
            `, [
                `Collection ${collectionName} (sem relacionamento)`,
                collectionName,
                hotelUuid
            ]);
            
            console.log(`✅ Relacionamento da collection ${collectionName} removido do hotel ${hotelUuid}`);
            
            // Remover registro da tabela Integracoes onde integration_name = 'Qdrant' 
            // e instancia_name é igual ao collection_name e hotel_uuid corresponde
            await db.query(`
                DELETE FROM Integracoes 
                WHERE integration_name = 'Qdrant' 
                AND hotel_uuid = $1 
                AND instancia_name = $2
            `, [hotelUuid, collectionName]);
            
            console.log(`✅ Integração Qdrant removida para collection ${collectionName} do hotel ${hotelUuid}`);
            
            return {
                success: true,
                collection_name: collectionName,
                hotel_uuid: hotelUuid,
                message: `Relacionamento da collection '${collectionName}' removido com sucesso e integração deletada`
            };
        } catch (error) {
            console.error(`❌ Erro ao remover relacionamento da collection ${collectionName}:`, error);
            throw error;
        }
    }

    /**
     * Lista collections relacionadas a um hotel específico
     */
    async getHotelCollections(hotelUuid) {
        try {
            console.log(`🔍 Buscando collections do hotel ${hotelUuid}...`);
            
            const collections = await db.query(`
                SELECT 
                    vc.id,
                    vc.collection_name,
                    vc.description,
                    vc.vector_size,
                    vc.distance_metric,
                    vc.qdrant_status,
                    vc.total_vectors,
                    vc.last_sync,
                    vc.created_at,
                    h.hotel_nome as hotel_name
                FROM vector_collections vc
                LEFT JOIN hotels h ON vc.hotel_id = h.id
                WHERE vc.hotel_uuid = $1 AND vc.qdrant_status = 'ACTIVE'
                ORDER BY vc.collection_name
            `, [hotelUuid]);
            
            console.log(`✅ Encontradas ${collections.length} collections para o hotel ${hotelUuid}`);
            return {
                success: true,
                hotel_uuid: hotelUuid,
                total: collections.length,
                collections: collections,
                message: 'Collections do hotel listadas com sucesso'
            };
        } catch (error) {
            console.error(`❌ Erro ao buscar collections do hotel ${hotelUuid}:`, error);
            throw error;
        }
    }

    /**
     * Testa a conectividade com o Qdrant
     */
    async testConnection() {
        try {
            console.log('🔍 Testando conexão com Qdrant...');
            
            // Tentar listar collections para testar conectividade
            const response = await this.qdrantClient.get('/collections');
            
            console.log('✅ Conexão com Qdrant OK');
            return {
                success: true,
                status: 'connected',
                collections_count: response.data?.result?.collections?.length || 0,
                message: 'Conexão com Qdrant estabelecida com sucesso'
            };
        } catch (error) {
            console.error('❌ Erro na conexão com Qdrant:', error.response?.data || error.message);
            return {
                success: false,
                status: 'error',
                error: error.response?.data?.message || error.message,
                message: 'Erro ao conectar com Qdrant'
            };
        }
    }

}

module.exports = new QdrantService();