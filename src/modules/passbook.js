import { getState } from '../store.js'
import { addRecord, updateRecord, deleteRecord, num, formatDate, guDate, todayStr, timeStr, sortRouteCustomers } from '../utils.js'

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

    const waMsg = buildPassbookMsg(customer, monthName, year, totalFull, totalEmpty, totalPaid, overallPendingBottles, overallPendingDue, monthDeliveries)
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

      <a href="${waUrl}" target="_blank"
        class="w-full py-3 rounded-xl bg-green-500 text-white font-semibold shadow-lg btn-press hover:bg-green-600 transition-colors flex items-center justify-center gap-2 mb-4">
        📲 WhatsApp પર સ્ટેટમેન્ટ મોકલો
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
    if (pinInput.value.trim() !== '9916') {
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

function buildPassbookMsg(c, monthName, year, totalFull, totalEmpty, totalPaid, pendingBottles, pendingDue, deliveries) {
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

  msg += `📲 *ઓનલાઇન પેમેન્ટ માટે UPI લિંક:*\nupi://pay?pa=manojbharwad@okaxis&pn=Thakardhani%20Water&am=${pendingDue}&cu=INR\n----------------------------------\n🙏 નિયમિત સહકાર બદલ આભાર!\n📞 સંપર્ક: મનોજ ભરવાડ`
  return msg
}
