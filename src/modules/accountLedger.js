import { getState } from '../store.js'
import {
  num, formatDate, sortRouteCustomers, addRecord, updateRecord, deleteRecord,
  todayStr, timeStr, sortByOrder,
} from '../utils.js'

const MONTHS = ['જાન્યુઆરી', 'ફેબ્રુઆરી', 'માર્ચ', 'એપ્રિલ', 'મે', 'જૂન', 'જુલાઈ', 'ઓગસ્ટ', 'સપ્ટેમ્બર', 'ઓક્ટોબર', 'નવેમ્બર', 'ડિસેમ્બર']
const DELETE_PIN = '9916'

function lastDayOfMonth(year, month) {
  return new Date(parseInt(year), parseInt(month), 0).getDate()
}

function defaultPaymentDate(year, month) {
  const now = new Date()
  const curY = now.getFullYear()
  const curM = String(now.getMonth() + 1).padStart(2, '0')
  if (parseInt(year) === curY && month === curM) return todayStr()
  const ld = lastDayOfMonth(year, month)
  return `${year}-${month}-${String(ld).padStart(2, '0')}`
}

export function renderAccountLedger() {
  const { routes } = getState()
  const routeNames = routes.length > 0 ? routes.map((r) => r.name) : ['Phase 2']
  const defaultRoute = routeNames.includes('Phase 2') ? 'Phase 2' : routeNames[0]
  const now = new Date()
  const currentMonth = String(now.getMonth() + 1).padStart(2, '0')
  const currentYear = now.getFullYear()

  return `
    <div class="max-w-3xl mx-auto p-4 space-y-4 fade-in">
      <div class="bg-white rounded-2xl shadow-sm p-5">
        <h2 class="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span>💳</span> જમા-ખાતાવહી
        </h2>
        <div class="space-y-3">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">📍 રૂટ</label>
              <select id="alRoute"
                class="w-full px-3 py-2.5 rounded-lg border-2 border-gray-200 focus:border-brand-500 transition-colors text-gray-800 text-sm">
                ${routeNames.map((r) => `<option value="${r}" ${r === defaultRoute ? 'selected' : ''}>${r}</option>`).join('')}
              </select>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">👤 ગ્રાહક</label>
              <select id="alCustomer"
                class="w-full px-3 py-2.5 rounded-lg border-2 border-gray-200 focus:border-brand-500 transition-colors text-gray-800 text-sm">
                <option value="">-- ગ્રાહક પસંદ કરો --</option>
              </select>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">📅 મહિનો</label>
              <select id="alMonth"
                class="w-full px-3 py-2.5 rounded-lg border-2 border-gray-200 focus:border-brand-500 transition-colors text-gray-800 text-sm">
                ${MONTHS.map((m, i) => `<option value="${String(i + 1).padStart(2, '0')}" ${String(i + 1).padStart(2, '0') === currentMonth ? 'selected' : ''}>${m}</option>`).join('')}
              </select>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">📅 વર્ષ</label>
              <input id="alYear" type="number" value="${currentYear}"
                class="w-full px-3 py-2.5 rounded-lg border-2 border-gray-200 focus:border-brand-500 transition-colors text-gray-800 text-sm" />
            </div>
          </div>
        </div>
        <div id="alSummary"></div>
      </div>

      <div id="alPaymentSection"></div>
      <div id="alHistorySection"></div>
      <div id="alHistoricalSection"></div>
    </div>
  `
}

export function initAccountLedger() {
  const routeSelect = document.getElementById('alRoute')
  const customerSelect = document.getElementById('alCustomer')
  const monthSelect = document.getElementById('alMonth')
  const yearInput = document.getElementById('alYear')
  const summaryEl = document.getElementById('alSummary')
  const paymentEl = document.getElementById('alPaymentSection')
  const historyEl = document.getElementById('alHistorySection')
  const historicalEl = document.getElementById('alHistoricalSection')

  let currentFilter = 'all'
  let historicalExpanded = false

  function updateCustomers() {
    const { customers } = getState()
    const route = routeSelect.value
    const routeCustomers = sortRouteCustomers(customers, route)
    customerSelect.innerHTML =
      '<option value="">-- ગ્રાહક પસંદ કરો --</option>' +
      routeCustomers.map((c, i) => `<option value="${c.id}">${i + 1}. ${c.name}</option>`).join('')
    renderAll()
  }

  function getMonthDeliveries(month, year) {
    const { deliveries } = getState()
    const customerId = customerSelect.value
    const m = month || monthSelect.value
    const y = year || yearInput.value.trim()
    const prefix = `${y}-${m}`
    return deliveries
      .filter((d) => d.customerId === customerId && (d.date || '').startsWith(prefix))
      .sort((a, b) => {
        const dc = (a.date || '').localeCompare(b.date || '')
        if (dc !== 0) return dc
        return (a.time || '').localeCompare(b.time || '')
      })
  }

  function getAllCustomerDeliveries() {
    const { deliveries } = getState()
    const customerId = customerSelect.value
    return deliveries
      .filter((d) => d.customerId === customerId)
      .sort((a, b) => (a.date || '').localeCompare(b.date || ''))
  }

  function isPaymentEntry(d) {
    return d.isPayment || (num(d.full) === 0 && num(d.empty) === 0 && num(d.paid) > 0)
  }

  function getEntryPaid(d) {
    return num(d.paid)
  }

  function getEntryGpay(d) {
    if (num(d.gpay) > 0) return num(d.gpay)
    if (isPaymentEntry(d) && num(d.cash) === 0 && num(d.gpay) === 0) return num(d.paid)
    return num(d.gpay)
  }

  function getEntryCash(d) {
    if (num(d.cash) > 0) return num(d.cash)
    if (isPaymentEntry(d) && num(d.gpay) === 0 && num(d.cash) === 0) return 0
    return num(d.cash)
  }

  function renderAll() {
    renderSummary()
    renderPayment()
    renderHistory()
    renderHistorical()
  }

  function renderSummary() {
    const customerId = customerSelect.value
    if (!customerId) {
      summaryEl.innerHTML = ''
      return
    }

    const { customers, settings } = getState()
    const customer = customers.find((c) => c.id === customerId)
    if (!customer) { summaryEl.innerHTML = ''; return }

    const month = monthSelect.value
    const year = yearInput.value.trim()
    const monthName = MONTHS[parseInt(month, 10) - 1] || ''
    const monthDeliveries = getMonthDeliveries(month, year)
    const customerRate = customer.defaultRate || settings?.defaultRate || 20

    const totalBill = monthDeliveries
      .filter((d) => !isPaymentEntry(d))
      .reduce((s, d) => s + num(d.full) * num(d.rate || customerRate), 0)

    const totalGpay = monthDeliveries
      .filter((d) => isPaymentEntry(d))
      .reduce((s, d) => s + getEntryGpay(d), 0)

    const totalCash = monthDeliveries
      .filter((d) => isPaymentEntry(d))
      .reduce((s, d) => s + getEntryCash(d), 0)

    const totalPaid = monthDeliveries
      .filter((d) => isPaymentEntry(d))
      .reduce((s, d) => s + getEntryPaid(d), 0)

    const allDeliveries = getAllCustomerDeliveries()
    const prefix = `${year}-${month}`
    const beforeDeliveries = allDeliveries.filter((d) => (d.date || '') < prefix)

    const pastDeliveries = beforeDeliveries.filter((d) => !isPaymentEntry(d))
    const pastPayments = beforeDeliveries.filter((d) => isPaymentEntry(d))

    const pastBill = pastDeliveries.reduce((s, d) => s + num(d.full) * num(d.rate || customerRate), 0)
    const pastInlinePaid = pastDeliveries.reduce((s, d) => s + num(d.paid), 0)
    const pastStandalonePaid = pastPayments.reduce((s, d) => s + getEntryPaid(d), 0)
    const openingBalance = num(customer.openingBalance) || 0

    const previousBalance = openingBalance + pastBill - pastInlinePaid - pastStandalonePaid

    const netDue = previousBalance + totalBill - totalPaid
    const isClear = netDue <= 0
    const isAdvance = netDue < 0

    const totalFullBottles = monthDeliveries.filter((d) => !isPaymentEntry(d)).reduce((s, d) => s + num(d.full), 0)
    const totalEmptyBottles = monthDeliveries.filter((d) => !isPaymentEntry(d)).reduce((s, d) => s + num(d.empty), 0)
    const monthNetBottles = totalFullBottles - totalEmptyBottles
    const prevPendingBottles = num(customer.pendingBottles) - monthNetBottles

    const colorClasses = {
      brand: 'bg-brand-50 border-brand-200 text-brand-700',
      blue: 'bg-blue-50 border-blue-200 text-blue-700',
      green: 'bg-green-50 border-green-200 text-green-700',
      warning: 'bg-warning-50 border-warning-200 text-warning-700',
      gray: 'bg-gray-50 border-gray-200 text-gray-700',
    }

    const prevLabel = previousBalance > 0
      ? '🔴 પાછલી બાકી'
      : previousBalance < 0
        ? '🟢 પાછલી એડવાન્સ જમા'
        : '📜 પાછલી બાકી'
    const prevDisplay = previousBalance > 0 ? `+₹${previousBalance}` : previousBalance < 0 ? `-₹${Math.abs(previousBalance)}` : `₹0`
    const prevColor = previousBalance > 0 ? 'warning' : previousBalance < 0 ? 'green' : 'gray'

    const cards = [
      { label: 'આ મહિનાનું બિલ', value: `₹${totalBill}`, icon: '💰', color: 'brand' },
      { label: prevLabel, value: prevDisplay, icon: '📜', color: prevColor },
      { label: 'જમા લીધેલ રકમ', value: `₹${totalPaid}`, icon: '💵', color: 'green' },
      { label: isAdvance ? '🟢 એડવાન્સ જમા' : '⚠️ ચોખ્ખી બાકી રકમ', value: isAdvance ? `-₹${Math.abs(netDue)}` : `₹${netDue}`, icon: isAdvance ? '🟢' : '⚠️', color: isClear ? 'green' : 'warning' },
    ]

    const clearBadge = isClear
      ? `<div class="mt-3 rounded-xl p-3 bg-green-100 border border-green-300 text-center"><span class="text-green-700 font-bold text-sm">✅ આ મહિનાનો હિસાબ પૂર્ણ (₹${Math.abs(netDue)} ${isAdvance ? 'એડવાન્સ' : 'ક્લિયર'})</span></div>`
      : ''

    const breakdownHtml = `
      <div class="mt-3 rounded-xl p-3 bg-gray-50 border border-gray-200">
        <div class="text-xs font-bold text-gray-700 mb-2">🧮 હિસાબ બરાબર:</div>
        <div class="text-xs text-gray-600 flex flex-wrap items-center gap-1">
          <span class="${previousBalance > 0 ? 'text-warning-700 font-semibold' : previousBalance < 0 ? 'text-green-700 font-semibold' : ''}">[${prevLabel}: ${prevDisplay}]</span>
          <span>+</span>
          <span class="text-brand-700 font-semibold">[આ મહિનાનું બિલ: ₹${totalBill}]</span>
          <span>-</span>
          <span class="text-green-700 font-semibold">[કુલ જમા રકમ: ₹${totalPaid}]</span>
          <span>=</span>
          <span class="${isClear ? 'text-green-700 font-bold' : 'text-warning-700 font-bold'}">[ચોખ્ખી રકમ: ${isAdvance ? '-' : ''}₹${Math.abs(netDue)}]</span>
        </div>
      </div>
    `

    const bottleHtml = `
      <div class="mt-2 rounded-xl p-3 bg-brand-50 border border-brand-200">
        <div class="text-xs font-bold text-brand-800 mb-2">📦 બોટલ હિસાબ:</div>
        <div class="grid grid-cols-3 gap-2 text-xs">
          <div class="text-center">
            <div class="text-gray-600">પાછલી બાકી બોટલ</div>
            <div class="font-bold ${prevPendingBottles > 0 ? 'text-warning-700' : 'text-gray-700'}">${prevPendingBottles}</div>
          </div>
          <div class="text-center">
            <div class="text-gray-600">ચાલુ મહિને આપેલ/લીધેલ</div>
            <div class="font-bold text-brand-700">${totalFullBottles}/${totalEmptyBottles}</div>
          </div>
          <div class="text-center">
            <div class="text-gray-600">કુલ ગ્રાહક પાસે ${num(customer.pendingBottles) >= 0 ? 'બાકી' : 'જમા'}</div>
            <div class="font-bold ${num(customer.pendingBottles) > 0 ? 'text-warning-700' : 'text-green-700'}">${Math.abs(num(customer.pendingBottles))}</div>
          </div>
        </div>
      </div>
    `

    summaryEl.innerHTML = `
      <div class="mt-4">
        <h3 class="text-sm font-bold text-gray-800 mb-1 flex items-center gap-2">
          <span>📊</span> ${customer.name} - ${monthName} ${year}
        </h3>
        <div class="grid grid-cols-2 gap-3 mt-2">
          ${cards.map((c) => `
            <div class="rounded-xl p-3 border ${colorClasses[c.color]}">
              <div class="text-xs text-gray-600">${c.icon} ${c.label}</div>
              <div class="text-lg font-bold">${c.value}</div>
            </div>
          `).join('')}
        </div>
        ${breakdownHtml}
        ${bottleHtml}
        ${clearBadge}
      </div>
    `
  }

  function renderPayment() {
    const customerId = customerSelect.value
    if (!customerId) {
      paymentEl.innerHTML = ''
      return
    }

    const month = monthSelect.value
    const year = yearInput.value.trim()
    const defaultDate = defaultPaymentDate(year, month)
    const monthName = MONTHS[parseInt(month, 10) - 1] || ''

    paymentEl.innerHTML = `
      <div class="bg-white rounded-2xl shadow-sm p-5">
        <h3 class="text-sm font-bold text-gray-800 mb-1 flex items-center gap-2">
          <span>💳</span> રકમ જમા કરો (GPay + રોકડ)
        </h3>
        <p class="text-xs text-gray-500 mb-3">📅 આ પેમેન્ટ ${monthName} ${year} ના હિસાબમાં જમા થશે</p>
        <div class="space-y-3">
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">📅 તારીખ</label>
            <input id="alPayDate" type="date" value="${defaultDate}"
              class="w-full px-3 py-2.5 rounded-lg border-2 border-gray-200 focus:border-brand-500 text-gray-800 text-sm" />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">📱 GPay રકમ (₹)</label>
              <input id="alGpay" type="number" inputmode="numeric" placeholder="0"
                class="w-full px-3 py-2.5 rounded-lg border-2 border-gray-200 focus:border-brand-500 text-gray-800 text-sm text-center" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">💵 રોકડ રકમ (₹)</label>
              <input id="alCash" type="number" inputmode="numeric" placeholder="0"
                class="w-full px-3 py-2.5 rounded-lg border-2 border-gray-200 focus:border-brand-500 text-gray-800 text-sm text-center" />
            </div>
          </div>
          <div id="alPayTotal" class="rounded-lg p-3 bg-brand-50 border border-brand-200 text-center">
            <span class="text-sm text-gray-600">કુલ જમા: </span>
            <span class="text-lg font-bold text-brand-700">₹ 0</span>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">📝 નોંધ (વૈકલ્પિક)</label>
            <input id="alPayNote" type="text" placeholder="નોંધ..."
              class="w-full px-3 py-2.5 rounded-lg border-2 border-gray-200 focus:border-brand-500 text-gray-800 text-sm" />
          </div>
          <button id="alPaySave"
            class="w-full py-3 rounded-xl bg-gradient-to-r from-accent-500 to-accent-600 text-white font-semibold shadow-lg btn-press">
            💾 રકમ જમા કરો
          </button>
        </div>
      </div>
    `

    const gpayInput = document.getElementById('alGpay')
    const cashInput = document.getElementById('alCash')
    const totalEl = document.getElementById('alPayTotal')

    function updatePayTotal() {
      const total = num(gpayInput.value) + num(cashInput.value)
      totalEl.innerHTML = `
        <span class="text-sm text-gray-600">કુલ જમા: </span>
        <span class="text-lg font-bold text-brand-700">₹ ${total}</span>
      `
    }

    gpayInput.addEventListener('input', updatePayTotal)
    cashInput.addEventListener('input', updatePayTotal)

    document.getElementById('alPaySave').addEventListener('click', async () => {
      const { customers, settings } = getState()
      const customer = customers.find((c) => c.id === customerId)
      if (!customer) return

      let date = document.getElementById('alPayDate').value
      const gpay = num(gpayInput.value)
      const cash = num(cashInput.value)
      const note = document.getElementById('alPayNote').value.trim()
      const totalPaid = gpay + cash

      if (!date) { alert('તારીખ પસંદ કરો!'); return }
      if (totalPaid <= 0) { alert('ઓછામાં ઓછી એક રકમ દાખલ કરો!'); return }

      if (!date.startsWith(`${year}-${month}`)) {
        const ld = lastDayOfMonth(year, month)
        date = `${year}-${month}-${String(ld).padStart(2, '0')}`
      }

      const customerRate = customer.defaultRate || settings?.defaultRate || 20

      try {
        const saveBtn = document.getElementById('alPaySave')
        saveBtn.disabled = true
        saveBtn.textContent = 'સેવ થઈ રહ્યું છે...'

        await addRecord('deliveries', {
          date,
          time: timeStr(),
          route: customer.route || '',
          customerId,
          customerName: customer.name,
          full: 0,
          empty: 0,
          paid: totalPaid,
          gpay,
          cash,
          note,
          due: -totalPaid,
          rate: customerRate,
          isPayment: true,
          paymentMonth: month,
          paymentYear: year,
        })

        const prevDue = num(customer.pendingDue)
        const newDue = prevDue - totalPaid
        await updateRecord('customers', customerId, {
          pendingDue: newDue,
        })

        saveBtn.disabled = false
        saveBtn.textContent = '💾 રકમ જમા કરો'
        alert(`✅ ₹${totalPaid} જમા થયા! (${monthName} ${year})\n📱 GPay: ₹${gpay} + 💵 રોકડ: ₹${cash}`)
      } catch (err) {
        alert('ભૂલ: ' + err.message)
        const saveBtn = document.getElementById('alPaySave')
        saveBtn.disabled = false
        saveBtn.textContent = '💾 રકમ જમા કરો'
      }
    })
  }

  function renderEntryRow(d) {
    if (isPaymentEntry(d)) {
      const gpay = getEntryGpay(d)
      const cash = getEntryCash(d)
      const paid = getEntryPaid(d)
      let badges = ''
      if (gpay > 0) badges += `<span class="inline-block px-2 py-0.5 rounded-md bg-blue-100 text-blue-700 text-xs font-bold">[📱 GPAY જમા : ₹${gpay}]</span> `
      if (cash > 0) badges += `<span class="inline-block px-2 py-0.5 rounded-md bg-green-100 text-green-700 text-xs font-bold">[💵 રોકડ જમા : ₹${cash}]</span>`
      if (gpay === 0 && cash === 0) badges += `<span class="inline-block px-2 py-0.5 rounded-md bg-green-100 text-green-700 text-xs font-bold">[💵 રોકડ જમા : ₹${paid}]</span>`
      const noteText = d.note ? ` · 📝 ${d.note}` : ''
      const cardClass = gpay > 0 && cash === 0 ? 'bg-blue-50 border border-blue-200' : cash > 0 && gpay === 0 ? 'bg-green-50 border border-green-200' : 'bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200'
      return `
        <div class="flex items-center justify-between rounded-lg p-3 ${cardClass}">
          <div class="flex-1 min-w-0">
            <div class="text-sm font-semibold text-gray-800">${formatDate(d.date)}${noteText}</div>
            <div class="text-xs text-gray-600 mt-0.5">⏰ ${d.time || ''}</div>
            <div class="flex flex-wrap gap-1 mt-1">${badges}</div>
          </div>
          <div class="flex gap-1 ml-2">
            <button data-al-edit="${d.id}" class="alEdit px-2 py-1 rounded-lg bg-brand-50 text-brand-600 text-xs btn-press">✏️</button>
            <button data-al-del="${d.id}" class="alDel px-2 py-1 rounded-lg bg-red-50 text-red-600 text-xs btn-press">🗑️</button>
          </div>
        </div>
      `
    }
    const full = num(d.full)
    const empty = num(d.empty)
    const billAmount = full * num(d.rate)
    return `
      <div class="flex items-center justify-between rounded-lg p-3 bg-brand-50 border border-brand-200">
        <div class="flex-1 min-w-0">
          <div class="text-sm font-semibold text-gray-800">${formatDate(d.date)}</div>
          <div class="text-xs text-gray-600 mt-0.5">⏰ ${d.time || ''}</div>
          <div class="text-xs text-gray-600 mt-1">📦 ભરેલી ${full} / ખાલી ${empty} · 💰 બિલ ₹${billAmount}</div>
          <div class="text-xs text-gray-600 mt-0.5">💵 રોકડા ₹${num(d.paid)} · <span class="${num(d.due) > 0 ? 'text-warning-700 font-semibold' : ''}">બાકી ₹${num(d.due)}</span></div>
        </div>
      </div>
    `
  }

  function renderHistory() {
    const customerId = customerSelect.value
    if (!customerId) {
      historyEl.innerHTML = ''
      return
    }

    const monthDeliveries = getMonthDeliveries()
    const month = monthSelect.value
    const year = yearInput.value.trim()
    const monthName = MONTHS[parseInt(month, 10) - 1] || ''

    let filtered = monthDeliveries
    if (currentFilter === 'delivery') filtered = monthDeliveries.filter((d) => !isPaymentEntry(d))
    else if (currentFilter === 'payment') filtered = monthDeliveries.filter((d) => isPaymentEntry(d))

    const filterButtons = [
      { id: 'all', label: 'બધું', icon: '📋' },
      { id: 'delivery', label: 'માત્ર ડિલિવરી', icon: '📦' },
      { id: 'payment', label: 'માત્ર જમા', icon: '💰' },
    ]

    let rowsHtml = ''
    if (filtered.length === 0) {
      rowsHtml = '<p class="text-center text-gray-400 text-sm py-4">આ ફિલ્ટરમાં કોઈ એન્ટ્રી નથી</p>'
    } else {
      rowsHtml = filtered.map((d) => renderEntryRow(d)).join('')
    }

    historyEl.innerHTML = `
      <div class="bg-white rounded-2xl shadow-sm p-5">
        <div class="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h3 class="text-sm font-bold text-gray-800 flex items-center gap-2">
            <span>📋</span> આ મહિનાનો હિસાબ (${monthName} ${year})
          </h3>
          <div class="flex gap-1">
            ${filterButtons.map((f) => `
              <button data-filter="${f.id}"
                class="alFilter px-3 py-1.5 rounded-lg text-xs font-semibold btn-press transition-colors
                ${currentFilter === f.id ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}">
                ${f.icon} ${f.label}
              </button>
            `).join('')}
          </div>
        </div>
        <div class="space-y-2">
          ${rowsHtml}
        </div>
      </div>
    `

    historyEl.querySelectorAll('.alFilter').forEach((btn) => {
      btn.addEventListener('click', () => {
        currentFilter = btn.dataset.filter
        renderHistory()
      })
    })

    historyEl.querySelectorAll('.alDel').forEach((btn) => {
      btn.addEventListener('click', () => promptDeletePayment(btn.dataset.alDel, customerId))
    })

    historyEl.querySelectorAll('.alEdit').forEach((btn) => {
      btn.addEventListener('click', () => {
        const delivery = getMonthDeliveries().find((d) => d.id === btn.dataset.alEdit)
        if (delivery) promptEditPayment(delivery, customerId)
      })
    })
  }

  function renderHistorical() {
    const customerId = customerSelect.value
    if (!customerId) {
      historicalEl.innerHTML = ''
      return
    }

    if (!historicalExpanded) {
      historicalEl.innerHTML = `
        <div class="bg-white rounded-2xl shadow-sm p-4">
          <button id="alToggleHistorical"
            class="w-full py-3 rounded-xl bg-gray-100 text-gray-700 font-semibold btn-press text-sm flex items-center justify-center gap-2">
            📜 પાછલા મહિનાઓની વિગતો અને જૂનો હિસાબ <span class="text-xs">▼ Show More</span>
          </button>
        </div>
      `
      document.getElementById('alToggleHistorical').addEventListener('click', () => {
        historicalExpanded = true
        renderHistorical()
      })
      return
    }

    const allDeliveries = getAllCustomerDeliveries()
    const currentPrefix = `${yearInput.value.trim()}-${monthSelect.value}`
    const { customers, settings } = getState()
    const customer = customers.find((c) => c.id === customerId)
    const customerRate = customer?.defaultRate || settings?.defaultRate || 20

    const byMonth = new Map()
    allDeliveries.forEach((d) => {
      const dateStr = d.date || ''
      if (dateStr < currentPrefix && dateStr.length >= 7) {
        const monthKey = dateStr.substring(0, 7)
        if (!byMonth.has(monthKey)) byMonth.set(monthKey, [])
        byMonth.get(monthKey).push(d)
      }
    })

    const sortedMonths = [...byMonth.keys()].sort().reverse()

    let accordionHtml = ''
    if (sortedMonths.length === 0) {
      accordionHtml = '<p class="text-center text-gray-400 text-sm py-4">પાછલા મહિનામાં કોઈ એન્ટ્રી નથી</p>'
    } else {
      accordionHtml = sortedMonths.map((monthKey) => {
        const [y, m] = monthKey.split('-')
        const monthName = MONTHS[parseInt(m, 10) - 1] || ''
        const entries = byMonth.get(monthKey)
        const bill = entries.filter((d) => !isPaymentEntry(d)).reduce((s, d) => s + num(d.full) * num(d.rate || customerRate), 0)
        const paid = entries.filter((d) => isPaymentEntry(d)).reduce((s, d) => s + getEntryPaid(d), 0)
        const monthNet = bill - paid
        const dueLabel = monthNet > 0 ? 'બાકી' : monthNet < 0 ? 'એડવાન્સ' : 'ક્લિયર'
        const dueColor = monthNet > 0 ? 'text-warning-700 font-semibold' : monthNet < 0 ? 'text-green-700 font-semibold' : 'text-gray-500'

        return `
          <div class="rounded-xl border border-gray-200 overflow-hidden">
            <button data-hist-month="${monthKey}"
              class="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors btn-press">
              <span class="text-sm font-bold text-gray-800">📅 ${monthName} ${y}</span>
              <div class="flex gap-2 text-xs">
                <span class="text-gray-600">બિલ ₹${bill}</span>
                <span class="text-green-600">જમા ₹${paid}</span>
                <span class="${dueColor}">${dueLabel} ₹${Math.abs(monthNet)}</span>
              </div>
            </button>
            <div id="hist-detail-${monthKey}" class="hidden p-3 space-y-2 bg-white">
              ${entries.map((d) => renderEntryRow(d)).join('')}
            </div>
          </div>
        `
      }).join('')
    }

    historicalEl.innerHTML = `
      <div class="bg-white rounded-2xl shadow-sm p-5">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-sm font-bold text-gray-800 flex items-center gap-2">
            <span>📜</span> પાછલા મહિનાઓની વિગતો
          </h3>
          <button id="alCollapseHistorical" class="text-xs text-gray-500 hover:text-gray-700 btn-press">▲ Hide</button>
        </div>
        <div class="space-y-2">
          ${accordionHtml}
        </div>
      </div>
    `

    document.getElementById('alCollapseHistorical').addEventListener('click', () => {
      historicalExpanded = false
      renderHistorical()
    })

    historicalEl.querySelectorAll('[data-hist-month]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.histMonth
        const detail = document.getElementById(`hist-detail-${key}`)
        if (detail) detail.classList.toggle('hidden')
      })
    })
  }

  function promptDeletePayment(id, customerId) {
    const modal = document.createElement('div')
    modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 fade-in'
    modal.innerHTML = `
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 modal-in">
        <h3 class="text-lg font-bold text-gray-800 mb-2">🗑️ પેમેન્ટ ડિલીટ કરવા PIN દાખલ કરો</h3>
        <p class="text-sm text-gray-500 mb-4">પેમેન્ટ ડિલીટ કરવા માટે PIN જરૂરી છે</p>
        <input id="alDelPin" type="password" inputmode="numeric" maxlength="4" placeholder="PIN"
          class="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-red-500 text-gray-800 text-center text-lg tracking-widest" />
        <p id="alDelError" class="text-red-500 text-sm mt-2 hidden"></p>
        <div class="flex gap-2 mt-4">
          <button id="alDelCancel" class="flex-1 py-3 rounded-xl bg-gray-100 text-gray-700 font-semibold btn-press">રદ કરો</button>
          <button id="alDelConfirm" class="flex-1 py-3 rounded-xl bg-red-500 text-white font-semibold btn-press">ડિલીટ કરો</button>
        </div>
      </div>
    `
    document.body.appendChild(modal)
    const pinInput = document.getElementById('alDelPin')
    const errEl = document.getElementById('alDelError')

    document.getElementById('alDelCancel').addEventListener('click', () => modal.remove())
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove() })

    async function doDelete() {
      if (pinInput.value.trim() !== DELETE_PIN) {
        errEl.textContent = 'ખોટો PIN!'
        errEl.classList.remove('hidden')
        pinInput.value = ''
        return
      }
      try {
        const { customers } = getState()
        const customer = customers.find((c) => c.id === customerId)
        const allDeliveries = getAllCustomerDeliveries()
        const delivery = allDeliveries.find((d) => d.id === id)
        if (!delivery) return

        await deleteRecord('deliveries', id)
        if (customer) {
          const prevDue = num(customer.pendingDue)
          await updateRecord('customers', customerId, {
            pendingDue: prevDue + num(delivery.paid),
          })
        }
        modal.remove()
        alert('✅ પેમેન્ટ ડિલીટ થયું!')
      } catch (err) {
        alert('ભૂલ: ' + err.message)
      }
    }

    document.getElementById('alDelConfirm').addEventListener('click', doDelete)
    pinInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') doDelete() })
    pinInput.focus()
  }

  function promptEditPayment(delivery, customerId) {
    const { customers } = getState()
    const customer = customers.find((c) => c.id === customerId)
    if (!customer) return

    const modal = document.createElement('div')
    modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 fade-in'
    modal.innerHTML = `
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 modal-in">
        <h3 class="text-lg font-bold text-gray-800 mb-4">✏️ પેમેન્ટ સંપાદન</h3>
        <div class="space-y-3">
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">📅 તારીખ</label>
            <input id="alEditDate" type="date" value="${delivery.date || todayStr()}"
              class="w-full px-3 py-2.5 rounded-lg border-2 border-gray-200 focus:border-brand-500 text-gray-800 text-sm" />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">📱 GPay (₹)</label>
              <input id="alEditGpay" type="number" inputmode="numeric" value="${num(delivery.gpay)}"
                class="w-full px-3 py-2.5 rounded-lg border-2 border-gray-200 focus:border-brand-500 text-gray-800 text-sm text-center" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">💵 રોકડ (₹)</label>
              <input id="alEditCash" type="number" inputmode="numeric" value="${num(delivery.cash)}"
                class="w-full px-3 py-2.5 rounded-lg border-2 border-gray-200 focus:border-brand-500 text-gray-800 text-sm text-center" />
            </div>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">📝 નોંધ</label>
            <input id="alEditNote" type="text" value="${delivery.note || ''}"
              class="w-full px-3 py-2.5 rounded-lg border-2 border-gray-200 focus:border-brand-500 text-gray-800 text-sm" />
          </div>
        </div>
        <div class="flex gap-2 mt-4">
          <button id="alEditCancel" class="flex-1 py-3 rounded-xl bg-gray-100 text-gray-700 font-semibold btn-press">રદ</button>
          <button id="alEditSave" class="flex-1 py-3 rounded-xl bg-brand-600 text-white font-semibold btn-press">સેવ</button>
        </div>
      </div>
    `
    document.body.appendChild(modal)

    document.getElementById('alEditCancel').addEventListener('click', () => modal.remove())
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove() })

    document.getElementById('alEditSave').addEventListener('click', async () => {
      let date = document.getElementById('alEditDate').value
      const gpay = num(document.getElementById('alEditGpay').value)
      const cash = num(document.getElementById('alEditCash').value)
      const note = document.getElementById('alEditNote').value.trim()
      const totalPaid = gpay + cash

      if (totalPaid <= 0) { alert('ઓછામાં ઓછી એક રકમ દાખલ કરો!'); return }

      const month = monthSelect.value
      const year = yearInput.value.trim()
      if (!date.startsWith(`${year}-${month}`)) {
        const ld = lastDayOfMonth(year, month)
        date = `${year}-${month}-${String(ld).padStart(2, '0')}`
      }

      const oldPaid = num(delivery.paid)
      const paidDiff = totalPaid - oldPaid

      try {
        await updateRecord('deliveries', delivery.id, {
          date, gpay, cash, paid: totalPaid, due: -totalPaid, note,
          paymentMonth: month, paymentYear: year,
        })

        const prevDue = num(customer.pendingDue)
        await updateRecord('customers', customerId, {
          pendingDue: prevDue - paidDiff,
        })

        modal.remove()
        alert('✅ પેમેન્ટ અપડેટ થયું!')
      } catch (err) {
        alert('ભૂલ: ' + err.message)
      }
    })
  }

  routeSelect.addEventListener('change', () => { historicalExpanded = false; updateCustomers() })
  customerSelect.addEventListener('change', () => { historicalExpanded = false; renderAll() })
  monthSelect.addEventListener('change', () => { historicalExpanded = false; renderAll() })
  yearInput.addEventListener('input', renderAll)
  updateCustomers()
}
