const escapeHtml = (str) =>
  String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')

const renderRow = (key, value) =>
  `<div class="govuk-summary-list__row"><dt class="govuk-summary-list__key">${escapeHtml(key)}</dt><dd class="govuk-summary-list__value">${toHtmlValue(value, key)}</dd></div>`

const isPresent = (v) => v !== null && v !== undefined

const renderDetailsHtml = (obj) => {
  if (Array.isArray(obj)) {
    return obj.filter(isPresent).map((item) => renderRow('', item)).join('')
  }

  return Object.entries(obj)
    .filter(([, v]) => isPresent(v))
    .flatMap(([k, v]) =>
      Array.isArray(v)
        ? v.filter(isPresent).map((item) => renderRow(k, item))
        : [renderRow(k, v)]
    )
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

  return Object.entries(details)
    .filter(([, value]) => isPresent(value))
    .flatMap(([key, value]) =>
      Array.isArray(value)
        ? value.filter(isPresent).map((item) => ({ key: { text: key }, value: toRowValue(item, key) }))
        : [{ key: { text: key }, value: toRowValue(value, key) }]
    )
}
