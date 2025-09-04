const path = require('node:path')

const config_json = require('./config.json')

const { extract_prices_from_booking } = require('./booking-via-js-vars-extractor-with-bundle-handler.js')
const { convert_csv_to_xlsx } = require('./conversor')

async function main() {
  console.log('------------------------')
  console.log('| STARTING APPLICATION |')
  console.log('------------------------\n')

  console.log(`${config_json.properties.length} properties identified to be searched\n`)

  let i = 1
  for (const property of config_json.properties) {
    console.log(`Searching by property ${i} of ${config_json.properties.length}\n`)

    const parsed_start_date = new Date(property.start_date)
    const parsed_end_date = new Date(property.end_date)

    const results_filename_timestamp = new Date().toISOString().replace(/[.:]+/g, "-")

    const results_filename_csv = `${property.name}_${results_filename_timestamp}_from_${property.start_date}_to_${property.end_date}.csv`
    const results_filename_xlsx = `${property.name}_${results_filename_timestamp}_from_${property.start_date}_to_${property.end_date}.xlsx`

    const results_filepath_csv = path.join(process.cwd(), 'results', 'extracted-data', 'csv', results_filename_csv)
    const results_filepath_xlsx = path.join(process.cwd(), 'results', 'extracted-data', 'xlsx', results_filename_xlsx)

    await extract_prices_from_booking(property.url, parsed_start_date, parsed_end_date, property.max_bundle_size, results_filepath_csv)

    console.log(`Saving search results of property ${i} of ${config_json.properties.length} to file "${results_filename_xlsx}"\n`)
    await convert_csv_to_xlsx(results_filepath_csv, results_filepath_xlsx)

    // TODO: Preencher a planilha de benckmark
  }

  console.log('-----------------------------')
  console.log('| SHUTTING APPLICATION DOWN |')
  console.log('-----------------------------\n')
}

main()