import { fetchSettings } from '../utils.js'
import { renderAdminContent, initAdminContent } from './adminContent.js'

const MASTER_PASSWORD = 'Manoj@3699'
const DEFAULT_PIN = '0254'

export function renderAdmin() {
  return `
    <div class="max-w-3xl mx-auto p-4 fade-in">
      <div id="adminPanel">${renderAdminContent()}</div>
    </div>
  `
}

export function initAdmin() {
  const panel = document.getElementById('adminPanel')
  if (panel) {
    initAdminContent(null, MASTER_PASSWORD)
  }
}

async function getActivePin() {
  const settings = await fetchSettings()
  return String(settings?.adminPin || '').trim() || DEFAULT_PIN
}

export async function promptAdminPin(onSuccess, renderInline) {
  const activePin = await getActivePin()

  if (renderInline) {
    renderInlinePin(onSuccess, activePin)
    return
  }

  const modal = document.createElement('div')
  modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 fade-in'
  modal.innerHTML = `
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 modal-in">
      <div class="text-center mb-4">
        <div class="text-4xl mb-2">🔐</div>
        <h3 class="text-lg font-bold text-gray-800">એડમિન વિભાગ ખોલવા માટે PIN દાખલ કરો</h3>
      </div>
      <div id="pinInputSection">
        <input id="adminPinInput" type="password" placeholder="PIN દાખલ કરો"
          class="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-brand-500 transition-colors text-gray-800 text-center text-lg tracking-widest" />
        <p id="adminPinError" class="text-red-500 text-sm mt-2 text-center hidden"></p>
      </div>
      <div id="masterSection" class="hidden">
        <p class="text-red-600 text-sm font-semibold text-center mb-3">🔒 ૩ વખત ખોટો PIN દાખલ થયો છે! પેનલ અનલોક કરવા માસ્ટર પાસવર્ડ દાખલ કરો.</p>
        <input id="adminMasterInput" type="password" placeholder="માસ્ટર પાસવર્ડ"
          class="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-brand-500 transition-colors text-gray-800 text-center" />
        <p id="adminMasterError" class="text-red-500 text-sm mt-2 text-center hidden"></p>
      </div>
      <div class="flex gap-2 mt-4">
        <button id="adminPinCancel" class="flex-1 py-3 rounded-xl bg-gray-100 text-gray-700 font-semibold btn-press">રદ કરો</button>
        <button id="adminPinSubmit" class="flex-1 py-3 rounded-xl bg-brand-600 text-white font-semibold btn-press">પ્રવેશ કરો</button>
      </div>
    </div>
  `
  document.body.appendChild(modal)

  const pinInput = document.getElementById('adminPinInput')
  const errEl = document.getElementById('adminPinError')
  const pinSection = document.getElementById('pinInputSection')
  const masterSection = document.getElementById('masterSection')
  const masterInput = document.getElementById('adminMasterInput')
  const masterErr = document.getElementById('adminMasterError')
  const submitBtn = document.getElementById('adminPinSubmit')
  let failedAttempts = 0

  function close() {
    modal.remove()
  }

  function tryUnlock() {
    if (masterSection.classList.contains('hidden')) {
      const entered = String(pinInput.value).trim()
      if (entered === activePin) {
        close()
        onSuccess()
      } else {
        failedAttempts++
        if (failedAttempts >= 3) {
          pinSection.classList.add('hidden')
          masterSection.classList.remove('hidden')
          submitBtn.textContent = 'અનલોક કરો'
          masterInput.focus()
        } else {
          errEl.textContent = `ખોટો PIN! (${failedAttempts}/3)`
          errEl.classList.remove('hidden')
          pinInput.value = ''
          pinInput.focus()
        }
      }
    } else {
      const entered = String(masterInput.value).trim()
      if (entered === MASTER_PASSWORD) {
        close()
        onSuccess()
      } else {
        masterErr.textContent = 'ખોટો માસ્ટર પાસવર્ડ!'
        masterErr.classList.remove('hidden')
        masterInput.value = ''
        masterInput.focus()
      }
    }
  }

  document.getElementById('adminPinCancel').addEventListener('click', close)
  modal.addEventListener('click', (e) => { if (e.target === modal) close() })
  submitBtn.addEventListener('click', tryUnlock)
  pinInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') tryUnlock()
  })
  masterInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') tryUnlock()
  })
  pinInput.focus()
}

function renderInlinePin(onSuccess, activePin) {
  const root = document.getElementById('adminPinInline')
  if (!root) return
  root.innerHTML = `
    <div class="max-w-sm mx-auto p-4">
      <div class="bg-white rounded-2xl shadow-lg p-6 modal-in text-center">
        <div class="text-4xl mb-2">🔐</div>
        <h3 class="text-lg font-bold text-gray-800 mb-4">એડમિન વિભાગ ખોલવા માટે PIN દાખલ કરો</h3>
        <div id="inlinePinSection">
          <input id="inlinePinInput" type="password" placeholder="PIN દાખલ કરો"
            class="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-brand-500 transition-colors text-gray-800 text-center text-lg tracking-widest" />
          <p id="inlinePinError" class="text-red-500 text-sm mt-2 hidden"></p>
        </div>
        <div id="inlineMasterSection" class="hidden">
          <p class="text-red-600 text-sm font-semibold mb-3">🔒 ૩ વખત ખોટો PIN દાખલ થયો છે! પેનલ અનલોક કરવા માસ્ટર પાસવર્ડ દાખલ કરો.</p>
          <input id="inlineMasterInput" type="password" placeholder="માસ્ટર પાસવર્ડ"
            class="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-brand-500 transition-colors text-gray-800 text-center" />
          <p id="inlineMasterError" class="text-red-500 text-sm mt-2 hidden"></p>
        </div>
        <button id="inlinePinSubmit"
          class="w-full mt-4 py-3 rounded-xl bg-brand-600 text-white font-semibold btn-press">પ્રવેશ કરો</button>
      </div>
    </div>
  `
  const pinInput = document.getElementById('inlinePinInput')
  const errEl = document.getElementById('inlinePinError')
  const pinSection = document.getElementById('inlinePinSection')
  const masterSection = document.getElementById('inlineMasterSection')
  const masterInput = document.getElementById('inlineMasterInput')
  const masterErr = document.getElementById('inlineMasterError')
  const submitBtn = document.getElementById('inlinePinSubmit')
  let failedAttempts = 0

  function tryUnlock() {
    if (masterSection.classList.contains('hidden')) {
      const entered = String(pinInput.value).trim()
      if (entered === activePin) {
        onSuccess()
      } else {
        failedAttempts++
        if (failedAttempts >= 3) {
          pinSection.classList.add('hidden')
          masterSection.classList.remove('hidden')
          submitBtn.textContent = 'અનલોક કરો'
          masterInput.focus()
        } else {
          errEl.textContent = `ખોટો PIN! (${failedAttempts}/3)`
          errEl.classList.remove('hidden')
          pinInput.value = ''
          pinInput.focus()
        }
      }
    } else {
      const entered = String(masterInput.value).trim()
      if (entered === MASTER_PASSWORD) {
        onSuccess()
      } else {
        masterErr.textContent = 'ખોટો માસ્ટર પાસવર્ડ!'
        masterErr.classList.remove('hidden')
        masterInput.value = ''
        masterInput.focus()
      }
    }
  }

  submitBtn.addEventListener('click', tryUnlock)
  pinInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') tryUnlock()
  })
  masterInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') tryUnlock()
  })
  pinInput.focus()
}
