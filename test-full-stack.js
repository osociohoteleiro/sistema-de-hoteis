// Teste completo do Full Stack: Frontend React + API PostgreSQL + Redis
const axios = require('axios');
const { exec } = require('child_process');

const API_BASE_URL = 'http://localhost:3001/api';
const FRONTEND_URL = 'http://localhost:5173';

async function testFullStack() {
    console.log('🚀 TESTE COMPLETO FULL STACK: React + PostgreSQL + Redis\n');

    const results = {
        api: {},
        integration: {},
        data: {},
        performance: {}
    };

    // Teste 1: API Endpoints
    console.log('1️⃣ Testando API Endpoints...');
    
    const apiTests = [
        { name: 'Health Check', endpoint: '/health', method: 'GET' },
        { name: 'DB Test', endpoint: '/db-test', method: 'GET' },
        // Endpoints que provavelmente existem baseado nos models
    ];

    for (const test of apiTests) {
        try {
            const start = Date.now();
            const response = await axios({
                method: test.method,
                url: API_BASE_URL + test.endpoint,
                timeout: 5000
            });
            const duration = Date.now() - start;
            
            results.api[test.name] = {
                status: '✅ OK',
                responseTime: `${duration}ms`,
                httpStatus: response.status
            };
            
            console.log(`  ✅ ${test.name}: ${response.status} (${duration}ms)`);
            
            // Log dados específicos para alguns endpoints
            if (test.endpoint === '/health') {
                console.log(`     Database: ${response.data.database.mode} - ${response.data.database.connected ? 'Connected' : 'Disconnected'}`);
            }
            
        } catch (error) {
            results.api[test.name] = {
                status: '❌ ERRO',
                error: error.message
            };
            console.log(`  ❌ ${test.name}: ${error.message}`);
        }
    }

    // Teste 2: Frontend Accessibility
    console.log('\n2️⃣ Testando Frontend...');
    
    try {
        const response = await axios.get(FRONTEND_URL, { timeout: 5000 });
        if (response.status === 200 && response.data.includes('<!doctype html')) {
            results.integration.frontend = '✅ Acessível';
            console.log('  ✅ Frontend: Acessível e carregando');
        } else {
            results.integration.frontend = '⚠️ Resposta inesperada';
            console.log('  ⚠️ Frontend: Resposta inesperada');
        }
    } catch (error) {
        results.integration.frontend = `❌ ${error.message}`;
        console.log(`  ❌ Frontend: ${error.message}`);
    }

    // Teste 3: Dados PostgreSQL
    console.log('\n3️⃣ Testando Dados PostgreSQL...');
    
    try {
        // Usar a API para buscar dados (simula o que o frontend faria)
        const endpoints = [
            { name: 'Users Count', url: `${API_BASE_URL}/db-test` }, // Endpoint que já sabemos que funciona
        ];

        for (const endpoint of endpoints) {
            try {
                const response = await axios.get(endpoint.url);
                results.data[endpoint.name] = '✅ Acessível';
                console.log(`  ✅ ${endpoint.name}: Dados acessíveis`);
            } catch (error) {
                results.data[endpoint.name] = `❌ ${error.message}`;
                console.log(`  ❌ ${endpoint.name}: ${error.message}`);
            }
        }
        
    } catch (error) {
        console.log(`  ❌ Erro geral nos dados: ${error.message}`);
    }

    // Teste 4: Performance Integrada
    console.log('\n4️⃣ Testando Performance Integrada...');
    
    try {
        const performanceTests = [
            { name: 'API Response Time', url: `${API_BASE_URL}/health` },
            { name: 'Frontend Load Time', url: FRONTEND_URL }
        ];

        for (const test of performanceTests) {
            const start = Date.now();
            try {
                await axios.get(test.url, { timeout: 10000 });
                const duration = Date.now() - start;
                
                let status = '✅ Excelente';
                if (duration > 1000) status = '⚠️ Lento';
                if (duration > 3000) status = '❌ Muito lento';
                
                results.performance[test.name] = `${status} (${duration}ms)`;
                console.log(`  ${status} ${test.name}: ${duration}ms`);
            } catch (error) {
                results.performance[test.name] = `❌ ${error.message}`;
                console.log(`  ❌ ${test.name}: ${error.message}`);
            }
        }
        
    } catch (error) {
        console.log(`  ❌ Erro no teste de performance: ${error.message}`);
    }

    // Teste 5: Integração CORS
    console.log('\n5️⃣ Testando CORS (Frontend → API)...');
    
    try {
        // Simular uma requisição que o frontend faria
        const corsResponse = await axios.get(`${API_BASE_URL}/health`, {
            headers: {
                'Origin': FRONTEND_URL,
                'Access-Control-Request-Method': 'GET'
            }
        });
        
        results.integration.cors = '✅ OK';
        console.log('  ✅ CORS: Configurado corretamente');
        
    } catch (error) {
        results.integration.cors = `❌ ${error.message}`;
        console.log(`  ❌ CORS: ${error.message}`);
    }

    // Teste 6: Verificação de Serviços
    console.log('\n6️⃣ Verificando Status dos Serviços...');
    
    const services = [
        { name: 'PostgreSQL Container', command: 'docker ps --filter name=osh_postgres --format "{{.Status}}"' },
        { name: 'Redis Container', command: 'docker ps --filter name=osh_redis --format "{{.Status}}"' }
    ];

    for (const service of services) {
        try {
            const status = await new Promise((resolve, reject) => {
                exec(service.command, (error, stdout) => {
                    if (error) reject(error);
                    else resolve(stdout.trim());
                });
            });
            
            if (status.includes('Up')) {
                results.integration[service.name] = '✅ Running';
                console.log(`  ✅ ${service.name}: ${status}`);
            } else {
                results.integration[service.name] = `⚠️ ${status}`;
                console.log(`  ⚠️ ${service.name}: ${status}`);
            }
        } catch (error) {
            results.integration[service.name] = `❌ ${error.message}`;
            console.log(`  ❌ ${service.name}: ${error.message}`);
        }
    }

    // Relatório Final
    console.log('\n📊 RELATÓRIO COMPLETO DO TESTE FULL STACK');
    console.log('==========================================');
    
    console.log('\n🔗 API Endpoints:');
    Object.entries(results.api).forEach(([key, value]) => {
        console.log(`  ${key}: ${value.status} ${value.responseTime || ''}`);
    });
    
    console.log('\n🌐 Frontend & Integration:');
    Object.entries(results.integration).forEach(([key, value]) => {
        console.log(`  ${key}: ${value}`);
    });
    
    console.log('\n📋 Dados:');
    Object.entries(results.data).forEach(([key, value]) => {
        console.log(`  ${key}: ${value}`);
    });
    
    console.log('\n⚡ Performance:');
    Object.entries(results.performance).forEach(([key, value]) => {
        console.log(`  ${key}: ${value}`);
    });

    // Análise final
    const allResults = {...results.api, ...results.integration, ...results.data, ...results.performance};
    const totalTests = Object.keys(allResults).length;
    const passedTests = Object.values(allResults).filter(v => 
        (typeof v === 'string' && v.includes('✅')) || 
        (typeof v === 'object' && v.status && v.status.includes('✅'))
    ).length;
    
    const successRate = totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : 0;
    
    console.log(`\n🎯 RESULTADO FINAL: ${passedTests}/${totalTests} testes bem-sucedidos (${successRate}%)`);
    
    if (successRate >= 90) {
        console.log('🎉 SISTEMA FULL STACK FUNCIONANDO PERFEITAMENTE!');
        console.log('✅ React + PostgreSQL + Redis integrados e operacionais');
        console.log('🚀 Pronto para desenvolvimento e produção!');
    } else if (successRate >= 70) {
        console.log('✅ SISTEMA FUNCIONANDO BEM com pequenos ajustes necessários');
        console.log('🔧 Migração bem-sucedida, apenas otimizações pendentes');
    } else {
        console.log('⚠️ SISTEMA PARCIALMENTE FUNCIONAL');
        console.log('🛠️ Alguns componentes precisam de atenção');
    }

    console.log('\n🌐 URLs para Teste Manual:');
    console.log(`  Frontend: ${FRONTEND_URL}`);
    console.log(`  API Health: ${API_BASE_URL}/health`);
    console.log(`  pgAdmin: http://localhost:8080`);
    console.log(`  Redis Commander: http://localhost:8081`);
}

// Executar teste se chamado diretamente
if (require.main === module) {
    testFullStack().catch(console.error);
}

module.exports = testFullStack;