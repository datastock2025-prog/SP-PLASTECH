// ============================================================================
// Abstract NIC E-Way Bill Provider Interface
// Allows zero-code transition between Mock, Sandbox, and Production NIC APIs
// ============================================================================

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
} from '../../types/nicEwbTypes';

export interface INicEwbProvider {
  /**
   * Authenticate and retrieve Auth Token + Session Key
   */
  authenticate(credentials: NicCredentials): Promise<NicAuthResponse>;

  /**
   * Generate Part-A and Part-B E-Way Bill on NIC
   */
  generateEwb(
    payload: NicEwbGenerationPayload,
    credentials: NicCredentials,
    token?: string
  ): Promise<NicEwbResponse>;

  /**
   * Cancel an active E-Way Bill within 24 hours
   */
  cancelEwb(
    payload: NicCancelRequest,
    credentials: NicCredentials,
    token?: string
  ): Promise<NicCancelResponse>;

  /**
   * Update vehicle / transporter details for transshipment
   */
  updateVehicle(
    payload: NicUpdateVehicleRequest,
    credentials: NicCredentials,
    token?: string
  ): Promise<NicEwbResponse>;

  /**
   * Execute one of the 12 standard diagnostic test scenarios (TEST-001 through TEST-012)
   */
  runDiagnosticTest(
    testId: NicTestScenarioId,
    credentials: NicCredentials
  ): Promise<NicTestSuiteResult>;
}
