// Item Master column projection (SSOT): every items column except the soft-delete marker.
// The DB already holds all tables/indexes; no schema changes are made here.
import { getTableColumns } from 'drizzle-orm';
import { items } from './erp.js';

const { deletedAt: _deletedAt, ...itemColumns } = getTableColumns(items);

export const ITEM_SELECT_COLUMNS = itemColumns;
