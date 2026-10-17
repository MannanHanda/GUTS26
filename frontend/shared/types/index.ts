export type UniversityId = 
  | 'uofg' 
  | 'strath' 
  | 'gcu' 
  | 'edinburgh' 
  | 'manchester' 
  | 'custom';

export interface UniversityInfo {
  id: UniversityId;
  name: string;
  city: string;
  mainCampusPostcode: string;
  transitHubs: string[];
}

export interface StudentProfile {
  university: string;
  city: string;
  campusPostcode: string;
  budgetPeriod: 'weekly' | 'monthly';
  totalBudget: number; // in £ (normalized internally to weekly in calculations)
  maxAccommodationBudget: number; // in £ weekly
  weeklyJourneys: number; // e.g. 10 journeys (5 return trips)
  transportPreferences: ('subway' | 'bus' | 'train' | 'walk' | 'cycle')[];
  bankingPriorities: (
    | 'interest_free_overdraft'
    | 'cashback_groceries'
    | 'low_international_fees'
    | 'railcard_incentive'
    | 'high_interest_savings'
  )[];
  tradeoffPreference: 'lowest_cost' | 'balanced' | 'shortest_commute';
  isInternational: boolean;
  studentStatus?: 'home_scotland' | 'home_uk_other' | 'international';
  studentAge?: number;
  hasPrescriptions?: boolean;
  courseYears?: number;
}

export interface AccommodationListing {
  id: string;
  name: string;
  type: 'university_halls' | 'private_hall' | 'shared_flat' | 'studio';
  address: string;
  area: string;
  postcode: string;
  weeklyRent: number;
  monthlyRent: number;
  billsIncluded: boolean;
  estimatedBillsWeekly: number; // water, heating, electricity, broadband
  deposit: number;
  adminOrHoldingFee: number;
  contractLengthWeeks: number; // e.g. 39 weeks or 51 weeks
  roomType: 'En-suite' | 'Shared Bathroom' | 'Standard Room' | 'Studio Flat';
  walkingTimeMins: number;
  transitTimeMins: number;
  transitCostWeekly: number;
  source: string;
  sourceUrl?: string;
  rating: number; // out of 5
  features: string[];
  pros: string[];
  cons: string[];
  availableFrom?: string;
}

export interface BankAccount {
  id: string;
  bankName: string;
  accountName: string;
  overdraftLimitYear1: number;
  overdraftInterestRate: number; // 0%
  internationalTransferFee: number; // in £ or %
  monthlyFee: number;
  perks: string[];
  headlineFeature: string;
  estimatedYearlyValue: number; // in £
  eligibilityNotes: string;
  bestFor: string;
  applyUrl?: string;
}

export interface TransportOption {
  id: string;
  provider: string;
  passName: string;
  mode: 'subway' | 'bus' | 'train' | 'walk' | 'cycle' | 'multimodal';
  costWeekly: number;
  costMonthly: number;
  singleFareCost: number;
  averageTripMinutes: number;
  weeklyHoursCommute: number;
  coverageArea: string;
  studentDiscountDetails: string;
  bookingUrl?: string;
}

export interface TradeOffAnalysis {
  title: string;
  advantage: string;
  disadvantage: string;
  hiddenCostFlag?: string;
  financialImpactWeekly: number; // e.g. +£14 or -£20
}

export interface TrueCostSummary {
  weeklyAccommodationRent: number;
  weeklyEstimatedBills: number;
  weeklyCommuteCost: number;
  weeklyNetLivingCost: number; // rent + bills + commute
  monthlyNetLivingCost: number; // weekly * 4.333
  semesterTotalCost: number; // 39 weeks basis

  totalUpfrontCost: number; // deposit + upfront fees + first month advance rent + initial transit pass
  
  weeklyBudget: number;
  budgetDifferenceWeekly: number; // positive = under budget, negative = over budget
  isUnderBudget: boolean;

  weeklyCommutingHours: number;
  annualCommuteHours: number;

  weeklyHealthcareEstimate: number;
  monthlyHealthcareEstimate: number;
  annualHealthcareSavings: number;
  ihsUpfrontCost: number;
}

export type StudentHealthcareStatus = 'home_scotland' | 'home_uk_other' | 'international';

export interface HealthcareBenefit {
  id: string;
  title: string;
  category: 'prescriptions' | 'dental' | 'optical' | 'gp' | 'mental_health' | 'visa_surcharge';
  headline: string;
  description: string;
  costInScotland: number;
  costInEnglandOrPrivate: number;
  estimatedAnnualSaving: number;
  eligibilityCriteria: string;
  actionRequired: string;
  badge: string;
  links?: { label: string; url: string }[];
}

export interface HealthcareClinic {
  id: string;
  name: string;
  type: 'campus_gp' | 'nhs_health_centre' | 'minor_injuries' | 'pharmacy' | 'emergency';
  campusAffiliation?: string;
  address: string;
  area: string;
  postcode: string;
  walkingDistanceMins: number;
  phone: string;
  registrationUrl?: string;
  services: string[];
  isStudentSpecialist: boolean;
  openingHours: string;
}

export interface HealthcareProfile {
  status: StudentHealthcareStatus;
  age: number;
  hasRegularPrescriptions: boolean;
  prescriptionItemsPerMonth: number;
  courseDurationYears: number;
  needsDentalCheckup: boolean;
}

export interface DecisionCombination {
  id: string;
  rank: number;
  isAiRecommended: boolean;
  aiRecommendationBadge?: string;
  recommendationReason: string;
  score: number; // 0 - 100
  accommodation: AccommodationListing;
  transport: TransportOption;
  banking: BankAccount;
  costSummary: TrueCostSummary;
  tradeoffs: TradeOffAnalysis[];
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    timestamp: string;
    source: 'live_backend' | 'contract_fallback_mock';
    latencyMs?: number;
  };
  error?: string;
}
