const fs = require("node:fs/promises")

function wait(timeout = 500) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(null)
    }, timeout)
  })
}

/**
 * 
 * @param {Date} date 
 */
function generate_booking_query_param_date(date) {
  let day = date.getUTCDate()
  let month = date.getUTCMonth() + 1
  const year = date.getUTCFullYear()

  if (day < 10) {
    day = `0${day}`
  } else {
    day = day.toString()
  }

  if (month < 10) {
    month = `0${month}`
  } else {
    month = month.toString()
  }

  return `${year}-${month}-${day}`
}

/**
 * 
 * @param {Date} date 
 */
function generate_final_result_date(date) {
  let day = date.getUTCDate()
  let month = date.getUTCMonth() + 1
  const year = date.getUTCFullYear()

  if (day < 10) {
    day = `0${day}`
  } else {
    day = day.toString()
  }

  if (month < 10) {
    month = `0${month}`
  } else {
    month = month.toString()
  }

  return `${day}/${month}/${year}`
}

/**
 * @param {string} target
 * @param {string} value
 * @param {string} semicolon_query 
 */
function replace_semicolon_query_param(target, value, semicolon_query) {
  const parts = semicolon_query.split(';')

  const param_index = parts.findIndex((value) => {
    return value.includes(target)
  })

  if (param_index === -1) return null

  parts.splice(param_index, 1, `${target}=${value}`)

  return parts.join(';')
}

/**
 * @param {string} checkin 
 * @param {string} checkout 
 */
function generate_new_booking_url(url, checkin, checkout) {
  const [base, ...query_params] = url.split('?')

  const url_obj = new URLSearchParams(query_params.join('?'))

  url_obj.delete('#no_availability_msg')

  const raw_semicolon_query_param = url_obj.get('checkin')

  url_obj.delete('checkin')

  const parsed_semicolon_query_param = `checkin=${raw_semicolon_query_param}`

  let new_url_semicolon_query_param = parsed_semicolon_query_param

  new_url_semicolon_query_param = replace_semicolon_query_param('checkin', checkin, new_url_semicolon_query_param)
  new_url_semicolon_query_param = replace_semicolon_query_param('checkout', checkout, new_url_semicolon_query_param)

  const new_url = `${base}?${url_obj.toString()}&${new_url_semicolon_query_param}`

  return new_url
}

/**
 * @param {string} checkin 
 * @param {string} checkout 
 */
function new_generate_new_booking_url(url, checkin, checkout) {
  const new_url = `${url}?checkin=${checkin};checkout=${checkout}`

  return new_url
}

/**
 * 
 * @param {Date} start_date 
 * @param {Date} end_date 
 * @returns 
 */
function get_dates_between(start_date, end_date) {
  /**
   * @type {Date[]}
   */
  const dates = [];

  while (start_date <= end_date) {
    const new_date = new Date(start_date.getTime())

    dates.push(new_date);

    start_date.setDate(start_date.getDate() + 1);
  }

  return dates;
}

/**
 * @param {Date} start_date
 * @param {Date} end_date
 * @returns
 */
function get_booking_urls(url, start_date, end_date) {
  const dates = get_dates_between(start_date, end_date)
  /**
   * @type {string[]}
   */
  const booking_urls = []

  for (const date of dates) {
    let next_day_date = date

    next_day_date = date.setDate(date.getDate() + 1)

    const current_url = generate_new_booking_url(
      url,
      generate_booking_query_param_date(date),
      generate_booking_query_param_date(next_day_date),
    )

    booking_urls.push(current_url)
  }

  return booking_urls
}

/**
 * @param {string} filepath 
 * @param {string} value 
 */
async function write_to_file(filepath, value) {
  const parsed_value = `${value}\n`

  await fs.appendFile(filepath, parsed_value)
}

module.exports = {
  wait,
  generate_booking_query_param_date,
  generate_final_result_date,
  replace_semicolon_query_param,
  generate_new_booking_url,
  new_generate_new_booking_url,
  get_dates_between,
  get_booking_urls,
  write_to_file,
}