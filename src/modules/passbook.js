import { getState } from '../store.js'
import { addRecord, updateRecord, deleteRecord, num, formatDate, guDate, todayStr, timeStr, sortRouteCustomers } from '../utils.js'
import { generateBillPDF, sharePDFFile } from '../pdfUtils.js'

const MONTHS = ['જાન્યુઆરી', 'ફેબ્રુઆરી', 'માર્ચ', 'એપ્રિલ', 'મે', 'જૂન', 'જુલાઈ', 'ઓગસ્ટ', 'સપ્ટેમ્બર', 'ઓક્ટોબર', 'નવેમ્બર', 'ડિસેમ્બર']

export function renderPassbook() {
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
          <span>👤</span> ગ્રાહક પાસબુક
        </h2>
        <div class="space-y-3">
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">📍 રૂટ</label>
            <select id="pbRoute"
              class="w-full px-3 py-2.5 rounded-lg border-2 border-gray-200 focus:border-brand-500 transition-colors text-gray-800 text-sm">
              ${routeNames.map((r) => `<option value="${r}" ${r === defaultRoute ? 'selected' : ''}>${r}</option>`).join('')}
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">👤 ગ્રાહક</label>
            <select id="pbCustomer"
              class="w-full px-3 py-2.5 rounded-lg border-2 border-gray-200 focus:border-brand-500 transition-colors text-gray-800 text-sm">
              <option value="">-- ગ્રાહક પસંદ કરો --</option>
            </select>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">📅 મહિનો</label>
              <select id="pbMonth"
                class="w-full px-3 py-2.5 rounded-lg border-2 border-gray-200 focus:border-brand-500 transition-colors text-gray-800 text-sm">
                ${MONTHS.map((m, i) => `<option value="${String(i + 1).padStart(2, '0')}" ${String(i + 1).padStart(2, '0') === currentMonth ? 'selected' : ''}>${m}</option>`).join('')}
              </select>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">📅 વર્ષ</label>
              <input id="pbYear" type="number" value="${currentYear}"
                class="w-full px-3 py-2.5 rounded-lg border-2 border-gray-200 focus:border-brand-500 transition-colors text-gray-800 text-sm" />
            </div>
          </div>
        </div>
        <div id="pbResults" class="mt-4"></div>
      </div>
    </div>
  `
}

export function initPassbook() {
  const routeSelect = document.getElementById('pbRoute')
  const customerSelect = document.getElementById('pbCustomer')
  const monthSelect = document.getElementById('pbMonth')
  const yearInput = document.getElementById('pbYear')
  const resultsEl = document.getElementById('pbResults')

  function updateCustomers() {
    const { customers } = getState()
    const route = routeSelect.value
    const routeCustomers = sortRouteCustomers(customers, route)
    customerSelect.innerHTML =
      '<option value="">-- ગ્રાહક પસંદ કરો --</option>' +
      routeCustomers.map((c, i) => `<option value="${c.id}">${i + 1}. ${c.name}</option>`).join('')
  }

  let currentFilter = 'all'

  function render() {
    const { deliveries, customers, settings } = getState()
    const customerId = customerSelect.value
    const month = monthSelect.value
    const year = yearInput.value.trim()

    if (!customerId) {
      resultsEl.innerHTML = `
        <div class="text-center py-8 text-gray-400">
          <p class="text-4xl mb-2">👤</p>
          <p>ગ્રાહક પસંદ કરો</p>
        </div>
      `
      return
    }

    const customer = customers.find((c) => c.id === customerId)
    if (!customer) return

    const prefix = `${year}-${month}`
    const allCustomerDeliveries = deliveries
      .filter((d) => d.customerId === customerId)
      .sort((a, b) => (a.date || '').localeCompare(b.date || ''))

    const monthDeliveries = allCustomerDeliveries.filter((d) => (d.date || '').startsWith(prefix))
    const beforeDeliveries = allCustomerDeliveries.filter((d) => (d.date || '') < prefix)

    const totalFull = monthDeliveries.reduce((s, d) => s + num(d.full), 0)
    const totalEmpty = monthDeliveries.reduce((s, d) => s + num(d.empty), 0)
    const totalPaid = monthDeliveries.reduce((s, d) => s + num(d.paid), 0)
    const overallPendingBottles = num(customer.pendingBottles)
    const overallPendingDue = num(customer.pendingDue)

    const customerRate = customer.defaultRate || settings?.defaultRate || 20
    const monthBill = monthDeliveries.reduce((s, d) => s + num(d.full) * num(d.rate || customerRate), 0)
    const previousBalance = beforeDeliveries.reduce((s, d) => s + num(d.due), 0)
    const netDue = previousBalance + monthBill - totalPaid

    const monthName = MONTHS[parseInt(month, 10) - 1] || ''

    const summaryCards = [
      { label: 'ભરેલી આપી', value: totalFull, icon: '📦', color: 'brand' },
      { label: 'ખાલી લીધી', value: totalEmpty, icon: '📦', color: 'accent' },
      { label: 'આ મહિનાનું બિલ', value: `₹${monthBill}`, icon: '💰', color: 'brand' },
      { label: 'બાકી બોટલ', value: overallPendingBottles, icon: '📊', color: 'warning' },
      { label: 'કુલ બાકી', value: `₹${overallPendingDue}`, icon: '💰', color: 'warning' },
    ]

    const ledgerCards = [
      { label: 'પાછલી બાકી', value: `₹${previousBalance}`, icon: '📜', color: previousBalance > 0 ? 'warning' : 'gray' },
      { label: 'આ મહિનાનું બિલ', value: `₹${monthBill}`, icon: '💳', color: 'brand' },
      { label: 'જમા થયેલ રોકડ', value: `₹${totalPaid}`, icon: '💵', color: 'accent' },
      { label: 'ચોખ્ખી બાકી', value: `₹${netDue}`, icon: '⚖️', color: netDue > 0 ? 'warning' : 'accent' },
    ]

    const dailyMap = new Map()
    monthDeliveries.forEach((d) => {
      const day = parseInt((d.date || '').split('-')[2] || '0', 10)
      if (!dailyMap.has(day)) dailyMap.set(day, [])
      dailyMap.get(day).push(d)
    })

    let calendarHtml = ''
    for (let day = 1; day <= new Date(parseInt(year), parseInt(month), 0).getDate(); day++) {
      const entries = dailyMap.get(day)
      if (entries) {
        const full = entries.reduce((s, d) => s + num(d.full), 0)
        const empty = entries.reduce((s, d) => s + num(d.empty), 0)
        const paid = entries.reduce((s, d) => s + num(d.paid), 0)
        calendarHtml += `
          <div class="rounded-lg p-2 bg-brand-50 border border-brand-200">
            <div class="text-xs font-bold text-brand-700">${day} ${monthName}</div>
            <div class="text-xs text-gray-600 mt-0.5">📦 ${full}/${empty} · 💵 ₹${paid}</div>
          </div>
        `
      }
    }

    const isPaymentEntry = (d) => d.isPayment || (num(d.full) === 0 && num(d.empty) === 0 && num(d.paid) > 0)

    let displayDeliveries = monthDeliveries
    if (currentFilter === 'delivery') {
      displayDeliveries = monthDeliveries.filter((d) => !isPaymentEntry(d))
    } else if (currentFilter === 'payment') {
      displayDeliveries = monthDeliveries.filter((d) => isPaymentEntry(d))
    }

    const filterButtons = [
      { id: 'all', label: 'બધું', icon: '📋' },
      { id: 'delivery', label: 'માત્ર ડિલિવરી', icon: '📦' },
      { id: 'payment', label: 'માત્ર જમા', icon: '💰' },
    ]

    let ledgerListHtml = ''
    displayDeliveries.forEach((d) => {
      const isPayment = isPaymentEntry(d)
      const gpay = num(d.gpay)
      const cash = num(d.cash)

      if (isPayment) {
        let badges = ''
        if (gpay > 0) {
          badges += `<span class="inline-block px-2 py-0.5 rounded-md bg-blue-100 text-blue-700 text-xs font-bold">[📱 GPAY જમા : ₹${gpay}]</span> `
        }
        if (cash > 0) {
          badges += `<span class="inline-block px-2 py-0.5 rounded-md bg-green-100 text-green-700 text-xs font-bold">[💵 રોકડ જમા : ₹${cash}]</span>`
        }
        if (gpay === 0 && cash === 0) {
          badges += `<span class="inline-block px-2 py-0.5 rounded-md bg-green-100 text-green-700 text-xs font-bold">[💵 રોકડ જમા : ₹${num(d.paid)}]</span>`
        }
        const cardClass = gpay > 0 && cash === 0 ? 'bg-blue-50 border border-blue-200' : cash > 0 && gpay === 0 ? 'bg-green-50 border border-green-200' : 'bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200'
        ledgerListHtml += `
        <div class="flex items-center justify-between rounded-lg p-2.5 ${cardClass}">
          <div class="flex items-center gap-2 flex-1 min-w-0">
            <span class="text-sm">💰</span>
            <div class="min-w-0">
              <div class="text-xs font-semibold text-gray-800">${formatDate(d.date)}</div>
              <div class="flex flex-wrap gap-1 mt-0.5">${badges}</div>
            </div>
          </div>
          <div class="flex gap-1 ml-2">
            <button data-pb-edit-pay="${d.id}" class="pbEditPay px-2 py-1 rounded-lg bg-brand-50 text-brand-600 text-xs btn-press">✏️</button>
            <button data-pb-del-pay="${d.id}" class="pbDelPay px-2 py-1 rounded-lg bg-red-50 text-red-600 text-xs btn-press">🗑️</button>
          </div>
        </div>
      `
      } else {
        ledgerListHtml += `
        <div class="flex items-center justify-between rounded-lg p-2.5 bg-gray-50 border border-gray-200">
          <div class="flex items-center gap-2">
            <span class="text-sm">📦</span>
            <div>
              <div class="text-xs font-semibold text-gray-800">${formatDate(d.date)}</div>
              <div class="text-xs text-gray-500">ભરેલી ${num(d.full)} / ખાલી ${num(d.empty)}</div>
            </div>
          </div>
          <div class="text-right">
            <div class="text-sm font-bold text-brand-700">₹${num(d.full) * num(d.rate)}</div>
            <div class="text-xs text-gray-500">💵 ₹${num(d.paid)}</div>
          </div>
        </div>
      `
      }
    })

    const billUrl = `${window.location.origin}${window.location.pathname}#/bill?id=${customerId}&month=${month}&year=${year}`
    const waMsg = buildPassbookMsg(customer, monthName, year, totalFull, totalEmpty, totalPaid, overallPendingBottles, overallPendingDue, monthDeliveries, billUrl)
    const waUrl = `https://wa.me/${(customer.phone || '').replace(/\D/g, '')}?text=${encodeURIComponent(waMsg)}`

    resultsEl.innerHTML = `
      <div class="grid grid-cols-2 gap-3 mb-4">
        ${summaryCards.map((c) => `
          <div class="rounded-xl p-3 bg-${c.color}-50 border border-${c.color}-200">
            <div class="text-xs text-gray-600">${c.icon} ${c.label}</div>
            <div class="text-xl font-bold text-${c.color}-700">${c.value}</div>
          </div>
        `).join('')}
      </div>

      <div class="bg-brand-50 rounded-xl p-4 mb-4 border border-brand-200">
        <h3 class="text-sm font-bold text-brand-800 mb-3">👤 ગ્રાહક ખાતાવહી હિસાબ</h3>
        <div class="grid grid-cols-2 gap-3">
          ${ledgerCards.map((c) => `
            <div class="rounded-lg p-2.5 ${c.color === 'gray' ? 'bg-gray-50 border border-gray-200' : `bg-${c.color}-50 border border-${c.color}-200`}">
              <div class="text-xs text-gray-600">${c.icon} ${c.label}</div>
              <div class="text-lg font-bold ${c.color === 'gray' ? 'text-gray-700' : `text-${c.color}-700`}">${c.value}</div>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="bg-white rounded-xl p-4 mb-4 border border-gray-200">
        <h3 class="text-sm font-bold text-gray-800 mb-3">💵 રોકડા જમા કરો</h3>
        <div class="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">📅 તારીખ</label>
            <input id="pbPayDate" type="date" value="${todayStr()}"
              class="w-full px-3 py-2.5 rounded-lg border-2 border-gray-200 focus:border-brand-500 text-gray-800 text-sm" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">₹ રકમ</label>
            <input id="pbPayAmount" type="number" inputmode="numeric" placeholder="0"
              class="w-full px-3 py-2.5 rounded-lg border-2 border-gray-200 focus:border-brand-500 text-gray-800 text-sm text-center" />
          </div>
        </div>
        <button id="pbPaySave"
          class="w-full py-2.5 rounded-lg bg-accent-500 text-white font-semibold btn-press text-sm">💾 રોકડા સેવ કરો</button>
      </div>

      <button id="pbBillPreviewBtn"
        class="w-full py-3 rounded-xl bg-brand-600 text-white font-semibold shadow-lg btn-press hover:bg-brand-700 transition-colors flex items-center justify-center gap-2 mb-3">
        📄 બિલ પ્રિવ્યૂ અને પ્રિન્ટ (Direct Print)
      </button>
      <a href="${waUrl}" target="_blank"
        class="w-full py-3 rounded-xl bg-green-500 text-white font-semibold shadow-lg btn-press hover:bg-green-600 transition-colors flex items-center justify-center gap-2 mb-4">
        📲 WhatsApp પર બિલ લિંક મોકલો
      </a>

      <div class="mb-4">
        <div class="flex items-center justify-between mb-2 flex-wrap gap-2">
          <h3 class="text-sm font-bold text-gray-700">📋 આ મહિનાની વિગત (${monthName} ${year})</h3>
          <div class="flex gap-1">
            ${filterButtons.map((f) => `
              <button data-pbfilter="${f.id}"
                class="pbFilter px-3 py-1.5 rounded-lg text-xs font-semibold btn-press transition-colors
                ${currentFilter === f.id ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}">
                ${f.icon} ${f.label}
              </button>
            `).join('')}
          </div>
        </div>
        <div class="space-y-2">
          ${ledgerListHtml || '<p class="text-center text-gray-400 text-sm py-4">આ ફિલ્ટરમાં કોઈ એન્ટ્રી નથી</p>'}
        </div>
      </div>

      <div>
        <h3 class="text-sm font-bold text-gray-700 mb-2">📅 દિવસવાર સારાંશ (${monthName} ${year})</h3>
        <div class="grid grid-cols-3 sm:grid-cols-4 gap-2">
          ${calendarHtml || '<p class="text-center text-gray-400 text-sm col-span-full py-4">આ મહિનામાં કોઈ ડિલિવરી નથી</p>'}
        </div>
      </div>
    `

    document.querySelectorAll('.pbFilter').forEach((btn) => {
      btn.addEventListener('click', () => {
        currentFilter = btn.dataset.pbfilter
        render()
      })
    })

    document.querySelectorAll('.pbDelPay').forEach((btn) => {
      btn.addEventListener('click', () => {
        promptPbDeletePayment(btn.dataset.pbDelPay, customerId, monthDeliveries, customer)
      })
    })

    document.querySelectorAll('.pbEditPay').forEach((btn) => {
      btn.addEventListener('click', () => {
        const delivery = monthDeliveries.find((d) => d.id === btn.dataset.pbEditPay)
        if (delivery) promptPbEditPayment(delivery, customerId, customer)
      })
    })

    const billPreviewBtn = document.getElementById('pbBillPreviewBtn')
    if (billPreviewBtn) {
      billPreviewBtn.addEventListener('click', () => {
        showBillPreviewModal(customer, monthName, year, monthDeliveries, beforeDeliveries, totalFull, totalEmpty, totalPaid, monthBill, previousBalance, netDue, customerRate)
      })
    }

    const paySaveBtn = document.getElementById('pbPaySave')
    if (paySaveBtn) {
      paySaveBtn.addEventListener('click', async () => {
        const date = document.getElementById('pbPayDate').value
        const amount = num(document.getElementById('pbPayAmount').value)
        if (!date) { alert('તારીખ પસંદ કરો!'); return }
        if (amount <= 0) { alert('સાચી રકમ દાખલ કરો!'); return }

        try {
          paySaveBtn.disabled = true
          paySaveBtn.textContent = 'સેવ થઈ રહ્યું છે...'

          await addRecord('deliveries', {
            date,
            time: timeStr(),
            route: customer.route || '',
            customerId,
            customerName: customer.name,
            full: 0,
            empty: 0,
            paid: amount,
            due: -amount,
            rate: customerRate,
            isPayment: true,
          })

          const prevDue = num(customer.pendingDue)
          await updateRecord('customers', customerId, {
            pendingDue: Math.max(0, prevDue - amount),
          })

          paySaveBtn.disabled = false
          paySaveBtn.textContent = '💾 રોકડા સેવ કરો'
          alert(`✅ ₹${amount} રોકડા જમા થયા!`)
        } catch (err) {
          alert('ભૂલ: ' + err.message)
          paySaveBtn.disabled = false
          paySaveBtn.textContent = '💾 રોકડા સેવ કરો'
        }
      })
    }
  }

  routeSelect.addEventListener('change', () => { updateCustomers(); render() })
  customerSelect.addEventListener('change', () => { currentFilter = 'all'; render() })
  monthSelect.addEventListener('change', () => { currentFilter = 'all'; render() })
  yearInput.addEventListener('input', render)
  updateCustomers()
  render()
}

function promptPbDeletePayment(id, customerId, monthDeliveries, customer) {
  const modal = document.createElement('div')
  modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 fade-in'
  modal.innerHTML = `
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 modal-in">
      <h3 class="text-lg font-bold text-gray-800 mb-2">🗑️ પેમેન્ટ ડિલીટ કરવા PIN દાખલ કરો</h3>
      <p class="text-sm text-gray-500 mb-4">પેમેન્ટ ડિલીટ કરવા માટે PIN જરૂરી છે</p>
      <input id="pbDelPin" type="password" inputmode="numeric" maxlength="4" placeholder="PIN"
        class="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-red-500 text-gray-800 text-center text-lg tracking-widest" />
      <p id="pbDelErr" class="text-red-500 text-sm mt-2 hidden"></p>
      <div class="flex gap-2 mt-4">
        <button id="pbDelCancel" class="flex-1 py-3 rounded-xl bg-gray-100 text-gray-700 font-semibold btn-press">રદ કરો</button>
        <button id="pbDelConfirm" class="flex-1 py-3 rounded-xl bg-red-500 text-white font-semibold btn-press">ડિલીટ કરો</button>
      </div>
    </div>
  `
  document.body.appendChild(modal)
  const pinInput = document.getElementById('pbDelPin')
  const errEl = document.getElementById('pbDelErr')

  document.getElementById('pbDelCancel').addEventListener('click', () => modal.remove())
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove() })

  async function doDelete() {
    if (pinInput.value.trim() !== '1234') {
      errEl.textContent = 'ખોટો PIN!'
      errEl.classList.remove('hidden')
      pinInput.value = ''
      return
    }
    try {
      const delivery = monthDeliveries.find((d) => d.id === id)
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

  document.getElementById('pbDelConfirm').addEventListener('click', doDelete)
  pinInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') doDelete() })
  pinInput.focus()
}

function promptPbEditPayment(delivery, customerId, customer) {
  const modal = document.createElement('div')
  modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 fade-in'
  modal.innerHTML = `
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 modal-in">
      <h3 class="text-lg font-bold text-gray-800 mb-4">✏️ પેમેન્ટ સંપાદન</h3>
      <div class="space-y-3">
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">📅 તારીખ</label>
          <input id="pbEditDate" type="date" value="${delivery.date || todayStr()}"
            class="w-full px-3 py-2.5 rounded-lg border-2 border-gray-200 focus:border-brand-500 text-gray-800 text-sm" />
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">📱 GPay (₹)</label>
            <input id="pbEditGpay" type="number" inputmode="numeric" value="${num(delivery.gpay)}"
              class="w-full px-3 py-2.5 rounded-lg border-2 border-gray-200 focus:border-brand-500 text-gray-800 text-sm text-center" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">💵 રોકડ (₹)</label>
            <input id="pbEditCash" type="number" inputmode="numeric" value="${num(delivery.cash)}"
              class="w-full px-3 py-2.5 rounded-lg border-2 border-gray-200 focus:border-brand-500 text-gray-800 text-sm text-center" />
          </div>
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">📝 નોંધ</label>
          <input id="pbEditNote" type="text" value="${delivery.note || ''}"
            class="w-full px-3 py-2.5 rounded-lg border-2 border-gray-200 focus:border-brand-500 text-gray-800 text-sm" />
        </div>
      </div>
      <div class="flex gap-2 mt-4">
        <button id="pbEditCancel" class="flex-1 py-3 rounded-xl bg-gray-100 text-gray-700 font-semibold btn-press">રદ</button>
        <button id="pbEditSave" class="flex-1 py-3 rounded-xl bg-brand-600 text-white font-semibold btn-press">સેવ</button>
      </div>
    </div>
  `
  document.body.appendChild(modal)

  document.getElementById('pbEditCancel').addEventListener('click', () => modal.remove())
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove() })

  document.getElementById('pbEditSave').addEventListener('click', async () => {
    const date = document.getElementById('pbEditDate').value
    const gpay = num(document.getElementById('pbEditGpay').value)
    const cash = num(document.getElementById('pbEditCash').value)
    const note = document.getElementById('pbEditNote').value.trim()
    const totalPaid = gpay + cash

    if (totalPaid <= 0) { alert('ઓછામાં ઓછી એક રકમ દાખલ કરો!'); return }

    const oldPaid = num(delivery.paid)
    const paidDiff = totalPaid - oldPaid

    try {
      await updateRecord('deliveries', delivery.id, {
        date, gpay, cash, paid: totalPaid, due: -totalPaid, note,
      })
      if (customer) {
        const prevDue = num(customer.pendingDue)
        await updateRecord('customers', customerId, {
          pendingDue: Math.max(0, prevDue - paidDiff),
        })
      }
      modal.remove()
      alert('✅ પેમેન્ટ અપડેટ થયું!')
    } catch (err) {
      alert('ભૂલ: ' + err.message)
    }
  })
}

function showBillPreviewModal(customer, monthName, year, monthDeliveries, beforeDeliveries, totalFull, totalEmpty, totalPaid, monthBill, previousBalance, netDue, customerRate) {
  const { settings } = getState()
  const bizName = settings?.bizName || 'ઠાકરધણી વોટર સપ્લાય'
  const isPayment = (d) => d.isPayment || (num(d.full) === 0 && num(d.empty) === 0 && num(d.paid) > 0)
  const deliveryEntries = monthDeliveries.filter((d) => !isPayment(d))
  const paymentEntries = monthDeliveries.filter((d) => isPayment(d))

  const billDate = new Date()
  const billDateStr = `${String(billDate.getDate()).padStart(2, '0')}/${String(billDate.getMonth() + 1).padStart(2, '0')}/${billDate.getFullYear()}`

  const modal = document.createElement('div')
  modal.className = 'fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-3 fade-in overflow-y-auto'
  modal.innerHTML = `
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md my-4 modal-in bill-print-area">
      <div class="bg-gradient-to-r from-brand-600 to-brand-700 text-white p-5 text-center rounded-t-2xl">
        <div class="text-xl font-bold mb-0.5">💧 ${bizName}</div>
        <div class="text-xs text-white/80">પાણી સપ્લાય સેવા</div>
      </div>

      <div class="p-5 max-h-[60vh] overflow-y-auto">
        <div class="flex items-center justify-between mb-3 pb-3 border-b border-gray-200">
          <div>
            <div class="text-xs text-gray-500">બિલ મહિનો</div>
            <div class="text-base font-bold text-gray-800">${monthName} ${year}</div>
          </div>
          <div class="text-right">
            <div class="text-xs text-gray-500">બિલ તારીખ</div>
            <div class="text-xs font-semibold text-gray-700">${billDateStr}</div>
          </div>
        </div>

        <div class="bg-brand-50 rounded-xl p-3 mb-3 border border-brand-200">
          <div class="grid grid-cols-2 gap-2 text-xs">
            <div>
              <div class="text-gray-500">👤 ગ્રાહક</div>
              <div class="font-semibold text-gray-800">${customer.name}</div>
            </div>
            <div>
              <div class="text-gray-500">📍 રૂટ</div>
              <div class="font-semibold text-gray-800">${customer.route || '-'}</div>
            </div>
            ${customer.phone ? `<div><div class="text-gray-500">📞 ફોન</div><div class="font-semibold text-gray-800">${customer.phone}</div></div>` : ''}
          </div>
        </div>

        ${deliveryEntries.length > 0 ? `
          <h3 class="text-xs font-bold text-gray-700 mb-1.5">📦 ડિલિવરી વિગત</h3>
          <div class="overflow-x-auto mb-3">
            <table class="w-full text-xs">
              <thead>
                <tr class="border-b-2 border-gray-200 text-gray-600">
                  <th class="text-left py-1.5 px-1">તારીખ</th>
                  <th class="text-center py-1.5 px-1">ભરેલી</th>
                  <th class="text-center py-1.5 px-1">ખાલી</th>
                  <th class="text-right py-1.5 px-1">રકમ</th>
                </tr>
              </thead>
              <tbody>
                ${deliveryEntries.map((d) => `
                  <tr class="border-b border-gray-100">
                    <td class="py-1.5 px-1 text-gray-700">${formatDate(d.date)}</td>
                    <td class="py-1.5 px-1 text-center text-gray-700">${num(d.full)}</td>
                    <td class="py-1.5 px-1 text-center text-gray-700">${num(d.empty)}</td>
                    <td class="py-1.5 px-1 text-right font-semibold text-brand-700">₹${num(d.full) * num(d.rate || customerRate)}</td>
                  </tr>
                `).join('')}
              </tbody>
              <tfoot>
                <tr class="border-t-2 border-gray-300 font-bold">
                  <td colspan="3" class="py-1.5 px-1 text-right text-gray-700">કુલ:</td>
                  <td class="py-1.5 px-1 text-right text-brand-700">₹${monthBill}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        ` : ''}

        ${paymentEntries.length > 0 ? `
          <h3 class="text-xs font-bold text-gray-700 mb-1.5">💵 જમા વિગત</h3>
          <div class="space-y-1 mb-3">
            ${paymentEntries.map((d) => `
              <div class="flex items-center justify-between rounded-lg bg-accent-50 border border-accent-200 px-2.5 py-1.5 text-xs">
                <span class="text-gray-700">${formatDate(d.date)}</span>
                <span class="font-semibold text-accent-700">₹${num(d.paid)}</span>
              </div>
            `).join('')}
          </div>
        ` : ''}

        <div class="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-3 border border-gray-200">
          <div class="space-y-1.5 text-xs">
            <div class="flex justify-between">
              <span class="text-gray-600">📜 પાછલી બાકી</span>
              <span class="font-semibold ${previousBalance > 0 ? 'text-warning-700' : 'text-gray-700'}">₹${previousBalance}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">💳 આ મહિનાનું બિલ</span>
              <span class="font-semibold text-brand-700">₹${monthBill}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">💵 જમા થયેલ રોકડ</span>
              <span class="font-semibold text-accent-700">₹${totalPaid}</span>
            </div>
            <div class="flex justify-between border-t-2 border-gray-300 pt-1.5 text-sm">
              <span class="font-bold text-gray-800">⚖️ ચોખ્ખી બાકી</span>
              <span class="font-bold ${netDue > 0 ? 'text-warning-700' : 'text-accent-700'}">₹${netDue}</span>
            </div>
          </div>
        </div>

        ${totalFull > 0 || totalEmpty > 0 ? `
          <div class="grid grid-cols-2 gap-2 mt-3">
            <div class="rounded-lg p-2.5 bg-brand-50 border border-brand-200 text-center">
              <div class="text-xs text-gray-600">📦 ભરેલી આપી</div>
              <div class="text-base font-bold text-brand-700">${totalFull}</div>
            </div>
            <div class="rounded-lg p-2.5 bg-accent-50 border border-accent-200 text-center">
              <div class="text-xs text-gray-600">📦 ખાલી લીધી</div>
              <div class="text-base font-bold text-accent-700">${totalEmpty}</div>
            </div>
          </div>
        ` : ''}

        <div class="text-center mt-4 pt-3 border-t border-gray-200">
          <p class="text-xs text-gray-400">આ બિલ 💧 ${bizName} દ્વારા જનરેટ કરવામાં આવ્યું છે</p>
          <p class="text-xs text-gray-400 mt-0.5">🙏 નિયમિત સહકાર બદલ આભાર!</p>
        </div>

        ${(() => {
          const upiId = settings?.upiId || 'manojbharwad@okaxis'
          const payeeName = settings?.payeeName || bizName
          const includeQr = settings?.includeQrInBill !== false
          if (includeQr && upiId && netDue > 0) {
            const qrUrl = `https://upiqr.in/api/qr?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}&am=${netDue}&cu=INR`
            return `
            <div class="text-center mt-3 p-2.5 bg-gray-50 rounded-xl border border-gray-200">
              <div class="text-xs font-semibold text-gray-600 mb-1.5">📲 UPI પેમેન્ટ કરો</div>
              <img src="${qrUrl}" alt="UPI QR" class="mx-auto w-28 h-28 rounded-lg" />
              <div class="text-xs text-gray-500 mt-1.5">UPI ID: ${upiId}</div>
              <div class="text-sm font-bold text-brand-700 mt-0.5">₹${netDue}</div>
            </div>
            `
          }
          return ''
        })()}
      </div>

      <div class="p-4 border-t border-gray-200 no-print">
        <div class="flex gap-2 mb-2">
          <button id="billModalClose" class="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-700 font-semibold btn-press text-sm">બંધ કરો</button>
          <button id="billModalPdf" class="flex-1 py-2.5 rounded-xl bg-brand-600 text-white font-semibold btn-press text-sm">📥 PDF ડાઉનલોડ</button>
        </div>
        <button id="billModalShare" class="w-full py-2.5 rounded-xl bg-green-500 text-white font-semibold btn-press text-sm">📲 ગ્રાહકને PDF મોકલો</button>
      </div>
    </div>
  `
  document.body.appendChild(modal)

  const closeBtn = document.getElementById('billModalClose')
  const pdfBtn = document.getElementById('billModalPdf')
  const shareBtn = document.getElementById('billModalShare')
  const billArea = modal.querySelector('.bill-print-area')

  closeBtn.addEventListener('click', (e) => {
    e.preventDefault()
    e.stopPropagation()
    modal.remove()
  })
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      e.preventDefault()
      e.stopPropagation()
      modal.remove()
    }
  })

  const safeFileName = `${customer.name || 'bill'}_${monthName}_${year}.pdf`.replace(/[^a-zA-Z0-9_\-.]/g, '_')

  pdfBtn.addEventListener('click', async () => {
    pdfBtn.disabled = true
    pdfBtn.textContent = 'બનાવી રહ્યું છે...'
    try {
      await generateBillPDF(billArea, safeFileName)
    } catch (err) {
      alert('PDF ભૂલ: ' + err.message)
    }
    pdfBtn.disabled = false
    pdfBtn.textContent = '📥 PDF ડાઉનલોડ'
  })

  shareBtn.addEventListener('click', async () => {
    shareBtn.disabled = true
    shareBtn.textContent = 'બનાવી રહ્યું છે...'
    try {
      const waMsg = `💧 ઠાકરધણી વોટર સપ્લાય 💧\n👤 ${customer.name} - ${monthName} ${year}\n⚖️ ચોખ્ખી બાકી: ₹${netDue}\n📄 બિલ PDF જોડે છે.`
      const shared = await sharePDFFile(billArea, safeFileName, waMsg)
      if (!shared) {
        const waUrl = `https://wa.me/${(customer.phone || '').replace(/\D/g, '')}?text=${encodeURIComponent(waMsg)}`
        window.open(waUrl, '_blank')
      }
    } catch (err) {
      alert('શેર ભૂલ: ' + err.message)
    }
    shareBtn.disabled = false
    shareBtn.textContent = '📲 ગ્રાહકને PDF મોકલો'
  })
}

function buildPassbookMsg(c, monthName, year, totalFull, totalEmpty, totalPaid, pendingBottles, pendingDue, deliveries, billUrl) {
  const { settings } = getState()
  const template = settings?.whatsappTemplate
  if (template) {
    return template
      .replace(/{name}/g, c.name || '')
      .replace(/{route}/g, c.route || '')
      .replace(/{month}/g, `${monthName} ${year}`)
      .replace(/{full}/g, totalFull)
      .replace(/{empty}/g, totalEmpty)
      .replace(/{paid}/g, totalPaid)
      .replace(/{bottles}/g, pendingBottles)
      .replace(/{due}/g, pendingDue)
  }

  let msg = `💧 *ઠાકરધણી વોટર સપ્લાય* 💧\n----------------------------------\n👤 *ગ્રાહક:* ${c.name}\n📍 *રૂટ:* ${c.route || ''}\n📅 *મહિનો:* ${monthName} ${year}\n----------------------------------\n📦 *કુલ ભરેલી આપી:* ${totalFull} નંગ\n📦 *કુલ ખાલી લીધી:* ${totalEmpty} નંગ\n💵 *કુલ રોકડા મળ્યા:* ₹${totalPaid}\n----------------------------------\n📦 *બાકી ખાલી બોટલ:* ${pendingBottles} નંગ\n💰 *કુલ બાકી રકમ:* ₹${pendingDue}\n----------------------------------\n`

  if (deliveries.length > 0 && deliveries.length <= 31) {
    msg += `📋 *દિવસવાર વિગત:*\n`
    const byDay = new Map()
    deliveries.forEach((d) => {
      const day = (d.date || '').split('-')[2] || ''
      if (!byDay.has(day)) byDay.set(day, { full: 0, empty: 0, paid: 0 })
      const row = byDay.get(day)
      row.full += num(d.full)
      row.empty += num(d.empty)
      row.paid += num(d.paid)
    })
    for (const [day, row] of byDay) {
      msg += `${day}: 📦${row.full}/${row.empty} 💵₹${row.paid}\n`
    }
    msg += `----------------------------------\n`
  }

  msg += `📄 *વિગતવાર બિલ જોવા અહીં ક્લિક કરો:*\n${billUrl || ''}\n----------------------------------\n`

  const upiId = settings?.upiId || 'manojbharwad@okaxis'
  const payeeName = settings?.payeeName || 'ઠાકરધણી વોટર સપ્લાય'
  const includeUpi = settings?.includeUpiInWa !== false
  if (includeUpi) {
    msg += `📲 *ઓનલાઇન પેમેન્ટ:*\nUPI ID: ${upiId}\nલિંક: https://upiqr.in/api/qr?pa=${upiId}&pn=${encodeURIComponent(payeeName)}&am=${pendingDue}\n----------------------------------\n`
  }

  msg += `🙏 નિયમિત સહકાર બદલ આભાર!\n📞 સંપર્ક: મનોજ ભરવાડ`
  return msg
}
