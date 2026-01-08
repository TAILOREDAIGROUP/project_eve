---
description: Repository Information Overview
alwaysApply: true
---

# Repository Information Overview

## Repository Summary
**Project EVE** is a proactive AI agent system built with **Next.js**, **Supabase**, and **OpenAI**. It features a "Boot-Up Ritual" for agent initialization, persistent user memory with semantic search (using `pgvector`), proactive triggers, and a learning mechanism from user interactions.

## Repository Structure
The repository follows a multi-project layout, although it primarily contains two variations of the frontend application and a placeholder backend directory.

### Main Repository Components
- **frontend/**: The main Next.js application, featuring the dashboard, chat interface, and agentic logic.
- **project-eve/frontend/**: A variant or more comprehensive version of the frontend with additional test suites and configurations.
- **backend/**: Currently contains only Zencoder and Zenflow workflow configurations.

## Projects

### Frontend (Main)
**Configuration File**: `frontend/package.json`

#### Language & Runtime
- **Language**: TypeScript  
- **Version**: Node.js >=18  
- **Build System**: Next.js CLI  
- **Package Manager**: npm

#### Dependencies
**Main Dependencies**:
- `next`: 16.1.1
- `react`: 19.2.3
- `@supabase/supabase-js`: ^2.89.0
- `ai`: ^3.4.33 (AI SDK)
- `openai`: ^6.15.0
- `langchain`: ^1.2.3
- `lucide-react`: ^0.562.0
- `three`: ^0.182.0 (3D Graph visualization)

**Development Dependencies**:
- `typescript`: ^5
- `tailwindcss`: ^4
- `eslint`: ^9
- `tsx`: ^4.21.0

#### Build & Installation
```bash
cd frontend
npm install
npm run build
```

#### Testing
- **Framework**: Custom test scripts using `tsx`
- **Test Location**: `frontend/scripts/tests/`
- **Naming Convention**: `*-test.ts`
- **Run Command**:
```bash
npm run test:agentic
```

### Project EVE Frontend (Extended)
**Configuration File**: `project-eve/frontend/package.json`

#### Language & Runtime
- **Language**: TypeScript  
- **Version**: Node.js >=18  
- **Build System**: Next.js CLI  
- **Package Manager**: npm

#### Dependencies
Similar to the main frontend, but includes `ts-node` for testing.

#### Build & Installation
```bash
cd project-eve/frontend
npm install
npm run build
```

#### Testing
- **Framework**: Custom test scripts using `tsx`
- **Test Location**: `project-eve/frontend/scripts/tests/` and `project-eve/frontend/scripts/`
- **Naming Convention**: `*-test.ts`
- **Run Command**:
```bash
npm run test:death
npm run test:stress
npm run test:security
npm run test:agentic
```

## Key Resources (Common)
- **Database Schema**: `frontend/lib/db/schema.sql` defines tables for `user_memory`, `conversation_sessions`, `messages`, `agent_state`, `proactive_triggers`, and `review_queue`.
- **Agent Logic**: Located in `frontend/lib/agent/`, specifically the `AgentInitializer` in `initializer.ts` which manages the "Boot-Up Ritual".
- **Memory Service**: `frontend/lib/memory/memory-service.ts` handles persistent context and semantic retrieval.
- **Security**: Rate limiting, logging, and AI monitoring are implemented in `frontend/lib/security/`.
