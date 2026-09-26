import { Injectable, Logger } from '@nestjs/common';
import { McpServerService } from '../mcp/mcp-server.service';

export interface ChatResponse {
  answer: string;
  generatedSql?: string;
  data?: any[];
}

@Injectable()
export class ChatChainService {
  private readonly logger = new Logger(ChatChainService.name);

  constructor(private readonly mcpServer: McpServerService) {}

  /**
   * Translates natural language questions into safe, tenant-isolated SQL queries
   */
  public async processNaturalLanguageQuery(
    message: string,
    tenantId: string,
    userId: string = 'USER'
  ): Promise<ChatResponse> {
    this.logger.log(`Processing AI request for Tenant: ${tenantId} | Prompt: "${message}"`);

    // System prompt definition adhering to strict architectural rules
    const systemPrompt = `
You are the SP-PLASTECH Enterprise Database AI Assistant.
Rules:
1. You only generate PostgreSQL SELECT queries.
2. CRITICAL: You MUST ALWAYS append "WHERE tenant_id = '${tenantId}'" or "AND tenant_id = '${tenantId}'" to all table references.
3. You NEVER generate UPDATE, DELETE, INSERT, DROP, ALTER, or schema changes.
4. If the user asks about an unknown table, query information_schema or return a helpful error.
    `.trim();

    // Heuristic SQL generation based on natural language keywords
    let generatedSql = '';
    const lower = message.toLowerCase();

    if (lower.includes('customer') || lower.includes('client')) {
      generatedSql = `SELECT code, name, customer_type, tier, credit_limit, status FROM "Customer" WHERE tenant_id = '${tenantId}' ORDER BY name ASC LIMIT 50;`;
    } else if (lower.includes('item') || lower.includes('stock') || lower.includes('inventory') || lower.includes('resin')) {
      generatedSql = `SELECT code, name, category, stock, unit, cost, selling_price FROM "Item" WHERE tenant_id = '${tenantId}' ORDER BY stock DESC LIMIT 50;`;
    } else if (lower.includes('supplier') || lower.includes('vendor')) {
      generatedSql = `SELECT code, name, category, rating, payment_terms FROM "Supplier" WHERE tenant_id = '${tenantId}' ORDER BY rating DESC LIMIT 50;`;
    } else if (lower.includes('machine') || lower.includes('oee')) {
      generatedSql = `SELECT machine_code, name, machine_type, tonnage, status, oee_percentage FROM "Machine" WHERE tenant_id = '${tenantId}' ORDER BY oee_percentage DESC;`;
    } else if (lower.includes('order') || lower.includes('work order')) {
      generatedSql = `SELECT wo_number, item_code, item_name, target_quantity, produced_quantity, status FROM "WorkOrder" WHERE tenant_id = '${tenantId}' LIMIT 50;`;
    } else {
      generatedSql = `SELECT count(*) as total_items FROM "Item" WHERE tenant_id = '${tenantId}';`;
    }

    // Execute via safe MCP gateway
    const data = await this.mcpServer.queryDatabase(generatedSql, tenantId, userId);

    return {
      answer: `Retrieved ${data.length} records from SP-PLASTECH ERP database for "${message}".`,
      generatedSql,
      data,
    };
  }
}
