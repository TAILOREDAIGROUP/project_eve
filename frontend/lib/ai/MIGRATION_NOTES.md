# AI SDK Migration Notes (v3 to v4+)

## Background
The 'ai' package is being upgraded from 3.4.33 to ^4.0.0 to address security vulnerabilities and enable new embedding APIs for RAG implementation.

## Files Using AI SDK (to be verified)
- `frontend/app/api/chat/route.ts`
- `frontend/lib/security/ai-monitor.ts`
- `frontend/lib/agent/self-reflection.ts`
- `frontend/lib/agent/proactive-engine.ts`
- `frontend/lib/agent/multi-agent.ts`
- `frontend/lib/agent/knowledge-graph.ts`
- `frontend/lib/agent/goal-manager.ts`
- `frontend/lib/agent/continuous-learning.ts`
- `frontend/lib/agent/engagement-levels.ts`
- `frontend/lib/agent/initializer.ts`
- `frontend/lib/agent/review.ts`

## Key Changes in v4
- Standardized provider imports.
- `streamText` and `generateText` remain largely compatible but check for updated types.
- Introduction of `embed` and `embedMany` for server-side embeddings.

## Migration Steps
1. Update `package.json` to `ai@^4.0.0` and `@ai-sdk/openai@latest`.
2. Update `frontend/app/api/chat/route.ts` to ensure compatibility.
3. Implement `frontend/lib/ai/embeddings.ts`.
4. Run build to catch type errors.

## Update (2026-01-10)
- AI SDK upgrade to v4.0.0 successful.
- Enountered issues with `@ai-sdk/openai` correctly routing `baseURL` for embeddings via OpenRouter.
- **Resolution**: Implemented `frontend/lib/ai/embeddings.ts` using the direct `openai` SDK for robust OpenRouter support.
- Verified embedding generation with `frontend/scripts/test-ai-sdk.ts`.
- `npm run build` passed.
