import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MapPin, Plus, X, Filter, AlertTriangle, Cloud, Baby, Utensils, Hotel, Camera, ShoppingBag, Heart, Shield, ChevronDown, ChevronRight, Eye, EyeOff, Trash2, Edit2, Check, Navigation, Calendar, Info, Sun, CloudRain, Thermometer, Wind } from 'lucide-react';

// Category configuration with colors and icons
const CATEGORIES = {
  'toddler-friendly': { 
    color: '#FF6B9D', 
    bgColor: 'rgba(255, 107, 157, 0.15)',
    label: 'Toddler Friendly', 
    icon: Baby,
    description: 'Safe and fun for little ones'
  },
  'restaurant': { 
    color: '#F59E0B', 
    bgColor: 'rgba(245, 158, 11, 0.15)',
    label: 'Restaurant', 
    icon: Utensils,
    description: 'Family-friendly dining'
  },
  'hotel': { 
    color: '#3B82F6', 
    bgColor: 'rgba(59, 130, 246, 0.15)',
    label: 'Hotel', 
    icon: Hotel,
    description: 'Accommodation'
  },
  'attraction': { 
    color: '#10B981', 
    bgColor: 'rgba(16, 185, 129, 0.15)',
    label: 'Attraction', 
    icon: Camera,
    description: 'Tourist attractions'
  },
  'shopping': { 
    color: '#8B5CF6', 
    bgColor: 'rgba(139, 92, 246, 0.15)',
    label: 'Shopping', 
    icon: ShoppingBag,
    description: 'Markets and malls'
  },
  'medical': { 
    color: '#EF4444', 
    bgColor: 'rgba(239, 68, 68, 0.15)',
    label: 'Medical', 
    icon: Heart,
    description: 'Hospitals and pharmacies'
  },
  'safety-zone': { 
    color: '#06B6D4', 
    bgColor: 'rgba(6, 182, 212, 0.15)',
    label: 'Safe Zone', 
    icon: Shield,
    description: 'Recommended safe areas'
  },
  'avoid': { 
    color: '#DC2626', 
    bgColor: 'rgba(220, 38, 38, 0.15)',
    label: 'Avoid', 
    icon: AlertTriangle,
    description: 'Areas to avoid'
  }
};

// Pre-loaded toddler-friendly attractions in Malaysia
const INITIAL_LOCATIONS = [
  // Kuala Lumpur
  { id: 1, name: 'KL Bird Park', lat: 3.1424, lng: 101.6879, category: 'toddler-friendly', description: 'Free-flight aviary with hornbills, peacocks, and flamingos. Bird feeding sessions available.', city: 'Kuala Lumpur', planIds: ['main'] },
  { id: 2, name: 'Aquaria KLCC', lat: 3.1530, lng: 101.7115, category: 'toddler-friendly', description: 'Malaysia\'s longest underwater tunnel with 5,000 aquatic creatures.', city: 'Kuala Lumpur', planIds: ['main'] },
  { id: 3, name: 'KidZania Kuala Lumpur', lat: 3.0768, lng: 101.6072, category: 'toddler-friendly', description: 'Indoor educational theme park where kids roleplay different professions.', city: 'Kuala Lumpur', planIds: ['main'] },
  { id: 4, name: 'Petronas Twin Towers', lat: 3.1579, lng: 101.7116, category: 'attraction', description: 'Iconic twin towers with sky bridge and observation deck.', city: 'Kuala Lumpur', planIds: ['main'] },
  { id: 5, name: 'KLCC Park', lat: 3.1555, lng: 101.7119, category: 'toddler-friendly', description: 'Beautiful park with playground, wading pool for kids, and jogging paths.', city: 'Kuala Lumpur', planIds: ['main'] },
  { id: 6, name: 'National Science Centre', lat: 3.1603, lng: 101.7203, category: 'toddler-friendly', description: 'Interactive exhibits where toddlers can push buttons and experiment with magnets.', city: 'Kuala Lumpur', planIds: ['main'] },
  { id: 7, name: 'Farm Fresh Malaysia', lat: 3.0833, lng: 101.5500, category: 'toddler-friendly', description: 'Fun farm experience for little ones with fresh air and calming greens.', city: 'Kuala Lumpur', planIds: ['main'] },
  { id: 8, name: 'Sunway Lagoon', lat: 3.0725, lng: 101.6067, category: 'toddler-friendly', description: 'Theme park and waterpark complex with kid-friendly zones.', city: 'Kuala Lumpur', planIds: ['main', 'adventure'] },
  { id: 9, name: 'Batu Caves', lat: 3.2379, lng: 101.6840, category: 'attraction', description: 'Limestone hill with Hindu temples and 272 steps. Watch for monkeys!', city: 'Kuala Lumpur', planIds: ['main'] },
  
  // Penang
  { id: 10, name: 'Entopia (Butterfly Farm)', lat: 5.4510, lng: 100.2430, category: 'toddler-friendly', description: 'Interactive exhibits with butterflies and insects. Kids love chasing butterflies!', city: 'Penang', planIds: ['penang'] },
  { id: 11, name: 'Penang Hill', lat: 5.4243, lng: 100.2700, category: 'toddler-friendly', description: 'Funicular railway to the top with panoramic views and nature trails.', city: 'Penang', planIds: ['penang'] },
  { id: 12, name: 'Kek Lok Si Temple', lat: 5.3993, lng: 100.2731, category: 'attraction', description: 'Largest Buddhist temple in Malaysia with turtle feeding.', city: 'Penang', planIds: ['penang'] },
  { id: 13, name: 'Georgetown Street Art', lat: 5.4141, lng: 100.3288, category: 'attraction', description: 'Famous murals and street art throughout the UNESCO heritage area.', city: 'Penang', planIds: ['penang'] },
  { id: 14, name: 'ESCAPE Penang', lat: 5.2925, lng: 100.2508, category: 'toddler-friendly', description: 'Outdoor theme park with mazes, obstacle courses in rainforest setting.', city: 'Penang', planIds: ['penang', 'adventure'] },
  { id: 15, name: 'Hard Rock Hotel Penang', lat: 5.4688, lng: 100.2392, category: 'hotel', description: 'Beach resort with water park for kids and family-friendly amenities.', city: 'Penang', planIds: ['penang'] },
  
  // Langkawi
  { id: 16, name: 'Langkawi Cable Car', lat: 6.3730, lng: 99.6636, category: 'attraction', description: 'Scenic cable car to Mount Mat Cincang with stunning views.', city: 'Langkawi', planIds: ['langkawi'] },
  { id: 17, name: 'Underwater World Langkawi', lat: 6.2852, lng: 99.7255, category: 'toddler-friendly', description: 'Aquarium with walk-through tunnel and touch pools for kids.', city: 'Langkawi', planIds: ['langkawi'] },
  { id: 18, name: 'Kilim Geoforest Park', lat: 6.4291, lng: 99.8523, category: 'toddler-friendly', description: 'Mangrove boat tour through lush rivers and caves.', city: 'Langkawi', planIds: ['langkawi'] },
  
  // Melaka
  { id: 19, name: 'Jonker Street Night Market', lat: 2.1947, lng: 102.2485, category: 'shopping', description: 'Vibrant night market with street food and souvenirs. Friday-Sunday evenings.', city: 'Melaka', planIds: ['melaka'] },
  { id: 20, name: 'A Famosa Fort', lat: 2.1910, lng: 102.2472, category: 'attraction', description: 'Historic Portuguese fortress ruins, great for family photos.', city: 'Melaka', planIds: ['melaka'] },
  
  // Ipoh
  { id: 21, name: 'Lost World of Tambun', lat: 4.5728, lng: 101.1486, category: 'toddler-friendly', description: 'Malaysia\'s premier action and adventure family destination with water park.', city: 'Ipoh', planIds: ['ipoh', 'adventure'] },
  
  // Safety zones and warnings
  { id: 22, name: 'Eastern Sabah Coast', lat: 5.2831, lng: 118.3200, category: 'avoid', description: 'US State Dept advises increased caution due to kidnapping risk. Avoid non-essential travel.', city: 'Sabah', planIds: ['safety'] },
  
  // Medical facilities
  { id: 23, name: 'Gleneagles Hospital KL', lat: 3.1615, lng: 101.7329, category: 'medical', description: '24/7 emergency services with pediatric care.', city: 'Kuala Lumpur', planIds: ['main', 'safety'] },
  { id: 24, name: 'Penang General Hospital', lat: 5.4169, lng: 100.3135, category: 'medical', description: 'Government hospital with emergency services.', city: 'Penang', planIds: ['penang', 'safety'] },
];

// Travel plans
const INITIAL_PLANS = [
  { id: 'main', name: 'Kuala Lumpur Family Trip', color: '#FF6B9D', visible: true, description: 'Main KL attractions and toddler-friendly spots' },
  { id: 'penang', name: 'Penang Adventure', color: '#3B82F6', visible: true, description: 'Penang island exploration' },
  { id: 'langkawi', name: 'Langkawi Beach Days', color: '#10B981', visible: false, description: 'Beach and nature in Langkawi' },
  { id: 'melaka', name: 'Melaka Heritage', color: '#F59E0B', visible: false, description: 'Historical sites in Melaka' },
  { id: 'adventure', name: 'Theme Parks & Adventure', color: '#8B5CF6', visible: false, description: 'Water parks and theme parks' },
  { id: 'safety', name: 'Safety & Medical', color: '#EF4444', visible: true, description: 'Medical facilities and safety zones' },
];

// Weather data for different regions
const WEATHER_INFO = {
  'west-coast': {
    title: 'West Coast (KL, Penang, Langkawi, Melaka)',
    december: 'Mostly dry with occasional afternoon showers. Best conditions for beach and outdoor activities.',
    january: 'Dry season continues. Ideal weather for exploration.',
    temp: '24-32°C (75-90°F)',
    humidity: '80-85%',
    rainfall: 'Low to moderate',
    recommendation: '✅ RECOMMENDED for Dec 19 - Jan 6'
  },
  'east-coast': {
    title: 'East Coast (Terengganu, Perhentian, Redang)',
    december: 'Northeast monsoon brings heavy rain, rough seas, and closed resorts.',
    january: 'Monsoon continues. Many resorts closed. Ferry services suspended.',
    temp: '24-30°C (75-86°F)',
    humidity: '85-90%',
    rainfall: 'Very heavy (500mm+/month)',
    recommendation: '❌ AVOID during your travel dates'
  },
  'sabah': {
    title: 'Sabah (Borneo)',
    december: 'Wet season with frequent rain. Still visitable but expect showers.',
    january: 'Rainy season continues.',
    temp: '24-31°C (75-88°F)',
    humidity: '85%',
    rainfall: 'Heavy',
    recommendation: '⚠️ Possible but rainy. Eastern Sabah coast has travel advisory.'
  }
};

// Safety advisories
const SAFETY_INFO = {
  overall: {
    level: 1,
    title: 'Exercise Normal Precautions',
    description: 'Malaysia is rated Level 1 by US State Department - the lowest risk level.',
  },
  warnings: [
    {
      area: 'Eastern Sabah Coast',
      level: 2,
      description: 'Exercise Increased Caution due to kidnapping risk by terrorist and criminal groups.',
      action: 'Avoid non-essential travel to coastal areas from Sandakan to Tawau.'
    }
  ],
  tips: [
    'Enroll in Smart Traveler Enrollment Program (STEP)',
    'Keep copies of passport and important documents',
    'Use Grab app for safe, reliable taxi services',
    'Traffic flows on the LEFT - look RIGHT when crossing',
    'Carry original prescription for any medications',
    'Download offline maps for areas with limited connectivity'
  ],
  toddlerTips: [
    'Bring your own car seat - not provided by rental companies',
    'Pack insect repellent with 20%+ DEET for mosquito protection',
    'Stay hydrated - heat index can feel like 40°C (104°F)',
    'Many malls have excellent air-conditioned play areas',
    'Most restaurants are family-friendly and welcoming to children',
    'Travel insurance with MEDEVAC coverage strongly recommended'
  ]
};

// Google Maps component simulation (using Leaflet-style rendering)
const MapView = ({ locations, visibleCategories, visiblePlans, selectedLocation, onLocationSelect, mapCenter }) => {
  const mapRef = useRef(null);
  
  const filteredLocations = locations.filter(loc => 
    visibleCategories.includes(loc.category) &&
    loc.planIds.some(planId => visiblePlans.includes(planId))
  );
  
  // Calculate bounds for visible locations
  const bounds = filteredLocations.length > 0 ? {
    minLat: Math.min(...filteredLocations.map(l => l.lat)),
    maxLat: Math.max(...filteredLocations.map(l => l.lat)),
    minLng: Math.min(...filteredLocations.map(l => l.lng)),
    maxLng: Math.max(...filteredLocations.map(l => l.lng)),
  } : { minLat: 2.5, maxLat: 6.5, minLng: 99.5, maxLng: 103.5 };
  
  const centerLat = mapCenter?.lat || (bounds.minLat + bounds.maxLat) / 2;
  const centerLng = mapCenter?.lng || (bounds.minLng + bounds.maxLng) / 2;
  
  // Convert lat/lng to pixel position (simplified Mercator)
  const toPixel = (lat, lng, width, height) => {
    const latRange = Math.max(bounds.maxLat - bounds.minLat, 0.5);
    const lngRange = Math.max(bounds.maxLng - bounds.minLng, 0.5);
    const padding = 0.15;
    
    const x = ((lng - bounds.minLng + lngRange * padding) / (lngRange * (1 + 2 * padding))) * width;
    const y = ((bounds.maxLat - lat + latRange * padding) / (latRange * (1 + 2 * padding))) * height;
    
    return { x: Math.max(20, Math.min(width - 20, x)), y: Math.max(20, Math.min(height - 20, y)) };
  };
  
  return (
    <div className="relative w-full h-full bg-gradient-to-br from-slate-800 via-slate-700 to-slate-800 rounded-2xl overflow-hidden shadow-2xl">
      {/* Map background with grid */}
      <div className="absolute inset-0 opacity-20">
        <svg width="100%" height="100%">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>
      
      {/* Simplified Malaysia outline */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <path 
          d="M 15 35 Q 25 30 35 35 Q 45 32 55 38 Q 60 35 65 40 Q 70 38 75 42 L 75 55 Q 65 58 55 52 Q 45 55 35 50 Q 25 53 15 48 Z" 
          fill="rgba(16, 185, 129, 0.15)" 
          stroke="rgba(16, 185, 129, 0.4)"
          strokeWidth="0.5"
        />
      </svg>
      
      {/* Map markers */}
      <div className="absolute inset-0" ref={mapRef}>
        {filteredLocations.map((location) => {
          const { x, y } = toPixel(location.lat, location.lng, mapRef.current?.offsetWidth || 800, mapRef.current?.offsetHeight || 500);
          const CategoryIcon = CATEGORIES[location.category]?.icon || MapPin;
          const isSelected = selectedLocation?.id === location.id;
          const categoryColor = CATEGORIES[location.category]?.color || '#fff';
          
          return (
            <div
              key={location.id}
              className="absolute transform -translate-x-1/2 -translate-y-full transition-all duration-300 cursor-pointer z-10 hover:z-20"
              style={{ left: `${(x / (mapRef.current?.offsetWidth || 800)) * 100}%`, top: `${(y / (mapRef.current?.offsetHeight || 500)) * 100}%` }}
              onClick={() => onLocationSelect(location)}
            >
              <div 
                className={`relative group ${isSelected ? 'scale-125' : 'hover:scale-110'}`}
                style={{ transition: 'transform 0.2s ease-out' }}
              >
                {/* Pin shadow */}
                <div 
                  className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-3 h-1 rounded-full opacity-40"
                  style={{ backgroundColor: categoryColor, filter: 'blur(2px)' }}
                />
                
                {/* Pin body */}
                <div 
                  className={`relative flex items-center justify-center rounded-full shadow-lg ${isSelected ? 'ring-4 ring-white ring-opacity-50' : ''}`}
                  style={{ 
                    backgroundColor: categoryColor,
                    width: isSelected ? '36px' : '28px',
                    height: isSelected ? '36px' : '28px',
                    boxShadow: `0 4px 12px ${categoryColor}40`
                  }}
                >
                  <CategoryIcon size={isSelected ? 18 : 14} className="text-white" />
                </div>
                
                {/* Pin tip */}
                <div 
                  className="absolute left-1/2 transform -translate-x-1/2 w-0 h-0"
                  style={{
                    borderLeft: '6px solid transparent',
                    borderRight: '6px solid transparent',
                    borderTop: `8px solid ${categoryColor}`,
                    top: isSelected ? '34px' : '26px'
                  }}
                />
                
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                  <div className="bg-slate-900 text-white text-xs px-3 py-2 rounded-lg shadow-xl whitespace-nowrap max-w-[200px]">
                    <div className="font-semibold truncate">{location.name}</div>
                    <div className="text-slate-400 text-[10px]">{location.city}</div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Map legend */}
      <div className="absolute bottom-4 left-4 bg-slate-900/90 backdrop-blur-sm rounded-xl p-3 text-xs">
        <div className="text-slate-400 font-medium mb-2">Legend</div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          {Object.entries(CATEGORIES).filter(([key]) => visibleCategories.includes(key)).map(([key, cat]) => (
            <div key={key} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
              <span className="text-slate-300">{cat.label}</span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Location count */}
      <div className="absolute top-4 right-4 bg-slate-900/90 backdrop-blur-sm rounded-xl px-4 py-2">
        <span className="text-white font-bold">{filteredLocations.length}</span>
        <span className="text-slate-400 ml-1">locations</span>
      </div>
    </div>
  );
};

// Location detail panel
const LocationDetail = ({ location, onClose, onEdit, plans }) => {
  if (!location) return null;
  
  const category = CATEGORIES[location.category];
  const CategoryIcon = category?.icon || MapPin;
  const locationPlans = plans.filter(p => location.planIds.includes(p.id));
  
  return (
    <div className="bg-slate-800/95 backdrop-blur-sm rounded-2xl p-5 shadow-2xl border border-slate-700">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: category?.bgColor }}
          >
            <CategoryIcon size={24} style={{ color: category?.color }} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">{location.name}</h3>
            <p className="text-sm text-slate-400">{location.city}</p>
          </div>
        </div>
        <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
          <X size={20} />
        </button>
      </div>
      
      <p className="text-slate-300 text-sm mb-4 leading-relaxed">{location.description}</p>
      
      <div className="flex flex-wrap gap-2 mb-4">
        <span 
          className="px-3 py-1 rounded-full text-xs font-medium"
          style={{ backgroundColor: category?.bgColor, color: category?.color }}
        >
          {category?.label}
        </span>
        {locationPlans.map(plan => (
          <span 
            key={plan.id}
            className="px-3 py-1 rounded-full text-xs font-medium bg-slate-700 text-slate-300"
          >
            {plan.name}
          </span>
        ))}
      </div>
      
      <div className="flex gap-2">
        <a 
          href={`https://www.google.com/maps/search/?api=1&query=${location.lat},${location.lng}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white py-2 px-4 rounded-xl text-sm font-medium transition-colors"
        >
          <Navigation size={16} />
          Open in Maps
        </a>
        <button 
          onClick={() => onEdit(location)}
          className="flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-white py-2 px-4 rounded-xl text-sm font-medium transition-colors"
        >
          <Edit2 size={16} />
        </button>
      </div>
    </div>
  );
};

// Add location form
const AddLocationForm = ({ onAdd, onCancel, plans, editLocation }) => {
  const [name, setName] = useState(editLocation?.name || '');
  const [lat, setLat] = useState(editLocation?.lat?.toString() || '');
  const [lng, setLng] = useState(editLocation?.lng?.toString() || '');
  const [category, setCategory] = useState(editLocation?.category || 'attraction');
  const [description, setDescription] = useState(editLocation?.description || '');
  const [city, setCity] = useState(editLocation?.city || '');
  const [selectedPlans, setSelectedPlans] = useState(editLocation?.planIds || ['main']);
  
  const handleSubmit = (e) => {
    e.preventDefault();
    onAdd({
      id: editLocation?.id || Date.now(),
      name,
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      category,
      description,
      city,
      planIds: selectedPlans
    });
  };
  
  const togglePlan = (planId) => {
    setSelectedPlans(prev => 
      prev.includes(planId) 
        ? prev.filter(id => id !== planId)
        : [...prev, planId]
    );
  };
  
  return (
    <form onSubmit={handleSubmit} className="bg-slate-800/95 backdrop-blur-sm rounded-2xl p-5 shadow-2xl border border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white">
          {editLocation ? 'Edit Location' : 'Add New Location'}
        </h3>
        <button type="button" onClick={onCancel} className="text-slate-500 hover:text-white">
          <X size={20} />
        </button>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
            required
          />
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Latitude</label>
            <input
              type="number"
              step="any"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
              placeholder="e.g. 3.1579"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Longitude</label>
            <input
              type="number"
              step="any"
              value={lng}
              onChange={(e) => setLng(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
              placeholder="e.g. 101.7116"
              required
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1">City</label>
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
            placeholder="e.g. Kuala Lumpur"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
          >
            {Object.entries(CATEGORIES).map(([key, cat]) => (
              <option key={key} value={key}>{cat.label}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-pink-500 resize-none"
            rows={2}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-2">Add to Plans</label>
          <div className="flex flex-wrap gap-2">
            {plans.map(plan => (
              <button
                key={plan.id}
                type="button"
                onClick={() => togglePlan(plan.id)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  selectedPlans.includes(plan.id)
                    ? 'text-white'
                    : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                }`}
                style={selectedPlans.includes(plan.id) ? { backgroundColor: plan.color } : {}}
              >
                {plan.name}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      <div className="flex gap-3 mt-5">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 px-4 rounded-xl font-medium transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="flex-1 bg-pink-600 hover:bg-pink-500 text-white py-2 px-4 rounded-xl font-medium transition-colors"
        >
          {editLocation ? 'Save Changes' : 'Add Location'}
        </button>
      </div>
    </form>
  );
};

// Weather panel
const WeatherPanel = () => {
  const [expanded, setExpanded] = useState(true);
  
  return (
    <div className="bg-slate-800/95 backdrop-blur-sm rounded-2xl overflow-hidden shadow-2xl border border-slate-700">
      <button 
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-slate-700/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
            <Cloud size={20} className="text-cyan-400" />
          </div>
          <div className="text-left">
            <h3 className="font-bold text-white">Weather Guide</h3>
            <p className="text-xs text-slate-400">Dec 19 - Jan 6</p>
          </div>
        </div>
        <ChevronDown 
          size={20} 
          className={`text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
        />
      </button>
      
      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          {Object.entries(WEATHER_INFO).map(([key, region]) => (
            <div key={key} className="bg-slate-700/50 rounded-xl p-3">
              <h4 className="font-semibold text-white text-sm mb-2">{region.title}</h4>
              <div className="space-y-1 text-xs">
                <div className="flex items-start gap-2">
                  <Thermometer size={14} className="text-orange-400 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-300">{region.temp}</span>
                </div>
                <div className="flex items-start gap-2">
                  <CloudRain size={14} className="text-blue-400 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-300">{region.rainfall}</span>
                </div>
                <div className="flex items-start gap-2">
                  <Wind size={14} className="text-slate-400 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-300">Humidity: {region.humidity}</span>
                </div>
              </div>
              <div className={`mt-2 p-2 rounded-lg text-xs font-medium ${
                region.recommendation.includes('✅') ? 'bg-green-500/20 text-green-300' :
                region.recommendation.includes('❌') ? 'bg-red-500/20 text-red-300' :
                'bg-yellow-500/20 text-yellow-300'
              }`}>
                {region.recommendation}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Safety panel
const SafetyPanel = () => {
  const [expanded, setExpanded] = useState(true);
  
  return (
    <div className="bg-slate-800/95 backdrop-blur-sm rounded-2xl overflow-hidden shadow-2xl border border-slate-700">
      <button 
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-slate-700/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
            <Shield size={20} className="text-emerald-400" />
          </div>
          <div className="text-left">
            <h3 className="font-bold text-white">Safety Advisory</h3>
            <p className="text-xs text-slate-400">US State Dept Level {SAFETY_INFO.overall.level}</p>
          </div>
        </div>
        <ChevronDown 
          size={20} 
          className={`text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
        />
      </button>
      
      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold text-xs">
                {SAFETY_INFO.overall.level}
              </div>
              <span className="font-semibold text-emerald-400 text-sm">{SAFETY_INFO.overall.title}</span>
            </div>
            <p className="text-xs text-slate-300">{SAFETY_INFO.overall.description}</p>
          </div>
          
          {SAFETY_INFO.warnings.map((warning, idx) => (
            <div key={idx} className="bg-red-500/10 border border-red-500/30 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle size={16} className="text-red-400" />
                <span className="font-semibold text-red-400 text-sm">{warning.area}</span>
              </div>
              <p className="text-xs text-slate-300 mb-1">{warning.description}</p>
              <p className="text-xs text-red-300 font-medium">{warning.action}</p>
            </div>
          ))}
          
          <div className="bg-slate-700/50 rounded-xl p-3">
            <h4 className="font-semibold text-white text-sm mb-2 flex items-center gap-2">
              <Baby size={14} className="text-pink-400" />
              Tips for Traveling with Toddler
            </h4>
            <ul className="space-y-1">
              {SAFETY_INFO.toddlerTips.map((tip, idx) => (
                <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                  <span className="text-pink-400 mt-1">•</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
          
          <div className="bg-slate-700/50 rounded-xl p-3">
            <h4 className="font-semibold text-white text-sm mb-2">General Safety Tips</h4>
            <ul className="space-y-1">
              {SAFETY_INFO.tips.map((tip, idx) => (
                <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                  <span className="text-cyan-400 mt-1">•</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

// Main App Component
export default function MalaysiaTripPlanner() {
  const [locations, setLocations] = useState(INITIAL_LOCATIONS);
  const [plans, setPlans] = useState(INITIAL_PLANS);
  const [visibleCategories, setVisibleCategories] = useState(Object.keys(CATEGORIES));
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editLocation, setEditLocation] = useState(null);
  const [activeTab, setActiveTab] = useState('map');
  const [filterOpen, setFilterOpen] = useState(false);
  
  const visiblePlans = plans.filter(p => p.visible).map(p => p.id);
  
  const toggleCategory = (category) => {
    setVisibleCategories(prev => 
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };
  
  const togglePlan = (planId) => {
    setPlans(prev => prev.map(p => 
      p.id === planId ? { ...p, visible: !p.visible } : p
    ));
  };
  
  const handleAddLocation = (location) => {
    if (editLocation) {
      setLocations(prev => prev.map(l => l.id === location.id ? location : l));
      setEditLocation(null);
    } else {
      setLocations(prev => [...prev, location]);
    }
    setShowAddForm(false);
  };
  
  const handleDeleteLocation = (id) => {
    setLocations(prev => prev.filter(l => l.id !== id));
    setSelectedLocation(null);
  };
  
  const handleEditLocation = (location) => {
    setEditLocation(location);
    setShowAddForm(true);
    setSelectedLocation(null);
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-pink-500/10 via-transparent to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-cyan-500/10 via-transparent to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDuration: '10s', animationDelay: '2s' }} />
      </div>
      
      {/* Header */}
      <header className="relative z-10 px-6 py-4 border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500 to-orange-400 flex items-center justify-center shadow-lg shadow-pink-500/25">
              <MapPin size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-pink-400 to-orange-300 bg-clip-text text-transparent">
                Malaysia Family Trip Planner
              </h1>
              <p className="text-xs text-slate-400 flex items-center gap-2">
                <Calendar size={12} />
                Dec 19, 2025 - Jan 6, 2026 • Toddler-Friendly Adventures
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setFilterOpen(!filterOpen)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all ${
                filterOpen 
                  ? 'bg-pink-500 text-white' 
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              <Filter size={16} />
              Filters
            </button>
            <button
              onClick={() => { setShowAddForm(true); setEditLocation(null); }}
              className="flex items-center gap-2 bg-gradient-to-r from-pink-500 to-orange-400 hover:from-pink-400 hover:to-orange-300 px-4 py-2 rounded-xl font-medium text-sm transition-all shadow-lg shadow-pink-500/25"
            >
              <Plus size={16} />
              Add Location
            </button>
          </div>
        </div>
      </header>
      
      {/* Filter panel */}
      {filterOpen && (
        <div className="relative z-10 px-6 py-4 bg-slate-800/90 backdrop-blur-xl border-b border-slate-700/50">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-2 gap-6">
              {/* Plans filter */}
              <div>
                <h3 className="text-sm font-semibold text-slate-300 mb-3">Travel Plans</h3>
                <div className="flex flex-wrap gap-2">
                  {plans.map(plan => (
                    <button
                      key={plan.id}
                      onClick={() => togglePlan(plan.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                        plan.visible 
                          ? 'text-white shadow-lg' 
                          : 'bg-slate-700/50 text-slate-400 hover:bg-slate-600'
                      }`}
                      style={plan.visible ? { backgroundColor: plan.color, boxShadow: `0 4px 12px ${plan.color}40` } : {}}
                    >
                      {plan.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                      {plan.name}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Categories filter */}
              <div>
                <h3 className="text-sm font-semibold text-slate-300 mb-3">Categories</h3>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(CATEGORIES).map(([key, cat]) => {
                    const Icon = cat.icon;
                    const isVisible = visibleCategories.includes(key);
                    return (
                      <button
                        key={key}
                        onClick={() => toggleCategory(key)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                          isVisible 
                            ? 'text-white' 
                            : 'bg-slate-700/50 text-slate-400 hover:bg-slate-600'
                        }`}
                        style={isVisible ? { backgroundColor: cat.bgColor, color: cat.color, border: `1px solid ${cat.color}40` } : {}}
                      >
                        <Icon size={14} />
                        {cat.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Main content */}
      <main className="relative z-10 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Map section */}
            <div className="lg:col-span-2 space-y-4">
              <div className="h-[500px]">
                <MapView 
                  locations={locations}
                  visibleCategories={visibleCategories}
                  visiblePlans={visiblePlans}
                  selectedLocation={selectedLocation}
                  onLocationSelect={setSelectedLocation}
                />
              </div>
              
              {/* Location list */}
              <div className="bg-slate-800/95 backdrop-blur-sm rounded-2xl p-4 border border-slate-700">
                <h3 className="font-bold text-white mb-3 flex items-center justify-between">
                  <span>All Locations ({locations.filter(l => 
                    visibleCategories.includes(l.category) &&
                    l.planIds.some(planId => visiblePlans.includes(planId))
                  ).length})</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[300px] overflow-y-auto">
                  {locations
                    .filter(l => 
                      visibleCategories.includes(l.category) &&
                      l.planIds.some(planId => visiblePlans.includes(planId))
                    )
                    .map(location => {
                      const cat = CATEGORIES[location.category];
                      const Icon = cat?.icon || MapPin;
                      return (
                        <button
                          key={location.id}
                          onClick={() => setSelectedLocation(location)}
                          className={`flex items-center gap-3 p-3 rounded-xl text-left transition-all hover:bg-slate-700/50 ${
                            selectedLocation?.id === location.id ? 'bg-slate-700 ring-2 ring-pink-500' : ''
                          }`}
                        >
                          <div 
                            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: cat?.bgColor }}
                          >
                            <Icon size={16} style={{ color: cat?.color }} />
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-white text-sm truncate">{location.name}</div>
                            <div className="text-xs text-slate-400">{location.city}</div>
                          </div>
                        </button>
                      );
                    })}
                </div>
              </div>
            </div>
            
            {/* Sidebar */}
            <div className="space-y-4">
              {/* Add/Edit form or Location detail */}
              {showAddForm ? (
                <AddLocationForm 
                  onAdd={handleAddLocation}
                  onCancel={() => { setShowAddForm(false); setEditLocation(null); }}
                  plans={plans}
                  editLocation={editLocation}
                />
              ) : selectedLocation ? (
                <LocationDetail 
                  location={selectedLocation}
                  onClose={() => setSelectedLocation(null)}
                  onEdit={handleEditLocation}
                  plans={plans}
                />
              ) : (
                <div className="bg-slate-800/95 backdrop-blur-sm rounded-2xl p-5 border border-slate-700 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-slate-700/50 flex items-center justify-center mx-auto mb-3">
                    <MapPin size={24} className="text-slate-500" />
                  </div>
                  <p className="text-slate-400 text-sm">
                    Click on a marker or location to view details
                  </p>
                </div>
              )}
              
              {/* Weather panel */}
              <WeatherPanel />
              
              {/* Safety panel */}
              <SafetyPanel />
            </div>
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="relative z-10 px-6 py-4 border-t border-slate-700/50 bg-slate-900/80 backdrop-blur-xl mt-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-4">
            <span>Data sources: US State Dept, Malaysia Meteorological Dept, TripAdvisor</span>
          </div>
          <div className="flex items-center gap-2">
            <Info size={12} />
            <span>Last updated: Dec 2025</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
