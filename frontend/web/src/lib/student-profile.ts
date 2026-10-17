import type { StudentProfile, UniversityInfo } from '@shared/types';

// The only campus the backend covers today. Other universities are added when the backend has data for them.
export const UNIVERSITIES: UniversityInfo[] = [
  {
    id: 'uofg',
    name: 'University of Glasgow',
    city: 'Glasgow',
    mainCampusPostcode: 'G12 8QQ',
    transitHubs: ['Hillhead Subway', 'Kelvinbridge Subway', 'Partick Interchange'],
  },
];

export const DEFAULT_STUDENT_PROFILE: StudentProfile = {
  university: 'University of Glasgow',
  city: 'Glasgow',
  campusPostcode: 'G12 8QQ',
  budgetPeriod: 'weekly',
  totalBudget: 220,
  maxAccommodationBudget: 175,
  weeklyJourneys: 10,
  transportPreferences: ['subway', 'walk', 'bus'],
  bankingPriorities: ['interest_free_overdraft', 'railcard_incentive'],
  tradeoffPreference: 'balanced',
  isInternational: false,
};
