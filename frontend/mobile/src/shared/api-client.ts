import {
  AccommodationListing,
  ApiResponse,
  BankAccount,
  ChatMessage,
  ChatResponse,
  DecisionCombination,
  HealthcareBenefit,
  HealthcareClinic,
  StudentProfile,
  TransportOption,
  TrueCostSummary,
  UniversityInfo,
} from './types';
import {
  MOCK_ACCOMMODATIONS,
  MOCK_BANK_ACCOUNTS,
  MOCK_HEALTHCARE_BENEFITS,
  MOCK_HEALTHCARE_CLINICS,
  MOCK_TRANSPORTS,
  UNIVERSITIES,
} from './mock-data/glasgow-dataset';
import {
  calculateTrueLivingCost,
  synthesizeDecisionCombinations,
} from './calculations/cost-engine';
import { generateChatbotResponse } from './calculations/chat-engine';


export class StudentFinanceApiClient {
  private baseUrl: string;

  constructor(customBaseUrl?: string) {
    this.baseUrl =
      customBaseUrl ||
      (typeof process !== 'undefined' ? process.env?.NEXT_PUBLIC_API_URL : undefined) ||
      'http://127.0.0.1:8000';
  }

  public setBaseUrl(url: string) {
    this.baseUrl = url;
  }

  public async getHealth(): Promise<ApiResponse<{ status: string; datasets?: Record<string, string> }>> {
    if (this.baseUrl) {
      try {
        const res = await fetch(`${this.baseUrl}/api/v1/health`, {
          signal: AbortSignal.timeout(3000),
        });
        if (res.ok) {
          const json = await res.json();
          return {
            success: true,
            data: json,
            meta: { timestamp: new Date().toISOString(), source: 'live_backend' },
          };
        }
      } catch (err) {
        console.warn('Backend health ping failed:', err);
      }
    }
    return {
      success: false,
      data: { status: 'offline' },
      meta: { timestamp: new Date().toISOString(), source: 'contract_fallback_mock' },
    };
  }

  public async getUniversities(): Promise<ApiResponse<UniversityInfo[]>> {
    if (this.baseUrl) {
      try {
        const res = await fetch(`${this.baseUrl}/api/v1/universities`, {
          signal: AbortSignal.timeout(3000),
        });
        if (res.ok) {
          const json = await res.json();
          return {
            success: true,
            data: json.data || json,
            meta: { timestamp: new Date().toISOString(), source: 'live_backend' },
          };
        }
      } catch (err) {
        console.warn('Backend unavailable, using fallback mock data:', err);
      }
    }

    return {
      success: true,
      data: UNIVERSITIES,
      meta: { timestamp: new Date().toISOString(), source: 'contract_fallback_mock' },
    };
  }

  public async getAccommodations(filters?: {
    maxWeeklyRent?: number;
    roomType?: string;
    billsIncludedOnly?: boolean;
  }): Promise<ApiResponse<AccommodationListing[]>> {
    if (this.baseUrl) {
      try {
        const params = new URLSearchParams();
        if (filters?.maxWeeklyRent) params.set('max_weekly_rent_gbp', filters.maxWeeklyRent.toString());

        const res = await fetch(`${this.baseUrl}/api/v1/accommodations?${params.toString()}`, {
          signal: AbortSignal.timeout(3000),
        });
        if (res.ok) {
          const json = await res.json();
          const rawItems = json.items || json.data || json;
          if (Array.isArray(rawItems) && rawItems.length > 0) {
            const mapped: AccommodationListing[] = rawItems.map((a: any) => {
              const weeklyRent = a.weekly_rent_gbp ?? a.weeklyRent ?? 175;
              const billsIncluded = a.bills_included ?? a.billsIncluded ?? true;
              return {
                id: String(a.id || a.residence_id || `acc-${Math.random()}`),
                name: a.residence_name ? `${a.residence_name} (${a.room_type || 'Standard'})` : (a.name || 'Student Residence'),
                type: (a.type || 'university_halls') as any,
                address: a.residence_name || a.address || 'Glasgow Campus Area',
                area: a.campus_id ? `${a.campus_id} Corridor` : (a.area || 'West End'),
                postcode: a.postcode || 'G12 8QQ',
                weeklyRent,
                monthlyRent: Math.round(weeklyRent * 4.333),
                billsIncluded,
                estimatedBillsWeekly: billsIncluded ? 0 : 25,
                deposit: a.deposit ?? Math.round(weeklyRent * 5),
                adminOrHoldingFee: a.adminOrHoldingFee ?? 0,
                contractLengthWeeks: a.contract_weeks ?? a.contractWeeks ?? a.contractLengthWeeks ?? 39,
                roomType: (a.room_type === 'studio' ? 'Studio Flat' : a.room_type === 'ensuite' ? 'En-suite' : 'Standard Room') as any,
                walkingTimeMins: a.walkingTimeMins ?? 18,
                transitTimeMins: a.transitTimeMins ?? 12,
                transitCostWeekly: a.transitCostWeekly ?? 0,
                source: a.source || 'University of Glasgow Residential Services',
                sourceUrl: a.sourceUrl || 'https://www.gla.ac.uk/undergraduate/accommodation/',
                rating: a.rating ?? 4.3,
                features: a.features || (billsIncluded ? ['All bills included', 'High-speed Wi-Fi', 'Campus Area'] : ['High-speed Wi-Fi']),
                pros: a.pros || ['Close to campus and public transport'],
                cons: a.cons || ['High demand, early booking required'],
              };
            });
            return {
              success: true,
              data: mapped,
              meta: { timestamp: new Date().toISOString(), source: 'live_backend' },
            };
          }
        }
      } catch (err) {
        console.warn('Backend accommodations fetch failed, using fallback mock:', err);
      }
    }

    let items = [...MOCK_ACCOMMODATIONS];
    if (filters?.maxWeeklyRent) {
      items = items.filter((a) => a.weeklyRent <= filters.maxWeeklyRent!);
    }
    if (filters?.billsIncludedOnly) {
      items = items.filter((a) => a.billsIncluded);
    }
    if (filters?.roomType && filters.roomType !== 'all') {
      items = items.filter((a) => a.roomType === filters.roomType);
    }

    return {
      success: true,
      data: items,
      meta: { timestamp: new Date().toISOString(), source: 'contract_fallback_mock' },
    };
  }

  public async getBankingOptions(): Promise<ApiResponse<BankAccount[]>> {
    if (this.baseUrl) {
      try {
        const res = await fetch(`${this.baseUrl}/api/v1/banking`, {
          signal: AbortSignal.timeout(3000),
        });
        if (res.ok) {
          const json = await res.json();
          return {
            success: true,
            data: json.data || json,
            meta: { timestamp: new Date().toISOString(), source: 'live_backend' },
          };
        }
      } catch (err) {
        console.warn('Backend banking fetch failed, fallback active:', err);
      }
    }

    return {
      success: true,
      data: MOCK_BANK_ACCOUNTS,
      meta: { timestamp: new Date().toISOString(), source: 'contract_fallback_mock' },
    };
  }

  public async getTransportOptions(): Promise<ApiResponse<TransportOption[]>> {
    if (this.baseUrl) {
      try {
        const res = await fetch(`${this.baseUrl}/api/v1/transport`, {
          signal: AbortSignal.timeout(3000),
        });
        if (res.ok) {
          const json = await res.json();
          return {
            success: true,
            data: json.data || json,
            meta: { timestamp: new Date().toISOString(), source: 'live_backend' },
          };
        }
      } catch (err) {
        console.warn('Backend transport fetch failed, fallback active:', err);
      }
    }

    return {
      success: true,
      data: MOCK_TRANSPORTS,
      meta: { timestamp: new Date().toISOString(), source: 'contract_fallback_mock' },
    };
  }

  public async getRecommendations(
    profile: StudentProfile
  ): Promise<ApiResponse<DecisionCombination[]>> {
    if (this.baseUrl) {
      try {
        const res = await fetch(`${this.baseUrl}/api/v1/recommendations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ profile }),
          signal: AbortSignal.timeout(4000),
        });
        if (res.ok) {
          const json = await res.json();
          return {
            success: true,
            data: json.data || json,
            meta: { timestamp: new Date().toISOString(), source: 'live_backend' },
          };
        }
      } catch (err) {
        console.warn('Backend recommendations failed, computing locally:', err);
      }
    }

    // Fallback: Compute with full fidelity in frontend
    const combos = synthesizeDecisionCombinations(
      MOCK_ACCOMMODATIONS,
      MOCK_TRANSPORTS,
      MOCK_BANK_ACCOUNTS,
      profile
    );

    return {
      success: true,
      data: combos,
      meta: { timestamp: new Date().toISOString(), source: 'contract_fallback_mock' },
    };
  }

  public async getHealthcareBenefits(): Promise<ApiResponse<HealthcareBenefit[]>> {
    if (this.baseUrl) {
      try {
        const res = await fetch(`${this.baseUrl}/api/v1/healthcare/benefits`, {
          signal: AbortSignal.timeout(3000),
        });
        if (res.ok) {
          const json = await res.json();
          return {
            success: true,
            data: json.data || json,
            meta: { timestamp: new Date().toISOString(), source: 'live_backend' },
          };
        }
      } catch (err) {
        console.warn('Backend healthcare benefits unreachable, using contract fallback:', err);
      }
    }

    return {
      success: true,
      data: MOCK_HEALTHCARE_BENEFITS,
      meta: { timestamp: new Date().toISOString(), source: 'contract_fallback_mock' },
    };
  }

  public async getHealthcareClinics(area?: string): Promise<ApiResponse<HealthcareClinic[]>> {
    if (this.baseUrl) {
      try {
        const url = area && area !== 'all'
          ? `${this.baseUrl}/api/v1/healthcare/clinics?area=${encodeURIComponent(area)}`
          : `${this.baseUrl}/api/v1/healthcare/clinics`;
        const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
        if (res.ok) {
          const json = await res.json();
          return {
            success: true,
            data: json.data || json,
            meta: { timestamp: new Date().toISOString(), source: 'live_backend' },
          };
        }
      } catch (err) {
        console.warn('Backend healthcare clinics unreachable, using contract fallback:', err);
      }
    }

    let data = MOCK_HEALTHCARE_CLINICS;
    if (area && area !== 'all') {
      data = data.filter((c) => c.area.toLowerCase().includes(area.toLowerCase()));
    }

    return {
      success: true,
      data,
      meta: { timestamp: new Date().toISOString(), source: 'contract_fallback_mock' },
    };
  }

  public calculateTrueCost(
    accommodation: AccommodationListing,
    transport: TransportOption,
    profile: StudentProfile
  ): TrueCostSummary {
    return calculateTrueLivingCost(accommodation, transport, profile);
  }

  public async sendChatMessage(
    userMessage: string,
    history?: ChatMessage[],
    profile?: Partial<StudentProfile>
  ): Promise<ApiResponse<ChatResponse>> {
    if (this.baseUrl) {
      try {
        const res = await fetch(`${this.baseUrl}/api/v1/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: userMessage, history, profile }),
          signal: AbortSignal.timeout(4000),
        });
        if (res.ok) {
          const json = await res.json();
          return {
            success: true,
            data: json.data || json,
            meta: { timestamp: new Date().toISOString(), source: 'live_backend' },
          };
        }
      } catch (err) {
        console.warn('Backend chat unreachable, using local AI engine fallback:', err);
      }
    }

    // Local deterministic conversational intelligence
    const fallbackResponse = generateChatbotResponse({
      userMessage,
      history,
      studentCategory: profile?.studentStatus,
      university: profile?.university,
    });

    return {
      success: true,
      data: fallbackResponse,
      meta: { timestamp: new Date().toISOString(), source: 'contract_fallback_mock' },
    };
  }
}


export const apiClient = new StudentFinanceApiClient();
