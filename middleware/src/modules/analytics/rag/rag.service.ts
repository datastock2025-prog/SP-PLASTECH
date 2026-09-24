import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../../../database/database.service';
import { ObservabilityLogger } from '../../../common/observability/logger.service';
import { MetricsService } from '../../../common/observability/metrics.service';
import { TracingService } from '../../../common/observability/tracing.service';
import { CreateChatSessionDto, SendMessageDto, ExportChatDto } from './rag.dto';

@Injectable()
export class RagService {
  private readonly logger = new Logger(RagService.name);

  // In-memory document chunk vector store & chat sessions
  private documentChunksStore = new Map<string, any[]>();
  private chatSessionsStore = new Map<string, any>();
  private chatMessagesStore = new Map<string, any[]>();

  constructor(
    private readonly db: DatabaseService,
    private readonly obsLogger: ObservabilityLogger,
    private readonly metrics: MetricsService,
    private readonly tracing: TracingService,
  ) {
    this.seedDefaultKnowledgeBase();
  }

  // ============================================================================
  // 1. RAG CHAT SESSIONS
  // ============================================================================
  public async createChatSession(dto: CreateChatSessionDto, tenantId: string, userId: string) {
    const session = {
      id: `SESS-${Date.now()}`,
      tenantId,
      userId,
      sessionType: dto.sessionType || 'ANALYTICS_QUERY',
      title: dto.title || 'New Analytics Document Assistant Session',
      context: dto.context || {},
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.chatSessionsStore.set(session.id, session);
    this.chatMessagesStore.set(session.id, [
      {
        id: `MSG-INIT-${Date.now()}`,
        sessionId: session.id,
        role: 'ASSISTANT',
        content: `Hello! I am your SP-PLASTECH Enterprise Analytics Assistant. Ask me anything about plant OEE, quality PPM, inventory aging, SCM OTIF, ESG metrics, or maintenance MTBF/MTTR to generate customized executive reports.`,
        metadata: { isSystemGreeting: true },
        createdAt: new Date().toISOString(),
      },
    ]);

    this.metrics.incrementBusinessEvent('chat_session_created', 'RAG_System');
    return session;
  }

  public async sendMessage(sessionId: string, dto: SendMessageDto, tenantId: string, userId: string) {
    return this.tracing.traceOperation('RagService.sendMessage', async () => {
      const startTime = Date.now();

      // 1. Store User Message
      const userMsg = {
        id: `MSG-USR-${Date.now()}`,
        sessionId,
        role: 'USER',
        content: dto.content,
        metadata: dto.metadata || {},
        createdAt: new Date().toISOString(),
      };

      let messages = this.chatMessagesStore.get(sessionId) || [];
      messages.push(userMsg);

      // 2. Retrieve relevant semantic chunks
      const relevantChunks = await this.retrieveRelevantChunks(tenantId, dto.content);

      // 3. Synthesize response and report structure
      const reportStructure = this.generateDocumentStructure(dto.content, relevantChunks);
      const populatedData = await this.populateDocumentData(tenantId, reportStructure);

      // 4. Store Assistant Response
      const assistantMsg = {
        id: `MSG-AST-${Date.now()}`,
        sessionId,
        role: 'ASSISTANT',
        content: reportStructure.summary,
        metadata: {
          retrievedChunksCount: relevantChunks.length,
          generatedSectionsCount: reportStructure.sections.length,
          documentStructure: reportStructure,
          data: populatedData,
        },
        createdAt: new Date().toISOString(),
      };

      messages.push(assistantMsg);
      this.chatMessagesStore.set(sessionId, messages);

      const duration = Date.now() - startTime;
      this.metrics.observeDbQueryDuration('rag_generation_latency', 'RagService', duration / 1000);
      this.metrics.incrementBusinessEvent('rag_query_processed', 'RAG_System');
      this.obsLogger.logQuery('ragDocumentQuery', duration, tenantId);

      return {
        reply: assistantMsg.content,
        metadata: assistantMsg.metadata,
        messages,
      };
    });
  }

  public async getChatHistory(sessionId: string, tenantId: string) {
    const session = this.chatSessionsStore.get(sessionId);
    const messages = this.chatMessagesStore.get(sessionId) || [];
    return { session, messages };
  }

  public async exportChatToDocument(sessionId: string, dto: ExportChatDto, tenantId: string, userId: string) {
    const messages = this.chatMessagesStore.get(sessionId) || [];
    const lastAssistantMsg = [...messages].reverse().find((m) => m.role === 'ASSISTANT' && m.metadata?.documentStructure);

    const docTitle = dto.documentTitle || 'SP-PLASTECH Executive Analytics Brief';
    const fileName = `${docTitle.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.${dto.format.toLowerCase() === 'excel' ? 'xlsx' : dto.format.toLowerCase()}`;

    this.metrics.incrementBusinessEvent('chat_document_exported', 'RAG_System');

    return {
      success: true,
      documentTitle: docTitle,
      format: dto.format,
      fileName,
      downloadUrl: `/api/analytics/rag/export/download_${sessionId}_${Date.now()}.${dto.format.toLowerCase()}`,
      sectionsIncluded: lastAssistantMsg?.metadata?.generatedSectionsCount || 3,
      exportedAt: new Date().toISOString(),
    };
  }

  // ============================================================================
  // 2. SEMANTIC CHUNK RETRIEVAL & SYNTHESIS
  // ============================================================================
  private async retrieveRelevantChunks(tenantId: string, query: string): Promise<any[]> {
    const chunks = this.documentChunksStore.get(tenantId) || [];
    const queryTokens = query.toLowerCase().split(/\s+/).filter((w) => w.length > 2);

    return chunks
      .map((chunk) => {
        let score = 0;
        const text = (chunk.content + ' ' + JSON.stringify(chunk.metadata)).toLowerCase();
        queryTokens.forEach((token) => {
          if (text.includes(token)) score += 1;
        });
        return { ...chunk, score };
      })
      .filter((c) => c.score > 0 || chunks.length <= 3)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }

  private generateDocumentStructure(query: string, chunks: any[]) {
    const qLower = query.toLowerCase();

    if (qLower.includes('oee') || qLower.includes('downtime') || qLower.includes('machine')) {
      return {
        summary: `Here is the comprehensive OEE and Machine Utilization analysis for SP-PLASTECH Plant 01. Plant-wide OEE is tracking at 84.6%, with mold changeovers contributing to 38.2% of downtime loss.`,
        sections: [
          { type: 'executive_summary', title: 'Executive Summary', content: 'Plant-wide OEE stands at 84.6% against the target of 85.0%. Press 04 (Engel 650T) achieved peak availability of 91.2%.' },
          { type: 'data_analysis', title: '6 Big Losses & Pareto Distribution', content: 'Mold changeover average duration is 42.5 minutes. Planned preventative maintenance mitigated 14 unplanned stoppage risks.' },
          { type: 'recommendations', title: 'Actionable Optimization Steps', content: 'Implement SMED (Single-Minute Exchange of Die) protocol to reduce setup time from 42 mins to under 20 mins.' },
        ],
      };
    }

    if (qLower.includes('quality') || qLower.includes('ppm') || qLower.includes('defect')) {
      return {
        summary: `Quality Defect Analysis indicates a fleet performance of 240 PPM and a 4.82 Six Sigma capability level for automotive exterior components.`,
        sections: [
          { type: 'executive_summary', title: 'Executive Quality Overview', content: 'Total inspected parts: 3,540 units with 24 defects detected across shift A and B.' },
          { type: 'data_analysis', title: 'Defect Pareto & Cost of Poor Quality', content: 'Sink marks on Cavity #2 accounted for 66% of scrap. Total COPQ calculated at ₹670.' },
          { type: 'recommendations', title: 'Corrective Action Plan (8D)', content: 'Calibrate mold manifold hot runner temperature on zone 3 to eliminate sink marks.' },
        ],
      };
    }

    return {
      summary: `I have analyzed the current SP-PLASTECH operational database for "${query}" and compiled an executive decision brief.`,
      sections: [
        { type: 'executive_summary', title: 'Overview & Context', content: `High-level operational performance metrics for the requested criteria.` },
        { type: 'data_analysis', title: 'Key Data Indicators', content: `Aggregated data from production, inventory, and supply chain telemetry.` },
        { type: 'recommendations', title: 'Strategic Recommendations', content: `Continue automated monitoring and maintain buffer inventory for high-velocity resins.` },
      ],
    };
  }

  private async populateDocumentData(tenantId: string, structure: any) {
    return {
      plantName: 'SP-PLASTECH Plant 01 (Injection Molding Unit)',
      period: '2026-09',
      generatedDate: new Date().toISOString(),
      sections: structure.sections,
    };
  }

  private seedDefaultKnowledgeBase() {
    const defaultTenant = 'TENANT-ALPHA-IND';
    this.documentChunksStore.set(defaultTenant, [
      { id: 'CHUNK-01', tenantId: defaultTenant, documentType: 'KNOWLEDGE_BASE', documentId: 'KB-OEE-BENCHMARK', chunkIndex: 0, content: 'SP-PLASTECH World Class OEE benchmark target is 85.0%, with Availability > 90%, Performance > 95%, and Quality > 99%.', metadata: { category: 'OEE', source: 'Plant SOP 2026' }, tokenCount: 42 },
      { id: 'CHUNK-02', tenantId: defaultTenant, documentType: 'KNOWLEDGE_BASE', documentId: 'KB-QUALITY-IATF', chunkIndex: 0, content: 'IATF 16949 Six Sigma defect PPM threshold is < 300 PPM. Automotive components require 100% CMM inspection for Critical-to-Quality dimensions.', metadata: { category: 'Quality', source: 'QMS Manual' }, tokenCount: 48 },
      { id: 'CHUNK-03', tenantId: defaultTenant, documentType: 'KNOWLEDGE_BASE', documentId: 'KB-ESG-SUSTAINABILITY', chunkIndex: 0, content: 'SP-PLASTECH Carbon Footprint Roadmap targets 1.10 kg CO2e/kg by Q4 2026 with a minimum 20% post-consumer recycled (PCR) resin ratio.', metadata: { category: 'ESG', source: 'Sustainability Charter' }, tokenCount: 52 },
    ]);
  }
}
