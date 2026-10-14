// ============================================================================
// NIC (National Informatics Centre) E-Way Bill & E-Invoice Standard Types v1.03
// Indian GST Tax Compliance Standard Definitions
// ============================================================================

export type NicEnvironment = 'MOCK' | 'SANDBOX' | 'PRODUCTION';

export interface NicCredentials {
  gstin: string;
  username: string;
  password?: string;
  clientId: string;
  clientSecret?: string;
  appKey?: string;
  environment: NicEnvironment;
  authEndpoint?: string;
  apiEndpoint?: string;
}

export interface NicAuthRequest {
  action: 'ACCESSTOKEN';
  username: string;
  password?: string;
  appKey: string;
}

export interface NicAuthResponse {
  status: '1' | '0'; // 1 = Success, 0 = Failed
  errorCodes?: string;
  errorDesc?: string;
  data?: {
    authToken: string;
    sek: string; // Encrypted Session Key from NIC
    tokenExpiryMinutes: number;
    tokenExpiryTimestamp: string;
  };
}

export type NicDocType = 'INV' | 'BIL' | 'BOE' | 'CHL' | 'OTH';
export type NicSupplyType = 'O' | 'I'; // Outward / Inward
export type NicSubSupplyType = 
  | '1' // Supply
  | '2' // Import
  | '3' // Export
  | '4' // Job Work
  | '5' // For Own Use (Stock Transfer)
  | '6' // Job work Returns
  | '7' // Sales Return
  | '8' // Others
  | '9' // SKD/CKD
  | '10' // Line Sales
  | '11' // Recipient Not Known
  | '12'; // Exhibition or Training

export interface NicEwbItemLine {
  itemNo: number;
  productName: string;
  productDesc: string;
  hsnCode: number | string; // 6 to 8 digits
  quantity: number;
  qtyUnit: string; // e.g. KGS, NOS, BOX
  cgstRate: number; // e.g. 9.0
  sgstRate: number; // e.g. 9.0
  igstRate: number; // e.g. 18.0
  cessRate: number;
  taxableAmount: number;
}

export interface NicEwbGenerationPayload {
  supplyType: NicSupplyType;
  subSupplyType: NicSubSupplyType;
  subSupplyDesc?: string;
  docType: NicDocType;
  docNo: string;
  docDate: string; // DD/MM/YYYY
  
  // From Details (Supplier / Dispatcher)
  fromGstin: string;
  fromTrdName: string;
  fromAddr1: string;
  fromAddr2?: string;
  fromPlace: string;
  fromPincode: number | string;
  actFromStateCode: number | string; // 27 = Maharashtra
  fromStateCode: number | string;
  
  // To Details (Recipient / Target Plant)
  toGstin: string;
  toTrdName: string;
  toAddr1: string;
  toAddr2?: string;
  toPlace: string;
  toPincode: number | string;
  actToStateCode: number | string;
  toStateCode: number | string;
  
  // Transaction Valuation
  totalValue: number;
  cgstValue: number;
  sgstValue: number;
  igstValue: number;
  cessValue: number;
  totInvValue: number;
  
  // Transport & Vehicle Details (Part-B)
  transporterId?: string; // 15 Digit Transporter GSTIN
  transporterName?: string;
  transDocNo?: string;
  transDocDate?: string;
  transMode: '1' | '2' | '3' | '4'; // 1 = Road, 2 = Rail, 3 = Air, 4 = Ship
  distance: number; // Distance in KM
  vehicleNo: string; // e.g. MH-12-RN-8833
  vehicleType: 'R' | 'O'; // Regular / Over Dimensional Cargo
  
  // Item List
  itemList: NicEwbItemLine[];
}

export interface NicEwbResponse {
  status: '1' | '0';
  errorCodes?: string;
  errorDesc?: string;
  data?: {
    ewayBillNo: string; // 12-digit number
    ewayBillDate: string; // DD/MM/YYYY HH:MM:SS
    validUpto: string; // DD/MM/YYYY HH:MM:SS
    alert?: string;
  };
}

export interface NicCancelRequest {
  ewbNo: string;
  cancelRmrk: string; // Reason description
  cancelRsnCode: '1' | '2' | '3' | '4'; // 1 = Duplicate, 2 = Order Cancelled, 3 = Data Entry Mistake, 4 = Others
}

export interface NicCancelResponse {
  status: '1' | '0';
  errorCodes?: string;
  errorDesc?: string;
  data?: {
    ewayBillNo: string;
    cancelDate: string;
  };
}

export interface NicUpdateVehicleRequest {
  ewbNo: string;
  vehicleNo: string;
  fromPlace: string;
  fromState: number | string;
  reasonCode: '1' | '2' | '3' | '4'; // 1 = Transshipment, 2 = Vehicle Breakdown, 3 = Not updated earlier, 4 = Others
  reasonDesc: string;
  transDocNo?: string;
  transDocDate?: string;
  transMode: '1' | '2' | '3' | '4';
}

// 12-Point Test Harness Scenario Definitions
export type NicTestScenarioId = 
  | 'TEST-001' // Success
  | 'TEST-002' // Invalid GSTIN
  | 'TEST-003' // Invalid HSN
  | 'TEST-004' // Invalid PIN
  | 'TEST-005' // Invalid vehicle number
  | 'TEST-006' // Duplicate document
  | 'TEST-007' // Token expired
  | 'TEST-008' // Invalid credentials
  | 'TEST-009' // NIC unavailable
  | 'TEST-010' // Timeout
  | 'TEST-011' // Invalid invoice value
  | 'TEST-012'; // EWB cancellation failure

export interface NicTestSuiteResult {
  testId: NicTestScenarioId;
  title: string;
  description: string;
  status: 'PASSED' | 'FAILED' | 'RUNNING' | 'PENDING';
  httpStatusCode: number;
  nicErrorCode?: string;
  executionTimeMs: number;
  rawRequest: any;
  rawResponse: any;
  validationNotes: string;
}
