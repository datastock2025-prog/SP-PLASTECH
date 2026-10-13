import type { PoolClient } from 'pg';
import { AppError } from '../../core/middleware.js';
import {
  findEmployeeById,
  listEmployees,
  listAttendanceByDate,
  listShiftRosters,
} from './repo.js';

export class HrService {
  public async getEmployee(c: PoolClient, id: string) {
    const emp = await findEmployeeById(c, id);
    if (!emp) throw new AppError(404, 'NOT_FOUND', `Employee ${id} not found`);
    return emp;
  }

  public async getEmployees(c: PoolClient, limit = 50, offset = 0) {
    return await listEmployees(c, limit, offset);
  }

  public async getAttendance(c: PoolClient, date: string) {
    return await listAttendanceByDate(c, date);
  }

  public async getShiftRosters(c: PoolClient, limit = 100, offset = 0) {
    return await listShiftRosters(c, limit, offset);
  }
}

export const hrService = new HrService();
