import { getState, setState } from '../store.js'
import { addRecord, updateRecord, deleteRecord, num, formatDate, todayStr, timeStr } from '../utils.js'

const MONTHS = ['જાન્યુઆરી', 'ફેબ્રુઆરી', 'માર્ચ', 'એપ્રિલ', 'મે', 'જૂન', 'જુલાઈ', 'ઓગસ્ટ', 'સપ્ટેમ્બર', 'ઓક્ટોબર', 'નવેમ્બર', 'ડિસેમ્બર']

export function renderVehicleExpense() {
  const { vehicles, vehicleExpenses, settings } = getState()
  const now = new Date()
  const currentMonth = String(now.getMonth() + 1).padStart(2, '0')
  const currentYear = now.getFullYear()

  const defaultVeh = vehicles.find((v) => v.isDefault) || vehicles[0]
  const defaultVehId = defaultVeh?.id || ''

  return `
    <div class="max-w-3xl mx-auto p-4 space-y-4 fade-in">
      <div class="bg-white rounded-2xl shadow-sm p-5">
        <h2 class="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span>⛽</span> વાહન ખર્ચ સંચાલન
        </h2>

        ${vehicles.length === 0 ? `
          <div class="text-center py-8 text-gray-400">
            <p class="text-4xl mb-2">🛺</p>
            <p class="text-sm">કોઈ વાહન નથી. Admin માંથી વાહન ઉમેરો.</p>
          </div>
        ` : `
          <div class="space-y-3">
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">🛺 વાહન</label>
              <select id="veVehicle"
                class="w-full px-3 py-2.5 rounded-lg border-2 border-gray-200 focus:border-brand-500 transition-colors text-gray-800 text-sm">
                ${vehicles.map((v) => `<option value="${v.id}" ${v.id === defaultVehId ? 'selected' : ''}>${v.isDefault ? '⭐ ' : ''}${v.name} (${v.fuelType || 'Petrol'})</option>`).join('')}
              </select>
            </div>

            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">📅 તારીખ</label>
              <input id="veDate" type="date" value="${todayStr()}"
                class="w-full px-3 py-2.5 rounded-lg border-2 border-gray-200 focus:border-brand-500 text-gray-800 text-sm" />
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-medium text-gray-600 mb-1">⛽ ભરતી માત્રા (L/Kg)</label>
                <input id="veFuelQty" type="number" inputmode="decimal" placeholder="0" step="0.01"
                  class="w-full px-3 py-2.5 rounded-lg border-2 border-gray-200 focus:border-brand-500 text-gray-800 text-sm text-center" />
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-600 mb-1">₹ ભાવ (/L)</label>
              <input id="veFuelRate" type="number" inputmode="decimal" placeholder="0" step="0.01"
                  class="w-full px-3 py-2.5 rounded-lg border-2 border-gray-200 focus:border-brand-500 text-gray-800 text-sm text-center" />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-medium text-gray-600 mb-1">📏 એવરેજ (km/L)</label>
                <input id="veMileage" type="number" inputmode="decimal" placeholder="0" step="0.01"
                  class="w-full px-3 py-2.5 rounded-lg border-2 border-gray-200 focus:border-brand-500 text-gray-800 text-sm text-center" />
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-600 mb-1">🛣️ કિલોમીટર</label>
                <input id="veKm" type="number" inputmode="numeric" placeholder="0"
                  class="w-full px-3 py-2.5 rounded-lg border-2 border-gray-200 focus:border-brand-500 text-gray-800 text-sm text-center" />
              </div>
            </div>

            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">📝 નોંધ (વૈકલ્પિક)</label>
              <input id="veNote" type="text" placeholder="દા.ત. ઓઈલ ચેન્જ, રિપેર, વગેરે"
                class="w-full px-3 py-2.5 rounded-lg border-2 border-gray-200 focus:border-brand-500 text-gray-800 text-sm" />
            </div>

            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">💰 અન્ય ખર્ચ (₹)</label>
              <input id="veOtherCost" type="number" inputmode="numeric" placeholder="0"
                class="w-full px-3 py-2.5 rounded-lg border-2 border-gray-200 focus:border-brand-500 text-gray-800 text-sm text-center" />
            </div>

            <button id="veSaveBtn"
              class="w-full py-3 rounded-xl bg-accent-500 text-white font-semibold btn-press text-sm shadow-md">💾 ખર્ચ સેવ કરો</button>
          </div>
        `}
      </div>

      ${vehicles.length > 0 ? `
        <div class="bg-white rounded-2xl shadow-sm p-5">
          <h3 class="font-bold text-gray-800 mb-3 flex items-center gap-2">
            <span>📊</span> સારાંશ
          </h3>
          <div class="grid grid-cols-3 gap-3">
            <div class="rounded-xl p-3 bg-brand-50 border border-brand-200 text-center">
              <div class="text-xs text-gray-600">⛽ ભરતી</div>
              <div id="sumFuelQty" class="text-lg font-bold text-brand-700">0</div>
            </div>
            <div class="rounded-xl p-3 bg-accent-50 border border-accent-200 text-center">
              <div class="text-xs text-gray-600">💰 કુલ ખર્ચ</div>
              <div id="sumTotalCost" class="text-lg font-bold text-accent-700">₹0</div>
            </div>
            <div class="rounded-xl p-3 bg-warning-50 border border-warning-200 text-center">
              <div class="text-xs text-gray-600">🛣️ કુલ KM</div>
              <div id="sumKm" class="text-lg font-bold text-warning-700">0</div>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3 mt-3">
            <div class="rounded-xl p-3 bg-gray-50 border border-gray-200 text-center">
              <div class="text-xs text-gray-600">₹/કિ.મી.</div>
              <div id="sumCostPerKm" class="text-lg font-bold text-gray-700">₹0</div>
            </div>
            <div class="rounded-xl p-3 bg-gray-50 border border-gray-200 text-center">
              <div class="text-xs text-gray-600">એવરેજ (km/L)</div>
              <div id="sumAvgMileage" class="text-lg font-bold text-gray-700">0</div>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-2xl shadow-sm p-5">
          <div class="flex items-center justify-between mb-3 flex-wrap gap-2">
            <h3 class="font-bold text-gray-800">📋 ખર્ચ હિસ્સો</h3>
            <div class="flex gap-2">
              <select id="veFilterMonth"
                class="px-2 py-1.5 rounded-lg border-2 border-gray-200 focus:border-brand-500 text-gray-800 text-xs">
                ${MONTHS.map((m, i) => `<option value="${String(i + 1).padStart(2, '0')}" ${String(i + 1).padStart(2, '0') === currentMonth ? 'selected' : ''}>${m}</option>`).join('')}
              </select>
              <input id="veFilterYear" type="number" value="${currentYear}"
                class="w-20 px-2 py-1.5 rounded-lg border-2 border-gray-200 focus:border-brand-500 text-gray-800 text-xs text-center" />
            </div>
          </div>
          <div id="veHistory" class="space-y-2"></div>
        </div>
      ` : ''}
    </div>
  `
}

export function initVehicleExpense() {
  const { vehicles, vehicleExpenses } = getState()
  if (vehicles.length === 0) return

  const vehicleSelect = document.getElementById('veVehicle')
  const dateInput = document.getElementById('veDate')
  const fuelQtyInput = document.getElementById('veFuelQty')
  const fuelRateInput = document.getElementById('veFuelRate')
  const mileageInput = document.getElementById('veMileage')
  const kmInput = document.getElementById('veKm')
  const noteInput = document.getElementById('veNote')
  const otherCostInput = document.getElementById('veOtherCost')
  const saveBtn = document.getElementById('veSaveBtn')
  const historyEl = document.getElementById('veHistory')
  const filterMonth = document.getElementById('veFilterMonth')
  const filterYear = document.getElementById('veFilterYear')

  function fillDefaults() {
    const veh = vehicles.find((v) => v.id === vehicleSelect.value)
    if (!veh) return
    fuelRateInput.value = veh.defaultFuelRate || ''
    mileageInput.value = veh.defaultMileage || ''
  }
  fillDefaults()
  vehicleSelect.addEventListener('change', fillDefaults)

  function getFiltered() {
    const vehId = vehicleSelect.value
    const prefix = `${filterYear.value.trim()}-${filterMonth.value}`
    return vehicleExpenses
      .filter((e) => e.vehicleId === vehId && (e.date || '').startsWith(prefix))
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
  }

  function renderSummary() {
    const items = getFiltered()
    const totalFuel = items.reduce((s, e) => s + num(e.fuelQty), 0)
    const totalCost = items.reduce((s, e) => s + num(e.fuelCost) + num(e.otherCost), 0)
    const totalKm = items.reduce((s, e) => s + num(e.km), 0)
    const costPerKm = totalKm > 0 ? (totalCost / totalKm).toFixed(2) : '0'
    const avgMileage = totalFuel > 0 && totalKm > 0 ? (totalKm / totalFuel).toFixed(1) : '0'

    const sumFuelQty = document.getElementById('sumFuelQty')
    const sumTotalCost = document.getElementById('sumTotalCost')
    const sumKm = document.getElementById('sumKm')
    const sumCostPerKm = document.getElementById('sumCostPerKm')
    const sumAvgMileage = document.getElementById('sumAvgMileage')
    if (sumFuelQty) sumFuelQty.textContent = totalFuel.toFixed(1)
    if (sumTotalCost) sumTotalCost.textContent = `₹${totalCost}`
    if (sumKm) sumKm.textContent = totalKm
    if (sumCostPerKm) sumCostPerKm.textContent = `₹${costPerKm}`
    if (sumAvgMileage) sumAvgMileage.textContent = avgMileage
  }

  function renderHistory() {
    const items = getFiltered()
    if (items.length === 0) {
      historyEl.innerHTML = '<p class="text-center text-gray-400 text-sm py-4">આ મહિનામાં કોઈ ખર્ચ નથી</p>'
      return
    }
    historyEl.innerHTML = items.map((e) => {
      const fuelCost = num(e.fuelCost)
      const other = num(e.otherCost)
      const total = fuelCost + other
      const fuelInfo = num(e.fuelQty) > 0 ? `${num(e.fuelQty).toFixed(1)}L @ ₹${num(e.fuelRate)}` : ''
      const kmInfo = num(e.km) > 0 ? `${num(e.km)} km` : ''
      return `
        <div class="flex items-center justify-between rounded-lg p-3 bg-gray-50 border border-gray-200">
          <div class="flex-1 min-w-0">
            <div class="text-sm font-semibold text-gray-800">${formatDate(e.date)}</div>
            <div class="text-xs text-gray-500 mt-0.5">
              ${fuelInfo ? `⛽ ${fuelInfo}` : ''}${kmInfo ? ` · 🛣️ ${kmInfo}` : ''}${e.note ? ` · 📝 ${e.note}` : ''}
            </div>
            ${other > 0 ? `<div class="text-xs text-gray-500">🔧 અન્ય ખર્ચ: ₹${other}</div>` : ''}
          </div>
          <div class="text-right ml-2">
            <div class="text-sm font-bold text-accent-700">₹${total}</div>
            <div class="flex gap-1 mt-1">
              <button data-ve-edit="${e.id}" class="veEdit px-2 py-1 rounded-lg bg-brand-50 text-brand-600 text-xs btn-press">✏️</button>
              <button data-ve-del="${e.id}" class="veDel px-2 py-1 rounded-lg bg-red-50 text-red-600 text-xs btn-press">🗑️</button>
            </div>
          </div>
        </div>
      `
    }).join('')

    document.querySelectorAll('.veDel').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (!confirm('ખર્ચ ડિલીટ કરવો છે?')) return
        try {
          await deleteRecord('vehicle_expenses', btn.dataset.veDel)
          alert('✅ ખર્ચ ડિલીટ થયું!')
        } catch (err) { alert('ભૂલ: ' + err.message) }
      })
    })

    document.querySelectorAll('.veEdit').forEach((btn) => {
      btn.addEventListener('click', () => {
        const items = getFiltered()
        const exp = items.find((e) => e.id === btn.dataset.veEdit)
        if (!exp) return
        promptEditExpense(exp)
      })
    })
  }

  function renderAll() {
    renderSummary()
    renderHistory()
  }

  if (saveBtn) {
    saveBtn.addEventListener('click', async () => {
      const vehicleId = vehicleSelect.value
      const veh = vehicles.find((v) => v.id === vehicleId)
      const date = dateInput.value
      const fuelQty = num(fuelQtyInput.value)
      const fuelRate = num(fuelRateInput.value)
      const mileage = num(mileageInput.value)
      const km = num(kmInput.value)
      const note = noteInput.value.trim()
      const otherCost = num(otherCostInput.value)
      const fuelCost = fuelQty * fuelRate

      if (!date) { alert('તારીખ પસંદ કરો!'); return }
      if (fuelQty <= 0 && otherCost <= 0) { alert('ઓછામાં ઓછું એક ખર્ચ દાખલ કરો!'); return }

      try {
        saveBtn.disabled = true
        saveBtn.textContent = 'સેવ થઈ રહ્યું છે...'

        const record = {
          date,
          time: timeStr(),
          vehicleId,
          vehicleName: veh?.name || '',
          fuelType: veh?.fuelType || 'Petrol',
          fuelQty,
          fuelRate,
          fuelCost,
          mileage,
          km,
          otherCost,
          note,
        }

        const { vehicleExpenses } = getState()
        const tempId = 'temp_' + Date.now()
        setState({ vehicleExpenses: [{ id: tempId, ...record }, ...vehicleExpenses] })

        await addRecord('vehicle_expenses', record)

        fuelQtyInput.value = ''
        kmInput.value = ''
        noteInput.value = ''
        otherCostInput.value = ''

        saveBtn.disabled = false
        saveBtn.textContent = '💾 ખર્ચ સેવ કરો'
        alert('✅ ખર્ચ સેવ થયો!')
      } catch (err) {
        alert('ભૂલ: ' + err.message)
        saveBtn.disabled = false
        saveBtn.textContent = '💾 ખર્ચ સેવ કરો'
      }
    })
  }

  filterMonth.addEventListener('change', renderAll)
  filterYear.addEventListener('input', renderAll)
  vehicleSelect.addEventListener('change', renderAll)

  renderAll()
}

function promptEditExpense(exp) {
  const modal = document.createElement('div')
  modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 fade-in'
  modal.innerHTML = `
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 modal-in">
      <h3 class="text-lg font-bold text-gray-800 mb-4">✏️ ખર્ચ સંપાદન</h3>
      <div class="space-y-3">
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">📅 તારીખ</label>
          <input id="veEditDate" type="date" value="${exp.date || todayStr()}"
            class="w-full px-3 py-2.5 rounded-lg border-2 border-gray-200 focus:border-brand-500 text-gray-800 text-sm" />
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">⛽ ભરતી (L)</label>
            <input id="veEditQty" type="number" step="0.01" value="${num(exp.fuelQty)}"
              class="w-full px-3 py-2.5 rounded-lg border-2 border-gray-200 focus:border-brand-500 text-gray-800 text-sm text-center" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">₹ ભાવ</label>
            <input id="veEditRate" type="number" step="0.01" value="${num(exp.fuelRate)}"
              class="w-full px-3 py-2.5 rounded-lg border-2 border-gray-200 focus:border-brand-500 text-gray-800 text-sm text-center" />
          </div>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">🛣️ કિ.મી.</label>
            <input id="veEditKm" type="number" value="${num(exp.km)}"
              class="w-full px-3 py-2.5 rounded-lg border-2 border-gray-200 focus:border-brand-500 text-gray-800 text-sm text-center" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">🔧 અન્ય ખર્ચ</label>
            <input id="veEditOther" type="number" value="${num(exp.otherCost)}"
              class="w-full px-3 py-2.5 rounded-lg border-2 border-gray-200 focus:border-brand-500 text-gray-800 text-sm text-center" />
          </div>
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">📝 નોંધ</label>
          <input id="veEditNote" type="text" value="${exp.note || ''}"
            class="w-full px-3 py-2.5 rounded-lg border-2 border-gray-200 focus:border-brand-500 text-gray-800 text-sm" />
        </div>
      </div>
      <div class="flex gap-2 mt-4">
        <button id="veEditCancel" class="flex-1 py-3 rounded-xl bg-gray-100 text-gray-700 font-semibold btn-press">રદ</button>
        <button id="veEditSave" class="flex-1 py-3 rounded-xl bg-brand-600 text-white font-semibold btn-press">સેવ</button>
      </div>
    </div>
  `
  document.body.appendChild(modal)

  document.getElementById('veEditCancel').addEventListener('click', () => modal.remove())
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove() })

  document.getElementById('veEditSave').addEventListener('click', async () => {
    const date = document.getElementById('veEditDate').value
    const fuelQty = num(document.getElementById('veEditQty').value)
    const fuelRate = num(document.getElementById('veEditRate').value)
    const km = num(document.getElementById('veEditKm').value)
    const otherCost = num(document.getElementById('veEditOther').value)
    const note = document.getElementById('veEditNote').value.trim()
    const fuelCost = fuelQty * fuelRate

    try {
      const { vehicleExpenses } = getState()
      setState({
        vehicleExpenses: vehicleExpenses.map((e) =>
          e.id === exp.id ? { ...e, date, fuelQty, fuelRate, fuelCost, km, otherCost, note } : e
        )
      })
      await updateRecord('vehicle_expenses', exp.id, { date, fuelQty, fuelRate, fuelCost, km, otherCost, note })
      modal.remove()
      alert('✅ ખર્ચ અપડેટ થયો!')
    } catch (err) { alert('ભૂલ: ' + err.message) }
  })
}
