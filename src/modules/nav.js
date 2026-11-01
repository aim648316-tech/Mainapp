export const PRIMARY_TABS = [
  { id: 'newEntry', label: 'નવી એન્ટ્રી', icon: '📝' },
  { id: 'dailyReport', label: 'Daily Report', icon: '📊' },
  { id: 'vanStock', label: 'ટેમ્પો', icon: '🚚' },
]

export const SECONDARY_TABS = [
  { id: 'passbook', label: 'ગ્રાહક પાસબુક', icon: '📖' },
  { id: 'entryList', label: 'તમામ એન્ટ્રી', icon: '📋' },
  { id: 'accountLedger', label: 'જમા-ખાતાવહી', icon: '💰' },
  { id: 'vehicleExpense', label: 'વાહન ખર્ચ', icon: '⛽' },
  { id: 'calculator', label: 'કેલ્ક્યુલેટર', icon: '🧮' },
  { id: 'admin', label: 'Admin Panel', icon: '⚙️' },
]

export const ALL_TABS = [...PRIMARY_TABS, ...SECONDARY_TABS]

export function isSecondaryTab(tabId) {
  return SECONDARY_TABS.some((t) => t.id === tabId)
}

export function renderTabs(activeTab, onTabChange) {
  const primaryHtml = PRIMARY_TABS.map(
    (t) => `
      <button data-tab="${t.id}"
        class="tab-btn whitespace-nowrap px-4 py-2.5 rounded-lg text-sm font-semibold transition-all btn-press flex items-center gap-1.5
        ${activeTab === t.id
          ? 'bg-brand-600 text-white shadow-md'
          : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}">
        <span>${t.icon}</span>
        <span>${t.label}</span>
      </button>
    `
  ).join('')

  return `
    <div class="sticky top-0 z-30 bg-gray-50 border-b border-gray-200">
      <div class="max-w-3xl mx-auto px-2 py-2">
        <div class="flex gap-2 items-center">
          ${primaryHtml}
          <div class="relative ml-auto">
            <button id="moreMenuBtn"
              class="px-3 py-2.5 rounded-lg text-sm font-semibold bg-white text-gray-600 hover:bg-gray-100 border border-gray-200 btn-press flex items-center gap-1">
              <span class="text-lg leading-none">⋮</span>
            </button>
            <div id="moreMenuDropdown" class="hidden absolute right-0 top-full mt-1 w-56 bg-white rounded-xl shadow-xl border border-gray-200 py-1 z-50">
              ${SECONDARY_TABS.map(
                (t) => `
                <button data-tab="${t.id}"
                  class="tab-btn w-full text-left px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-brand-50 hover:text-brand-700 transition-colors flex items-center gap-2 ${activeTab === t.id ? 'bg-brand-50 text-brand-700' : ''}">
                  <span>${t.icon}</span>
                  <span>${t.label}</span>
                </button>
              `
              ).join('')}
            </div>
          </div>
        </div>
      </div>
    </div>
  `
}

export function initTabs(onTabChange) {
  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation()
      const dropdown = document.getElementById('moreMenuDropdown')
      if (dropdown) dropdown.classList.add('hidden')
      onTabChange(btn.dataset.tab)
    })
  })

  const moreBtn = document.getElementById('moreMenuBtn')
  const dropdown = document.getElementById('moreMenuDropdown')
  if (moreBtn && dropdown) {
    moreBtn.addEventListener('click', (e) => {
      e.stopPropagation()
      dropdown.classList.toggle('hidden')
    })
    document.addEventListener('click', () => dropdown.classList.add('hidden'), { once: true })
  }
}
