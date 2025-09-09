const ExcelJS = require("exceljs")
const fs = require("node:fs")
const readline = require("node:readline")

/**
 * @param {string} entry_csv_file_name Nome/Caminho do arquivo ".csv" de onde serão extraidos os dados 
 * @param {string} exit_xlsx_file_name Nome/Caminho do arquivo ".xlsx" que será gerado ao fim da execução
 */
async function convert_csv_to_xlsx(entry_csv_file_name, exit_xlsx_file_name) {
  return new Promise((resolve) => {
    const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({
      filename: exit_xlsx_file_name,
    })

    const worksheet = workbook.addWorksheet("Prices")

    const csv_read_stream = fs.createReadStream(
      entry_csv_file_name,
      // Delimita o tamanho máximo de cada chunk para 256 
      { highWaterMark: 256 }
    )
    const readline_events = readline.createInterface({
      input: csv_read_stream,
      terminal: false
    })

    readline_events.on("line", (data) => {
      const [search_start_date = "", search_end_date = "", price = ""] = data.split(";")

      worksheet.addRow([search_start_date, search_end_date, price]).commit()
    })
    readline_events.on("close", () => {
      worksheet.commit()
      workbook.commit()

      resolve()
    })
  })
}

module.exports = {
  convert_csv_to_xlsx,
}