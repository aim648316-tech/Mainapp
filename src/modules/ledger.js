import { getState } from '../store.js'
import { num, guDate } from '../utils.js'

export function renderLedger() {
  const { customers } = getState()

  return `
    <div class="max-w-3xl mx-auto p-4 space-y-3 fade-in">
      <div class="bg-white rounded-2xl shadow-sm p-4">
        <h2 class="text-lg font-bold text-gray-800 flex items-center gap-2">
          <span>📒</span> ખાતાવહી
        </h2>
      </div>
      <div id="ledgerCards" class="space-y-3">
        ${renderCards(customers)}
      </div>
    </div>
  `
}

function renderCards(customers) {
  if (customers.length === 0) {
    return `<div class="text-center py-8 text-gray-400"><p class="text-4xl mb-2">📭</p><p>કોઈ ગ્રાહક નથી</p></div>`
  }
  return customers.map((c) => {
    const bottles = num(c.pendingBottles)
    const due = num(c.pendingDue)
    return `
      <div class="bg-white rounded-2xl shadow-sm p-4 card-hover">
        <div class="flex justify-between items-start mb-3">
          <div>
            <div class="font-bold text-gray-800">${c.name}</div>
            <div class="text-xs text-gray-500">📍 ${c.route || ''} · 📞 ${c.phone || ''}</div>
          </div>
          <a href="https://wa.me/${(c.phone || '').replace(/\D/g, '')}?text=${encodeURIComponent(buildMsg(c))}" target="_blank"
            class="px-3 py-2 rounded-lg bg-green-500 text-white text-sm font-semibold btn-press hover:bg-green-600 transition-colors flex items-center gap-1">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.89-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            WhatsApp
          </a>
        </div>
        <div class="grid grid-cols-2 gap-2">
          <div class="rounded-lg p-2.5 ${bottles > 0 ? 'bg-warning-50 border border-warning-200' : 'bg-gray-50 border border-gray-200'}">
            <div class="text-xs text-gray-600">📦 બાકી ખાલી બોટલ</div>
            <div class="text-lg font-bold ${bottles > 0 ? 'text-warning-700' : 'text-gray-700'}">${bottles} નંગ</div>
          </div>
          <div class="rounded-lg p-2.5 ${due > 0 ? 'bg-red-50 border border-red-200' : 'bg-gray-50 border border-gray-200'}">
            <div class="text-xs text-gray-600">💰 કુલ બાકી રકમ</div>
            <div class="text-lg font-bold ${due > 0 ? 'text-red-600' : 'text-gray-700'}">₹${due}</div>
          </div>
        </div>
      </div>
    `
  }).join('')
}

function buildMsg(c) {
  const { settings } = getState()
  const due = num(c.pendingDue)
  const template = settings.whatsappTemplate
  if (template) {
    return template
      .replace(/{name}/g, c.name || '')
      .replace(/{route}/g, c.route || '')
      .replace(/{month}/g, guDate())
      .replace(/{full}/g, 0)
      .replace(/{empty}/g, 0)
      .replace(/{paid}/g, 0)
      .replace(/{bottles}/g, num(c.pendingBottles))
      .replace(/{due}/g, due)
  }
  return `💧 *ઠાકરધણી વોટર સપ્લાય* 💧\n----------------------------------\n👤 *ગ્રાહક:* ${c.name}\n📍 *રૂટ:* ${c.route || ''}\n📅 *તારીખ:* ${guDate()}\n----------------------------------\n📦 *બાકી ખાલી બોટલ:* ${num(c.pendingBottles)} નંગ\n💰 *કુલ બાકી રકમ:* ₹${due}\n----------------------------------\n📲 *ઓનલાઇન પેમેન્ટ માટે UPI લિંક:*\nupi://pay?pa=manojbharwad@okaxis&pn=Thakardhani%20Water&am=${due}&cu=INR\n----------------------------------\n🙏 નિયમિત સહકાર બદલ આભાર!\n📞 સંપર્ક: મનોજ ભરવાડ`
}

export function initLedger() {}
