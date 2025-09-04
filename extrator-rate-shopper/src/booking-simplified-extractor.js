const puppeteer = require("puppeteer")

const {
  wait,
  generate_booking_query_param_date,
  generate_final_result_date,
  get_dates_between,
  write_to_file,
  new_generate_new_booking_url,
} = require('./utils')

const prices_table_selector = `#hprt-table > tbody`
const prices_table_row_selector = `tr`
const prices_column_selector = `td:nth-child(3)`
const prices_element_selector = `div > div > div:nth-child(1) > div:nth-child(2) > div > span`

// const price_selector = `div > div > div:nth-child(1) > div:nth-child(2) > div`


/**
 * @param {string} url A URL da página de onde o scrapper ira retirar os dados. Deve ser uma página de dentro da listagem do "Google Meu Megócio"
 * @param {string} start_date
 * @param {string} end_date
 * @param {string} results_filepath
 * @returns {Promise<void>}
 */
async function extract_prices_from_booking(url, start_date, end_date, results_filepath) {
  const dates = get_dates_between(start_date, end_date)

  // const browser = await puppeteer.launch()

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
  });

  // const browser = await puppeteer.launch({
  //   headless: false,
  //   defaultViewport: {
  //     width: 1366,
  //     height: 768,
  //   }
  // })

  const main_page = await browser.newPage()

  let current_url = url

  let i = 1
  for (const date of dates) {
    const current_execution = i
    i++

    let next_day_date = new Date(date.getTime())
    next_day_date.setUTCDate(next_day_date.getUTCDate() + 1)

    const booking_query_param_current_date = generate_booking_query_param_date(date)
    const booking_query_param_next_day_date = generate_booking_query_param_date(next_day_date)

    const final_result_current_date = generate_final_result_date(date)
    const final_result_next_day_date = generate_final_result_date(next_day_date)

    current_url = new_generate_new_booking_url(
      url,
      booking_query_param_current_date,
      booking_query_param_next_day_date,
    )

    try {
      await Promise.all([
        main_page.waitForNavigation(),
        main_page.goto(current_url)
      ])

      const prices_table = await main_page.waitForSelector(prices_table_selector, { timeout: 10000 })

      const prices_table_rows = await prices_table.$$(prices_table_row_selector)
      const first_price_table_row = prices_table_rows[0]

      await prices_table.dispose()

      let selected_price = null

      try {
        let price_element_text_value = await first_price_table_row.evaluate((el) => {
          return el.getAttribute("data-hotel-rounded-price")
        })

        let parsed_monetary_value

        if (!price_element_text_value) {
          const price_column = await first_price_table_row.$(prices_column_selector)
          const price_element = await price_column.$(prices_element_selector)

          await first_price_table_row.dispose()
          await price_column.dispose()

          const price_element_text_property = await price_element.getProperty("textContent")

          await price_element.dispose()

          price_element_text_value = await price_element_text_property.jsonValue()

          await price_element_text_property.dispose()

          const price_element_text_value_parsed = price_element_text_value.replace(/[\n\t\r\u00A0 ]*/g, '')

          const [_, monetary_value] = price_element_text_value_parsed.split('R$')

          parsed_monetary_value = monetary_value

          if (parsed_monetary_value.includes('.') && parsed_monetary_value.includes(',')) {
            parsed_monetary_value = parsed_monetary_value.split('.').join('')
            parsed_monetary_value = parsed_monetary_value.split(',').join('.')
          } else if (!monetary_value.includes('.') && monetary_value.includes(',')) {
            parsed_monetary_value = parsed_monetary_value.split(',').join('.')
          } else if (monetary_value.includes('.') && !monetary_value.includes(',')) {
            parsed_monetary_value = parsed_monetary_value.split('.').join('')
          }
        } else {
          parsed_monetary_value = price_element_text_value
        }

        console.log({ selected_price: parsed_monetary_value })

        if (parsed_monetary_value && /[0-9]+/.test(parsed_monetary_value)) {
          selected_price = Number(parsed_monetary_value)
        }

        console.log({ selected_price_after_parse: selected_price })

      } catch (error) {
        console.error(error)
      }

      if (selected_price) {
        const selected_price_string = String(selected_price)
        const selected_price_string_parsed_to_brazil_locale =
          selected_price_string.split('.').join(',')

        const value = `${final_result_current_date};${final_result_next_day_date};${selected_price_string_parsed_to_brazil_locale}`
        write_to_file(results_filepath, value)
      } else {
        const value = `${final_result_current_date};${final_result_next_day_date};S/D`
        write_to_file(results_filepath, value)
      }
    } catch (error) {
      console.error(error)
      const value = `${final_result_current_date};${final_result_next_day_date};S/D`
      write_to_file(results_filepath, value)
    } finally {
      console.log(`Price ${current_execution} of ${dates.length} extracted`)
    }
  }

  await wait(5000)
  await browser.close()
}

module.exports = {
  extract_prices_from_booking,
}
