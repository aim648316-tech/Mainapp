import { getState } from '../store.js'
import { addRecord, num } from '../utils.js'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'

export function exportExcel() {
  const { customers } = getState()
  const data = customers.map((c, i) => ({
    'Sr': i + 1,
    'Name': c.name || '',
    'Phone': c.phone || '',
    'Route': c.route || '',
    'Rate': c.defaultRate || 20,
    'Pending Bottles': num(c.pendingBottles),
    'Pending Due': num(c.pendingDue),
  }))
  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Customers')
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  saveAs(new Blob([wbout], { type: 'application/octet-stream' }), 'customers.xlsx')
}

export function backupData() {
  const { customers, routes, deliveries } = getState()
  const data = { customers, routes, deliveries, backupDate: new Date().toISOString() }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  saveAs(blob, `thakardhani-backup-${Date.now()}.json`)
}

export async function restoreData(file) {
  if (!file) return
  const text = await file.text()
  let data
  try { data = JSON.parse(text) } catch { alert('ખોટી ફાઈલ!'); return }
  if (!confirm('ડેટા રિસ્ટોર કરવો છે? આ નવો ડેટા ઉમેરશે.')) return
  try {
    if (data.routes) {
      for (const r of data.routes) {
        await addRecord('routes', { name: r.name })
      }
    }
    if (data.customers) {
      for (const c of data.customers) {
        await addRecord('customers', {
          name: c.name, phone: c.phone || '',
          defaultRate: c.defaultRate || 20, route: c.route || '',
          pendingBottles: num(c.pendingBottles), pendingDue: num(c.pendingDue),
        })
      }
    }
    if (data.deliveries) {
      for (const d of data.deliveries) {
        await addRecord('deliveries', {
          date: d.date, time: d.time || '', route: d.route || '',
          customerId: d.customerId || '', customerName: d.customerName || '',
          full: num(d.full), empty: num(d.empty), paid: num(d.paid),
          due: num(d.due), rate: num(d.rate),
        })
      }
    }
    alert('✅ ડેટા રિસ્ટોર થયો!')
  } catch (err) { alert('ભૂલ: ' + err.message) }
}
