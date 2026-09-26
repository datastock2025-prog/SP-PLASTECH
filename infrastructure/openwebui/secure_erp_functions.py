"""
title: SP-PLASTECH Secure ERP & Sidecar Integration Functions
author: SP-PLASTECH Principal Architect
version: 1.0.0
license: MIT
description: Custom Open WebUI Functions for secure user context propagation, read-only ERP querying, and n8n workflow triggers.
"""

import json
import os
import urllib.request
import urllib.error
from typing import Dict, Any, Optional

class EventEmitter:
    def __init__(self, event_emitter: Any = None):
        self.event_emitter = event_emitter

    async def emit_status(self, description: str, done: bool = False):
        if self.event_emitter:
            await self.event_emitter(
                {
                    "type": "status",
                    "data": {"description": description, "done": done},
                }
            )

class Tools:
    def __init__(self):
        self.gateway_url = os.getenv("NESTJS_GATEWAY_URL", "http://backend:3000/api/ai-gateway")
        self.default_tenant_id = os.getenv("DEFAULT_TENANT_ID", "TENANT-ALPHA-IND")

    async def secure_erp_query(
        self,
        prompt: str,
        __user__: Optional[Dict[str, Any]] = None,
        __event_emitter__: Optional[Any] = None,
    ) -> str:
        """
        Securely query SP-PLASTECH ERP database using natural language.
        Enforces Row-Level Security, tenant boundary, and read-only AST verification.

        :param prompt: The natural language question (e.g., 'What is our OEE for IMM Bay 1 this week?' or 'List top 5 open work orders')
        :return: Natural language answer and formatted tabular analysis from ERP.
        """
        emitter = EventEmitter(__event_emitter__)
        await emitter.emit_status("Propagating user context to SP-PLASTECH Core...", done=False)

        # 1. Extract User Context and Tenant ID
        token = __user__.get("token") if __user__ else ""
        tenant_id = __user__.get("tenant_id", self.default_tenant_id) if __user__ else self.default_tenant_id
        user_email = __user__.get("email", "anonymous@sp-plastech.com") if __user__ else "anonymous"

        # 2. Build Request Payload
        payload = json.dumps({"prompt": prompt}).encode("utf-8")
        req = urllib.request.Request(
            f"{self.gateway_url}/query",
            data=payload,
            headers={
                "Content-Type": "application/json",
                "X-Tenant-ID": tenant_id,
                "Authorization": f"Bearer {token}" if token else "",
                "X-Correlation-ID": f"owui-{tenant_id}",
            },
            method="POST",
        )

        try:
            await emitter.emit_status("Executing AST-safe query against ERP engine...", done=False)
            with urllib.request.urlopen(req, timeout=30) as response:
                res_data = json.loads(response.read().decode("utf-8"))
                await emitter.emit_status("Query completed safely.", done=True)
                
                reply = res_data.get("reply", "No data returned.")
                sql = res_data.get("sql", "")
                rows = res_data.get("data", [])

                formatted = f"{reply}\n\n"
                if sql:
                    formatted += f"```sql\n-- Verified Tenant-Scoped SQL:\n{sql}\n```\n\n"
                
                return formatted
        except urllib.error.HTTPError as e:
            await emitter.emit_status(f"Error: HTTP {e.code}", done=True)
            return f"❌ **ERP Access Error ({e.code})**: Access denied or query rejected by security filter."
        except Exception as e:
            await emitter.emit_status("Connection failed", done=True)
            return f"❌ **System Error**: Could not reach ERP AI Gateway ({str(e)})."

    async def trigger_external_workflow(
        self,
        workflow_name: str,
        payload_json: str,
        __user__: Optional[Dict[str, Any]] = None,
        __event_emitter__: Optional[Any] = None,
    ) -> str:
        """
        Trigger an automated n8n integration workflow (e.g. Google Sheet sync, Slack notification, Email report).

        :param workflow_name: Name of workflow ('send_production_alert', 'sync_notion_inventory', 'email_oee_digest')
        :param payload_json: JSON string of parameters to pass to the workflow
        :return: Execution status message
        """
        emitter = EventEmitter(__event_emitter__)
        await emitter.emit_status(f"Securing dispatch for workflow: {workflow_name}...", done=False)

        tenant_id = __user__.get("tenant_id", self.default_tenant_id) if __user__ else self.default_tenant_id

        try:
            parsed_payload = json.loads(payload_json) if isinstance(payload_json, str) else payload_json
        except Exception:
            parsed_payload = {"raw": payload_json}

        req_body = json.dumps({
            "workflowName": workflow_name,
            "payload": parsed_payload,
        }).encode("utf-8")

        req = urllib.request.Request(
            f"{self.gateway_url}/n8n-trigger",
            data=req_body,
            headers={
                "Content-Type": "application/json",
                "X-Tenant-ID": tenant_id,
            },
            method="POST",
        )

        try:
            with urllib.request.urlopen(req, timeout=15) as response:
                res_data = json.loads(response.read().decode("utf-8"))
                await emitter.emit_status("Workflow dispatched successfully.", done=True)
                return f"✅ **Workflow Dispatched**: `{workflow_name}` has been triggered asynchronously."
        except Exception as e:
            await emitter.emit_status("Workflow failed", done=True)
            return f"⚠️ **Workflow Notice**: {str(e)}"
