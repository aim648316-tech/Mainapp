import { getState } from '../store.js'
import { deleteRecord, updateRecord, num, formatDate, Timestamp } from '../utils.js'

export function renderEntryList() {
  const { routes, customers } = getState()
  const routeNames = routes.length > 0 ? routes.map((r) => r.name) : ['Phase 2']

  return `
    <div class="max-w-3xl mx-auto p-4 space-y-4 fade-in">
      <div class="bg-white rounded-2xl shadow-sm p-5">
        <h2 class="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span>📋</span> Entry List
        </h2>
        <div class="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">📍 રૂટ</label>
            <select id="elRoute"
              class="w-full px-3 py-2.5 rounded-lg border-2 border-gray-200 focus:border-brand-500 transition-colors text-gray-800 text-sm">
              <option value="">બધા રૂટ</option>
              ${routeNames.map((r) => `<option value="${r}" ${r === 'Phase 2' ? 'selected' : ''}>${r}</option>`).join('')}
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">👤 ગ્રાહક</label>
            <select id="elCustomer"
              class="w-full px-3 py-2.5 rounded-lg border-2 border-gray-200 focus:border-brand-500 transition-colors text-gray-800 text-sm">
              <option value="">બધા ગ્રાહક</option>
              ${customers.map((c) => `<option value="${c.id}">${c.name}</option>`).join('')}
            </select>
          </div>
        </div>
        <div id="elResults"></div>
      </div>
    </div>
  `
}

export function initEntryList() {
  const routeSelect = document.getElementById('elRoute')
  const customerSelect = document.getElementById('elCustomer')
  const resultsEl = document.getElementById('elResults')

  let currentFilter = 'all'

  function render() {
    const { deliveries, customers } = getState()
    const route = routeSelect.value
    const customerId = customerSelect.value

    let filtered = [...deliveries]
    if (route) filtered = filtered.filter((d) => d.route === route)
    if (customerId) filtered = filtered.filter((d) => d.customerId === customerId)

    filtered.sort((a, b) => {
      const dateCompare = (a.date || '').localeCompare(b.date || '')
      if (dateCompare !== 0) return dateCompare
      const ta = a.createdAt instanceof Timestamp ? a.createdAt.toMillis() : 0
      const tb = b.createdAt instanceof Timestamp ? b.createdAt.toMillis() : 0
      return ta - tb
    })

    const isPaymentEntry = (d) => d.isPayment || (num(d.full) === 0 && num(d.empty) === 0 && num(d.paid) > 0)

    if (currentFilter === 'delivery') {
      filtered = filtered.filter((d) => !isPaymentEntry(d))
    } else if (currentFilter === 'payment') {
      filtered = filtered.filter((d) => isPaymentEntry(d))
    }

    const filterButtons = [
      { id: 'all', label: 'બધું', icon: '📋' },
      { id: 'delivery', label: 'માત્ર ડિલિવરી', icon: '📦' },
      { id: 'payment', label: 'માત્ર જમા', icon: '💰' },
    ]

    const filterHtml = `
      <div class="flex gap-1 mb-3">
        ${filterButtons.map((f) => `
          <button data-elfilter="${f.id}"
            class="elFilter px-3 py-1.5 rounded-lg text-xs font-semibold btn-press transition-colors
            ${currentFilter === f.id ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}">
            ${f.icon} ${f.label}
          </button>
        `).join('')}
      </div>
    `

    if (filtered.length === 0) {
      resultsEl.innerHTML = `
        <div class="text-center py-8 text-gray-400">
          <p class="text-4xl mb-2">📭</p>
          <p>કોઈ એન્ટ્રી મળી નથી</p>
        </div>
      `
      return
    }

    const grouped = {}
    filtered.forEach((d) => {
      if (!grouped[d.date]) grouped[d.date] = []
      grouped[d.date].push(d)
    })

    const dates = Object.keys(grouped).sort().reverse()

    resultsEl.innerHTML = filterHtml + dates
      .map(
        (date) => `
      <div class="mb-4">
        <div class="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-semibold mb-2">
          📅 ${formatDate(date)} · ${grouped[date].length} એન્ટ્રી
        </div>
        <div class="space-y-2">
          ${grouped[date]
            .map((d, idx) => {
              const isPending = num(d.full) !== num(d.empty)
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
                const noteText = d.note ? ` · 📝 ${d.note}` : ''
                return `
              <div class="rounded-xl p-3 border ${gpay > 0 && cash === 0 ? 'bg-blue-50 border-blue-200' : cash > 0 && gpay === 0 ? 'bg-green-50 border-green-200' : 'bg-gradient-to-r from-blue-50 to-green-50 border-blue-200'}">
                <div class="flex justify-between items-start">
                  <div class="flex-1">
                    <div class="flex items-center gap-2">
                      <span class="inline-flex items-center justify-center w-7 h-7 rounded-full bg-accent-600 text-white text-xs font-bold">#${idx + 1}</span>
                      <span class="font-semibold text-gray-800 text-sm">${d.customerName}</span>
                    </div>
                    <div class="text-xs text-gray-500 mt-0.5">⏰ ${d.time || ''} · 📍 ${d.route}${noteText}</div>
                    <div class="flex flex-wrap gap-1 mt-1">${badges}</div>
                  </div>
                  <div class="flex gap-1 ml-2">
                    <button data-edit-id="${d.id}" data-edit-customer="${d.customerId}"
                      class="elEdit px-2 py-1 rounded-lg bg-brand-50 text-brand-600 hover:bg-brand-100 text-xs btn-press">
                      ✏️
                    </button>
                    <button data-id="${d.id}" data-customer="${d.customerId}" data-full="${d.full}" data-empty="${d.empty}" data-due="${d.due}"
                      class="elDel px-2 py-1 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 text-xs btn-press">
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            `
              }

              return `
            <div class="rounded-xl p-3 border ${isPending ? 'entry-pending' : 'bg-white border-gray-200'}">
              <div class="flex justify-between items-start">
                <div class="flex-1">
                  <div class="flex items-center gap-2">
                    <span class="inline-flex items-center justify-center w-7 h-7 rounded-full bg-brand-600 text-white text-xs font-bold">#${idx + 1}</span>
                    <span class="font-semibold text-gray-800 text-sm">${d.customerName}</span>
                  </div>
                  <div class="text-xs text-gray-500 mt-0.5">⏰ ${d.time || ''} · 📍 ${d.route}</div>
                  <div class="text-xs text-gray-600 mt-1">
                    📦 ભરેલી: ${d.full} · ખાલી: ${d.empty} · ₹${d.rate}
                  </div>
                  <div class="text-xs mt-0.5">
                    💵 રોકડા: ₹${d.paid} ·
                    <span class="${num(d.due) > 0 ? 'text-warning-700 font-semibold' : 'text-gray-500'}">બાકી: ₹${d.due}</span>
                  </div>
                </div>
                <div class="flex gap-1 ml-2">
                  <button data-edit-id="${d.id}" data-edit-customer="${d.customerId}"
                    class="elEdit px-2 py-1 rounded-lg bg-brand-50 text-brand-600 hover:bg-brand-100 text-xs btn-press">
                    ✏️
                  </button>
                  <button data-id="${d.id}" data-customer="${d.customerId}" data-full="${d.full}" data-empty="${d.empty}" data-due="${d.due}"
                    class="elDel px-2 py-1 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 text-xs btn-press">
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          `
            })
            .join('')}
        </div>
      </div>
    `
      )
      .join('')

    document.querySelectorAll('.elFilter').forEach((btn) => {
      btn.addEventListener('click', () => {
        currentFilter = btn.dataset.elfilter
        render()
      })
    })

    document.querySelectorAll('.elDel').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id
        const customerId = btn.dataset.customer
        const full = num(btn.dataset.full)
        const empty = num(btn.dataset.empty)
        const due = num(btn.dataset.due)
        promptDelete(id, customerId, full, empty, due)
      })
    })

    document.querySelectorAll('.elEdit').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.editId
        const customerId = btn.dataset.editCustomer
        const delivery = deliveries.find((d) => d.id === id)
        if (delivery) promptEdit(delivery, customerId)
      })
    })
  }

  function promptDelete(id, customerId, full, empty, due) {
    const modal = document.createElement('div')
    modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 fade-in'
    modal.innerHTML = `
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 modal-in">
        <h3 class="text-lg font-bold text-gray-800 mb-2">🗑️ ડિલીટ કરવા પિન દાખલ કરો</h3>
        <p class="text-sm text-gray-500 mb-4">એન્ટ્રી ડિલીટ કરવા માટે પિન જરૂરી છે</p>
        <input id="delPin" type="password" inputmode="numeric" maxlength="4" placeholder="PIN"
          class="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-red-500 transition-colors text-gray-800 text-center text-lg tracking-widest" />
        <p id="delError" class="text-red-500 text-sm mt-2 hidden"></p>
        <div class="flex gap-2 mt-4">
          <button id="delCancel" class="flex-1 py-3 rounded-xl bg-gray-100 text-gray-700 font-semibold btn-press">રદ કરો</button>
          <button id="delConfirm" class="flex-1 py-3 rounded-xl bg-red-500 text-white font-semibold btn-press">ડિલીટ કરો</button>
        </div>
      </div>
    `
    document.body.appendChild(modal)
    const pinInput = document.getElementById('delPin')
    const errEl = document.getElementById('delError')

    document.getElementById('delCancel').addEventListener('click', () => modal.remove())
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove()
    })

    async function doDelete() {
      const pin = pinInput.value.trim()
      if (pin !== '9916') {
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
      } catch (err) {
        alert('ભૂલ: ' + err.message)
      }
    }

    document.getElementById('delConfirm').addEventListener('click', doDelete)
    pinInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') doDelete()
    })
    pinInput.focus()
  }

  function promptEdit(delivery, customerId) {
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
              <input id="editDate" type="date" value="${delivery.date || ''}"
                class="w-full px-3 py-2.5 rounded-lg border-2 border-gray-200 focus:border-brand-500 text-gray-800 text-sm" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">⏰ સમય</label>
              <input id="editTime" type="text" value="${delivery.time || ''}"
                class="w-full px-3 py-2.5 rounded-lg border-2 border-gray-200 focus:border-brand-500 text-gray-800 text-sm" />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">📍 રૂટ</label>
              <input id="editRoute" type="text" value="${delivery.route || ''}"
                class="w-full px-3 py-2.5 rounded-lg border-2 border-gray-200 focus:border-brand-500 text-gray-800 text-sm" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">👤 ગ્રાહક</label>
              <input id="editCustName" type="text" value="${delivery.customerName || ''}"
                class="w-full px-3 py-2.5 rounded-lg border-2 border-gray-200 focus:border-brand-500 text-gray-800 text-sm" />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">₹ રેટ</label>
              <input id="editRate" type="number" inputmode="numeric" value="${oldRate}"
                class="w-full px-3 py-2.5 rounded-lg border-2 border-gray-200 focus:border-brand-500 text-gray-800 text-sm" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">💰 બાકી</label>
              <div id="editDue" class="w-full px-3 py-2.5 rounded-lg bg-gray-50 border-2 border-gray-200 text-gray-700 text-sm font-semibold flex items-center">
                ₹ ${oldDue}
              </div>
            </div>
          </div>
          <div class="grid grid-cols-3 gap-3">
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">📦 ભરેલી</label>
              <input id="editFull" type="number" inputmode="numeric" value="${oldFull}"
                class="w-full px-3 py-2.5 rounded-lg border-2 border-gray-200 focus:border-brand-500 text-gray-800 text-sm text-center" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">📦 ખાલી</label>
              <input id="editEmpty" type="number" inputmode="numeric" value="${oldEmpty}"
                class="w-full px-3 py-2.5 rounded-lg border-2 border-gray-200 focus:border-brand-500 text-gray-800 text-sm text-center" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">💵 રોકડા</label>
              <input id="editPaid" type="number" inputmode="numeric" value="${oldPaid}"
                class="w-full px-3 py-2.5 rounded-lg border-2 border-gray-200 focus:border-brand-500 text-gray-800 text-sm text-center" />
            </div>
          </div>
        </div>
        <div class="flex gap-2 mt-4">
          <button id="editCancel" class="flex-1 py-3 rounded-xl bg-gray-100 text-gray-700 font-semibold btn-press">રદ કરો</button>
          <button id="editSave" class="flex-1 py-3 rounded-xl bg-brand-600 text-white font-semibold btn-press">સેવ કરો</button>
        </div>
      </div>
    `
    document.body.appendChild(modal)

    const rateInput = document.getElementById('editRate')
    const fullInput = document.getElementById('editFull')
    const emptyInput = document.getElementById('editEmpty')
    const paidInput = document.getElementById('editPaid')
    const dueDisplay = document.getElementById('editDue')

    function updateDue() {
      const rate = num(rateInput.value)
      const full = num(fullInput.value)
      const paid = num(paidInput.value)
      const due = full * rate - paid
      dueDisplay.textContent = `₹ ${due}`
      dueDisplay.className = `w-full px-3 py-2.5 rounded-lg border-2 text-sm font-semibold flex items-center ${
        due > 0 ? 'bg-warning-50 border-warning-300 text-warning-700' : 'bg-gray-50 border-gray-200 text-gray-700'
      }`
    }

    ;[rateInput, fullInput, paidInput].forEach((el) => el.addEventListener('input', updateDue))

    document.getElementById('editCancel').addEventListener('click', () => modal.remove())
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove() })

    document.getElementById('editSave').addEventListener('click', async () => {
      const newFull = num(fullInput.value)
      const newEmpty = num(emptyInput.value)
      const newPaid = num(paidInput.value)
      const newRate = num(rateInput.value)
      const newDue = newFull * newRate - newPaid

      const diffFull = newFull - oldFull
      const diffEmpty = newEmpty - oldEmpty
      const diffDue = newDue - oldDue

      try {
        await updateRecord('deliveries', delivery.id, {
          date: document.getElementById('editDate').value,
          time: document.getElementById('editTime').value,
          route: document.getElementById('editRoute').value,
          customerName: document.getElementById('editCustName').value,
          rate: newRate,
          full: newFull,
          empty: newEmpty,
          paid: newPaid,
          due: newDue,
        })

        const { customers } = getState()
        const customer = customers.find((c) => c.id === customerId)
        if (customer) {
          await updateRecord('customers', customerId, {
            pendingBottles: num(customer.pendingBottles) + (diffFull - diffEmpty),
            pendingDue: num(customer.pendingDue) + diffDue,
          })
        }

        modal.remove()
        alert('✅ એન્ટ્રી સફળતાપૂર્વક અપડેટ થઈ ગઈ!')
      } catch (err) {
        alert('ભૂલ: ' + err.message)
      }
    })
  }

  routeSelect.addEventListener('change', render)
  customerSelect.addEventListener('change', render)
  render()
}
