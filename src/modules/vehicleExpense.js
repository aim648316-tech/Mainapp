import { getState, setState } from '../store.js'
import { addRecord, updateRecord, deleteRecord, num, formatDate, todayStr, timeStr } from '../utils.js'

const DELETE_PIN = '1234'
const MONTHS = ['જાન્યુઆરી', 'ફેબ્રુઆરી', 'માર્ચ', 'એપ્રિલ', 'મે', 'જૂન', 'જુલાઈ', 'ઓગસ્ટ', 'સપ્ટેમ્બર', 'ઓક્ટોબર', 'નવેમ્બર', 'ડિસેમ્બર']

function r2(val) { return Math.round(num(val) * 100) / 100 }

export function renderVehicleExpense() {
  const { vehicles, settings } = getState()
  const now = new Date()
  const currentMonth = String(now.getMonth() + 1).padStart(2, '0')
  const currentYear = now.getFullYear()

  const defaultVeh = vehicles.find((v) => v.isDefault) || vehicles[0]
  const defaultVehId = defaultVeh?.id || ''

  const vehTypes = [
    { id: 'all', label: '🚗 બધા' },
    { id: 'bike', label: '🏍️ બાઈક' },
    { id: 'rickshaw', label: '🛺 રિક્ષા' },
    { id: 'other', label: '🚙 અન્ય' },
  ]

  function vehTypeIcon(v) {
    const n = (v.name || '').toLowerCase()
    if (n.includes('બાઈ') || n.includes('bike') || n.includes('સ્કૂટ')) return '🏍️'
    if (n.includes('રિક્ષ') || n.includes('auto') || n.includes('rickshaw') || n.includes('ઓટો')) return '🛺'
    return '🚙'
  }

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

            <!-- 3-way calculator mode tabs -->
            <div class="flex gap-1 bg-gray-100 rounded-lg p-1">
              <button data-calc-mode="average" id="calcModeAvg" class="flex-1 py-2 rounded-md text-xs font-semibold transition-colors bg-brand-600 text-white">📏 એવરેજ શોધો</button>
              <button data-calc-mode="distance" id="calcModeDist" class="flex-1 py-2 rounded-md text-xs font-semibold transition-colors text-gray-600">🛣️ કિલોમીટર શોધો</button>
              <button data-calc-mode="cost" id="calcModeCost" class="flex-1 py-2 rounded-md text-xs font-semibold transition-colors text-gray-600">💰 ખર્ચ શોધો</button>
            </div>

            <!-- Bi-directional fuel inputs -->
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
                <label class="block text-xs font-medium text-gray-600 mb-1">💰 ફ્યુઅલ રકમ (₹)</label>
                <input id="veFuelAmount" type="number" inputmode="decimal" placeholder="0" step="0.01"
                  class="w-full px-3 py-2.5 rounded-lg border-2 border-gray-200 focus:border-brand-500 text-gray-800 text-sm text-center" />
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-600 mb-1">📏 એવરેજ (km/L)</label>
                <input id="veMileage" type="number" inputmode="decimal" placeholder="0" step="0.01"
                  class="w-full px-3 py-2.5 rounded-lg border-2 border-gray-200 focus:border-brand-500 text-gray-800 text-sm text-center" />
              </div>
            </div>

            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">🛣️ કિલોમીટર</label>
              <input id="veKm" type="number" inputmode="numeric" placeholder="0"
                class="w-full px-3 py-2.5 rounded-lg border-2 border-gray-200 focus:border-brand-500 text-gray-800 text-sm text-center" />
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

            <!-- Calculator result display -->
            <div id="calcResult" class="rounded-lg p-3 bg-brand-50 border border-brand-200 text-center text-sm text-brand-700 font-semibold hidden"></div>

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
          <!-- Vehicle filter tabs -->
          <div class="flex gap-1 mb-3 flex-wrap">
            ${vehTypes.map((t) => `
              <button data-veh-type="${t.id}" class="vehTypeTab px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${t.id === 'all' ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600'}">${t.label}</button>
            `).join('')}
          </div>
          <div id="veHistory" class="space-y-2"></div>
        </div>
      ` : ''}
    </div>
  `
}

export function initVehicleExpense() {
  const { vehicles } = getState()
  if (vehicles.length === 0) return

  const vehicleSelect = document.getElementById('veVehicle')
  const dateInput = document.getElementById('veDate')
  const fuelQtyInput = document.getElementById('veFuelQty')
  const fuelRateInput = document.getElementById('veFuelRate')
  const fuelAmountInput = document.getElementById('veFuelAmount')
  const mileageInput = document.getElementById('veMileage')
  const kmInput = document.getElementById('veKm')
  const noteInput = document.getElementById('veNote')
  const otherCostInput = document.getElementById('veOtherCost')
  const saveBtn = document.getElementById('veSaveBtn')
  const historyEl = document.getElementById('veHistory')
  const filterMonth = document.getElementById('veFilterMonth')
  const filterYear = document.getElementById('veFilterYear')
  const calcResultEl = document.getElementById('calcResult')

  let calcMode = 'average'
  let activeTypeFilter = 'all'

  function fillDefaults() {
    const veh = vehicles.find((v) => v.id === vehicleSelect.value)
    if (!veh) return
    fuelRateInput.value = veh.defaultFuelRate || ''
    mileageInput.value = veh.defaultMileage || ''
    updateCalcResult()
  }
  fillDefaults()

  // Bi-directional: Amount <-> Volume
  fuelQtyInput.addEventListener('input', () => {
    const qty = num(fuelQtyInput.value)
    const rate = num(fuelRateInput.value)
    if (rate > 0) {
      fuelAmountInput.value = r2(qty * rate)
    }
    updateCalcResult()
  })

  fuelRateInput.addEventListener('input', () => {
    const qty = num(fuelQtyInput.value)
    const rate = num(fuelRateInput.value)
    if (qty > 0) {
      fuelAmountInput.value = r2(qty * rate)
    }
    updateCalcResult()
  })

  fuelAmountInput.addEventListener('input', () => {
    const amount = num(fuelAmountInput.value)
    const rate = num(fuelRateInput.value)
    if (rate > 0) {
      fuelQtyInput.value = r2(amount / rate)
    }
    updateCalcResult()
  })

  mileageInput.addEventListener('input', updateCalcResult)
  kmInput.addEventListener('input', updateCalcResult)

  vehicleSelect.addEventListener('change', () => { fillDefaults(); renderAll() })

  // 3-way calculator mode tabs
  function updateCalcModeButtons() {
    document.querySelectorAll('[data-calc-mode]').forEach((btn) => {
      if (btn.dataset.calcMode === calcMode) {
        btn.className = 'flex-1 py-2 rounded-md text-xs font-semibold transition-colors bg-brand-600 text-white'
      } else {
        btn.className = 'flex-1 py-2 rounded-md text-xs font-semibold transition-colors text-gray-600'
      }
    })
  }

  document.querySelectorAll('[data-calc-mode]').forEach((btn) => {
    btn.addEventListener('click', () => {
      calcMode = btn.dataset.calcMode
      updateCalcModeButtons()
      updateCalcResult()
    })
  })

  function updateCalcResult() {
    const fuelQty = num(fuelQtyInput.value)
    const fuelRate = num(fuelRateInput.value)
    const fuelAmount = num(fuelAmountInput.value)
    const mileage = num(mileageInput.value)
    const km = num(kmInput.value)

    if (calcResultEl) calcResultEl.classList.add('hidden')

    if (calcMode === 'average') {
      // Find Average: Fuel + Distance -> Average
      const dist = km
      if (fuelQty > 0 && dist > 0) {
        const avg = r2(dist / fuelQty)
        if (calcResultEl) {
          calcResultEl.textContent = `📏 એવરેજ: ${avg} km/L (${dist} km ÷ ${fuelQty} L)`
          calcResultEl.classList.remove('hidden')
        }
      }
    } else if (calcMode === 'distance') {
      // Find Distance: Fuel + Average -> Distance
      if (fuelQty > 0 && mileage > 0) {
        const dist = r2(fuelQty * mileage)
        if (calcResultEl) {
          calcResultEl.textContent = `🛣️ અનુમાનિત કિલોમીટર: ${dist} km (${fuelQty} L × ${mileage} km/L)`
          calcResultEl.classList.remove('hidden')
        }
      }
    } else if (calcMode === 'cost') {
      // Find Cost: Distance + Average + Rate -> Cost
      const dist = km
      if (dist > 0 && mileage > 0 && fuelRate > 0) {
        const fuelNeeded = r2(dist / mileage)
        const cost = r2(fuelNeeded * fuelRate)
        if (calcResultEl) {
          calcResultEl.textContent = `💰 અનુમાનિત ખર્ચ: ₹${cost} (${dist} km ÷ ${mileage} km/L × ₹${fuelRate}/L)`
          calcResultEl.classList.remove('hidden')
        }
      }
    }
  }

  function vehTypeMatches(v, typeFilter) {
    if (typeFilter === 'all') return true
    const n = (v.name || '').toLowerCase()
    if (typeFilter === 'bike') return n.includes('બાઈ') || n.includes('bike') || n.includes('સ્કૂટ')
    if (typeFilter === 'rickshaw') return n.includes('રિક્ષ') || n.includes('auto') || n.includes('rickshaw') || n.includes('ઓટો')
    if (typeFilter === 'other') {
      const isBike = n.includes('બાઈ') || n.includes('bike') || n.includes('સ્કૂટ')
      const isRick = n.includes('રિક્ષ') || n.includes('auto') || n.includes('rickshaw') || n.includes('ઓટો')
      return !isBike && !isRick
    }
    return false
  }

  function getFilteredVehicles() {
    return vehicles.filter((v) => vehTypeMatches(v, activeTypeFilter))
  }

  function getFiltered() {
    const vehIds = getFilteredVehicles().map((v) => v.id)
    const prefix = `${filterYear.value.trim()}-${filterMonth.value}`
    const { vehicleExpenses } = getState()
    return vehicleExpenses
      .filter((e) => vehIds.includes(e.vehicleId) && (e.date || '').startsWith(prefix))
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
  }

  function renderSummary() {
    const items = getFiltered()
    const totalFuel = items.reduce((s, e) => s + num(e.fuelQty), 0)
    const totalCost = items.reduce((s, e) => s + num(e.fuelCost) + num(e.otherCost), 0)
    const totalKm = items.reduce((s, e) => s + num(e.km), 0)
    const costPerKm = totalKm > 0 ? r2(totalCost / totalKm) : 0
    const avgMileage = totalFuel > 0 && totalKm > 0 ? r2(totalKm / totalFuel) : 0

    const sumFuelQty = document.getElementById('sumFuelQty')
    const sumTotalCost = document.getElementById('sumTotalCost')
    const sumKm = document.getElementById('sumKm')
    const sumCostPerKm = document.getElementById('sumCostPerKm')
    const sumAvgMileage = document.getElementById('sumAvgMileage')
    if (sumFuelQty) sumFuelQty.textContent = r2(totalFuel).toFixed(1)
    if (sumTotalCost) sumTotalCost.textContent = `₹${r2(totalCost)}`
    if (sumKm) sumKm.textContent = r2(totalKm)
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
      const total = r2(fuelCost + other)
      const fuelInfo = num(e.fuelQty) > 0 ? `${r2(num(e.fuelQty))}L @ ₹${r2(num(e.fuelRate))}` : ''
      const kmInfo = num(e.km) > 0 ? `${r2(num(e.km))} km` : ''
      const vehName = e.vehicleName || ''
      return `
        <div class="flex items-center justify-between rounded-lg p-3 bg-gray-50 border border-gray-200">
          <div class="flex-1 min-w-0">
            <div class="text-sm font-semibold text-gray-800">${formatDate(e.date)}${vehName ? ` · ${vehName}` : ''}</div>
            <div class="text-xs text-gray-500 mt-0.5">
              ${fuelInfo ? `⛽ ${fuelInfo}` : ''}${kmInfo ? ` · 🛣️ ${kmInfo}` : ''}${e.note ? ` · 📝 ${e.note}` : ''}
            </div>
            ${other > 0 ? `<div class="text-xs text-gray-500">🔧 અન્ય ખર્ચ: ₹${r2(other)}</div>` : ''}
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
      btn.addEventListener('click', () => {
        promptDeleteExpense(btn.dataset.veDel)
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

  // Vehicle type filter tabs
  document.querySelectorAll('.vehTypeTab').forEach((btn) => {
    btn.addEventListener('click', () => {
      activeTypeFilter = btn.dataset.vehType
      document.querySelectorAll('.vehTypeTab').forEach((b) => {
        b.className = `vehTypeTab px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${b.dataset.vehType === activeTypeFilter ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600'}`
      })
      // Update vehicle dropdown to filtered list
      const filteredVehs = getFilteredVehicles()
      vehicleSelect.innerHTML = filteredVehs.map((v) => `<option value="${v.id}">${v.isDefault ? '⭐ ' : ''}${v.name} (${v.fuelType || 'Petrol'})</option>`).join('')
      if (filteredVehs.length > 0) {
        fillDefaults()
      }
      renderAll()
    })
  })

  if (saveBtn) {
    saveBtn.addEventListener('click', async () => {
      const vehicleId = vehicleSelect.value
      const veh = vehicles.find((v) => v.id === vehicleId)
      const date = dateInput.value
      const fuelQty = num(fuelQtyInput.value)
      const fuelRate = num(fuelRateInput.value)
      const fuelAmount = num(fuelAmountInput.value)
      const mileage = num(mileageInput.value)
      const km = num(kmInput.value)
      const note = noteInput.value.trim()
      const otherCost = num(otherCostInput.value)

      // Derive: if amount given but qty not, compute qty from amount/rate
      let finalQty = fuelQty
      let finalRate = fuelRate
      let finalCost = 0
      if (fuelQty > 0 && fuelRate > 0) {
        finalCost = r2(fuelQty * fuelRate)
      } else if (fuelAmount > 0 && fuelRate > 0) {
        finalQty = r2(fuelAmount / fuelRate)
        finalCost = r2(fuelAmount)
      } else if (fuelQty > 0 && fuelAmount > 0) {
        finalRate = r2(fuelAmount / fuelQty)
        finalCost = r2(fuelAmount)
      }

      if (!date) { alert('તારીખ પસંદ કરો!'); return }
      if (finalQty <= 0 && otherCost <= 0 && fuelAmount <= 0) { alert('ઓછામાં ઓછું એક ખર્ચ દાખલ કરો!'); return }

      try {
        saveBtn.disabled = true
        saveBtn.textContent = 'સેવ થઈ રહ્યું છે...'

        const record = {
          date,
          time: timeStr(),
          vehicleId,
          vehicleName: veh?.name || '',
          fuelType: veh?.fuelType || 'Petrol',
          fuelQty: r2(finalQty),
          fuelRate: r2(finalRate),
          fuelCost: r2(finalCost),
          mileage: r2(mileage),
          km: r2(km),
          otherCost: r2(otherCost),
          note,
        }

        const { vehicleExpenses } = getState()
        const tempId = 'temp_' + Date.now()
        setState({ vehicleExpenses: [{ id: tempId, ...record }, ...vehicleExpenses] })

        await addRecord('vehicle_expenses', record)

        fuelQtyInput.value = ''
        fuelAmountInput.value = ''
        kmInput.value = ''
        noteInput.value = ''
        otherCostInput.value = ''
        if (calcResultEl) calcResultEl.classList.add('hidden')

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

  renderAll()
}

function promptDeleteExpense(id) {
  const modal = document.createElement('div')
  modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 fade-in'
  modal.innerHTML = `
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 modal-in">
      <h3 class="text-lg font-bold text-gray-800 mb-2">🗑️ ખર્ચ ડિલીટ કરવા PIN દાખલ કરો</h3>
      <p class="text-sm text-gray-500 mb-4">ખર્ચ ડિલીટ કરવા માટે PIN જરૂરી છે</p>
      <input id="veDelPin" type="password" inputmode="numeric" maxlength="4" placeholder="PIN"
        class="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-red-500 text-gray-800 text-center text-lg tracking-widest" />
      <p id="veDelErr" class="text-red-500 text-sm mt-2 hidden"></p>
      <div class="flex gap-2 mt-4">
        <button id="veDelCancel" class="flex-1 py-3 rounded-xl bg-gray-100 text-gray-700 font-semibold btn-press">રદ કરો</button>
        <button id="veDelConfirm" class="flex-1 py-3 rounded-xl bg-red-500 text-white font-semibold btn-press">ડિલીટ કરો</button>
      </div>
    </div>
  `
  document.body.appendChild(modal)
  const pinInput = document.getElementById('veDelPin')
  const errEl = document.getElementById('veDelErr')

  document.getElementById('veDelCancel').addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); modal.remove() })
  modal.addEventListener('click', (e) => { if (e.target === modal) { e.preventDefault(); e.stopPropagation(); modal.remove() } })

  async function doDelete() {
    if (pinInput.value.trim() !== DELETE_PIN) {
      errEl.textContent = 'ખોટો PIN!'
      errEl.classList.remove('hidden')
      pinInput.value = ''
      return
    }
    try {
      await deleteRecord('vehicle_expenses', id)
      modal.remove()
      alert('✅ ખર્ચ ડિલીટ થયું!')
    } catch (err) { alert('ભૂલ: ' + err.message) }
  }

  document.getElementById('veDelConfirm').addEventListener('click', doDelete)
  pinInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') doDelete() })
  pinInput.focus()
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

  document.getElementById('veEditCancel').addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); modal.remove() })
  modal.addEventListener('click', (e) => { if (e.target === modal) { e.preventDefault(); e.stopPropagation(); modal.remove() } })

  document.getElementById('veEditSave').addEventListener('click', async () => {
    const date = document.getElementById('veEditDate').value
    const fuelQty = num(document.getElementById('veEditQty').value)
    const fuelRate = num(document.getElementById('veEditRate').value)
    const km = num(document.getElementById('veEditKm').value)
    const otherCost = num(document.getElementById('veEditOther').value)
    const note = document.getElementById('veEditNote').value.trim()
    const fuelCost = Math.round(fuelQty * fuelRate * 100) / 100

    try {
      const { vehicleExpenses } = getState()
      setState({
        vehicleExpenses: vehicleExpenses.map((e) =>
          e.id === exp.id ? { ...e, date, fuelQty: r2(fuelQty), fuelRate: r2(fuelRate), fuelCost: r2(fuelCost), km: r2(km), otherCost: r2(otherCost), note } : e
        )
      })
      await updateRecord('vehicle_expenses', exp.id, { date, fuelQty: r2(fuelQty), fuelRate: r2(fuelRate), fuelCost: r2(fuelCost), km: r2(km), otherCost: r2(otherCost), note })
      modal.remove()
      alert('✅ ખર્ચ અપડેટ થયો!')
    } catch (err) { alert('ભૂલ: ' + err.message) }
  })
}
