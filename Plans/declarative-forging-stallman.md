# Plan: First-Class Template Editor Page

## Context
The current template editing is an inline form on the EmailTemplates list page — a textarea for HTML with no preview. The user's partner (non-technical) needs a better editing experience. We previously tried WYSIWYG editors (maily-to, GrapeJS, Unlayer) but all had significant issues. For now, we're building an improved code editor with a live preview pane side-by-side, as a dedicated page.

## What We're Building
A dedicated `/templates/:id` editor page with:
- **Left pane**: HTML code editor (textarea with monospace font) + plain text fallback field
- **Right pane**: Live iframe preview rendering the HTML with sample customer variables
- **Top bar**: Back button, template name input, collapsible preview toggle, save button
- **Variable bar**: Clickable chips that insert `{{customer.firstName}}` etc. at cursor position in the textarea
- Preview pane is collapsible via toggle button
- New templates via `/templates/new`

## Files to Modify

### 1. `src/pages/TemplateEditor.tsx` — REWRITE
Currently has GrapeJS imports (packages not installed). Rewrite as a clean component:
- No external editor packages — just textarea + iframe preview
- Fetch template by GUID on load, or blank for `/templates/new`
- Iframe-based preview using `renderTemplate()` from `templateUtils.ts`
- Variable chips insert at textarea cursor position
- Save via POST (new) or PUT (existing) to `/api/emailtemplates`
- Uses existing: `useAuth`, `API_URL`, `renderTemplate`, `customerToVars`, `availableVars`, `sampleCustomer`, `EmailTemplate`

### 2. `src/pages/TemplateEditor.css` — REWRITE
Currently has GrapeJS-specific styles. Rewrite for:
- Full-height split pane layout (editor left, preview right at 420px)
- Dark theme matching existing app (`#0f0f23`, `#1a1a2e`, `#4fc3f7`, `#333`)
- Top bar, variable bar, code textarea, preview iframe styles
- Collapsible preview pane (editor takes full width when hidden)

### 3. `src/App.tsx` — ADD ROUTE
Add: `<Route path="/templates/:id" element={<TemplateEditor />} />`
Add import for TemplateEditor

### 4. `src/pages/EmailTemplates.tsx` — UPDATE EDIT FLOW
- Change Edit button to navigate to `/templates/:guid` instead of inline form
- Change Add button to navigate to `/templates/new`
- Remove inline form (`showForm`, `form`, `editingId`, `handleSubmit`, `startEdit`, `cancelForm` state/functions)
- Keep: template list table, delete, preview modal

### 5. `src/pages/EmailTemplates.css` — CLEANUP
- Remove `.template-form`, `.form-fields`, `.field`, `.variable-hint` styles (inline form removed)
- Keep: table, preview modal, header, button styles

## No packages to install
Pure HTML textarea + iframe preview. Zero new dependencies.

## Verification
1. `npx tsc --noEmit` — clean compile
2. `npx vite build` — build succeeds
3. Navigate to `/templates` — list shows, Edit navigates to `/templates/:guid`, Add navigates to `/templates/new`
4. On editor page: template name loads, HTML textarea shows content, preview iframe renders with sample variables
5. Click variable chip — inserts at cursor in textarea
6. Edit HTML — preview updates in real-time
7. Save — API call succeeds, toast shows
8. Toggle preview pane — editor expands to full width
9. Back button returns to `/templates`
