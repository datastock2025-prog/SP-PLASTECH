const fs = require('fs');
const path = require('path');

const fullPdfItems = [
  // Page 1
  { group: "General", sNo: 1, code: "88VENT", desc: "88 Vent Chamber(White)", uom: "NOS", price: 0.20, eff: "2024-04-01" },
  // Page 2
  { group: "BOP-PURFLUX", sNo: 1, code: "6799002060", desc: "THREAD INSERT (M5 X 10) -YELLOW", uom: "NOS", price: 1.32, eff: "2025-04-01" },
  { group: "BOP-PURFLUX", sNo: 2, code: "6799043410", desc: "SLEEVE (7.5 X 5.5 X 4)-TRIVALENT BLUE", uom: "NOS", price: 1.01, eff: "2025-04-01" },
  { group: "BOP-PURFLUX", sNo: 3, code: "KL040030-4", desc: "INSERT AIR CLEANER-XFA 355", uom: "NOS", price: 4.00, eff: "2025-04-01" },
  { group: "Consumables", sNo: 4, code: "NR224930_3", desc: "REXIN BACKREST", uom: "NOS", price: 14.06, eff: "2026-07-23" },
  { group: "EXIDE", sNo: 5, code: "130311391001.", desc: "Container 26AH blk ABS EP26 HTL MP992 HS-04", uom: "NOS", price: 123.66, eff: "2025-04-01" },
  { group: "General", sNo: 6, code: "1091IN000016", desc: "51 MM CUP INSERT", uom: "BAG", price: 0.55, eff: "2025-04-07" },
  { group: "General", sNo: 7, code: "1091INS000015", desc: "46MM CUP INSERT", uom: "BAG", price: 0.55, eff: "2025-04-07" },
  { group: "General", sNo: 8, code: "PBOCINSSTC1-1756", desc: "PLASTIC INSERT 50MM A/ R Pad (PART NO.70208801801)", uom: "BOX", price: 9.98, eff: "2025-04-01" },
  // Page 3
  { group: "SACL", sNo: 1, code: "1208T0220", desc: "TUBE OUTLET EFI -U327C", uom: "BAG", price: 30.74, eff: "2025-04-30" },
  // Page 4
  { group: "Consumables", sNo: 1, code: "CON-082", desc: "EXIDE POWERSAFE PLUS EP 84-12 12V 84AH", uom: "NOS", price: 10.72, eff: "2025-04-01" },
  // Page 5
  { group: "APJ", sNo: 1, code: "RMBOP-SR", desc: "SCREW RETAINER (APJ)", uom: "NOS", price: 0.55, eff: "2024-04-01" },
  { group: "ASSET", sNo: 2, code: "8 CAV MOULD", desc: "GUIDE BUSH - 8 Cav MOULD", uom: "NOS", price: 130000.00, eff: "2026-05-05" },
  { group: "ASSET", sNo: 3, code: "AIR DRYER KKT 70", desc: "DEHUMDIFIED AIR DRYER KKT 70 WITH HOPPER LOADER & ACCESSORIES", uom: "NOS", price: 410000.00, eff: "2025-08-12" },
  { group: "ASSET", sNo: 4, code: "AIR DRYER KKT110", desc: "DEHUMDIFIED AIR DRYER KKT110 WITH HOPPER LOADER & ACCESSORIES", uom: "NOS", price: 520000.00, eff: "2025-08-12" },
  { group: "ASSET", sNo: 5, code: "ASSET-0", desc: "BODY LATCH MOULD", uom: "NOS", price: 3.00, eff: "2026-05-01" },
  { group: "ASSET", sNo: 6, code: "ASSET-001", desc: "MODEL N SERIES 110T, FRAME-B610 INJECTION UNIT", uom: "NOS", price: 2640000.00, eff: "2025-04-01" },
  { group: "ASSET", sNo: 7, code: "ASSET-002", desc: "MODEL HYDRON SERVO 250T,FRAME-A 970 INJECTION UNIT", uom: "NOS", price: 4520000.00, eff: "2025-04-01" },
  { group: "ASSET", sNo: 8, code: "ASSET-003", desc: "MODEL HYDRON SERVO 250T,FRAME-B 1540 INJECTION UNIT", uom: "NOS", price: 4340000.00, eff: "2025-04-01" },
  { group: "ASSET", sNo: 9, code: "ASSET-004", desc: "MODEL HYDRON SERVO 350T,FRAME-B 2290 INJECTION UNIT", uom: "NOS", price: 6000000.00, eff: "2025-04-01" },
  { group: "ASSET", sNo: 10, code: "ASSET-005", desc: "MODEL HYDRON SERVO 450T,FRAME-B 3470 INJECTION UNIT", uom: "NOS", price: 7750000.00, eff: "2025-04-01" },
  { group: "ASSET", sNo: 11, code: "ASSET-006", desc: "MOLD FOR APACHE LEVER GUARD STEM LH&RH (1+1CAVITY)", uom: "NOS", price: 360000.00, eff: "2025-04-01" },
  { group: "ASSET", sNo: 12, code: "ASSET-007", desc: "MODIFICATION FOR APACHE SLIDER INNER & OUTER LH&RH", uom: "NOS", price: 100000.00, eff: "2025-04-01" },
  { group: "ASSET", sNo: 13, code: "ASSET-008", desc: "5 TON CAPACITY EOT CRANE", uom: "NOS", price: 920000.00, eff: "2025-04-01" },
  { group: "ASSET", sNo: 14, code: "ASSET-009", desc: "EG 30 PM -V (with VFD) Air Compressor", uom: "NOS", price: 1122000.00, eff: "2025-08-11" },
  { group: "ASSET", sNo: 15, code: "ASSET-010", desc: "INJECTION MOULD FOR STAR MIRROR HOUSING 1+1 FAMILY MOULD (LH & RH) U237", uom: "SET", price: 480000.00, eff: "2025-04-01" },
  { group: "ASSET", sNo: 16, code: "ASSET-011", desc: "SCREW BARREL FULL SET DIA 42 MM 80 TON MILACRON BIMETALLIC", uom: "NOS", price: 190000.00, eff: "2025-07-01" },
  { group: "ASSET", sNo: 17, code: "ASSET-012", desc: "SCREW BARREL FULL SET DIA 36MM 80 TON MILACRON BIMETALLIC", uom: "NOS", price: 178000.00, eff: "2025-07-01" },
  { group: "ASSET", sNo: 18, code: "ASSET-013", desc: "M25 PURE OPC", uom: "MTR", price: 4343.00, eff: "2025-04-01" },
  { group: "ASSET", sNo: 19, code: "ASSET-014", desc: "VALVE,CART 2-WAY (10589649)", uom: "NOS", price: 2550.00, eff: "2025-04-01" },
  { group: "ASSET", sNo: 20, code: "ASSET-015", desc: "VALVE,CART COVER (10589587)", uom: "NOS", price: 2650.00, eff: "2025-04-01" },
  { group: "ASSET", sNo: 21, code: "ASSET-016", desc: "VLV,DIR NG5 EL BL (10128845)", uom: "NOS", price: 4400.00, eff: "2025-04-01" },
  { group: "ASSET", sNo: 22, code: "ASSET-022", desc: "INSIS DIGITAL VERNIER CALIPER", uom: "NOS", price: 2700.00, eff: "2025-04-01" },
  { group: "ASSET", sNo: 23, code: "ASSET-023", desc: "MITUTOYA ANALOG MICRO METER", uom: "NOS", price: 2550.00, eff: "2025-04-01" },
  { group: "ASSET", sNo: 24, code: "ASSET-027", desc: "CPXE23012A Hotspring 4.2x2.2T 1200+25+25 800W 230V", uom: "NOS", price: 3890.00, eff: "2025-04-01" },
  { group: "ASSET", sNo: 25, code: "ASSET-028", desc: "Hot Runner Coil heater, ID: 25.00 mm, OD: 30.00 mm Length: 60 mm", uom: "NOS", price: 3400.00, eff: "2025-04-01" },
  { group: "ASSET", sNo: 26, code: "ASSET-029", desc: "Ceramic heater, Dia 100 X 100 Length 1170 W / 230 Volts", uom: "NOS", price: 1100.00, eff: "2025-04-01" },
  { group: "ASSET", sNo: 27, code: "ASSET-030", desc: "J Type Thermocouple, Dia1.5 mm X 50 mm Length", uom: "NOS", price: 650.00, eff: "2025-04-01" },
  { group: "ASSET", sNo: 28, code: "ASSET-031", desc: "J Type Thermocouple, Dia1.5 mm X 100 mm Length", uom: "NOS", price: 650.00, eff: "2025-04-01" },
  { group: "ASSET", sNo: 29, code: "ASSET-032", desc: "J Type Thermocouple, Dia1.5 mm X 150 mm Length", uom: "NOS", price: 650.00, eff: "2025-04-01" },
  { group: "ASSET", sNo: 30, code: "ASSET-033", desc: "Thermocouple Adaptor 1/8 BSP", uom: "NOS", price: 80.00, eff: "2025-04-01" },
  { group: "ASSET", sNo: 31, code: "ASSET-034", desc: "STAR MIRROE HOUSING - 140 X 170MM (Spray Texture Work)", uom: "NOS", price: 40000.00, eff: "2025-04-01" },
  { group: "ASSET", sNo: 32, code: "ASSET-036", desc: "J1-LH Cover serial tool (4C)", uom: "NOS", price: 3400000.00, eff: "2025-04-01" },
  { group: "ASSET", sNo: 33, code: "ASSET-037", desc: "J1-RH Cover serial tool (4C)", uom: "NOS", price: 4500000.00, eff: "2025-04-01" },
  { group: "ASSET", sNo: 34, code: "ASSET-038", desc: "J1-Inlet Cover serial tool (4C)", uom: "NOS", price: 1400000.00, eff: "2025-04-01" },
  { group: "ASSET", sNo: 35, code: "ASSET-039", desc: "HELMET CELL - TEXTURE REPAIR WORK", uom: "NOS", price: 2000.00, eff: "2025-04-01" },
  { group: "ASSET", sNo: 36, code: "ASSET-040", desc: "J1 Outlet Tube 2 Cavity PVC Injection mould (Serial Tool)", uom: "NOS", price: 600000.00, eff: "2025-04-01" },
  { group: "ASSET", sNo: 37, code: "ASSET-041", desc: "AL Main Mirror Housing (Spray Texture & Sand Plastering)", uom: "NOS", price: 1500.00, eff: "2025-04-01" },
  { group: "ASSET", sNo: 38, code: "ASSET-042", desc: "ESSL SILKBIO-101TC Biometrics & RFID", uom: "NOS", price: 14975.20, eff: "2025-04-01" },
  { group: "ASSET", sNo: 39, code: "ASSET-043", desc: "Device Installation and commissioning", uom: "NOS", price: 2575.20, eff: "2025-04-01" },
  { group: "ASSET", sNo: 40, code: "ASSET-044", desc: "Cloud software", uom: "NOS", price: 27575.50, eff: "2025-04-01" },
  { group: "ASSET", sNo: 41, code: "ASSET-045", desc: "Injection Mould For Cover Assembly, Top", uom: "NOS", price: 520000.00, eff: "2025-04-01" },
  { group: "ASSET", sNo: 42, code: "ASSET-046", desc: "Injection Mould For Cover Assembly, Bottom", uom: "NOS", price: 1800000.00, eff: "2025-04-01" },
  { group: "ASSET", sNo: 43, code: "ASSET-048", desc: "12 INCH WALL MOUNTED FAN ALMONARD MAKE", uom: "NOS", price: 1887.00, eff: "2026-04-01" },
  { group: "ASSET", sNo: 44, code: "ASSET-049", desc: "36W LED TUBE LIGHT", uom: "NOS", price: 465.00, eff: "2026-04-01" },
  { group: "ASSET", sNo: 45, code: "ASSET-050", desc: "XDCR,RECTILINEAR 375MM - 10586024", uom: "NOS", price: 5750.00, eff: "2026-04-01" },
  { group: "ASSET", sNo: 46, code: "ASSET-051", desc: "PLATE,MTG POT S50 - 10574549", uom: "NOS", price: 560.00, eff: "2026-04-01" },
  { group: "ASSET", sNo: 47, code: "ASSET-052", desc: "BRACKET,GUIDE LINPOT - 10574548", uom: "NOS", price: 80.00, eff: "2026-04-01" },
  { group: "ASSET", sNo: 48, code: "ASSET-053", desc: "CPLG - 10378819", uom: "NOS", price: 255.00, eff: "2026-04-01" },
  { group: "ASSET", sNo: 49, code: "ASSET-054", desc: "SHCS,M04X016 - 10350871", uom: "NOS", price: 4.00, eff: "2026-04-01" },
  { group: "ASSET", sNo: 50, code: "ASSET-055", desc: "WASHER,LCK M06 SPR - 10351067", uom: "NOS", price: 2.00, eff: "2026-04-01" },
  { group: "ASSET", sNo: 51, code: "ASSET-056", desc: "SHCS,M06X016 - 10350848", uom: "NOS", price: 6.00, eff: "2026-04-01" },
  { group: "ASSET", sNo: 52, code: "ASSET-057", desc: "Z4 CONNECTOR FOR TRANSDUCER - 10573760", uom: "NOS", price: 82.00, eff: "2026-04-01" },
  { group: "ASSET", sNo: 53, code: "ASSET-058", desc: "CBL ATL SHD 3C C 0.5 MM2 - 11995882", uom: "NOS", price: 105.00, eff: "2026-04-01" },
  { group: "ASSET", sNo: 54, code: "ASSET-059", desc: "INJECTION MOULD FOR VI TOP COVER SERIAL TOOL 2 CAVITIES", uom: "NOS", price: 1000000.00, eff: "2026-04-01" },
  { group: "ASSET", sNo: 55, code: "ASSET-060", desc: "INJECTION MOULD FOR VI BOTTOM COVER SERIAL TOOL 2 CAVITIES", uom: "NOS", price: 2000000.00, eff: "2026-04-01" },
  { group: "ASSET", sNo: 56, code: "ASSET-061", desc: "INJECTION MOULD FOR VI MIDDLE COVER SERIAL TOOL 2 CAVITIES", uom: "NOS", price: 2300000.00, eff: "2026-04-01" },
  { group: "ASSET", sNo: 57, code: "ASSET-062", desc: "INJECTION MOULD FOR VI BREATHER COVER 4 CAVITIES", uom: "NOS", price: 200000.00, eff: "2026-04-01" },
  { group: "ASSET", sNo: 58, code: "ASSET-063", desc: "GUIDE BUSH 6C MOULD", uom: "NOS", price: 130000.00, eff: "2026-04-01" },
  { group: "ASSET", sNo: 59, code: "ASSET-064", desc: "GATE SEAL MSH TORPEDO E (TSM084) MASTER-SERIES", uom: "NOS", price: 8258.00, eff: "2026-04-01" },
  { group: "ASSET", sNo: 60, code: "ASSET-066", desc: "N-SERIES 80T - B 310 IU", uom: "NOS", price: 2130000.00, eff: "2026-04-01" },
  { group: "ASSET", sNo: 61, code: "ASSET-067", desc: "N-SERIES 150T - B 870 IU", uom: "NOS", price: 3030000.00, eff: "2026-04-01" },
  { group: "ASSET", sNo: 62, code: "ASSET-068", desc: "N-SERIES 200T - B 1000 IU", uom: "NOS", price: 3610000.00, eff: "2026-04-01" },
  { group: "ASSET", sNo: 63, code: "ASSET-069", desc: "OMEGA SERVO 550T - B 100MM FRAME", uom: "NOS", price: 10150000.00, eff: "2026-04-01" },
  { group: "ASSET", sNo: 64, code: "ASSET-070", desc: "U696 BACKREST ALUMINIUM TOOL - 2 CAVITY", uom: "NOS", price: 200000.00, eff: "2026-04-01" },
  { group: "ASSET", sNo: 65, code: "ASSET-071", desc: "CONVERSION OF ONLINE TO OFFLINE HOT AIR DRYER", uom: "NOS", price: 190000.00, eff: "2026-04-01" },
  { group: "ASSET", sNo: 66, code: "ASSET-072", desc: "HOPPER DRYER EHD 150 WITH HOPPER LOADER & ACCESSORIES", uom: "SET", price: 416000.00, eff: "2026-04-01" },
  { group: "ASSET", sNo: 67, code: "ASSET-073", desc: "HOPPER DRYER EHD 400 WITH HOPPER LOADER & ACCESSORIES", uom: "NOS", price: 238000.00, eff: "2026-04-01" },
  { group: "ASSET", sNo: 68, code: "ASSET-074", desc: "SCRAP GRINDER MODEL AR400 WITH SILO BLOWER 5HP MOTOR", uom: "SET", price: 1050000.00, eff: "2026-04-01" },
  { group: "ASSET", sNo: 69, code: "ASSET-075", desc: "FILTER MESH FOR GRINDER MODEL AR400 (10mm Hole)", uom: "NOS", price: 40000.00, eff: "2026-04-01" },
  { group: "ASSET", sNo: 70, code: "ASSET-076", desc: "PHILLIPS ZNC EDM DIE SINKER - PZE 550", uom: "NOS", price: 1650000.00, eff: "2026-04-01" },
  { group: "ASSET", sNo: 71, code: "ASSET-077", desc: "Chiller GKE18000AV Condenser (LH) - GKE18000", uom: "NOS", price: 72850.00, eff: "2026-04-01" },
  { group: "ASSET", sNo: 72, code: "ASSET-078", desc: "GKE22000A-V", uom: "NOS", price: 1046250.00, eff: "2026-04-01" },
  { group: "ASSET", sNo: 73, code: "ASSET-079", desc: "GKE18000A-V", uom: "NOS", price: 763500.00, eff: "2026-04-01" },
  { group: "ASSET", sNo: 82, code: "GKE18000A-V", desc: "GKE18000A-V Inverter chiller, 57kW cooling capacity", uom: "NOS", price: 7.00, eff: "2025-08-12" },
  { group: "ASSET", sNo: 83, code: "GWK MOULD TA350", desc: "GWK MOULD TEMPERATURE CONTROLLER MODEL TECO TA350 WATER BASED", uom: "NOS", price: 81000.00, eff: "2025-08-12" },
  { group: "ASSET", sNo: 84, code: "GWK MOULD TA50", desc: "GWK MOULD TEMPERATURE CONTROLLER MODEL TECO TA50 OIL BASED", uom: "NOS", price: 81000.00, eff: "2025-08-12" },
  { group: "ASSET", sNo: 85, code: "HOPPER DRYER", desc: "HOPPER DRYER EHD 200 WITH HOPPER LOADER & ACCESSORIES", uom: "NOS", price: 214000.00, eff: "2025-08-12" },
  { group: "ASSET", sNo: 86, code: "HOPPER DRYER EHD 100", desc: "HOPPER DRYER EHD 100 WITH HOPPER LOADER & ACCESSORIES", uom: "NOS", price: 110000.00, eff: "2025-08-12" },
  // BOP-EXIDE
  { group: "BOP-EXIDE", sNo: 87, code: "BD7197O", desc: "LID INSERT 12V 80 / 100 Ah", uom: "NOS", price: 43.07, eff: "2025-12-30" },
  { group: "BOP-EXIDE", sNo: 88, code: "BOP-0034", desc: "Silicon Rubber Roller 140mm X 105mm OD X 37mm ID X 60H Blue", uom: "NOS", price: 7600.00, eff: "2025-04-01" },
  { group: "BOP-EXIDE", sNo: 89, code: "BOP-0035", desc: "Silicon Rubber Roller 73mm X 105mm OD X 37mm ID X 60H Blue", uom: "NOS", price: 4000.00, eff: "2025-04-01" },
  { group: "BOP-EXIDE", sNo: 90, code: "BOP-0063", desc: "FE02-EP84-12 (EP 100 ah Container & Lid) JUPITER - FRV2", uom: "NOS", price: 10.02, eff: "2026-04-01" },
  { group: "BOP-EXIDE", sNo: 91, code: "BOP-027", desc: "CRATES 600*400*485 MM (Orange)", uom: "NOS", price: 700.00, eff: "2025-04-01" },
  { group: "BOP-EXIDE", sNo: 92, code: "BOP-028", desc: "12V 120/150 type Round Bush", uom: "NOS", price: 22.13, eff: "2025-04-01" },
  // BOP-IFB
  { group: "BOP-IFB", sNo: 93, code: "BOP-0002", desc: "INSERT BUFFER", uom: "NOS", price: 3.37, eff: "2025-04-01" },
  { group: "BOP-IFB", sNo: 94, code: "BOP-0010", desc: "THREAD INSERT M6*10 (Dia 12 Profile)", uom: "NOS", price: 2.81, eff: "2025-04-01" },
  { group: "BOP-IFB", sNo: 95, code: "T1500200-TROLLEYBS", desc: "STEEL THREADED INSERT (M12X1.75P) L-41mm -IFB", uom: "NOS", price: 11.60, eff: "2025-04-01" },
  // BOP-P3L
  { group: "BOP-P3L", sNo: 96, code: "B100120", desc: "INSERT (6.50 X 8.90 X15) -CES", uom: "NOS", price: 1.21, eff: "2025-05-26" },
  { group: "BOP-P3L", sNo: 97, code: "BOP-G.I WIRE MESH", desc: "1.2MM X 4ft X 50FT G.I WIRE MESH", uom: "ROLL", price: 3200.00, eff: "2025-04-01" },
  // BOP-PURFLUX
  { group: "BOP-PURFLUX", sNo: 98, code: "6799002060", desc: "THREAD INSERT (M5 X 10) -YELLOW", uom: "NOS", price: 1.32, eff: "2025-05-03" },
  { group: "BOP-PURFLUX", sNo: 99, code: "6799004330", desc: "THREAD INSERT (M5 X 10) -TRIVALENT BLUE", uom: "NOS", price: 1.32, eff: "2025-04-01" },
  { group: "BOP-PURFLUX", sNo: 100, code: "67990237230", desc: "THREAD INSERT (M6X20.5)-TRIVALENT BLUE", uom: "NOS", price: 3.70, eff: "2025-04-22" },
  { group: "BOP-PURFLUX", sNo: 101, code: "6799023730", desc: "THREAD INSERT (M6X20.5)-TRIVALENT BLUE", uom: "NOS", price: 3.70, eff: "2025-05-01" },
  { group: "BOP-PURFLUX", sNo: 102, code: "6799040210", desc: "THREAD INSERT (M5 X 10) -TRIVALENT BLUE", uom: "NOS", price: 1.32, eff: "2025-04-01" },
  { group: "BOP-PURFLUX", sNo: 103, code: "BOP-0027", desc: "BELLOW LH - (6799038000A0-U7)", uom: "NOS", price: 121.35, eff: "2025-04-01" },
  { group: "BOP-PURFLUX", sNo: 104, code: "BOP-0028", desc: "BELLOW RH - (6799038010A0-U7)", uom: "NOS", price: 121.35, eff: "2025-04-01" },
  { group: "BOP-PURFLUX", sNo: 105, code: "BOP-0038", desc: "FSCR,B970 (DIA60)20 NIT - 10596586", uom: "NOS", price: 50900.00, eff: "2026-04-01" },
  { group: "BOP-PURFLUX", sNo: 106, code: "BOP-0039", desc: "BRL,NIT 60MM ID 20.0:1 970C - 10260900", uom: "NOS", price: 110000.00, eff: "2026-04-01" },
  { group: "BOP-PURFLUX", sNo: 107, code: "BOP-0040", desc: "ADPT.BRL 970 INJ 60MM EURO - 10446309", uom: "NOS", price: 10400.00, eff: "2026-04-01" },
  { group: "BOP-PURFLUX", sNo: 108, code: "BOP-0041", desc: "NOZBDY,120.65MM LG M30X1.5 - 10596147", uom: "NOS", price: 2450.00, eff: "2026-04-01" },
  { group: "BOP-PURFLUX", sNo: 109, code: "BOP-0042", desc: "TIP,NOZ 15R 3.5 M30X1.5P,57L - 10811856", uom: "NOS", price: 1600.00, eff: "2026-04-01" },
  { group: "BOP-PURFLUX", sNo: 110, code: "BOP-0043", desc: "KIT,TSV 60 STELLITE-12 - 11123688", uom: "NOS", price: 10200.00, eff: "2026-04-01" },
  { group: "BOP-PURFLUX", sNo: 111, code: "BOP-0044", desc: "BUSH,SPLINED INV M2.0 021T - 10432736", uom: "NOS", price: 5700.00, eff: "2026-04-01" },
  { group: "BOP-PURFLUX", sNo: 112, code: "BOP-0045", desc: "RETAINER,FEEDSCR EW 970 - 10396210", uom: "NOS", price: 1100.00, eff: "2026-04-01" },
  { group: "BOP-PURFLUX", sNo: 113, code: "BOP-0046", desc: "PIN,BARREL - 10373584", uom: "NOS", price: 105.00, eff: "2026-04-01" },
  { group: "BOP-PURFLUX", sNo: 114, code: "BOP-0047", desc: "O-RING,07.50ID .139CS 70NTRL - 10351545", uom: "NOS", price: 155.00, eff: "2026-04-01" },
  { group: "BOP-PURFLUX", sNo: 115, code: "BOP-0048", desc: "GEFRAN DBR 2KW 14OHM 40HP - 12027420", uom: "NOS", price: 3750.00, eff: "2026-04-01" },
  { group: "BOP-PURFLUX", sNo: 116, code: "BOP-0049", desc: "HANDLE,GATE LOCK(LFT)-DIRAK - 10594551", uom: "NOS", price: 3000.00, eff: "2026-04-01" },
  { group: "BOP-PURFLUX", sNo: 117, code: "BOP-0050", desc: "SHCS,M06X012 - 10350850", uom: "NOS", price: 6.00, eff: "2026-04-01" },
  { group: "BOP-PURFLUX", sNo: 118, code: "BOP-0051", desc: "SHCS,M06X070 FULL THREAD - 10590699", uom: "NOS", price: 18.00, eff: "2026-04-01" },
  { group: "BOP-PURFLUX", sNo: 119, code: "BOP-0052", desc: "WASHER,PLN M12 STL - 10350975", uom: "NOS", price: 7.00, eff: "2026-04-01" },
  { group: "BOP-PURFLUX", sNo: 120, code: "BOP-0053", desc: "HOOK,GATE LOCKING MM500/650 - 10808276", uom: "NOS", price: 240.00, eff: "2026-04-01" },
  { group: "BOP-PURFLUX", sNo: 121, code: "BOP-0054", desc: "NUT,HEX M08X1.25 RH STL 6.8THK - 10351032", uom: "NOS", price: 2.00, eff: "2026-04-01" },
  { group: "BOP-PURFLUX", sNo: 122, code: "BOP-0055", desc: "NUT,HEX M06X1.0 RH STL - 10351029", uom: "NOS", price: 2.00, eff: "2026-04-01" },
  { group: "BOP-PURFLUX", sNo: 123, code: "BOP-0057", desc: "METAL INSERT (B242224A)", uom: "NOS", price: 2.27, eff: "2026-04-01" },
  { group: "BOP-PURFLUX", sNo: 124, code: "BOP-0064", desc: "SHEAT HEATER 650mm (INLET COVER/ 200812-2 ) HMESH 650", uom: "NOS", price: 14500.00, eff: "2026-04-01" },
  { group: "BOP-PURFLUX", sNo: 125, code: "BOP-0073", desc: "M6*10 (6799003420A1) Purflux", uom: "NOS", price: 2.38, eff: "2026-04-01" },
  // BOP-SANDHAR
  { group: "BOP-SANDHAR", sNo: 126, code: "TI01050", desc: "BUSH.UNIVERSAL CLAMP BOTTOM", uom: "NOS", price: 1.70, eff: "2025-06-15" },
  // BOP-UML
  { group: "BOP-UML", sNo: 127, code: "701510011001", desc: "BAND TOOL KIT (RUBBER)", uom: "NOS", price: 2.09, eff: "2025-04-01" },
  { group: "BOP-UML", sNo: 128, code: "701513011007", desc: "PACKING SEATBASE U467", uom: "NOS", price: 29.79, eff: "2025-11-20" },
  { group: "BOP-UML", sNo: 129, code: "701528011001", desc: "CUSHION SEAT REAR U467", uom: "NOS", price: 2.19, eff: "2025-11-20" },
  { group: "BOP-UML", sNo: 130, code: "701850001008", desc: "HEX HD SCREW (M6X26.5) -U256", uom: "NOS", price: 1.00, eff: "2025-07-15" },
  { group: "BOP-UML", sNo: 131, code: "701852011003", desc: "SEAT BUSH(DIMPLE) -ATHER 450", uom: "NOS", price: 2.07, eff: "2026-01-10" },
  { group: "BOP-UML", sNo: 132, code: "701862011001", desc: "PACKING SEATBASE -N360 PILLION", uom: "NOS", price: 17.19, eff: "2025-04-01" },
  { group: "BOP-UML", sNo: 133, code: "701877011001", desc: "RUBBER SEAL - SIMPLE ONE", uom: "NOS", price: 39.78, eff: "2025-04-01" },
  { group: "BOP-UML", sNo: 134, code: "B100264", desc: "SUPPORT ROD -FOOTREST ASSY", uom: "NOS", price: 22.35, eff: "2025-04-01" },
  { group: "BOP-UML", sNo: 135, code: "B100768", desc: "K06-SEAT BASE M6X10 INSERT", uom: "NOS", price: 4.45, eff: "2025-04-01" },
  { group: "BOP-UML", sNo: 136, code: "B14732014P01", desc: "INSERT BUSH-KNOB", uom: "NOS", price: 3.41, eff: "2026-02-12" },
  { group: "BOP-UML", sNo: 137, code: "B14732021F01", desc: "CSK SLOTTED SELEF-TAPING SCREW", uom: "NOS", price: 0.51, eff: "2026-02-12" },
  // CATER PILLAR
  { group: "CATER PILLAR", sNo: 184, code: "3170092/D", desc: "Holder As Bulb", uom: "NOS", price: 14.00, eff: "2025-08-30" },
  { group: "CATER PILLAR", sNo: 185, code: "4W7629", desc: "COVER (4W7629)", uom: "NOS", price: 4.00, eff: "2024-04-01" },
  // FUTURE ACCESSORIES
  { group: "FUTURE ACCESSORIES", sNo: 373, code: "APACHE LEVER", desc: "APACHE LEVER GUARD..", uom: "NOS", price: 700000.00, eff: "2025-11-06" },
  { group: "FUTURE ACCESSORIES", sNo: 374, code: "APACHE LEVER GUARD", desc: "LH/RH Stem short (Family mold)", uom: "NOS", price: 570000.00, eff: "2025-11-06" },
  { group: "FUTURE ACCESSORIES", sNo: 375, code: "APACHE LEVER GUARD.", desc: "LH/RH Attachment (Family mold)", uom: "NOS", price: 330000.00, eff: "2025-11-06" },
  { group: "FUTURE ACCESSORIES", sNo: 376, code: "APACHE SLIDER", desc: "Apache Slider Outer Texturing", uom: "NOS", price: 20000.00, eff: "2025-11-21" },
  { group: "FUTURE ACCESSORIES", sNo: 378, code: "CHOGORI HOLDER", desc: "CHOGORI HOLDER INJECTION MOLD", uom: "NOS", price: 500000.00, eff: "2025-11-06" },
  { group: "FUTURE ACCESSORIES", sNo: 381, code: "FRAME", desc: "FRAME SLIDER REAR CAP", uom: "NOS", price: 670000.00, eff: "2025-11-06" },
  { group: "FUTURE ACCESSORIES", sNo: 382, code: "FRAME SLIDER", desc: "Inner LH/RH (family Mold)", uom: "NOS", price: 450000.00, eff: "2025-11-06" },
  { group: "FUTURE ACCESSORIES", sNo: 383, code: "FRAME SLIDER.", desc: "OUTER LH/RH (Family Mold)", uom: "NOS", price: 650000.00, eff: "2025-11-06" },
  { group: "FUTURE ACCESSORIES", sNo: 384, code: "GUN HOLDER", desc: "GUN HOLDER UNIVERSAL INJUCTION MOULD", uom: "NOS", price: 300000.00, eff: "2025-11-06" },
  { group: "FUTURE ACCESSORIES", sNo: 386, code: "INJECTION MOLD", desc: "INJECTION MOLD BACKREST BASE BACK COVER -1 No / BASE-1 No", uom: "NOS", price: 550000.00, eff: "2025-04-01" },
  { group: "FUTURE ACCESSORIES", sNo: 388, code: "K2300490", desc: "Visor Head Lamp - Ntorq", uom: "NOS", price: 132.64, eff: "2024-04-01" },
  { group: "FUTURE ACCESSORIES", sNo: 389, code: "K2300830", desc: "KIT LEVER GUARD-NTORQ 150", uom: "NOS", price: 183.78, eff: "2025-11-27" },
  { group: "FUTURE ACCESSORIES", sNo: 390, code: "K2300840", desc: "FLOOR MAT NTORQ NEW", uom: "NOS", price: 161.48, eff: "2025-08-16" },
  { group: "FUTURE ACCESSORIES", sNo: 391, code: "K6300400", desc: "Floormat Black Premium Jupiter 110 New", uom: "NOS", price: 167.62, eff: "2024-04-01" },
  { group: "FUTURE ACCESSORIES", sNo: 392, code: "K6301040", desc: "KIT SCOOTER BRACKREST BLACK", uom: "NOS", price: 276.55, eff: "2025-08-28" },
  { group: "FUTURE ACCESSORIES", sNo: 395, code: "NR224930", desc: "BACKREST ASSY", uom: "NOS", price: 389.80, eff: "2026-08-07" },
  // HYCO
  { group: "HYCO", sNo: 425, code: "TVS", desc: "CLIP TVS", uom: "NOS", price: 1.74, eff: "2024-04-01" },
  // IFB AUTO
  { group: "IFB AUTO", sNo: 426, code: "10.", desc: "TROLLEYBS FOOT RESTING PAD 4CAVITY MOULD", uom: "NOS", price: 2000000.00, eff: "2025-09-19" },
  { group: "IFB AUTO", sNo: 427, code: "50020587", desc: "ADJ TROL BS FOOT REST PAD T1500200", uom: "NOS", price: 60.00, eff: "2024-04-01" },
  { group: "IFB AUTO", sNo: 428, code: "50020587-H2", desc: "ADJ TROL BS FOOT REST PAD_T1500200 H2", uom: "NOS", price: 60.00, eff: "2025-07-25" },
  { group: "IFB AUTO", sNo: 429, code: "50020779", desc: "GLASS CLIP_M8500500", uom: "NOS", price: 18.86, eff: "2024-04-01" },
  { group: "IFB AUTO", sNo: 430, code: "50020780", desc: "WINDING HANDLE_M8500100", uom: "NOS", price: 18.86, eff: "2024-04-01" },
  { group: "IFB AUTO", sNo: 431, code: "50020781", desc: "KNOB_M8500200", uom: "NOS", price: 8.04, eff: "2024-04-01" },
  // KEWAUNEE
  { group: "KEWAUNEE", sNo: 433, code: "SP-FRCO", desc: "SERVICE POER FRONT REAR COVER MOC (KEWAUNEE)", uom: "NOS", price: 32.00, eff: "2024-04-01" },
  // Packing Materials
  { group: "Packing Materials", sNo: 434, code: "PCK-003", desc: "550X450X270 MM 5 PLY BOX", uom: "NOS", price: 70.00, eff: "2025-04-01" },
  { group: "Packing Materials", sNo: 435, code: "PCK-004", desc: "760X450X560 MM 5PLY BOX", uom: "NOS", price: 104.00, eff: "2025-04-01" },
  { group: "Packing Materials", sNo: 436, code: "PCK-053", desc: "650*450*315 CRATE WITH HANDLE BLUE COLOUR WITH SCREEN", uom: "NOS", price: 585.00, eff: "2025-04-01" },
  { group: "Packing Materials", sNo: 437, code: "PCK-054", desc: "LDPE COVER 15.5X25 GREEN", uom: "KGS", price: 121.00, eff: "2025-04-01" },
  { group: "Packing Materials", sNo: 438, code: "PCK-055", desc: "LDPE COVER 510*900", uom: "KGS", price: 121.00, eff: "2025-04-01" },
  { group: "Packing Materials", sNo: 439, code: "PCK-056", desc: "BACKREST PRIMARY BOX", uom: "NOS", price: 7.44, eff: "2025-04-01" },
  { group: "Packing Materials", sNo: 440, code: "PCK-057", desc: "BACKREST OUTER BOX", uom: "NOS", price: 56.97, eff: "2025-04-01" },
  { group: "Packing Materials", sNo: 441, code: "PCK-058", desc: "940x940x585mm (C-FLUTE - 5PLY-RSC BOX WITH CALOCO CLOTH)", uom: "NOS", price: 305.00, eff: "2025-04-01" },
  // PREMIER
  { group: "PREMIER", sNo: 443, code: "K6040670-4", desc: "COVER INLET (PPL)", uom: "NOS", price: 261.00, eff: "2024-04-01" },
  { group: "PREMIER", sNo: 444, code: "K6040770", desc: "DRAIN PIPE -BIG (PPL)", uom: "NOS", price: 9.94, eff: "2024-04-01" },
  { group: "PREMIER", sNo: 445, code: "KA040140_1", desc: "PCV COVER BS6 (PPL)", uom: "NOS", price: 2.35, eff: "2024-04-01" },
  // RATHANA
  { group: "RATHANA", sNo: 446, code: "PPMASK", desc: "PP MASK OD 34 ID 20 15.5I 20", uom: "NOS", price: 1.20, eff: "2024-04-01" },
  // REJECTION
  { group: "REJECTION", sNo: 447, code: "G-GPP2610-SAUV-BLK", desc: "GPP 2610 SAUV BK", uom: "KGS", price: 172.00, eff: "2026-09-23" },
  // SANDHAR
  { group: "SANDHAR", sNo: 490, code: "COPLSB10600", desc: "BODY LATCH (H)", uom: "NOS", price: 7.72, eff: "2024-04-01" },
  { group: "SANDHAR", sNo: 491, code: "COPLSB10700", desc: "BUSH (DF01050)", uom: "NOS", price: 0.43, eff: "2024-04-01" },
  { group: "SANDHAR", sNo: 492, code: "COPLSB21300", desc: "BRACKET LH (RN03010) (0)", uom: "NOS", price: 92.17, eff: "2024-04-01" },
  { group: "SANDHAR", sNo: 493, code: "COPLSB21400", desc: "BRACKET RH (RO03010) (0)", uom: "NOS", price: 92.17, eff: "2024-04-01" },
  { group: "SANDHAR", sNo: 494, code: "COPLSB35600", desc: "BODY COVER-JUBITOR(WF07030)", uom: "NOS", price: 12.33, eff: "2024-04-01" },
  { group: "SANDHAR", sNo: 495, code: "COPLSB49200", desc: "BEZEL RH(S-211-03020)", uom: "NOS", price: 5.80, eff: "2024-04-01" },
  { group: "SANDHAR", sNo: 496, code: "COPLSB49300", desc: "BEZEL LH(S-210-03020)", uom: "NOS", price: 5.58, eff: "2024-04-01" },
  { group: "SANDHAR", sNo: 497, code: "COPLSC50300", desc: "COVER BRACKET LH (RN01010) (0)", uom: "NOS", price: 18.35, eff: "2024-04-01" },
  { group: "SANDHAR", sNo: 498, code: "COPLSC50400", desc: "COVER BRACKET RH ( RO01010) (0)", uom: "NOS", price: 18.35, eff: "2024-04-01" },
  { group: "SANDHAR", sNo: 499, code: "COPLSC57500", desc: "CAP LOCK (UG01030)", uom: "NOS", price: 5.38, eff: "2024-04-01" },
  { group: "SANDHAR", sNo: 500, code: "COPLSD02800", desc: "DETENT MOVING (RN04020) (0)", uom: "NOS", price: 16.24, eff: "2024-04-01" },
  { group: "SANDHAR", sNo: 501, code: "COPLSD02900", desc: "DETENT SLIDING (RN05010) (0)", uom: "NOS", price: 3.39, eff: "2024-04-01" },
  { group: "SANDHAR", sNo: 512, code: "COPLSH50200", desc: "HOUSING RH (UQ01010) (0)", uom: "NOS", price: 15.85, eff: "2024-04-01" },
  { group: "SANDHAR", sNo: 517, code: "COPLSM05700", desc: "MAIN MIRROR HOUSING (TI01010) (0)", uom: "NOS", price: 41.78, eff: "2024-04-01" },
  { group: "SANDHAR", sNo: 518, code: "COPLSM07200", desc: "MIRROR HOUSING LH(VC01010)", uom: "NOS", price: 9.19, eff: "2024-04-01" },
  { group: "SANDHAR", sNo: 519, code: "COPLSM07300", desc: "MIRROR HOUSING RH (VD01010)", uom: "NOS", price: 9.19, eff: "2024-04-01" },
  // SOGEFI
  { group: "SOGEFI", sNo: 541, code: "10..", desc: "INLET TOP COVER", uom: "NOS", price: 3420.00, eff: "2026-05-06" },
  { group: "SOGEFI", sNo: 542, code: "6799002540A3-U7", desc: "Protective Cap for XEP207", uom: "NOS", price: 0.61, eff: "2024-04-01" },
  { group: "SOGEFI", sNo: 543, code: "6799005150A2-U7", desc: "SLEEVE REML ASSY 5.5X", uom: "NOS", price: 1.02, eff: "2024-04-01" },
  { group: "SOGEFI", sNo: 544, code: "6799010650A4", desc: "COVER COMP AIR CLEANER XFA 305", uom: "NOS", price: 25.26, eff: "2024-04-01" },
  { group: "SOGEFI", sNo: 545, code: "6799010710A2", desc: "TOP COVER FILTER (A2)XFA 305", uom: "NOS", price: 21.83, eff: "2024-04-01" },
  { group: "SOGEFI", sNo: 546, code: "6799021370A2-U7", desc: "LH Cover New", uom: "NOS", price: 42.28, eff: "2024-04-01" },
  { group: "SOGEFI", sNo: 547, code: "6799021380A5-U7", desc: "RH COVER New", uom: "NOS", price: 68.78, eff: "2024-04-01" },
  { group: "SOGEFI", sNo: 548, code: "6799023000A0", desc: "Case Air Cleaner (XFA355) N251", uom: "NOS", price: 45.60, eff: "2024-04-01" },
  { group: "SOGEFI", sNo: 550, code: "6799024930A0-U7", desc: "LH COVER SUB ASSEMBLY XFA351", uom: "NOS", price: 185.04, eff: "2024-04-01" },
  { group: "SOGEFI", sNo: 551, code: "6799024940A1-U7", desc: "RH COVER SUB ASSEMBLY XFA351", uom: "NOS", price: 219.62, eff: "2024-04-01" },
  { group: "SOGEFI", sNo: 555, code: "6799032360A0", desc: "Case Air Cleaner(MNR)", uom: "NOS", price: 39.93, eff: "2024-04-01" },
  { group: "SOGEFI", sNo: 562, code: "6799042440A0-U7", desc: "CASE AIR CLEANER -XFA491-U368", uom: "NOS", price: 98.68, eff: "2024-04-01" },
  // UNO MINDA
  { group: "UNO MINDA - HSSL", sNo: 574, code: "701880010003", desc: "SEAT BASE OUTER PILLION -U400", uom: "NOS", price: 15.49, eff: "2024-04-01" },
  { group: "UNO MINDA - HSSL", sNo: 575, code: "A11108101P01", desc: "GUIDE BUSH", uom: "NOS", price: 2.52, eff: "2024-04-01" },
  { group: "UNO MINDA - HSSL", sNo: 586, code: "B14724472P01", desc: "BACK COVER -MAGNUM (V. GREY)", uom: "NOS", price: 119.14, eff: "2024-04-01" },
  { group: "UNO MINDA - HSSL", sNo: 587, code: "B14731118A01", desc: "ASSY 3 POSITION FOOTREST-GREY", uom: "NOS", price: 352.08, eff: "2024-04-01" },
  { group: "UNO MINDA - HSSL", sNo: 594, code: "B14732032A01", desc: "ASSY SIDE COVER RH- FUTURA", uom: "NOS", price: 84.58, eff: "2024-04-01" },
  { group: "UNO MINDA - HSSL", sNo: 598, code: "B14732036A01", desc: "ASSY SIDE COVER RH -PLAIN", uom: "NOS", price: 84.58, eff: "2024-04-01" },
  { group: "UNO MINDA - HSSL", sNo: 646, code: "701500010001", desc: "SEAT BASE - N17", uom: "NOS", price: 90.25, eff: "2025-04-29" },
  { group: "UNO MINDA - HSSL", sNo: 647, code: "701504010004", desc: "SEAT BASE - U229 (VAVE)", uom: "NOS", price: 126.15, eff: "2024-04-01" },
  { group: "UNO MINDA - HSSL", sNo: 655, code: "701525010005", desc: "SEAT BASE U696", uom: "NOS", price: 160.74, eff: "2024-04-01" },
  { group: "UNO MINDA - HSSL", sNo: 669, code: "701829010001", desc: "SEAT BASE - K03", uom: "NOS", price: 198.89, eff: "2025-03-27" },
  { group: "UNO MINDA - HSSL", sNo: 675, code: "701852010002", desc: "SEAT BASE -ATHER 450", uom: "NOS", price: 170.94, eff: "2024-04-01" },
  { group: "UNO MINDA - HSSL", sNo: 676, code: "701852010004", desc: "SEAT BASE - ATHER 450 WITH BUFFER", uom: "NOS", price: 205.18, eff: "2024-04-01" },
  { group: "UNO MINDA - HSSL", sNo: 689, code: "701865010005", desc: "COVER FRONT BACKREST-U696", uom: "NOS", price: 401.17, eff: "2025-06-27" },
  { group: "UNO MINDA - HSSL", sNo: 693, code: "701877010001", desc: "SEAT BASE -SIMPLE ONE", uom: "NOS", price: 174.69, eff: "2025-05-01" },
  { group: "UNO MINDA - HSSL", sNo: 709, code: "703013010001", desc: "DNR NECKREST BEAM ASSY", uom: "NOS", price: 643.23, eff: "2025-05-27" },
  // RAW MATERIALS
  { group: "RAW MATERIALS", sNo: 767, code: "9049L", desc: "VB 9049L", uom: "KGS", price: 172.00, eff: "2025-07-02" },
  { group: "RAW MATERIALS", sNo: 768, code: "9050L", desc: "VB 9050L", uom: "KGS", price: 175.00, eff: "2025-07-01" },
  { group: "RAW MATERIALS", sNo: 771, code: "G- PP10GF", desc: "APPCOM GF 1510 BK UV", uom: "KGS", price: 124.38, eff: "2026-04-01" },
  { group: "RAW MATERIALS", sNo: 772, code: "G-ABP", desc: "ABP-1520 UVBK705 (DA)", uom: "KGS", price: 126.85, eff: "2026-04-01" },
  { group: "RAW MATERIALS", sNo: 773, code: "G-ABS", desc: "ABS FRV0 - GREY", uom: "KGS", price: 375.00, eff: "2025-04-01" },
  { group: "RAW MATERIALS", sNo: 774, code: "G-ABS-BK", desc: "H1 40B JET BLACK", uom: "KGS", price: 148.00, eff: "2025-04-01" },
  { group: "RAW MATERIALS", sNo: 777, code: "G-ABS-FRV2-BLK", desc: "ABS FRV2 BLACK GRADE: SN08-111A", uom: "KGS", price: 326.00, eff: "2025-05-12" },
  { group: "RAW MATERIALS", sNo: 778, code: "G-ABS-GA501", desc: "ABS-GA501(IN) 901 BLACK", uom: "KGS", price: 159.02, eff: "2025-04-01" },
  { group: "RAW MATERIALS", sNo: 780, code: "G-ABS-IMC45V-BLK", desc: "PC-ABS ABSTRON IMC45V(C9999 JET Black)", uom: "KGS", price: 318.32, eff: "2026-04-01" },
  { group: "RAW MATERIALS", sNo: 783, code: "G-ABS-SD0150-BLK", desc: "ABS (B) SD0150", uom: "KGS", price: 134.33, eff: "2025-08-22" },
  { group: "RAW MATERIALS", sNo: 790, code: "G-APPC-HC4001BK", desc: "APPCOM HC4001 BK", uom: "KGS", price: 100.00, eff: "2025-04-23" },
  { group: "RAW MATERIALS", sNo: 791, code: "G-APPCOM", desc: "APPCOM G31 CC TS BK", uom: "KGS", price: 104.52, eff: "2025-04-01" },
  { group: "RAW MATERIALS", sNo: 793, code: "G-ASA", desc: "ASA-UA1501(IN) 901 BLACK", uom: "KGS", price: 272.02, eff: "2025-04-01" },
  { group: "RAW MATERIALS", sNo: 794, code: "G-CA105D7-GRY", desc: "PC ALLOY CA105D7 XCX GREY", uom: "KGS", price: 440.00, eff: "2025-08-16" },
  { group: "RAW MATERIALS", sNo: 795, code: "G-FRV0-PP-GRY", desc: "PP FRV0 SP5616 7587-7024", uom: "KGS", price: 424.13, eff: "2025-10-03" },
  { group: "RAW MATERIALS", sNo: 798, code: "G-GF15-BMW-PA6-BLK", desc: "GF15% BLACK (BMW) PA6 15% LOXIM", uom: "KGS", price: 180.00, eff: "2025-04-01" },
  { group: "RAW MATERIALS", sNo: 801, code: "G-HC1020-UV-BLK", desc: "APPCOM TALC PP 20% 1020 BK UV HC1020 BK UV", uom: "KGS", price: 107.00, eff: "2025-07-26" },
  { group: "RAW MATERIALS", sNo: 807, code: "G-LOTTE-ABS", desc: "LOTTE-ABS RESIN PTB-0183 /K2007", uom: "MT", price: 1300.00, eff: "2025-04-01" },
  { group: "RAW MATERIALS", sNo: 809, code: "G-M25-44", desc: "DURACON NAT M25-44", uom: "KGS", price: 223.00, eff: "2025-04-01" },
  { group: "RAW MATERIALS", sNo: 810, code: "G-MAKROLON-PC-BK", desc: "MAKROLON FR6005 901510", uom: "KGS", price: 327.00, eff: "2025-04-01" },
  { group: "RAW MATERIALS", sNo: 812, code: "G-MB-9002L-BLK", desc: "MASTER BATCH VB BLACK 9002 L", uom: "KGS", price: 178.00, eff: "2025-07-08" },
  { group: "RAW MATERIALS", sNo: 820, code: "G-N6-GF30LT", desc: "NYLON6 GF30LT", uom: "KGS", price: 170.00, eff: "2025-05-01" },
  { group: "RAW MATERIALS", sNo: 822, code: "G-NY-SGF30-BLK", desc: "NYLON SGF30 % BLACK", uom: "KGS", price: 205.00, eff: "2025-04-01" },
  { group: "RAW MATERIALS", sNo: 827, code: "G-NY66-RFG33-BLK", desc: "NYLON 66 RFG 33 BLACK", uom: "KGS", price: 319.00, eff: "2026-04-01" },
  { group: "RAW MATERIALS", sNo: 832, code: "G-PC", desc: "PC 3107550115 MAS198", uom: "KGS", price: 185.00, eff: "2025-04-01" },
  { group: "RAW MATERIALS", sNo: 834, code: "G-PC SC1060U", desc: "INFINO PC SC1060U CLEAR", uom: "KGS", price: 182.00, eff: "2025-05-01" },
  { group: "RAW MATERIALS", sNo: 837, code: "G-PP", desc: "PPCP 5120MG", uom: "KGS", price: 140.29, eff: "2026-04-01" },
  { group: "RAW MATERIALS", sNo: 839, code: "G-PP COMPOUND", desc: "PP COMPOUND - PP FRV2 SP5601 7701", uom: "KGS", price: 190.33, eff: "2026-04-01" },
  { group: "RAW MATERIALS", sNo: 840, code: "G-PP TALC", desc: "ATP PLAST T 30 BK PPC", uom: "KGS", price: 127.70, eff: "2026-04-01" },
  { group: "RAW MATERIALS", sNo: 845, code: "G-PPCP", desc: "PPCP (N)", uom: "KGS", price: 86.50, eff: "2025-04-01" },
  { group: "RAW MATERIALS", sNo: 846, code: "G-PPCP-4100MH-N", desc: "PPCP (N)-IOCL 4100MH", uom: "KGS", price: 120.00, eff: "2025-05-01" },
  { group: "RAW MATERIALS", sNo: 849, code: "G-PPCP-HALENE", desc: "HALENE P M310", uom: "KGS", price: 159.79, eff: "2026-04-01" },
  { group: "RAW MATERIALS", sNo: 852, code: "G-PVC-15", desc: "PVC COMPOUND 15BK - ARORA", uom: "KGS", price: 70.00, eff: "2025-04-01" },
  { group: "RAW MATERIALS", sNo: 853, code: "G-PVC-70FR", desc: "PVC 70FR BK", uom: "KGS", price: 78.00, eff: "2025-04-01" },
  // Page 30 USD
  { group: "RAW MATERIALS", sNo: 1, code: "G-ABS-LOTTE-USD", desc: "STAREX PTB-0183/74859 Pre Colour - Blue", uom: "MT", price: 1630.00, eff: "2025-04-01", curr: "USD ($)" }
];

function getSupplierForGroup(group) {
  const g = (group || "").toUpperCase();
  if (g.includes("PURFLUX") || g.includes("SOGEFI")) return { id: "SUP-C0003", name: "SOGEFI ENGINE SYSTEMS INDIA PVT LTD" };
  if (g.includes("EXIDE")) return { id: "SUP-C0003", name: "EXIDE INDUSTRIAL LIMITED (WEST BENGAL)" };
  if (g.includes("SANDHAR")) return { id: "SUP-S0022", name: "SANDHAR TECHNOLOGIES LIMITED" };
  if (g.includes("IFB")) return { id: "SUP-S0050", name: "IFB AUTOMOTIVE PRIVATE LIMITED" };
  if (g.includes("MINDA")) return { id: "SUP-U0001", name: "UNO MINDA LIMITED (HSSL / PUNE)" };
  if (g.includes("SACL")) return { id: "SUP-S0001", name: "SACL AUTOMOTIVE COMPONENTS LTD" };
  if (g.includes("APJ")) return { id: "SUP-A0012", name: "APJ AUTOMOTIVE COMPONENTS" };
  if (g.includes("RAW MATERIALS")) return { id: "SUP-S0128", name: "RELIANCE INDUSTRIES LIMITED (POLYMER DIV)" };
  if (g.includes("PACKING")) return { id: "SUP-P0015", name: "PREMIER PACKAGING & CORRUGATION LTD" };
  if (g.includes("KEWAUNEE")) return { id: "SUP-K0008", name: "KEWAUNEE SCIENTIFIC CORPORATION" };
  return { id: "SUP-C0003", name: `SP-PLASTECH VENDOR (${group})` };
}

const entries = fullPdfItems.map((item, idx) => {
  const sup = getSupplierForGroup(item.group);
  const isIndexed = (item.group || '').toUpperCase().includes('RAW MATERIALS');
  const isTiered = ['BAG', 'BOX', 'ROLL'].includes(item.uom);

  return {
    id: `PL-${item.code.replace(/[^a-zA-Z0-9_-]/g, '_')}-${idx + 1}`,
    priceListId: `PL-SPP-2026-Q3`,
    supplierId: sup.id,
    supplierName: sup.name,
    groupCategory: item.group,
    itemCode: item.code,
    itemName: item.desc,
    uom: item.uom,
    currency: item.curr || 'INR (₹)',
    unitPrice: item.price,
    effectiveFrom: item.eff,
    effectiveTo: '2026-12-31',
    moq: item.uom === 'KGS' || item.uom === 'MT' ? 500 : 50,
    leadTimeDays: 7,
    priceType: isIndexed ? 'Indexed' : (isTiered ? 'Tiered' : 'Fixed'),
    indexReference: isIndexed ? 'Platts CFR South Asia Polymer Benchmark' : undefined,
    baseIndexValue: isIndexed ? item.price * 0.92 : undefined,
    adjustmentFormula: isIndexed ? 'P = Index_Platts + BaseAdder' : undefined,
    freightIncluded: true,
    packingIncluded: true,
    taxPct: 18,
    status: 'Active',
    tiers: isTiered ? [
      { minQty: 50, maxQty: 500, price: item.price, discountPct: 0 },
      { minQty: 501, maxQty: 2000, price: Number((item.price * 0.97).toFixed(2)), discountPct: 3 },
      { minQty: 2001, maxQty: 10000, price: Number((item.price * 0.94).toFixed(2)), discountPct: 6 }
    ] : undefined
  };
});

const tsOutput = `// ============================================================================
// LIVE SUPPLIER PRICE LISTS & CONTRACT FORMULAS CATALOG
// Source: Official Item Price List (Report RAPM1101A01T01) — SP PLASTECH
// ============================================================================
import { SupplierPriceListEntry } from '../types/procurement';

export const DOCUMENT_SUPPLIER_PRICE_LISTS: SupplierPriceListEntry[] = ${JSON.stringify(entries, null, 2)};
`;

fs.writeFileSync(path.join(__dirname, '..', 'src', 'data', 'liveSupplierPriceLists.ts'), tsOutput, 'utf8');
console.log(`✅ Saved ${entries.length} price lists in src/data/liveSupplierPriceLists.ts`);
