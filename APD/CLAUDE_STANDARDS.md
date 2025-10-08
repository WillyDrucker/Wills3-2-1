# CLAUDE DEVELOPMENT STANDARDS

## CORE PHILOSOPHY
- **SUPER STUPID SIMPLE (SSS)**: Remove complexity, avoid feature creep
- **REMOVE DON'T ADD**: Simplify existing before adding new

## 4 DEVELOPMENT STANDARDS (CEMENT system temporarily disabled)

### 1. SESSION HANDOFF DOCUMENTATION
Document progress and issues for next session in `CLAUDE_SESSION_HANDOFF.md`:
- Current status and completion state
- Technical discoveries and root causes
- Next session priorities and unresolved issues
- Files modified with specific changes

<!-- ### 2. CEMENT SYSTEM (CURRENTLY DISABLED - TESTING LEAN APPROACH)
🔒 markers protect critical architectural code:
- Mark complex spacing calculations that solve specific bugs
- Protect timing and state synchronization logic
- Document architectural decisions that prevent regressions
- Use for code that required significant investigation to solve
- **Apply liberally**: CEMENT all areas that are likely to change by accident
- **Forward-looking only**: No historic references ("fixed bug v5.2"), explain what code does
-->

### 2. CSS SPECIFICITY OVER !IMPORTANT
Use proper CSS cascade instead of forcing styles:
- Build semantic selector specificity: `#container .component.state-class`
- **No !important flags**: Remove all instances, rely on natural cascade
- Use three-class specificity (`.icon-bar-item.icon-plan-wide.is-muted`)
- Leverage `:has()` pseudo-class for high specificity
- ID selectors where appropriate for unique elements
- **Exception removed**: Natural cascade always preferred

### 3. TOKEN-BASED CSS SYSTEM
Global rhythm with local exceptions only:
- **Global first**: `var(--space-m)`, `var(--color-primary)`, `var(--control-height)`
- **Local exceptions**: Component-specific tokens when global doesn't fit
- **Maintain 16px rhythm**: Consistent spacing architecture throughout
- **Document token usage**: Inline comments show source (Global: 16px or Local: 100px)
- **Muting tokens**: Global muting system uses `--muted-background`, `--muted-border-color`, `--muted-brightness`, `--muted-saturation`, `--muted-opacity`

### 4. SEMANTIC NAMING CONVENTION
Purpose-driven classes updated continuously:
- Use descriptive names: `.action-button.button-danger` not `.red-button`
- Follow component-state patterns: `.timer-display.text-plan`
- Update naming as architecture evolves and becomes clearer
- Avoid presentation-only classes in favor of purpose-based naming

## DOCUMENTATION STANDARDS

### File Headers (CSS)
Apply comprehensive documentation to all CSS files:

```css
/* ==========================================================================
   COMPONENT NAME - Purpose description

   High-level description of what this file does and its role.

   Architecture: High-level structural overview
   - Layout patterns and positioning strategies
   - Component composition and hierarchy
   - State management approach

   Spacing System: (if applicable)
   - Visual spacing targets with compensations
   - Rhythm system adherence

   Dependencies:
   Global: _variables.css (spacing, colors, typography, control-height, muting tokens)
   Global: _card-foundations.css, _card-headers.css, _selectors.css
   Parent: feature.style.css (if this is a split component file)
   Local: --component-specific-token (value explanation)

   Used by: Components that depend on this file
   ========================================================================== */
```

### File Headers (JavaScript)
Apply focused documentation to all JavaScript files:

```javascript
/* ==========================================================================
   COMPONENT NAME - Purpose Description

   Brief explanation of what this module does and its role.
   Include any critical architectural notes.

   Dependencies: List services, utilities, state dependencies
   Used by: Components or modules that import this
   ========================================================================== */
```

<!-- **JavaScript CEMENT Pattern** (CURRENTLY DISABLED):
```javascript
/* 🔒 CEMENT: Animation state tracking with timestamp for progress preservation */
if (logEntry.isAnimating && logEntry.animationStartTime) {
  const elapsed = Date.now() - logEntry.animationStartTime;
  if (elapsed > 5000) {
    logEntry.isAnimating = false;
  }
}
```
-->

### Section Headers
```css
/* === SECTION NAME === */
/* Brief description of section purpose (if not obvious) */
```

### Inline Comments
- **Sparse and targeted**: Only where logic is non-obvious or tricky
- **Visual outcomes**: Explain what the code achieves visually
- **Token sources**: Mark global vs local tokens inline
- **No versioning**: Remove all historic references ("v5.0.6 - fixed bug")
- **Forward-looking**: Explain what code does, not why it changed

### Comment Examples
```css
/* 100px height prevents layout shift between exercise states */
height: var(--selector-height); /* Local override: 100px */

/* Global: 16px bottom */
margin: 0 0 var(--space-m) 0;

/* Border compensation - 7px + 2px border = 9px visual */
--log-spacing-top: 7px;

/* Achieves 6px visual from top with font ascender */
top: 1px;
```

## TECHNICAL REQUIREMENTS

### File Structure
- `feature.index.js` - Component logic
- `feature.template.js` - HTML generation
- `feature.style.css` - Component styles

### CSS File Organization
1. **File header** with comprehensive documentation (see above)
2. **Section headers** for major groups (foundation, layout, states, muting)
3. **Inline comments** only where needed (non-obvious logic, visual outcomes)
4. **Token documentation** showing source (global vs local)

### State Management
- Services mutate `appState` directly
- Components read state only
- `renderAll()` after state changes
- `persistenceService.saveState()` for persistence

### Testing
- Manual testing via `python -m http.server 8000`
- No build system - native ES modules
- Test all state transitions and responsive behavior

## REFACTORING CHECKLIST

When refactoring files to standards:

1. ✅ **Documentation**: Add comprehensive file header with Architecture/Spacing System/Dependencies/Used by
2. ✅ **!important Removal**: Eliminate all flags, use natural cascade
3. ✅ **Tokenization**: Replace hard-coded values with global/local tokens
4. ✅ **Section Headers**: Organize with clear `=== SECTION ===` markers (CSS only)
5. ✅ **Clean Comments**: Remove versioning, add visual outcome explanations where needed
6. ✅ **Semantic Classes**: Verify purpose-driven naming conventions

**Note**: File splitting to specific line counts is NOT a standard requirement. Split files only when logical separation improves maintainability.
