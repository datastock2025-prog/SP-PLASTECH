# SP-PLASTECH ERP — Cloudflare Rate Limiting Specification

## Rule Definition
For Cloudflare edge deployment:
- **Expression**: `(http.request.uri.path matches "^/api/")`
- **Rate**: 300 requests per 1 minute (60 seconds) per client IP (`cf.connecting_ip`)
- **Action**: Block (HTTP 429)
- **Response**: Custom JSON
  ```json
  {
    "error": {
      "code": "RATE_LIMITED",
      "message": "Too many requests. Please slow down."
    }
  }
  ```
- **Local Fallback**: Handled in `middleware/src/app.ts` using sliding window counter.
