import { Injectable, Logger } from '@nestjs/common';

export interface SearchResultItem {
  id: string;
  type: 'ITEM' | 'CUSTOMER' | 'SUPPLIER' | 'INVOICE' | 'WORK_ORDER';
  title: string;
  subtitle: string;
  tenantId: string;
  metadata?: Record<string, any>;
  score?: number;
}

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);
  private readonly meiliHost: string;
  private readonly meiliApiKey: string;

  constructor() {
    this.meiliHost = process.env.MEILISEARCH_HOST || 'http://localhost:7700';
    this.meiliApiKey = process.env.MEILISEARCH_KEY || 'masterKey';
  }

  // Local index cache for instant searches
  private readonly mockSearchIndex: SearchResultItem[] = [];

  /**
   * Index or update a document in the search index
   */
  async indexDocument(item: SearchResultItem): Promise<void> {
    const idx = this.mockSearchIndex.findIndex((doc) => doc.id === item.id && doc.tenantId === item.tenantId);
    if (idx !== -1) {
      this.mockSearchIndex[idx] = item;
    } else {
      this.mockSearchIndex.push(item);
    }
  }

  /**
   * Search unified entities scoped to tenant
   */
  async search(query: string, tenantId: string, limit: number = 20): Promise<SearchResultItem[]> {
    const cleanQuery = query.toLowerCase().trim();
    if (!cleanQuery) return [];

    return this.mockSearchIndex
      .filter((item) => item.tenantId === tenantId)
      .filter(
        (item) =>
          item.title.toLowerCase().includes(cleanQuery) ||
          item.subtitle.toLowerCase().includes(cleanQuery) ||
          item.id.toLowerCase().includes(cleanQuery),
      )
      .slice(0, limit);
  }
}
