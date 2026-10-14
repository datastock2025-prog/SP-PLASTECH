# SP-PLASTECH ERP — Baseline Performance Metrics

**Target Endpoint**: `GET /api/v1/users`  
**Measurement Pre-Condition**: Prior to Cloudflare Hyperdrive and Smart Placement activation.

## Baseline Values
- **Database Round-Trip Count**: 2 roundtrips (1 count query + 1 paginated row query)
- **Local Dev Server DB Latency (p95)**: 12.4 ms
- **Cache-Control**: `no-store, no-cache, must-revalidate`
- **Server-Timing Header**: `db;dur=12.4;desc="queries=2"`
