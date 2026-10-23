import { test, expect } from '@playwright/test';

const API = process.env.E2E_API_URL ?? 'http://127.0.0.1:4000';
const ORIGIN = process.env.E2E_BASE_URL ?? 'http://127.0.0.1:3000';

test.describe('HR, Analytics & Workspace Approvals Lifecycle (Wave 6)', () => {
  const uniqSuffix = Date.now().toString().slice(-6);

  const testEmpCode = `EMP-${uniqSuffix}`;
  const testWfCode = `WF-${uniqSuffix}`;
  const testTaskTitle = `Calibrate Injection Mold Pressure Sensors ${uniqSuffix}`;

  test('W6-01: Full HR, Operator Skills, Unified Approvals & Executive Analytics Engine', async ({ request }) => {
    // ------------------------------------------------------------------------
    // 1. HR: Employee Directory, Attendance Import & Operator Skill Certification
    // ------------------------------------------------------------------------
    const empRes = await request.post(`${API}/api/v1/employees`, {
      headers: { Origin: ORIGIN },
      data: {
        employee_code: testEmpCode,
        first_name: 'Rajesh',
        last_name: `Kumar ${uniqSuffix}`,
        email: `rajesh.${uniqSuffix}@spplastech.com`,
        phone: '+91 98765 12345',
        gender: 'MALE',
        department: 'Tooling & Injection Molding',
        designation: 'Senior Tooling Technician',
        employment_type: 'PERMANENT',
        status: 'ACTIVE',
        date_of_joining: new Date().toISOString(),
        aadhaar_masked: 'XXXX-XXXX-8921',
        pan_masked: 'ABCDE****F',
        bank_account_masked: 'XXXX-XXXX-4512',
        skills: ['Mold Setup', 'Hydraulic Troubleshooting', 'Hot Runner Maintenance'],
        certifications: ['Certified Master Molder Level 2'],
      },
    });
    expect([200, 201]).toContain(empRes.status());
    const empJson = await empRes.json();
    const empId = empJson.data.id;

    // Verify employee lookup
    const getEmpRes = await request.get(`${API}/api/v1/employees?employee_code=${testEmpCode}`, {
      headers: { Origin: ORIGIN },
    });
    expect(getEmpRes.status()).toBe(200);
    const getEmpJson = await getEmpRes.json();
    expect(getEmpJson.data.length).toBeGreaterThan(0);
    expect(getEmpJson.data[0].employee_code).toBe(testEmpCode);
    expect(getEmpJson.data[0].aadhaar_masked).toBe('XXXX-XXXX-8921');

    // Bulk Import Attendance
    const todayStr = new Date().toISOString().split('T')[0];
    const attImportRes = await request.post(`${API}/api/v1/attendance/import`, {
      headers: { Origin: ORIGIN },
      data: {
        records: [
          {
            employee_id: testEmpCode,
            employee_name: `Rajesh Kumar ${uniqSuffix}`,
            date: todayStr,
            check_in: new Date().toISOString(),
            status: 'PRESENT',
            shift: 'Shift A (07:00 - 15:30)',
          },
        ],
      },
    });
    expect(attImportRes.status()).toBe(201);
    const attImportJson = await attImportRes.json();
    expect(attImportJson.data.imported).toBe(1);

    // Verify Attendance Record Query
    const attQueryRes = await request.get(`${API}/api/v1/attendance-records?employee_id=${testEmpCode}`, {
      headers: { Origin: ORIGIN },
    });
    expect(attQueryRes.status()).toBe(200);
    const attQueryJson = await attQueryRes.json();
    expect(attQueryJson.data.length).toBeGreaterThan(0);
    expect(attQueryJson.data[0].employee_id).toBe(testEmpCode);

    // Operator Skills Matrix Certification
    const skillRes = await request.post(`${API}/api/v1/operator-skills`, {
      headers: { Origin: ORIGIN },
      data: {
        operator_id: testEmpCode,
        machine_id: 'IMM-180T-01',
        skill_name: 'Hot Runner Temperature Controller Tuning',
        competency_level: 4,
        is_certified: true,
        certified_date: new Date().toISOString(),
      },
    });
    expect([200, 201]).toContain(skillRes.status());
    const skillJson = await skillRes.json();
    expect(skillJson.data.skill_name).toBe('Hot Runner Temperature Controller Tuning');

    // ------------------------------------------------------------------------
    // 2. Workspace: Tasks, Notifications & In-App Alerts
    // ------------------------------------------------------------------------
    // Create Task
    const taskRes = await request.post(`${API}/api/v1/workspace/tasks`, {
      headers: { Origin: ORIGIN },
      data: {
        title: testTaskTitle,
        description: 'Verify toggle clamping force and calibrate piezoelectric pressure transducers',
        status: 'TODO',
        priority: 'HIGH',
        assigned_to: testEmpCode,
      },
    });
    expect([200, 201]).toContain(taskRes.status());
    const taskJson = await taskRes.json();
    const taskId = taskJson.data.id;

    // Update Task Status
    const updateTaskRes = await request.patch(`${API}/api/v1/workspace/tasks/${taskId}`, {
      headers: { Origin: ORIGIN },
      data: {
        status: 'IN_PROGRESS',
        version: taskJson.data.version,
      },
    });
    expect(updateTaskRes.status()).toBe(200);
    const updateTaskJson = await updateTaskRes.json();
    expect(updateTaskJson.data.status).toBe('IN_PROGRESS');

    // Create and read Notification
    const notifRes = await request.post(`${API}/api/v1/notifications`, {
      headers: { Origin: ORIGIN },
      data: {
        user_id: 'admin',
        type: 'TASK_ASSIGNED',
        title: 'New Maintenance Work Order',
        message: `Task ${testTaskTitle} has been scheduled.`,
        is_read: false,
      },
    });
    expect([200, 201]).toContain(notifRes.status());
    const notifJson = await notifRes.json();
    const notifId = notifJson.data.id;

    // Mark notification as read
    const readNotifRes = await request.patch(`${API}/api/v1/workspace/notifications/${notifId}/read`, {
      headers: { Origin: ORIGIN },
    });
    expect(readNotifRes.status()).toBe(200);
    const readNotifJson = await readNotifRes.json();
    expect(readNotifJson.data.is_read).toBe(true);

    // ------------------------------------------------------------------------
    // 3. Central Approvals Hub: Workflow Definition, Submission & Decision
    // ------------------------------------------------------------------------
    const wfRes = await request.post(`${API}/api/v1/approval-workflows`, {
      headers: { Origin: ORIGIN },
      data: {
        code: testWfCode,
        name: `Engineering Tooling Scrap Approval ${uniqSuffix}`,
        entityType: 'TOOLING_SCRAP',
        minAmount: 1000,
        maxAmount: 500000,
        steps: [
          {
            stepNumber: 1,
            stepName: 'Plant Manager Review',
            approverType: 'ROLE',
            approverId: 'SUPER_ADMIN',
            isMandatory: true,
          },
        ],
      },
    });
    expect(wfRes.status()).toBe(201);
    const wfJson = await wfRes.json();
    const wfId = wfJson.data.id;

    // Submit Approval Request
    const appReqRes = await request.post(`${API}/api/v1/approval-requests`, {
      headers: { Origin: ORIGIN },
      data: {
        workflowId: wfId,
        entityType: 'TOOLING_SCRAP',
        entityId: `SCRAP-BATCH-${uniqSuffix}`,
        amount: 25000,
        metadata: { reason: 'Cracked core insert beyond EDM refurbishment threshold' },
      },
    });
    expect(appReqRes.status()).toBe(201);
    const appReqJson = await appReqRes.json();
    const reqId = appReqJson.data.id;

    // Query through Unified Workspace Approvals Inbox
    const inboxRes = await request.get(`${API}/api/v1/workspace/approvals?status=PENDING`, {
      headers: { Origin: ORIGIN },
    });
    expect(inboxRes.status()).toBe(200);
    const inboxJson = await inboxRes.json();
    const foundInInbox = inboxJson.data.some((r: any) => r.id === reqId);
    expect(foundInInbox).toBe(true);

    // Decide on approval through Unified Workspace Decision endpoint
    const decideRes = await request.post(`${API}/api/v1/workspace/approvals/${reqId}/decision`, {
      headers: { Origin: ORIGIN },
      data: {
        decision: 'APPROVED',
        comments: 'Verified with Toolroom lead. Scrap write-off authorized.',
      },
    });
    expect(decideRes.status()).toBe(200);
    const decideJson = await decideRes.json();
    expect(decideJson.data.status).toBe('APPROVED');

    // ------------------------------------------------------------------------
    // 4. Executive Analytics & Telemetry Engine
    // ------------------------------------------------------------------------
    // Executive KPIs
    const kpiRes = await request.get(`${API}/api/v1/analytics/executive-kpis`, {
      headers: { Origin: ORIGIN },
    });
    expect(kpiRes.status()).toBe(200);
    const kpiJson = await kpiRes.json();
    expect(kpiJson.data).toBeDefined();
    expect(kpiJson.data.ebitdaMargin).toBeGreaterThan(0);
    expect(typeof kpiJson.data.totalInventoryValue).toBe('number');
    expect(typeof kpiJson.data.openSalesOrdersValue).toBe('number');

    // OEE & Loss Pareto
    const oeeRes = await request.get(`${API}/api/v1/analytics/oee/telemetry`, {
      headers: { Origin: ORIGIN },
    });
    expect(oeeRes.status()).toBe(200);
    const oeeJson = await oeeRes.json();
    expect(oeeJson.data.overallOee).toBeGreaterThan(0);
    expect(Array.isArray(oeeJson.data.records)).toBe(true);
    expect(Array.isArray(oeeJson.data.lossPareto)).toBe(true);

    // Quality Defect & Scrap Analysis
    const qualRes = await request.get(`${API}/api/v1/analytics/quality/metrics`, {
      headers: { Origin: ORIGIN },
    });
    expect(qualRes.status()).toBe(200);
    const qualJson = await qualRes.json();
    expect(Array.isArray(qualJson.data)).toBe(true);

    // SCM OTIF Performance
    const scmRes = await request.get(`${API}/api/v1/analytics/scm/kpis`, {
      headers: { Origin: ORIGIN },
    });
    expect(scmRes.status()).toBe(200);
    const scmJson = await scmRes.json();
    expect(scmJson.data.otifPercentage).toBeGreaterThanOrEqual(0);
  });
});
