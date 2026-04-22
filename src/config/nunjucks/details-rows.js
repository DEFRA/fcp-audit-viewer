const escapeHtml = (str) =>
  String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')

const renderDetailsHtml = (obj) => {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return escapeHtml(obj ?? '')
  }

  if (Array.isArray(obj)) {
    return obj
      .filter((item) => item !== null && item !== undefined)
      .map((item) => `<div class="govuk-summary-list__row"><dt class="govuk-summary-list__key"></dt><dd class="govuk-summary-list__value">${toHtmlValue(item, '')}</dd></div>`)
      .join('')
  }

  return Object.entries(obj)
    .filter(([, v]) => v !== null && v !== undefined)
    .map(([k, v]) => {
      if (Array.isArray(v)) {
        return v
          .filter((item) => item !== null && item !== undefined)
          .map((item) => `<div class="govuk-summary-list__row"><dt class="govuk-summary-list__key">${escapeHtml(k)}</dt><dd class="govuk-summary-list__value">${toHtmlValue(item, k)}</dd></div>`)
          .join('')
      }
      return `<div class="govuk-summary-list__row"><dt class="govuk-summary-list__key">${escapeHtml(k)}</dt><dd class="govuk-summary-list__value">${toHtmlValue(v, k)}</dd></div>`
    })
    .join('')
}

const renderValueHtml = (value, key) =>
  '<details class="govuk-details">' +
  '<summary class="govuk-details__summary">' +
  `<span class="govuk-details__summary-text">View ${escapeHtml(key)}</span>` +
  '</summary>' +
  '<div class="govuk-details__text">' +
  `<dl class="govuk-summary-list">${renderDetailsHtml(value)}</dl>` +
  '</div>' +
  '</details>'

const toHtmlValue = (value, key) =>
  typeof value === 'object'
    ? renderValueHtml(value, key)
    : escapeHtml(value)

const toRowValue = (value, key) =>
  typeof value === 'object'
    ? { html: renderValueHtml(value, key) }
    : { text: String(value) }

export const detailsRows = (details) => {
  if (!details || typeof details !== 'object' || Array.isArray(details)) {
    return []
  }
  const rows = []
  for (const [key, value] of Object.entries(details)) {
    if (value === null || value === undefined) {
      continue
    }
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item !== null && item !== undefined) {
          rows.push({ key: { text: key }, value: toRowValue(item, key) })
        }
      }
    } else {
      rows.push({ key: { text: key }, value: toRowValue(value, key) })
    }
  }
  return rows
}
