// Malaysia Family Trip Data - Dec 21, 2025 to Jan 6, 2026
// Base: M Vertica Residence, Cheras

export interface Location {
  id: string;
  name: string;
  lat: number;
  lng: number;
  category: LocationCategory;
  description: string;
  city: string;
  address?: string;
  toddlerRating: number; // 1-5
  isIndoor: boolean;
  bestTimeToVisit: string[];
  estimatedDuration: string;
  grabEstimate: string;
  distanceFromBase: string;
  drivingTime: string;
  warnings: string[];
  tips: string[];
  dressCode?: string;
  whatToBring: string[];
  whatNotToBring: string[];
  feedingTimes?: string[];
  bookingRequired: boolean;
  bookingUrl?: string;
  entranceFee?: string;
  openingHours: string;
  planIds: string[];
}

export type LocationCategory =
  | 'home-base'
  | 'toddler-friendly'
  | 'attraction'
  | 'shopping'
  | 'restaurant'
  | 'nature'
  | 'temple'
  | 'playground'
  | 'medical'
  | 'avoid';

export interface DayPlan {
  id: string;
  date: string;
  dayOfWeek: string;
  title: string;
  planA: ScheduleItem[];
  planB: ScheduleItem[]; // Rainy/tired toddler alternative
  notes: string[];
  weatherConsideration: 'outdoor-heavy' | 'indoor-heavy' | 'mixed';
}

export interface ScheduleItem {
  id: string;
  locationId: string;
  startTime: string;
  endTime: string;
  notes?: string;
  isNapTime?: boolean;
  isFlexible?: boolean;
}

export interface TravelPlan {
  id: string;
  name: string;
  color: string;
  description: string;
  isDefault: boolean;
}

// =============================================================================
// HOME BASE
// =============================================================================

export const HOME_BASE: Location = {
  id: 'home-base',
  name: 'M Vertica Residence',
  lat: 3.1089,
  lng: 101.7279,
  category: 'home-base',
  description:
    'Your home base in Cheras. Modern condo with pool, playground, and 40+ amenities. 500m covered walkway to Maluri MRT/LRT station.',
  city: 'Cheras',
  address: '555, Jln Cheras, Taman Pertama, 56000 Kuala Lumpur',
  toddlerRating: 5,
  isIndoor: true,
  bestTimeToVisit: ['Anytime'],
  estimatedDuration: 'N/A',
  grabEstimate: 'N/A',
  distanceFromBase: '0 km',
  drivingTime: '0 min',
  warnings: [],
  tips: [
    'Pool and playground available on-site',
    'Mini-mart in building for essentials',
    'Maluri MRT/LRT just 500m via covered walkway',
    'Sunway Velocity Mall is 800m away',
    'AEON Taman Maluri is 800m away',
  ],
  whatToBring: [],
  whatNotToBring: [],
  bookingRequired: false,
  openingHours: '24/7',
  planIds: ['all'],
};

// =============================================================================
// ALL LOCATIONS
// =============================================================================

export const LOCATIONS: Location[] = [
  HOME_BASE,

  // NEARBY MALLS (Plan B favorites - walking distance)
  {
    id: 'sunway-velocity',
    name: 'Sunway Velocity Mall',
    lat: 3.1283,
    lng: 101.7214,
    category: 'shopping',
    description:
      'Large modern mall with kids play areas, excellent food court, and air conditioning. Perfect rainy day backup.',
    city: 'Cheras',
    address: 'Lingkaran SV, Sunway Velocity, 55100 Kuala Lumpur',
    toddlerRating: 5,
    isIndoor: true,
    bestTimeToVisit: ['10:00-12:00', '14:00-18:00'],
    estimatedDuration: '2-4 hours',
    grabEstimate: 'Free - walkable!',
    distanceFromBase: '800m',
    drivingTime: '10 min walk',
    warnings: ['Can get crowded on weekends'],
    tips: [
      'Has indoor playground on Level 4',
      'Good nursing rooms available',
      'Food court has high chairs',
      'Connected to Sunway Medical Centre',
    ],
    whatToBring: ['Stroller friendly'],
    whatNotToBring: [],
    bookingRequired: false,
    openingHours: '10:00 AM - 10:00 PM',
    planIds: ['plan-b', 'shopping'],
  },
  {
    id: 'aeon-maluri',
    name: 'AEON Taman Maluri',
    lat: 3.1167,
    lng: 101.7264,
    category: 'shopping',
    description: 'Convenient mall for groceries and daily needs. Less crowded than Velocity.',
    city: 'Cheras',
    address: 'Jalan Jejaka, Maluri, 55100 Kuala Lumpur',
    toddlerRating: 4,
    isIndoor: true,
    bestTimeToVisit: ['10:00-12:00', '14:00-18:00'],
    estimatedDuration: '1-2 hours',
    grabEstimate: 'Free - walkable!',
    distanceFromBase: '800m',
    drivingTime: '10 min walk',
    warnings: [],
    tips: [
      'Good for grocery shopping',
      'Less crowded than Velocity',
      'Has Daiso for cheap baby supplies',
    ],
    whatToBring: ['Shopping bags'],
    whatNotToBring: [],
    bookingRequired: false,
    openingHours: '10:00 AM - 10:00 PM',
    planIds: ['plan-b', 'shopping'],
  },

  // KLCC AREA
  {
    id: 'klcc-park',
    name: 'KLCC Park',
    lat: 3.1555,
    lng: 101.7119,
    category: 'toddler-friendly',
    description:
      'Beautiful park with wading pool for kids, playground, and jogging paths. Iconic view of Petronas Towers.',
    city: 'Kuala Lumpur',
    address: 'Kuala Lumpur City Centre, 50450 Kuala Lumpur',
    toddlerRating: 5,
    isIndoor: false,
    bestTimeToVisit: ['08:00-10:00', '17:00-19:00'],
    estimatedDuration: '1-2 hours',
    grabEstimate: 'RM 12-15',
    distanceFromBase: '5 km',
    drivingTime: '15-25 min',
    warnings: [
      'Very hot midday (11am-3pm)',
      'Wading pool closed on Mondays for cleaning',
      'Crowded on weekends',
    ],
    tips: [
      'Wading pool is FREE and toddler-safe',
      'Bring swimsuit and towel for water play',
      'Fountain show at 8pm, 9pm, 10pm',
      'Best photos of Petronas at sunset',
      'Playground near the lake',
    ],
    whatToBring: ['Swimsuit', 'Towel', 'Sunscreen', 'Hat', 'Water bottle', 'Change of clothes'],
    whatNotToBring: ['Glass bottles'],
    bookingRequired: false,
    openingHours: '7:00 AM - 10:00 PM (Wading pool: 10:00 AM - 7:30 PM)',
    entranceFee: 'FREE',
    planIds: ['plan-a', 'toddler'],
  },
  {
    id: 'petronas-towers',
    name: 'Petronas Twin Towers',
    lat: 3.1579,
    lng: 101.7116,
    category: 'attraction',
    description:
      'Iconic twin towers with sky bridge and observation deck. Educational for kids about architecture.',
    city: 'Kuala Lumpur',
    address: 'Kuala Lumpur City Centre, 50088 Kuala Lumpur',
    toddlerRating: 3,
    isIndoor: true,
    bestTimeToVisit: ['10:00-12:00', '15:00-17:00'],
    estimatedDuration: '1-1.5 hours',
    grabEstimate: 'RM 15-18',
    distanceFromBase: '6 km',
    drivingTime: '15-25 min',
    warnings: [
      'Book tickets in advance - sells out!',
      'Long queues without pre-booking',
      '19-month-old may not appreciate the view',
    ],
    tips: [
      'Book online at least 1 week ahead',
      'Morning slots less crowded',
      'Stroller must be left at entrance',
      'Baby carrier recommended',
      'Skip if toddler is tired - do Suria KLCC mall instead',
    ],
    whatToBring: ['Baby carrier', 'Booking confirmation'],
    whatNotToBring: ['Large bags', 'Tripods'],
    bookingRequired: true,
    bookingUrl: 'https://www.petronastwintowers.com.my/',
    entranceFee: 'RM 98 adult, FREE under 3',
    openingHours: '9:00 AM - 9:00 PM (Closed Mon)',
    planIds: ['plan-a', 'attraction'],
  },
  {
    id: 'aquaria-klcc',
    name: 'Aquaria KLCC',
    lat: 3.153,
    lng: 101.7115,
    category: 'toddler-friendly',
    description:
      "Malaysia's largest aquarium with 90m underwater tunnel. 5,000+ sea creatures. Touch pools for kids.",
    city: 'Kuala Lumpur',
    address: 'Kuala Lumpur Convention Centre, Jalan Pinang, 50088 Kuala Lumpur',
    toddlerRating: 5,
    isIndoor: true,
    bestTimeToVisit: ['10:00-12:00', '14:00-16:00'],
    estimatedDuration: '2-3 hours',
    grabEstimate: 'RM 12-15',
    distanceFromBase: '5 km',
    drivingTime: '15-25 min',
    warnings: [
      'NOT stroller friendly - use baby carrier!',
      'No nursing room inside (nearest in Suria KLCC)',
      'Crowded on weekends and school holidays',
      'Can be dark/scary for some toddlers',
    ],
    tips: [
      'Book tickets online for cheaper price and skip queue',
      'Shark feeding: 11:00 AM (Mon, Wed, Sat)',
      'Piranha feeding: 11:30 AM daily',
      'Touch pool lets kids touch starfish and baby sharks!',
      'Underwater tunnel has travelator - toddlers love it',
      'Baby changing room available',
    ],
    feedingTimes: [
      '10:30 AM - Giant Grouper',
      '11:00 AM - Sharks (Mon, Wed, Sat)',
      '11:30 AM - Piranha',
      '12:00 PM - Arapaima',
      '2:30 PM - Otters',
      '3:00 PM - Reef Tank',
      '3:30 PM - Sea Turtle',
    ],
    whatToBring: ['Baby carrier (NOT stroller)', 'Camera'],
    whatNotToBring: ['Stroller', 'Flash photography'],
    bookingRequired: false,
    bookingUrl: 'https://www.aquariaklcc.com/',
    entranceFee: 'RM 75 adult, RM 65 child (3-12), FREE under 3',
    openingHours: '10:00 AM - 8:00 PM (Last entry 7:00 PM)',
    planIds: ['plan-a', 'plan-b', 'toddler'],
  },
  {
    id: 'suria-klcc',
    name: 'Suria KLCC Mall',
    lat: 3.158,
    lng: 101.7118,
    category: 'shopping',
    description:
      'Premier shopping mall at the base of Petronas Towers. Petrosains science center for kids inside.',
    city: 'Kuala Lumpur',
    address: 'Suria KLCC, Kuala Lumpur City Centre, 50088 Kuala Lumpur',
    toddlerRating: 4,
    isIndoor: true,
    bestTimeToVisit: ['10:00-12:00', '14:00-18:00'],
    estimatedDuration: '2-4 hours',
    grabEstimate: 'RM 15-18',
    distanceFromBase: '6 km',
    drivingTime: '15-25 min',
    warnings: ['Very crowded during holidays'],
    tips: [
      'Petrosains (Level 4) has interactive science exhibits for kids',
      'Good nursing rooms on multiple floors',
      "Madam Kwan's restaurant has kid-friendly menu",
      'Stroller rental available but limited - bring your own',
    ],
    whatToBring: ['Stroller'],
    whatNotToBring: [],
    bookingRequired: false,
    openingHours: '10:00 AM - 10:00 PM',
    planIds: ['plan-b', 'shopping'],
  },

  // BATU CAVES
  {
    id: 'batu-caves',
    name: 'Batu Caves',
    lat: 3.2379,
    lng: 101.684,
    category: 'temple',
    description:
      'Iconic Hindu temple complex with 272 rainbow steps and giant Lord Murugan statue. Cultural must-see.',
    city: 'Gombak',
    address: 'Gombak, 68100 Batu Caves, Selangor',
    toddlerRating: 3,
    isIndoor: false,
    bestTimeToVisit: ['07:00-09:00'],
    estimatedDuration: '1.5-2 hours',
    grabEstimate: 'RM 25-30',
    distanceFromBase: '15 km',
    drivingTime: '25-40 min',
    warnings: [
      'MUST go early (before 9am) - gets extremely hot!',
      '272 steps are steep and tiring',
      'Aggressive monkeys will snatch food/drinks',
      'Can be slippery after rain',
      'Not wheelchair/stroller accessible',
    ],
    tips: [
      'Use baby carrier, NOT stroller (leave stroller at shops for RM5)',
      'Go at 7am - cooler, less crowded, better photos',
      'Wear long pants/skirt (sarong rental RM3 if needed)',
      'Cover shoulders',
      'DO NOT carry food or drinks visibly',
      'Keep phones secure - monkeys grab them!',
      'Take KTM train from KL Sentral (RM2.60, 45min) as alternative to Grab',
    ],
    dressCode:
      'Cover shoulders and knees. Long pants or skirt required. Sarong rental available (RM3).',
    whatToBring: ['Baby carrier', 'Water (keep hidden)', 'Sunscreen', 'Hat', 'Camera'],
    whatNotToBring: ['Visible food/drinks', 'Dangling jewelry', 'Stroller'],
    bookingRequired: false,
    entranceFee: 'FREE (Temple Cave)',
    openingHours: '6:00 AM - 9:00 PM',
    planIds: ['plan-a', 'cultural'],
  },

  // GENTING HIGHLANDS
  {
    id: 'genting-skyavenue',
    name: 'Genting SkyAvenue',
    lat: 3.4235,
    lng: 101.7932,
    category: 'shopping',
    description:
      'Hilltop mega mall at 6,000 feet. Indoor theme park, shopping, dining. Cool weather escape!',
    city: 'Genting Highlands',
    address: 'Genting Highlands, 69000 Pahang',
    toddlerRating: 4,
    isIndoor: true,
    bestTimeToVisit: ['10:00-16:00'],
    estimatedDuration: '4-6 hours',
    grabEstimate: 'RM 80-110',
    distanceFromBase: '50 km',
    drivingTime: '1-1.5 hours',
    warnings: [
      'Long journey - plan for full day',
      'Can get cold (bring jacket!)',
      'Cable car queues can be 30-60 min on weekends',
      'Skytropolis rides have height requirements',
    ],
    tips: [
      'Take Awana SkyWay cable car (RM10 one-way) for scenic ride',
      'Skytropolis has toddler rides: Boo Boo Bump, Copper Express',
      'SkySymphony FREE light show every 30 min at atrium',
      'Stop at Chin Swee Caves Temple midway (free)',
      'Good nursing rooms and baby facilities',
      "Bring warm clothes - it's 20°C cooler than KL!",
    ],
    whatToBring: ['Jacket/sweater', 'Baby carrier', 'Warm clothes for toddler'],
    whatNotToBring: [],
    bookingRequired: false,
    openingHours: '10:00 AM - 10:00 PM',
    planIds: ['plan-a', 'day-trip'],
  },
  {
    id: 'skytropolis',
    name: 'Skytropolis Indoor Theme Park',
    lat: 3.4235,
    lng: 101.7932,
    category: 'playground',
    description:
      'Indoor theme park with 20+ rides. Has toddler-friendly rides like bumper cars and mini train.',
    city: 'Genting Highlands',
    address: 'SkyAvenue, Genting Highlands, 69000 Pahang',
    toddlerRating: 4,
    isIndoor: true,
    bestTimeToVisit: ['12:00-18:00'],
    estimatedDuration: '2-3 hours',
    grabEstimate: 'Part of Genting trip',
    distanceFromBase: '50 km',
    drivingTime: '1-1.5 hours',
    warnings: [
      'Many rides require 92cm+ height',
      'Toddler must be accompanied on all rides',
      'Can be loud and overwhelming',
    ],
    tips: [
      'Toddler rides: Boo Boo Bump (bumper cars), Copper Express (train)',
      "Buy token card, not day pass for toddlers (they won't use many rides)",
      'Carousel is toddler-friendly',
      'Neon lights make great photos',
    ],
    whatToBring: ['Jacket'],
    whatNotToBring: [],
    bookingRequired: false,
    entranceFee: 'RM 16+ per ride or day pass RM 65',
    openingHours: '12:00 PM - 12:00 AM',
    planIds: ['plan-a', 'toddler'],
  },

  // BUKIT BINTANG / CITY CENTER
  {
    id: 'jalan-alor',
    name: 'Jalan Alor Food Street',
    lat: 3.1456,
    lng: 101.7089,
    category: 'restaurant',
    description: 'Famous street food paradise. Grilled chicken wings, satay, and local delicacies.',
    city: 'Bukit Bintang',
    address: 'Jalan Alor, Bukit Bintang, 50200 Kuala Lumpur',
    toddlerRating: 3,
    isIndoor: false,
    bestTimeToVisit: ['18:00-21:00'],
    estimatedDuration: '1-2 hours',
    grabEstimate: 'RM 18-22',
    distanceFromBase: '7 km',
    drivingTime: '20-30 min',
    warnings: [
      'Very crowded and noisy',
      'Hot and smoky from grills',
      'Limited high chairs',
      'Watch belongings - pickpockets active',
    ],
    tips: [
      'Go around 6-7pm before it gets too crowded',
      'Try: Grilled chicken wings, satay, char kway teow',
      'Most stalls have similar food - pick one with seats',
      'Cash preferred, some accept card',
      'Bring wet wipes for toddler!',
    ],
    whatToBring: ['Wet wipes', 'Cash', 'Hand sanitizer'],
    whatNotToBring: ['Valuables in back pocket'],
    bookingRequired: false,
    openingHours: '5:00 PM - 4:00 AM',
    planIds: ['plan-a', 'food'],
  },
  {
    id: 'petaling-street',
    name: 'Petaling Street (Chinatown)',
    lat: 3.1456,
    lng: 101.6968,
    category: 'shopping',
    description:
      'Bustling Chinatown market. Bargain shopping, street food, and cultural experience.',
    city: 'Kuala Lumpur',
    address: 'Jalan Petaling, City Centre, 50000 Kuala Lumpur',
    toddlerRating: 3,
    isIndoor: false,
    bestTimeToVisit: ['10:00-12:00', '17:00-20:00'],
    estimatedDuration: '1-2 hours',
    grabEstimate: 'RM 12-15',
    distanceFromBase: '5 km',
    drivingTime: '15-25 min',
    warnings: [
      'Very crowded and hot',
      'Watch for pickpockets',
      'Aggressive vendors - just say "no thanks" and walk',
      'Fake goods everywhere (if you care)',
    ],
    tips: [
      'Good for souvenirs and cheap clothes',
      'Try: Air mata kucing drink, roasted chestnuts',
      'Bargain! Start at 50% of asking price',
      'Visit Kuan Ti Temple nearby',
      'Morning is less crowded and cooler',
    ],
    whatToBring: ['Cash', 'Small bag worn in front'],
    whatNotToBring: ['Expensive jewelry', 'Wallet in back pocket'],
    bookingRequired: false,
    openingHours: '9:00 AM - 10:00 PM',
    planIds: ['plan-a', 'cultural', 'shopping'],
  },
  {
    id: 'pavilion-kl',
    name: 'Pavilion Kuala Lumpur',
    lat: 3.1489,
    lng: 101.7132,
    category: 'shopping',
    description:
      'Upscale shopping mall in Bukit Bintang. Great for air-conditioned break and luxury shopping.',
    city: 'Bukit Bintang',
    address: '168, Jalan Bukit Bintang, 55100 Kuala Lumpur',
    toddlerRating: 4,
    isIndoor: true,
    bestTimeToVisit: ['10:00-18:00'],
    estimatedDuration: '2-3 hours',
    grabEstimate: 'RM 15-20',
    distanceFromBase: '6 km',
    drivingTime: '15-25 min',
    warnings: ['Expensive shops'],
    tips: [
      'Good nursing rooms',
      'Food court has high chairs',
      'Connected to other malls via covered walkway',
      'Christmas decorations are spectacular in December!',
    ],
    whatToBring: ['Stroller'],
    whatNotToBring: [],
    bookingRequired: false,
    openingHours: '10:00 AM - 10:00 PM',
    planIds: ['plan-b', 'shopping'],
  },

  // NATURE & PARKS
  {
    id: 'kl-bird-park',
    name: 'KL Bird Park',
    lat: 3.1424,
    lng: 101.6879,
    category: 'toddler-friendly',
    description:
      "World's largest free-flight aviary. Hornbills, flamingos, peacocks. Toddlers love the bird feeding!",
    city: 'Kuala Lumpur',
    address: '920 Jalan Cenderawasih, Perdana Botanical Gardens, 50480 Kuala Lumpur',
    toddlerRating: 5,
    isIndoor: false,
    bestTimeToVisit: ['09:00-11:00'],
    estimatedDuration: '2-3 hours',
    grabEstimate: 'RM 15-18',
    distanceFromBase: '6 km',
    drivingTime: '15-25 min',
    warnings: [
      'Hot by midday',
      'Lots of walking - bring stroller',
      'Bird feeding times are specific',
    ],
    tips: [
      'Feeding times: 10:30 AM and 3:00 PM',
      'Hornbill feeding at 11:00 AM',
      'Buy seed packets (RM5) to feed birds',
      'Toddlers can hold small birds!',
      'Photo station with parrots',
      'Shaded paths throughout',
    ],
    feedingTimes: [
      '10:30 AM - General feeding',
      '11:00 AM - Hornbill feeding',
      '12:30 PM - Flamingo feeding',
      '3:00 PM - General feeding',
    ],
    whatToBring: ['Stroller', 'Sunscreen', 'Hat', 'Water', 'Camera'],
    whatNotToBring: [],
    bookingRequired: false,
    entranceFee: 'RM 67 adult, RM 45 child (3-11), FREE under 3',
    openingHours: '9:00 AM - 5:30 PM',
    planIds: ['plan-a', 'plan-b', 'toddler', 'nature'],
  },
  {
    id: 'perdana-gardens',
    name: 'Perdana Botanical Gardens',
    lat: 3.1437,
    lng: 101.6879,
    category: 'nature',
    description:
      'Beautiful green space in the city. Orchid garden, deer park, and open spaces for toddler to run.',
    city: 'Kuala Lumpur',
    address: 'Jalan Kebun Bunga, Tasik Perdana, 50480 Kuala Lumpur',
    toddlerRating: 5,
    isIndoor: false,
    bestTimeToVisit: ['07:00-10:00', '17:00-19:00'],
    estimatedDuration: '1-2 hours',
    grabEstimate: 'RM 15-18',
    distanceFromBase: '6 km',
    drivingTime: '15-25 min',
    warnings: ['Very hot midday'],
    tips: [
      'FREE entry to main gardens',
      'Deer Park lets kids feed deer',
      'Orchid Garden (RM5) is beautiful for photos',
      'Great picnic spot',
      'Near Bird Park - combine visits',
    ],
    whatToBring: ['Picnic mat', 'Snacks', 'Water', 'Sunscreen'],
    whatNotToBring: [],
    bookingRequired: false,
    entranceFee: 'FREE (Orchid Garden RM5)',
    openingHours: '7:00 AM - 8:00 PM',
    planIds: ['plan-a', 'nature'],
  },
  {
    id: 'titiwangsa-gardens',
    name: 'Titiwangsa Lake Gardens',
    lat: 3.1803,
    lng: 101.705,
    category: 'toddler-friendly',
    description:
      'Beautiful lakeside park with playground and stunning KL skyline views. Great for sunset.',
    city: 'Kuala Lumpur',
    address: 'Jalan Temerloh, Titiwangsa, 53200 Kuala Lumpur',
    toddlerRating: 5,
    isIndoor: false,
    bestTimeToVisit: ['07:00-09:00', '17:00-19:00'],
    estimatedDuration: '1-2 hours',
    grabEstimate: 'RM 18-22',
    distanceFromBase: '8 km',
    drivingTime: '20-30 min',
    warnings: ['Hot midday', 'No shade in some areas'],
    tips: [
      'Best KL skyline photo spot!',
      'Playground near the lake',
      'Paddle boats available (fun for family)',
      'Food stalls nearby',
      'Great for toddler to run around',
    ],
    whatToBring: ['Camera', 'Water', 'Snacks'],
    whatNotToBring: [],
    bookingRequired: false,
    entranceFee: 'FREE',
    openingHours: '7:00 AM - 11:00 PM',
    planIds: ['plan-a', 'plan-b', 'toddler', 'nature'],
  },

  // PUTRAJAYA
  {
    id: 'putrajaya-lake',
    name: 'Putrajaya Lake Cruise',
    lat: 2.9264,
    lng: 101.6833,
    category: 'attraction',
    description:
      "Scenic boat cruise on Malaysia's administrative capital. Beautiful bridges and government buildings.",
    city: 'Putrajaya',
    address: 'Presint 7, 62000 Putrajaya',
    toddlerRating: 4,
    isIndoor: false,
    bestTimeToVisit: ['09:00-11:00', '16:00-18:00'],
    estimatedDuration: '2-3 hours',
    grabEstimate: 'RM 50-60',
    distanceFromBase: '35 km',
    drivingTime: '40-60 min',
    warnings: [
      'Long drive from KL',
      'Boat can be hot - bring shade',
      'Book in advance on weekends',
    ],
    tips: [
      'Sunset cruise is magical',
      'Combined with Putrajaya Botanical Gardens',
      'Pink Mosque is stunning - visit after cruise',
      'Life jackets provided for all',
    ],
    whatToBring: ['Hat', 'Sunscreen', 'Camera', 'Water'],
    whatNotToBring: [],
    bookingRequired: true,
    entranceFee: 'RM 50-80 per person',
    openingHours: '10:00 AM - 7:00 PM',
    planIds: ['plan-a', 'day-trip'],
  },

  // SUNWAY
  {
    id: 'sunway-pyramid',
    name: 'Sunway Pyramid Mall',
    lat: 3.0725,
    lng: 101.6067,
    category: 'shopping',
    description: 'Mega mall with indoor ice rink, bowling, and Play ParQ indoor playground.',
    city: 'Petaling Jaya',
    address: '3, Jalan PJS 11/15, Bandar Sunway, 47500 Petaling Jaya',
    toddlerRating: 5,
    isIndoor: true,
    bestTimeToVisit: ['10:00-18:00'],
    estimatedDuration: '4-6 hours',
    grabEstimate: 'RM 25-35',
    distanceFromBase: '12 km',
    drivingTime: '25-40 min',
    warnings: ['Can be very crowded on weekends'],
    tips: [
      'Play ParQ is excellent toddler indoor playground',
      'Ice rink has viewing area (toddler too young to skate)',
      'Connected to Sunway Lagoon theme park',
      'Good nursing rooms on multiple floors',
      'Massive toy stores',
    ],
    whatToBring: ['Socks for playground'],
    whatNotToBring: [],
    bookingRequired: false,
    openingHours: '10:00 AM - 10:00 PM',
    planIds: ['plan-a', 'plan-b', 'toddler'],
  },

  // MUSEUMS
  {
    id: 'muzium-negara',
    name: 'National Museum (Muzium Negara)',
    lat: 3.1377,
    lng: 101.6875,
    category: 'attraction',
    description: 'Learn about Malaysian history and culture. Air-conditioned and educational.',
    city: 'Kuala Lumpur',
    address: 'Jalan Damansara, Tasik Perdana, 50566 Kuala Lumpur',
    toddlerRating: 3,
    isIndoor: true,
    bestTimeToVisit: ['10:00-12:00', '14:00-16:00'],
    estimatedDuration: '1-2 hours',
    grabEstimate: 'RM 15-18',
    distanceFromBase: '6 km',
    drivingTime: '15-25 min',
    warnings: ['Not very interactive for toddlers', 'Better for parents than 19-month-old'],
    tips: [
      'Good rainy day option',
      'Near Perdana Gardens - combine visits',
      'Traditional Malay house exhibits outside',
      'Air-conditioned relief from heat',
    ],
    whatToBring: ['Stroller'],
    whatNotToBring: [],
    bookingRequired: false,
    entranceFee: 'RM 5 adult, FREE for children under 6',
    openingHours: '9:00 AM - 5:00 PM',
    planIds: ['plan-b', 'cultural'],
  },

  // CAMERON HIGHLANDS
  {
    id: 'cameron-highlands',
    name: 'Cameron Highlands',
    lat: 4.4715,
    lng: 101.3762,
    category: 'nature',
    description:
      'Cool highland escape. Tea plantations, strawberry farms, and fresh air. 3-night stay planned.',
    city: 'Cameron Highlands',
    address: 'Brinchang, 39000 Cameron Highlands, Pahang',
    toddlerRating: 5,
    isIndoor: false,
    bestTimeToVisit: ['All day - cool weather!'],
    estimatedDuration: '3-4 days',
    grabEstimate: 'Private transfer RM 250-300',
    distanceFromBase: '200 km',
    drivingTime: '3-4 hours',
    warnings: [
      'Winding mountain roads - motion sickness risk',
      'Can get cold at night (15-20°C)',
      'Bring warm clothes for toddler!',
    ],
    tips: [
      'Strawberry picking at farms - toddlers love it!',
      'Tea plantation visits (BOH is most famous)',
      'Lavender garden for photos',
      'Night market in Brinchang',
      'Bug spray needed for some trails',
    ],
    whatToBring: ['Warm clothes', 'Jacket', 'Motion sickness meds', 'Bug spray'],
    whatNotToBring: [],
    bookingRequired: true,
    openingHours: 'N/A - destination',
    planIds: ['plan-a', 'nature', 'day-trip'],
  },

  // MEDICAL FACILITIES
  {
    id: 'sunway-medical',
    name: 'Sunway Medical Centre',
    lat: 3.0725,
    lng: 101.6067,
    category: 'medical',
    description: '24/7 hospital with pediatric emergency. Near Sunway Velocity.',
    city: 'Petaling Jaya',
    address: '5, Jalan Lagoon Selatan, Bandar Sunway, 47500 Petaling Jaya',
    toddlerRating: 5,
    isIndoor: true,
    bestTimeToVisit: ['24/7 emergency'],
    estimatedDuration: 'As needed',
    grabEstimate: 'RM 20-30',
    distanceFromBase: '3 km (Velocity branch)',
    drivingTime: '10 min',
    warnings: [],
    tips: [
      'Has pediatric emergency department',
      'Accepts international insurance',
      'English-speaking doctors',
    ],
    whatToBring: ['Passport', 'Insurance card', 'Medical records'],
    whatNotToBring: [],
    bookingRequired: false,
    openingHours: '24/7 Emergency',
    planIds: ['medical'],
  },
  {
    id: 'gleneagles-kl',
    name: 'Gleneagles Hospital Kuala Lumpur',
    lat: 3.1615,
    lng: 101.7329,
    category: 'medical',
    description: 'Premium private hospital with excellent pediatric care. 24/7 emergency.',
    city: 'Kuala Lumpur',
    address: '286 & 288, Jalan Ampang, 50450 Kuala Lumpur',
    toddlerRating: 5,
    isIndoor: true,
    bestTimeToVisit: ['24/7 emergency'],
    estimatedDuration: 'As needed',
    grabEstimate: 'RM 15-20',
    distanceFromBase: '6 km',
    drivingTime: '15-25 min',
    warnings: [],
    tips: [
      'Excellent pediatric department',
      'Near KLCC area',
      'English-speaking staff',
      'Accepts most international insurance',
    ],
    whatToBring: ['Passport', 'Insurance card'],
    whatNotToBring: [],
    bookingRequired: false,
    openingHours: '24/7 Emergency',
    planIds: ['medical'],
  },

  // ZOO VIEW (from itinerary)
  {
    id: 'zoo-view',
    name: 'Taman Zooview Ampang',
    lat: 3.2106,
    lng: 101.765,
    category: 'nature',
    description: 'Hillside park with nature trails and viewpoint. Less crowded alternative.',
    city: 'Ampang',
    address: 'Jalan Taman Zooview, Taman Zooview, 68000 Ampang',
    toddlerRating: 3,
    isIndoor: false,
    bestTimeToVisit: ['07:00-10:00', '16:00-18:00'],
    estimatedDuration: '1-2 hours',
    grabEstimate: 'RM 20-25',
    distanceFromBase: '10 km',
    drivingTime: '20-30 min',
    warnings: [
      'Steep trails not suitable for stroller',
      'Can be muddy after rain',
      'Mosquitoes present',
    ],
    tips: [
      'Nice sunset views',
      'Combine with Batu Caves day trip',
      'Less touristy than main attractions',
    ],
    whatToBring: ['Baby carrier', 'Bug spray', 'Water'],
    whatNotToBring: ['Stroller'],
    bookingRequired: false,
    entranceFee: 'FREE',
    openingHours: '7:00 AM - 7:00 PM',
    planIds: ['plan-a', 'nature'],
  },
];

// =============================================================================
// DAILY PLANS
// =============================================================================

export const DAILY_PLANS: DayPlan[] = [
  {
    id: 'day-1',
    date: '2025-12-21',
    dayOfWeek: 'Sunday',
    title: 'Arrival Day - Light Activities',
    planA: [
      {
        id: 'd1-1',
        locationId: 'home-base',
        startTime: '15:00',
        endTime: '16:00',
        notes: 'Check in, rest after flight',
      },
      {
        id: 'd1-2',
        locationId: 'aeon-maluri',
        startTime: '16:30',
        endTime: '18:30',
        notes: 'Grocery shopping',
      },
      {
        id: 'd1-3',
        locationId: 'klcc-park',
        startTime: '19:00',
        endTime: '21:00',
        notes: 'Evening stroll, fountain show',
      },
    ],
    planB: [
      {
        id: 'd1-b1',
        locationId: 'home-base',
        startTime: '15:00',
        endTime: '18:00',
        notes: 'Rest, let toddler adjust',
      },
      {
        id: 'd1-b2',
        locationId: 'sunway-velocity',
        startTime: '18:30',
        endTime: '21:00',
        notes: 'Mall dinner, easy walking',
      },
    ],
    notes: [
      'Arrival at 10:20am - will be tired!',
      'Toddler may be jetlagged',
      'Keep activities light',
      'Stock up on essentials at AEON',
    ],
    weatherConsideration: 'mixed',
  },
  {
    id: 'day-2',
    date: '2025-12-22',
    dayOfWeek: 'Monday',
    title: 'Batu Caves + Nature Day',
    planA: [
      {
        id: 'd2-1',
        locationId: 'batu-caves',
        startTime: '07:00',
        endTime: '10:00',
        notes: 'Early start! Beat the heat and crowds',
      },
      {
        id: 'd2-2',
        locationId: 'home-base',
        startTime: '10:30',
        endTime: '11:30',
        isNapTime: true,
        notes: 'Toddler morning nap',
      },
      {
        id: 'd2-3',
        locationId: 'zoo-view',
        startTime: '14:00',
        endTime: '16:00',
        notes: 'Nature trails',
      },
      {
        id: 'd2-4',
        locationId: 'home-base',
        startTime: '16:30',
        endTime: '17:00',
        isNapTime: true,
        notes: 'Quick afternoon nap',
      },
    ],
    planB: [
      {
        id: 'd2-b1',
        locationId: 'sunway-velocity',
        startTime: '10:00',
        endTime: '12:00',
        notes: 'Mall morning if too tired from yesterday',
      },
      {
        id: 'd2-b2',
        locationId: 'home-base',
        startTime: '12:30',
        endTime: '14:00',
        isNapTime: true,
        notes: 'Extended nap',
      },
      {
        id: 'd2-b3',
        locationId: 'aeon-maluri',
        startTime: '15:00',
        endTime: '18:00',
        notes: 'Light shopping',
      },
    ],
    notes: [
      'Wake up at 5am, leave by 6am for Batu Caves',
      'Wear long pants, cover shoulders',
      'Use baby carrier NOT stroller',
      'NO visible food/drinks (monkeys!)',
      'Return home for nap - toddler will be tired',
    ],
    weatherConsideration: 'outdoor-heavy',
  },
  {
    id: 'day-3',
    date: '2025-12-23',
    dayOfWeek: 'Tuesday',
    title: 'Genting Highlands Day Trip',
    planA: [
      {
        id: 'd3-1',
        locationId: 'genting-skyavenue',
        startTime: '09:00',
        endTime: '15:00',
        notes: 'Full Genting experience',
      },
      {
        id: 'd3-2',
        locationId: 'home-base',
        startTime: '16:00',
        endTime: '17:00',
        isNapTime: true,
        notes: 'Rest after long day',
      },
      {
        id: 'd3-3',
        locationId: 'suria-klcc',
        startTime: '18:00',
        endTime: '21:00',
        notes: 'Evening mall stroll',
      },
    ],
    planB: [
      {
        id: 'd3-b1',
        locationId: 'sunway-pyramid',
        startTime: '10:00',
        endTime: '14:00',
        notes: 'Indoor playground at Play ParQ',
      },
      {
        id: 'd3-b2',
        locationId: 'home-base',
        startTime: '14:30',
        endTime: '16:00',
        isNapTime: true,
        notes: 'Afternoon nap',
      },
      {
        id: 'd3-b3',
        locationId: 'pavilion-kl',
        startTime: '17:00',
        endTime: '20:00',
        notes: 'Evening shopping',
      },
    ],
    notes: [
      'Genting is 1.5 hour drive each way',
      'Bring warm clothes! 20°C cooler than KL',
      'SkySymphony show every 30 min (free)',
      'Consider skipping evening KLCC if toddler tired',
    ],
    weatherConsideration: 'indoor-heavy',
  },
  {
    id: 'day-4',
    date: '2025-12-24',
    dayOfWeek: 'Wednesday',
    title: 'Christmas Eve - City Exploration',
    planA: [
      {
        id: 'd4-1',
        locationId: 'suria-klcc',
        startTime: '10:00',
        endTime: '12:00',
        notes: 'Morning shopping',
      },
      {
        id: 'd4-2',
        locationId: 'home-base',
        startTime: '12:30',
        endTime: '14:00',
        isNapTime: true,
        notes: 'Nap time',
      },
      {
        id: 'd4-3',
        locationId: 'petaling-street',
        startTime: '15:00',
        endTime: '17:00',
        notes: 'Chinatown exploration',
      },
      {
        id: 'd4-4',
        locationId: 'jalan-alor',
        startTime: '18:30',
        endTime: '21:00',
        notes: 'Christmas Eve dinner',
      },
    ],
    planB: [
      {
        id: 'd4-b1',
        locationId: 'pavilion-kl',
        startTime: '10:00',
        endTime: '13:00',
        notes: 'Christmas decorations are amazing!',
      },
      {
        id: 'd4-b2',
        locationId: 'home-base',
        startTime: '14:00',
        endTime: '16:00',
        isNapTime: true,
        notes: 'Extended rest',
      },
      {
        id: 'd4-b3',
        locationId: 'sunway-velocity',
        startTime: '17:00',
        endTime: '20:00',
        notes: 'Local Christmas dinner',
      },
    ],
    notes: [
      'Christmas Eve - malls will be decorated!',
      'Pavilion has spectacular Christmas setup',
      'Original plan too packed - use Plan B if tired',
      'Jalan Alor gets very crowded - go early',
    ],
    weatherConsideration: 'mixed',
  },
  {
    id: 'day-5',
    date: '2025-12-25',
    dayOfWeek: 'Thursday',
    title: 'Christmas Day - Relax + Aquaria',
    planA: [
      {
        id: 'd5-1',
        locationId: 'home-base',
        startTime: '07:00',
        endTime: '12:00',
        notes: 'Christmas morning at home, pool time',
      },
      {
        id: 'd5-2',
        locationId: 'aquaria-klcc',
        startTime: '14:30',
        endTime: '17:00',
        notes: 'Aquarium visit',
      },
      {
        id: 'd5-3',
        locationId: 'klcc-park',
        startTime: '17:30',
        endTime: '20:00',
        notes: 'Evening park time, fountain show',
      },
    ],
    planB: [
      {
        id: 'd5-b1',
        locationId: 'home-base',
        startTime: '07:00',
        endTime: '14:00',
        notes: 'Full rest day at condo',
      },
      {
        id: 'd5-b2',
        locationId: 'sunway-velocity',
        startTime: '15:00',
        endTime: '18:00',
        notes: 'Light mall visit',
      },
    ],
    notes: [
      'Christmas Day - relax!',
      'Aquaria: Use baby carrier, NOT stroller',
      'Shark feeding at 3pm if available',
      'Touch pool is highlight for toddler',
    ],
    weatherConsideration: 'indoor-heavy',
  },
  {
    id: 'day-6-9',
    date: '2025-12-26',
    dayOfWeek: 'Fri-Mon',
    title: 'Cameron Highlands (4 Days)',
    planA: [
      {
        id: 'd6-1',
        locationId: 'cameron-highlands',
        startTime: '08:00',
        endTime: '18:00',
        notes: '3-night stay at Brinchang Farm',
      },
    ],
    planB: [],
    notes: [
      'Pick up by Epicrides at 8am',
      '3-4 hour drive (winding roads - motion sickness!)',
      'Strawberry farms - toddler will love picking!',
      'BOH Tea Plantation visit',
      'Night market in Brinchang',
      'Bring warm clothes - cool weather',
      'Return Dec 29 around 4pm',
    ],
    weatherConsideration: 'outdoor-heavy',
  },
  {
    id: 'day-10',
    date: '2025-12-29',
    dayOfWeek: 'Monday',
    title: 'Return from Cameron + Evening Out',
    planA: [
      {
        id: 'd10-1',
        locationId: 'home-base',
        startTime: '16:00',
        endTime: '18:30',
        notes: 'Rest after long drive',
      },
      {
        id: 'd10-2',
        locationId: 'jalan-alor',
        startTime: '19:30',
        endTime: '22:00',
        notes: 'Dinner at Bukit Bintang',
      },
    ],
    planB: [
      {
        id: 'd10-b1',
        locationId: 'home-base',
        startTime: '16:00',
        endTime: '20:00',
        notes: 'Full rest evening',
      },
      {
        id: 'd10-b2',
        locationId: 'sunway-velocity',
        startTime: '20:00',
        endTime: '21:30',
        notes: 'Quick dinner nearby',
      },
    ],
    notes: [
      'Returning from Cameron Highlands',
      'Will be tired from trip',
      'Light evening activity only',
    ],
    weatherConsideration: 'indoor-heavy',
  },
  {
    id: 'day-11',
    date: '2025-12-30',
    dayOfWeek: 'Tuesday',
    title: 'Self-Care Day',
    planA: [
      {
        id: 'd11-1',
        locationId: 'suria-klcc',
        startTime: '10:30',
        endTime: '15:00',
        notes: 'Massage, nails, hair',
      },
      {
        id: 'd11-2',
        locationId: 'pavilion-kl',
        startTime: '16:30',
        endTime: '22:00',
        notes: 'Shopping',
      },
    ],
    planB: [
      {
        id: 'd11-b1',
        locationId: 'sunway-velocity',
        startTime: '10:00',
        endTime: '14:00',
        notes: 'Spa services available here too',
      },
      {
        id: 'd11-b2',
        locationId: 'home-base',
        startTime: '14:30',
        endTime: '17:00',
        notes: 'Rest',
      },
      {
        id: 'd11-b3',
        locationId: 'aeon-maluri',
        startTime: '18:00',
        endTime: '20:00',
        notes: 'Light shopping',
      },
    ],
    notes: [
      'Self-care day - massage, nails, hair',
      'One parent can watch toddler while other has spa time',
      'Many massage places in malls',
    ],
    weatherConsideration: 'indoor-heavy',
  },
  {
    id: 'day-12',
    date: '2025-12-31',
    dayOfWeek: 'Wednesday',
    title: "New Year's Eve!",
    planA: [
      {
        id: 'd12-1',
        locationId: 'home-base',
        startTime: '07:00',
        endTime: '15:00',
        notes: 'Relax day before big night',
      },
      {
        id: 'd12-2',
        locationId: 'klcc-park',
        startTime: '20:00',
        endTime: '00:30',
        notes: 'NYE countdown, fireworks!',
      },
    ],
    planB: [
      {
        id: 'd12-b1',
        locationId: 'home-base',
        startTime: '07:00',
        endTime: '22:00',
        notes: 'Watch fireworks from home',
      },
      {
        id: 'd12-b2',
        locationId: 'sunway-velocity',
        startTime: '18:00',
        endTime: '21:00',
        notes: 'NYE dinner at mall',
      },
    ],
    notes: [
      "NEW YEAR'S EVE!",
      'KLCC will be VERY crowded',
      'Fireworks at midnight at Petronas Towers',
      'Consider watching from distance if toddler struggles with crowds',
      'Bring ear protection for toddler (loud!)',
      'Keep toddler awake longer - will be grumpy next day',
    ],
    weatherConsideration: 'outdoor-heavy',
  },
  {
    id: 'day-13',
    date: '2026-01-01',
    dayOfWeek: 'Thursday',
    title: "New Year's Day - Recovery",
    planA: [
      {
        id: 'd13-1',
        locationId: 'home-base',
        startTime: '07:00',
        endTime: '14:00',
        notes: 'Sleep in, pool time',
      },
      {
        id: 'd13-2',
        locationId: 'suria-klcc',
        startTime: '15:00',
        endTime: '20:00',
        notes: 'Light celebration',
      },
    ],
    planB: [
      {
        id: 'd13-b1',
        locationId: 'home-base',
        startTime: '07:00',
        endTime: '18:00',
        notes: 'Full rest day',
      },
      {
        id: 'd13-b2',
        locationId: 'sunway-velocity',
        startTime: '18:30',
        endTime: '21:00',
        notes: 'Dinner',
      },
    ],
    notes: [
      'Recovery from NYE',
      'Toddler may be overtired',
      'Keep activities very light',
      'Many places closed or limited hours',
    ],
    weatherConsideration: 'indoor-heavy',
  },
  {
    id: 'day-14',
    date: '2026-01-02',
    dayOfWeek: 'Friday',
    title: 'Free Day - Catch Up',
    planA: [
      {
        id: 'd14-1',
        locationId: 'kl-bird-park',
        startTime: '09:00',
        endTime: '12:00',
        notes: 'Bird feeding at 10:30am!',
      },
      {
        id: 'd14-2',
        locationId: 'perdana-gardens',
        startTime: '12:30',
        endTime: '14:00',
        notes: 'Picnic lunch',
      },
      {
        id: 'd14-3',
        locationId: 'home-base',
        startTime: '14:30',
        endTime: '16:00',
        isNapTime: true,
        notes: 'Nap',
      },
      {
        id: 'd14-4',
        locationId: 'titiwangsa-gardens',
        startTime: '17:00',
        endTime: '19:00',
        notes: 'Sunset at lake',
      },
    ],
    planB: [
      {
        id: 'd14-b1',
        locationId: 'aquaria-klcc',
        startTime: '10:00',
        endTime: '13:00',
        notes: 'Revisit if missed earlier',
      },
      {
        id: 'd14-b2',
        locationId: 'suria-klcc',
        startTime: '14:00',
        endTime: '17:00',
        notes: 'Mall time',
      },
      {
        id: 'd14-b3',
        locationId: 'home-base',
        startTime: '17:30',
        endTime: '20:00',
        notes: 'Rest',
      },
    ],
    notes: [
      'UNPLANNED DAY - perfect for catch-ups!',
      'Bird Park if weather good',
      'Can revisit favorites',
      'Use as backup for any missed activities',
    ],
    weatherConsideration: 'mixed',
  },
  {
    id: 'day-15',
    date: '2026-01-03',
    dayOfWeek: 'Saturday',
    title: 'Putrajaya Day Trip',
    planA: [
      {
        id: 'd15-1',
        locationId: 'putrajaya-lake',
        startTime: '08:00',
        endTime: '14:00',
        notes: 'Cruise + Gardens',
      },
      {
        id: 'd15-2',
        locationId: 'home-base',
        startTime: '15:00',
        endTime: '17:00',
        isNapTime: true,
        notes: 'Rest',
      },
      {
        id: 'd15-3',
        locationId: 'sunway-velocity',
        startTime: '18:00',
        endTime: '21:00',
        notes: 'Dinner',
      },
    ],
    planB: [
      {
        id: 'd15-b1',
        locationId: 'sunway-pyramid',
        startTime: '10:00',
        endTime: '15:00',
        notes: 'Indoor playground instead',
      },
      {
        id: 'd15-b2',
        locationId: 'home-base',
        startTime: '16:00',
        endTime: '20:00',
        notes: 'Pool and rest',
      },
    ],
    notes: [
      'Putrajaya is 40-60 min drive',
      'Pink Mosque is beautiful',
      'Lake cruise books up on weekends',
      'Can combine with Cyberjaya if time',
    ],
    weatherConsideration: 'outdoor-heavy',
  },
  {
    id: 'day-16',
    date: '2026-01-04',
    dayOfWeek: 'Sunday',
    title: 'Sunway Pyramid - Indoor Fun',
    planA: [
      {
        id: 'd16-1',
        locationId: 'sunway-pyramid',
        startTime: '10:00',
        endTime: '18:00',
        notes: 'Play ParQ, ice rink viewing, shopping',
      },
    ],
    planB: [
      {
        id: 'd16-b1',
        locationId: 'home-base',
        startTime: '08:00',
        endTime: '14:00',
        notes: 'Pool and rest',
      },
      {
        id: 'd16-b2',
        locationId: 'sunway-velocity',
        startTime: '15:00',
        endTime: '19:00',
        notes: 'Local mall instead',
      },
    ],
    notes: [
      'Play ParQ is excellent for toddlers',
      'Ice rink - viewing only (too young to skate)',
      'Bring socks for playground',
      'Next to Sunway Lagoon (water park - maybe too much)',
    ],
    weatherConsideration: 'indoor-heavy',
  },
  {
    id: 'day-17',
    date: '2026-01-05',
    dayOfWeek: 'Monday',
    title: 'Last Shopping Day',
    planA: [
      {
        id: 'd17-1',
        locationId: 'pavilion-kl',
        startTime: '10:00',
        endTime: '15:00',
        notes: 'Final shopping',
      },
      {
        id: 'd17-2',
        locationId: 'home-base',
        startTime: '16:00',
        endTime: '20:00',
        notes: 'Packing',
      },
      {
        id: 'd17-3',
        locationId: 'jalan-alor',
        startTime: '21:00',
        endTime: '23:00',
        notes: 'Last dinner out',
      },
    ],
    planB: [
      {
        id: 'd17-b1',
        locationId: 'sunway-velocity',
        startTime: '10:00',
        endTime: '14:00',
        notes: 'Nearby shopping',
      },
      {
        id: 'd17-b2',
        locationId: 'home-base',
        startTime: '15:00',
        endTime: '22:00',
        notes: 'Packing + dinner at home',
      },
    ],
    notes: [
      'Last full day!',
      'Focus on any last purchases',
      'Start packing early',
      "Don't plan too much - need rest for flight",
    ],
    weatherConsideration: 'indoor-heavy',
  },
  {
    id: 'day-18',
    date: '2026-01-06',
    dayOfWeek: 'Tuesday',
    title: 'Departure Day',
    planA: [
      {
        id: 'd18-1',
        locationId: 'home-base',
        startTime: '07:00',
        endTime: '09:00',
        notes: 'Final packing, checkout',
      },
    ],
    planB: [],
    notes: [
      'Flight at 12:00pm',
      'Checkout by 9am',
      'Leave for airport by 9:30am',
      'Arrive KLIA 2 hours before flight',
      'Safe travels home!',
    ],
    weatherConsideration: 'indoor-heavy',
  },
];

// =============================================================================
// TRAVEL PLANS (For filtering)
// =============================================================================

export const TRAVEL_PLANS: TravelPlan[] = [
  {
    id: 'plan-a',
    name: 'Plan A - Main Itinerary',
    color: '#10B981',
    description: 'Your planned activities',
    isDefault: true,
  },
  {
    id: 'plan-b',
    name: 'Plan B - Rainy/Tired Day',
    color: '#3B82F6',
    description: 'Indoor alternatives when weather is bad or toddler needs rest',
    isDefault: false,
  },
  {
    id: 'toddler',
    name: 'Toddler Favorites',
    color: '#F472B6',
    description: 'Best rated for 19-month-old',
    isDefault: false,
  },
  {
    id: 'shopping',
    name: 'Shopping',
    color: '#8B5CF6',
    description: 'Malls and markets',
    isDefault: false,
  },
  {
    id: 'cultural',
    name: 'Cultural',
    color: '#F59E0B',
    description: 'Temples, museums, heritage',
    isDefault: false,
  },
  {
    id: 'nature',
    name: 'Nature & Parks',
    color: '#22C55E',
    description: 'Outdoor green spaces',
    isDefault: false,
  },
  {
    id: 'food',
    name: 'Food & Dining',
    color: '#EF4444',
    description: 'Restaurants and food streets',
    isDefault: false,
  },
  {
    id: 'day-trip',
    name: 'Day Trips',
    color: '#06B6D4',
    description: 'Longer excursions outside KL',
    isDefault: false,
  },
  {
    id: 'medical',
    name: 'Medical',
    color: '#DC2626',
    description: 'Hospitals and clinics',
    isDefault: false,
  },
];

// =============================================================================
// TODDLER SCHEDULE
// =============================================================================

export const TODDLER_SCHEDULE = {
  wakeTime: '05:00',
  morningNap: { start: '10:00', duration: 60 }, // 1 hour
  afternoonNap: { start: '15:00', duration: 30 }, // 30 min
  bedtime: '20:30',
  canSleepInStroller: true,
  foodAllergies: [],
};

// =============================================================================
// SAFETY & CULTURAL INFO
// =============================================================================

export const SAFETY_INFO = {
  emergencyNumbers: {
    police: '999',
    ambulance: '999',
    fire: '994',
    tourist_police: '03-2146 0522',
    us_embassy: '+60 3-2168-5000',
  },
  travelAdvisory: {
    level: 1,
    title: 'Exercise Normal Precautions',
    description: 'Malaysia is rated Level 1 by US State Department - lowest risk level.',
    warnings: [
      {
        area: 'Eastern Sabah Coast',
        level: 2,
        description:
          'Exercise Increased Caution due to kidnapping risk. You are NOT visiting this area.',
      },
    ],
  },
  healthTips: [
    'Tap water is NOT safe to drink - use bottled water',
    'Dengue fever risk - use mosquito repellent with 20%+ DEET',
    'Heat stroke risk - stay hydrated, avoid midday sun',
    'Hand sanitizer recommended - not all places have soap',
    'Sunscreen essential - tropical sun is strong',
  ],
  scamWarnings: [
    'Taxi drivers may not use meter - use Grab app instead',
    'Fake goods in Petaling Street - if you care',
    'Aggressive vendors - just say "no thanks" and walk away',
    'Beware pickpockets in crowded areas (Petaling St, Jalan Alor)',
    "Don't accept drinks from strangers",
  ],
  culturalEtiquette: [
    'Remove shoes before entering homes and some shops',
    'Cover shoulders and knees at religious sites',
    'Use right hand for eating and giving/receiving items',
    "Don't touch people's heads (considered sacred)",
    'Avoid pointing with finger - use whole hand',
    'Friday is holy day for Muslims - some shops close midday',
  ],
};

// =============================================================================
// WEATHER INFO FOR DEC-JAN
// =============================================================================

export const WEATHER_INFO = {
  summary:
    'December-January is ideal for West Coast Malaysia (KL, Cameron Highlands). Avoid East Coast due to monsoon.',
  klWeather: {
    temperature: '24-32°C (75-90°F)',
    humidity: '80-85%',
    rainfall: 'Occasional afternoon showers',
    recommendation: 'Perfect time to visit! Morning activities recommended.',
  },
  cameronWeather: {
    temperature: '15-25°C (59-77°F)',
    humidity: '85%',
    rainfall: 'Light showers possible',
    recommendation: 'Bring warm clothes! Much cooler than KL.',
  },
  tips: [
    'Morning activities best (cooler, less rain)',
    'Afternoon showers usually 2-4pm, then clear',
    'Always carry small umbrella or rain jacket',
    'Indoor backup plan always ready',
  ],
};
