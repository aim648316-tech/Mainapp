import { fetchSettings } from '../utils.js'
import { updateSettings } from '../store.js'

const DEFAULT_USERNAME = 'Manoj'
const DEFAULT_PASSWORD = '1234'

export function renderLogin(onSuccess) {
  return `
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-700 via-brand-600 to-brand-800 p-4">
      <div class="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 modal-in">
        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 mb-4 shadow-lg">
            <span class="text-4xl">💧</span>
          </div>
          <h1 class="text-2xl font-bold text-gray-800">Thakardhani Water</h1>
          <p class="text-gray-500 text-sm mt-1">Water Supply Management</p>
        </div>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input id="loginUser" type="text" autocomplete="off"
              class="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-brand-500 transition-colors text-gray-800"
              placeholder="Enter username" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input id="loginPass" type="password" autocomplete="off"
              class="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-brand-500 transition-colors text-gray-800"
              placeholder="Enter password" />
          </div>
          <p id="loginError" class="text-red-500 text-sm hidden"></p>
          <button id="loginBtn"
            class="w-full py-3.5 rounded-xl bg-gradient-to-r from-brand-500 to-brand-700 text-white font-semibold shadow-lg btn-press hover:shadow-xl transition-all">
            Login
          </button>
        </div>
      </div>
    </div>
  `
}

export async function initLogin(onSuccess) {
  const btn = document.getElementById('loginBtn')
  const userInput = document.getElementById('loginUser')
  const passInput = document.getElementById('loginPass')
  const errorEl = document.getElementById('loginError')
  const loadingEl = document.getElementById('loginBtn')

  loadingEl.textContent = '...'
  loadingEl.disabled = true
  const settings = await fetchSettings()
  loadingEl.textContent = 'Login'
  loadingEl.disabled = false

  const validUser = settings.appUsername || DEFAULT_USERNAME
  const validPass = settings.appPassword || DEFAULT_PASSWORD

  const doLogin = async () => {
    const user = userInput.value.trim()
    const pass = passInput.value.trim()
    if (user === validUser && pass === validPass) {
      errorEl.classList.add('hidden')
      updateSettings(settings)
      onSuccess()
    } else {
      errorEl.textContent = 'ખોટો યુઝરનેમ અથવા પાસવર્ડ!'
      errorEl.classList.remove('hidden')
      passInput.value = ''
    }
  }

  btn.addEventListener('click', doLogin)
  passInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') doLogin()
  })
  userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') passInput.focus()
  })
}
