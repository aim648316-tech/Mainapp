import './styles.css'
import { initListeners, subscribe } from './store.js'
import { renderLogin, initLogin } from './modules/login.js'
import { renderTabs, initTabs } from './modules/nav.js'
import { renderNewEntry, initNewEntry } from './modules/newEntry.js'
import { renderPassbook, initPassbook } from './modules/passbook.js'
import { renderVanStock, initVanStock } from './modules/vanStock.js'
import { renderDailyReport, initDailyReport } from './modules/dailyReport.js'
import { renderEntryList, initEntryList } from './modules/entryList.js'

import { renderCalculator, initCalculator } from './modules/calculator.js'
import { renderAccountLedger, initAccountLedger } from './modules/accountLedger.js'
import { renderAdmin, initAdmin, promptAdminPin } from './modules/admin.js'

let isLoggedIn = false
let activeTab = 'newEntry'
let showBanner = true
let adminUnlocked = false
let unsubStore = null
let rendering = false
let pendingRender = false

function renderApp() {
  if (rendering) { pendingRender = true; return }
  rendering = true

  const root = document.getElementById('app')

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
    <div class="bg-gradient-to-r from-brand-600 to-brand-700 text-white px-4 py-2.5 slide-down flex items-center justify-between sticky top-0 z-40">
      <div class="flex items-center gap-2 text-sm font-semibold">
        <span>👋 Welcome - Manoj Bharwad | 💧 Thakardhani Water Supply</span>
      </div>
      <button id="dismissBanner" class="text-white/80 hover:text-white text-lg btn-press px-1">✖</button>
    </div>
  ` : ''

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
  if (initFn) initFn()

  if (showBanner) {
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

export function startApp() {
  renderApp()
}
