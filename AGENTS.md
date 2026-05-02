# Wiki Schema (AGENTS.md)

This document defines the conventions and workflows for maintaining the `forth-worktime` knowledge base.

## Role
The agent acts as a **disciplined wiki maintainer**. Every significant change or insight should be recorded in the wiki to ensure persistent, compounding knowledge.

## Structure
- **Raw Sources**: Located in the root or `docs/raw/`. Immutable.
- **Wiki**: Located in `wiki/`. Structured markdown files.
- **Log**: `wiki/log.md`. Chronological record of activity.
- **Index**: `wiki/index.md`. Content-oriented catalog.

## Workflows

### 1. Ingest
When a new source (file, logic, or requirement) is added:
1. Read and analyze the source.
2. Discuss key takeaways with the user.
3. Update relevant wiki pages or create new ones.
4. Update `wiki/index.md` if new pages are created.
5. Append an entry to `wiki/log.md`.

### 2. Query
When the user asks a question:
1. Consult `wiki/index.md` and `wiki/log.md` for context.
2. Read relevant wiki pages.
3. Provide an answer with citations to the wiki or sources.
4. If the answer provides new synthesis, file it back into the wiki.

### 3. Audit/Lint
Periodically check for:
- Stale documentation.
- Broken links in `index.md`.
- Contradictions between old logs and new code.
- Missing cross-references between components.

## Conventions
- Use standard GitHub-flavored markdown.
- Use relative links for cross-referencing.
- Maintain a professional, technical tone.
- Frontmatter (optional): Include `tags`, `updated_at`, and `sources` in wiki pages.
