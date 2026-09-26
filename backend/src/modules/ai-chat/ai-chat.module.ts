import { Module } from '@nestjs/common';
import { AiChatController } from './ai-chat.controller';
import { ChatChainService } from './langchain/chat-chain.service';
import { McpServerService } from './mcp/mcp-server.service';
import { DocumentGeneratorService } from './document/document-generator.service';

@Module({
  controllers: [AiChatController],
  providers: [ChatChainService, McpServerService, DocumentGeneratorService],
  exports: [ChatChainService, McpServerService, DocumentGeneratorService],
})
export class AiChatModule {}
