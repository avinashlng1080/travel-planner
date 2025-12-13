import { WEATHER_INFO } from '../../data/tripData';

const rainProbability = [
  { time: 'Morning (7am-12pm)', probability: 'Low (10-20%)', icon: 'Sun', recommendation: 'Best time for outdoor activities!' },
  { time: 'Afternoon (12pm-5pm)', probability: 'High (60-70%)', icon: 'Cloud', recommendation: 'Plan indoor activities or be ready for rain' },
  { time: 'Evening (5pm-10pm)', probability: 'Medium (30-40%)', icon: 'CloudSun', recommendation: 'Usually clears up after afternoon rain' },
];

const packingList = {
  essential: [
    'Light rain jacket or compact umbrella',
    'Sunscreen SPF 30+ (waterproof)',
    'Insect repellent with DEET 20%+',
    'Breathable, lightweight clothing',
    'Sun hat with wide brim',
    'Sunglasses',
  ],
  cameron: [
    'Warm jacket or fleece (15-20C)',
    'Long pants and long sleeves',
    'Warm clothes for toddler (especially at night)',
    'Light rain jacket (showers possible)',
  ],
};

export default function WeatherInfo() {
  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-4">
      <div className="bg-gradient-to-r from-cyan-600 to-blue-600 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
          Weather Information
        </h1>
        <p className="text-cyan-100">Expected weather for Dec 21, 2025 - Jan 6, 2026</p>
      </div>

      <div className="bg-white rounded-lg p-6 shadow-lg">
        <h2 className="text-xl font-bold text-slate-900 mb-4">Weather Overview</h2>
        <p className="text-slate-600 mb-6">{WEATHER_INFO.summary}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-orange-900/30 to-amber-900/30 border border-orange-700 rounded-lg p-5">
            <h3 className="text-lg font-semibold text-slate-900 mb-3">Kuala Lumpur</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Temperature:</span>
                <span className="font-semibold text-orange-300">{WEATHER_INFO.klWeather.temperature}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Humidity:</span>
                <span className="font-semibold text-cyan-300">{WEATHER_INFO.klWeather.humidity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Rainfall:</span>
                <span className="font-semibold text-blue-300">{WEATHER_INFO.klWeather.rainfall}</span>
              </div>
            </div>
            <p className="text-xs text-slate-600 mt-4 pt-4 border-t border-orange-700/50">
              {WEATHER_INFO.klWeather.recommendation}
            </p>
          </div>

          <div className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 border border-green-700 rounded-lg p-5">
            <h3 className="text-lg font-semibold text-slate-900 mb-3">Cameron Highlands</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Temperature:</span>
                <span className="font-semibold text-green-300">{WEATHER_INFO.cameronWeather.temperature}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Humidity:</span>
                <span className="font-semibold text-cyan-300">{WEATHER_INFO.cameronWeather.humidity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Rainfall:</span>
                <span className="font-semibold text-blue-300">{WEATHER_INFO.cameronWeather.rainfall}</span>
              </div>
            </div>
            <p className="text-xs text-slate-600 mt-4 pt-4 border-t border-green-700/50">
              {WEATHER_INFO.cameronWeather.recommendation}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg p-6 shadow-lg">
        <h2 className="text-xl font-bold text-slate-900 mb-4">Rain Probability by Time of Day</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {rainProbability.map((period, index) => (
            <div key={index} className="bg-white border border-slate-200 rounded-lg p-4">
              <h3 className="font-semibold text-slate-900 text-center mb-2">{period.time}</h3>
              <p className="text-cyan-400 text-center font-medium mb-3">{period.probability}</p>
              <p className="text-xs text-slate-600 text-center">{period.recommendation}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 bg-blue-900/30 border border-blue-700 rounded-lg p-4">
          <p className="text-sm text-blue-100">
            <strong>Pro Tip:</strong> Afternoon showers (2-4pm) are typically brief but heavy. Plan indoor activities during this time or schedule nap time.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg p-6 shadow-lg">
        <h2 className="text-xl font-bold text-slate-900 mb-4">What to Pack</h2>
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-slate-900 mb-3">Essential for Kuala Lumpur</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {packingList.essential.map((item, index) => (
                <div key={index} className="bg-white border border-slate-200 rounded-lg p-3 flex items-center gap-3">
                  <span className="text-green-400 flex-shrink-0">OK</span>
                  <span className="text-sm text-slate-600">{item}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 mb-3">Additional for Cameron Highlands (Dec 26-29)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {packingList.cameron.map((item, index) => (
                <div key={index} className="bg-green-900/20 border border-green-800 rounded-lg p-3 flex items-center gap-3">
                  <span className="text-green-400 flex-shrink-0">OK</span>
                  <span className="text-sm text-slate-600">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-amber-900/30 border-2 border-amber-600 rounded-lg p-6">
        <h3 className="font-bold text-amber-400 text-lg mb-2">Monsoon Season Notice</h3>
        <p className="text-amber-100 text-sm mb-3">
          December-January is monsoon season on Malaysia's <strong>East Coast</strong>. Heavy flooding can occur.
        </p>
        <p className="text-amber-100 text-sm">
          <strong>Good news:</strong> Your entire trip is on the <strong>West Coast</strong>. This is the BEST time to visit - dry season with occasional brief afternoon showers.
        </p>
      </div>
    </div>
  );
}
