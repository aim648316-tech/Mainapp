import { watchCollection, sortByOrder, fetchSettings } from './utils.js'

let routes = []
let customers = []
let deliveries = []
let settings = {}

const listeners = new Set()

export function getState() {
  return { routes, customers, deliveries, settings }
}

export function notify() {
  listeners.forEach((fn) => fn(getState()))
}

export function subscribe(fn) {
  listeners.add(fn)
  fn(getState())
  return () => listeners.delete(fn)
}

let unsubRoutes, unsubCustomers, unsubDeliveries

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
}

export function updateSettings(s) {
  settings = { ...settings, ...s }
  notify()
}
