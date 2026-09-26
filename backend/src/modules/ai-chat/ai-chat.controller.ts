import { Controller, Post, Body, UseGuards, Req, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { ChatChainService } from './langchain/chat-chain.service';
import { DocumentGeneratorService } from './document/document-generator.service';

export interface AiChatQueryDto {
  prompt: string;
  generateDoc?: boolean;
  docType?: 'pdf' | 'xlsx' | 'docx';
}

@Controller('api/v1/ai-chat')
@UseGuards(JwtAuthGuard, TenantGuard)
export class AiChatController {
  private readonly logger = new Logger(AiChatController.name);

  constructor(
    private readonly chatChain: ChatChainService,
    private readonly docGenerator: DocumentGeneratorService,
  ) {}

  @Post('query')
  @HttpCode(HttpStatus.OK)
  async handleQuery(@Body() dto: AiChatQueryDto, @Req() req: any) {
    const tenantId = req.tenantId || req.user?.tenantId;
    const userId = req.user?.id || 'anonymous-user';

    this.logger.log(`AI Query from tenant: ${tenantId}, user: ${userId}, prompt: "${dto.prompt.substring(0, 60)}..."`);

    // 1. Run NL-to-SQL reasoning chain
    const aiResult = await this.chatChain.executeNaturalLanguageQuery(dto.prompt, tenantId);

    // 2. If user requested a document export or the prompt explicitly asks for download
    let documentResult = null;
    const shouldGenerateDoc = dto.generateDoc || /download|export|generate (pdf|excel|report|sheet)/i.test(dto.prompt);

    if (shouldGenerateDoc && aiResult.data && Array.isArray(aiResult.data) && aiResult.data.length > 0) {
      const docType = dto.docType || (/excel|sheet|xlsx/i.test(dto.prompt) ? 'xlsx' : 'pdf');
      const headers = Object.keys(aiResult.data[0]);
      const rows = aiResult.data.map((row) => Object.values(row) as any[]);

      documentResult = await this.docGenerator.generateAndUpload({
        tenantId,
        userId,
        docType,
        title: `AI Report: ${dto.prompt.slice(0, 40)}`,
        headers,
        rows,
      });
    }

    return {
      success: true,
      data: {
        text: aiResult.text,
        sql: aiResult.sql,
        rows: aiResult.data,
        document: documentResult,
      },
      meta: {
        timestamp: new Date().toISOString(),
        tenantId,
      },
    };
  }
}
