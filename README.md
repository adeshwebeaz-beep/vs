# AutoFlowAI

AI-powered business automation SaaS platform with a visual workflow builder, event-driven execution engine, and GPT-powered copilot.

## Monorepo structure

- `apps/api`: Fastify + BullMQ backend API and workflow execution worker.
- `apps/web`: React + React Flow workflow builder UI.
- `prisma`: PostgreSQL schema for workflows, executions, OAuth connections, and webhook endpoints.
- `docs/openapi.yaml`: OpenAPI 3.1 API contract.
- `packages/contracts`: Shared JSON schemas.

## Implemented core capabilities

### Workflow engine

1. Workflows are saved as JSON in PostgreSQL (`Workflow.definitionJson`).
2. Trigger routes enqueue jobs to BullMQ (`workflow-execution` queue).
3. Worker evaluates workflow conditions.
4. Actions run sequentially.
5. Each execution writes logs and status to `WorkflowExecution`.
6. Retries use BullMQ exponential backoff with 3 attempts.
7. Failed final attempts are marked and ready for notification hooks.
8. Execution duration/status data is persisted for analytics.

### Integrations

- Pluggable integration interface: `validate(config)`, `trigger(config)`, `execute(config, inputs)`.
- Rate limiter helper per integration provider.
- OAuth tokens modeled as encrypted fields in PostgreSQL.
- Webhook endpoint table enables unique URL slugs per workflow.

### Security

- AES-256-GCM encryption utility for API keys and OAuth tokens.
- HMAC-SHA256 webhook signature verification + replay window enforcement.
- Global API rate limiting (100 req/min/user via Fastify plugin).
- Prisma ORM usage for parameterized DB queries.
- Request sanitization middleware for basic XSS hardening.

### AI copilot

- `/api/v1/copilot/generate-workflow` accepts natural language prompt + trigger/action catalog.
- OpenAI structured JSON output returns workflow definition.
- Frontend renders generated workflow on React Flow canvas.

### Frontend

- Mobile-responsive layout and dark mode-compatible classes.
- React Flow drag-and-drop-ready canvas.
- Live execution logs over WebSocket.
- Toast feedback with `sonner`.
- Skeleton loading states during API calls.
- Error boundary wrapper for graceful failures.

## Quick start

```bash
npm install
cp .env.example .env
npm run dev
```

## Environment variables

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/autoflowai
REDIS_URL=redis://localhost:6379
OPENAI_API_KEY=sk-...
ENCRYPTION_KEY=change-me-to-a-32+character-secret
WEBHOOK_SIGNING_SECRET=change-me
PORT=4000
NODE_ENV=development
```

## API docs

Open `docs/openapi.yaml` for REST endpoint contract.
