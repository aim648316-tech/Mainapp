import { getState } from '../store.js'
import { todayStr, num, formatDate, sortByOrder, updateRecord, deleteRecord } from '../utils.js'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'

const MONTHS = ['જાન્યુઆરી', 'ફેબ્રુઆરી', 'માર્ચ', 'એપ્રિલ', 'મે', 'જૂન', 'જુલાઈ', 'ઓગસ્ટ', 'સપ્ટેમ્બર', 'ઓક્ટોબર', 'નવેમ્બર', 'ડિસેમ્બર']

export function renderDailyReport() {
  const { routes } = getState()
  const routeNames = routes.length > 0 ? routes.map((r) => r.name) : ['Phase 2']
  const now = new Date()
  const currentMonth = String(now.getMonth() + 1).padStart(2, '0')
  const currentYear = now.getFullYear()

  return `
    <div class="max-w-3xl mx-auto p-4 space-y-4 fade-in">
      <div class="bg-white rounded-2xl shadow-sm p-5">
        <h2 class="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span>📊</span> Daily Report
        </h2>
        <div class="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">📅 તારીખ</label>
            <input id="drDate" type="date"
              class="w-full px-3 py-2.5 rounded-lg border-2 border-gray-200 focus:border-brand-500 transition-colors text-gray-800 text-sm"
              value="${todayStr()}" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">📍 રૂટ</label>
            <select id="drRoute"
              class="w-full px-3 py-2.5 rounded-lg border-2 border-gray-200 focus:border-brand-500 transition-colors text-gray-800 text-sm">
              <option value="">બધા રૂટ</option>
              ${routeNames.map((r) => `<option value="${r}">${r}</option>`).join('')}
            </select>
          </div>
        </div>
        <div id="drResults"></div>
      </div>

      <div class="bg-white rounded-2xl shadow-sm p-5">
        <h2 class="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span>🗓️</span> Monthly Summary
        </h2>
        <div class="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">📅 મહિનો</label>
            <select id="mrMonth"
              class="w-full px-3 py-2.5 rounded-lg border-2 border-gray-200 focus:border-brand-500 transition-colors text-gray-800 text-sm">
              ${MONTHS.map((m, i) => `<option value="${String(i + 1).padStart(2, '0')}" ${String(i + 1).padStart(2, '0') === currentMonth ? 'selected' : ''}>${m}</option>`).join('')}
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">📅 વર્ષ</label>
            <input id="mrYear" type="number" value="${currentYear}"
              class="w-full px-3 py-2.5 rounded-lg border-2 border-gray-200 focus:border-brand-500 transition-colors text-gray-800 text-sm" />
          </div>
        </div>
        <button id="mrDownload"
          class="w-full py-3 rounded-xl bg-gradient-to-r from-accent-500 to-accent-600 text-white font-semibold shadow-lg btn-press mb-4">
          📥 Download Monthly Report (Excel)
        </button>
        <div id="mrResults"></div>
      </div>
    </div>
  `
}

export function initDailyReport() {
  const dateInput = document.getElementById('drDate')
  const routeSelect = document.getElementById('drRoute')
  const resultsEl = document.getElementById('drResults')

  function renderDaily() {
    const { deliveries, customers } = getState()
    const date = dateInput.value
    const route = routeSelect.value

    let filtered = deliveries.filter((d) => d.date === date)
    if (route) filtered = filtered.filter((d) => d.route === route)

    const customerOrderMap = new Map()
    customers.forEach((c) => {
      const order = c.orderIndex !== undefined && c.orderIndex !== null
        ? c.orderIndex
        : (c.createdAt ? (c.createdAt.toMillis ? c.createdAt.toMillis() : 0) : 0)
      customerOrderMap.set(c.id, order)
    })

    filtered.sort((a, b) => {
      const orderA = customerOrderMap.get(a.customerId) ?? Infinity
      const orderB = customerOrderMap.get(b.customerId) ?? Infinity
      if (orderA !== orderB) return orderA - orderB
      return (a.time || '').localeCompare(b.time || '')
    })

    if (filtered.length === 0) {
      resultsEl.innerHTML = `
        <div class="text-center py-8 text-gray-400">
          <p class="text-4xl mb-2">📭</p>
          <p>આ તારીખે કોઈ એન્ટ્રી નથી</p>
        </div>
      `
      return
    }

    const totalFull = filtered.reduce((s, d) => s + num(d.full), 0)
    const totalEmpty = filtered.reduce((s, d) => s + num(d.empty), 0)
    const totalPaid = filtered.reduce((s, d) => s + num(d.paid), 0)
    const totalDue = filtered.reduce((s, d) => s + num(d.due), 0)
    const netStock = totalFull - totalEmpty

    const summaryCards = [
      { label: 'ભરેલી આપી', value: totalFull, icon: '📦', color: 'brand' },
      { label: 'ખાલી લીધી', value: totalEmpty, icon: '📦', color: 'accent' },
      { label: 'રોકડા', value: `₹${totalPaid}`, icon: '💵', color: 'accent' },
      { label: 'બાકી', value: `₹${totalDue}`, icon: '💰', color: 'warning' },
      { label: 'નેટ સ્ટોક', value: `${netStock > 0 ? '+' : ''}${netStock}`, icon: '📊', color: netStock > 0 ? 'warning' : 'brand' },
    ]

    resultsEl.innerHTML = `
      <div class="grid grid-cols-2 gap-3 mb-4">
        ${summaryCards
          .map(
            (c) => `
          <div class="rounded-xl p-3 bg-${c.color}-50 border border-${c.color}-200">
            <div class="text-xs text-gray-600">${c.icon} ${c.label}</div>
            <div class="text-xl font-bold text-${c.color}-700">${c.value}</div>
          </div>
        `
          )
          .join('')}
      </div>
      <div class="space-y-2">
        ${filtered
          .map(
            (d) => `
          <div class="rounded-xl p-3 border ${num(d.full) !== num(d.empty) ? 'entry-pending' : 'bg-gray-50 border-gray-200'}">
            <div class="flex justify-between items-start">
              <div class="flex-1">
                <div class="font-semibold text-gray-800 text-sm">${d.customerName}</div>
                <div class="text-xs text-gray-500">${d.route} · ${d.time || ''}</div>
                <div class="text-xs text-gray-700 mt-1">📦 ${d.full}/${d.empty} · ₹${d.rate}</div>
                <div class="text-xs ${num(d.due) > 0 ? 'text-warning-700 font-semibold' : 'text-gray-500'}">💵 ₹${d.paid} · બાકી ₹${d.due}</div>
              </div>
              <div class="flex gap-1 ml-2">
                <button data-dr-edit="${d.id}" class="drEdit px-2 py-1 rounded-lg bg-brand-50 text-brand-600 hover:bg-brand-100 text-xs btn-press">✏️</button>
                <button data-dr-del="${d.id}" data-dr-customer="${d.customerId}" data-dr-full="${d.full}" data-dr-empty="${d.empty}" data-dr-due="${d.due}" class="drDel px-2 py-1 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 text-xs btn-press">🗑️</button>
              </div>
            </div>
          </div>
        `
          )
          .join('')}
      </div>
    `
  }

  dateInput.addEventListener('change', renderDaily)
  routeSelect.addEventListener('change', renderDaily)
  renderDaily()

  document.addEventListener('click', handleDrEdit)
  document.addEventListener('click', handleDrDel)

  const monthSelect = document.getElementById('mrMonth')
  const yearInput = document.getElementById('mrYear')
  const mrResults = document.getElementById('mrResults')
  const downloadBtn = document.getElementById('mrDownload')

  function renderMonthly() {
    const { deliveries, customers } = getState()
    const month = monthSelect.value
    const year = yearInput.value.trim()
    if (!month || !year) return

    const prefix = `${year}-${month}`
    const monthDeliveries = deliveries.filter((d) => (d.date || '').startsWith(prefix))

    if (monthDeliveries.length === 0) {
      mrResults.innerHTML = `
        <div class="text-center py-8 text-gray-400">
          <p class="text-4xl mb-2">📭</p>
          <p>આ મહિનામાં કોઈ એન્ટ્રી નથી</p>
        </div>
      `
      return
    }

    const sortedCustomers = sortByOrder(customers)
    const customerMap = new Map()
    sortedCustomers.forEach((c) => {
      customerMap.set(c.id, {
        name: c.name,
        route: c.route || '',
        full: 0,
        empty: 0,
        paid: 0,
        pendingBottles: num(c.pendingBottles),
        pendingDue: num(c.pendingDue),
      })
    })

    let totalFull = 0
    let totalEmpty = 0
    let totalPaid = 0

    monthDeliveries.forEach((d) => {
      if (!customerMap.has(d.customerId)) {
        customerMap.set(d.customerId, {
          name: d.customerName || '',
          route: d.route || '',
          full: 0,
          empty: 0,
          paid: 0,
          pendingBottles: 0,
          pendingDue: 0,
        })
      }
      const row = customerMap.get(d.customerId)
      row.full += num(d.full)
      row.empty += num(d.empty)
      row.paid += num(d.paid)
      totalFull += num(d.full)
      totalEmpty += num(d.empty)
      totalPaid += num(d.paid)
    })

    const rows = [...customerMap.values()].filter((r) => r.full > 0 || r.empty > 0)

    if (rows.length === 0) {
      mrResults.innerHTML = `
        <div class="text-center py-8 text-gray-400">
          <p class="text-4xl mb-2">📭</p>
          <p>આ મહિનામાં કોઈ એન્ટ્રી નથી</p>
        </div>
      `
      return
    }

    const monthName = MONTHS[parseInt(month, 10) - 1] || ''

    mrResults.innerHTML = `
      <div class="overflow-x-auto -mx-2 px-2">
        <table class="w-full text-xs sm:text-sm">
          <thead>
            <tr class="bg-brand-600 text-white">
              <th class="px-2 py-2 text-left rounded-l-lg">ક્રમ</th>
              <th class="px-2 py-2 text-left">ગ્રાહક</th>
              <th class="px-2 py-2 text-left">રૂટ</th>
              <th class="px-2 py-2 text-center">ભરેલી</th>
              <th class="px-2 py-2 text-center">ખાલી</th>
              <th class="px-2 py-2 text-center">બાકી બોટલ</th>
              <th class="px-2 py-2 text-center">રોકડા</th>
              <th class="px-2 py-2 text-center rounded-r-lg">બાકી ₹</th>
            </tr>
          </thead>
          <tbody>
            ${rows
              .map(
                (r, i) => `
              <tr class="${i % 2 === 0 ? 'bg-gray-50' : 'bg-white'} border-b border-gray-100">
                <td class="px-2 py-2 text-gray-600">${i + 1}</td>
                <td class="px-2 py-2 font-medium text-gray-800">${r.name}</td>
                <td class="px-2 py-2 text-gray-600">${r.route}</td>
                <td class="px-2 py-2 text-center text-gray-700">${r.full}</td>
                <td class="px-2 py-2 text-center text-gray-700">${r.empty}</td>
                <td class="px-2 py-2 text-center font-semibold ${r.full - r.empty !== 0 ? 'text-warning-700' : 'text-gray-500'}">${r.full - r.empty}</td>
                <td class="px-2 py-2 text-center text-gray-700">₹${r.paid}</td>
                <td class="px-2 py-2 text-center font-semibold ${r.pendingDue > 0 ? 'text-warning-700' : 'text-gray-500'}">₹${r.pendingDue}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
          <tfoot>
            <tr class="bg-brand-100 font-bold text-brand-800">
              <td colspan="3" class="px-2 py-2.5 rounded-bl-lg">કુલ મહિનો: ${monthName} ${year}</td>
              <td class="px-2 py-2.5 text-center">${totalFull}</td>
              <td class="px-2 py-2.5 text-center">${totalEmpty}</td>
              <td class="px-2 py-2.5 text-center">${totalFull - totalEmpty}</td>
              <td class="px-2 py-2.5 text-center">₹${totalPaid}</td>
              <td class="px-2 py-2.5 text-center rounded-br-lg"></td>
            </tr>
          </tfoot>
        </table>
      </div>
    `

    downloadBtn.onclick = () => {
      const data = rows.map((r, i) => ({
        'Sr': i + 1,
        'Customer': r.name,
        'Route': r.route,
        'Total Full': r.full,
        'Total Empty': r.empty,
        'Net Bottles': r.full - r.empty,
        'Cash Paid': r.paid,
        'Pending Due': r.pendingDue,
      }))
      data.push({
        'Sr': '',
        'Customer': `TOTAL (${monthName} ${year})`,
        'Route': '',
        'Total Full': totalFull,
        'Total Empty': totalEmpty,
        'Net Bottles': totalFull - totalEmpty,
        'Cash Paid': totalPaid,
        'Pending Due': '',
      })
      const ws = XLSX.utils.json_to_sheet(data)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, `Monthly ${monthName} ${year}`)
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
      saveAs(new Blob([wbout], { type: 'application/octet-stream' }), `monthly-report-${month}-${year}.xlsx`)
    }
  }

  monthSelect.addEventListener('change', renderMonthly)
  yearInput.addEventListener('input', renderMonthly)
  renderMonthly()
}

function handleDrEdit(e) {
  const btn = e.target.closest('.drEdit')
  if (!btn) return
  const { deliveries } = getState()
  const delivery = deliveries.find((d) => d.id === btn.dataset.drEdit)
  if (!delivery) return
  promptDrEdit(delivery)
}

function handleDrDel(e) {
  const btn = e.target.closest('.drDel')
  if (!btn) return
  promptDrDelete(btn.dataset.drDel, btn.dataset.drCustomer, num(btn.dataset.drFull), num(btn.dataset.drEmpty), num(btn.dataset.drDue))
}

function promptDrDelete(id, customerId, full, empty, due) {
  const modal = document.createElement('div')
  modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 fade-in'
  modal.innerHTML = `
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 modal-in">
      <h3 class="text-lg font-bold text-gray-800 mb-2">🗑️ ડિલીટ કરવા પિન દાખલ કરો</h3>
      <p class="text-sm text-gray-500 mb-4">એન્ટ્રી ડિલીટ કરવા માટે પિન જરૂરી છે</p>
      <input id="drDelPin" type="password" inputmode="numeric" maxlength="4" placeholder="PIN"
        class="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-red-500 transition-colors text-gray-800 text-center text-lg tracking-widest" />
      <p id="drDelError" class="text-red-500 text-sm mt-2 hidden"></p>
      <div class="flex gap-2 mt-4">
        <button id="drDelCancel" class="flex-1 py-3 rounded-xl bg-gray-100 text-gray-700 font-semibold btn-press">રદ કરો</button>
        <button id="drDelConfirm" class="flex-1 py-3 rounded-xl bg-red-500 text-white font-semibold btn-press">ડિલીટ કરો</button>
      </div>
    </div>
  `
  document.body.appendChild(modal)
  const pinInput = document.getElementById('drDelPin')
  const errEl = document.getElementById('drDelError')

  document.getElementById('drDelCancel').addEventListener('click', () => modal.remove())
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove() })

  async function doDelete() {
    if (pinInput.value.trim() !== '9916') {
      errEl.textContent = 'ખોટો પિન!'
      errEl.classList.remove('hidden')
      pinInput.value = ''
      return
    }
    try {
      const { customers } = getState()
      const customer = customers.find((c) => c.id === customerId)
      if (customer) {
        await updateRecord('customers', customerId, {
          pendingBottles: num(customer.pendingBottles) - (full - empty),
          pendingDue: num(customer.pendingDue) - due,
        })
      }
      await deleteRecord('deliveries', id)
      modal.remove()
      alert('✅ એન્ટ્રી ડિલીટ થઈ!')
    } catch (err) { alert('ભૂલ: ' + err.message) }
  }

  document.getElementById('drDelConfirm').addEventListener('click', doDelete)
  pinInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') doDelete() })
  pinInput.focus()
}

function promptDrEdit(delivery) {
  const oldFull = num(delivery.full)
  const oldEmpty = num(delivery.empty)
  const oldPaid = num(delivery.paid)
  const oldDue = num(delivery.due)
  const oldRate = num(delivery.rate)

  const modal = document.createElement('div')
  modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 fade-in'
  modal.innerHTML = `
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 modal-in max-h-[90vh] overflow-y-auto">
      <h3 class="text-lg font-bold text-gray-800 mb-1">✏️ એન્ટ્રી સુધારો</h3>
      <p class="text-sm text-gray-500 mb-4">${delivery.customerName} · ${delivery.date} · ${delivery.time || ''}</p>
      <div class="space-y-3">
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">📅 તારીખ</label>
            <input id="drEditDate" type="date" value="${delivery.date || ''}"
              class="w-full px-3 py-2.5 rounded-lg border-2 border-gray-200 focus:border-brand-500 text-gray-800 text-sm" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">⏰ સમય</label>
            <input id="drEditTime" type="text" value="${delivery.time || ''}"
              class="w-full px-3 py-2.5 rounded-lg border-2 border-gray-200 focus:border-brand-500 text-gray-800 text-sm" />
          </div>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">₹ રેટ</label>
            <input id="drEditRate" type="number" inputmode="numeric" value="${oldRate}"
              class="w-full px-3 py-2.5 rounded-lg border-2 border-gray-200 focus:border-brand-500 text-gray-800 text-sm" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">💰 બાકી</label>
            <div id="drEditDue" class="w-full px-3 py-2.5 rounded-lg bg-gray-50 border-2 border-gray-200 text-gray-700 text-sm font-semibold flex items-center">₹ ${oldDue}</div>
          </div>
        </div>
        <div class="grid grid-cols-3 gap-3">
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">📦 ભરેલી</label>
            <input id="drEditFull" type="number" inputmode="numeric" value="${oldFull}"
              class="w-full px-3 py-2.5 rounded-lg border-2 border-gray-200 focus:border-brand-500 text-gray-800 text-sm text-center" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">📦 ખાલી</label>
            <input id="drEditEmpty" type="number" inputmode="numeric" value="${oldEmpty}"
              class="w-full px-3 py-2.5 rounded-lg border-2 border-gray-200 focus:border-brand-500 text-gray-800 text-sm text-center" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">💵 રોકડા</label>
            <input id="drEditPaid" type="number" inputmode="numeric" value="${oldPaid}"
              class="w-full px-3 py-2.5 rounded-lg border-2 border-gray-200 focus:border-brand-500 text-gray-800 text-sm text-center" />
          </div>
        </div>
      </div>
      <div class="flex gap-2 mt-4">
        <button id="drEditCancel" class="flex-1 py-3 rounded-xl bg-gray-100 text-gray-700 font-semibold btn-press">રદ કરો</button>
        <button id="drEditSave" class="flex-1 py-3 rounded-xl bg-brand-600 text-white font-semibold btn-press">સેવ કરો</button>
      </div>
    </div>
  `
  document.body.appendChild(modal)

  const rateInput = document.getElementById('drEditRate')
  const fullInput = document.getElementById('drEditFull')
  const paidInput = document.getElementById('drEditPaid')
  const dueDisplay = document.getElementById('drEditDue')

  function updateDue() {
    const due = num(fullInput.value) * num(rateInput.value) - num(paidInput.value)
    dueDisplay.textContent = `₹ ${due}`
    dueDisplay.className = `w-full px-3 py-2.5 rounded-lg border-2 text-sm font-semibold flex items-center ${due > 0 ? 'bg-warning-50 border-warning-300 text-warning-700' : 'bg-gray-50 border-gray-200 text-gray-700'}`
  }

  ;[rateInput, fullInput, paidInput].forEach((el) => el.addEventListener('input', updateDue))

  document.getElementById('drEditCancel').addEventListener('click', () => modal.remove())
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove() })

  document.getElementById('drEditSave').addEventListener('click', async () => {
    const newFull = num(fullInput.value)
    const newEmpty = num(document.getElementById('drEditEmpty').value)
    const newPaid = num(paidInput.value)
    const newRate = num(rateInput.value)
    const newDue = newFull * newRate - newPaid

    const diffFull = newFull - oldFull
    const diffEmpty = newEmpty - oldEmpty
    const diffDue = newDue - oldDue

    try {
      await updateRecord('deliveries', delivery.id, {
        date: document.getElementById('drEditDate').value,
        time: document.getElementById('drEditTime').value,
        rate: newRate, full: newFull, empty: newEmpty, paid: newPaid, due: newDue,
      })

      const { customers } = getState()
      const customer = customers.find((c) => c.id === delivery.customerId)
      if (customer) {
        await updateRecord('customers', delivery.customerId, {
          pendingBottles: num(customer.pendingBottles) + (diffFull - diffEmpty),
          pendingDue: num(customer.pendingDue) + diffDue,
        })
      }
      modal.remove()
      alert('✅ એન્ટ્રી અપડેટ થઈ!')
    } catch (err) { alert('ભૂલ: ' + err.message) }
  })
}
