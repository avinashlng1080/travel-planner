import { useState } from 'react';
import { SAFETY_INFO } from '../../data/tripData';
import EmergencyNumbers from './EmergencyNumbers';
import { ChevronDown, ChevronRight } from 'lucide-react';

export default function SafetyPanel() {
  const [expandedSection, setExpandedSection] = useState<string | null>('emergency');

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-4">
      <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Safety & Emergency Information</h1>
        <p className="text-red-100">Important contacts and safety tips for your Malaysia trip</p>
      </div>

      <EmergencyNumbers />

      {/* Health Tips */}
      <div className="bg-white rounded-lg overflow-hidden shadow-lg">
        <button
          onClick={() => toggleSection('health')}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-100 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">Health</span>
            <div className="text-left">
              <h2 className="text-lg font-semibold text-slate-900">Health & Safety Tips</h2>
              <p className="text-sm text-slate-600">Stay healthy during your trip</p>
            </div>
          </div>
          {expandedSection === 'health' ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
        </button>

        {expandedSection === 'health' && (
          <div className="px-6 pb-6">
            <ul className="space-y-3">
              {SAFETY_INFO.healthTips.map((tip, index) => (
                <li key={index} className="flex items-start gap-3 text-slate-600">
                  <span className="text-cyan-400 mt-1 flex-shrink-0">-</span>
                  <span className="text-sm">{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Scam Warnings */}
      <div className="bg-white rounded-lg overflow-hidden shadow-lg">
        <button
          onClick={() => toggleSection('scams')}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-100 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">Warning</span>
            <div className="text-left">
              <h2 className="text-lg font-semibold text-slate-900">Common Scams & Safety</h2>
              <p className="text-sm text-slate-600">Stay alert and informed</p>
            </div>
          </div>
          {expandedSection === 'scams' ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
        </button>

        {expandedSection === 'scams' && (
          <div className="px-6 pb-6">
            <ul className="space-y-3">
              {SAFETY_INFO.scamWarnings.map((warning, index) => (
                <li key={index} className="flex items-start gap-3 text-slate-600">
                  <span className="text-red-400 mt-1 flex-shrink-0">!</span>
                  <span className="text-sm">{warning}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Cultural Etiquette */}
      <div className="bg-white rounded-lg overflow-hidden shadow-lg">
        <button
          onClick={() => toggleSection('culture')}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-100 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">Culture</span>
            <div className="text-left">
              <h2 className="text-lg font-semibold text-slate-900">Cultural Etiquette</h2>
              <p className="text-sm text-slate-600">Respect local customs</p>
            </div>
          </div>
          {expandedSection === 'culture' ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
        </button>

        {expandedSection === 'culture' && (
          <div className="px-6 pb-6">
            <ul className="space-y-3">
              {SAFETY_INFO.culturalEtiquette.map((tip, index) => (
                <li key={index} className="flex items-start gap-3 text-slate-600">
                  <span className="text-purple-400 mt-1 flex-shrink-0">OK</span>
                  <span className="text-sm">{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Toddler Safety */}
      <div className="bg-white rounded-lg overflow-hidden shadow-lg">
        <button
          onClick={() => toggleSection('toddler')}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-100 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">Baby</span>
            <div className="text-left">
              <h2 className="text-lg font-semibold text-slate-900">Toddler Safety Reminders</h2>
              <p className="text-sm text-slate-600">Keep your little one safe</p>
            </div>
          </div>
          {expandedSection === 'toddler' ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
        </button>

        {expandedSection === 'toddler' && (
          <div className="px-6 pb-6">
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-slate-600">
                <span className="text-pink-400 mt-1 flex-shrink-0">-</span>
                <span className="text-sm"><strong>Hydration:</strong> Carry water bottle at all times. Tropical heat causes rapid dehydration.</span>
              </li>
              <li className="flex items-start gap-3 text-slate-600">
                <span className="text-pink-400 mt-1 flex-shrink-0">-</span>
                <span className="text-sm"><strong>Sun Protection:</strong> Apply sunscreen (SPF 30+) every 2 hours. Use hat and lightweight long sleeves.</span>
              </li>
              <li className="flex items-start gap-3 text-slate-600">
                <span className="text-pink-400 mt-1 flex-shrink-0">-</span>
                <span className="text-sm"><strong>Mosquitoes:</strong> Use DEET 20%+ repellent. Dengue fever risk in Malaysia.</span>
              </li>
              <li className="flex items-start gap-3 text-slate-600">
                <span className="text-pink-400 mt-1 flex-shrink-0">-</span>
                <span className="text-sm"><strong>Food Safety:</strong> Bottled water only. Avoid ice unless from reputable hotels.</span>
              </li>
              <li className="flex items-start gap-3 text-slate-600">
                <span className="text-pink-400 mt-1 flex-shrink-0">-</span>
                <span className="text-sm"><strong>Crowds:</strong> Use baby carrier in crowded places. Keep ID on child.</span>
              </li>
              <li className="flex items-start gap-3 text-slate-600">
                <span className="text-pink-400 mt-1 flex-shrink-0">-</span>
                <span className="text-sm"><strong>Nap Schedule:</strong> Prioritize naps. Overtired toddlers get sick easier.</span>
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
