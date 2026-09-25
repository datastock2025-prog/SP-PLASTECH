const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/data/procurementData.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Replace the top import and INITIAL_PROCUREMENT_SUPPLIERS array
const splitIndex = content.indexOf('// ----------------------------------------------------');
const prIndex = content.indexOf('// 2. PURCHASE REQUISITIONS (PR) DATA');

if (splitIndex !== -1 && prIndex !== -1) {
  const topImport = `import {
  SupplierMaster,
  PurchaseRequisition,
  RequestForQuotation,
  QuotationComparisonSession,
  ExtendedPurchaseOrder,
  GoodsReceiptNote,
  SupplierInvoiceRecord,
  SupplierReturnRecord,
  SupplierContractRecord,
  MrpPurchaseSuggestion,
  SupplierRiskItem,
  SupplierPriceListEntry,
} from '../types/procurement';
import { DOCUMENT_LIVE_SUPPLIERS_CATALOG } from './liveSuppliersCatalog';

// ----------------------------------------------------
// 1. LIVE SUPPLIERS MASTER DATA (Document RPTM0501T01 - 411 Live Records)
// ----------------------------------------------------
export const INITIAL_PROCUREMENT_SUPPLIERS: SupplierMaster[] = DOCUMENT_LIVE_SUPPLIERS_CATALOG;

// ----------------------------------------------------
`;

  const rest = content.substring(prIndex);
  let updated = topImport + rest;

  // Replace dummy supplier references with live catalog supplier references
  updated = updated.replace(/'SUP-001'/g, "'SUP-S0128'");
  updated = updated.replace(/'Reliance Polymers Ltd'/g, "'RELIANCE INDUSTRIES LIMITED BANGALORE'");
  updated = updated.replace(/'SUP-REL-01'/g, "'S0128'");

  updated = updated.replace(/'SUP-002'/g, "'SUP-S0009'");
  updated = updated.replace(/'Clariant Masterbatches Ltd'/g, "'APPL INDUSTRIES LIMITED HSR'");
  updated = updated.replace(/'SUP-CLA-02'/g, "'S0009'");

  updated = updated.replace(/'SUP-003'/g, "'SUP-S0068'");
  updated = updated.replace(/'GAIL \(India\) Limited'/g, "'INDIAN OIL CORPORATION LIMITED'");
  updated = updated.replace(/'SUP-GAIL-03'/g, "'S0068'");

  updated = updated.replace(/'SUP-004'/g, "'SUP-S0017'");
  updated = updated.replace(/'Precision Molds & Tooling Works'/g, "'BHANSALI ENGINEERING POLYMERS LIMITED'");
  updated = updated.replace(/'SUP-PREC-04'/g, "'S0017'");

  updated = updated.replace(/'SUP-005'/g, "'SUP-S0010'");
  updated = updated.replace(/'Dynaflex Packaging Corrugators'/g, "'AR INDUSTRIES'");
  updated = updated.replace(/'SUP-DYNA-05'/g, "'S0010'");

  updated = updated.replace(/'SUP-006'/g, "'SUP-S0058'");
  updated = updated.replace(/'SABIC India Innovative Plastics'/g, "'GUJARAT STATE FERTILIZERS & CHEMICALS LIMITED TN'");
  updated = updated.replace(/'SUP-SAB-06'/g, "'S0058'");

  updated = updated.replace(/'SUP-007'/g, "'SUP-S0233'");
  updated = updated.replace(/'EcoPolymer Regrind Suppliers'/g, "'SOUTHERN RUBBER COMPANY'");
  updated = updated.replace(/'SUP-ECO-07'/g, "'S0233'");

  fs.writeFileSync(filePath, updated, 'utf8');
  console.log('Successfully updated src/data/procurementData.ts with live catalog & references!');
} else {
  console.error('Could not find split points in procurementData.ts');
}
