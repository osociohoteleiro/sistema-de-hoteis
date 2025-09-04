const path = require('node:path')
const fs = require('fs').promises

const config_json = require('./config.json')
const { logger } = require('./logger')

// Usar a versão otimizada por padrão, com fallback para a antiga
const { extract_prices_from_booking } = process.env.USE_OLD_EXTRACTOR === 'true' 
  ? require('./booking-via-js-vars-extractor-with-bundle-handler.js')
  : require('./booking-extractor-optimized.js')

const { convert_csv_to_xlsx } = require('./conversor')

async function ensureDirectoriesExist() {
  const dirs = [
    path.join(process.cwd(), 'results'),
    path.join(process.cwd(), 'results', 'extracted-data'),
    path.join(process.cwd(), 'results', 'extracted-data', 'csv'),
    path.join(process.cwd(), 'results', 'extracted-data', 'xlsx'),
    path.join(process.cwd(), 'logs')
  ];

  for (const dir of dirs) {
    try {
      await fs.access(dir);
    } catch {
      await fs.mkdir(dir, { recursive: true });
      logger.info(`Created directory: ${dir}`);
    }
  }
}

async function main() {
  const startTime = Date.now();
  
  try {
    logger.info('=== RATE SHOPPER STARTING ===', {
      event: 'application_start',
      platform: process.platform,
      node_version: process.version,
      headless_mode: process.env.HEADLESS === 'true'
    });

    // Garantir que os diretórios existam
    await ensureDirectoriesExist();

    console.log('🚀 Rate Shopper - Booking.com Price Extractor');
    console.log(`📊 Properties to search: ${config_json.properties.length}`);
    console.log(`🖥️  Platform: ${process.platform}`);
    console.log(`🔧 Headless mode: ${process.env.HEADLESS === 'true' ? 'Yes' : 'No'}`);
    console.log('');

    let totalPropertiesProcessed = 0;
    let totalPricesExtracted = 0;

    for (let i = 0; i < config_json.properties.length; i++) {
      const property = config_json.properties[i];
      const propertyIndex = i + 1;
      
      console.log(`\n🏨 Processing property ${propertyIndex}/${config_json.properties.length}: ${property.name}`);

      try {
        const parsed_start_date = new Date(property.start_date);
        const parsed_end_date = new Date(property.end_date);

        // Validar datas
        if (isNaN(parsed_start_date.getTime()) || isNaN(parsed_end_date.getTime())) {
          throw new Error(`Invalid dates for property ${property.name}`);
        }

        if (parsed_start_date >= parsed_end_date) {
          throw new Error(`Start date must be before end date for property ${property.name}`);
        }

        const results_filename_timestamp = new Date().toISOString().replace(/[.:]+/g, "-");
        const results_filename_csv = `${property.name}_${results_filename_timestamp}_from_${property.start_date}_to_${property.end_date}.csv`;
        const results_filename_xlsx = `${property.name}_${results_filename_timestamp}_from_${property.start_date}_to_${property.end_date}.xlsx`;

        const results_filepath_csv = path.join(process.cwd(), 'results', 'extracted-data', 'csv', results_filename_csv);
        const results_filepath_xlsx = path.join(process.cwd(), 'results', 'extracted-data', 'xlsx', results_filename_xlsx);

        // Extrair preços
        await extract_prices_from_booking(
          property.url, 
          parsed_start_date, 
          parsed_end_date, 
          property.max_bundle_size || 7, 
          results_filepath_csv
        );

        // Converter para Excel
        console.log(`📝 Converting to Excel: ${results_filename_xlsx}`);
        await convert_csv_to_xlsx(results_filepath_csv, results_filepath_xlsx);

        totalPropertiesProcessed++;
        console.log(`✅ Property ${propertyIndex} completed successfully`);

      } catch (error) {
        logger.error(`Property processing failed: ${property.name}`, {
          event: 'property_error',
          property: property.name,
          error: error.message,
          stack: error.stack
        });
        console.log(`❌ Property ${propertyIndex} failed: ${error.message}`);
      }
    }

    const duration = Math.round((Date.now() - startTime) / 1000);
    
    logger.info('=== RATE SHOPPER COMPLETED ===', {
      event: 'application_end',
      total_properties: config_json.properties.length,
      properties_processed: totalPropertiesProcessed,
      duration_seconds: duration
    });

    console.log('\n🎉 Rate Shopper Execution Summary');
    console.log(`📊 Total properties: ${config_json.properties.length}`);
    console.log(`✅ Successfully processed: ${totalPropertiesProcessed}`);
    console.log(`❌ Failed: ${config_json.properties.length - totalPropertiesProcessed}`);
    console.log(`⏱️  Total duration: ${duration}s`);
    console.log(`📁 Results saved in: ./results/extracted-data/`);
    console.log(`📋 Logs saved in: ./logs/`);

  } catch (error) {
    logger.error('Application failed', {
      event: 'application_error',
      error: error.message,
      stack: error.stack
    });
    console.error('💥 Application failed:', error.message);
    process.exit(1);
  }
}

main()