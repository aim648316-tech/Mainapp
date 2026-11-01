import './styles.css'
import { initListeners, subscribe } from './store.js'
import { renderLogin, initLogin } from './modules/login.js'
import { renderTabs, initTabs, isSecondaryTab } from './modules/nav.js'
import { renderNewEntry, initNewEntry } from './modules/newEntry.js'
import { renderPassbook, initPassbook } from './modules/passbook.js'
import { renderVanStock, initVanStock } from './modules/vanStock.js'
import { renderDailyReport, initDailyReport } from './modules/dailyReport.js'
import { renderEntryList, initEntryList } from './modules/entryList.js'

import { renderCalculator, initCalculator } from './modules/calculator.js'
import { renderAccountLedger, initAccountLedger } from './modules/accountLedger.js'
import { renderAdmin, initAdmin, promptAdminPin } from './modules/admin.js'
import { renderVehicleExpense, initVehicleExpense } from './modules/vehicleExpense.js'
import { renderBillView, initBillView } from './modules/billView.js'

let isLoggedIn = false
let activeTab = 'newEntry'
let showBanner = true
let adminUnlocked = false
let unsubStore = null
let rendering = false
let pendingRender = false

function getRoute() {
  const hash = window.location.hash
  const match = hash.match(/^#\/bill\?(.*)$/)
  if (match) return { name: 'bill', query: match[1] }
  return null
}

function renderApp() {
  if (rendering) { pendingRender = true; return }
  rendering = true

  const root = document.getElementById('app')

  const route = getRoute()
  if (route && route.name === 'bill') {
    if (!unsubStore) {
      initListeners()
      unsubStore = subscribe(() => {
        if (!rendering) renderApp()
      })
    }
    const { customers } = getState()
    if (customers.length === 0) {
      root.innerHTML = `
        <div class="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div class="bg-white rounded-2xl shadow-lg p-8 max-w-sm text-center">
            <div class="animate-spin inline-block w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full mb-3"></div>
            <p class="text-sm text-gray-500">બિલ લોડ થઈ રહ્યું છે...</p>
          </div>
        </div>
      `
      rendering = false
      return
    }
    root.innerHTML = renderBillView(route.query)
    initBillView(route.query)
    rendering = false
    return
  }

  if (!isLoggedIn) {
    root.innerHTML = renderLogin(onLoginSuccess)
    initLogin(onLoginSuccess)
    rendering = false
    return
  }

  let content = ''
  let initFn = null
  switch (activeTab) {
    case 'newEntry': content = renderNewEntry(); initFn = initNewEntry; break
    case 'passbook': content = renderPassbook(); initFn = initPassbook; break
    case 'vanStock': content = renderVanStock(); initFn = initVanStock; break
    case 'dailyReport': content = renderDailyReport(); initFn = initDailyReport; break
    case 'entryList': content = renderEntryList(); initFn = initEntryList; break
    case 'accountLedger': content = renderAccountLedger(); initFn = initAccountLedger; break
    case 'vehicleExpense': content = renderVehicleExpense(); initFn = initVehicleExpense; break
    case 'calculator': content = renderCalculator(); initFn = initCalculator; break
    case 'admin':
      if (adminUnlocked) {
        content = renderAdmin()
        initFn = initAdmin
      } else {
        content = '<div id="adminPinInline"></div>'
        initFn = () => promptAdminPin(() => { adminUnlocked = true; renderApp() }, true)
      }
      break
  }

  const banner = showBanner ? `
    <div class="bg-gradient-to-r from-brand-600 to-brand-700 text-white px-4 py-2.5 slide-down flex items-center justify-between sticky top-0 z-40" style="padding-top: env(safe-area-inset-top);">
      <div class="flex items-center gap-2 text-sm font-semibold">
        <span>💧 ઠાકરધણી વોટર સપ્લાય</span>
      </div>
      <button id="dismissBanner" class="text-white/80 hover:text-white text-lg btn-press px-1">✖</button>
    </div>
  ` : ''

  const fullScreen = isSecondaryTab(activeTab)
  const backBtn = fullScreen ? `
    <div class="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm" style="padding-top: env(safe-area-inset-top);">
      <div class="max-w-3xl mx-auto px-3 py-2.5 flex items-center gap-2">
        <button id="backToMain" class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 font-semibold text-sm btn-press hover:bg-gray-200 transition-colors">
          <span class="text-base">‹</span> પાછા જાઓ
        </button>
        <span class="text-sm font-bold text-gray-800">${getActiveTabLabel(activeTab)}</span>
      </div>
    </div>
  ` : ''

  if (fullScreen) {
    root.innerHTML = `
      <div class="min-h-screen bg-gray-50">
        ${backBtn}
        <div id="tabContent" class="py-2">
          ${content}
        </div>
      </div>
    `
    document.getElementById('backToMain')?.addEventListener('click', () => {
      setTab('newEntry')
    })
  } else {
    root.innerHTML = `
      <div class="min-h-screen bg-gray-50">
        ${banner}
        ${renderTabs(activeTab, setTab)}
        <div id="tabContent" class="py-2">
          ${content}
        </div>
      </div>
    `
    initTabs(setTab)
  }

  if (initFn) initFn()

  if (showBanner && !fullScreen) {
    document.getElementById('dismissBanner')?.addEventListener('click', () => {
      showBanner = false
      renderApp()
    })
  }

  rendering = false
  if (pendingRender) {
    pendingRender = false
    renderApp()
  }
}

function getActiveTabLabel(tabId) {
  const labels = {
    passbook: '📖 ગ્રાહક પાસબુક',
    entryList: '📋 તમામ એન્ટ્રી',
    accountLedger: '💰 જમા-ખાતાવહી',
    vehicleExpense: '⛽ વાહન ખર્ચ',
    calculator: '🧮 કેલ્ક્યુલેટર',
    admin: '⚙️ Admin Panel',
  }
  return labels[tabId] || ''
}

function setTab(tabId) {
  if (tabId === 'admin') {
    adminUnlocked = false
  }
  activeTab = tabId
  renderApp()
}

function onLoginSuccess() {
  isLoggedIn = true
  initListeners()
  unsubStore = subscribe(() => {
    if (isLoggedIn && !rendering) renderApp()
  })
  renderApp()
}

window.addEventListener('hashchange', renderApp)

export function startApp() {
  renderApp()
}
