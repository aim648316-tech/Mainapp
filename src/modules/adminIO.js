import { getState } from '../store.js'
import { addRecord, num, formatDate } from '../utils.js'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'

export function exportExcel() {
  const { customers, deliveries, routes, vehicles, vehicleExpenses } = getState()

  // Sheet 1: Deliveries
  const deliveryData = deliveries.map((d, i) => ({
    'Sr': i + 1,
    'Date': d.date || '',
    'Time': d.time || '',
    'Route': d.route || '',
    'Customer': d.customerName || '',
    'Full': num(d.full),
    'Empty': num(d.empty),
    'Rate': num(d.rate),
    'Paid': num(d.paid),
    'Due': num(d.due),
    'GPay': num(d.gpay),
    'Cash': num(d.cash),
    'Note': d.note || '',
  }))
  const wsDeliveries = XLSX.utils.json_to_sheet(deliveryData)

  // Sheet 2: Customers
  const customerData = customers.map((c, i) => ({
    'Sr': i + 1,
    'Name': c.name || '',
    'Phone': c.phone || '',
    'Route': c.route || '',
    'Rate': c.defaultRate || 20,
    'Pending Bottles': num(c.pendingBottles),
    'Pending Due': num(c.pendingDue),
  }))
  const wsCustomers = XLSX.utils.json_to_sheet(customerData)

  // Sheet 3: Vehicle Expenses
  const expenseData = vehicleExpenses.map((e, i) => ({
    'Sr': i + 1,
    'Date': e.date || '',
    'Time': e.time || '',
    'Vehicle': e.vehicleName || '',
    'Fuel Type': e.fuelType || '',
    'Fuel Qty (L)': num(e.fuelQty),
    'Fuel Rate': num(e.fuelRate),
    'Fuel Cost': num(e.fuelCost),
    'Mileage (km/L)': num(e.mileage),
    'KM': num(e.km),
    'Other Cost': num(e.otherCost),
    'Note': e.note || '',
  }))
  const wsExpenses = XLSX.utils.json_to_sheet(expenseData)

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, wsDeliveries, 'ડિલિવરી હિસાબ')
  XLSX.utils.book_append_sheet(wb, wsCustomers, 'ગ્રાહક ખાતાવહી')
  XLSX.utils.book_append_sheet(wb, wsExpenses, 'વાહન ખર્ચ')

  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  const dateStr = new Date().toISOString().split('T')[0]
  saveAs(new Blob([wbout], { type: 'application/octet-stream' }), `thakardhani-data-${dateStr}.xlsx`)
}

export async function syncToSheets() {
  const { settings, customers, deliveries, vehicles, vehicleExpenses } = getState()
  const webhookUrl = settings?.sheetsWebhookUrl
  if (!webhookUrl) {
    alert('Google Sheets Webhook URL સેટ નથી. Admin માં સેટ કરો.')
    return false
  }

  try {
    const deliveriesPayload = deliveries.map((d) => ({
      date: d.date || '', time: d.time || '', route: d.route || '',
      customer: d.customerName || '', full: num(d.full), empty: num(d.empty),
      rate: num(d.rate), paid: num(d.paid), due: num(d.due),
      gpay: num(d.gpay), cash: num(d.cash), note: d.note || '',
    }))

    const customersPayload = customers.map((c) => ({
      name: c.name || '', phone: c.phone || '', route: c.route || '',
      rate: c.defaultRate || 20, pendingBottles: num(c.pendingBottles), pendingDue: num(c.pendingDue),
    }))

    const expensesPayload = vehicleExpenses.map((e) => ({
      date: e.date || '', time: e.time || '', vehicle: e.vehicleName || '',
      fuelType: e.fuelType || '', fuelQty: num(e.fuelQty), fuelRate: num(e.fuelRate),
      fuelCost: num(e.fuelCost), mileage: num(e.mileage), km: num(e.km),
      otherCost: num(e.otherCost), note: e.note || '',
    }))

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deliveries: deliveriesPayload,
        customers: customersPayload,
        vehicleExpenses: expensesPayload,
        syncTime: new Date().toISOString(),
      }),
    })

    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    return true
  } catch (err) {
    alert('Sheets sync ભૂલ: ' + err.message)
    return false
  }
}

export function backupData() {
  const { customers, routes, deliveries, vehicles, vehicleExpenses } = getState()
  const data = { customers, routes, deliveries, vehicles, vehicleExpenses, backupDate: new Date().toISOString() }
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
    if (data.vehicles) {
      for (const v of data.vehicles) {
        await addRecord('vehicles', {
          name: v.name, fuelType: v.fuelType || 'Petrol',
          defaultFuelRate: num(v.defaultFuelRate), defaultMileage: num(v.defaultMileage),
          isDefault: v.isDefault || false,
        })
      }
    }
    if (data.vehicleExpenses) {
      for (const e of data.vehicleExpenses) {
        await addRecord('vehicle_expenses', {
          date: e.date, time: e.time || '', vehicleId: e.vehicleId || '',
          vehicleName: e.vehicleName || '', fuelType: e.fuelType || 'Petrol',
          fuelQty: num(e.fuelQty), fuelRate: num(e.fuelRate), fuelCost: num(e.fuelCost),
          mileage: num(e.mileage), km: num(e.km), otherCost: num(e.otherCost), note: e.note || '',
        })
      }
    }
    alert('✅ ડેટા રિસ્ટોર થયો!')
  } catch (err) { alert('ભૂલ: ' + err.message) }
}
