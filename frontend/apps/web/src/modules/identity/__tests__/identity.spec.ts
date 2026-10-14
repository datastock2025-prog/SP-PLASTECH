import { describe, it, expect } from 'vitest';
import { PlantSchema, RoleSchema, ManagedUserSchema, MeSchema } from '../model/types';
import { mapMeToAuthUser } from '../api/mapMe';

describe('Identity Module Contract & Mappers', () => {
  it('validates PlantSchema successfully', () => {
    const validPlant = {
      id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      code: 'PLANT-1',
      name: 'Main Extrusion Plant',
      location: 'Ahmedabad GIDC',
      isActive: true,
      version: 1,
    };
    const result = PlantSchema.safeParse(validPlant);
    expect(result.success).toBe(true);
  });

  it('validates ManagedUserSchema successfully', () => {
    const validUser = {
      id: 'usr-1',
      username: 'jdoe',
      email: 'jdoe@spplastech.com',
      fullName: 'John Doe',
      phone: '+919876543210',
      badgeId: 'EMP-001',
      department: 'Production',
      designation: 'Floor Supervisor',
      assignedShift: 'Shift A',
      status: 'ACTIVE',
      mustChangePassword: false,
      lastLoginAt: '2026-10-12T10:00:00Z',
      version: 1,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
      roleId: 'role-1',
      roleCode: 'PLANT_SUPERVISOR',
      roleName: 'Plant Supervisor',
      plantIds: ['a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'],
    };
    const result = ManagedUserSchema.safeParse(validUser);
    expect(result.success).toBe(true);
  });

  it('correctly maps Me payload onto legacy AuthUser format', () => {
    const mePayload = {
      id: 'usr-admin-1',
      username: 'admin',
      email: 'admin@spplastech.com',
      fullName: 'System Administrator',
      phone: null,
      badgeId: 'ADMIN-01',
      department: 'IT',
      designation: 'Chief Admin',
      assignedShift: 'General',
      status: 'ACTIVE' as const,
      mustChangePassword: false,
      lastLoginAt: '2026-10-12T08:00:00Z',
      version: 2,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-10-12T08:00:00Z',
      roleId: 'role-super',
      roleCode: 'SUPER_ADMIN',
      roleName: 'Super Admin',
      plantIds: ['plant-1'],
      plants: [
        {
          id: 'plant-1',
          code: 'PLANT-1',
          name: 'Main Extrusion Plant',
          location: 'Ahmedabad',
          isActive: true,
          version: 1,
        },
      ],
      activePlantId: 'plant-1',
      activeShift: 'General',
      abilityRules: [
        { action: 'manage', subject: 'all' },
      ],
    };

    const authUser = mapMeToAuthUser(mePayload);
    expect(authUser.id).toBe('usr-admin-1');
    expect(authUser.roleType).toBe('admin');
    expect(authUser.plantName).toBe('Main Extrusion Plant');
    expect(authUser.permissions).toContain('manage:all');
  });
});
