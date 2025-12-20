import { SAFETY_INFO } from '../../data/tripData';

const emergencyContacts = [
  { name: 'Police', number: '999', icon: 'police', description: 'For emergencies and crime', color: 'blue' },
  { name: 'Ambulance', number: '999', icon: 'ambulance', description: 'Medical emergencies', color: 'red' },
  { name: 'Fire Department', number: '994', icon: 'fire', description: 'Fire and rescue', color: 'orange' },
  { name: 'Tourist Police', number: SAFETY_INFO.emergencyNumbers.tourist_police, icon: 'tourist', description: 'Tourism-related assistance', color: 'cyan' },
  { name: 'US Embassy', number: SAFETY_INFO.emergencyNumbers.us_embassy, icon: 'embassy', description: 'American citizen services', color: 'purple' },
];

const hospitals = [
  {
    name: 'Sunway Medical Centre Velocity',
    address: 'Lingkaran SV, Sunway Velocity, 55100 KL',
    distance: '800m from home base',
    phone: '+60 3-9772 9191',
    services: '24/7 Pediatric Emergency',
  },
  {
    name: 'Gleneagles Hospital KL',
    address: '286 & 288, Jalan Ampang, 50450 KL',
    distance: '6km from home base',
    phone: '+60 3-4141 3000',
    services: 'Premium pediatric care',
  },
];

const getColorClasses = (color: string) => {
  const colors: Record<string, { bg: string; border: string; text: string }> = {
    blue: { bg: 'bg-blue-900/30', border: 'border-blue-700', text: 'text-blue-400' },
    red: { bg: 'bg-red-900/40', border: 'border-red-600', text: 'text-red-400' },
    orange: { bg: 'bg-orange-900/30', border: 'border-orange-700', text: 'text-orange-400' },
    cyan: { bg: 'bg-cyan-900/30', border: 'border-cyan-700', text: 'text-cyan-400' },
    purple: { bg: 'bg-purple-900/30', border: 'border-purple-700', text: 'text-purple-400' },
  };
  return colors[color] ?? colors.blue;
};

export default function EmergencyNumbers() {

  return (
    <div className="space-y-6">
      <div className="bg-red-950/50 border-2 border-red-600 rounded-lg p-6 shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">Emergency</span>
          <h2 className="text-xl font-bold text-white">Emergency Numbers</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {emergencyContacts.map((contact) => {
            const colorClasses = getColorClasses(contact.color);
            return (
              <a
                key={contact.name}
                href={`tel:${contact.number.replace(/\s/g, '')}`}
                className={`${colorClasses.bg} border ${colorClasses.border} rounded-lg p-4 hover:opacity-80 transition-opacity`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-semibold ${colorClasses.text} mb-1`}>{contact.name}</h3>
                    <p className="text-2xl font-bold text-slate-900 mb-1">{contact.number}</p>
                    <p className="text-sm text-slate-600">{contact.description}</p>
                  </div>
                </div>
              </a>
            );
          })}
        </div>

        <div className="mt-4 bg-red-900/30 rounded-lg p-4">
          <p className="text-sm text-red-100 flex items-start gap-2">
            <span className="flex-shrink-0 mt-0.5">Tip:</span>
            <span>Tap any number to call directly. Save these numbers in your phone before your trip.</span>
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg p-6 shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">Hospital</span>
          <h2 className="text-xl font-bold text-slate-900">Nearby Hospitals</h2>
        </div>

        <div className="space-y-4">
          {hospitals.map((hospital, index) => (
            <div key={index} className="bg-white border border-slate-200 rounded-lg p-4">
              <h3 className="font-semibold text-slate-900 mb-2">{hospital.name}</h3>
              <div className="space-y-2 text-sm">
                <p className="text-slate-600">
                  <span className="text-slate-500">Address:</span> {hospital.address}
                </p>
                <p className="text-slate-600">
                  <span className="text-slate-500">Distance:</span>{' '}
                  <span className="text-green-400">{hospital.distance}</span>
                </p>
                <p className="text-slate-600">
                  <span className="text-slate-500">Services:</span> {hospital.services}
                </p>
                <a
                  href={`tel:${hospital.phone.replace(/\s/g, '')}`}
                  className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 font-medium"
                >
                  Phone: {hospital.phone}
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
