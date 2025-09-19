const db = require('./config/database');

async function createDefaultData() {
    try {
        console.log('Criando tags e campos personalizados padrão...');

        const workspaceUuid = 'a8e75bb1-c8f0-46fb-a9f5-5579e1aaea43';

        // Criar tags padrão
        const defaultTags = [
            { name: 'Cliente Potencial', color: '#10B981', description: 'Lead com potencial de conversão' },
            { name: 'Interessado', color: '#3B82F6', description: 'Demonstrou interesse no produto/serviço' },
            { name: 'Quente', color: '#EF4444', description: 'Lead com alta probabilidade de compra' },
            { name: 'Frio', color: '#6B7280', description: 'Lead com baixa probabilidade de compra' },
            { name: 'VIP', color: '#8B5CF6', description: 'Cliente VIP ou de alto valor' },
            { name: 'Seguimento', color: '#F59E0B', description: 'Necessita acompanhamento' },
            { name: 'Finalizado', color: '#059669', description: 'Processo de vendas finalizado' }
        ];

        for (const tag of defaultTags) {
            try {
                await db.query(`
                    INSERT INTO lead_tags (workspace_uuid, name, color, description)
                    VALUES ($1, $2, $3, $4)
                    ON CONFLICT (workspace_uuid, name) DO NOTHING
                `, [workspaceUuid, tag.name, tag.color, tag.description]);
                console.log('✅ Tag criada:', tag.name);
            } catch (error) {
                console.log('⚠️ Tag já existe:', tag.name);
            }
        }

        // Criar campos personalizados padrão
        const defaultFields = [
            {
                field_key: 'empresa',
                field_name: 'Empresa',
                field_type: 'text',
                description: 'Nome da empresa do lead',
                sort_order: 1
            },
            {
                field_key: 'cargo',
                field_name: 'Cargo',
                field_type: 'text',
                description: 'Cargo ou função do lead',
                sort_order: 2
            },
            {
                field_key: 'email',
                field_name: 'E-mail',
                field_type: 'text',
                description: 'Endereço de e-mail do lead',
                sort_order: 3
            },
            {
                field_key: 'interesse',
                field_name: 'Tipo de Interesse',
                field_type: 'select',
                field_options: ['Produto A', 'Produto B', 'Serviço C', 'Consultoria', 'Suporte'],
                description: 'Tipo de produto/serviço de interesse',
                sort_order: 4
            },
            {
                field_key: 'data_contato',
                field_name: 'Data do Primeiro Contato',
                field_type: 'date',
                description: 'Data do primeiro contato com o lead',
                sort_order: 5
            },
            {
                field_key: 'prioridade',
                field_name: 'Prioridade',
                field_type: 'select',
                field_options: ['Alta', 'Média', 'Baixa'],
                description: 'Nível de prioridade do lead',
                sort_order: 6
            },
            {
                field_key: 'orcamento',
                field_name: 'Orçamento Estimado',
                field_type: 'number',
                description: 'Orçamento estimado do lead (R$)',
                sort_order: 7
            },
            {
                field_key: 'newsletter',
                field_name: 'Aceita Newsletter',
                field_type: 'boolean',
                description: 'Lead aceita receber newsletter',
                default_value: 'false',
                sort_order: 8
            }
        ];

        for (const field of defaultFields) {
            try {
                await db.query(`
                    INSERT INTO lead_custom_field_definitions (
                        workspace_uuid, field_key, field_name, field_type,
                        field_options, is_required, default_value, description, sort_order
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                    ON CONFLICT (workspace_uuid, field_key) DO NOTHING
                `, [
                    workspaceUuid,
                    field.field_key,
                    field.field_name,
                    field.field_type,
                    field.field_options ? JSON.stringify(field.field_options) : null,
                    field.is_required || false,
                    field.default_value || null,
                    field.description,
                    field.sort_order
                ]);
                console.log('✅ Campo personalizado criado:', field.field_name);
            } catch (error) {
                console.log('⚠️ Campo já existe:', field.field_name);
            }
        }

        console.log('✅ Dados padrão criados com sucesso!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Erro ao criar dados padrão:', error);
        process.exit(1);
    }
}

createDefaultData();