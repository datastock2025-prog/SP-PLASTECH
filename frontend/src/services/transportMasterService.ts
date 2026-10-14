import { adminEventBus } from './adminService';

export interface TransporterRecord {
  id: string;
  transporterCode: string;
  name: string;
  transporterIdGstin: string; // 15-digit GSTIN / E-Way Bill Transporter ID
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  transportModes: ('Road' | 'Rail' | 'Air' | 'Ship' | 'Multi-Modal')[];
  vehicleTypes: string[];
  status: 'active' | 'inactive';
  rating: number;
  totalShipments: number;
  onTimeDeliveryPct: number;
  notes?: string;
  createdDate: string;
}

const STORAGE_KEY = 'reboot_erp_transporters_master';

export const INITIAL_TRANSPORTERS: TransporterRecord[] = [
  {
    id: 'TRP-001',
    transporterCode: 'TRP-VRL-01',
    name: 'VRL Logistics Ltd',
    transporterIdGstin: '29AABCV1234F1Z1',
    contactPerson: 'Manoj Hegde (Fleet Ops)',
    phone: '+91 98450 12345',
    email: 'ops.pune@vrllogistics.in',
    address: 'Plot 45, Nigdi Transport Hub, Old Mumbai-Pune Highway',
    city: 'Pune',
    state: 'Maharashtra',
    transportModes: ['Road', 'Multi-Modal'],
    vehicleTypes: ['32ft Multi-Axle Container (14 Ton)', '20ft Closed Body Truck (7 Ton)', 'Eicher 17ft (4 Ton)'],
    status: 'active',
    rating: 4.8,
    totalShipments: 1420,
    onTimeDeliveryPct: 97.4,
    notes: 'Primary fleet partner for Western & Southern corridor automotive dispatches.',
    createdDate: '2026-01-10',
  },
  {
    id: 'TRP-002',
    transporterCode: 'TRP-OM-02',
    name: 'Om Logistics Fleet Ltd',
    transporterIdGstin: '07AAACT1029Q1ZY',
    contactPerson: 'Rajesh Kaushik',
    phone: '+91 98110 54321',
    email: 'delhi.hub@omlogistics.co.in',
    address: '12th KM Stone, Delhi-Jaipur Express Highway',
    city: 'Gurugram',
    state: 'Haryana',
    transportModes: ['Road', 'Rail'],
    vehicleTypes: ['32ft HQ Container (15 Ton)', '24ft Heavy Open Body (9 Ton)', 'Tata 407 (2.5 Ton)'],
    status: 'active',
    rating: 4.7,
    totalShipments: 980,
    onTimeDeliveryPct: 96.1,
    notes: 'Dedicated bulk polymer & finished bumper shipments to North Indian OEM clusters.',
    createdDate: '2026-01-15',
  },
  {
    id: 'TRP-003',
    transporterCode: 'TRP-SAFE-03',
    name: 'SafeXpress Roadways & Cargo',
    transporterIdGstin: '27AAACS9876Q1Z3',
    contactPerson: 'Sunil Deshmukh',
    phone: '+91 98220 99887',
    email: 'express.dispatch@safexpress.com',
    address: 'Bhiwandi Logistics Park, Unit 8, Building C',
    city: 'Thane',
    state: 'Maharashtra',
    transportModes: ['Road', 'Air'],
    vehicleTypes: ['Express Transit Van (1.5 Ton)', '19ft Container (5 Ton)', '32ft Multi-Axle (14 Ton)'],
    status: 'active',
    rating: 4.9,
    totalShipments: 2150,
    onTimeDeliveryPct: 98.6,
    notes: 'High-speed JIT dispatches with 24-hour GPS geofencing and automatic E-Way Bill Part B sync.',
    createdDate: '2026-02-01',
  },
  {
    id: 'TRP-004',
    transporterCode: 'TRP-SUPR-04',
    name: 'Supreme Bulk Dedicated Carriers',
    transporterIdGstin: '24AAACT4567R1Z9',
    contactPerson: 'Ketan Patel',
    phone: '+91 98980 44332',
    email: 'dispatch@supremecarriers.in',
    address: 'GIDC Industrial Estate, Gate 4, Vapi Highway',
    city: 'Vapi',
    state: 'Gujarat',
    transportModes: ['Road'],
    vehicleTypes: ['Heavy Bulker Silo (25 Ton Resin)', '32ft Container (14 Ton)'],
    status: 'active',
    rating: 4.6,
    totalShipments: 640,
    onTimeDeliveryPct: 94.8,
    notes: 'Raw resin tanker movement & heavy injection mold tooling transfers.',
    createdDate: '2026-02-20',
  },
  {
    id: 'TRP-005',
    transporterCode: 'TRP-TCI-05',
    name: 'TCI Freight Express Ltd',
    transporterIdGstin: '06AAACT0192P1ZF',
    contactPerson: 'Dinesh Singhania',
    phone: '+91 98100 88776',
    email: 'corp@tcifreight.com',
    address: 'TCI House, Sector 32',
    city: 'Gurugram',
    state: 'Haryana',
    transportModes: ['Road', 'Rail', 'Ship'],
    vehicleTypes: ['Multi-Axle Trailer (20 Ton)', '32ft Double Axle (18 Ton)', '20ft ISO Container'],
    status: 'active',
    rating: 4.7,
    totalShipments: 1200,
    onTimeDeliveryPct: 96.8,
    notes: 'National logistics network across all industrial sectors.',
    createdDate: '2026-03-01',
  },
];

function loadStoredTransporters(): TransporterRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Could not read transporters from localStorage', err);
  }
  saveStoredTransporters(INITIAL_TRANSPORTERS);
  return INITIAL_TRANSPORTERS;
}

function saveStoredTransporters(data: TransporterRecord[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.warn('Could not save transporters to localStorage', err);
  }
}

class TransportMasterService {
  private cache: TransporterRecord[] = loadStoredTransporters();

  public getTransportersSync(): TransporterRecord[] {
    if (!this.cache || this.cache.length === 0) {
      this.cache = loadStoredTransporters();
    }
    return this.cache;
  }

  public getActiveTransportersSync(): TransporterRecord[] {
    return this.getTransportersSync().filter((t) => t.status === 'active');
  }

  public async getTransporters(): Promise<TransporterRecord[]> {
    return this.getTransportersSync();
  }

  public async saveTransporter(transporter: TransporterRecord): Promise<TransporterRecord> {
    const idx = this.cache.findIndex(
      (t) => t.id === transporter.id || t.transporterCode === transporter.transporterCode
    );

    if (idx >= 0) {
      this.cache[idx] = { ...this.cache[idx], ...transporter };
    } else {
      this.cache.unshift(transporter);
    }

    saveStoredTransporters(this.cache);
    adminEventBus.emit('TRANSPORTER_SAVED', transporter);
    return transporter;
  }

  public async toggleStatus(id: string): Promise<TransporterRecord | null> {
    const target = this.cache.find((t) => t.id === id);
    if (!target) return null;

    target.status = target.status === 'active' ? 'inactive' : 'active';
    saveStoredTransporters(this.cache);
    adminEventBus.emit('TRANSPORTER_SAVED', target);
    return target;
  }

  public async deleteTransporter(id: string): Promise<boolean> {
    this.cache = this.cache.filter((t) => t.id !== id);
    saveStoredTransporters(this.cache);
    adminEventBus.emit('TRANSPORTER_DELETED', { id });
    return true;
  }

  public generateNextTransporterCode(): string {
    const count = this.cache.length + 1;
    return `TRP-${count.toString().padStart(3, '0')}`;
  }
}

export const transportMasterService = new TransportMasterService();
