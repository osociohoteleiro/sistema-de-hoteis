// import puppeteer from "puppeteer"

// const body_selector = `#b2hotelPage`

// const calendar_selector = `#hp_availability_style_changes > div:nth-child(4)`

// const calendar_from_button_selector = `#hp_availability_style_changes > div:nth-child(4) > div > form > div > div:nth-child(1) > div > div > button:nth-child(2)`
// const calendar_to_button_selector = `#hp_availability_style_changes > div:nth-child(4) > div > form > div > div:nth-child(1) > div > div > button:nth-child(4)`
// const calendar_submit_button_selector = `#hp_availability_style_changes > div:nth-child(4) > div > form > div > div.e22b782521.d12ff5f5bf > button`

// const calendar_previous_months_button_selector = `#hp_availability_style_changes > div:nth-child(4) > div > form > div > div:nth-child(1) > div > div.fd2e064a9d > div > div > div.a10b0e2d13.c807ff2d48 > button.a83ed08757.c21c56c305.f38b6daa18.d691166b09.f671049264.f4552b6561.dc72a8413c.c9804790f7`
// const calendar_next_months_button_selector = `#hp_availability_style_changes > div:nth-child(4) > div > form > div > div:nth-child(1) > div > div.fd2e064a9d > div > div > div.a10b0e2d13.c807ff2d48 > button`

// const calendar_left_heading_selector = `#no_availability_msg > div.change_dates > div:nth-child(2) > div > form > div > div:nth-child(1) > div > div.fd2e064a9d > div > div > div.a10b0e2d13.c807ff2d48 > div > div:nth-child(1) > h3`
// const calendar_right_heading_selector = `#no_availability_msg > div.change_dates > div:nth-child(2) > div > form > div > div:nth-child(1) > div > div.fd2e064a9d > div > div > div.a10b0e2d13.c807ff2d48 > div > div:nth-child(2) > h3`

// const calendar_left_days_table_selector = `#hp_availability_style_changes > div:nth-child(4) > div > form > div > div:nth-child(1) > div > div.fd2e064a9d > div > div > div.a10b0e2d13.c807ff2d48 > div > div:nth-child(1) > table > tbody`
// const calendar_right_days_table_selector = `#hp_availability_style_changes > div:nth-child(4) > div > form > div > div:nth-child(1) > div > div.fd2e064a9d > div > div > div.a10b0e2d13.c807ff2d48 > div > div:nth-child(2) > table > tbody`

// const calendar_table_weeks_selector = `tr`
// const calendar_table_days_selector = `td`

// const valid_days_values = {
//   "1": "1",
//   "2": "2",
//   "3": "3",
//   "4": "4",
//   "5": "5",
//   "6": "6",
//   "7": "7",
//   "8": "8",
//   "9": "9",
//   "10": "10",
//   "11": "11",
//   "12": "12",
//   "13": "13",
//   "14": "14",
//   "15": "15",
//   "16": "16",
//   "17": "17",
//   "18": "18",
//   "19": "19",
//   "20": "20",
//   "21": "21",
//   "22": "22",
//   "23": "23",
//   "24": "24",
//   "25": "25",
//   "26": "26",
//   "27": "27",
//   "28": "28",
//   "29": "29",
//   "30": "30",
//   "31": "31",
// }

// const valid_months_values = [
//   ["janeiro", "january"],
//   ["fevereiro", "february"],
//   ["março", "march"],
//   ["abril", "april"],
//   ["maio", "may"],
//   ["junho", "june"],
//   ["julho", "july"],
//   ["agosto", "august"],
//   ["setembro", "september"],
//   ["outubro", "october"],
//   ["novembro", "november"],
//   ["dezembro", "december"],
// ];

// function wait(timeout = 500) {
//   return new Promise((resolve, reject) => {
//     setTimeout(() => {
//       resolve(null)
//     }, timeout)
//   })
// }

// /**
//  * @param {string} url A URL da página de onde o scrapper ira retirar os dados. Deve ser uma página de dentro da listagem do "Google Meu Megócio"
//  * @param {string} start_date
//  * @param {string} end_date
//  * @returns {Promise<void>}
//  */
// export async function main(url, start_date, end_date) {
//   const browser = await puppeteer.launch({
//     headless: false,
//     defaultViewport: {
//       width: 1366,
//       height: 768,
//     }
//   })
//   // const [pagination_page, collect_page] = await Promise.all([
//   //   browser.newPage(),
//   //   browser.newPage()
//   // ])

//   const main_page = await browser.newPage()

//   await main_page.bringToFront()

//   await Promise.all([
//     main_page.waitForNavigation(),
//     main_page.goto(url)
//   ])

//   // Grants that clanedar input exists
//   await main_page.waitForSelector(calendar_selector, { timeout: 10000 })

//   // Get "FROM" Calendar
//   const calendar_from_button = await main_page.$(calendar_from_button_selector)
//   await calendar_from_button.click()

//   const calendar_left_days_table = await main_page.waitForSelector(calendar_left_days_table_selector, { timeout: 10000 })

//   const calendar_left_weeks = await calendar_left_days_table.$$(calendar_table_weeks_selector)

//   /**
//    * @type {{ [key: string]: import('puppeteer').ElementHandle<HTMLTableCellElement> }}
//    */
//   const from_calendar_days_buttons = {}

//   for (const week of calendar_left_weeks) {
//     const days = await week.$$(calendar_table_days_selector)

//     for (const day of days) {
//       const text_property = await day.getProperty("textContent")
//       const text_property_value = await text_property.jsonValue()

//       if (valid_days_values[text_property_value]) {
//         from_calendar_days_buttons[text_property_value] = day
//       }
//     }
//   }

//   await from_calendar_days_buttons["15"].click()
//   await wait(5000)
//   await from_calendar_days_buttons["31"].click()

//   // const text = await calendar_element.getProperty("textContent")
//   // const parsed_text = await text.jsonValue()

//   await wait(5000)
//   await browser.close()
// }

// const url = `https://www.booking.com/hotel/br/mandala-beach.en-gb.html?aid=1874373&label=mandala-beach-JM9m3y5ebzStTOIYoyHRpAS675442546489%3Apl%3Ata%3Ap1%3Ap2%3Aac%3Aap%3Aneg%3Afi%3Atikwd-1724037600193%3Alp9074171%3Ali%3Adec%3Adm%3Appccp%3DUmFuZG9tSVYkc2RlIyh9YQB9rNbOPxnnFAi1Ok_ieYY&sid=cf097271e8ae86f677c3b3351326bf6a&all_sr_blocks=884085702_385861817_2_1_0;checkin=2024-10-22;checkout=2024-10-23;dest_id=-677399;dest_type=city;dist=0;group_adults=2;group_children=0;hapos=1;highlighted_blocks=884085702_385861817_2_1_0;hpos=1;matching_block_id=884085702_385861817_2_1_0;no_rooms=1;req_adults=2;req_children=0;room1=A%2CA;sb_price_type=total;sr_order=popularity;sr_pri_blocks=884085702_385861817_2_1_0__57459;srepoch=1729033964;srpvid=127ea334c9d50159;type=total;ucfs=1&`

// main(url)