import { getState, setState } from '../store.js'
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

          <div id="neDuplicateWarning" class="hidden rounded-xl p-3 bg-warning-50 border border-warning-300">
            <div class="flex items-center gap-2">
              <span class="text-lg">⚠️</span>
              <div>
                <div class="text-sm font-bold text-warning-800">આજના તારીખે આ ગ્રાહકની એન્ટ્રી પહેલેથી છે!</div>
                <div class="text-xs text-warning-700">ફરી સેવ કરવાથી નવી એન્ટ્રી ઉમેરાશે.</div>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">📦 ભરેલી આપી</label>
              <input id="neFull" type="number" inputmode="numeric" placeholder="0"
                class="w-full px-3 py-2.5 rounded-lg border-2 border-gray-200 focus:border-brand-500 transition-colors text-gray-800 text-lg text-center" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">📦 ખાલી લીધી</label>
              <input id="neEmpty" type="number" inputmode="numeric" placeholder="0"
                class="w-full px-3 py-2.5 rounded-lg border-2 border-gray-200 focus:border-brand-500 transition-colors text-gray-800 text-lg text-center" />
            </div>
          </div>

          <button id="neSave"
            class="w-full py-3.5 rounded-xl bg-gradient-to-r from-brand-500 to-brand-700 text-white font-semibold shadow-lg btn-press hover:shadow-xl transition-all">
            ✅ સેવ એન્ટ્રી
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
  const dueDisplay = document.getElementById('neDue')
  const saveBtn = document.getElementById('neSave')
  const dupWarning = document.getElementById('neDuplicateWarning')
  const dateInput = document.getElementById('neDate')

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
    const due = full * rate
    dueDisplay.textContent = `₹ ${due}`
    dueDisplay.className = `w-full px-3 py-2.5 rounded-lg border-2 text-sm font-semibold flex items-center ${
      due > 0
        ? 'bg-warning-50 border-warning-300 text-warning-700'
        : 'bg-gray-50 border-gray-200 text-gray-700'
    }`
  }

  function checkDuplicate() {
    const { deliveries } = getState()
    const customerId = customerSelect.value
    const date = dateInput.value
    if (!customerId || !date) {
      dupWarning.classList.add('hidden')
      return
    }
    const existing = deliveries.find(
      (d) => d.customerId === customerId && d.date === date && !d.isPayment && num(d.full) > 0
    )
    if (existing) {
      dupWarning.classList.remove('hidden')
    } else {
      dupWarning.classList.add('hidden')
    }
  }

  function advanceToNextCustomer() {
    const currentIdx = routeCustomerIds.indexOf(customerSelect.value)
    if (currentIdx !== -1 && currentIdx + 1 < routeCustomerIds.length) {
      customerSelect.value = routeCustomerIds[currentIdx + 1]
      customerSelect.dispatchEvent(new Event('change'))
    } else if (currentIdx !== -1 && currentIdx + 1 >= routeCustomerIds.length) {
      const toast = document.createElement('div')
      toast.className = 'fixed bottom-20 left-1/2 -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded-xl shadow-lg z-50 text-sm font-semibold fade-in'
      toast.textContent = '✅ રૂટ પૂર્ણ થયો!'
      document.body.appendChild(toast)
      setTimeout(() => toast.remove(), 2000)
    }
  }

  fullInput.addEventListener('focus', () => fullInput.select())
  emptyInput.addEventListener('focus', () => emptyInput.select())

  routeSelect.addEventListener('change', () => { updateCustomers(); checkDuplicate() })
  customerSelect.addEventListener('change', () => {
    const opt = customerSelect.options[customerSelect.selectedIndex]
    const rate = opt?.dataset.rate
    if (rate) rateInput.value = rate
    updateDue()
    checkDuplicate()
  })
  dateInput.addEventListener('change', checkDuplicate)
  fullInput.addEventListener('input', updateDue)

  saveBtn.addEventListener('click', async () => {
    const { customers, settings } = getState()
    const date = dateInput.value
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
    const due = full * rate

    if (full === 0 && empty === 0) {
      alert('ભરેલી અથવા ખાલી બોટલ દાખલ કરો!')
      return
    }

    const isDuplicate = !dupWarning.classList.contains('hidden')
    if (isDuplicate) {
      if (!confirm(`⚠️ આજે ${customer.name} ની એન્ટ્રી પહેલેથી છે. શું ફરી સેવ કરવી છે?`)) return
    }

    const deliveryData = {
      date,
      time: timeStr(),
      route,
      customerId,
      customerName: customer.name,
      full,
      empty,
      paid: 0,
      due,
      rate,
    }

    const optimisticDelivery = {
      id: 'temp-' + Date.now(),
      ...deliveryData,
      createdAt: { toMillis: () => Date.now() },
    }

    const { deliveries: currentDeliveries, customers: currentCustomers } = getState()
    const optimisticCustomers = currentCustomers.map((c) =>
      c.id === customerId
        ? { ...c, pendingBottles: num(c.pendingBottles) + (full - empty), pendingDue: num(c.pendingDue) + due }
        : c
    )

    setState({
      deliveries: [...currentDeliveries, optimisticDelivery],
      customers: optimisticCustomers,
    })

    fullInput.value = ''
    emptyInput.value = ''
    updateDue()

    if (settings?.autoAdvance !== false) {
      setTimeout(() => advanceToNextCustomer(), 100)
    } else {
      customerSelect.value = ''
      customerSelect.dispatchEvent(new Event('change'))
    }

    try {
      await addRecord('deliveries', deliveryData)
      await updateRecord('customers', customerId, {
        pendingBottles: num(customer.pendingBottles) + (full - empty),
        pendingDue: num(customer.pendingDue) + due,
      })
    } catch (err) {
      console.error('Save failed (will retry):', err)
    }
  })

  updateCustomers()
  updateDue()
  checkDuplicate()
}
