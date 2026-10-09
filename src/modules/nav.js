export const TABS = [
  { id: 'newEntry', label: 'નવી એન્ટ્રી', icon: '📝' },
  { id: 'dailyReport', label: 'Daily Report', icon: '📊' },
  { id: 'passbook', label: 'પાસબુક', icon: '👤' },
  { id: 'entryList', label: 'Entry List', icon: '📋' },
  { id: 'accountLedger', label: 'જમા-ખાતાવહી', icon: '💳' },
  { id: 'calculator', label: 'કેલ્ક્યુલેટર', icon: '🧮' },
  { id: 'vanStock', label: 'ટેમ્પો', icon: '🚚' },
  { id: 'admin', label: 'Admin', icon: '⚙️' },
]

export function renderTabs(activeTab, onTabChange) {
  const tabsHtml = TABS.map(
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
        <div class="flex gap-2 overflow-x-auto no-scrollbar">
          ${tabsHtml}
        </div>
      </div>
    </div>
  `
}

export function initTabs(onTabChange) {
  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      onTabChange(btn.dataset.tab)
    })
  })
}
