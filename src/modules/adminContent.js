import { getState, updateSettings } from '../store.js'
import {
  addRecord, updateRecord, deleteRecord,
  saveSettings, fetchSettings, num, sortByOrder, getOrder, sortRouteCustomers, batchUpdateRecords,
} from '../utils.js'
import { exportExcel, backupData, restoreData } from './adminIO.js'

export function renderAdminContent() {
  const { routes, customers, settings } = getState()
  const routeNames = routes.length > 0 ? routes.map((r) => r.name) : ['Phase 2']
  const defaultRate = settings?.defaultRate ?? 20
  const waTemplate = settings?.whatsappTemplate ?? ''

  return `
    <div class="space-y-4 fade-in">
      <div class="bg-white rounded-2xl shadow-sm p-5">
        <h2 class="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span>⚙️</span> Admin Panel
        </h2>
        <button id="changePinBtn"
          class="w-full py-3 rounded-xl bg-gradient-to-r from-warning-500 to-warning-600 text-white font-semibold shadow-lg btn-press mb-3">
          🔑 બદલો એડમિન પાસવર્ડ
        </button>
        <button id="changeLoginBtn"
          class="w-full py-3 rounded-xl bg-gradient-to-r from-brand-500 to-brand-700 text-white font-semibold shadow-lg btn-press">
          🔐 બદલો એપ લોગિન (Username / Password)
        </button>
      </div>

      <div class="bg-white rounded-2xl shadow-sm p-5">
        <h3 class="font-bold text-gray-800 mb-3">⚙️ ડિફોલ્ટ બોટલ રેટ</h3>
        <div class="flex gap-2 items-center">
          <input id="defaultRate" type="number" inputmode="numeric" placeholder="20" value="${defaultRate}"
            class="flex-1 px-3 py-2.5 rounded-lg border-2 border-gray-200 focus:border-brand-500 text-gray-800 text-sm" />
          <button id="saveRateBtn"
            class="px-5 py-2.5 rounded-lg bg-brand-600 text-white font-semibold btn-press text-sm">સેવ કરો</button>
        </div>
        <p class="text-xs text-gray-500 mt-2">નવી એન્ટ્રીમાં આ રેટ ડિફોલ્ટ તરીકે બતાશે</p>
        <button id="syncRateBtn"
          class="w-full mt-3 py-3 rounded-xl bg-gradient-to-r from-warning-500 to-warning-600 text-white font-semibold shadow-lg btn-press">
          ⚡ બધા ગ્રાહકોમાં આ ભાવ લાગુ કરો (Update All Customers)
        </button>
      </div>

      <div class="bg-white rounded-2xl shadow-sm p-5">
        <h3 class="font-bold text-gray-800 mb-3">📊 કલેક્શન કાઉન્ટર</h3>
        <div id="adminCollectionCounter" class="grid grid-cols-2 gap-3"></div>
      </div>

      <div class="bg-white rounded-2xl shadow-sm p-5">
        <h3 class="font-bold text-gray-800 mb-3">⚡ ભાવ કંટ્રોલ & ગ્રુપ અપડેટ</h3>
        <div class="space-y-3">
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">📍 રૂટ ફિલ્ટર</label>
            <select id="bulkRouteFilter"
              class="w-full px-3 py-2.5 rounded-lg border-2 border-gray-200 focus:border-brand-500 text-gray-800 text-sm">
              <option value="">બધા રૂટ</option>
              ${routeNames.map((r) => `<option value="${r}">${r}</option>`).join('')}
            </select>
          </div>
          <div class="flex gap-2">
            <button id="bulkSelectAll" class="flex-1 py-2 rounded-lg bg-brand-50 text-brand-700 text-xs font-semibold btn-press border border-brand-200">☑️ બધા પસંદ કરો</button>
            <button id="bulkDeselectAll" class="flex-1 py-2 rounded-lg bg-gray-100 text-gray-600 text-xs font-semibold btn-press border border-gray-200">☐ બધા નામંજૂર</button>
          </div>
          <div id="bulkCustomerList" class="max-h-60 overflow-y-auto space-y-1.5 rounded-lg border border-gray-200 p-2"></div>
          <div class="flex gap-2 items-center">
            <input id="bulkRateInput" type="number" inputmode="numeric" placeholder="રેટ ₹" value="${defaultRate}"
              class="flex-1 px-3 py-2.5 rounded-lg border-2 border-gray-200 focus:border-brand-500 text-gray-800 text-sm text-center" />
            <button id="bulkApplyBtn"
              class="px-5 py-2.5 rounded-lg bg-gradient-to-r from-warning-500 to-warning-600 text-white font-semibold btn-press text-sm">⚡ પસંદ કરેલા ગ્રાહકોમાં આ ભાવ લાગુ કરો</button>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-2xl shadow-sm p-5">
        <h3 class="font-bold text-gray-800 mb-3">⚙️ એપ કસ્ટમાઇઝેશન કંટ્રોલ</h3>
        <div class="space-y-3">
          <label class="flex items-center justify-between rounded-lg p-3 bg-gray-50 border border-gray-200 cursor-pointer">
            <div>
              <div class="text-sm font-semibold text-gray-800">📜 લેજર ઓટો-કેરીઓવર</div>
              <div class="text-xs text-gray-500">પાછલી બાકી આપમેળે આગળના મહિનામાં લઈ જાઓ</div>
            </div>
            <input id="toggleAutoCarryover" type="checkbox" ${settings?.autoCarryover !== false ? 'checked' : ''} class="w-5 h-5 accent-brand-600" />
          </label>
          <label class="flex items-center justify-between rounded-lg p-3 bg-gray-50 border border-gray-200 cursor-pointer">
            <div>
              <div class="text-sm font-semibold text-gray-800">🚚 ટેમ્પો અલર્ટ</div>
              <div class="text-xs text-gray-500">વેન સ્ટોક ઓછો થાય ત્યારે ચેતવણી બતાવો</div>
            </div>
            <input id="toggleTempoAlerts" type="checkbox" ${settings?.tempoAlerts !== false ? 'checked' : ''} class="w-5 h-5 accent-brand-600" />
          </label>
          <div class="rounded-lg p-3 bg-gray-50 border border-gray-200">
            <div class="text-sm font-semibold text-gray-800 mb-2">💰 ડિફોલ્ટ પેમેન્ટ મોડ</div>
            <div class="flex gap-2">
              <button data-pmode="cash" id="pmodeCash" class="flex-1 py-2 rounded-lg text-xs font-semibold btn-press border ${settings?.defaultPaymentMode === 'cash' ? 'bg-green-500 text-white border-green-600' : 'bg-white text-gray-600 border-gray-200'}">💵 રોકડ</button>
              <button data-pmode="gpay" id="pmodeGpay" class="flex-1 py-2 rounded-lg text-xs font-semibold btn-press border ${settings?.defaultPaymentMode === 'gpay' ? 'bg-blue-500 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200'}">📱 GPay</button>
              <button data-pmode="split" id="pmodeSplit" class="flex-1 py-2 rounded-lg text-xs font-semibold btn-press border ${settings?.defaultPaymentMode === 'split' || !settings?.defaultPaymentMode ? 'bg-brand-500 text-white border-brand-600' : 'bg-white text-gray-600 border-gray-200'}">💸 સ્પ્લિટ</button>
            </div>
          </div>
          <div class="rounded-lg p-3 bg-gray-50 border border-gray-200">
            <div class="text-sm font-semibold text-gray-800 mb-2">🏪 બિઝનેસ નામ</div>
            <input id="customBizName" type="text" value="${settings?.bizName || 'Thakardhani Water Supply'}" placeholder="બિઝનેસ નામ"
              class="w-full px-3 py-2.5 rounded-lg border-2 border-gray-200 focus:border-brand-500 text-gray-800 text-sm" />
          </div>
          <button id="saveCustomBtn"
            class="w-full py-2.5 rounded-lg bg-brand-600 text-white font-semibold btn-press text-sm">💾 કસ્ટમાઇઝેશન સેવ કરો</button>
        </div>
      </div>

      <div class="bg-white rounded-2xl shadow-sm p-5">
        <h3 class="font-bold text-gray-800 mb-3">💬 WhatsApp ટેમ્પલેટ એડિટર</h3>
        <textarea id="waTemplate" rows="6" placeholder="WhatsApp બિલ મેસેજ ટેમ્પલેટ અહીં લખો..."
          class="w-full px-3 py-2.5 rounded-lg border-2 border-gray-200 focus:border-brand-500 text-gray-800 text-sm font-mono">${waTemplate || '{name}, {route}, {month}, {full}, {empty}, {paid}, {bottles}, {due}'}</textarea>
        <p class="text-xs text-gray-500 mt-2">વેરિએબલ: {name}, {route}, {month}, {full}, {empty}, {paid}, {bottles}, {due}</p>
        <button id="saveWaBtn"
          class="w-full mt-3 py-2.5 rounded-lg bg-green-500 text-white font-semibold btn-press text-sm">💾 ટેમ્પલેટ સેવ કરો</button>
      </div>

      <div class="bg-white rounded-2xl shadow-sm p-5">
        <h3 class="font-bold text-gray-800 mb-3">📍 રૂટ મેનેજમેન્ટ</h3>
        <div class="flex gap-2 mb-3">
          <input id="newRoute" type="text" placeholder="નવું રૂટ નામ"
            class="flex-1 px-3 py-2.5 rounded-lg border-2 border-gray-200 focus:border-brand-500 text-gray-800 text-sm" />
          <button id="addRouteBtn"
            class="px-5 py-2.5 rounded-lg bg-brand-600 text-white font-semibold btn-press text-sm">ઉમેરો</button>
        </div>
        <div id="routeList" class="space-y-2"></div>
      </div>

      <div class="bg-white rounded-2xl shadow-sm p-5">
        <h3 class="font-bold text-gray-800 mb-3">👤 નવો ગ્રાહક ઉમેરો</h3>
        <div class="space-y-3">
          <input id="custName" type="text" placeholder="ગ્રાહક નામ"
            class="w-full px-3 py-2.5 rounded-lg border-2 border-gray-200 focus:border-brand-500 text-gray-800 text-sm" />
          <input id="custPhone" type="tel" placeholder="મોબાઈલ નંબર"
            class="w-full px-3 py-2.5 rounded-lg border-2 border-gray-200 focus:border-brand-500 text-gray-800 text-sm" />
          <div class="grid grid-cols-2 gap-3">
            <input id="custRate" type="number" inputmode="numeric" placeholder="રેટ" value="${defaultRate}"
              class="px-3 py-2.5 rounded-lg border-2 border-gray-200 focus:border-brand-500 text-gray-800 text-sm" />
            <select id="custRoute"
              class="px-3 py-2.5 rounded-lg border-2 border-gray-200 focus:border-brand-500 text-gray-800 text-sm">
              ${routeNames.map((r) => `<option value="${r}" ${r === 'Phase 2' ? 'selected' : ''}>${r}</option>`).join('')}
            </select>
          </div>
          <button id="addCustBtn"
            class="w-full py-3 rounded-xl bg-accent-500 text-white font-semibold shadow-lg btn-press">✅ ગ્રાહક ઉમેરો</button>
        </div>
      </div>

      <div class="bg-white rounded-2xl shadow-sm p-5">
        <div class="flex justify-between items-center mb-3">
          <h3 class="font-bold text-gray-800">📋 ગ્રાહક યાદી</h3>
          <div class="flex gap-2">
            <button id="exportBtn" class="px-3 py-2 rounded-lg bg-accent-50 text-accent-700 text-sm font-semibold btn-press border border-accent-200">📊 Excel</button>
            <button id="backupBtn" class="px-3 py-2 rounded-lg bg-brand-50 text-brand-700 text-sm font-semibold btn-press border border-brand-200">💾 Backup</button>
            <label class="px-3 py-2 rounded-lg bg-warning-50 text-warning-700 text-sm font-semibold btn-press border border-warning-200 cursor-pointer">
              📂 Restore
              <input id="restoreFile" type="file" accept=".json" class="hidden" />
            </label>
          </div>
        </div>
        <div id="custList" class="space-y-2"></div>
      </div>
    </div>
  `
}

export async function initAdminContent(settings, masterPassword) {
  const { settings: storeSettings } = getState()
  const fullSettings = settings && Object.keys(settings).length > 0
    ? settings
    : (storeSettings && Object.keys(storeSettings).length > 0 ? storeSettings : await fetchSettings())

  const rateInput = document.getElementById('defaultRate')
  const waInput = document.getElementById('waTemplate')

  if (rateInput && fullSettings?.defaultRate) rateInput.value = fullSettings.defaultRate
  if (waInput && fullSettings?.whatsappTemplate) waInput.value = fullSettings.whatsappTemplate

  renderRouteList()
  renderCustList()

  document.getElementById('changePinBtn').addEventListener('click', () => openChangePinModal(masterPassword))
  document.getElementById('changeLoginBtn').addEventListener('click', () => openChangeLoginModal(masterPassword))

  document.getElementById('saveRateBtn').addEventListener('click', async () => {
    const rate = num(rateInput.value)
    if (rate <= 0) { alert('સાચો રેટ દાખલ કરો!'); return }
    try {
      await saveSettings({ defaultRate: rate })
      updateSettings({ defaultRate: rate })
      alert('✅ ડિફોલ્ટ રેટ સેવ થયો!')
    } catch (err) { alert('ભૂલ: ' + err.message) }
  })

  document.getElementById('syncRateBtn').addEventListener('click', async () => {
    const rate = num(rateInput.value)
    if (rate <= 0) { alert('સાચો રેટ દાખલ કરો!'); return }
    const { customers } = getState()
    if (customers.length === 0) { alert('કોઈ ગ્રાહક નથી!'); return }
    if (!confirm(`શું તમે ખરેખર બધા ${customers.length} ગ્રાહકોનો રેટ ₹${rate} માં બદલવા માંગો છો?`)) return
    try {
      const updates = customers.map((c) => ({ id: c.id, data: { defaultRate: rate } }))
      await batchUpdateRecords('customers', updates)
      await saveSettings({ defaultRate: rate })
      updateSettings({ defaultRate: rate })
      alert(`✅ બધા ${customers.length} ગ્રાહકોનો રેટ ₹${rate} માં અપડેટ થયો!`)
    } catch (err) { alert('ભૂલ: ' + err.message) }
  })

  renderCollectionCounter()

  const bulkRouteFilter = document.getElementById('bulkRouteFilter')
  const bulkCustomerListEl = document.getElementById('bulkCustomerList')
  const bulkRateInput = document.getElementById('bulkRateInput')
  const bulkSelected = new Set()

  function renderBulkCustomerList() {
    const { customers } = getState()
    const route = bulkRouteFilter.value
    const filtered = route
      ? customers.filter((c) => (c.route || '').trim().toLowerCase() === route.trim().toLowerCase())
      : sortByOrder(customers)

    if (filtered.length === 0) {
      bulkCustomerListEl.innerHTML = '<p class="text-center text-gray-400 text-xs py-3">કોઈ ગ્રાહક નથી</p>'
      return
    }

    bulkCustomerListEl.innerHTML = filtered.map((c) => `
      <label class="flex items-center justify-between rounded-lg p-2 ${bulkSelected.has(c.id) ? 'bg-brand-50 border border-brand-300' : 'bg-white border border-gray-200'} cursor-pointer">
        <div class="flex items-center gap-2">
          <input type="checkbox" data-bulk-cid="${c.id}" ${bulkSelected.has(c.id) ? 'checked' : ''} class="w-4 h-4 accent-brand-600 bulkChk" />
          <span class="text-xs font-medium text-gray-700">${c.name}</span>
        </div>
        <span class="inline-block px-1.5 py-0.5 rounded text-xs font-bold ${num(c.defaultRate) === num(bulkRateInput.value) ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}">₹${c.defaultRate || 20}</span>
      </label>
    `).join('')

    bulkCustomerListEl.querySelectorAll('.bulkChk').forEach((chk) => {
      chk.addEventListener('change', () => {
        const cid = chk.dataset.bulkCid
        if (chk.checked) { bulkSelected.add(cid) } else { bulkSelected.delete(cid) }
        renderBulkCustomerList()
      })
    })
  }

  bulkRouteFilter.addEventListener('change', renderBulkCustomerList)
  bulkRateInput.addEventListener('input', renderBulkCustomerList)

  document.getElementById('bulkSelectAll').addEventListener('click', () => {
    const { customers } = getState()
    const route = bulkRouteFilter.value
    const filtered = route
      ? customers.filter((c) => (c.route || '').trim().toLowerCase() === route.trim().toLowerCase())
      : customers
    filtered.forEach((c) => bulkSelected.add(c.id))
    renderBulkCustomerList()
  })

  document.getElementById('bulkDeselectAll').addEventListener('click', () => {
    bulkSelected.clear()
    renderBulkCustomerList()
  })

  document.getElementById('bulkApplyBtn').addEventListener('click', async () => {
    const rate = num(bulkRateInput.value)
    if (rate <= 0) { alert('સાચો રેટ દાખલ કરો!'); return }
    if (bulkSelected.size === 0) { alert('ઓછામાં ઓછો એક ગ્રાહક પસંદ કરો!'); return }
    if (!confirm(`શું તમે ${bulkSelected.size} ગ્રાહકોનો રેટ ₹${rate} માં બદલવા માંગો છો?`)) return
    try {
      const updates = [...bulkSelected].map((id) => ({ id, data: { defaultRate: rate } }))
      await batchUpdateRecords('customers', updates)
      alert(`✅ ${bulkSelected.size} ગ્રાહકોનો રેટ ₹${rate} માં અપડેટ થયો!`)
      bulkSelected.clear()
      renderBulkCustomerList()
    } catch (err) { alert('ભૂલ: ' + err.message) }
  })

  renderBulkCustomerList()

  let pendingPaymentMode = fullSettings?.defaultPaymentMode || 'split'
  function updatePmodeButtons() {
    document.querySelectorAll('[data-pmode]').forEach((btn) => {
      if (btn.dataset.pmode === pendingPaymentMode) {
        btn.className = 'flex-1 py-2 rounded-lg text-xs font-semibold btn-press border ' +
          (pendingPaymentMode === 'cash' ? 'bg-green-500 text-white border-green-600'
            : pendingPaymentMode === 'gpay' ? 'bg-blue-500 text-white border-blue-600'
            : 'bg-brand-500 text-white border-brand-600')
      } else {
        btn.className = 'flex-1 py-2 rounded-lg text-xs font-semibold btn-press border bg-white text-gray-600 border-gray-200'
      }
    })
  }

  document.querySelectorAll('[data-pmode]').forEach((btn) => {
    btn.addEventListener('click', () => {
      pendingPaymentMode = btn.dataset.pmode
      updatePmodeButtons()
    })
  })

  document.getElementById('saveCustomBtn').addEventListener('click', async () => {
    try {
      const data = {
        autoCarryover: document.getElementById('toggleAutoCarryover').checked,
        tempoAlerts: document.getElementById('toggleTempoAlerts').checked,
        defaultPaymentMode: pendingPaymentMode,
        bizName: document.getElementById('customBizName').value.trim() || 'Thakardhani Water Supply',
      }
      await saveSettings(data)
      updateSettings(data)
      alert('✅ કસ્ટમાઇઝેશન સેવ થયું!')
    } catch (err) { alert('ભૂલ: ' + err.message) }
  })

  document.getElementById('saveWaBtn').addEventListener('click', async () => {
    try {
      await saveSettings({ whatsappTemplate: waInput.value })
      updateSettings({ whatsappTemplate: waInput.value })
      alert('✅ WhatsApp ટેમ્પલેટ સેવ થયું!')
    } catch (err) { alert('ભૂલ: ' + err.message) }
  })

  document.getElementById('addRouteBtn').addEventListener('click', async () => {
    const name = document.getElementById('newRoute').value.trim()
    if (!name) { alert('રૂટ નામ દાખલ કરો!'); return }
    try {
      await addRecord('routes', { name })
      document.getElementById('newRoute').value = ''
      alert('✅ રૂટ ઉમેરાયો!')
    } catch (err) { alert('ભૂલ: ' + err.message) }
  })

  document.getElementById('addCustBtn').addEventListener('click', async () => {
    const name = document.getElementById('custName').value.trim()
    const phone = document.getElementById('custPhone').value.trim()
    const rate = num(document.getElementById('custRate').value) || num(rateInput.value) || 20
    const route = document.getElementById('custRoute').value
    if (!name) { alert('ગ્રાહક નામ દાખલ કરો!'); return }
    try {
      const { customers } = getState()
      const routeCustomers = sortRouteCustomers(customers, route)
      const maxOrder = routeCustomers.length > 0
        ? Math.max(...routeCustomers.map((c) => getOrder(c)))
        : 0
      await addRecord('customers', {
        name, phone, defaultRate: rate, route,
        pendingBottles: 0, pendingDue: 0,
        orderIndex: maxOrder + 1,
      })
      document.getElementById('custName').value = ''
      document.getElementById('custPhone').value = ''
      alert('✅ ગ્રાહક ઉમેરાયો!')
    } catch (err) { alert('ભૂલ: ' + err.message) }
  })

  document.getElementById('exportBtn').addEventListener('click', () => exportExcel())
  document.getElementById('backupBtn').addEventListener('click', () => backupData())
  document.getElementById('restoreFile').addEventListener('change', (e) => restoreData(e.target.files[0]))
}

function renderRouteList() {
  const { routes } = getState()
  const el = document.getElementById('routeList')
  if (!el) return
  if (routes.length === 0) {
    el.innerHTML = '<p class="text-center text-gray-400 text-sm py-2">કોઈ રૂટ નથી</p>'
    return
  }
  el.innerHTML = routes.map((r) => `
    <div class="flex items-center justify-between rounded-lg p-2.5 bg-brand-50 border border-brand-200">
      <span class="text-sm font-medium text-brand-700 flex-1">📍 ${r.name}</span>
      <div class="flex gap-1">
        <button data-rename="${r.id}" class="renameRoute px-2 py-1 rounded-lg bg-gray-100 text-gray-600 text-xs btn-press">✏️</button>
        <button data-del-route="${r.id}" class="delRoute px-2 py-1 rounded-lg bg-red-50 text-red-600 text-xs btn-press">🗑️</button>
      </div>
    </div>
  `).join('')

  document.querySelectorAll('.delRoute').forEach((btn) => {
    btn.addEventListener('click', () => {
      const route = routes.find((r) => r.id === btn.dataset.delRoute)
      if (!route) return
      promptDeleteRoute(route)
    })
  })

  document.querySelectorAll('.renameRoute').forEach((btn) => {
    btn.addEventListener('click', () => {
      const route = routes.find((r) => r.id === btn.dataset.rename)
      if (!route) return
      const newName = prompt('નવું રૂટ નામ:', route.name)
      if (!newName || !newName.trim()) return
      updateRecord('routes', route.id, { name: newName.trim() })
        .then(() => alert('✅ રૂટ નામ બદલાયું!'))
        .catch((e) => alert('ભૂલ: ' + e.message))
    })
  })
}

function openChangePinModal(masterPassword) {
  const modal = document.createElement('div')
  modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 fade-in'
  modal.innerHTML = `
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 modal-in">
      <h3 class="text-lg font-bold text-gray-800 mb-4">🔑 બદલો એડમિન પાસવર્ડ</h3>
      <label class="block text-sm font-medium text-gray-600 mb-1">માસ્ટર પાસવર્ડ</label>
      <input id="masterPass" type="password" placeholder="માસ્ટર પાસવર્ડ"
        class="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-brand-500 text-gray-800 mb-3" />
      <p id="masterError" class="text-red-500 text-sm mb-2 hidden"></p>
      <div id="newPinSection" class="hidden">
        <label class="block text-sm font-medium text-gray-600 mb-1">નવો 4-ડિજિટ પિન</label>
        <input id="newPin" type="password" inputmode="numeric" maxlength="4" placeholder="નવો પિન"
          class="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-brand-500 text-gray-800 text-center text-lg tracking-widest" />
      </div>
      <div class="flex gap-2 mt-4">
        <button id="pinCancel" class="flex-1 py-3 rounded-xl bg-gray-100 text-gray-700 font-semibold btn-press">રદ કરો</button>
        <button id="pinNext" class="flex-1 py-3 rounded-xl bg-brand-600 text-white font-semibold btn-press">આગળ</button>
      </div>
    </div>
  `
  document.body.appendChild(modal)
  const masterInput = document.getElementById('masterPass')
  const masterErr = document.getElementById('masterError')
  const newPinSection = document.getElementById('newPinSection')
  const newPinInput = document.getElementById('newPin')
  const nextBtn = document.getElementById('pinNext')

  document.getElementById('pinCancel').addEventListener('click', () => modal.remove())
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove() })

  let verified = false
  nextBtn.addEventListener('click', async () => {
    if (!verified) {
      if (masterInput.value.trim() === masterPassword) {
        verified = true
        masterErr.classList.add('hidden')
        newPinSection.classList.remove('hidden')
        nextBtn.textContent = 'સેવ કરો'
        newPinInput.focus()
      } else {
        masterErr.textContent = 'ખોટો માસ્ટર પાસવર્ડ!'
        masterErr.classList.remove('hidden')
      }
    } else {
      const newPin = newPinInput.value.trim()
      if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
        alert('4-ડિજિટનો પિન દાખલ કરો!')
        return
      }
      await saveSettings({ adminPin: newPin })
      updateSettings({ adminPin: newPin })
      modal.remove()
      alert('✅ એડમિન પિન બદલાઈ ગયો!')
    }
  })
  masterInput.focus()
}

function openChangeLoginModal(masterPassword) {
  const modal = document.createElement('div')
  modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 fade-in'
  modal.innerHTML = `
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 modal-in">
      <h3 class="text-lg font-bold text-gray-800 mb-4">🔐 બદલો એપ લોગિન</h3>
      <label class="block text-sm font-medium text-gray-600 mb-1">માસ્ટર પાસવર્ડ</label>
      <input id="loginMasterPass" type="password" placeholder="માસ્ટર પાસવર્ડ"
        class="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-brand-500 text-gray-800 mb-3" />
      <p id="loginMasterError" class="text-red-500 text-sm mb-2 hidden"></p>
      <div id="newLoginSection" class="hidden space-y-3">
        <div>
          <label class="block text-sm font-medium text-gray-600 mb-1">નવો Username</label>
          <input id="newAppUser" type="text" placeholder="નવો યુઝરનેમ"
            class="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-brand-500 text-gray-800" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-600 mb-1">નવો Password</label>
          <input id="newAppPass" type="text" placeholder="નવો પાસવર્ડ"
            class="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-brand-500 text-gray-800" />
        </div>
      </div>
      <div class="flex gap-2 mt-4">
        <button id="loginCancel" class="flex-1 py-3 rounded-xl bg-gray-100 text-gray-700 font-semibold btn-press">રદ કરો</button>
        <button id="loginNext" class="flex-1 py-3 rounded-xl bg-brand-600 text-white font-semibold btn-press">આગળ</button>
      </div>
    </div>
  `
  document.body.appendChild(modal)
  const masterInput = document.getElementById('loginMasterPass')
  const masterErr = document.getElementById('loginMasterError')
  const newSection = document.getElementById('newLoginSection')
  const newUserInput = document.getElementById('newAppUser')
  const newPassInput = document.getElementById('newAppPass')
  const nextBtn = document.getElementById('loginNext')

  document.getElementById('loginCancel').addEventListener('click', () => modal.remove())
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove() })

  let verified = false
  nextBtn.addEventListener('click', async () => {
    if (!verified) {
      if (masterInput.value.trim() === masterPassword) {
        verified = true
        masterErr.classList.add('hidden')
        newSection.classList.remove('hidden')
        nextBtn.textContent = 'સેવ કરો'
        newUserInput.focus()
      } else {
        masterErr.textContent = 'ખોટો માસ્ટર પાસવર્ડ!'
        masterErr.classList.remove('hidden')
      }
    } else {
      const newUser = newUserInput.value.trim()
      const newPass = newPassInput.value.trim()
      if (!newUser || !newPass) {
        alert('યુઝરનેમ અને પાસવર્ડ બંને દાખલ કરો!')
        return
      }
      await saveSettings({ appUsername: newUser, appPassword: newPass })
      updateSettings({ appUsername: newUser, appPassword: newPass })
      modal.remove()
      alert('✅ એપ લોગિન બદલાઈ ગયો!')
    }
  })
  masterInput.focus()
}

function renderCustList() {
  const { customers, routes } = getState()
  const sorted = sortByOrder(customers)
  const el = document.getElementById('custList')
  if (!el) return
  if (sorted.length === 0) {
    el.innerHTML = '<p class="text-center text-gray-400 py-4">કોઈ ગ્રાહક નથી</p>'
    return
  }
  const routeNames = routes.length > 0 ? routes.map((r) => r.name) : ['Phase 2']
  el.innerHTML = sorted.map((c, i) => `
    <div class="flex items-center justify-between rounded-xl p-3 bg-gray-50 border border-gray-200">
      <div class="flex-1 min-w-0">
        <div class="font-semibold text-gray-800 text-sm truncate">${i + 1}. ${c.name}</div>
        <div class="text-xs text-gray-500">📞 ${c.phone || ''} · 📍 ${c.route || ''} · ₹${c.defaultRate || 20}</div>
        <div class="text-xs mt-0.5">📦 ${num(c.pendingBottles)} બોટલ · 💰 ₹${num(c.pendingDue)}</div>
      </div>
      <div class="flex gap-1 ml-2 items-center">
        <button data-reorder="${c.id}" class="custReorder px-2 py-1 rounded-lg bg-brand-100 text-brand-700 text-xs font-bold btn-press" title="ક્રમ બદલો">#${i + 1}</button>
        <button data-up="${c.id}" class="custUp px-2 py-1 rounded-lg bg-gray-100 text-gray-600 text-xs btn-press ${i === 0 ? 'opacity-40' : ''}">⬆️</button>
        <button data-down="${c.id}" class="custDown px-2 py-1 rounded-lg bg-gray-100 text-gray-600 text-xs btn-press ${i === sorted.length - 1 ? 'opacity-40' : ''}">⬇️</button>
        <button data-edit="${c.id}" class="editCust px-2 py-1 rounded-lg bg-brand-50 text-brand-600 text-xs btn-press">✏️</button>
        <button data-del="${c.id}" class="delCust px-2 py-1 rounded-lg bg-red-50 text-red-600 text-xs btn-press">🗑️</button>
      </div>
    </div>
  `).join('')

  document.querySelectorAll('.editCust').forEach((btn) => {
    btn.addEventListener('click', () => openEditModal(btn.dataset.edit, customers, routeNames))
  })
  document.querySelectorAll('.delCust').forEach((btn) => {
    btn.addEventListener('click', () => confirmDelete(btn.dataset.del, customers))
  })
  document.querySelectorAll('.custUp').forEach((btn) => {
    btn.addEventListener('click', () => moveCustomer(btn.dataset.up, -1, sorted))
  })
  document.querySelectorAll('.custDown').forEach((btn) => {
    btn.addEventListener('click', () => moveCustomer(btn.dataset.down, 1, sorted))
  })
  document.querySelectorAll('.custReorder').forEach((btn) => {
    btn.addEventListener('click', () => openReorderModal(btn.dataset.reorder, sorted))
  })
}

async function moveCustomer(id, dir, sorted) {
  const idx = sorted.findIndex((c) => c.id === id)
  if (idx === -1) return
  const swapIdx = idx + dir
  if (swapIdx < 0 || swapIdx >= sorted.length) return
  const c1 = sorted[idx]
  const c2 = sorted[swapIdx]
  const o1 = getOrder(c1)
  const o2 = getOrder(c2)
  try {
    await updateRecord('customers', c1.id, { orderIndex: o2 })
    await updateRecord('customers', c2.id, { orderIndex: o1 })
  } catch (err) { alert('ભૂલ: ' + err.message) }
}

function openReorderModal(id, sorted) {
  const currentIdx = sorted.findIndex((c) => c.id === id)
  if (currentIdx === -1) return
  const customer = sorted[currentIdx]

  const modal = document.createElement('div')
  modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 fade-in'
  modal.innerHTML = `
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 modal-in">
      <h3 class="text-lg font-bold text-gray-800 mb-2">🔄 ક્રમ બદલો</h3>
      <p class="text-sm text-gray-500 mb-1">ગ્રાહક: <span class="font-semibold text-gray-700">${customer.name}</span></p>
      <p class="text-sm text-gray-500 mb-4">વર્તમાન ક્રમ: #${currentIdx + 1} (કુલ ${sorted.length})</p>
      <label class="block text-sm font-medium text-gray-600 mb-1">નવો ક્રમ નંબર દાખલ કરો (દા.ત. 4)</label>
      <input id="reorderInput" type="number" inputmode="numeric" min="1" max="${sorted.length}" value="${currentIdx + 1}"
        class="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-brand-500 text-gray-800 text-center text-lg" />
      <p id="reorderError" class="text-red-500 text-sm mt-2 hidden"></p>
      <div class="flex gap-2 mt-4">
        <button id="reorderCancel" class="flex-1 py-3 rounded-xl bg-gray-100 text-gray-700 font-semibold btn-press">રદ કરો</button>
        <button id="reorderSave" class="flex-1 py-3 rounded-xl bg-brand-600 text-white font-semibold btn-press">સેવ કરો</button>
      </div>
    </div>
  `
  document.body.appendChild(modal)
  const input = document.getElementById('reorderInput')
  const errEl = document.getElementById('reorderError')

  document.getElementById('reorderCancel').addEventListener('click', () => modal.remove())
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove() })

  document.getElementById('reorderSave').addEventListener('click', async () => {
    const newRank = parseInt(input.value.trim(), 10)
    if (isNaN(newRank) || newRank < 1 || newRank > sorted.length) {
      errEl.textContent = `1 થી ${sorted.length} વચ્ચે નંબર દાખલ કરો!`
      errEl.classList.remove('hidden')
      return
    }
    const newIdx = newRank - 1
    if (newIdx === currentIdx) { modal.remove(); return }

    try {
      const moved = sorted[currentIdx]
      const others = sorted.filter((c, i) => i !== currentIdx)
      const before = others.slice(0, newIdx)
      const after = others.slice(newIdx)
      const reordered = [...before, moved, ...after]

      const updates = reordered.map((c, i) => ({
        id: c.id,
        data: { orderIndex: i + 1 },
      }))

      await batchUpdateRecords('customers', updates)
      modal.remove()
      alert(`✅ ${customer.name} નવા ક્રમ #${newRank} પર ખસી ગયો!`)
    } catch (err) {
      errEl.textContent = 'ભૂલ: ' + err.message
      errEl.classList.remove('hidden')
    }
  })
  input.focus()
  input.select()
}

function openEditModal(id, customers, routeNames) {
  const c = customers.find((x) => x.id === id)
  if (!c) return
  const modal = document.createElement('div')
  modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 fade-in'
  modal.innerHTML = `
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 modal-in">
      <h3 class="text-lg font-bold text-gray-800 mb-4">✏️ ગ્રાહક સંપાદન</h3>
      <div class="space-y-3">
        <input id="editName" type="text" value="${c.name || ''}" placeholder="નામ"
          class="w-full px-3 py-2.5 rounded-lg border-2 border-gray-200 focus:border-brand-500 text-gray-800 text-sm" />
        <input id="editPhone" type="tel" value="${c.phone || ''}" placeholder="મોબાઈલ"
          class="w-full px-3 py-2.5 rounded-lg border-2 border-gray-200 focus:border-brand-500 text-gray-800 text-sm" />
        <div class="grid grid-cols-2 gap-3">
          <input id="editRate" type="number" value="${c.defaultRate || 20}" placeholder="રેટ"
            class="px-3 py-2.5 rounded-lg border-2 border-gray-200 focus:border-brand-500 text-gray-800 text-sm" />
          <select id="editRoute"
            class="px-3 py-2.5 rounded-lg border-2 border-gray-200 focus:border-brand-500 text-gray-800 text-sm">
            ${routeNames.map((r) => `<option value="${r}" ${r === c.route ? 'selected' : ''}>${r}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="flex gap-2 mt-4">
        <button id="editCancel" class="flex-1 py-3 rounded-xl bg-gray-100 text-gray-700 font-semibold btn-press">રદ</button>
        <button id="editSave" class="flex-1 py-3 rounded-xl bg-brand-600 text-white font-semibold btn-press">સેવ</button>
      </div>
    </div>
  `
  document.body.appendChild(modal)
  document.getElementById('editCancel').addEventListener('click', () => modal.remove())
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove() })
  document.getElementById('editSave').addEventListener('click', async () => {
    try {
      await updateRecord('customers', id, {
        name: document.getElementById('editName').value.trim(),
        phone: document.getElementById('editPhone').value.trim(),
        defaultRate: num(document.getElementById('editRate').value) || 20,
        route: document.getElementById('editRoute').value,
      })
      modal.remove()
      alert('✅ ગ્રાહક અપડેટ થયો!')
    } catch (err) { alert('ભૂલ: ' + err.message) }
  })
}

function confirmDelete(id, customers) {
  const c = customers.find((x) => x.id === id)
  if (!c) return
  if (!confirm(`ગ્રાહક "${c.name}" ને ડિલીટ કરવા છે?`)) return
  deleteRecord('customers', id).then(() => alert('✅ ગ્રાહક ડિલીટ થયો!')).catch((e) => alert('ભૂલ: ' + e.message))
}

function promptDeleteRoute(route) {
  const { customers, settings } = getState()
  const routeCustomers = customers.filter((c) => (c.route || '').trim().toLowerCase() === (route.name || '').trim().toLowerCase())
  const count = routeCustomers.length
  const routeDeletePin = settings?.routeDeletePin || '9916'

  const modal = document.createElement('div')
  modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 fade-in'
  modal.innerHTML = `
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 modal-in">
      <h3 class="text-lg font-bold text-red-600 mb-2">⚠️ ચેતવણી</h3>
      <p class="text-sm font-semibold text-gray-700 mb-4">
        ⚠️ ચેતવણી: આ રૂટમાં તમારા <span class="text-red-600 font-bold">${count}</span> ગ્રાહકો મોજૂદ છે! શું તમે ખરેખર આ રૂટ ડિલીટ કરવા માંગો છો?
      </p>
      <label class="block text-sm font-medium text-gray-600 mb-1">Route Delete PIN</label>
      <input id="routeDelPin" type="password" inputmode="numeric" maxlength="4" placeholder="PIN"
        class="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-red-500 text-gray-800 text-center text-lg tracking-widest" />
      <p id="routeDelError" class="text-red-500 text-sm mt-2 hidden"></p>
      <div class="flex gap-2 mt-4">
        <button id="routeDelCancel" class="flex-1 py-3 rounded-xl bg-gray-100 text-gray-700 font-semibold btn-press">રદ કરો</button>
        <button id="routeDelConfirm" class="flex-1 py-3 rounded-xl bg-red-500 text-white font-semibold btn-press">ડિલીટ કરો</button>
      </div>
    </div>
  `
  document.body.appendChild(modal)
  const pinInput = document.getElementById('routeDelPin')
  const errEl = document.getElementById('routeDelError')

  document.getElementById('routeDelCancel').addEventListener('click', () => modal.remove())
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove() })

  document.getElementById('routeDelConfirm').addEventListener('click', async () => {
    if (pinInput.value.trim() !== routeDeletePin) {
      errEl.textContent = 'ખોટો PIN!'
      errEl.classList.remove('hidden')
      pinInput.value = ''
      return
    }
    try {
      await deleteRecord('routes', route.id)
      modal.remove()
      alert('✅ રૂટ ડિલીટ થયો!')
    } catch (err) {
      alert('ભૂલ: ' + err.message)
    }
  })
  pinInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') document.getElementById('routeDelConfirm').click() })
  pinInput.focus()
}

function renderCollectionCounter() {
  const { deliveries } = getState()
  const now = new Date()
  const prefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const monthDeliveries = deliveries.filter((d) => (d.date || '').startsWith(prefix))
  const totalGpay = monthDeliveries.reduce((s, d) => s + num(d.gpay), 0)
  const totalCash = monthDeliveries.reduce((s, d) => s + num(d.cash), 0)

  const el = document.getElementById('adminCollectionCounter')
  if (!el) return
  el.innerHTML = `
    <div class="rounded-xl p-3 bg-blue-50 border border-blue-200">
      <div class="text-xs text-gray-600">📱 બેંક/GPay ખાતું</div>
      <div class="text-xl font-bold text-blue-700">₹${totalGpay}</div>
    </div>
    <div class="rounded-xl p-3 bg-green-50 border border-green-200">
      <div class="text-xs text-gray-600">💵 રોકડ ગલ્લો</div>
      <div class="text-xl font-bold text-green-700">₹${totalCash}</div>
    </div>
  `
}
