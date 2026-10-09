import { Pharmacy, Nurse, Hospital } from '../types';

// Default center coordinates for Dayr Hafir (دير حافر)
export const DAYR_HAFIR_DEFAULT = {
  latitude: 36.1575,
  longitude: 37.7058,
  districtName: 'دير حافر - الشارع العام'
};

export interface PresetDistrict {
  id: string;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
}

export const DAYR_HAFIR_PRESETS: PresetDistrict[] = [
  {
    id: 'center',
    name: 'الشارع العام ودوار البلدية',
    description: 'وسط دير حافر - قرب مبنى دار البلدية',
    latitude: 36.1575,
    longitude: 37.7058
  },
  {
    id: 'market',
    name: 'دوار السوق المركزي',
    description: 'ساحة السوق والمحلات التجارية',
    latitude: 36.1601,
    longitude: 37.7085
  },
  {
    id: 'north',
    name: 'الحي الشمالي',
    description: 'شارع المركز الثقافي القديم والمنازل الشمالية',
    latitude: 36.1630,
    longitude: 37.7040
  },
  {
    id: 'south',
    name: 'الحي الجنوبي',
    description: 'قرب جامع دير حافر الكبير',
    latitude: 36.1520,
    longitude: 37.7070
  },
  {
    id: 'highway',
    name: 'طريق حلب - الرقة الدولي',
    description: 'مدخل دير حافر الغربي ونقطة الإسعاف',
    latitude: 36.1554,
    longitude: 37.7031
  },
  {
    id: 'health-center',
    name: 'شارع المستوصف والمركز الصحي',
    description: 'قرب مستوصف دير حافر الحكومي',
    latitude: 36.1565,
    longitude: 37.7088
  },
  {
    id: 'schools',
    name: 'شارع المدارس الثانوي',
    description: 'مجمع الثانويات والمدارس',
    latitude: 36.1590,
    longitude: 37.7015
  }
];

export const INITIAL_PHARMACIES: Pharmacy[] = [
  {
    id: 'ph-1',
    name: 'صيدلية دير حافر المركزية',
    district: 'الشارع العام',
    address: 'الشارع الرئيسي - مقابل دار البلدية',
    latitude: 36.1582,
    longitude: 37.7062,
    isOpen: true,
    isOnDuty: true,
    dutyEndTime: '8:00 صباحاً',
    dutyHours: 'مناوبة 24 ساعة',
    services: ['أدوية طوارئ وإسعاف', 'مستلزمات طبية', 'حليب وأغذية أطفال']
  },
  {
    id: 'ph-2',
    name: 'صيدلية الشفاء',
    district: 'طريق حلب - الرقة',
    address: 'طريق حلب الدولي - مفرق السوق',
    latitude: 36.1554,
    longitude: 37.7031,
    isOpen: true,
    isOnDuty: true,
    dutyEndTime: '6:30 صباحاً',
    dutyHours: 'مناوبة ليلية حتى الصباح',
    services: ['أدوية الأمراض المزمنة', 'محاليل وإبر أنسولين', 'مسكنات']
  },
  {
    id: 'ph-3',
    name: 'صيدلية السلام',
    district: 'دوار السوق',
    address: 'ساحة السوق التجاري',
    latitude: 36.1601,
    longitude: 37.7085,
    isOpen: true,
    isOnDuty: false,
    dutyEndTime: '',
    dutyHours: 'دوام اعتيادي 8:00 صباحاً - 10:00 مساءً',
    services: ['صرف وصفات', 'فيتامينات ومقويات', 'قياس ضغط وسكر']
  },
  {
    id: 'ph-4',
    name: 'صيدلية النور',
    district: 'الحي الشمالي',
    address: 'شارع المركز الثقافي القديم',
    latitude: 36.1630,
    longitude: 37.7040,
    isOpen: true,
    isOnDuty: true,
    dutyEndTime: '7:00 صباحاً',
    dutyHours: 'مناوبة ليلية',
    services: ['مضادات حيوية', 'ضمادات وحروق', 'أدوية أطفال']
  },
  {
    id: 'ph-5',
    name: 'صيدلية الأمل',
    district: 'الحي الجنوبي',
    address: 'قرب جامع دير حافر الكبير',
    latitude: 36.1520,
    longitude: 37.7070,
    isOpen: true,
    isOnDuty: false,
    dutyEndTime: '',
    dutyHours: 'مفتوحة نهاراً 8:30 صباحاً - 9:00 مساءً',
    services: ['عناية شخصية', 'أجهزة تنفس وبخار']
  },
  {
    id: 'ph-6',
    name: 'صيدلية تبارك',
    district: 'شارع المدارس',
    address: 'قرب مجمع المدارس الثانوي',
    latitude: 36.1590,
    longitude: 37.7015,
    isOpen: false,
    isOnDuty: false,
    dutyEndTime: '',
    dutyHours: 'مغلقة حالياً - تفتح 8:00 صباحاً',
    services: ['مستلزمات إسعاف أولية']
  }
];

export const INITIAL_NURSES: Nurse[] = [
  {
    id: 'nr-1',
    name: 'أحمد المصطفى',
    title: 'أخصائي تمريض منزلي ورعاية جروح',
    district: 'الشارع العام - دير حافر',
    latitude: 36.1578,
    longitude: 37.7055,
    isAvailable: true,
    isOnDuty: true,
    dutyEndTime: '7:00 صباحاً',
    services: ['تركيب كانيولا ومحاليل', 'حقن عضل ووريد', 'غيار جروح وحروق'],
    phone: '+963944123456',
    experienceYears: 9,
    rating: 4.9
  },
  {
    id: 'nr-2',
    name: 'محمود العبدالله',
    title: 'ممرض عام وطوارئ ميدانية',
    district: 'الحي الشمالي - دير حافر',
    latitude: 36.1615,
    longitude: 37.7045,
    isAvailable: true,
    isOnDuty: true,
    dutyEndTime: '6:00 صباحاً',
    services: ['إعطاء محاليل وريدية', 'سحب عينات دم منزلي', 'تخفيض حرارة أطفال'],
    phone: '+963933987654',
    experienceYears: 7,
    rating: 4.8
  },
  {
    id: 'nr-3',
    name: 'إبراهيم الخليل',
    title: 'فني تمريض ورعاية كبار السن',
    district: 'الحي الجنوبي - دير حافر',
    latitude: 36.1535,
    longitude: 37.7065,
    isAvailable: true,
    isOnDuty: false,
    dutyEndTime: '',
    services: ['متابعة ضغط وسكر', 'تركيب قسطرة بولية', 'عناية طريحي الفراش'],
    phone: '+963955678123',
    experienceYears: 6,
    rating: 4.7
  },
  {
    id: 'nr-4',
    name: 'فاطمة العلي',
    title: 'قابلة وممرضة رعاية أمومة وأطفال',
    district: 'قرب المركز الصحي - دير حافر',
    latitude: 36.1560,
    longitude: 37.7080,
    isAvailable: true,
    isOnDuty: true,
    dutyEndTime: '8:00 صباحاً',
    services: ['رعاية حديثي ولادة', 'جلسات رذاذ وبخار', 'حقن منزلية'],
    phone: '+963966554433',
    experienceYears: 8,
    rating: 5.0
  }
];

export const INITIAL_HOSPITALS: Hospital[] = [
  {
    id: 'hp-1',
    name: 'المركز الصحي العام (مستوصف دير حافر)',
    type: 'مركز صحي حكومي - نقطة طوارئ',
    district: 'شارع المستوصف',
    latitude: 36.1565,
    longitude: 37.7088,
    emergency24h: true,
    emergencyPhone: '110',
    services: ['إسعافات أولية 24/7', 'ضماد وتجبير', 'قسم أطفال ولقاحات']
  },
  {
    id: 'hp-2',
    name: 'نقطة الهلال الأحمر والإسعاف الطرقي',
    type: 'نقطة إسعاف طوارئ',
    district: 'طريق حلب الدولي - مدخل دير حافر',
    latitude: 36.1540,
    longitude: 37.7020,
    emergency24h: true,
    emergencyPhone: '133',
    services: ['سيارات إسعاف سريعة', 'إنعاش فوري', 'نقل حالات حرجة']
  },
  {
    id: 'hp-3',
    name: 'مجمع العيادات والطوارئ الطبية',
    district: 'دوار البلدية',
    type: 'مجمع طبي متكامل',
    latitude: 36.1588,
    longitude: 37.7060,
    emergency24h: true,
    emergencyPhone: '021789123',
    services: ['طوارئ وإسعافات', 'مخبر تحاليل', 'عيادة أسنان وطب عام']
  }
];

// Haversine distance in kilometers
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return Math.round(d * 10) / 10;
}

// Convert any AM / PM or English times to Arabic صباحاً and مساءً
export function formatArabicTime(text?: string): string {
  if (!text) return '';
  return text
    .replace(/\b12:00\s*PM\b/gi, '12:00 ظهراً')
    .replace(/\b12:00\s*AM\b/gi, '12:00 منتصف الليل')
    .replace(/\bAM\b/gi, 'صباحاً')
    .replace(/\bPM\b/gi, 'مساءً')
    .replace(/\bam\b/gi, 'صباحاً')
    .replace(/\bpm\b/gi, 'مساءً');
}

