import { test, expect } from '@playwright/test';

const API = process.env.E2E_API_URL ?? 'http://127.0.0.1:4000';
const ORIGIN = process.env.E2E_BASE_URL ?? 'http://127.0.0.1:3000';

test.describe('Finance & Double-Entry Accounting Lifecycle (Wave 5)', () => {
  const uniqSuffix = Date.now().toString().slice(-6);

  const testCashAccCode = `1010-${uniqSuffix}`;
  const testApAccCode = `2010-${uniqSuffix}`;
  const testExpAccCode = `5010-${uniqSuffix}`;

  const testJeUnbalanced = `JE-UNBAL-${uniqSuffix}`;
  const testJeBalanced = `JE-BAL-${uniqSuffix}`;

  const testSupplierCode = `SUPP-FIN-${uniqSuffix}`;
  const testPoNumber = `PO-FIN-${uniqSuffix}`;
  const testGrnNumber = `GRN-FIN-${uniqSuffix}`;
  const testInvNumber = `INV-FIN-${uniqSuffix}`;

  test('W5-01: Chart of Accounts, Double-Entry Balance Validation, 3-Way Match & Auto-Posting', async ({ request }) => {
    // 1. Create Chart of Accounts (GL Accounts)
    const cashAccRes = await request.post(`${API}/api/v1/gl-accounts`, {
      headers: { Origin: ORIGIN },
      data: {
        account_code: testCashAccCode,
        account_name: `Main Operations Bank Account ${uniqSuffix}`,
        account_type: 'ASSET',
        account_group: 'Current Assets',
        opening_balance: '100000.00',
        current_balance: '100000.00',
        currency: 'INR',
        is_postable: true,
        is_active: true,
      },
    });
    expect([200, 201]).toContain(cashAccRes.status());
    const cashAccJson = await cashAccRes.json();
    const cashAccId = cashAccJson.data.id;

    const apAccRes = await request.post(`${API}/api/v1/gl-accounts`, {
      headers: { Origin: ORIGIN },
      data: {
        account_code: testApAccCode,
        account_name: `Trade Creditors & Accounts Payable ${uniqSuffix}`,
        account_type: 'LIABILITY',
        account_group: 'Current Liabilities',
        opening_balance: '0.00',
        current_balance: '0.00',
        currency: 'INR',
        is_postable: true,
        is_active: true,
      },
    });
    expect([200, 201]).toContain(apAccRes.status());
    const apAccJson = await apAccRes.json();
    const apAccId = apAccJson.data.id;

    const expAccRes = await request.post(`${API}/api/v1/gl-accounts`, {
      headers: { Origin: ORIGIN },
      data: {
        account_code: testExpAccCode,
        account_name: `Factory Operational Expense ${uniqSuffix}`,
        account_type: 'EXPENSE',
        account_group: 'Operating Expenses',
        opening_balance: '0.00',
        current_balance: '0.00',
        currency: 'INR',
        is_postable: true,
        is_active: true,
      },
    });
    expect([200, 201]).toContain(expAccRes.status());
    const expAccJson = await expAccRes.json();
    const expAccId = expAccJson.data.id;

    // Verify GET accounts endpoint
    const listAccRes = await request.get(`${API}/api/v1/gl-accounts?account_code=${testCashAccCode}`, {
      headers: { Origin: ORIGIN },
    });
    expect(listAccRes.status()).toBe(200);
    const listAccJson = await listAccRes.json();
    expect(listAccJson.data.length).toBeGreaterThan(0);
    expect(listAccJson.data[0].account_code).toBe(testCashAccCode);

    // 2. Test Transactional Debit = Credit Validation: Create UNBALANCED Journal Entry
    const unbalJeRes = await request.post(`${API}/api/v1/journal-entries`, {
      headers: { Origin: ORIGIN },
      data: {
        je_number: testJeUnbalanced,
        je_date: new Date().toISOString(),
        description: `Unbalanced testing entry ${uniqSuffix}`,
        total_debit: '1000.00',
        total_credit: '800.00',
        lines: [
          {
            line_no: 1,
            account_id: expAccId,
            account_code: testExpAccCode,
            debit_amount: '1000.00',
            credit_amount: '0.00',
            description: 'Debit test',
          },
          {
            line_no: 2,
            account_id: cashAccId,
            account_code: testCashAccCode,
            debit_amount: '0.00',
            credit_amount: '800.00', // Unbalanced: 1000 != 800
            description: 'Credit test',
          },
        ],
      },
    });
    expect([200, 201]).toContain(unbalJeRes.status());
    const unbalJeJson = await unbalJeRes.json();
    const unbalJeId = unbalJeJson.data.id;

    // Attempting to POST the unbalanced entry MUST fail with HTTP 422 UNBALANCED_JOURNAL_ENTRY
    const postUnbalRes = await request.post(`${API}/api/v1/journal-entries/${unbalJeId}/post`, {
      headers: { Origin: ORIGIN },
    });
    expect(postUnbalRes.status()).toBe(422);
    const postUnbalJson = await postUnbalRes.json();
    expect(postUnbalJson.error.code).toBe('UNBALANCED_JOURNAL_ENTRY');

    // 3. Create BALANCED Journal Entry and Post to GL
    const balJeRes = await request.post(`${API}/api/v1/journal-entries`, {
      headers: { Origin: ORIGIN },
      data: {
        je_number: testJeBalanced,
        je_date: new Date().toISOString(),
        description: `Factory Maintenance Expense Payment ${uniqSuffix}`,
        total_debit: '2500.00',
        total_credit: '2500.00',
        lines: [
          {
            line_no: 1,
            account_id: expAccId,
            account_code: testExpAccCode,
            debit_amount: '2500.00',
            credit_amount: '0.00',
            description: 'Factory repairs debit',
          },
          {
            line_no: 2,
            account_id: cashAccId,
            account_code: testCashAccCode,
            debit_amount: '0.00',
            credit_amount: '2500.00',
            description: 'Cash payment credit',
          },
        ],
      },
    });
    expect([200, 201]).toContain(balJeRes.status());
    const balJeJson = await balJeRes.json();
    const balJeId = balJeJson.data.id;

    // Post the balanced journal entry
    const postBalRes = await request.post(`${API}/api/v1/journal-entries/${balJeId}/post`, {
      headers: { Origin: ORIGIN },
    });
    expect(postBalRes.status()).toBe(200);
    const postBalJson = await postBalRes.json();
    expect(postBalJson.data.status).toBe('POSTED');

    // Verify GL Account balance updates
    // Cash (Asset): 100,000 - 2,500 = 97,500
    const cashUpdatedRes = await request.get(`${API}/api/v1/gl-accounts/${cashAccId}`, {
      headers: { Origin: ORIGIN },
    });
    expect(cashUpdatedRes.status()).toBe(200);
    const cashUpdatedJson = await cashUpdatedRes.json();
    expect(parseFloat(cashUpdatedJson.data.current_balance)).toBeCloseTo(97500.00, 2);

    // Expense: 0 + 2,500 = 2,500
    const expUpdatedRes = await request.get(`${API}/api/v1/gl-accounts/${expAccId}`, {
      headers: { Origin: ORIGIN },
    });
    expect(expUpdatedRes.status()).toBe(200);
    const expUpdatedJson = await expUpdatedRes.json();
    expect(parseFloat(expUpdatedJson.data.current_balance)).toBeCloseTo(2500.00, 2);

    // 4. Test Journal Entry Reversal
    const reverseRes = await request.post(`${API}/api/v1/journal-entries/${balJeId}/reverse`, {
      headers: { Origin: ORIGIN },
    });
    expect(reverseRes.status()).toBe(200);
    const reverseJson = await reverseRes.json();
    expect(reverseJson.data.status).toBe('REVERSED');

    // Verify Cash account reverted back to 100,000
    const cashRevertedRes = await request.get(`${API}/api/v1/gl-accounts/${cashAccId}`, {
      headers: { Origin: ORIGIN },
    });
    const cashRevertedJson = await cashRevertedRes.json();
    expect(parseFloat(cashRevertedJson.data.current_balance)).toBeCloseTo(100000.00, 2);

    // 5. Test Accounts Payable & 3-Way Match Workflow
    // Create Supplier
    const suppRes = await request.post(`${API}/api/v1/suppliers`, {
      headers: { Origin: ORIGIN },
      data: {
        code: testSupplierCode,
        name: `Supreme Petrochemicals Ltd ${uniqSuffix}`,
        type: 'Raw Material Supplier',
        category: 'Polymers',
        status: 'active',
      },
    });
    expect([200, 201]).toContain(suppRes.status());

    // Create Purchase Order
    const poRes = await request.post(`${API}/api/v1/purchase-orders`, {
      headers: { Origin: ORIGIN },
      data: {
        po_number: testPoNumber,
        supplier_id: testSupplierCode,
        total_amount: '10000.00',
        items: [
          {
            item_code: `POLY-${uniqSuffix}`,
            item_name: 'Polypropylene Granules',
            quantity: 100,
            unit_price: 100.00,
            total_price: 10000.00,
          },
        ],
        status: 'approved',
      },
    });
    expect([200, 201]).toContain(poRes.status());

    // Create Goods Receipt Note (GRN)
    const grnRes = await request.post(`${API}/api/v1/goods-receipt-notes`, {
      headers: { Origin: ORIGIN },
      data: {
        grn_number: testGrnNumber,
        po_id: testPoNumber,
        supplier_id: testSupplierCode,
        total_amount: '10000.00',
        lines: [
          {
            item_code: `POLY-${uniqSuffix}`,
            item_name: 'Polypropylene Granules',
            received_qty: 100,
            accepted_qty: 100,
            unit_price: 100.00,
          },
        ],
        status: 'completed',
      },
    });
    expect([200, 201]).toContain(grnRes.status());

    // Create AP Invoice matching PO and GRN
    const invRes = await request.post(`${API}/api/v1/ap-invoices`, {
      headers: { Origin: ORIGIN },
      data: {
        invoice_number: testInvNumber,
        supplier_id: testSupplierCode,
        po_id: testPoNumber,
        grn_id: testGrnNumber,
        total_amount: '11800.00', // 10,000 base + 1,800 GST
        tax_amount: '1800.00',
        lines: [
          {
            item_code: `POLY-${uniqSuffix}`,
            invoice_qty: 100,
            unit_price: 100.00,
            total_amount: 10000.00,
          },
        ],
        status: 'PENDING',
      },
    });
    expect([200, 201]).toContain(invRes.status());
    const invJson = await invRes.json();
    const invId = invJson.data.id;

    // Execute 3-Way Match Check
    const matchRes = await request.post(`${API}/api/v1/ap-invoices/${invId}/match`, {
      headers: { Origin: ORIGIN },
    });
    expect(matchRes.status()).toBe(200);
    const matchJson = await matchRes.json();
    expect(matchJson.data.match_status).toBe('MATCHED');

    // 6. Approve AP Invoice & Verify Auto-Posting of Balanced Double-Entry Journal Entry
    const approveRes = await request.post(`${API}/api/v1/ap-invoices/${invId}/approve`, {
      headers: { Origin: ORIGIN },
    });
    expect(approveRes.status()).toBe(200);
    const approveJson = await approveRes.json();
    expect(approveJson.data.invoice.status).toBe('APPROVED');
    expect(approveJson.data.journalEntry).toBeDefined();
    expect(approveJson.data.journalEntry.status).toBe('POSTED');
    expect(parseFloat(approveJson.data.journalEntry.total_debit)).toBeCloseTo(11800.00, 2);
    expect(parseFloat(approveJson.data.journalEntry.total_credit)).toBeCloseTo(11800.00, 2);

    // Verify auto-generated Journal Lines
    const jeLinesRes = await request.get(`${API}/api/v1/journal-lines?je_id=${approveJson.data.journalEntry.id}`, {
      headers: { Origin: ORIGIN },
    });
    expect(jeLinesRes.status()).toBe(200);
    const jeLinesJson = await jeLinesRes.json();
    expect(jeLinesJson.data.length).toBeGreaterThanOrEqual(2);

    let sumDr = 0;
    let sumCr = 0;
    for (const l of jeLinesJson.data) {
      sumDr += parseFloat(l.debit_amount);
      sumCr += parseFloat(l.credit_amount);
    }
    expect(sumDr).toBeCloseTo(11800.00, 2);
    expect(sumCr).toBeCloseTo(11800.00, 2);
  });
});
