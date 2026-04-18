function buildRowHtml (index) {
  return `
<div class="condition-row" data-row-index="${index}">
  <div class="condition-row__inputs">
    <div class="condition-row__field-col">
      <div class="govuk-form-group condition-row__field-group">
        <label class="govuk-label" for="conditions-${index}-field">Property</label>
        <select class="govuk-select condition-row__field-select" id="conditions-${index}-field" name="conditions[${index}][field]">
          <option value="">-- select --</option>
          <optgroup label="Event">
            <option value="user">User</option>
            <option value="sessionid">Session ID</option>
            <option value="correlationid">Correlation ID</option>
            <option value="datetime">Date/time</option>
            <option value="environment">Environment</option>
            <option value="version">Version</option>
            <option value="application">Application</option>
            <option value="component">Component</option>
            <option value="ip">IP address</option>
          </optgroup>
          <optgroup label="Audit">
            <option value="audit.status">Audit status</option>
          </optgroup>
          <optgroup label="Entity">
            <option value="audit.entities.entity">Entity type</option>
            <option value="audit.entities.action">Entity action</option>
            <option value="audit.entities.entityid">Entity ID</option>
          </optgroup>
          <optgroup label="Account">
            <option value="audit.accounts.sbi">SBI</option>
            <option value="audit.accounts.frn">FRN</option>
            <option value="audit.accounts.vendor">Vendor</option>
            <option value="audit.accounts.trader">Trader</option>
            <option value="audit.accounts.organisationId">Organisation ID</option>
            <option value="audit.accounts.crn">CRN</option>
            <option value="audit.accounts.personId">Person ID</option>
          </optgroup>
        </select>
      </div>
      <div class="govuk-form-group condition-row__custom-group app-hidden">
        <label class="govuk-label" for="conditions-${index}-customField">Custom details property</label>
        <input class="govuk-input condition-row__custom-input" id="conditions-${index}-customField" name="conditions[${index}][customField]" type="text">
      </div>
    </div>
    <div class="condition-row__operator-col">
      <div class="govuk-form-group">
        <label class="govuk-label" for="conditions-${index}-operator">Condition</label>
        <select class="govuk-select" id="conditions-${index}-operator" name="conditions[${index}][operator]">
          <option value="eq" selected>Equal to</option>
          <option value="ne">Not equal to</option>
          <option value="lt">Less than</option>
          <option value="gt">Greater than</option>
          <option value="contains">Contains</option>
          <option value="notContains">Does not contain</option>
        </select>
      </div>
    </div>
    <div class="condition-row__value-col">
      <div class="govuk-form-group">
        <label class="govuk-label" for="conditions-${index}-value">Value</label>
        <input class="govuk-input" id="conditions-${index}-value" name="conditions[${index}][value]" type="text">
      </div>
    </div>
    <div class="condition-row__actions-col">
      <a href="#" class="govuk-link govuk-body-s condition-row__delete">Delete row</a>
    </div>
  </div>
  <div class="condition-row__toggles">
    <a href="#" class="govuk-link govuk-body-s condition-row__use-custom">Use custom property</a>
    <a href="#" class="govuk-link govuk-body-s condition-row__use-standard app-hidden">Use standard property</a>
  </div>
</div>`
}

function reindexRows (container) {
  const rows = container.querySelectorAll('.condition-row')
  rows.forEach((row, index) => {
    row.dataset.rowIndex = String(index)
    row.querySelectorAll('[id]').forEach((el) => {
      el.id = el.id.replace(/conditions-\d+-/, `conditions-${index}-`)
    })
    row.querySelectorAll('[name]').forEach((el) => {
      el.name = el.name.replace(/conditions\[\d+\]/, `conditions[${index}]`)
    })
    row.querySelectorAll('label[for]').forEach((el) => {
      el.htmlFor = el.htmlFor.replace(/conditions-\d+-/, `conditions-${index}-`)
    })
  })
}

function updateDeleteVisibility (container) {
  const rows = container.querySelectorAll('.condition-row')
  rows.forEach((row) => {
    const deleteLink = row.querySelector('.condition-row__delete')
    if (deleteLink) {
      deleteLink.classList.toggle('app-hidden', rows.length <= 1)
    }
  })
}

function toggleCustom (row) {
  const fieldGroup = row.querySelector('.condition-row__field-group')
  const customGroup = row.querySelector('.condition-row__custom-group')
  const useCustomLink = row.querySelector('.condition-row__use-custom')
  const useStandardLink = row.querySelector('.condition-row__use-standard')
  if (fieldGroup) {
    fieldGroup.classList.add('app-hidden')
  }
  if (customGroup) {
    customGroup.classList.remove('app-hidden')
  }
  if (useCustomLink) {
    useCustomLink.classList.add('app-hidden')
  }
  if (useStandardLink) {
    useStandardLink.classList.remove('app-hidden')
  }
  const select = row.querySelector('.condition-row__field-select')
  if (select) {
    select.name = ''
  }
}

function toggleStandard (row) {
  const fieldGroup = row.querySelector('.condition-row__field-group')
  const customGroup = row.querySelector('.condition-row__custom-group')
  const useCustomLink = row.querySelector('.condition-row__use-custom')
  const useStandardLink = row.querySelector('.condition-row__use-standard')
  const index = row.dataset.rowIndex
  if (fieldGroup) {
    fieldGroup.classList.remove('app-hidden')
  }
  if (customGroup) {
    customGroup.classList.add('app-hidden')
  }
  if (useCustomLink) {
    useCustomLink.classList.remove('app-hidden')
  }
  if (useStandardLink) {
    useStandardLink.classList.add('app-hidden')
  }
  const select = row.querySelector('.condition-row__field-select')
  if (select) {
    select.name = `conditions[${index}][field]`
  }
  const customInput = row.querySelector('.condition-row__custom-input')
  if (customInput) {
    customInput.value = ''
  }
}

export function initQueryBuilder () {
  if (typeof document === 'undefined') {
    return
  }
  const container = document.getElementById('condition-rows')
  const addLink = document.getElementById('add-condition')

  if (!container || !addLink) {
    return
  }

  updateDeleteVisibility(container)

  addLink.addEventListener('click', (e) => {
    e.preventDefault()
    const nextIndex = container.querySelectorAll('.condition-row').length
    const div = document.createElement('div')
    div.innerHTML = buildRowHtml(nextIndex).trim()
    container.appendChild(div.firstChild)
    updateDeleteVisibility(container)
  })

  container.addEventListener('click', (e) => {
    const row = e.target.closest('.condition-row')
    if (!row) {
      return
    }

    if (e.target.closest('.condition-row__delete')) {
      e.preventDefault()
      row.remove()
      reindexRows(container)
      updateDeleteVisibility(container)
      return
    }

    if (e.target.closest('.condition-row__use-custom')) {
      e.preventDefault()
      toggleCustom(row)
      return
    }

    if (e.target.closest('.condition-row__use-standard')) {
      e.preventDefault()
      toggleStandard(row)
    }
  })
}
