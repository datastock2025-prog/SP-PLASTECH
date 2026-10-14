export interface OperatorRecord {
  id: string;
  name: string;
  code: string;
  role: string;
  department: string;
  plantId?: string;
  active: boolean;
}

const DEFAULT_OPERATORS: OperatorRecord[] = [
  { id: 'op-01', name: 'R. Sharma', code: 'OP-101', role: 'Senior Press Operator', department: 'Injection Molding', active: true },
  { id: 'op-02', name: 'S. Verma', code: 'OP-102', role: 'Machine Technician', department: 'Injection Molding', active: true },
  { id: 'op-03', name: 'M. Kumar', code: 'OP-103', role: 'Lead Press Operator', department: 'Injection Molding', active: true },
  { id: 'op-04', name: 'K. Patel', code: 'OP-104', role: 'Molding Operator', department: 'Injection Molding', active: true },
  { id: 'op-05', name: 'P. Singh', code: 'OP-105', role: 'Shift Lead Operator', department: 'Injection Molding', active: true },
  { id: 'op-06', name: 'A. Joshi', code: 'OP-106', role: 'Tool Setter & Operator', department: 'Injection Molding', active: true },
  { id: 'op-07', name: 'D. Rao', code: 'OP-107', role: 'Press Operator', department: 'Injection Molding', active: true },
  { id: 'op-08', name: 'R. Kumar', code: 'OP-108', role: 'Setup & Press Operator', department: 'Injection Molding', active: true },
  { id: 'op-09', name: 'S. Nair', code: 'OP-109', role: 'Injection Tech', department: 'Injection Molding', active: true },
  { id: 'op-10', name: 'A. Sharma', code: 'OP-110', role: 'Molding Specialist', department: 'Injection Molding', active: true },
  { id: 'op-11', name: 'K. Iyer', code: 'OP-111', role: 'Senior Operator', department: 'Injection Molding', active: true },
  { id: 'op-12', name: 'Mahesh B', code: 'OP-112', role: 'Shift Operator', department: 'Injection Molding', active: true },
  { id: 'op-13', name: 'Manoj Kumar', code: 'OP-113', role: 'Material & Press Operator', department: 'Injection Molding', active: true },
  { id: 'op-14', name: 'G. Sundaram', code: 'OP-114', role: 'Operator / QA Inspector', department: 'Injection Molding', active: true },
  { id: 'op-15', name: 'V. Natarajan', code: 'OP-115', role: 'Lead Technician', department: 'Injection Molding', active: true },
];

class OperatorMasterService {
  private operators: OperatorRecord[] = [...DEFAULT_OPERATORS];
  private listeners: Array<() => void> = [];

  constructor() {
    try {
      const saved = localStorage.getItem('reboot_operator_master');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.operators = parsed;
        }
      }
    } catch {
      // fallback in-memory
    }
  }

  public getOperators(): OperatorRecord[] {
    return [...this.operators];
  }

  public getOperatorNames(): string[] {
    return this.operators.map((o) => o.name);
  }

  public addOperator(name: string, role: string = 'Press Operator', department: string = 'Injection Molding'): OperatorRecord {
    const trimmed = name.trim();
    const existing = this.operators.find((o) => o.name.toLowerCase() === trimmed.toLowerCase());
    if (existing) {
      return existing;
    }

    const nextId = `op-${Date.now()}`;
    const nextCode = `OP-${100 + this.operators.length + 1}`;
    const newRecord: OperatorRecord = {
      id: nextId,
      name: trimmed,
      code: nextCode,
      role,
      department,
      active: true,
    };

    this.operators.push(newRecord);
    this.save();
    this.notify();
    return newRecord;
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private save() {
    try {
      localStorage.setItem('reboot_operator_master', JSON.stringify(this.operators));
    } catch {
      // silent
    }
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }
}

export const operatorMasterService = new OperatorMasterService();
