import { getState } from '../store.js'
import { num, sortRouteCustomers, addRecord, updateRecord, deleteRecord, todayStr, timeStr, formatDate } from '../utils.js'

const MONTHS = ['જાન્યુઆરી', 'ફેબ્રુઆરી', 'માર્ચ', 'એપ્રિલ', 'મે', 'જૂન', 'જુલાઈ', 'ઓગસ્ટ', 'સપ્ટેમ્બર', 'ઓક્ટોબર', 'નવેમ્બર', 'ડિસેમ્બર']

export function renderCalculator() {
  const { routes, settings } = getState()
  const routeNames = routes.length > 0 ? routes.map((r) => r.name) : ['Phase 2']
  const defaultRoute = routeNames.includes('Phase 2') ? 'Phase 2' : routeNames[0]
  const now = new Date()
  const currentMonth = String(now.getMonth() + 1).padStart(2, '0')
  const currentYear = now.getFullYear()
  const defaultRate = settings?.defaultRate || 20

  return `
    <div class="max-w-3xl mx-auto p-4 fade-in space-y-4">
      <div class="bg-white rounded-2xl shadow-sm p-5">
        <h2 class="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span>🧮</span> કેલ્ક્યુલેટર
        </h2>
        <div class="space-y-4">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">📍 રૂટ</label>
              <select id="calcRoute"
                class="w-full px-3 py-2.5 rounded-lg border-2 border-gray-200 focus:border-brand-500 transition-colors text-gray-800 text-sm">
                ${routeNames.map((r) => `<option value="${r}" ${r === defaultRoute ? 'selected' : ''}>${r}</option>`).join('')}
              </select>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">👤 ગ્રાહક</label>
              <select id="calcCustomer"
                class="w-full px-3 py-2.5 rounded-lg border-2 border-gray-200 focus:border-brand-500 transition-colors text-gray-800 text-sm">
                <option value="">-- ગ્રાહક પસંદ કરો --</option>
              </select>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">📅 મહિનો</label>
              <select id="calcMonth"
                class="w-full px-3 py-2.5 rounded-lg border-2 border-gray-200 focus:border-brand-500 transition-colors text-gray-800 text-sm">
                ${MONTHS.map((m, i) => `<option value="${String(i + 1).padStart(2, '0')}" ${String(i + 1).padStart(2, '0') === currentMonth ? 'selected' : ''}>${m}</option>`).join('')}
              </select>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">📅 વર્ષ</label>
              <input id="calcYear" type="number" value="${currentYear}"
                class="w-full px-3 py-2.5 rounded-lg border-2 border-gray-200 focus:border-brand-500 transition-colors text-gray-800 text-sm" />
            </div>
          </div>
          <div id="calcStats" class="grid grid-cols-2 gap-3"></div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">📦 બોટલ સંખ્યા</label>
              <input id="calcQty" type="number" inputmode="numeric" placeholder="0"
                class="w-full px-3 py-3 rounded-lg border-2 border-gray-200 focus:border-brand-500 transition-colors text-gray-800 text-center text-lg" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">₹ રેટ</label>
              <input id="calcRate" type="number" inputmode="numeric" value="${defaultRate}"
                class="w-full px-3 py-3 rounded-lg border-2 border-gray-200 focus:border-brand-500 transition-colors text-gray-800 text-center text-lg" />
            </div>
          </div>
          <div id="calcResult" class="rounded-xl p-4 bg-brand-50 border border-brand-200 text-center">
            <div class="text-sm text-gray-600">ટોટલ રકમ</div>
            <div class="text-3xl font-bold text-brand-700">₹ 0</div>
          </div>
          <div class="grid grid-cols-4 gap-2">
            ${[1, 2, 5, 10].map((n) => `
              <button data-qty="${n}" class="calcQuick py-2.5 rounded-lg bg-gray-100 text-gray-700 font-semibold text-sm btn-press hover:bg-gray-200">${n}</button>
            `).join('')}
          </div>
        </div>
      </div>

      <div id="calcAccountSection"></div>
      <div id="calcPaymentSection"></div>
      <div id="calcHistorySection"></div>
    </div>
  `
}

export function initCalculator() {
  const routeSelect = document.getElementById('calcRoute')
  const customerSelect = document.getElementById('calcCustomer')
  const monthSelect = document.getElementById('calcMonth')
  const yearInput = document.getElementById('calcYear')
  const qtyInput = document.getElementById('calcQty')
  const rateInput = document.getElementById('calcRate')
  const resultEl = document.getElementById('calcResult')
  const statsEl = document.getElementById('calcStats')
  const accountEl = document.getElementById('calcAccountSection')
  const paymentEl = document.getElementById('calcPaymentSection')
  const historyEl = document.getElementById('calcHistorySection')

  function updateCustomers() {
    const { customers } = getState()
    const route = routeSelect.value
    const routeCustomers = sortRouteCustomers(customers, route)
    customerSelect.innerHTML =
      '<option value="">-- ગ્રાહક પસંદ કરો --</option>' +
      routeCustomers.map((c, i) => `<option value="${c.id}" data-rate="${c.defaultRate || 20}">${i + 1}. ${c.name}</option>`).join('')
    updateStats()
  }

  function getMonthDeliveries() {
    const { deliveries } = getState()
    const customerId = customerSelect.value
    const month = monthSelect.value
    const year = yearInput.value.trim()
    const prefix = `${year}-${month}`
    return deliveries
      .filter((d) => d.customerId === customerId && (d.date || '').startsWith(prefix))
      .sort((a, b) => (a.date || '').localeCompare(b.date || ''))
  }

  function updateStats() {
    const customerId = customerSelect.value
    if (!customerId) {
      statsEl.innerHTML = `
        <div class="rounded-xl p-3 bg-brand-50 border border-brand-200">
          <div class="text-xs text-gray-600">📦 કુલ ભરેલી આપી</div>
          <div class="text-xl font-bold text-brand-700">0</div>
        </div>
        <div class="rounded-xl p-3 bg-accent-50 border border-accent-200">
          <div class="text-xs text-gray-600">📦 કુલ ખાલી લીધી</div>
          <div class="text-xl font-bold text-accent-700">0</div>
        </div>
      `
      qtyInput.value = ''
    } else {
      const monthDeliveries = getMonthDeliveries()
      const totalFull = monthDeliveries.reduce((s, d) => s + num(d.full), 0)
      const totalEmpty = monthDeliveries.reduce((s, d) => s + num(d.empty), 0)
      statsEl.innerHTML = `
        <div class="rounded-xl p-3 bg-brand-50 border border-brand-200">
          <div class="text-xs text-gray-600">📦 કુલ ભરેલી આપી</div>
          <div class="text-xl font-bold text-brand-700">${totalFull}</div>
        </div>
        <div class="rounded-xl p-3 bg-accent-50 border border-accent-200">
          <div class="text-xs text-gray-600">📦 કુલ ખાલી લીધી</div>
          <div class="text-xl font-bold text-accent-700">${totalEmpty}</div>
        </div>
      `
      qtyInput.value = totalFull
    }
    updateResult()
    renderAccount()
    renderPayment()
    renderHistory()
  }

  function updateResult() {
    const total = num(qtyInput.value) * num(rateInput.value)
    resultEl.innerHTML = `
      <div class="text-sm text-gray-600">ટોટલ રકમ</div>
      <div class="text-3xl font-bold text-brand-700">₹ ${total}</div>
    `
  }

  function renderAccount() {
    const customerId = customerSelect.value
    if (!customerId) {
      accountEl.innerHTML = ''
      return
    }

    const { customers, settings } = getState()
    const customer = customers.find((c) => c.id === customerId)
    if (!customer) { accountEl.innerHTML = ''; return }

    const monthDeliveries = getMonthDeliveries()
    const customerRate = customer.defaultRate || settings?.defaultRate || 20
    const totalBill = monthDeliveries.reduce((s, d) => s + num(d.full) * num(d.rate || customerRate), 0)
    const totalGpay = monthDeliveries.reduce((s, d) => s + num(d.gpay), 0)
    const totalCash = monthDeliveries.reduce((s, d) => s + num(d.cash), 0)
    const totalPaid = monthDeliveries.reduce((s, d) => s + num(d.paid), 0)
    const totalReceived = totalGpay + totalCash
    const netDue = totalBill - totalReceived

    const cards = [
      { label: 'કુલ બિલ', value: `₹${totalBill}`, icon: '💰', color: 'brand' },
      { label: 'કુલ GPay જમા', value: `₹${totalGpay}`, icon: '📱', color: 'accent' },
      { label: 'કુલ રોકડા જમા', value: `₹${totalCash}`, icon: '💵', color: 'accent' },
      { label: 'કુલ જમા રકમ', value: `₹${totalReceived}`, icon: '✅', color: 'brand' },
      { label: 'ચોખ્ખી બાકી', value: `₹${netDue}`, icon: '⚠️', color: netDue > 0 ? 'warning' : 'accent' },
    ]

    accountEl.innerHTML = `
      <div class="bg-white rounded-2xl shadow-sm p-5">
        <h3 class="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
          <span>📊</span> માસિક હિસાબ વિગત (${customer.name})
        </h3>
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
          ${cards.map((c) => `
            <div class="rounded-xl p-3 bg-${c.color}-50 border border-${c.color}-200">
              <div class="text-xs text-gray-600">${c.icon} ${c.label}</div>
              <div class="text-lg font-bold text-${c.color}-700">${c.value}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `
  }

  function renderPayment() {
    const customerId = customerSelect.value
    if (!customerId) {
      paymentEl.innerHTML = ''
      return
    }

    paymentEl.innerHTML = `
      <div class="bg-white rounded-2xl shadow-sm p-5">
        <h3 class="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
          <span>💳</span> રકમ જમા કરો (GPay + રોકડા)
        </h3>
        <div class="space-y-3">
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">📅 તારીખ</label>
            <input id="calcPayDate" type="date" value="${todayStr()}"
              class="w-full px-3 py-2.5 rounded-lg border-2 border-gray-200 focus:border-brand-500 text-gray-800 text-sm" />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">📱 GPay રકમ (₹)</label>
              <input id="calcGpay" type="number" inputmode="numeric" placeholder="0"
                class="w-full px-3 py-2.5 rounded-lg border-2 border-gray-200 focus:border-brand-500 text-gray-800 text-sm text-center" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">💵 રોકડા રકમ (₹)</label>
              <input id="calcCash" type="number" inputmode="numeric" placeholder="0"
                class="w-full px-3 py-2.5 rounded-lg border-2 border-gray-200 focus:border-brand-500 text-gray-800 text-sm text-center" />
            </div>
          </div>
          <div id="calcPayTotal" class="rounded-lg p-3 bg-brand-50 border border-brand-200 text-center">
            <span class="text-sm text-gray-600">કુલ જમા: </span>
            <span class="text-lg font-bold text-brand-700">₹ 0</span>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">📝 નોંધ (વૈકલ્પિક)</label>
            <input id="calcPayNote" type="text" placeholder="નોંધ..."
              class="w-full px-3 py-2.5 rounded-lg border-2 border-gray-200 focus:border-brand-500 text-gray-800 text-sm" />
          </div>
          <button id="calcPaySave"
            class="w-full py-3 rounded-xl bg-gradient-to-r from-accent-500 to-accent-600 text-white font-semibold shadow-lg btn-press">
            💾 રકમ જમા કરો
          </button>
        </div>
      </div>
    `

    const gpayInput = document.getElementById('calcGpay')
    const cashInput = document.getElementById('calcCash')
    const totalEl = document.getElementById('calcPayTotal')

    function updatePayTotal() {
      const total = num(gpayInput.value) + num(cashInput.value)
      totalEl.innerHTML = `
        <span class="text-sm text-gray-600">કુલ જમા: </span>
        <span class="text-lg font-bold text-brand-700">₹ ${total}</span>
      `
    }

    gpayInput.addEventListener('input', updatePayTotal)
    cashInput.addEventListener('input', updatePayTotal)

    document.getElementById('calcPaySave').addEventListener('click', async () => {
      const { customers, settings } = getState()
      const customer = customers.find((c) => c.id === customerId)
      if (!customer) return

      const date = document.getElementById('calcPayDate').value
      const gpay = num(gpayInput.value)
      const cash = num(cashInput.value)
      const note = document.getElementById('calcPayNote').value.trim()
      const totalPaid = gpay + cash

      if (!date) { alert('તારીખ પસંદ કરો!'); return }
      if (totalPaid <= 0) { alert('ઓછામાં ઓછી એક રકમ દાખલ કરો!'); return }

      const customerRate = customer.defaultRate || settings?.defaultRate || 20

      try {
        const saveBtn = document.getElementById('calcPaySave')
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
        })

        const prevDue = num(customer.pendingDue)
        await updateRecord('customers', customerId, {
          pendingDue: Math.max(0, prevDue - totalPaid),
        })

        saveBtn.disabled = false
        saveBtn.textContent = '💾 રકમ જમા કરો'
        alert(`✅ ₹${totalPaid} જમા થયા! (GPay: ₹${gpay} + રોકડા: ₹${cash})`)
      } catch (err) {
        alert('ભૂલ: ' + err.message)
        const saveBtn = document.getElementById('calcPaySave')
        saveBtn.disabled = false
        saveBtn.textContent = '💾 રકમ જમા કરો'
      }
    })
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

    if (monthDeliveries.length === 0) {
      historyEl.innerHTML = `
        <div class="bg-white rounded-2xl shadow-sm p-5">
          <h3 class="text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
            <span>📋</span> આ મહિનાનો હિસાબ (${monthName} ${year})
          </h3>
          <p class="text-center text-gray-400 text-sm py-4">આ મહિનામાં કોઈ એન્ટ્રી નથી</p>
        </div>
      `
      return
    }

    let rowsHtml = ''
    monthDeliveries.forEach((d) => {
      const isPayment = d.isPayment || (num(d.full) === 0 && num(d.empty) === 0 && num(d.paid) > 0)
      const gpay = num(d.gpay)
      const cash = num(d.cash)
      const paid = num(d.paid)

      if (isPayment) {
        const parts = []
        if (gpay > 0) parts.push(`📱 GPay: ₹${gpay}`)
        if (cash > 0) parts.push(`💵 Cash: ₹${cash}`)
        if (parts.length === 0) parts.push(`💵 ₹${paid}`)
        const noteText = d.note ? ` · 📝 ${d.note}` : ''
        rowsHtml += `
          <div class="flex items-center justify-between rounded-lg p-3 bg-accent-50 border border-accent-200">
            <div class="flex-1 min-w-0">
              <div class="text-sm font-semibold text-gray-800">${formatDate(d.date)} ${noteText}</div>
              <div class="text-xs text-gray-600">${parts.join(' + ')} (કુલ: ₹${paid})</div>
            </div>
            <div class="flex gap-1 ml-2">
              <button data-edit-pay="${d.id}" class="calcEditPay px-2 py-1 rounded-lg bg-brand-50 text-brand-600 text-xs btn-press">✏️</button>
              <button data-del-pay="${d.id}" class="calcDelPay px-2 py-1 rounded-lg bg-red-50 text-red-600 text-xs btn-press">🗑️</button>
            </div>
          </div>
        `
      } else {
        const full = num(d.full)
        const empty = num(d.empty)
        const billAmount = full * num(d.rate)
        rowsHtml += `
          <div class="flex items-center justify-between rounded-lg p-3 bg-brand-50 border border-brand-200">
            <div class="flex-1 min-w-0">
              <div class="text-sm font-semibold text-gray-800">${formatDate(d.date)}</div>
              <div class="text-xs text-gray-600">📦 ભરેલી ${full} / ખાલી ${empty} · 💰 બિલ ₹${billAmount} · 💵 રોકડા ₹${paid}</div>
            </div>
          </div>
        `
      }
    })

    historyEl.innerHTML = `
      <div class="bg-white rounded-2xl shadow-sm p-5">
        <h3 class="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
          <span>📋</span> આ મહિનાનો હિસાબ (${monthName} ${year})
        </h3>
        <div class="space-y-2">
          ${rowsHtml}
        </div>
      </div>
    `

    historyEl.querySelectorAll('.calcDelPay').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.delPay
        if (!confirm('શું આ પેમેન્ટ ડિલીટ કરવા છે?')) return
        const { customers } = getState()
        const customer = customers.find((c) => c.id === customerId)
        const delivery = monthDeliveries.find((d) => d.id === id)
        if (!customer || !delivery) return

        try {
          await deleteRecord('deliveries', id)
          const prevDue = num(customer.pendingDue)
          await updateRecord('customers', customerId, {
            pendingDue: prevDue + num(delivery.paid),
          })
          alert('✅ પેમેન્ટ ડિલીટ થયું!')
        } catch (err) {
          alert('ભૂલ: ' + err.message)
        }
      })
    })

    historyEl.querySelectorAll('.calcEditPay').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.editPay
        const delivery = monthDeliveries.find((d) => d.id === id)
        if (!delivery) return
        openEditPaymentModal(delivery, customerId)
      })
    })
  }

  function openEditPaymentModal(delivery, customerId) {
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
            <input id="editPayDate" type="date" value="${delivery.date || todayStr()}"
              class="w-full px-3 py-2.5 rounded-lg border-2 border-gray-200 focus:border-brand-500 text-gray-800 text-sm" />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">📱 GPay (₹)</label>
              <input id="editPayGpay" type="number" inputmode="numeric" value="${num(delivery.gpay)}"
                class="w-full px-3 py-2.5 rounded-lg border-2 border-gray-200 focus:border-brand-500 text-gray-800 text-sm text-center" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">💵 રોકડા (₹)</label>
              <input id="editPayCash" type="number" inputmode="numeric" value="${num(delivery.cash)}"
                class="w-full px-3 py-2.5 rounded-lg border-2 border-gray-200 focus:border-brand-500 text-gray-800 text-sm text-center" />
            </div>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">📝 નોંધ</label>
            <input id="editPayNote" type="text" value="${delivery.note || ''}"
              class="w-full px-3 py-2.5 rounded-lg border-2 border-gray-200 focus:border-brand-500 text-gray-800 text-sm" />
          </div>
        </div>
        <div class="flex gap-2 mt-4">
          <button id="editPayCancel" class="flex-1 py-3 rounded-xl bg-gray-100 text-gray-700 font-semibold btn-press">રદ</button>
          <button id="editPaySave" class="flex-1 py-3 rounded-xl bg-brand-600 text-white font-semibold btn-press">સેવ</button>
        </div>
      </div>
    `
    document.body.appendChild(modal)

    document.getElementById('editPayCancel').addEventListener('click', () => modal.remove())
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove() })

    document.getElementById('editPaySave').addEventListener('click', async () => {
      const date = document.getElementById('editPayDate').value
      const gpay = num(document.getElementById('editPayGpay').value)
      const cash = num(document.getElementById('editPayCash').value)
      const note = document.getElementById('editPayNote').value.trim()
      const totalPaid = gpay + cash

      if (totalPaid <= 0) { alert('ઓછામાં ઓછી એક રકમ દાખલ કરો!'); return }

      const oldPaid = num(delivery.paid)
      const paidDiff = totalPaid - oldPaid

      try {
        await updateRecord('deliveries', delivery.id, {
          date,
          gpay,
          cash,
          paid: totalPaid,
          due: -totalPaid,
          note,
        })

        const prevDue = num(customer.pendingDue)
        await updateRecord('customers', customerId, {
          pendingDue: Math.max(0, prevDue - paidDiff),
        })

        modal.remove()
        alert('✅ પેમેન્ટ અપડેટ થયું!')
      } catch (err) {
        alert('ભૂલ: ' + err.message)
      }
    })
  }

  routeSelect.addEventListener('change', updateCustomers)
  customerSelect.addEventListener('change', () => {
    const opt = customerSelect.options[customerSelect.selectedIndex]
    const rate = opt?.dataset.rate
    if (rate) rateInput.value = rate
    updateStats()
  })
  monthSelect.addEventListener('change', updateStats)
  yearInput.addEventListener('input', updateStats)
  qtyInput.addEventListener('input', updateResult)
  rateInput.addEventListener('input', updateResult)
  document.querySelectorAll('.calcQuick').forEach((btn) => {
    btn.addEventListener('click', () => {
      qtyInput.value = btn.dataset.qty
      updateResult()
    })
  })

  updateCustomers()
  updateResult()
}
