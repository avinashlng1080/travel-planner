import { useTripStore } from '../../stores/tripStore';
import { X, MapPin, Clock, DollarSign, AlertCircle, Info, ExternalLink } from 'lucide-react';

const CATEGORY_COLORS: Record<string, string> = {
  'home-base': 'bg-pink-500',
  'toddler-friendly': 'bg-pink-400',
  'attraction': 'bg-green-500',
  'shopping': 'bg-purple-500',
  'restaurant': 'bg-amber-500',
  'nature': 'bg-green-400',
  'temple': 'bg-red-500',
  'playground': 'bg-cyan-500',
  'medical': 'bg-red-600',
};

export default function LocationDetail() {
  const { selectedLocation, selectLocation } = useTripStore();

  if (!selectedLocation) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-900 text-slate-400 p-8">
        <div className="text-center">
          <MapPin className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg">Select a location to view details</p>
        </div>
      </div>
    );
  }

  const openInMaps = () => {
    const url = `https://www.google.com/maps/search/?api=1&query=${selectedLocation.lat},${selectedLocation.lng}`;
    window.open(url, '_blank');
  };

  const categoryColor = CATEGORY_COLORS[selectedLocation.category] || 'bg-blue-500';

  return (
    <div className="h-full bg-slate-900 text-white overflow-y-auto">
      <div className="sticky top-0 bg-slate-800 border-b border-slate-700 p-4 flex items-start justify-between z-10">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className={`${categoryColor} px-2 py-1 rounded text-xs font-medium capitalize`}>
              {selectedLocation.category.replace('-', ' ')}
            </span>
            <div className="flex items-center gap-1 text-xs text-slate-400">
              <span>{selectedLocation.toddlerRating}/5</span>
              <span>toddler rating</span>
            </div>
          </div>
          <h2 className="text-2xl font-bold font-['Outfit']">{selectedLocation.name}</h2>
          <p className="text-slate-400 text-sm mt-1">{selectedLocation.city}</p>
        </div>
        <button
          onClick={() => selectLocation(null)}
          className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-4 space-y-6">
        <p className="text-slate-300 leading-relaxed">{selectedLocation.description}</p>

        {selectedLocation.address && (
          <div className="flex items-start gap-2">
            <MapPin className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold mb-1 text-sm text-slate-400 uppercase tracking-wide">Address</h3>
              <p className="text-slate-300">{selectedLocation.address}</p>
              <button
                onClick={openInMaps}
                className="mt-2 inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 text-sm transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Open in Google Maps
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-800 rounded-lg p-3">
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
              <Clock className="w-4 h-4" />
              <span>Duration</span>
            </div>
            <p className="text-white font-medium">{selectedLocation.estimatedDuration}</p>
          </div>
          <div className="bg-slate-800 rounded-lg p-3">
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
              <DollarSign className="w-4 h-4" />
              <span>Grab Cost</span>
            </div>
            <p className="text-white font-medium">{selectedLocation.grabEstimate}</p>
          </div>
          <div className="bg-slate-800 rounded-lg p-3">
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
              <MapPin className="w-4 h-4" />
              <span>Distance</span>
            </div>
            <p className="text-white font-medium">{selectedLocation.distanceFromBase}</p>
          </div>
          <div className="bg-slate-800 rounded-lg p-3">
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
              <Clock className="w-4 h-4" />
              <span>Drive Time</span>
            </div>
            <p className="text-white font-medium">{selectedLocation.drivingTime}</p>
          </div>
        </div>

        <div className="bg-slate-800 rounded-lg p-4">
          <h3 className="font-semibold mb-2 text-sm text-slate-400 uppercase tracking-wide">Opening Hours</h3>
          <p className="text-slate-300">{selectedLocation.openingHours}</p>
        </div>

        {selectedLocation.entranceFee && (
          <div className="bg-slate-800 rounded-lg p-4">
            <h3 className="font-semibold mb-2 text-sm text-slate-400 uppercase tracking-wide">Entrance Fee</h3>
            <p className="text-slate-300">{selectedLocation.entranceFee}</p>
          </div>
        )}

        {selectedLocation.dressCode && (
          <div className="bg-amber-900/30 border border-amber-700 rounded-lg p-4">
            <h3 className="font-semibold mb-2 text-amber-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Dress Code
            </h3>
            <p className="text-slate-300">{selectedLocation.dressCode}</p>
          </div>
        )}

        {selectedLocation.tips && selectedLocation.tips.length > 0 && (
          <div>
            <h3 className="font-semibold mb-3 text-sm text-slate-400 uppercase tracking-wide flex items-center gap-2">
              <Info className="w-4 h-4" />
              Tips
            </h3>
            <ul className="space-y-2">
              {selectedLocation.tips.map((tip, index) => (
                <li key={index} className="flex gap-2 text-slate-300">
                  <span className="text-cyan-400 flex-shrink-0">-</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {selectedLocation.warnings && selectedLocation.warnings.length > 0 && (
          <div className="bg-red-900/30 border border-red-700 rounded-lg p-4">
            <h3 className="font-semibold mb-3 text-red-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Warnings
            </h3>
            <ul className="space-y-2">
              {selectedLocation.warnings.map((warning, index) => (
                <li key={index} className="flex gap-2 text-slate-300">
                  <span className="text-red-400 flex-shrink-0">!</span>
                  <span>{warning}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {selectedLocation.whatToBring && selectedLocation.whatToBring.length > 0 && (
          <div>
            <h3 className="font-semibold mb-2 text-sm text-slate-400 uppercase tracking-wide">What to Bring</h3>
            <div className="flex flex-wrap gap-2">
              {selectedLocation.whatToBring.map((item, index) => (
                <span key={index} className="bg-green-900/30 text-green-300 px-3 py-1 rounded-full text-sm">
                  {item}
                </span>
              ))}
            </div>
          </div>
        )}

        <div>
          <h3 className="font-semibold mb-2 text-sm text-slate-400 uppercase tracking-wide">Best Time to Visit</h3>
          <div className="flex flex-wrap gap-2">
            {selectedLocation.bestTimeToVisit.map((time, index) => (
              <span key={index} className="bg-slate-800 text-slate-300 px-3 py-1 rounded-full text-sm">
                {time}
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm">
          <span className="text-slate-400">Environment:</span>
          <span className={`px-3 py-1 rounded-full ${selectedLocation.isIndoor ? 'bg-blue-900/30 text-blue-300' : 'bg-green-900/30 text-green-300'}`}>
            {selectedLocation.isIndoor ? 'Indoor' : 'Outdoor'}
          </span>
        </div>
      </div>
    </div>
  );
}
