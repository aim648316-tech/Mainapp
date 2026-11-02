import { getState } from '../store.js'
import { num, formatDate, sortRouteCustomers } from '../utils.js'
import { generateBillPDF, sharePDFFile } from '../pdfUtils.js'

const MONTHS = ['જાન્યુઆરી', 'ફેબ્રુઆરી', 'માર્ચ', 'એપ્રિલ', 'મે', 'જૂન', 'જુલાઈ', 'ઓગસ્ટ', 'સપ્ટેમ્બર', 'ઓક્ટોબર', 'નવેમ્બર', 'ડિસેમ્બર']

function parseQuery(qs) {
  const params = {}
  new URLSearchParams(qs).forEach((v, k) => { params[k] = v })
  return params
}

export function renderBillView(query) {
  const params = parseQuery(query)
  const { customers, deliveries, settings } = getState()
  const customerId = params.id
  const month = params.month || ''
  const year = params.year || String(new Date().getFullYear())

  const customer = customers.find((c) => c.id === customerId)
  const bizName = settings?.bizName || 'ઠાકરધણી વોટર સપ્લાય'

  if (!customer) {
    return `
      <div class="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl shadow-lg p-8 max-w-sm text-center">
          <p class="text-4xl mb-3">📄</p>
          <h2 class="text-lg font-bold text-gray-800 mb-2">બિલ મળ્યું નથી</h2>
          <p class="text-sm text-gray-500">આ લિંક અમાન્ય છે અથવા કાઢી નાખવામાં આવી છે.</p>
        </div>
      </div>
    `
  }

  const monthName = month ? MONTHS[parseInt(month, 10) - 1] || '' : ''
  const prefix = `${year}-${month}`
  const allDeliveries = deliveries
    .filter((d) => d.customerId === customerId)
    .sort((a, b) => (a.date || '').localeCompare(b.date || ''))

  const monthDeliveries = month
    ? allDeliveries.filter((d) => (d.date || '').startsWith(prefix))
    : allDeliveries
  const beforeDeliveries = month
    ? allDeliveries.filter((d) => (d.date || '') < prefix)
    : []

  const customerRate = customer.defaultRate || settings?.defaultRate || 20
  const totalFull = monthDeliveries.reduce((s, d) => s + num(d.full), 0)
  const totalEmpty = monthDeliveries.reduce((s, d) => s + num(d.empty), 0)
  const totalPaid = monthDeliveries.reduce((s, d) => s + num(d.paid), 0)
  const monthBill = monthDeliveries.reduce((s, d) => s + num(d.full) * num(d.rate || customerRate), 0)
  const previousBalance = beforeDeliveries.reduce((s, d) => s + num(d.due), 0)
  const netDue = previousBalance + monthBill - totalPaid

  const isPayment = (d) => d.isPayment || (num(d.full) === 0 && num(d.empty) === 0 && num(d.paid) > 0)
  const deliveryEntries = monthDeliveries.filter((d) => !isPayment(d))
  const paymentEntries = monthDeliveries.filter((d) => isPayment(d))

  const billDate = new Date()
  const billDateStr = `${String(billDate.getDate()).padStart(2, '0')}/${String(billDate.getMonth() + 1).padStart(2, '0')}/${billDate.getFullYear()}`

  return `
    <div class="min-h-screen bg-gray-100 pb-20">
      <div class="max-w-2xl mx-auto p-4">
        <div class="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div class="bg-gradient-to-r from-brand-600 to-brand-700 text-white p-6 text-center">
            <div class="text-2xl font-bold mb-1">💧 ${bizName}</div>
            <div class="text-sm text-white/80">પાણી સપ્લાય સેવા</div>
          </div>

          <div class="p-6">
            <div class="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
              <div>
                <div class="text-xs text-gray-500">બિલ મહિનો</div>
                <div class="text-lg font-bold text-gray-800">${monthName} ${year}</div>
              </div>
              <div class="text-right">
                <div class="text-xs text-gray-500">બિલ તારીખ</div>
                <div class="text-sm font-semibold text-gray-700">${billDateStr}</div>
              </div>
            </div>

            <div class="bg-brand-50 rounded-xl p-4 mb-4 border border-brand-200">
              <div class="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <div class="text-xs text-gray-500">👤 ગ્રાહક</div>
                  <div class="font-semibold text-gray-800">${customer.name}</div>
                </div>
                <div>
                  <div class="text-xs text-gray-500">📍 રૂટ</div>
                  <div class="font-semibold text-gray-800">${customer.route || '-'}</div>
                </div>
                ${customer.phone ? `
                <div>
                  <div class="text-xs text-gray-500">📞 ફોન</div>
                  <div class="font-semibold text-gray-800">${customer.phone}</div>
                </div>` : ''}
              </div>
            </div>

            ${deliveryEntries.length > 0 ? `
              <h3 class="text-sm font-bold text-gray-700 mb-2">📦 ડિલિવરી વિગત</h3>
              <div class="overflow-x-auto mb-4">
                <table class="w-full text-xs">
                  <thead>
                    <tr class="border-b-2 border-gray-200 text-gray-600">
                      <th class="text-left py-2 px-1">તારીખ</th>
                      <th class="text-center py-2 px-1">ભરેલી</th>
                      <th class="text-center py-2 px-1">ખાલી</th>
                      <th class="text-right py-2 px-1">ભાવ</th>
                      <th class="text-right py-2 px-1">રકમ</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${deliveryEntries.map((d) => `
                      <tr class="border-b border-gray-100">
                        <td class="py-2 px-1 text-gray-700">${formatDate(d.date)}</td>
                        <td class="py-2 px-1 text-center text-gray-700">${num(d.full)}</td>
                        <td class="py-2 px-1 text-center text-gray-700">${num(d.empty)}</td>
                        <td class="py-2 px-1 text-right text-gray-600">₹${num(d.rate || customerRate)}</td>
                        <td class="py-2 px-1 text-right font-semibold text-brand-700">₹${num(d.full) * num(d.rate || customerRate)}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                  <tfoot>
                    <tr class="border-t-2 border-gray-300 font-bold">
                      <td colspan="4" class="py-2 px-1 text-right text-gray-700">કુલ:</td>
                      <td class="py-2 px-1 text-right text-brand-700">₹${monthBill}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ` : ''}

            ${paymentEntries.length > 0 ? `
              <h3 class="text-sm font-bold text-gray-700 mb-2">💵 જમા વિગત</h3>
              <div class="space-y-1 mb-4">
                ${paymentEntries.map((d) => `
                  <div class="flex items-center justify-between rounded-lg bg-accent-50 border border-accent-200 px-3 py-2 text-xs">
                    <span class="text-gray-700">${formatDate(d.date)}</span>
                    <span class="font-semibold text-accent-700">₹${num(d.paid)}</span>
                  </div>
                `).join('')}
              </div>
            ` : ''}

            <div class="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-gray-600">📜 પાછલી બાકી</span>
                  <span class="font-semibold ${previousBalance > 0 ? 'text-warning-700' : 'text-gray-700'}">₹${previousBalance}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">💳 આ મહિનાનું બિલ</span>
                  <span class="font-semibold text-brand-700">₹${monthBill}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">💵 જમા થયેલ રોકડ</span>
                  <span class="font-semibold text-accent-700">₹${totalPaid}</span>
                </div>
                <div class="flex justify-between border-t-2 border-gray-300 pt-2 text-base">
                  <span class="font-bold text-gray-800">⚖️ ચોખ્ખી બાકી</span>
                  <span class="font-bold ${netDue > 0 ? 'text-warning-700' : 'text-accent-700'}">₹${netDue}</span>
                </div>
              </div>
            </div>

            ${totalFull > 0 || totalEmpty > 0 ? `
              <div class="grid grid-cols-2 gap-3 mt-4">
                <div class="rounded-lg p-3 bg-brand-50 border border-brand-200 text-center">
                  <div class="text-xs text-gray-600">📦 ભરેલી આપી</div>
                  <div class="text-lg font-bold text-brand-700">${totalFull}</div>
                </div>
                <div class="rounded-lg p-3 bg-accent-50 border border-accent-200 text-center">
                  <div class="text-xs text-gray-600">📦 ખાલી લીધી</div>
                  <div class="text-lg font-bold text-accent-700">${totalEmpty}</div>
                </div>
              </div>
            ` : ''}

            <div class="text-center mt-6 pt-4 border-t border-gray-200">
              <p class="text-xs text-gray-400">આ બિલ 💧 ${bizName} દ્વારા જનરેટ કરવામાં આવ્યું છે</p>
              <p class="text-xs text-gray-400 mt-1">🙏 નિયમિત સહકાર બદલ આભાર!</p>
            </div>

            ${(() => {
              const upiId = settings?.upiId || 'manojbharwad@okaxis'
              const payeeName = settings?.payeeName || bizName
              const includeQr = settings?.includeQrInBill !== false
              if (includeQr && upiId && netDue > 0) {
                const qrUrl = `https://upiqr.in/api/qr?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}&am=${netDue}&cu=INR`
                return `
                <div class="text-center mt-4 p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <div class="text-xs font-semibold text-gray-600 mb-2">📲 UPI પેમેન્ટ કરો</div>
                  <img src="${qrUrl}" alt="UPI QR" class="mx-auto w-32 h-32 rounded-lg" />
                  <div class="text-xs text-gray-500 mt-2">UPI ID: ${upiId}</div>
                  <div class="text-sm font-bold text-brand-700 mt-1">₹${netDue}</div>
                </div>
                `
              }
              return ''
            })()}
          </div>
        </div>

        <div class="mt-4 flex gap-3 no-print">
          <button id="billPrintBtn"
            class="flex-1 py-3 rounded-xl bg-brand-600 text-white font-semibold shadow-lg btn-press text-sm">📥 PDF ડાઉનલોડ</button>
          <button id="billShareBtn"
            class="flex-1 py-3 rounded-xl bg-green-500 text-white font-semibold shadow-lg btn-press text-sm">📲 WhatsApp પર મોકલો</button>
        </div>
      </div>
    </div>
  `
}

export function initBillView(query) {
  const params = parseQuery(query)
  const { customers } = getState()
  const customer = customers.find((c) => c.id === params.id)
  const monthName = params.month ? MONTHS[parseInt(params.month, 10) - 1] || '' : ''

  const printBtn = document.getElementById('billPrintBtn')
  const shareBtn = document.getElementById('billShareBtn')
  const billArea = document.querySelector('.bill-print-area') || document.querySelector('.bg-white.rounded-2xl.shadow-lg')

  if (printBtn && billArea) {
    printBtn.addEventListener('click', async () => {
      printBtn.disabled = true
      printBtn.textContent = 'બનાવી રહ્યું છે...'
      try {
        const fileName = `${customer?.name || 'bill'}_${monthName}_${params.year}.pdf`.replace(/[^a-zA-Z0-9_\-.]/g, '_')
        await generateBillPDF(billArea, fileName)
      } catch (err) { alert('PDF ભૂલ: ' + err.message) }
      printBtn.disabled = false
      printBtn.textContent = '📥 PDF ડાઉનલોડ'
    })
  }

  if (shareBtn && billArea) {
    shareBtn.addEventListener('click', async () => {
      shareBtn.disabled = true
      shareBtn.textContent = 'બનાવી રહ્યું છે...'
      try {
        const fileName = `${customer?.name || 'bill'}_${monthName}_${params.year}.pdf`.replace(/[^a-zA-Z0-9_\-.]/g, '_')
        const waMsg = `💧 ઠાકરધણી વોટર સપ્લાય 💧\n👤 ${customer?.name || ''} - ${monthName} ${params.year}\n📄 બિલ PDF જોડે છે.`
        const shared = await sharePDFFile(billArea, fileName, waMsg)
        if (!shared) {
          const waUrl = `https://wa.me/${(customer?.phone || '').replace(/\D/g, '')}?text=${encodeURIComponent(waMsg)}`
          window.open(waUrl, '_blank')
        }
      } catch (err) { alert('શેર ભૂલ: ' + err.message) }
      shareBtn.disabled = false
      shareBtn.textContent = '📲 WhatsApp પર મોકલો'
    })
  }
}

function buildWhatsAppShareLink(customerId, month, year) {
  const { customers, deliveries, settings } = getState()
  const customer = customers.find((c) => c.id === customerId)
  if (!customer) return '#'

  const bizName = settings?.bizName || 'ઠાકરધણી વોટર સપ્લાય'
  const prefix = `${year}-${month}`
  const allDeliveries = deliveries.filter((d) => d.customerId === customerId).sort((a, b) => (a.date || '').localeCompare(b.date || ''))
  const monthDeliveries = allDeliveries.filter((d) => (d.date || '').startsWith(prefix))
  const beforeDeliveries = allDeliveries.filter((d) => (d.date || '') < prefix)

  const customerRate = customer.defaultRate || settings?.defaultRate || 20
  const monthBill = monthDeliveries.reduce((s, d) => s + num(d.full) * num(d.rate || customerRate), 0)
  const totalPaid = monthDeliveries.reduce((s, d) => s + num(d.paid), 0)
  const totalFull = monthDeliveries.reduce((s, d) => s + num(d.full), 0)
  const previousBalance = beforeDeliveries.reduce((s, d) => s + num(d.due), 0)
  const netDue = previousBalance + monthBill - totalPaid

  const monthName = MONTHS[parseInt(month, 10) - 1] || ''
  const billUrl = `${window.location.origin}${window.location.pathname}#/bill?id=${customerId}&month=${month}&year=${year}`

  let msg = `💧 *${bizName}* 💧\n----------------------------------\n`
  msg += `👤 *ગ્રાહક:* ${customer.name}\n`
  msg += `📅 *મહિનો:* ${monthName} ${year}\n`
  msg += `----------------------------------\n`
  msg += `📦 *ભરેલી આપી:* ${totalFull} નંગ\n`
  msg += `📜 *પાછલી બાકી:* ₹${previousBalance}\n`
  msg += `💳 *આ મહિનાનું બિલ:* ₹${monthBill}\n`
  msg += `💵 *જમા થયેલ:* ₹${totalPaid}\n`
  msg += `⚖️ *ચોખ્ખી બાકી:* ₹${netDue}\n`
  msg += `----------------------------------\n`
  msg += `📄 *વિગતવાર બિલ જોવા અહીં ક્લિક કરો:*\n${billUrl}\n`
  msg += `----------------------------------\n`
  msg += `🙏 નિયમિત સહકાર બદલ આભાર!`

  return `https://wa.me/${(customer.phone || '').replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`
}
