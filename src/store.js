import { watchCollection, sortByOrder, fetchSettings } from './utils.js'

let routes = []
let customers = []
let deliveries = []
let vehicles = []
let vehicleExpenses = []
let settings = {}

const listeners = new Set()

export function getState() {
  return { routes, customers, deliveries, vehicles, vehicleExpenses, settings }
}

export function notify() {
  listeners.forEach((fn) => fn(getState()))
}

export function subscribe(fn) {
  listeners.add(fn)
  fn(getState())
  return () => listeners.delete(fn)
}

export function setState(updates) {
  if (updates.routes !== undefined) routes = updates.routes
  if (updates.customers !== undefined) customers = updates.customers
  if (updates.deliveries !== undefined) deliveries = updates.deliveries
  if (updates.vehicles !== undefined) vehicles = updates.vehicles
  if (updates.vehicleExpenses !== undefined) vehicleExpenses = updates.vehicleExpenses
  notify()
}

let unsubRoutes, unsubCustomers, unsubDeliveries, unsubVehicles, unsubVehicleExpenses

export function initListeners() {
  if (unsubRoutes) return
  fetchSettings().then((s) => { settings = s; notify() }).catch(() => {})
  unsubRoutes = watchCollection('routes', null, (items) => {
    if (items) routes = items
    notify()
  })
  unsubCustomers = watchCollection('customers', null, (items) => {
    if (items) customers = sortByOrder(items)
    notify()
  })
  unsubDeliveries = watchCollection('deliveries', null, (items) => {
    if (items) deliveries = items
    notify()
  })
  unsubVehicles = watchCollection('vehicles', null, (items) => {
    if (items) vehicles = sortByOrder(items)
    notify()
  })
  unsubVehicleExpenses = watchCollection('vehicle_expenses', null, (items) => {
    if (items) vehicleExpenses = items
    notify()
  })
}

export function updateSettings(s) {
  settings = { ...settings, ...s }
  notify()
}
