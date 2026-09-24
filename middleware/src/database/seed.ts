import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DatabaseService } from './database.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class DatabaseSeedService implements OnModuleInit {
  private readonly logger = new Logger(DatabaseSeedService.name);

  constructor(private readonly db: DatabaseService) {}

  async onModuleInit() {
    await this.seedDatabase();
  }

  public async seedDatabase() {
    try {
      this.logger.log('Starting comprehensive SP-PLASTECH ERP database seeding (Pre-Production Dataset)...');

      // 1. Facilities
      await this.db.query(`
        INSERT INTO tenant_profiles (id, code, name, location, entity_type, address, contact_person, contact_email, contact_phone, gstin, capacity_rating, is_default)
        VALUES 
          ('PLANT-01', 'PLANT-01', 'Plant 01: Injection Molding Unit', 'Pune / Chakan Industrial Corridor, Maharashtra', 'Plant', 'Plot B-12, Chakan Industrial Area, Phase II, Pune 410501', 'Priya Rao', 'priya.rao@spplastech.com', '+91 98230 11223', '27AAACR1234F1Z5', '24 IMM Bays (120T - 1300T)', true),
          ('PLANT-02', 'PLANT-02', 'Plant 02: Extrusion & Pipe Unit', 'Sanand Precision Park, Gujarat', 'Plant', 'Plot 44, GIDC Sanand II, Ahmedabad 382110', 'Vikram Patel', 'vikram.patel@spplastech.com', '+91 98230 22334', '24AAACR1234F1Z8', '16 High-Precision IMMs', false),
          ('PLANT-03', 'PLANT-03', 'Plant 03: Blow Molding & Cleanroom', 'Chennai Molding Unit, Tamil Nadu', 'Plant', 'SIPCOT Industrial Park, Sriperumbudur 602105', 'Karthik Subramanian', 'karthik.s@spplastech.com', '+91 98230 33445', '33AAACR1234F1Z1', '12 Blow & Stretch Bays', false)
        ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, location = EXCLUDED.location;
      `);

      // 2. Roles
      await this.db.query(`
        INSERT INTO auth_roles (id, name, description, scope, department, is_system_role)
        VALUES 
          ('ROLE-SUPER-ADMIN', 'Super Administrator', 'Full System Master Configuration & RBAC', 'Enterprise-wide', 'Executive Leadership', true),
          ('ROLE-PLANT-MANAGER', 'Plant Operations Director', 'OEE, Production Schedules & Floor Overrides', 'Plant Scoped', 'Manufacturing Execution', true),
          ('ROLE-PROD-PLANNER', 'Production Planner', 'MRP Runs, JIT Scheduling & Job Cards', 'Plant Scoped', 'Manufacturing Execution', false),
          ('ROLE-QA-LEAD', 'Quality Assurance Lead', 'CMM Scans, Lab Inspections & NCR Dispositions', 'Plant Scoped', 'Quality Assurance', false),
          ('ROLE-MAINTENANCE-LEAD', 'Maintenance Engineer', 'Mold PM, Machine Breakdown & Tooling Spares', 'Plant Scoped', 'Maintenance & Facilities', false),
          ('ROLE-FINANCE-CONTROLLER', 'Financial Controller', 'Cost Rollup, AR/AP, Invoices & GST Returns', 'Enterprise-wide', 'Finance & Accounting', false),
          ('ROLE-HR-MANAGER', 'Industrial HR Manager', 'Shift Rotations, Overtime & Biometric Attendance', 'Plant Scoped', 'Human Resources', false),
          ('ROLE-SCM-DIRECTOR', 'SCM Director', 'Supply Chain Control Tower, S&OP & Inventory', 'Enterprise-wide', 'Supply Chain Management', false)
        ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;
      `);

      // 3. Users
      const defaultPasswordHash = await bcrypt.hash('SpPlastech2026!#', 10);
      await this.db.query(`
        INSERT INTO auth_users (id, tenant_id, role_id, email, username, password_hash, full_name, phone, designation, department, plant_ids, status, is_active)
        VALUES 
          ('USR-001', 'PLANT-01', 'ROLE-SUPER-ADMIN', 'priya.rao@spplastech.com', 'priya.rao', '${defaultPasswordHash}', 'Priya Rao', '+91 98230 11223', 'VP Operations', 'Executive Operations', '["PLANT-01","PLANT-02","PLANT-03"]'::jsonb, 'ACTIVE', true),
          ('USR-002', 'PLANT-01', 'ROLE-PLANT-MANAGER', 'vikram.patel@spplastech.com', 'vikram.patel', '${defaultPasswordHash}', 'Vikram Patel', '+91 98230 22334', 'Plant Manager', 'Manufacturing Execution', '["PLANT-01"]'::jsonb, 'ACTIVE', true),
          ('USR-003', 'PLANT-01', 'ROLE-QA-LEAD', 'ananya.deshmukh@spplastech.com', 'ananya.deshmukh', '${defaultPasswordHash}', 'Ananya Deshmukh', '+91 98230 33445', 'QA Lead', 'Quality Assurance', '["PLANT-01"]'::jsonb, 'ACTIVE', true),
          ('USR-004', 'PLANT-01', 'ROLE-FINANCE-CONTROLLER', 'rajesh.sharma@spplastech.com', 'rajesh.sharma', '${defaultPasswordHash}', 'Rajesh Sharma', '+91 98230 44556', 'Financial Controller', 'Finance & Accounting', '["PLANT-01","PLANT-02"]'::jsonb, 'ACTIVE', true)
        ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name;
      `);

      // 4. Items (Resins, Masterbatches, Finished Polymer Goods)
      await this.db.query(`
        INSERT INTO items (id, code, name, category, polymer_type, grade, mfi_rating, density, color, uom, standard_cost, safety_stock, reorder_point, current_stock, status, approval)
        VALUES 
          ('ITEM-RM-01', 'RM-PP-CP-01', 'PP Copolymer High Impact Grade MI 12', 'RAW_MATERIAL', 'PP', 'Injection Grade', 12.00, 0.9050, 'Natural', 'KG', 118.50, 5000.00, 10000.00, 24500.00, 'active', 'approved'),
          ('ITEM-RM-02', 'RM-HDPE-BL-01', 'HDPE Blow Molding High Density 0.954', 'RAW_MATERIAL', 'HDPE', 'Blow Grade', 0.35, 0.9540, 'Natural', 'KG', 124.00, 4000.00, 8000.00, 18200.00, 'active', 'approved'),
          ('ITEM-RM-03', 'RM-ABS-IN-01', 'ABS Lustran High Heat Automobile Grade', 'RAW_MATERIAL', 'ABS', 'Injection Grade', 22.00, 1.0500, 'Natural White', 'KG', 195.00, 2500.00, 5000.00, 6800.00, 'active', 'approved'),
          ('ITEM-MB-01', 'MB-WHITE-TITAN-01', 'White Masterbatch (TiO2 70% Loading)', 'RAW_MATERIAL', 'PP', 'Additive', NULL, 1.8500, 'Opaque White', 'KG', 260.00, 800.00, 1500.00, 3200.00, 'active', 'approved'),
          ('ITEM-MB-02', 'MB-BLUE-ROYAL-01', 'Royal Blue Masterbatch (Food Contact Safe)', 'RAW_MATERIAL', 'PP', 'Additive', NULL, 1.2500, 'Royal Blue', 'KG', 340.00, 400.00, 800.00, 1450.00, 'active', 'approved'),
          ('ITEM-FG-01', 'FG-CAP-28MM-W', '28mm PCO 1881 Beverage Cap (White)', 'FINISHED_GOOD', 'PP', 'Closure', NULL, 0.9100, 'White', 'NOS', 0.85, 100000.00, 250000.00, 640000.00, 'active', 'approved'),
          ('ITEM-FG-02', 'FG-BOTTLE-500ML-HDPE', '500ml HDPE Agro Chemical Bottle', 'FINISHED_GOOD', 'HDPE', 'Container', NULL, 0.9550, 'Natural', 'NOS', 6.20, 25000.00, 50000.00, 88500.00, 'active', 'approved'),
          ('ITEM-FG-03', 'FG-AUTO-BEZEL-ABS', 'Instrument Cluster Housing Bezel', 'FINISHED_GOOD', 'ABS', 'Automotive', NULL, 1.0500, 'Gloss Black', 'NOS', 48.50, 2000.00, 5000.00, 7800.00, 'active', 'approved')
        ON CONFLICT (id) DO UPDATE SET current_stock = EXCLUDED.current_stock, standard_cost = EXCLUDED.standard_cost;
      `);

      // 5. Machines
      await this.db.query(`
        INSERT INTO machines (id, code, name, model, tonnage, machine_type, plant_id, bay_location, cycle_time_rated, power_kw, status, current_oee, availability_pct, performance_pct, quality_pct)
        VALUES 
          ('MCH-01', 'IMM-150-01', 'Engel Victory 150T Tie-bar-less', 'Victory 150/80', 150, 'Injection Molding', 'PLANT-01', 'Bay A-1', 14.50, 37.0, 'running', 88.40, 92.50, 96.80, 98.70),
          ('MCH-02', 'IMM-250-01', 'Toshiba IS-250 High Precision', 'IS-250GT', 250, 'Injection Molding', 'PLANT-01', 'Bay A-2', 18.20, 55.0, 'running', 85.20, 89.00, 96.20, 99.40),
          ('MCH-03', 'IMM-450-01', 'Haitian Mars II 450T Energy-Saver', 'MA4500II', 450, 'Injection Molding', 'PLANT-01', 'Bay B-1', 28.00, 75.0, 'running', 82.10, 87.50, 94.80, 99.00),
          ('MCH-04', 'BLOW-01', 'Bekum Blow Molding Machine 5L', 'EBM-5000', 30, 'Blow Molding', 'PLANT-03', 'Bay C-1', 22.00, 45.0, 'running', 86.70, 91.00, 95.50, 99.80)
        ON CONFLICT (id) DO UPDATE SET current_oee = EXCLUDED.current_oee, status = EXCLUDED.status;
      `);

      // 6. Bills of Materials (BOMs)
      await this.db.query(`
        INSERT INTO boms (id, bom_number, item_id, name, version, status, shot_weight_g, runner_weight_g, cavities, standard_cycle_time_s, scrap_allowance_pct)
        VALUES 
          ('BOM-01', 'BOM-CAP-28MM-01', 'ITEM-FG-01', '28mm Beverage Cap Multi-Cavity Recipe', 'v2.1', 'active', 2.850, 0.450, 16, 12.50, 1.20),
          ('BOM-02', 'BOM-BOTTLE-500ML-01', 'ITEM-FG-02', '500ml HDPE Agro Bottle Extrusion Blow', 'v1.0', 'active', 32.000, 4.200, 2, 22.00, 2.50),
          ('BOM-03', 'BOM-AUTO-BEZEL-01', 'ITEM-FG-03', 'Auto Cluster Housing ABS Precision', 'v3.0', 'active', 185.000, 12.000, 1, 38.00, 0.80)
        ON CONFLICT (id) DO UPDATE SET standard_cycle_time_s = EXCLUDED.standard_cycle_time_s;
      `);

      // 7. Work Orders
      await this.db.query(`
        INSERT INTO work_orders (id, wo_number, plant_id, item_id, bom_id, machine_id, target_qty, produced_qty, scrap_qty, batch_number, priority, status, start_time)
        VALUES 
          ('WO-001', 'WO-2026-1041', 'PLANT-01', 'ITEM-FG-01', 'BOM-01', 'MCH-01', 50000.00, 38400.00, 240.00, 'BATCH-2026-CAP-08', 'HIGH', 'running', NOW() - INTERVAL '4 hours'),
          ('WO-002', 'WO-2026-1042', 'PLANT-01', 'ITEM-FG-03', 'BOM-03', 'MCH-02', 3000.00, 1250.00, 18.00, 'BATCH-2026-AUTO-02', 'URGENT', 'running', NOW() - INTERVAL '2 hours'),
          ('WO-003', 'WO-2026-1043', 'PLANT-03', 'ITEM-FG-02', 'BOM-02', 'MCH-04', 15000.00, 0.00, 0.00, 'BATCH-2026-BTL-01', 'MEDIUM', 'scheduled', NOW() + INTERVAL '1 day')
        ON CONFLICT (id) DO UPDATE SET produced_qty = EXCLUDED.produced_qty, status = EXCLUDED.status;
      `);

      // 8. Suppliers & Purchase Orders
      await this.db.query(`
        INSERT INTO suppliers (id, code, name, category, contact_person, email, phone, gstin, rating, status)
        VALUES 
          ('SUP-01', 'SUP-IOCL-01', 'Indian Oil Corporation Ltd (IOCL Petrochemicals)', 'Polymer Resins', 'Anil Verma', 'anil.v@iocl.co.in', '+91 98110 55443', '27AAACI1234F1Z1', 4.85, 'active'),
          ('SUP-02', 'SUP-RELIANCE-01', 'Reliance Industries Ltd - Repol Division', 'Polymer Resins', 'Sanjay Shah', 'sanjay.shah@ril.com', '+91 98220 66554', '24AAACR5678F1Z2', 4.90, 'active'),
          ('SUP-03', 'SUP-CLARIANT-01', 'Avient / Clariant Color & Additives', 'Masterbatch & Additives', 'Sunita Rao', 'sunita.r@avient.com', '+91 98330 77665', '27AAACC9876F1Z3', 4.75, 'active')
        ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;
      `);

      await this.db.query(`
        INSERT INTO purchase_orders (id, po_number, supplier_id, plant_id, order_date, expected_delivery, total_amount, status)
        VALUES 
          ('PO-001', 'PO-2026-0811', 'SUP-01', 'PLANT-01', CURRENT_DATE - 5, CURRENT_DATE + 2, 1185000.00, 'open'),
          ('PO-002', 'PO-2026-0812', 'SUP-03', 'PLANT-01', CURRENT_DATE - 3, CURRENT_DATE + 4, 390000.00, 'open')
        ON CONFLICT (id) DO UPDATE SET total_amount = EXCLUDED.total_amount;
      `);

      // 9. Customers & Sales Orders
      await this.db.query(`
        INSERT INTO customers (id, code, name, tier, contact_person, email, phone, credit_limit, outstanding_balance)
        VALUES 
          ('CUST-01', 'CUST-TATA-MOTORS', 'Tata Motors Passenger Vehicles Ltd', 'Tier 1 OEM', 'Harish Nair', 'harish.n@tatamotors.com', '+91 98440 88776', 15000000.00, 2450000.00),
          ('CUST-02', 'CUST-PARLE-AGRO', 'Parle Agro Industries Pvt Ltd', 'Tier 1 FMCG', 'Meera Joshi', 'meera.j@parleagro.com', '+91 98550 99887', 20000000.00, 4800000.00),
          ('CUST-03', 'CUST-SYNGENTA', 'Syngenta India Agro-Chemicals', 'Tier 1 Chemical', 'Alok Pandey', 'alok.p@syngenta.com', '+91 98660 11229', 10000000.00, 1150000.00)
        ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;
      `);

      await this.db.query(`
        INSERT INTO sales_orders (id, so_number, customer_id, order_date, delivery_due, total_amount, status)
        VALUES 
          ('SO-001', 'SO-2026-1501', 'CUST-02', CURRENT_DATE - 4, CURRENT_DATE + 6, 850000.00, 'in_production'),
          ('SO-002', 'SO-2026-1502', 'CUST-01', CURRENT_DATE - 2, CURRENT_DATE + 10, 1455000.00, 'confirmed')
        ON CONFLICT (id) DO UPDATE SET total_amount = EXCLUDED.total_amount;
      `);

      // 10. General Ledger Accounts
      await this.db.query(`
        INSERT INTO chart_of_accounts (id, code, name, account_type, sub_category, balance)
        VALUES 
          ('ACC-101', '1010-00', 'HDFC Corporate Current Account (INR)', 'ASSET', 'Cash & Bank', 14250000.00),
          ('ACC-102', '1200-00', 'Raw Material Resin Inventory (PP/HDPE/ABS)', 'ASSET', 'Current Assets', 8450000.00),
          ('ACC-103', '1250-00', 'Finished Molded Goods Inventory', 'ASSET', 'Current Assets', 4650000.00),
          ('ACC-201', '2010-00', 'Accounts Payable (Trade Vendors)', 'LIABILITY', 'Current Liabilities', 6200000.00),
          ('ACC-401', '4010-00', 'Molded Polymer Components Sales Revenue', 'REVENUE', 'Operating Revenue', 42800000.00)
        ON CONFLICT (id) DO UPDATE SET balance = EXCLUDED.balance;
      `);

      // 11. Quality NCRs & CAPAs
      await this.db.query(`
        INSERT INTO quality_ncrs (id, ncr_number, item_id, defect_type, severity, quantity_rejected, root_cause, status, reported_by)
        VALUES 
          ('NCR-001', 'NCR-2026-0042', 'ITEM-FG-01', 'FLASH', 'MAJOR', 450.00, 'Mold clamping force dropped below 140T during peak cycle', 'capa_pending', 'Ananya Deshmukh'),
          ('NCR-002', 'NCR-2026-0043', 'ITEM-FG-03', 'SINK_MARK', 'CRITICAL', 35.00, 'Barrel temperature zone 3 fluctuation on IMM-250', 'under_investigation', 'Vikram Patel')
        ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status;
      `);

      // 12. MEP Utilities
      await this.db.query(`
        INSERT INTO mep_equipment (id, code, name, category, capacity, power_rating_kw, plant_id, status)
        VALUES 
          ('MEP-01', 'CHILLER-01', 'Carrier Central Water-Cooled Chiller Unit 1', 'MECHANICAL_CHILLER', '120 TR (7°C Supply)', 95.0, 'PLANT-01', 'optimal'),
          ('MEP-02', 'COMP-01', 'Atlas Copco Oil-Free Rotary Screw Air Compressor', 'AIR_COMPRESSOR', '250 CFM @ 8.5 Bar', 55.0, 'PLANT-01', 'optimal'),
          ('MEP-03', 'SUB-01', 'Siemens 11KV/415V 1500KVA Substation', 'ELECTRICAL_SUBSTATION', '1500 KVA', 1200.0, 'PLANT-01', 'optimal')
        ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;
      `);

      // 13. HR Employees
      await this.db.query(`
        INSERT INTO hr_employees (id, emp_code, full_name, department, designation, plant_id, shift, salary_monthly, status, joining_date)
        VALUES 
          ('EMP-01', 'EMP-1001', 'Sunil Gaikwad', 'Injection Molding', 'Senior Press Operator', 'PLANT-01', 'Shift-A', 32000.00, 'active', '2022-04-15'),
          ('EMP-02', 'EMP-1002', 'Mahesh Kulkarni', 'Tool Room', 'Mold Maintenance Specialist', 'PLANT-01', 'Shift-A', 42000.00, 'active', '2021-08-10'),
          ('EMP-03', 'EMP-1003', 'Kavita Jadhav', 'Quality Assurance', 'CMM & Visual QC Inspector', 'PLANT-01', 'Shift-B', 28000.00, 'active', '2023-01-20')
        ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name;
      `);

      // 14. Tasks & Notifications
      await this.db.query(`
        INSERT INTO tasks (id, tenant_id, task_number, assigned_to_id, title, description, priority, status, created_by)
        VALUES 
          ('TSK-001', 'PLANT-01', 'TASK-2026-081', 'USR-001', 'Approve Polymer Resin PO #0811 (IOCL)', '10 MT PP Copolymer purchase requisition awaiting executive authorization', 'HIGH', 'PENDING', 'USR-002'),
          ('TSK-002', 'PLANT-01', 'TASK-2026-082', 'USR-003', 'Perform 8D Verification on NCR #0042', 'Review mold clamping hydraulic recalibration on IMM-150-01', 'MEDIUM', 'PENDING', 'USR-001')
        ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title;
      `);

      await this.db.query(`
        INSERT INTO notifications (id, tenant_id, user_id, title, message, type, severity, is_read)
        VALUES 
          ('NOTIF-01', 'PLANT-01', 'USR-001', 'OEE Threshold Achieved (88.4%)', 'IMM-150-01 has surpassed target OEE of 85.0% for Shift-A.', 'SYSTEM_ALERT', 'INFO', false),
          ('NOTIF-02', 'PLANT-01', 'USR-001', 'Low Stock Warning: White Masterbatch', 'White MB stock at 3,200 KG (Reorder threshold: 1,500 KG).', 'INVENTORY_LOW', 'WARNING', false)
        ON CONFLICT (id) DO UPDATE SET is_read = EXCLUDED.is_read;
      `);

      this.logger.log('✅ SP-PLASTECH Pre-Production database seeded successfully with 14 live domain datasets.');
    } catch (err: any) {
      this.logger.error(`Database seeding failed: ${err.message}`, err.stack);
    }
  }
}
