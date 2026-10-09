import { getState } from '../store.js'
import { addRecord, updateRecord, todayStr, timeStr, num, sortRouteCustomers } from '../utils.js'

export function renderNewEntry() {
  const { routes, settings } = getState()
  const routeNames = routes.length > 0 ? routes.map((r) => r.name) : ['Phase 2']
  const defaultRoute = routeNames.includes('Phase 2') ? 'Phase 2' : routeNames[0]
  const defaultRate = settings.defaultRate || 20

  return `
    <div class="max-w-3xl mx-auto p-4 space-y-4 fade-in">
      <div class="bg-white rounded-2xl shadow-sm p-5">
        <h2 class="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span>📝</span> નવી એન્ટ્રી
        </h2>
        <div class="space-y-4">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">📅 તારીખ</label>
              <input id="neDate" type="date"
                class="w-full px-3 py-2.5 rounded-lg border-2 border-gray-200 focus:border-brand-500 transition-colors text-gray-800 text-sm"
                value="${todayStr()}" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">📍 રૂટ</label>
              <select id="neRoute"
                class="w-full px-3 py-2.5 rounded-lg border-2 border-gray-200 focus:border-brand-500 transition-colors text-gray-800 text-sm">
                ${routeNames.map((r) => `<option value="${r}" ${r === defaultRoute ? 'selected' : ''}>${r}</option>`).join('')}
              </select>
            </div>
          </div>

          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">👤 ગ્રાહક</label>
            <select id="neCustomer"
              class="w-full px-3 py-2.5 rounded-lg border-2 border-gray-200 focus:border-brand-500 transition-colors text-gray-800 text-sm">
              <option value="">-- ગ્રાહક પસંદ કરો --</option>
            </select>
            <div class="grid grid-cols-2 gap-2 mt-2">
              <button id="nePrev" class="w-full px-2 py-2.5 rounded-lg bg-gray-100 text-gray-700 text-sm font-semibold btn-press text-center">⏮️ પાછળનો ગ્રાહક</button>
              <button id="neNext" class="w-full px-2 py-2.5 rounded-lg bg-gray-100 text-gray-700 text-sm font-semibold btn-press text-center">આગળનો ગ્રાહક ⏩</button>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">₹ રેટ</label>
              <input id="neRate" type="number" inputmode="numeric"
                class="w-full px-3 py-2.5 rounded-lg border-2 border-gray-200 focus:border-brand-500 transition-colors text-gray-800 text-sm"
                value="${defaultRate}" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">💰 બાકી હિસાબ</label>
              <div id="neDue" class="w-full px-3 py-2.5 rounded-lg bg-gray-50 border-2 border-gray-200 text-gray-700 text-sm font-semibold flex items-center">
                ₹ 0
              </div>
            </div>
          </div>

          <div class="grid grid-cols-3 gap-3">
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">📦 ભરેલી આપી</label>
              <input id="neFull" type="number" inputmode="numeric" placeholder="0"
                class="w-full px-3 py-2.5 rounded-lg border-2 border-gray-200 focus:border-brand-500 transition-colors text-gray-800 text-sm text-center" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">📦 ખાલી લીધી</label>
              <input id="neEmpty" type="number" inputmode="numeric" placeholder="0"
                class="w-full px-3 py-2.5 rounded-lg border-2 border-gray-200 focus:border-brand-500 transition-colors text-gray-800 text-sm text-center" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">💵 રોકડા મળ્યા</label>
              <input id="nePaid" type="number" inputmode="numeric" placeholder="0"
                class="w-full px-3 py-2.5 rounded-lg border-2 border-gray-200 focus:border-brand-500 transition-colors text-gray-800 text-sm text-center" />
            </div>
          </div>

          <button id="neSave"
            class="w-full py-3.5 rounded-xl bg-gradient-to-r from-brand-500 to-brand-700 text-white font-semibold shadow-lg btn-press hover:shadow-xl transition-all">
            ✅ સેવ એન્ટ્રી
          </button>
          <button id="nePayment"
            class="w-full py-3.5 rounded-xl bg-gradient-to-r from-accent-500 to-accent-600 text-white font-semibold shadow-lg btn-press hover:shadow-xl transition-all">
            💵 માત્ર રોકડા જમા લો
          </button>
        </div>
      </div>
    </div>
  `
}

export function initNewEntry() {
  const routeSelect = document.getElementById('neRoute')
  const customerSelect = document.getElementById('neCustomer')
  const rateInput = document.getElementById('neRate')
  const fullInput = document.getElementById('neFull')
  const emptyInput = document.getElementById('neEmpty')
  const paidInput = document.getElementById('nePaid')
  const dueDisplay = document.getElementById('neDue')
  const saveBtn = document.getElementById('neSave')
  const paymentBtn = document.getElementById('nePayment')
  const prevBtn = document.getElementById('nePrev')
  const nextBtn = document.getElementById('neNext')

  let routeCustomerIds = []

  function updateCustomers() {
    const { customers } = getState()
    const route = routeSelect.value
    const routeCustomers = sortRouteCustomers(customers, route)
    routeCustomerIds = routeCustomers.map((c) => c.id)
    customerSelect.innerHTML =
      '<option value="">-- ગ્રાહક પસંદ કરો --</option>' +
      routeCustomers
        .map((c, i) => `<option value="${c.id}" data-rate="${c.defaultRate || 20}">${i + 1}. ${c.name}</option>`)
        .join('')
  }

  function updateDue() {
    const rate = num(rateInput.value)
    const full = num(fullInput.value)
    const paid = num(paidInput.value)
    const due = full * rate - paid
    dueDisplay.textContent = `₹ ${due}`
    dueDisplay.className = `w-full px-3 py-2.5 rounded-lg border-2 text-sm font-semibold flex items-center ${
      due > 0
        ? 'bg-warning-50 border-warning-300 text-warning-700'
        : 'bg-gray-50 border-gray-200 text-gray-700'
    }`
  }

  function navigateCustomer(dir) {
    if (routeCustomerIds.length === 0) return
    const currentIdx = routeCustomerIds.indexOf(customerSelect.value)
    let nextIdx
    if (currentIdx === -1) {
      nextIdx = dir > 0 ? 0 : routeCustomerIds.length - 1
    } else {
      nextIdx = currentIdx + dir
    }
    if (nextIdx < 0 || nextIdx >= routeCustomerIds.length) return
    customerSelect.value = routeCustomerIds[nextIdx]
    customerSelect.dispatchEvent(new Event('change'))
  }

  routeSelect.addEventListener('change', updateCustomers)
  customerSelect.addEventListener('change', () => {
    const opt = customerSelect.options[customerSelect.selectedIndex]
    const rate = opt?.dataset.rate
    if (rate) rateInput.value = rate
    updateDue()
  })
  ;[rateInput, fullInput, paidInput].forEach((el) => el.addEventListener('input', updateDue))
  prevBtn.addEventListener('click', () => navigateCustomer(-1))
  nextBtn.addEventListener('click', () => navigateCustomer(1))

  saveBtn.addEventListener('click', async () => {
    const { customers } = getState()
    const date = document.getElementById('neDate').value
    const route = routeSelect.value
    const customerId = customerSelect.value
    const customer = customers.find((c) => c.id === customerId)
    if (!customer) {
      alert('ગ્રાહક પસંદ કરો!')
      return
    }
    const rate = num(rateInput.value)
    const full = num(fullInput.value)
    const empty = num(emptyInput.value)
    const paid = num(paidInput.value)
    const due = full * rate - paid

    try {
      saveBtn.disabled = true
      saveBtn.textContent = 'સેવ થઈ રહ્યું છે...'

      await addRecord('deliveries', {
        date,
        time: timeStr(),
        route,
        customerId,
        customerName: customer.name,
        full,
        empty,
        paid,
        due,
        rate,
      })

      const prevBottles = num(customer.pendingBottles)
      const prevDue = num(customer.pendingDue)
      await updateRecord('customers', customerId, {
        pendingBottles: prevBottles + (full - empty),
        pendingDue: prevDue + due,
      })

      fullInput.value = ''
      emptyInput.value = ''
      paidInput.value = ''
      updateDue()

      const currentIdx = routeCustomerIds.indexOf(customerId)
      if (currentIdx !== -1 && currentIdx + 1 < routeCustomerIds.length) {
        customerSelect.value = routeCustomerIds[currentIdx + 1]
        customerSelect.dispatchEvent(new Event('change'))
      }

      saveBtn.disabled = false
      saveBtn.textContent = '✅ સેવ એન્ટ્રી'
      alert('✅ એન્ટ્રી સેવ થઈ!')
    } catch (err) {
      alert('ભૂલ: ' + err.message)
      saveBtn.disabled = false
      saveBtn.textContent = '✅ સેવ એન્ટ્રી'
    }
  })

  updateCustomers()
  updateDue()

  paymentBtn.addEventListener('click', async () => {
    const { customers } = getState()
    const date = document.getElementById('neDate').value
    const route = routeSelect.value
    const customerId = customerSelect.value
    const customer = customers.find((c) => c.id === customerId)
    if (!customer) {
      alert('ગ્રાહક પસંદ કરો!')
      return
    }

    const amountStr = prompt(`💵 ${customer.name} પાસેથી કેટલા રોકડા મળ્યા?`)
    if (!amountStr) return
    const paid = num(amountStr)
    if (paid <= 0) {
      alert('સાચી રકમ દાખલ કરો!')
      return
    }

    try {
      paymentBtn.disabled = true
      paymentBtn.textContent = 'સેવ થઈ રહ્યું છે...'

      await addRecord('deliveries', {
        date,
        time: timeStr(),
        route,
        customerId,
        customerName: customer.name,
        full: 0,
        empty: 0,
        paid,
        due: -paid,
        rate: num(rateInput.value),
        isPayment: true,
      })

      const prevDue = num(customer.pendingDue)
      await updateRecord('customers', customerId, {
        pendingDue: Math.max(0, prevDue - paid),
      })

      const currentIdx = routeCustomerIds.indexOf(customerId)
      if (currentIdx !== -1 && currentIdx + 1 < routeCustomerIds.length) {
        customerSelect.value = routeCustomerIds[currentIdx + 1]
        customerSelect.dispatchEvent(new Event('change'))
      }

      paymentBtn.disabled = false
      paymentBtn.textContent = '💵 માત્ર રોકડા જમા લો'
      alert(`✅ ₹${paid} રોકડા જમા થયા!`)
    } catch (err) {
      alert('ભૂલ: ' + err.message)
      paymentBtn.disabled = false
      paymentBtn.textContent = '💵 માત્ર રોકડા જમા લો'
    }
  })
}
