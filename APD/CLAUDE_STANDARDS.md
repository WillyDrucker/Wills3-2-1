# CLAUDE DEVELOPMENT STANDARDS

## CORE PHILOSOPHY
- **SUPER STUPID SIMPLE (SSS)**: Remove complexity, avoid feature creep
- **REMOVE DON'T ADD**: Simplify existing before adding new

## 5 DEVELOPMENT STANDARDS

### 1. SESSION HANDOFF DOCUMENTATION
Document progress and issues for next session in `CLAUDE_SESSION_HANDOFF.md`:
- Current status and completion state
- Technical discoveries and root causes
- Next session priorities and unresolved issues
- Files modified with specific changes

### 2. CEMENT SYSTEM
🔒 markers protect critical architectural code:
- Mark complex spacing calculations that solve specific bugs
- Protect timing and state synchronization logic
- Document architectural decisions that prevent regressions
- Use for code that required significant investigation to solve

### 3. CSS SPECIFICITY OVER !IMPORTANT
Use proper CSS cascade instead of forcing styles:
- Build semantic selector specificity: `#container .component.state-class`
- **Exception**: `!important` allowed temporarily for testing solutions
- Remove `!important` flags once proper cascade is established
- Global CSS reset constraints may require `!important` as final solution

### 4. TOKEN-BASED CSS SYSTEM
Global rhythm with local exceptions only:
- **Global first**: `var(--space-m)`, `var(--color-primary)`
- **Local exceptions**: Component-specific tokens when global doesn't fit
- **Maintain 16px rhythm**: Consistent spacing architecture throughout
- Document token usage and exceptions clearly

### 5. SEMANTIC NAMING CONVENTION
Purpose-driven classes updated continuously:
- Use descriptive names: `.action-button.button-danger` not `.red-button`
- Follow component-state patterns: `.timer-display.text-plan`
- Update naming as architecture evolves and becomes clearer
- Avoid presentation-only classes in favor of purpose-based naming

## TECHNICAL REQUIREMENTS

### File Structure
- `feature.index.js` - Component logic
- `feature.template.js` - HTML generation
- `feature.style.css` - Component styles

### Architecture Headers
```css
/* ==========================================================================
   COMPONENT NAME - PURPOSE

   CEMENT: Brief architectural description
   Dependencies: List of imports and requirements
   Used by: Components that depend on this
   ========================================================================== */
```

### State Management
- Services mutate `appState` directly
- Components read state only
- `renderAll()` after state changes
- `persistenceService.saveState()` for persistence

### Testing
- Manual testing via `python -m http.server 8000`
- No build system - native ES modules
- Test all state transitions and responsive behavior