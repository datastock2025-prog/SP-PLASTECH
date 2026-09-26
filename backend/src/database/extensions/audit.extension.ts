import { Prisma } from '@prisma/client';
import { getRequestContext } from '../tenant-context';

/**
 * Prisma Client Extension: Enterprise Audit & Version Snapshots
 * Automatically captures changes on mutating operations (create, update, delete)
 * and records oldData / newData into the immutable AuditLog and EntityVersion tables.
 */
export const auditExtension = Prisma.defineExtension((client) => {
  return client.$extends({
    name: 'AuditAndVersioningExtension',
    query: {
      $allModels: {
        async create({ model, args, query }) {
          const context = getRequestContext();
          const tenantId = context?.tenantId || (args.data as any)?.tenantId || 'SP-PLASTECH-DEFAULT';
          const userId = context?.userId;

          // Inject tenantId if not explicitly provided
          if (args.data && typeof args.data === 'object' && !(args.data as any).tenantId) {
            (args.data as any).tenantId = tenantId;
          }

          const result = await query(args);

          // Asynchronously record create audit snapshot
          if (model !== 'AuditLog' && model !== 'EntityVersion') {
            try {
              await (client as any).auditLog.create({
                data: {
                  tenantId,
                  entityName: model,
                  recordId: (result as any)?.id || 'unknown',
                  action: 'CREATE',
                  oldData: Prisma.DbNull,
                  newData: JSON.parse(JSON.stringify(result)),
                  userId: userId || null,
                  ipAddress: context?.ipAddress || null,
                  userAgent: context?.userAgent || null,
                },
              });
            } catch (err) {
              console.warn(`[AuditLog Warning] Failed to log CREATE on ${model}:`, (err as Error).message);
            }
          }

          return result;
        },

        async update({ model, args, query }) {
          const context = getRequestContext();
          const tenantId = context?.tenantId || 'SP-PLASTECH-DEFAULT';
          const userId = context?.userId;

          // Fetch previous state for diff comparison
          let oldData: any = null;
          if (model !== 'AuditLog' && model !== 'EntityVersion') {
            try {
              oldData = await (client as any)[model.toLowerCase()].findUnique({ where: args.where });
            } catch {
              // Ignore fetch error
            }
          }

          const result = await query(args);

          if (model !== 'AuditLog' && model !== 'EntityVersion') {
            try {
              await (client as any).auditLog.create({
                data: {
                  tenantId,
                  entityName: model,
                  recordId: (result as any)?.id || (args.where as any)?.id || 'unknown',
                  action: 'UPDATE',
                  oldData: oldData ? JSON.parse(JSON.stringify(oldData)) : Prisma.DbNull,
                  newData: JSON.parse(JSON.stringify(result)),
                  userId: userId || null,
                  ipAddress: context?.ipAddress || null,
                  userAgent: context?.userAgent || null,
                },
              });
            } catch (err) {
              console.warn(`[AuditLog Warning] Failed to log UPDATE on ${model}:`, (err as Error).message);
            }
          }

          return result;
        },

        async delete({ model, args, query }) {
          const context = getRequestContext();
          const tenantId = context?.tenantId || 'SP-PLASTECH-DEFAULT';
          const userId = context?.userId;

          let oldData: any = null;
          if (model !== 'AuditLog' && model !== 'EntityVersion') {
            try {
              oldData = await (client as any)[model.toLowerCase()].findUnique({ where: args.where });
            } catch {
              // Ignore fetch error
            }
          }

          const result = await query(args);

          if (model !== 'AuditLog' && model !== 'EntityVersion') {
            try {
              await (client as any).auditLog.create({
                data: {
                  tenantId,
                  entityName: model,
                  recordId: (oldData as any)?.id || (args.where as any)?.id || 'unknown',
                  action: 'DELETE',
                  oldData: oldData ? JSON.parse(JSON.stringify(oldData)) : Prisma.DbNull,
                  newData: Prisma.DbNull,
                  userId: userId || null,
                  ipAddress: context?.ipAddress || null,
                  userAgent: context?.userAgent || null,
                },
              });
            } catch (err) {
              console.warn(`[AuditLog Warning] Failed to log DELETE on ${model}:`, (err as Error).message);
            }
          }

          return result;
        },
      },
    },
  });
});
