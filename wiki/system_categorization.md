# System Categorization & Architecture

This document categorizes the functional components of the broader ecosystem (`ProjectFlow` / `MemOS`) and their relationship to the `forth-worktime` project.

## Ecosystem Architecture

The project is integrated into a multi-layered agentic framework designed for persistent knowledge and utility consolidation.

### 1. Agent Frameworks (`agent-frameworks/`)
Core logical engines and memory systems.
- **MemOS**: The underlying "Memory Operating System" providing persistent context.
- **FossFLOW**: Framework for open-source workflow orchestration.
- **GitNexus**: Integration layer for Git-based collaboration.
- **Memento-Skills**: A library of reusable agent capabilities (e.g., `nextjs-best-practices`).

### 2. MCP Servers (`mcp-servers/`)
Specialized Model Context Protocol servers providing external tool access.
- **drawio-mcp**: Visualization and diagramming tools.
- **sentry**: Error monitoring and reporting.
- **firebase-mcp**: Backend service interactions (Auth/Firestore).

### 3. Utilities (`utilities/`)
Atomic applications and helper scripts.
- **forth-worktime**: (This project) Time-tracking and PDF report parsing.
- **merge-pdf-files**: Unified utility for PDF concatenation.
- **convert-pdf-to-jpg**: Image extraction from documents.
- **rbac-manager**: Role-based access control logic.

## Functional Utility Mapping

| Component | Category | Purpose |
| :--- | :--- | :--- |
| `src/lib/parser.ts` | Business Logic | Core PDF text extraction and normalization. |
| `src/lib/store.ts` | State Mgmt | Centralized reactive state for UI components. |
| `wiki/` | Knowledge | Persistent compounding knowledge base (LLM-Wiki). |
| `.agent/skills/` | Skill Set | Pre-defined operational procedures for the agent. |
| `AGENTS.md` | Schema | Governance and workflow definitions. |

## Consolidation Status

The audit of the 32 newly added items (from past sessions) has resulted in:
- **Consolidated**: Redundant PDF frameworks merged into `utilities/merge-pdf-files`.
- **Formalized**: High-value skills extracted to `.agent/skills`.
- **Documented**: Core logic indexed in the `wiki/`.

## Related Pages
- [Project Overview](./project_overview.md)
- [Core Skills](./core_skills.md)
