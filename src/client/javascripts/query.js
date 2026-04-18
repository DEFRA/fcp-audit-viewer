function cloneBlankRow (container, index) {
  // Clone the first server-rendered row as the template so the field list
  // is defined in a single place (query.njk) and not duplicated here.
  const template = container.querySelector('.condition-row')
  const clone = template.cloneNode(true)

  // Reset all input values and select selections
  clone.querySelectorAll('input').forEach((el) => { el.value = '' })
  clone.querySelectorAll('select').forEach((el) => { el.selectedIndex = 0 })

  // Restore to standard-field state (hide custom group, show field group)
  const fieldGroup = clone.querySelector('.condition-row__field-group')
  const customGroup = clone.querySelector('.condition-row__custom-group')
  const useCustomLink = clone.querySelector('.condition-row__use-custom')
  const useStandardLink = clone.querySelector('.condition-row__use-standard')
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

  const select = clone.querySelector('.condition-row__field-select')
  if (select) {
    select.name = `conditions[${index}][field]`
  }

  clone.dataset.rowIndex = String(index)
  clone.querySelectorAll('[id]').forEach((el) => {
    el.id = el.id.replace(/conditions-\d+-/, `conditions-${index}-`)
  })
  clone.querySelectorAll('[name]').forEach((el) => {
    el.name = el.name.replace(/conditions\[\d+\]/, `conditions[${index}]`)
  })
  clone.querySelectorAll('label[for]').forEach((el) => {
    el.htmlFor = el.htmlFor.replace(/conditions-\d+-/, `conditions-${index}-`)
  })

  return clone
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
    container.appendChild(cloneBlankRow(container, nextIndex))
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
