import { getState } from '../store.js'
import { num, todayStr, formatDate, Timestamp, fetchSettings, saveSettings } from '../utils.js'

export function renderVanStock() {
  return `
    <div class="max-w-3xl mx-auto p-4 space-y-4 fade-in">
      <div class="bg-white rounded-2xl shadow-sm p-5">
        <h2 class="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span>🚚</span> ટેમ્પો સ્ટોક ટ્રેકર
        </h2>
        <div class="space-y-4">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">📅 તારીખ</label>
              <input id="vsDate" type="date"
                class="w-full px-3 py-2.5 rounded-lg border-2 border-gray-200 focus:border-brand-500 transition-colors text-gray-800 text-sm"
                value="${todayStr()}" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">📦 સવારના ફેરાની ભરેલી બોટલ</label>
              <input id="vsLoaded" type="number" inputmode="numeric" placeholder="0"
                class="w-full px-3 py-2.5 rounded-lg border-2 border-gray-200 focus:border-brand-500 transition-colors text-gray-800 text-sm text-center" />
            </div>
          </div>
          <button id="vsSave"
            class="w-full py-3.5 rounded-xl bg-gradient-to-r from-brand-500 to-brand-700 text-white font-semibold shadow-lg btn-press hover:shadow-xl transition-all">
            💾 સવારની ભરેલી સેવ કરો
          </button>
        </div>
        <div id="vsResults" class="mt-4"></div>
      </div>
    </div>
  `
}

export function initVanStock() {
  const dateInput = document.getElementById('vsDate')
  const loadedInput = document.getElementById('vsLoaded')
  const saveBtn = document.getElementById('vsSave')
  const resultsEl = document.getElementById('vsResults')

  let stockMap = {}

  async function loadStock() {
    const settings = await fetchSettings()
    stockMap = settings.vanStock || {}
    applyStockToInput()
    render()
  }

  function applyStockToInput() {
    const date = dateInput.value
    loadedInput.value = stockMap[date] !== undefined ? stockMap[date] : ''
  }

  function render() {
    const { deliveries } = getState()
    const date = dateInput.value
    const loaded = num(loadedInput.value)

    if (!date) {
      resultsEl.innerHTML = '<p class="text-center text-gray-400 text-sm py-4">તારીખ પસંદ કરો</p>'
      return
    }

    const todayDeliveries = deliveries
      .filter((d) => d.date === date)
      .sort((a, b) => {
        const ta = a.createdAt instanceof Timestamp ? a.createdAt.toMillis() : 0
        const tb = b.createdAt instanceof Timestamp ? b.createdAt.toMillis() : 0
        return ta - tb
      })

    const totalFull = todayDeliveries.reduce((s, d) => s + num(d.full), 0)
    const totalEmpty = todayDeliveries.reduce((s, d) => s + num(d.empty), 0)
    const totalPaid = todayDeliveries.reduce((s, d) => s + num(d.paid), 0)

    const remainingFull = loaded - totalFull
    const totalInTempo = remainingFull + totalEmpty
    const discrepancy = loaded - totalInTempo

    const cards = [
      { label: 'સવારની ભરેલી', value: loaded, icon: '📦', color: 'brand' },
      { label: 'ડિલિવરી કરેલી ભરેલી', value: totalFull, icon: '📤', color: 'accent' },
      { label: 'વાહનમાં બાકી ભરેલી', value: remainingFull, icon: '🚚', color: remainingFull < 0 ? 'warning' : 'brand' },
      { label: 'વાહનમાં જમા ખાલી', value: totalEmpty, icon: '📥', color: 'warning' },
      { label: 'કુલ ટેમ્પોમાં બોટલો', value: totalInTempo, icon: '🧮', color: 'brand' },
      { label: 'રોકડા', value: `₹${totalPaid}`, icon: '💵', color: 'accent' },
    ]

    let reconHtml = ''
    if (loaded > 0) {
      const isBalanced = discrepancy === 0
      reconHtml = `
        <div class="rounded-xl p-4 ${isBalanced ? 'bg-green-50 border border-green-200' : 'bg-warning-50 border border-warning-300'} mt-2">
          <div class="flex items-center gap-2">
            <span class="text-2xl">${isBalanced ? '✅' : '⚠️'}</span>
            <div>
              <div class="text-sm font-bold ${isBalanced ? 'text-green-700' : 'text-warning-700'}">
                ${isBalanced ? 'ગણતરી બરાબર છે!' : `ગણતરીમાં તફાવત છે! ${discrepancy > 0 ? `${discrepancy} ખાલી બોટલ હજુ ગ્રાહક પાસે બાકી છે.` : `${Math.abs(discrepancy)} વધારાની બોટલ છે.`}`}
              </div>
              <div class="text-xs text-gray-600 mt-0.5">
                કુલ ${totalInTempo} બોટલ (ભરેલી ${remainingFull} + ખાલી ${totalEmpty}) vs સવારની ${loaded}
              </div>
            </div>
          </div>
        </div>
      `
    }

    const pendingCustomers = []
    const returnedCustomers = []
    todayDeliveries.forEach((d) => {
      const dfull = num(d.full)
      const dempty = num(d.empty)
      if (dfull > dempty) {
        pendingCustomers.push({ name: d.customerName, route: d.route, count: dfull - dempty })
      }
      if (dempty > dfull) {
        returnedCustomers.push({ name: d.customerName, route: d.route, count: dempty - dfull })
      }
    })

    let statusHtml = ''
    if (todayDeliveries.length === 0) {
      statusHtml = '<div class="mt-4 text-center text-gray-400 text-sm py-4">આજે કોઈ ડિલિવરી નથી</div>'
    } else {
      statusHtml = `
        <div class="mt-4 space-y-4">
          <div>
            <h3 class="text-sm font-bold text-warning-700 mb-2 flex items-center gap-1">⚠️ ખાલી બોટલ બાકી રાખનાર ગ્રાહકો</h3>
            <div class="space-y-2">
              ${pendingCustomers.length === 0
                ? '<p class="text-center text-gray-400 text-sm py-3">બધા ગ્રાહકોએ ખાલી બોટલ પરત કરી છે ✅</p>'
                : pendingCustomers.map((c) => `
                  <div class="rounded-lg p-3 bg-warning-50 border border-warning-300">
                    <div class="flex justify-between items-center">
                      <div>
                        <div class="text-sm font-semibold text-warning-900">${c.name}</div>
                        <div class="text-xs text-warning-700">📍 ${c.route}</div>
                      </div>
                      <div class="text-sm font-bold text-warning-800 bg-warning-100 px-2.5 py-1 rounded-md">📦 ${c.count} બાકી</div>
                    </div>
                  </div>
                `).join('')
              }
            </div>
          </div>
          <div>
            <h3 class="text-sm font-bold text-emerald-700 mb-2 flex items-center gap-1">✅ વધારાની ખાલી બોટલ જમા આપનાર ગ્રાહકો</h3>
            <div class="space-y-2">
              ${returnedCustomers.length === 0
                ? '<p class="text-center text-gray-400 text-sm py-3">આજે કોઈએ વધારાની ખાલી બોટલ જમા કરી નથી</p>'
                : returnedCustomers.map((c) => `
                  <div class="rounded-lg p-3 bg-emerald-50 border border-emerald-300">
                    <div class="flex justify-between items-center">
                      <div>
                        <div class="text-sm font-semibold text-emerald-900">${c.name}</div>
                        <div class="text-xs text-emerald-700">📍 ${c.route}</div>
                      </div>
                      <div class="text-sm font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-md">📦 +${c.count} જમા</div>
                    </div>
                  </div>
                `).join('')
              }
            </div>
          </div>
        </div>
      `
    }

    resultsEl.innerHTML = `
      <div class="grid grid-cols-2 gap-3 mb-3">
        ${cards.map((c) => `
          <div class="rounded-xl p-3 bg-${c.color}-50 border border-${c.color}-200">
            <div class="text-xs text-gray-600">${c.icon} ${c.label}</div>
            <div class="text-xl font-bold text-${c.color}-700">${c.value}</div>
          </div>
        `).join('')}
      </div>
      ${reconHtml}
      ${statusHtml}
    `
  }

  saveBtn.addEventListener('click', async () => {
    const date = dateInput.value
    const loaded = num(loadedInput.value)
    if (!date) { alert('તારીખ પસંદ કરો!'); return }
    stockMap[date] = loaded
    try {
      await saveSettings({ vanStock: stockMap })
      alert(`✅ ${formatDate(date)} ની સવારની ${loaded} ભરેલી બોટલ સેવ થઈ!`)
    } catch (err) {
      alert('ભૂલ: ' + err.message)
    }
    render()
  })

  dateInput.addEventListener('change', () => { applyStockToInput(); render() })
  loadedInput.addEventListener('input', render)

  loadStock()
}
