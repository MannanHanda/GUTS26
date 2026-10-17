// Legacy client with sample-data fallback. Kept for banking, healthcare, and chat advisor
// which have contract fallbacks. Real backend data for recommendations, accommodations, and transport: ./api/client.ts.
import {
  ApiResponse,
  BankAccount,
  ChatMessage,
  ChatResponse,
  HealthcareBenefit,
  HealthcareClinic,
  StudentProfile,
} from './types';
import {
  MOCK_BANK_ACCOUNTS,
  MOCK_HEALTHCARE_BENEFITS,
  MOCK_HEALTHCARE_CLINICS,
} from './mock-data/glasgow-dataset';
import { generateChatbotResponse } from './calculations/chat-engine';

export class StudentFinanceApiClient {
  private baseUrl: string;

  constructor(customBaseUrl?: string) {
    this.baseUrl =
      customBaseUrl ||
      (typeof process !== 'undefined' ? process.env?.NEXT_PUBLIC_API_URL : undefined) ||
      '';
  }

  public setBaseUrl(url: string) {
    this.baseUrl = url;
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
