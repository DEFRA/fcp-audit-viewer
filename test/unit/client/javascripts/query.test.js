// @vitest-environment jsdom
import { describe, beforeEach, test, expect } from 'vitest'
import { initQueryBuilder } from '../../../../src/client/javascripts/query.js'

function buildSingleRowHtml (index) {
  return `
<div class="condition-row" data-row-index="${index}">
  <div class="condition-row__inputs">
    <div class="condition-row__field-col">
      <div class="govuk-form-group condition-row__field-group">
        <label class="govuk-label" for="conditions-${index}-field">Property</label>
        <select class="govuk-select condition-row__field-select" id="conditions-${index}-field" name="conditions[${index}][field]">
          <option value="">-- select --</option>
          <option value="application">Application</option>
        </select>
      </div>
      <div class="govuk-form-group condition-row__custom-group app-hidden">
        <label class="govuk-label" for="conditions-${index}-customField">Custom property</label>
        <input class="govuk-input condition-row__custom-input" id="conditions-${index}-customField" name="conditions[${index}][customField]" type="text">
      </div>
    </div>
    <div class="condition-row__operator-col">
      <div class="govuk-form-group">
        <select class="govuk-select" id="conditions-${index}-operator" name="conditions[${index}][operator]">
          <option value="eq" selected>Equal to</option>
        </select>
      </div>
    </div>
    <div class="condition-row__value-col">
      <div class="govuk-form-group">
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

function setupDom (rowCount = 1) {
  document.body.innerHTML = `
    <div id="condition-rows">
      ${Array.from({ length: rowCount }, (_, i) => buildSingleRowHtml(i)).join('\n')}
    </div>
    <a href="#" id="add-condition">Add condition</a>
  `
}

describe('initQueryBuilder', () => {
  describe('when required DOM elements are absent', () => {
    test('returns without error when #condition-rows is missing', () => {
      document.body.innerHTML = '<a href="#" id="add-condition">Add condition</a>'
      expect(() => initQueryBuilder()).not.toThrow()
    })

    test('returns without error when #add-condition is missing', () => {
      document.body.innerHTML = '<div id="condition-rows"></div>'
      expect(() => initQueryBuilder()).not.toThrow()
    })

    test('returns without error when both elements are missing', () => {
      document.body.innerHTML = ''
      expect(() => initQueryBuilder()).not.toThrow()
    })
  })

  describe('delete link visibility', () => {
    test('hides delete link when there is only one row', () => {
      setupDom(1)
      initQueryBuilder()

      const deleteLink = document.querySelector('.condition-row__delete')
      expect(deleteLink.classList.contains('app-hidden')).toBe(true)
    })

    test('shows delete link when there are multiple rows', () => {
      setupDom(2)
      initQueryBuilder()

      const deleteLinks = document.querySelectorAll('.condition-row__delete')
      deleteLinks.forEach((link) => {
        expect(link.classList.contains('app-hidden')).toBe(false)
      })
    })
  })

  describe('add condition', () => {
    beforeEach(() => {
      setupDom(1)
      initQueryBuilder()
    })

    test('clicking add-condition appends a new row', () => {
      const addLink = document.getElementById('add-condition')
      addLink.click()

      const rows = document.querySelectorAll('.condition-row')
      expect(rows.length).toBe(2)
    })

    test('new row has correct data-row-index', () => {
      const addLink = document.getElementById('add-condition')
      addLink.click()

      const rows = document.querySelectorAll('.condition-row')
      expect(rows[1].dataset.rowIndex).toBe('1')
    })

    test('new row inputs have correctly indexed ids and names', () => {
      const addLink = document.getElementById('add-condition')
      addLink.click()

      const fieldSelect = document.querySelector('[id="conditions-1-field"]')
      expect(fieldSelect).not.toBeNull()
      expect(fieldSelect.name).toBe('conditions[1][field]')
    })

    test('delete link becomes visible after adding a second row', () => {
      const addLink = document.getElementById('add-condition')
      addLink.click()

      const deleteLinks = document.querySelectorAll('.condition-row__delete')
      deleteLinks.forEach((link) => {
        expect(link.classList.contains('app-hidden')).toBe(false)
      })
    })
  })

  describe('delete condition', () => {
    test('clicking delete removes the row', () => {
      setupDom(2)
      initQueryBuilder()

      const deleteLink = document.querySelector('.condition-row__delete')
      deleteLink.click()

      const rows = document.querySelectorAll('.condition-row')
      expect(rows.length).toBe(1)
    })

    test('remaining row is reindexed to 0 after deletion', () => {
      setupDom(2)
      initQueryBuilder()

      const deleteLinks = document.querySelectorAll('.condition-row__delete')
      deleteLinks[0].click()

      const rows = document.querySelectorAll('.condition-row')
      expect(rows[0].dataset.rowIndex).toBe('0')
    })

    test('delete link is hidden when only one row remains', () => {
      setupDom(2)
      initQueryBuilder()

      const deleteLink = document.querySelector('.condition-row__delete')
      deleteLink.click()

      const remainingDelete = document.querySelector('.condition-row__delete')
      expect(remainingDelete.classList.contains('app-hidden')).toBe(true)
    })
  })

  describe('toggle custom property', () => {
    beforeEach(() => {
      setupDom(1)
      initQueryBuilder()
    })

    test('clicking use-custom hides the standard field group', () => {
      const useCustom = document.querySelector('.condition-row__use-custom')
      useCustom.click()

      const fieldGroup = document.querySelector('.condition-row__field-group')
      expect(fieldGroup.classList.contains('app-hidden')).toBe(true)
    })

    test('clicking use-custom shows the custom group', () => {
      const useCustom = document.querySelector('.condition-row__use-custom')
      useCustom.click()

      const customGroup = document.querySelector('.condition-row__custom-group')
      expect(customGroup.classList.contains('app-hidden')).toBe(false)
    })

    test('clicking use-custom hides use-custom link', () => {
      const useCustom = document.querySelector('.condition-row__use-custom')
      useCustom.click()

      expect(useCustom.classList.contains('app-hidden')).toBe(true)
    })

    test('clicking use-custom shows use-standard link', () => {
      const useCustom = document.querySelector('.condition-row__use-custom')
      useCustom.click()

      const useStandard = document.querySelector('.condition-row__use-standard')
      expect(useStandard.classList.contains('app-hidden')).toBe(false)
    })

    test('clicking use-custom clears the field select name attribute', () => {
      const useCustom = document.querySelector('.condition-row__use-custom')
      useCustom.click()

      const select = document.querySelector('.condition-row__field-select')
      expect(select.name).toBe('')
    })
  })

  describe('click event not on a condition row', () => {
    test('clicking on the container outside any row does nothing', () => {
      setupDom(1)
      initQueryBuilder()

      const container = document.getElementById('condition-rows')
      container.click()

      const rows = document.querySelectorAll('.condition-row')
      expect(rows.length).toBe(1)
    })
  })

  describe('toggle standard property', () => {
    beforeEach(() => {
      setupDom(1)
      initQueryBuilder()

      // first switch to custom mode so standard mode has something to toggle back
      const useCustom = document.querySelector('.condition-row__use-custom')
      useCustom.click()

      const useStandard = document.querySelector('.condition-row__use-standard')
      useStandard.click()
    })

    test('clicking use-standard shows the field group', () => {
      const fieldGroup = document.querySelector('.condition-row__field-group')
      expect(fieldGroup.classList.contains('app-hidden')).toBe(false)
    })

    test('clicking use-standard hides the custom group', () => {
      const customGroup = document.querySelector('.condition-row__custom-group')
      expect(customGroup.classList.contains('app-hidden')).toBe(true)
    })

    test('clicking use-standard shows use-custom link', () => {
      const useCustom = document.querySelector('.condition-row__use-custom')
      expect(useCustom.classList.contains('app-hidden')).toBe(false)
    })

    test('clicking use-standard hides use-standard link', () => {
      const useStandard = document.querySelector('.condition-row__use-standard')
      expect(useStandard.classList.contains('app-hidden')).toBe(true)
    })

    test('clicking use-standard restores field select name', () => {
      const select = document.querySelector('.condition-row__field-select')
      expect(select.name).toBe('conditions[0][field]')
    })

    test('clicking use-standard clears the custom input value', () => {
      const customInput = document.querySelector('.condition-row__custom-input')
      expect(customInput.value).toBe('')
    })
  })
})
