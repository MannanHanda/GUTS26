// Legacy client with sample-data fallback. Kept only for the banking and healthcare
// pages, which have no verified backend data yet. Real data: ./api/client.ts.
import { ApiResponse, BankAccount, HealthcareBenefit, HealthcareClinic } from './types';
import { MOCK_BANK_ACCOUNTS, MOCK_HEALTHCARE_BENEFITS, MOCK_HEALTHCARE_CLINICS } from './mock-data/glasgow-dataset';

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
}

export const apiClient = new StudentFinanceApiClient();
