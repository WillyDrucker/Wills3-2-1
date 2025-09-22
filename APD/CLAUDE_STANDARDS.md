# CLAUDE DEVELOPMENT STANDARDS

**Will's 3-2-1 Development Practices and Standards**

## CORE PRINCIPLES

### **SUPER STUPID SIMPLE (SSS)**
- User experience must be effortless and guided
- Remove complexity whenever possible
- Avoid feature creep

### **REMOVE, DON'T ADD**
- Simplify existing solutions before adding new ones
- Question every addition: "Is this necessary?"
- Maintain minimal, focused codebase

## CSS STANDARDS

### **🚫 ELIMINATE !important FLAGS**
- **Never use** `!important` declarations
- **Use proper CSS specificity** with semantic selectors
- **Build clean cascade hierarchy** instead of forcing styles

**Example**:
```css
/* ❌ BAD */
.element { color: red !important; }

/* ✅ GOOD */
#specific-container .element.state-class { color: red; }
```

### **TOKEN SYSTEM HIERARCHY**
- **Global tokens first**: Use `var(--space-m)`, `var(--color-primary)` etc.
- **Local tokens only when needed**: Component-specific exceptions
- **Maintain rhythm**: Global spacing system with local adjustments

**Example**:
```css
/* ✅ GOOD - Global token */
margin-top: var(--space-m);

/* ✅ ACCEPTABLE - Local exception with clear purpose */
margin-top: var(--component-specific-slack-top);
```

### **SEMANTIC CLASS NAMES**
- Use descriptive, purpose-driven names
- Avoid presentation-only classes (`.red-text`, `.big-margin`)
- Follow BEM-like patterns where helpful

**Example**:
```css
/* ❌ BAD */
.red-button { background: red; }

/* ✅ GOOD */
.action-button.button-danger { background: var(--danger-red); }
```

### **CASCADE STRATEGY**
- Build specificity through semantic structure
- Use component containers for scoping
- Leverage element hierarchy naturally

## COMMENT SYSTEM

### **🔒 CEMENT MARKERS**
Critical code that should not be modified without explicit direction:

```javascript
// 🔒 CEMENT: Dual Color System Architecture
// This controls timer colors separately from header colors
const timerColor = appState.session.currentTimerColorClass;
```

**Use CEMENT for**:
- Architectural decisions that solve specific bugs
- Critical timing or spacing calculations
- Complex state synchronization logic

### **ARCHITECTURE HEADERS**
Clear section documentation for component structure:

```css
/* ==========================================================================
   COMPONENT NAME - PURPOSE/SECTION

   Brief description of what this section handles
   ========================================================================== */
```

### **CONCISE INLINE COMMENTS**
- Explain **why**, not **what**
- Reference architectural patterns
- Keep brief and purposeful

**Example**:
```css
/* Spacer prevents layout shift during state changes */
.spacer-div { height: var(--state-compensation); }
```

## CODE ORGANIZATION

### **FILE STRUCTURE STANDARDS**
- `feature-name.index.js` - Component logic and event handlers
- `feature-name.template.js` - HTML generation functions
- `feature-name.style.css` - Component-specific styles
- Additional templates for complex components

### **IMPORT PATTERNS**
- Use import map aliases defined in `index.html`
- Group imports: services, components, utilities
- Avoid deep relative paths

### **STATE MANAGEMENT**
- Direct `appState` mutations in services only
- Components read state, don't modify it
- `renderAll()` after state changes
- `persistenceService.saveState()` for persistence

## ANIMATION STANDARDS

### **SPACER DIV PATTERN**
Use div-based spacing to prevent layout shift:

```html
<div class="component-block is-state">
  <div class="component-spacer-top"></div>
  <div class="component-content">Content</div>
  <div class="component-spacer-bottom"></div>
</div>
```

### **CSS ANIMATION STRUCTURE**
- Define animations in `styles/utils/_animations-*.css`
- Use semantic class names: `is-stamping-*`, `is-complete-*`, `is-fading-out-*`
- Animation fill modes: `forwards` for persistent states

## TESTING APPROACH

### **MANUAL TESTING**
- Test in browser via `python -m http.server 8000`
- Verify all state transitions
- Check responsive behavior
- Test error conditions

### **NO BUILD SYSTEM**
- Application runs directly from `index.html`
- Native ES modules in modern browsers
- No transpilation or bundling required

## PROBLEM-SOLVING METHODOLOGY

1. **Root Cause Analysis** - Understand the underlying issue
2. **Systematic Testing** - Measure → Adjust → Confirm → CEMENT
3. **Architectural Thinking** - Separate concerns, use token systems
4. **Professional Documentation** - Leave handoff-ready comments

## COMMIT STANDARDS

### **COMMIT MESSAGE FORMAT**
```
Brief description of change (50 chars max)

Optional longer explanation if needed. Reference any
architectural decisions or critical fixes.

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
```

### **WHEN TO COMMIT**
- After completing logical units of work
- When tests pass and functionality works
- Before starting new features
- After architectural improvements