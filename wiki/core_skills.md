# Core Skills & Workflows

To maintain the high quality and agentic capability of the `forth-worktime` project, the following core skills and workflows are established.

## 1. Engineering Skills
These skills ensure the codebase remains performant, typed, and accessible.

- **Next.js Best Practices**: Leverage the App Router, Server Components, and optimized image/font loading.
- **React Patterns**: Use functional components, hooks, and efficient state management with Zustand.
- **Tailwind & Framer Motion**: Maintain a consistent, high-end design system with smooth animations and responsive layouts.
- **Type Safety**: Use TypeScript interfaces for all data structures (see `src/lib/types.ts`).

## 2. Knowledge Management (Memento-Loop)
The project follows the LLM-Wiki pattern to ensure the agent builds on past insights.

- **Wiki Maintenance**: Every new feature or architectural decision MUST be recorded in the `wiki/` directory.
- **Audit Logs**: Every session's progress MUST be summarized in `wiki/log.md`.
- **Schema Adherence**: Follow the instructions in `AGENTS.md` for consistent interactions.

## 3. Operational Workflows

### TDD & Feature Development
1. **Plan**: Write a task-based plan in `task.md`.
2. **Implement**: Build the feature following clean-code principles.
3. **Verify**: Run `npm run lint` and `npm run build`.
4. **Document**: Update the wiki with the new functionality.

### Code Audit & Maintenance
- **KAIDEN**: Continuous improvement of existing components.
- **Security**: Proactive review of Firebase rules and data sanitization.

---
*Reference: .agent/skills/skills for specific implementation details.*
