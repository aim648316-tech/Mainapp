export function renderAiAssistant() {
  const guides = [
    { icon: '📝', title: 'નવી એન્ટ્રી', desc: 'દરરોજની ડિલિવરી દાખલ કરો. ગ્રાહક પસંદ કરો, ભરેલી અને ખાલી બોટલ નંબર લખો, રોકડા મળ્યા તો દાખલ કરો. બાકી આપમેળે ગણાઈ જશે.' },
    { icon: '📊', title: 'Daily Report', desc: 'કોઈપણ તારીખ અને રૂટ મુજબનો રિપોર્ટ જુઓ. ટોટલ ભરેલી, ખાલી, રોકડા અને બાકી એક નજરમાં.' },
    { icon: '📋', title: 'Entry List', desc: 'બધી જ એન્ટ્રી તારીખ મુજબ જૂથમાં જુઓ. રૂટ અને ગ્રાહક ફિલ્ટર વાપરો. ખોટી એન્ટ્રી પિન સાથે સુરક્ષિત રીતે ડિલીટ કરો.' },
    { icon: '📒', title: 'ખાતાવહી', desc: 'દરેક ગ્રાહકની બાકી બોટલ અને બાકી રકમ જુઓ. WhatsApp પર બિલ સીધી મોકલો.' },
    { icon: '🧮', title: 'કેલ્ક્યુલેટર', desc: 'બોટલ સંખ્યા × રેટ = ટોટલ. ઝડપથી ગણતરી કરો.' },
    { icon: '⚙️', title: 'Admin Panel', desc: 'નવો રૂટ અને ગ્રાહક ઉમેરો, ગ્રાહક સંપાદિત કરો અથવા ડિલીટ કરો. એક્સેલ એક્સપોર્ટ અને બેકઅપ/રિસ્ટોર સુવિધા.' },
  ]

  return `
    <div class="max-w-3xl mx-auto p-4 space-y-3 fade-in">
      <div class="bg-gradient-to-br from-brand-600 to-brand-800 rounded-2xl p-5 text-white shadow-lg">
        <div class="flex items-center gap-3 mb-2">
          <span class="text-3xl">🤖</span>
          <div>
            <h2 class="text-lg font-bold">AI સહાયક</h2>
            <p class="text-sm text-brand-100">એપનો ઉપયોગ કેવી રીતે કરવો - સરળ માર્ગદર્શન</p>
          </div>
        </div>
      </div>
      ${guides.map((g) => `
        <div class="bg-white rounded-2xl shadow-sm p-4 card-hover">
          <div class="flex gap-3">
            <div class="text-2xl">${g.icon}</div>
            <div>
              <div class="font-bold text-gray-800">${g.title}</div>
              <div class="text-sm text-gray-600 mt-1">${g.desc}</div>
            </div>
          </div>
        </div>
      `).join('')}
      <div class="bg-white rounded-2xl shadow-sm p-4">
        <div class="text-sm text-gray-600 leading-relaxed">
          <strong class="text-gray-800">સંપર્ક:</strong> મનોજ ભરવાડ<br/>
          કોઈપણ મુશ્કેલી માટે સંપર્ક કરો. આ એપ તમારી ડિલિવરી વ્યવસ્થા સરળ બનાવવા માટે બનાવેલ છે.
        </div>
      </div>
    </div>
  `
}

export function initAiAssistant() {}
