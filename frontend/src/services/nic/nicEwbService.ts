// ============================================================================
// NIC E-Way Bill Central Facade Service
// Unifies Mock and Live Providers with zero-code environment switching,
// automated token caching & transparent retries.
// ============================================================================

import { INicEwbProvider } from './INicEwbProvider';
import { MockNicEwbProvider } from './MockNicEwbProvider';
import { LiveNicEwbProvider } from './LiveNicEwbProvider';
import {
  NicCredentials,
  NicAuthResponse,
  NicEwbGenerationPayload,
  NicEwbResponse,
  NicCancelRequest,
  NicCancelResponse,
  NicUpdateVehicleRequest,
  NicTestScenarioId,
  NicTestSuiteResult,
  NicEnvironment,
} from '../../types/nicEwbTypes';
import { nicSecurityEngine } from './nicSecurityEngine';

export const DEFAULT_NIC_CREDENTIALS: NicCredentials = {
  gstin: '27AABCP1234F1Z1',
  username: 'SP_PLASTECH_NIC',
  clientId: 'GSP_CLIENT_SPPLAST_01',
  environment: 'MOCK',
  authEndpoint: 'https://gsp.preprod.nic.in/e-waybill/v1.03/auth',
  apiEndpoint: 'https://gsp.preprod.nic.in/e-waybill/v1.03',
};

class NicEwbService {
  private mockProvider = new MockNicEwbProvider();
  private liveProvider = new LiveNicEwbProvider();
  private credentials: NicCredentials = { ...DEFAULT_NIC_CREDENTIALS };

  /**
   * Get active provider based on environment setting
   */
  public getProvider(): INicEwbProvider {
    if (this.credentials.environment === 'MOCK') {
      return this.mockProvider;
    }
    return this.liveProvider;
  }

  /**
   * Update active credentials or switch environment between MOCK / SANDBOX / PRODUCTION
   */
  public setCredentials(creds: Partial<NicCredentials>): void {
    this.credentials = {
      ...this.credentials,
      ...creds,
    };
    // Reset session token when credentials or environment change
    nicSecurityEngine.invalidateToken();
  }

  public getCredentials(): NicCredentials {
    return { ...this.credentials };
  }

  public getEnvironment(): NicEnvironment {
    return this.credentials.environment;
  }

  /**
   * Primary method to generate an E-Way Bill (with automatic token renewal)
   */
  public async generateEwb(payload: NicEwbGenerationPayload): Promise<NicEwbResponse> {
    const provider = this.getProvider();
    let token = nicSecurityEngine.getActiveToken();

    if (!token) {
      const auth = await provider.authenticate(this.credentials);
      if (auth.status !== '1') {
        return {
          status: '0',
          errorCodes: auth.errorCodes || 'AUTH_FAIL',
          errorDesc: auth.errorDesc || 'NIC Authentication Failed',
        };
      }
      token = auth.data?.authToken;
    }

    let response = await provider.generateEwb(payload, this.credentials, token);

    // Auto-retry on token expiration (TEST-007 resolution)
    if (response.status === '0' && response.errorCodes === 'NIC-401') {
      nicSecurityEngine.invalidateToken();
      const reAuth = await provider.authenticate(this.credentials);
      if (reAuth.status === '1' && reAuth.data?.authToken) {
        response = await provider.generateEwb(payload, this.credentials, reAuth.data.authToken);
      }
    }

    return response;
  }

  /**
   * Cancel an E-Way Bill
   */
  public async cancelEwb(payload: NicCancelRequest): Promise<NicCancelResponse> {
    const provider = this.getProvider();
    const token = nicSecurityEngine.getActiveToken();
    return provider.cancelEwb(payload, this.credentials, token || undefined);
  }

  /**
   * Update vehicle / Part-B
   */
  public async updateVehicle(payload: NicUpdateVehicleRequest): Promise<NicEwbResponse> {
    const provider = this.getProvider();
    const token = nicSecurityEngine.getActiveToken();
    return provider.updateVehicle(payload, this.credentials, token || undefined);
  }

  /**
   * Execute single diagnostic test
   */
  public async runDiagnosticTest(testId: NicTestScenarioId): Promise<NicTestSuiteResult> {
    const provider = this.getProvider();
    return provider.runDiagnosticTest(testId, this.credentials);
  }

  /**
   * Run full batch of all 12 test scenarios (TEST-001 to TEST-012)
   */
  public async runFullTestSuite(
    onProgress?: (result: NicTestSuiteResult, index: number, total: number) => void
  ): Promise<NicTestSuiteResult[]> {
    const allTests: NicTestScenarioId[] = [
      'TEST-001',
      'TEST-002',
      'TEST-003',
      'TEST-004',
      'TEST-005',
      'TEST-006',
      'TEST-007',
      'TEST-008',
      'TEST-009',
      'TEST-010',
      'TEST-011',
      'TEST-012',
    ];

    const results: NicTestSuiteResult[] = [];

    for (let i = 0; i < allTests.length; i++) {
      const testId = allTests[i];
      const result = await this.runDiagnosticTest(testId);
      results.push(result);
      if (onProgress) {
        onProgress(result, i + 1, allTests.length);
      }
    }

    return results;
  }
}

export const nicEwbService = new NicEwbService();
