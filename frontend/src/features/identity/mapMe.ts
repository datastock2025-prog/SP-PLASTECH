import type { AuthUser } from '../../types';
import type { Me } from './types';

const ADMIN_ROLES = new Set(['SUPER_ADMIN', 'USER_ADMIN']);
const COLORS = ['#0F8B8D', '#14213D', '#7C3AED', '#B45309', '#0369A1', '#BE123C'];

export const SHIFT_OPTIONS = ['General', 'Shift A', 'Shift B', 'Shift C'] as const;

const initialsOf = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]!.toUpperCase()).join('') || '?';

/** Maps the server-authoritative /me payload onto the legacy AuthUser shape used by the shell. */
export function mapMeToAuthUser(me: Me): AuthUser {
  const plant = me.plants.find((p) => p.id === me.activePlantId);
  const isAdmin = ADMIN_ROLES.has(me.roleCode);
  const rules = me.abilityRules.flatMap((r) => {
    if (r.inverted) return [];
    const actions = Array.isArray(r.action) ? r.action : [r.action];
    const subjects = Array.isArray(r.subject) ? r.subject : [r.subject];
    return actions.flatMap((a) => subjects.map((s) => `${a}:${s}`));
  });
  return {
    id: me.id,
    name: me.fullName,
    fullName: me.fullName,
    email: me.email,
    role: me.roleName,
    roleType: isAdmin ? 'admin' : 'operator',
    department: me.department ?? '',
    plantId: me.activePlantId ?? '',
    plantName: plant?.name ?? '',
    shift: me.activeShift ?? '',
    badgeId: me.badgeId ?? '',
    pin: '',
    avatarColor: COLORS[me.fullName.length % COLORS.length]!,
    initials: initialsOf(me.fullName),
    permissions: rules,
  };
}
