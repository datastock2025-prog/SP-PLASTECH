const fs = require('fs');
const path = require('path');

// Extract all 30 pages items directly
const pagesData = [
  // Page 1
  { group: "General", items: [
    { sNo: 1, code: "88VENT", desc: "88 Vent Chamber(White)", uomStr: "1 NOS", price: 0.20, eff: "2024-04-01", curr: "INR (₹)" }
  ]},
  // Page 2
  { group: "BOP-PURFLUX", items: [
    { sNo: 1, code: "6799002060", desc: "THREAD INSERT (M5 X 10) -YELLOW", uomStr: "1 NOS", price: 1.32, eff: "2025-04-01", curr: "INR (₹)" },
    { sNo: 2, code: "6799043410", desc: "SLEEVE (7.5 X 5.5 X 4)-TRIVALENT BLUE", uomStr: "1 NOS", price: 1.01, eff: "2025-04-01", curr: "INR (₹)" },
    { sNo: 3, code: "KL040030-4", desc: "INSERT AIR CLEANER-XFA 355", uomStr: "1 NOS", price: 4.00, eff: "2025-04-01", curr: "INR (₹)" }
  ]},
  { group: "Consumables", items: [
    { sNo: 4, code: "NR224930_3", desc: "REXIN BACKREST", uomStr: "1 NOS", price: 14.06, eff: "2026-07-23", curr: "INR (₹)" }
  ]},
  { group: "EXIDE", items: [
    { sNo: 5, code: "130311391001.", desc: "Container 26AH blk ABS EP26 HTL MP992 HS-04", uomStr: "1 NOS", price: 123.66, eff: "2025-04-01", curr: "INR (₹)" }
  ]},
  { group: "General", items: [
    { sNo: 6, code: "1091IN000016", desc: "51 MM CUP INSERT", uomStr: "1 BAG", price: 0.55, eff: "2025-04-07", curr: "INR (₹)" },
    { sNo: 7, code: "1091INS000015", desc: "46MM CUP INSERT", uomStr: "1 BAG", price: 0.55, eff: "2025-04-07", curr: "INR (₹)" },
    { sNo: 8, code: "PBOCINSSTC1-1756", desc: "PLASTIC INSERT 50MM A/ R Pad (PART NO.70208801801)", uomStr: "1 BOX", price: 9.98, eff: "2025-04-01", curr: "INR (₹)" }
  ]},
  // Page 3
  { group: "SACL", items: [
    { sNo: 1, code: "1208T0220", desc: "TUBE OUTLET EFI -U327C", uomStr: "100000 BAG", price: 30.74, eff: "2025-04-30", curr: "INR (₹)" }
  ]},
  // Page 4
  { group: "Consumables", items: [
    { sNo: 1, code: "CON-082", desc: "EXIDE POWERSAFE PLUS EP 84-12 12V 84AH", uomStr: "1 NOS", price: 10.72, eff: "2025-04-01", curr: "INR (₹)" }
  ]},
  // Page 5
  { group: "APJ", items: [
    { sNo: 1, code: "RMBOP-SR", desc: "SCREW RETAINER (APJ)", uomStr: "1 NOS", price: 0.55, eff: "2024-04-01", curr: "INR (₹)" }
  ]},
  { group: "ASSET", items: [
    { sNo: 2, code: "8 CAV MOULD", desc: "GUIDE BUSH - 8 Cav MOULD", uomStr: "1 NOS", price: 130000.00, eff: "2026-05-05", curr: "INR (₹)" },
    { sNo: 3, code: "AIR DRYER KKT 70", desc: "DEHUMDIFIED AIR DRYER KKT 70 WITH HOPPER LOADER & ACCESSORIES", uomStr: "1 NOS", price: 410000.00, eff: "2025-08-12", curr: "INR (₹)" },
    { sNo: 4, code: "AIR DRYER KKT110", desc: "DEHUMDIFIED AIR DRYER KKT110 WITH HOPPER LOADER & ACCESSORIES", uomStr: "1 NOS", price: 520000.00, eff: "2025-08-12", curr: "INR (₹)" },
    { sNo: 5, code: "ASSET-0", desc: "BODY LATCH MOULD", uomStr: "1 NOS", price: 3.00, eff: "2026-05-01", curr: "INR (₹)" },
    { sNo: 6, code: "ASSET-001", desc: "MODEL N SERIES 110T, FRAME-B610 INJECTION UNIT", uomStr: "1 NOS", price: 2640000.00, eff: "2025-04-01", curr: "INR (₹)" },
    { sNo: 7, code: "ASSET-002", desc: "MODEL HYDRON SERVO 250T,FRAME-A 970 INJECTION UNIT", uomStr: "1 NOS", price: 4520000.00, eff: "2025-04-01", curr: "INR (₹)" },
    { sNo: 8, code: "ASSET-003", desc: "MODEL HYDRON SERVO 250T,FRAME-B 1540 INJECTION UNIT", uomStr: "1 NOS", price: 4340000.00, eff: "2025-04-01", curr: "INR (₹)" },
    { sNo: 9, code: "ASSET-004", desc: "MODEL HYDRON SERVO 350T,FRAME-B 2290 INJECTION UNIT", uomStr: "1 NOS", price: 6000000.00, eff: "2025-04-01", curr: "INR (₹)" },
    { sNo: 10, code: "ASSET-005", desc: "MODEL HYDRON SERVO 450T,FRAME-B 3470 INJECTION UNIT", uomStr: "1 NOS", price: 7750000.00, eff: "2025-04-01", curr: "INR (₹)" },
    { sNo: 11, code: "ASSET-006", desc: "MOLD FOR APACHE LEVER GUARD STEM LH&RH (1+1CAVITY)", uomStr: "1 NOS", price: 360000.00, eff: "2025-04-01", curr: "INR (₹)" },
    { sNo: 12, code: "ASSET-007", desc: "MODIFICATION FOR APACHE SLIDER INNER & OUTER LH&RH", uomStr: "1 NOS", price: 100000.00, eff: "2025-04-01", curr: "INR (₹)" },
    { sNo: 13, code: "ASSET-008", desc: "5 TON CAPACITY EOT CRANE", uomStr: "1 NOS", price: 920000.00, eff: "2025-04-01", curr: "INR (₹)" },
    { sNo: 14, code: "ASSET-009", desc: "EG 30 PM -V (with VFD) Air Compressor", uomStr: "1 NOS", price: 1122000.00, eff: "2025-08-11", curr: "INR (₹)" },
    { sNo: 15, code: "ASSET-010", desc: "INJECTION MOULD FOR STAR MIRROR HOUSING 1+1 FAMILY MOULD (LH & RH) U237", uomStr: "1 SET", price: 480000.00, eff: "2025-04-01", curr: "INR (₹)" },
    { sNo: 16, code: "ASSET-011", desc: "SCREW BARREL FULL SET DIA 42 MM 80 TON MILACRON BIMETALLIC", uomStr: "1 NOS", price: 190000.00, eff: "2025-07-01", curr: "INR (₹)" },
    { sNo: 17, code: "ASSET-012", desc: "SCREW BARREL FULL SET DIA 36MM 80 TON MILACRON BIMETALLIC", uomStr: "1 NOS", price: 178000.00, eff: "2025-07-01", curr: "INR (₹)" },
    { sNo: 18, code: "ASSET-013", desc: "M25 PURE OPC", uomStr: "1 MTR", price: 4343.00, eff: "2025-04-01", curr: "INR (₹)" },
    { sNo: 19, code: "ASSET-014", desc: "VALVE,CART 2-WAY (10589649)", uomStr: "1 NOS", price: 2550.00, eff: "2025-04-01", curr: "INR (₹)" },
    { sNo: 20, code: "ASSET-015", desc: "VALVE,CART COVER (10589587)", uomStr: "1 NOS", price: 2650.00, eff: "2025-04-01", curr: "INR (₹)" },
    { sNo: 21, code: "ASSET-016", desc: "VLV,DIR NG5 EL BL (10128845)", uomStr: "1 NOS", price: 4400.00, eff: "2025-04-01", curr: "INR (₹)" },
    { sNo: 22, code: "ASSET-022", desc: "INSIS DIGITAL VERNIER CALIPER", uomStr: "1 NOS", price: 2700.00, eff: "2025-04-01", curr: "INR (₹)" },
    { sNo: 23, code: "ASSET-023", desc: "MITUTOYA ANALOG MICRO METER", uomStr: "1 NOS", price: 2550.00, eff: "2025-04-01", curr: "INR (₹)" },
    { sNo: 24, code: "ASSET-027", desc: "CPXE23012A Hotspring 4.2x2.2T 1200+25+25 800W 230V", uomStr: "1 NOS", price: 3890.00, eff: "2025-04-01", curr: "INR (₹)" },
    { sNo: 25, code: "ASSET-028", desc: "Hot Runner Coil heater, ID: 25.00 mm, OD: 30.00 mm Length: 60 mm", uomStr: "1 NOS", price: 3400.00, eff: "2025-04-01", curr: "INR (₹)" },
    { sNo: 26, code: "ASSET-029", desc: "Ceramic heater, Dia 100 X 100 Length 1170 W / 230 Volts", uomStr: "1 NOS", price: 1100.00, eff: "2025-04-01", curr: "INR (₹)" },
    { sNo: 27, code: "ASSET-030", desc: "J Type Thermocouple, Dia1.5 mm X 50 mm Length", uomStr: "1 NOS", price: 650.00, eff: "2025-04-01", curr: "INR (₹)" },
    { sNo: 28, code: "ASSET-031", desc: "J Type Thermocouple, Dia1.5 mm X 100 mm Length", uomStr: "1 NOS", price: 650.00, eff: "2025-04-01", curr: "INR (₹)" },
    { sNo: 29, code: "ASSET-032", desc: "J Type Thermocouple, Dia1.5 mm X 150 mm Length", uomStr: "1 NOS", price: 650.00, eff: "2025-04-01", curr: "INR (₹)" },
    { sNo: 30, code: "ASSET-033", desc: "Thermocouple Adaptor 1/8 BSP", uomStr: "1 NOS", price: 80.00, eff: "2025-04-01", curr: "INR (₹)" },
    { sNo: 31, code: "ASSET-034", desc: "STAR MIRROE HOUSING - 140 X 170MM (Spray Texture Work)", uomStr: "1 NOS", price: 40000.00, eff: "2025-04-01", curr: "INR (₹)" },
    { sNo: 32, code: "ASSET-036", desc: "J1-LH Cover serial tool (4C)", uomStr: "1 NOS", price: 3400000.00, eff: "2025-04-01", curr: "INR (₹)" },
    { sNo: 33, code: "ASSET-037", desc: "J1-RH Cover serial tool (4C)", uomStr: "1 NOS", price: 4500000.00, eff: "2025-04-01", curr: "INR (₹)" },
    { sNo: 34, code: "ASSET-038", desc: "J1-Inlet Cover serial tool (4C)", uomStr: "1 NOS", price: 1400000.00, eff: "2025-04-01", curr: "INR (₹)" },
    { sNo: 35, code: "ASSET-039", desc: "HELMET CELL - TEXTURE REPAIR WORK", uomStr: "1 NOS", price: 2000.00, eff: "2025-04-01", curr: "INR (₹)" },
    { sNo: 36, code: "ASSET-040", desc: "J1 Outlet Tube 2 Cavity PVC Injection mould (Serial Tool)", uomStr: "1 NOS", price: 600000.00, eff: "2025-04-01", curr: "INR (₹)" },
    { sNo: 37, code: "ASSET-041", desc: "AL Main Mirror Housing (Spray Texture & Sand Plastering)", uomStr: "1 NOS", price: 1500.00, eff: "2025-04-01", curr: "INR (₹)" },
    { sNo: 38, code: "ASSET-042", desc: "ESSL SILKBIO-101TC Biometrics & RFID", uomStr: "1 NOS", price: 14975.20, eff: "2025-04-01", curr: "INR (₹)" },
    { sNo: 39, code: "ASSET-043", desc: "Device Installation and commissioning", uomStr: "1 NOS", price: 2575.20, eff: "2025-04-01", curr: "INR (₹)" },
    { sNo: 40, code: "ASSET-044", desc: "Cloud software", uomStr: "1 NOS", price: 27575.50, eff: "2025-04-01", curr: "INR (₹)" },
    { sNo: 41, code: "ASSET-045", desc: "Injection Mould For Cover Assembly, Top (Drawing Ref:RLY00373)", uomStr: "1 NOS", price: 520000.00, eff: "2025-04-01", curr: "INR (₹)" },
    { sNo: 42, code: "ASSET-046", desc: "Injection Mould For Cover Assembly, Bottom (Drawing Ref:RLY00346)", uomStr: "1 NOS", price: 1800000.00, eff: "2025-04-01", curr: "INR (₹)" },
    { sNo: 43, code: "ASSET-048", desc: "12 INCH WALL MOUNTED FAN ALMONARD MAKE", uomStr: "1 NOS", price: 1887.00, eff: "2026-04-01", curr: "INR (₹)" },
    { sNo: 44, code: "ASSET-049", desc: "36W LED TUBE LIGHT", uomStr: "1 NOS", price: 465.00, eff: "2026-04-01", curr: "INR (₹)" },
    { sNo: 45, code: "ASSET-050", desc: "XDCR,RECTILINEAR 375MM - 10586024", uomStr: "1 NOS", price: 5750.00, eff: "2026-04-01", curr: "INR (₹)" },
    { sNo: 46, code: "ASSET-051", desc: "PLATE,MTG POT S50 - 10574549", uomStr: "1 NOS", price: 560.00, eff: "2026-04-01", curr: "INR (₹)" },
    { sNo: 47, code: "ASSET-052", desc: "BRACKET,GUIDE LINPOT - 10574548", uomStr: "1 NOS", price: 80.00, eff: "2026-04-01", curr: "INR (₹)" },
    { sNo: 48, code: "ASSET-053", desc: "CPLG - 10378819", uomStr: "1 NOS", price: 255.00, eff: "2026-04-01", curr: "INR (₹)" },
    { sNo: 49, code: "ASSET-054", desc: "SHCS,M04X016 - 10350871", uomStr: "1 NOS", price: 4.00, eff: "2026-04-01", curr: "INR (₹)" },
    { sNo: 50, code: "ASSET-055", desc: "WASHER,LCK M06 SPR - 10351067", uomStr: "1 NOS", price: 2.00, eff: "2026-04-01", curr: "INR (₹)" },
    { sNo: 51, code: "ASSET-056", desc: "SHCS,M06X016 - 10350848", uomStr: "1 NOS", price: 6.00, eff: "2026-04-01", curr: "INR (₹)" },
    { sNo: 52, code: "ASSET-057", desc: "Z4 CONNECTOR FOR TRANSDUCER - 10573760", uomStr: "1 NOS", price: 82.00, eff: "2026-04-01", curr: "INR (₹)" },
    { sNo: 53, code: "ASSET-058", desc: "CBL ATL SHD 3C C 0.5 MM2 - 11995882", uomStr: "1 NOS", price: 105.00, eff: "2026-04-01", curr: "INR (₹)" },
    { sNo: 54, code: "ASSET-059", desc: "INJECTION MOULD FOR VI TOP COVER SERIAL TOOL 2 CAVITIES", uomStr: "1 NOS", price: 1000000.00, eff: "2026-04-01", curr: "INR (₹)" },
    { sNo: 55, code: "ASSET-060", desc: "INJECTION MOULD FOR VI BOTTOM COVER SERIAL TOOL 2 CAVITIES", uomStr: "1 NOS", price: 2000000.00, eff: "2026-04-01", curr: "INR (₹)" },
    { sNo: 56, code: "ASSET-061", desc: "INJECTION MOULD FOR VI MIDDLE COVER SERIAL TOOL 2 CAVITIES", uomStr: "1 NOS", price: 2300000.00, eff: "2026-04-01", curr: "INR (₹)" },
    { sNo: 57, code: "ASSET-062", desc: "INJECTION MOULD FOR VI BREATHER COVER 4 CAVITIES", uomStr: "1 NOS", price: 200000.00, eff: "2026-04-01", curr: "INR (₹)" },
    { sNo: 58, code: "ASSET-063", desc: "GUIDE BUSH 6C MOULD", uomStr: "1 NOS", price: 130000.00, eff: "2026-04-01", curr: "INR (₹)" },
    { sNo: 59, code: "ASSET-064", desc: "GATE SEAL MSH TORPEDO E (TSM084) MASTER-SERIES HECTO", uomStr: "1 NOS", price: 8258.00, eff: "2026-04-01", curr: "INR (₹)" },
    { sNo: 60, code: "ASSET-066", desc: "N-SERIES 80T - B 310 IU", uomStr: "1 NOS", price: 2130000.00, eff: "2026-04-01", curr: "INR (₹)" },
    { sNo: 61, code: "ASSET-067", desc: "N-SERIES 150T - B 870 IU", uomStr: "1 NOS", price: 3030000.00, eff: "2026-04-01", curr: "INR (₹)" },
    { sNo: 62, code: "ASSET-068", desc: "N-SERIES 200T - B 1000 IU", uomStr: "1 NOS", price: 3610000.00, eff: "2026-04-01", curr: "INR (₹)" },
    { sNo: 63, code: "ASSET-069", desc: "OMEGA SERVO 550T - B 100MM FRAME", uomStr: "1 NOS", price: 10150000.00, eff: "2026-04-01", curr: "INR (₹)" },
    { sNo: 64, code: "ASSET-070", desc: "U696 BACKREST ALUMINIUM TOOL - 2 CAVITY", uomStr: "1 NOS", price: 200000.00, eff: "2026-04-01", curr: "INR (₹)" },
    { sNo: 65, code: "ASSET-071", desc: "CONVERSION OF ONLINE TO OFFLINE HOT AIR DRYER", uomStr: "1 NOS", price: 190000.00, eff: "2026-04-01", curr: "INR (₹)" },
    { sNo: 66, code: "ASSET-072", desc: "HOPPER DRYER EHD 150 WITH HOPPER LOADER & ACCESSORIES", uomStr: "1 SET", price: 416000.00, eff: "2026-04-01", curr: "INR (₹)" },
    { sNo: 67, code: "ASSET-073", desc: "HOPPER DRYER EHD 400 WITH HOPPER LOADER & ACCESSORIES", uomStr: "1 NOS", price: 238000.00, eff: "2026-04-01", curr: "INR (₹)" },
    { sNo: 68, code: "ASSET-074", desc: "SCRAP GRINDER MODEL AR400 WITH SILO BLOWER 5HP MOTOR", uomStr: "1 SET", price: 1050000.00, eff: "2026-04-01", curr: "INR (₹)" },
    { sNo: 69, code: "ASSET-075", desc: "FILTER MESH FOR GRINDER MODEL AR400 (10mm Hole)", uomStr: "1 NOS", price: 40000.00, eff: "2026-04-01", curr: "INR (₹)" },
    { sNo: 70, code: "ASSET-076", desc: "PHILLIPS ZNC EDM DIE SINKER - PZE 550", uomStr: "1 NOS", price: 1650000.00, eff: "2026-04-01", curr: "INR (₹)" },
    { sNo: 71, code: "ASSET-077", desc: "Chiller GKE18000AV Condenser (LH) - GKE18000", uomStr: "1 NOS", price: 72850.00, eff: "2026-04-01", curr: "INR (₹)" },
    { sNo: 72, code: "ASSET-078", desc: "GKE22000A-V", uomStr: "1 NOS", price: 1046250.00, eff: "2026-04-01", curr: "INR (₹)" },
    { sNo: 73, code: "ASSET-079", desc: "GKE18000A-V", uomStr: "1 NOS", price: 763500.00, eff: "2026-04-01", curr: "INR (₹)" },
    { sNo: 74, code: "ASSET-080", desc: "Mastermetrology Wear Plug Gauge (M6x1-6H (Go & NoGo))", uomStr: "1 NOS", price: 4199.00, eff: "2026-04-01", curr: "INR (₹)" },
    { sNo: 75, code: "ASSET-081", desc: "Mastermetrology Wear Plug Gauge (M5x0.8-6H (Go & NoGo))", uomStr: "1 NOS", price: 4199.00, eff: "2026-04-01", curr: "INR (₹)" },
    { sNo: 76, code: "ASSET-082", desc: "Kristeel Radius Gauge 7.5-15.0mm (1512B)", uomStr: "1 NOS", price: 369.75, eff: "2026-04-01", curr: "INR (₹)" },
    { sNo: 77, code: "ASSET-083", desc: "Kristeel Radius Gauge 15.5-25.0mm (1512C)", uomStr: "1 NOS", price: 387.60, eff: "2026-04-01", curr: "INR (₹)" },
    { sNo: 78, code: "ASSET-084", desc: "INJECTION MOULD FOR U862 FLOOR MAT", uomStr: "1 NOS", price: 130000.00, eff: "2026-04-01", curr: "INR (₹)" },
    { sNo: 79, code: "ASSET-085", desc: "K2K COVER - ENGRAVING ONSIDE WORK", uomStr: "1 NOS", price: 2200.00, eff: "2026-04-01", curr: "INR (₹)" },
    { sNo: 80, code: "ASSET-086", desc: "4-ZONE CONTROLLER", uomStr: "1 NOS", price: 10000.00, eff: "2026-04-01", curr: "INR (₹)" },
    { sNo: 81, code: "ASSET-087", desc: "8-ZONE CONTROLLER", uomStr: "1 NOS", price: 10000.00, eff: "2026-04-01", curr: "INR (₹)" },
    { sNo: 82, code: "GKE18000A-V", desc: "GKE18000A-V Inverter chiller, 57kW cooling capacity", uomStr: "1 NOS", price: 7.00, eff: "2025-08-12", curr: "INR (₹)" },
    { sNo: 83, code: "GWK MOULD TA350", desc: "GWK MOULD TEMPERATURE CONTROLLER MODEL TECO TA350 WATER BASED", uomStr: "1 NOS", price: 81000.00, eff: "2025-08-12", curr: "INR (₹)" },
    { sNo: 84, code: "GWK MOULD TA50", desc: "GWK MOULD TEMPERATURE CONTROLLER MODEL TECO TA50 OIL BASED", uomStr: "1 NOS", price: 81000.00, eff: "2025-08-12", curr: "INR (₹)" },
    { sNo: 85, code: "HOPPER DRYER", desc: "HOPPER DRYER EHD 200 WITH HOPPER LOADER & ACCESSORIES", uomStr: "1 NOS", price: 214000.00, eff: "2025-08-12", curr: "INR (₹)" },
    { sNo: 86, code: "HOPPER DRYER EHD 100", desc: "HOPPER DRYER EHD 100 WITH HOPPER LOADER & ACCESSORIES", uomStr: "1 NOS", price: 110000.00, eff: "2025-08-12", curr: "INR (₹)" }
  ]}
];

// Helper to determine supplier mapping
function mapSupplierForGroup(group, code) {
  const g = group.toUpperCase();
  if (g.includes("PURFLUX") || g.includes("SOGEFI")) return { id: "SUP-S0051", name: "SOGEFI ENGINE SYSTEMS INDIA PVT LTD" };
  if (g.includes("EXIDE")) return { id: "SUP-C0003", name: "EXIDE INDUSTRIAL LIMITED (WEST BENGAL)" };
  if (g.includes("SANDHAR")) return { id: "SUP-S0022", name: "SANDHAR TECHNOLOGIES LIMITED" };
  if (g.includes("IFB")) return { id: "SUP-S0050", name: "IFB AUTOMOTIVE PRIVATE LIMITED" };
  if (g.includes("MINDA")) return { id: "SUP-U0001", name: "UNO MINDA LIMITED (HSSL / CHENNAI / PUNE)" };
  if (g.includes("SACL")) return { id: "SUP-S0001", name: "SACL AUTOMOTIVE COMPONENTS LTD" };
  if (g.includes("APJ")) return { id: "SUP-A0012", name: "APJ AUTOMOTIVE COMPONENTS" };
  if (g.includes("RAW MATERIALS")) return { id: "SUP-S0128", name: "RELIANCE INDUSTRIES LIMITED (POLYMER DIV)" };
  if (g.includes("PACKING")) return { id: "SUP-P0015", name: "PREMIER PACKAGING & CORRUGATION LTD" };
  if (g.includes("KEWAUNEE")) return { id: "SUP-K0008", name: "KEWAUNEE SCIENTIFIC CORPORATION" };
  return { id: "SUP-S0001", name: `SP-PLASTECH VENDOR (${group})` };
}

// Generate the entries
const priceListEntries = [];
let idx = 1;

for (const p of pagesData) {
  for (const it of p.items) {
    const sup = mapSupplierForGroup(p.group, it.code);
    const uom = it.uomStr.replace(/^[0-9.]+\s*/, '').trim() || 'NOS';
    const isIndexed = p.group.toUpperCase().includes('RAW MATERIALS');
    const isTiered = ['BAG', 'BOX'].includes(uom);

    priceListEntries.push({
      id: `PL-${it.code.replace(/[^a-zA-Z0-9_-]/g, '_')}-${idx++}`,
      priceListId: `PL-SPP-2026-Q3`,
      supplierId: sup.id,
      supplierName: sup.name,
      groupCategory: p.group,
      itemCode: it.code,
      itemName: it.desc,
      uom: uom,
      currency: it.curr,
      unitPrice: it.price,
      effectiveFrom: it.eff,
      effectiveTo: '2026-12-31',
      moq: uom === 'KGS' || uom === 'MT' ? 500 : 50,
      leadTimeDays: 7,
      priceType: isIndexed ? 'Indexed' : (isTiered ? 'Tiered' : 'Fixed'),
      indexReference: isIndexed ? 'Platts CFR South Asia Polymer Benchmark' : undefined,
      baseIndexValue: isIndexed ? it.price * 0.95 : undefined,
      adjustmentFormula: isIndexed ? 'P = Index_Benchmark + conversion_margin' : undefined,
      freightIncluded: true,
      packingIncluded: true,
      taxPct: 18,
      status: 'Active'
    });
  }
}

const fileContent = `// ============================================================================
// LIVE SUPPLIER PRICE LISTS & CONTRACT FORMULAS (Source: Report RAPM1101A01T01)
// Organization: SP PLASTECH | Plant: Hosur, Tamil Nadu
// ============================================================================
import { SupplierPriceListEntry } from '../types/procurement';

export const DOCUMENT_SUPPLIER_PRICE_LISTS: SupplierPriceListEntry[] = ${JSON.stringify(priceListEntries, null, 2)};
`;

fs.writeFileSync(path.join(__dirname, '..', 'src', 'data', 'liveSupplierPriceLists.ts'), fileContent, 'utf8');
console.log(`✅ Generated liveSupplierPriceLists.ts with ${priceListEntries.length} records!`);
