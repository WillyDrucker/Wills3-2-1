# WILL'S 3-2-1 PROJECT NOTES

**Project**: Will's 3-2-1 Workout Tracking Application
**Tech Stack**: Vanilla JavaScript, ES Modules, CSS Tokens
**Philosophy**: SUPER STUPID SIMPLE (SSS), REMOVE DON'T ADD

## VERSION CHANGELOG

### **v5.5.4 - Database Immediate Save System & Visual State Indicators**
**Date**: 2025-10-17
**Problem**: Need real-time database persistence for workout data, better visual indicators for workout state, polish on completion screen
**Solution**: Implemented immediate save architecture with sequential queue, swapped color scheme for semantic clarity, added animated button transitions on workout completion
**Key Achievements**:
- **Immediate save pattern**: Every log/skip/edit triggers instant database save (fire-and-forget)
- **Save queue implementation**: Sequential promise chain prevents race conditions from rapid logging
- **Visual state system**: Color swap for semantic meaning (Green = logged/complete, White = in-progress)
- **Admin Clear Today's Data**: Button for willy.drucker@gmail.com with silent deletion
- **Workout Results button**: Two-state animation (Workout Saved! → Begin Another Workout after 4s)
- **CLAUDE standards**: Applied comprehensive documentation to all 10 modified files
- **Issue closure**: Closed #33 (Database and history implementation) - all acceptance criteria met
**Root Causes Identified**:
- **Race conditions**: Multiple rapid logs could corrupt data without sequential save queue
- **Color semantics**: Green traditionally means complete/success, not in-progress
- **Missing feedback**: No visual confirmation of database save on workout completion
- **Documentation gaps**: Service files lacked Architecture sections explaining patterns
**Technical Architecture**:
- **Save queue**: Promise chain ensures saves complete in order (`saveQueue = saveQueue.then()`)
- **UPSERT pattern**: Check existence → UPDATE or INSERT to handle re-saves
- **Database-first rendering**: My Data loads from Supabase on every render (source of truth)
- **ID conversion**: Database stores strings, app uses numbers (conversion on load/save)
- **Fire-and-forget**: localStorage first (instant), then async database save (no blocking)
- **Silent deletion**: Clear Today's Data shows no prompts, missing workouts confirm deletion
**Files Created**:
- `src/services/data/workoutSyncService.js` - Database operations with save queue
**Files Modified** (10 total):
- `src/services/data/historyService.js` - Immediate save calls on log/skip operations
- `src/features/my-data/my-data.index.js` - Database-first rendering, Clear Today's Data handler
- `src/features/my-data/my-data.template.js` - Admin button (email check)
- `src/features/my-data/my-data.templates.calendarExercise.js` - Color swap logic
- `src/features/workout-results-card/workout-results-card.index.js` - Button state transition
- `src/features/workout-results-card/workout-results-card.template.js` - Initial button state
- `src/features/workout-results-card/workout-results-card.style.css` - Button styling
- `src/services/authService.js` - Reviewed (no changes needed)
**Database Architecture**:
- **workouts table**: id, user_id, timestamp, plan_name, session_type_name, session_color_class, body_part, body_part_color_key
- **workout_logs table**: workout_id (FK), user_id, exercise_data (JSONB), set_number, weight, reps, status, superset_side
- **Foreign keys**: ON DELETE CASCADE ensures logs deleted before workouts
- **Migration**: Automatically migrates localStorage workouts on first authenticated session
**Visual State Indicators**:
```javascript
// my-data.templates.calendarExercise.js:40
const isCurrentSessionMatch = session.id === appState.session.id;
const valueColorClass = isCurrentSessionMatch ? "" : "text-plan";
// Current active session = white (in progress)
// Completed sessions = green (logged/database saved)
```
**Save Queue Implementation**:
```javascript
// workoutSyncService.js:22-36
let saveQueue = Promise.resolve();
export async function saveWorkoutToDatabase(workout) {
  return new Promise((resolve) => {
    saveQueue = saveQueue.then(() => performSave(workout).then(resolve));
  });
}
```
**Button State Transition**:
```javascript
// workout-results-card.index.js:38-47
// Initial: Green "Workout Saved!" (button-log, disabled)
// After 4000ms: Blue "Begin Another Workout" (button-finish, enabled)
// Timing: 3s plate animation + 1s buffer = 4000ms
setTimeout(() => {
  button.textContent = "Begin Another Workout";
  button.classList.remove("button-log");
  button.classList.add("button-finish");
  button.disabled = false;
}, 4000);
```
**Admin Features**:
- **Clear Today's Data**: Only visible for willy.drucker@gmail.com
- **Date range**: Calculates start/end of current day in ISO format
- **Cascade deletion**: Deletes workout_logs first (FK constraint), then workouts
- **Silent pattern**: No browser prompts, missing data confirms deletion
- **AppState sync**: Removes from `appState.user.history.workouts` after database deletion
**CLAUDE Standards Applied**:
- **Architecture sections**: All file headers document save patterns, state systems, admin features
- **CEMENT preservation**: All existing 🔒 markers kept throughout refactor
- **Dependencies updated**: Added workoutSyncService to import lists
- **Used by sections**: Cross-referenced calling components
- **Concise documentation**: Focused on patterns, not implementation details
**Button Text Alternatives Considered**:
1. "Workout Saved!" (selected)
2. "Logged!"
3. "Gains Logged!"
4. "Session Locked!"
5. "All Set!"
6. "Data Saved!"
7. "You're Good!"
8. "Stored!"
9. "Saved to My Data"
**Technical Discoveries**:
- Sequential save queue critical for rapid logging scenarios (prevents lost data)
- UPSERT pattern cleaner than separate check/insert/update logic
- Color semantics matter: Green = success/complete aligns with user mental model
- Database-first rendering ensures My Data always shows latest (no stale localStorage)
- Button state transitions need timing calculation (animation + buffer)
- ID type conversion must happen at load/save boundaries (database vs app consistency)
- Admin email checks simple and effective for single-user features
**Context Management**:
- Session started with manual summary from previous work (fresh 200k token budget)
- Reached ~96k tokens (48% capacity) by end of standards application
- Auto-compact would trigger ~150k+ tokens mid-session
- Manual summary provides better continuity than auto-compact
**Status**: COMPLETE - Database immediate save operational, visual state indicators deployed, completion screen polished, CLAUDE standards applied

### **v5.5.3 - Reset Modal Feature & CLAUDE Standards Application**
**Date**: 2025-10-15
**Problem**: Need reset functionality for non-dev users, login/reset page files lacking CLAUDE standards (CEMENT references, hard-coded colors, !important flags, verbose comments)
**Solution**: Implemented three-option reset modal for non-dev users, applied comprehensive CLAUDE standards to all authentication pages, implemented selector muting system for modal
**Key Achievements**:
- **Reset modal feature**: Three-option modal for non-dev users (Reset Workout Defaults, Reset Workout Defaults & Clear Logs, Clear My Data)
- **Developer distinction**: Only `willy.drucker@gmail.com` sees "Nuke Everything", others see "Reset" with modal
- **Selector muting**: All selectors mute (border + text) when reset modal open, implemented via `data-active-modal` attribute
- **CLAUDE standards**: Applied to 12 files across login-page, reset-password, reset-modal, profile-page features
- **Tokenization**: Replaced hard-coded colors (#0099ff → var(--primary-blue), #000000 → var(--background-dark))
- **Standards cleanup**: Removed CEMENT references, cleaned autofill comments, removed transitions, concise documentation
- **Issue closure**: Closed #23 (Reset Password Page polish) - all items verified complete
**Root Causes Identified**:
- **CEMENT disabled**: Standards document specifies CEMENT system temporarily disabled for lean approach
- **Hard-coded values**: Colors not tokenized for consistency
- **Verbose comments**: Autofill sections had excessive documentation
- **Historic references**: Files contained version numbers and fix history instead of forward-looking docs
**Technical Architecture**:
- **Reset modal**: Overlay system with 3 vertically stacked action buttons (green/yellow/red)
- **User detection**: Email check in side-nav template conditionally renders Nuke vs Reset
- **Disabled logic**: Button disabled if `appState.session.workoutLog.some(log => log.status === "completed" || log.status === "skipped")`
- **Selector muting**: `html[data-active-modal="resetOptions"]` selector targets all `.app-selector` elements
- **Modal service integration**: `modalService.open()` sets `data-active-modal` attribute, removed on close
**Files Created**:
- `src/features/reset-modal/reset-modal.template.js` - Three-button reset modal template
- `src/features/reset-modal/reset-modal.style.css` - Modal styling with blue border, 10px padding
- `src/features/reset-modal/reset-modal.index.js` - Business logic for reset operations
**Files Refactored to Standards** (12 total):
- Login page: login-page.style.css, login-page.index.js, login-page.template.js
- Reset password: reset-password.style.css, reset-password.index.js, reset-password.template.js
- Reset modal: reset-modal.template.js, reset-modal.style.css, reset-modal.index.js (new)
- Profile page: profile-page.style.css, profile-page.index.js, profile-page.template.js
**Files Modified**:
- `src/features/side-nav/side-nav.template.js` - Conditional rendering (developer vs user)
- `src/services/actions/actionHandlers.js` - Added reset modal action handlers
- `src/services/ui/modalService.js` - Added `data-active-modal` attribute management
- `src/styles/components/_selectors-muting.css` - Added reset modal selector muting rules
- `index.html` - Added reset-options-modal-container
- `src/shared/utils/uiComponents.js` - Registered modal container reference
- `src/main.js` - Added renderResetOptionsModal() to render loop
- `src/styles/index.css` - Imported reset modal CSS
**Reset Modal Features**:
- **Button 1 (Green)**: Reset Workout Defaults - Restores config to defaults (disabled if sets logged)
- **Button 2 (Yellow)**: Reset Workout Defaults & Clear Logs - Restores config + clears session logs
- **Button 3 (Red)**: Clear My Data - Clears all workout history from My Data page
- **Styling**: Blue border, 10px edge padding, 16px spacing between buttons, black text on colored backgrounds
- **Business logic**: Checks for completed/skipped sets (not pending), calls appropriate handler functions
**Selector Muting System**:
- **Implementation**: `html[data-active-modal="resetOptions"] .app-selector` CSS rules
- **Visual effect**: Muted border color + filtered/dimmed text content
- **Scope**: All selectors throughout application (config, exercise, session, log, dual-mode)
- **Muting tokens**: Uses global variables (--muted-border-color, --muted-brightness, --muted-saturation, --muted-opacity)
**CLAUDE Standards Applied**:
- **!important justification**: Chrome autofill overrides REQUIRE !important flags (documented as exception)
- **CEMENT removal**: Replaced "🔒 CEMENT:" with concise explanatory comments
- **Tokenization**: All colors use CSS variables (--primary-blue, --background-dark, --log-green, --skip-red, --text-yellow-maintenance)
- **Documentation**: Proper file headers with Architecture/Spacing System/Dependencies/Used by sections
- **Transitions removed**: Eliminated CSS transitions (violates no-transition rule)
- **Comment conciseness**: Removed verbose Chrome autofill explanations, kept only necessary notes
**Standards Checklist Completed**:
1. ✅ Documentation: Comprehensive file headers added
2. ✅ !important Removal: Removed where possible (kept only Chrome autofill exceptions)
3. ✅ Tokenization: Replaced hard-coded color values
4. ✅ Section Headers: CSS files organized with === SECTION === markers
5. ✅ Clean Comments: Removed CEMENT/version references, kept visual outcome explanations
6. ✅ Semantic Classes: Verified purpose-driven naming conventions
**Technical Discoveries**:
- `data-active-modal` attribute enables CSS targeting of specific modal states
- Selector muting requires targeting both summary and content separately for proper visual effect
- Reset button disabled state must check log status, not just log length (pending sets allowed)
- Modal service can track modal stack and restore previous modal on close
- Chrome autofill !important flags are necessary exception to standards (browser override requirement)
**Status**: COMPLETE - Reset modal functional with proper business logic, selector muting implemented, CLAUDE standards applied to all authentication pages

### **v5.5.2 - Chrome Autofill Investigation & Code Cleanup**
**Date**: 2025-10-09
**Problem**: Chrome autofill styling issues - small font-size on initial load, need to investigate CSS/JS workarounds
**Solution**: Investigated 9 different approaches to force font-size styling on autofilled inputs, documented Chrome rendering limitations, cleaned up failed workaround code
**Key Achievements**:
- **Chrome autofill investigation**: Extensive testing of CSS/JS approaches to override autofill font-size
- **Successful styling**: Background-color, text-color, borders all working correctly
- **Known limitation**: Font-size controlled by Chrome's internal rendering layer (unfixable)
- **Code cleanup**: Removed 131 lines of failed workaround JavaScript, CSS opacity transitions
- **Documentation**: Comprehensive findings documented in session handoff and critical discoveries
**Root Causes Identified**:
- **Chrome rendering layer**: Autofill font-size applied at browser rendering level that completely bypasses CSS/JS
- **CSS transition hack limitation**: 5000000s delay works for background-color but NOT font-size
- **Programmatic events insufficient**: Focus/blur from JavaScript doesn't trigger same style recalculation as real user interaction
- **Timing issue**: Chrome applies autofill styles AFTER all CSS/JS attempts to override
**Failed Approaches Attempted**:
1. **CSS transition delay** on font-size (worked for background, not font)
2. **CSS keyframe animation** forcing font styles with `animation: autofill-fix 0s forwards`
3. **JavaScript setProperty()** with 'important' flag on inline styles
4. **MutationObserver** watching for autofill attribute changes
5. **Aggressive polling** checking input values every 50ms for 5 seconds
6. **Programmatic focus/blur cycle** to trigger style recalculation
7. **Nuclear option** delayed render with `opacity: 0` then fade in after 1200ms
8. **will-change CSS property** forcing `font-size, font-family` tracking
9. **Multiple !important flags** with increased specificity
**Technical Architecture**:
- Working CSS: `-webkit-text-fill-color`, `-webkit-box-shadow`, `background-color` with 5000000s transition
- Autofill pseudo-classes covered: `:-webkit-autofill`, `:-webkit-autofill:hover`, `:-webkit-autofill:focus`, `:autofill`
- Focus state: Black background replaces gray on user interaction
- Border system: Blue `box-shadow: inset 0 0 0 2px #0099ff` throughout all states
**Files Modified**:
- `src/features/login-page/login-page.style.css` - Removed opacity transitions for delayed render, kept working autofill overrides
- `src/features/login-page/login-page.index.js` - Removed all 131 lines of font-size fixing code (forceInputStyles, polling, MutationObserver, focus/blur)
**Technical Discoveries**:
- Chrome autofill applies font-size at rendering layer AFTER all CSS/JS execution
- CSS transition delay trick works for background-color but Chrome treats font-size differently
- User clicking input triggers Chrome's internal style recalculation that CSS/JS cannot replicate
- Programmatic `focus()` events don't trigger same recalculation as mouse/touch interaction
- All browser autofill styling heavily restricted for security/UX consistency
- Font-size issue self-corrects on first user interaction (acceptable UX tradeoff)
**User Decision**: Accept font-size as unfixable minor cosmetic issue. User explicitly requested: "Let's revert back to the best option and remove all code trying to fix the text size."
**Status**: COMPLETE - Chrome autofill limitations documented, code cleaned up, working styling preserved

### **v5.5.1 - Supabase Authentication & Login Page Polish**
**Date**: 2025-10-08
**Problem**: Application needed user authentication system with email/password, password reset flow, and polished login UI following 16px/7px rhythm
**Solution**: Integrated Supabase authentication with complete login/reset flow, applied CLAUDE standards to login page with precise font metric compensation
**Key Achievements**:
- **Supabase integration**: Full auth system (signUp, signIn, signOut, resetPassword, updatePassword, getSession)
- **Password reset flow**: Email token auth with security validation, dev mode for testing
- **Login page polish**: 16px/7px rhythm with font metric compensation, removed !important flags
- **CLAUDE standards**: Comprehensive documentation, cascade specificity, tokenization
- **GitHub issues**: Created 4 issues for tracking (1 closed, 3 pending user confirmation)
**Root Causes Identified**:
- **Font metric compensation**: Large fonts (2.5rem) need different compensation than small (1.25rem) for visual spacing
- **Asymmetric padding**: Top/bottom need different values to achieve symmetric visual spacing
- **Session persistence**: Supabase free tier sessions never expire (stored in localStorage)
- **Cascade specificity**: Increase parent specificity instead of using !important
**Technical Architecture**:
- **Auth service**: Centralized authentication in `src/services/authService.js`
- **Supabase client**: Initialized in `src/lib/supabaseClient.js`
- **Feature pattern**: Each feature has .index.js (logic), .template.js (HTML), .style.css (styles)
- **Standalone pages**: reset-password.html for email token flow
**Files Added**:
- `src/features/login-page/` - login-page.index.js, login-page.template.js, login-page.style.css
- `src/features/profile-page/` - profile-page.index.js, profile-page.template.js, profile-page.style.css
- `src/features/reset-password/` - reset-password.index.js, reset-password.template.js, reset-password.style.css
- `src/lib/supabaseClient.js` - Supabase initialization with environment config
- `src/services/authService.js` - Authentication methods
- `reset-password.html` - Standalone reset password page
**Files Modified**:
- `src/config.js` - Added Supabase URL/key configuration
- `src/main.js` - Added authentication routing logic
- `src/state.js` - Added auth state (user, session, isAuthenticated)
- `src/features/side-nav/side-nav.template.js` - Added Profile/Logout links
- `src/services/core/appInitializerService.js` - Added auth initialization
- `src/services/actions/actionHandlers.js` - Added profile handler
- `src/styles/index.css` - Added login page imports
**Login Page UI Specifications**:
- Title: 32px visual from Email (23px actual + font metrics compensation)
- Email/Password labels: 1.25rem (matches config card headers)
- Label to input: 7px visual (uses `--header-margin-bottom: 4px`)
- Email to Password: 16px visual (13px compensated)
- Forgot Password link: 16px visual above/below (13px/12px asymmetric)
- OR divider: 16px visual above/below (13px/12px asymmetric)
**CLAUDE Standards Applied**:
- Removed 2 !important flags from login page (cascade specificity pattern)
- Comprehensive file headers with Architecture/Spacing System/Dependencies
- Tokenized all possible values (hard-coded values are font-metric compensations only)
- Inline documentation for complex patterns (divider overlay, modal, responsive)
- Semantic class naming throughout
**GitHub Issues Created**:
- Issue #7: Password Reset Dev Mode & Session Validation (open - security testing)
- Issue #8: Login Page Typography & Spacing Polish (closed)
- Issue #9: Forgot Password Modal UI Polish (open - requirements pending)
- Issue #10: Password Reset Page UI Polish (open - requirements pending)
**Technical Discoveries**:
- Font metrics require asymmetric padding/margins for symmetric visual spacing
- Large title fonts (2.5rem) need 8px padding for 16px visual (vs 11px default)
- `.parent .component` specificity pattern overrides globals without !important
- Supabase sessions persist indefinitely on free tier (Pro plan required for timeout)
- Email token auth auto-authenticates user via URL parameters
**Status**: COMPLETE - Authentication system functional, login page polished to standards, pending user testing

### **v5.5.0 - Complete CLAUDE Standards Application & Core File Documentation**
**Date**: 2025-10-05
**Problem**: Final core files (config.js, main.js, state.js, index.css/html) lacked CLAUDE standards, /styles directory needed documentation headers, workout log buttons broken, animation timing issues
**Solution**: Applied comprehensive CLAUDE standards to all remaining files, split oversized CSS files, fixed critical workout log bugs, removed !important flags, unified animation timing
**Key Achievements**:
- **Core files documented**: config.js, main.js, state.js with comprehensive CLAUDE headers
- **Styles directory complete**: 16 CSS files with full documentation (split 2 files → 6 total)
- **Bug fixes**: Clear Set/Update button (logIndex 0 falsy), green flash animation timing
- **!important removal**: 3 flags removed from _action-button-groups.css with cascade fixes
- **File splitting**: _selectors.css (285→3 files), _animations.css (204→3 files) following logical cohesion
- **Historic cleanup**: Removed version numbers, "how it was fixed" comments, focusing on "how it should be"
- **Lean approach**: index.html and index.css kept minimal per user requirements
**Root Causes Identified**:
- **Falsy zero bug**: Using `||` operator treated logIndex 0 as falsy, preventing first log item actions
- **Animation fill-mode**: `fill-mode: both` applied animation state immediately, causing parallel playback
- **!important flags**: Cascade specificity insufficient, needed higher specificity selectors
- **Missing documentation**: Core entry files lacked comprehensive headers with dependencies
**Technical Architecture**:
- **Styles organization**: Base (reset, typography, scaffolding) → Components (buttons, inputs, selectors, modals) → Features → Utilities → Themes
- **Selectors split**: Base structure (102 lines) + Truncation system (130 lines) + Muting logic (32 lines)
- **Animations split**: General utilities (43 lines) + Fuel gauge plates (110 lines) + Modal feedback (58 lines)
- **Animation unification**: Grow/shrink and green flash combined into single 1.8s timeline (no delays needed)
**Files Split**:
- `_selectors.css` → 3 files: _selectors-base.css, _selectors-truncation.css, _selectors-muting.css
- `_animations.css` → 3 files: _animations-general.css, _animations-fuel-gauge.css, _animations-modal.css
- Both parent files became re-export indexes for backward compatibility
**Bug Fixes**:
1. **Clear Set/Update buttons**: Changed `side || logIndex || videoUrl` to `side ?? logIndex ?? videoUrl` (nullish coalescing) - actionService.js:61
2. **Update button import error**: Added direct import of `recalculateCurrentStateAfterLogChange` from workoutProgressionService - actionHandlers.js:22, 245
3. **Green flash timing**: Unified animation timeline (0-55% hold, 55-77.5% green, 77.5-100% fade) - workout-log.animations.css:35-48
**Cascade Fixes**:
- Removed !important from _action-button-groups.css (lines 24, 91, 92)
- Added higher specificity rule in active-exercise-card.action-area.css using `#active-card-container .action-button-group`
**Key CEMENT Areas Protected**:
- Logical cohesion principle: Fuel gauge 6-plate animations kept together (110 lines) despite line limit
- Unified animation timeline: Single 1.8s duration with keyframe-based sequencing (no animation-delay)
- Color-matched truncation: Parent overflow + child ellipsis prevents white ellipsis on colored text
- Bidirectional selector muting: Exercise selector exception with override during modal open
**Documentation Pattern Applied**:
```css
/* ==========================================================================
   FILE NAME - Purpose statement

   CEMENT: Key architectural decision or business rule
   - Bullet point explanation
   - Additional context

   Architecture: Component structure
   - Key patterns
   - Critical dimensions

   Dependencies:
   Global: _variables.css (tokens used)
   Local: Related component files

   Used by: Features/components consuming this file
   ========================================================================== */
```
**CLAUDE Standards Completeness**:
- **16 /styles files**: Full headers with Purpose, CEMENT, Architecture, Dependencies, Used by
- **5 core files**: config.js, main.js, state.js, index.css (verified), index.html (lean)
- **Historic cleanup**: Removed version references, "CEMENTED" verbosity, "how it was fixed" comments
- **Lean manifests**: index.css and index.html kept minimal with focused comments only
**Technical Discoveries**:
- Nullish coalescing `??` critical for handling 0 as valid parameter (falsy vs nullish distinction)
- Animation unification more reliable than delays (timing baked into keyframes, not separate properties)
- Logical cohesion trumps line limits (6 related fuel gauge animations kept together)
- Re-export indexes enable backward compatibility during file splitting
**Status**: COMPLETE - All core files and /styles directory fully documented to CLAUDE standards, bugs fixed, !important flags removed

### **v6.29 - Config Quick Buttons, Session Cycling Logic Overhaul & Critical Timer Bug Fix**
**Date**: 2025-10-06
**Problem**: Config quick buttons not clickable when muted, session cycling validation logic incorrect (allowed invalid state transitions), critical timer bug where clearing triggering set didn't stop active timer, session text pluralization issue
**Solution**: Made quick buttons clickable with pointer-events override, completely rewrote session cycling validation to be reactive to log state, fixed timer completion handler parameters, added session cycling set count real-time updates, fixed "1 Min" text
**Key Achievements**:
- **Quick buttons clickable**: Added `pointer-events: auto` override for muted buttons to allow config dropdown access
- **Session cycling overhaul**: Rewrote validation logic to be purely reactive - clearing sets automatically releases locks
- **Critical timer fix**: Fixed incorrect parameters to timer completion handlers when clearing sets
- **Real-time updates**: Session cycling now updates active exercise card set count immediately
- **Reactive validation**: New helper `hasNonMajor1ThirdSet()` detects Maintenance path divergence
**Root Causes Identified**:
- **Global .is-muted rule**: `pointer-events: none` in _helpers.css blocked quick button clicks
- **Session validation logic**: Complex rule-based logic didn't account for Maintenance divergence at 3rd set from different muscle group
- **Timer completion params**: Passing wrong parameters (options object instead of restState) prevented timer cleanup
- **Missing render call**: Session cycling didn't re-render active exercise card, leaving stale set counts
**Session Cycling Rules** (New reactive logic):
1. **0-2 Major1 sets logged**: All sessions available (Standard/Express/Maintenance)
2. **3rd Major1 set logged**: Locked to Standard/Express (Maintenance blocked)
3. **3rd set from different muscle group**: Locked to Maintenance (Express blocked, Standard always available)
4. **Clearing sets releases locks**: If 3rd set cleared → all sessions available again
5. **Standard always available**: Baseline workout with all sets
6. **Standard ↔ Express always allowed**: Same set structure
**Technical Architecture**:
- **Reactive validation**: `canCycleToSession()` checks only current log state, no history tracking
- **Divergence detection**: `hasNonMajor1ThirdSet()` checks for 2 Major1 + 1+ non-Major1 sets
- **Timer cleanup**: `handleCompletion()` clears interval, sets type to "none", triggers fadeout
- **Set count updates**: `renderActiveExerciseCard()` called during session cycling to update "Set X of Y"
**Files Modified**:
- `config-card.header.style.css` - Added `pointer-events: auto` to `.is-muted` button rules (lines 251, 257, 263)
- `config-card.header.template.collapsed.js` - Reverted to button elements with individual click handlers
- `sessionValidation.js` - Complete rewrite with reactive logic, added `hasNonMajor1ThirdSet()` helper
- `main.js` - Added `renderActiveExerciseCard()` call during session cycling updates (line 87)
- `workout-log.index.js` - Fixed timer completion handler parameters (lines 80, 87)
**Bug Fixes**:
1. **Quick buttons not clickable**: Added `pointer-events: auto` override for `.is-muted` class (overrides global rule from _helpers.css:40)
2. **Session cycling validation**: Rewrote logic to check for Major1 count AND non-Major1 3rd set (Maintenance divergence)
3. **Timer not stopping on clear**: Fixed parameters from `handleNormalRestCompletion({ wasSkipped: false })` to `handleNormalRestCompletion(restState, { wasSkipped: false })`
4. **Set count not updating**: Added `renderActiveExerciseCard()` call when session type changes
5. **Session text pluralization**: Fixed "1 Mins Remain" to "1 Min Remain" using conditional `timeText` variable
**Key CEMENT Areas Protected**:
- **Reactive validation**: Purely state-based, no history - clearing sets automatically releases locks
- **Timer cleanup critical**: If cleared set triggered timer, must stop timer immediately (prevents rogue timers)
- **Quick button accessibility**: Must remain clickable even when muted (provides config dropdown access)
- **Session lock muting**: Session quick button mutes when completely locked (Maintenance after 3rd non-Major1 set)
**Validation Rules Summary**:
```javascript
// Trying to cycle TO Maintenance
if (targetType === "Maintenance") {
  // Block if 3rd Major1 set logged (Standard/Express path committed)
  if (loggedMajor1Count >= 3) return false;
  return true; // Allow if 0-2 Major1 sets
}

// Trying to cycle TO Express (from Maintenance)
if (targetType === "Express") {
  // Block if 3rd set from different muscle group (Maintenance path diverged)
  if (hasNonMajor1ThirdSet()) return false;
  return true; // Allow otherwise
}
```
**Technical Discoveries**:
- `pointer-events: auto` can override global `.is-muted` rule with higher specificity
- Session validation must be purely reactive to support set clearing/re-logging scenarios
- Timer completion handlers expect `(restState, options)` not `(options)` or `(side, options)`
- Active exercise card must re-render on session cycling to update calculated set counts
**Status**: COMPLETE - Quick buttons clickable when muted, session cycling validation fully reactive and correct, critical timer bug fixed

### **v6.28 - Services Refactor, Utilities Reorganization & UI Polish**
**Date**: 2025-10-05
**Problem**: Large service files (timer, workout) lacked modularity, shared utilities mixed concerns (260 lines), UI had typography/spacing issues, event delegation bugs causing scroll jumps
**Solution**: Split services into focused modules (100-200 lines), reorganized utilities with backward compatibility, fixed critical UI bugs, applied CLAUDE documentation standards
**Key Achievements**:
- **Services split**: timerService (3 files), workoutService (6 files) for better maintainability
- **Utilities reorganization**: utils.js (260 lines) → 6 focused modules (timeUtils, calendarUtils, domUtils, generalUtils, uiComponents, sessionValidation)
- **Backward compatibility**: Re-export indexes maintain all existing import paths
- **UI polish**: Fixed typography (descender cutoff), spacing (16px/7px rhythm), event delegation (scroll jump), wake lock (visibility check)
- **Bug fixes**: 6 critical issues resolved (import errors, event bubbling, typography, spacing, wake lock, function calls)
- **Documentation**: CLAUDE headers applied to all modified files, wakeLock.js fully documented
**Root Causes Identified**:
- **Monolithic services**: Large files (timerService, workoutService) mixed multiple concerns
- **Utils organization**: 260-line utils.js contained unrelated utilities (time, calendar, DOM, general, UI, validation)
- **Event delegation order**: Summary clicks checked after data-action attributes, causing scroll jumps
- **Typography issues**: line-height 0.7 cut off descenders, incorrect padding calculations
- **Wake lock error**: No visibility check before initial request, causing background load errors
**Technical Architecture**:
- **Timer services**: Core state (timerService.js) + completion handlers (timerCompletionService.js) + resumption logic (timerResumptionService.js)
- **Workout services**: Re-export index + state management + log generation + preservation + progression + metrics
- **Shared utilities**: Re-export indexes (utils.js, ui.js) + focused modules in shared/utils/ directory
- **Backward compatibility pattern**: Old monolithic files become re-export indexes for gradual migration
**Files Split**:
- `timerService.js` → 3 files: timerService (85 lines), timerCompletionService (106 lines), timerResumptionService (102 lines)
- `workoutService.js` → 6 files: workoutService (34 lines re-exports), workoutStateService (117 lines), workoutLogGenerationService (187 lines), workoutLogPreservationService (116 lines), workoutProgressionService (178 lines), workoutMetricsService (67 lines)
- `utils.js` → 6 modules: timeUtils (87 lines), calendarUtils (91 lines), domUtils (53 lines), generalUtils (90 lines), uiComponents (79 lines), sessionValidation (139 lines)
- `sessionValidation.js` moved from src/utils/ to shared/utils/ for better organization
**Import Path Updates**:
- Updated 11 files for timer/workout service imports
- Updated 5 files for sessionValidation imports (now use "utils" instead of "utils/sessionValidation.js")
- Converted all `require()` calls to ES module imports (removed circular dependency workarounds)
**Bug Fixes**:
1. **Edit log selector scroll jump**: Reordered event delegation to check summary clicks BEFORE data-action attributes (actionService.js:42-51)
2. **Typography descender cutoff**: Changed line-height from 0.7 to 1 in workout-log.header.css
3. **Spacing corrections**: Adjusted padding from 14px→12px for exact 16px visual rhythm (workout-log.style.css)
4. **Wake lock error**: Added visibility check before initial request (wakeLock.js:35-37)
5. **Import errors**: Fixed handleNormalRestCompletion, resumeTimersFromState imports after service split
6. **Function call errors**: Fixed workoutService namespace calls (active-exercise-card.actions.log.js:110-111)
**Key CEMENT Areas Protected**:
- Event delegation order (summary before data-action) prevents scroll jumps - CRITICAL
- CSS spacing system (16px/7px visual rhythm) with line-height: 1 prevents descender cutoff
- Wake lock visibility check prevents NotAllowedError on background load
- Backward compatibility re-exports maintain all existing import paths
**Documentation Pattern Applied**:
```javascript
/* ==========================================================================
   WAKE LOCK - Screen Wake Lock Management

   Prevents screen from sleeping during workout sessions using the Screen Wake
   Lock API. Automatically handles visibility changes and page hide events.

   🔒 CEMENT: Visibility check prevents initialization errors
   - Only requests wake lock when page is visible
   - Prevents NotAllowedError on background page load
   - Automatically re-requests when page becomes visible

   Dependencies: None (browser Wake Lock API)
   Used by: appInitializerService.js (initialization)
   ========================================================================== */
```
**Technical Discoveries**:
- Event delegation order is critical: summary clicks MUST be checked before data-action to prevent bubbling
- Line-height: 1 essential for preventing descender cutoff while maintaining spacing precision
- Backward compatibility via re-exports allows seamless migration without breaking changes
- ES module imports only (no require() calls) prevents circular dependency issues
- Visibility checks essential for Wake Lock API to prevent background initialization errors
**Cleanup**:
- Removed empty src/utils/ folder (sessionValidation.js moved to shared/utils/)
- All old monolithic files converted to re-export indexes
**Status**: COMPLETE - Services modularized, utilities reorganized, UI polished, all bugs fixed, documentation complete

### **v6.27 - Dual-Mode & Active-Exercise Documentation Standards**
**Date**: 2025-10-04
**Problem**: Dual-mode and active-exercise-card files lacked comprehensive documentation headers, dependency tracking, and CEMENT protection
**Solution**: Applied complete CLAUDE documentation standards to 33 files, split oversized files for maintainability, formalized documentation pattern in CLAUDE_STANDARDS.md
**Key Achievements**:
- **33 files documented**: 11 dual-mode CSS + 11 active-exercise CSS + 11 active-exercise JS files
- **Comprehensive headers**: All files received CEMENT/Architecture/Dependencies/Used by sections
- **File splitting**: selector.css (266→3 files), actions.js (215→3 files) for better maintainability
- **Dual-mode separation**: Maintained clean separation from active-exercise-card (11 component files)
- **CEMENT standardization**: 🔒 emoji pattern applied to all critical areas (spacing, timing, layouts, muting)
- **JavaScript pattern**: Established focused header format for .js files (concise vs verbose CSS headers)
- **Standards documentation**: Updated CLAUDE_STANDARDS.md with complete CSS/JS header patterns
**Root Causes Identified**:
- **Missing documentation**: No file headers, dependency lists, or architectural notes in dual-mode/active-exercise files
- **Oversized files**: selector.css (266 lines), actions.js (215 lines) mixed multiple concerns
- **Inconsistent CEMENT**: Critical areas not protected across dual-mode and active-exercise sections
**Technical Architecture**:
- **Dual-mode structure**: Entry point `dual-mode.style.css` imports 11 component files (layout, spacing, colors, timers, fuel-gauge, etc.)
- **Active-exercise structure**: Split selector into summary/dropdown/muting, split actions into log/skip/handlers
- **Documentation hierarchy**: File header → CEMENT section → Architecture → Dependencies (Global/Parent/Local) → Used by
- **CEMENT pattern**: One-line format with 🔒 emoji for inline comments, bullet list format for file headers
**Files Split**:
- `active-exercise-card.selector.css` (266 lines) → 3 files:
  - `selector.summary.css` (144 lines): Closed state, 4-line layout, absolute positioning
  - `selector.dropdown.css` (74 lines): Open dropdown, 50px items
  - `selector.muting.css` (62 lines): Bidirectional muting across Exercise/Config/Log
- `active-exercise-card.actions.js` (215 lines) → 3 files:
  - `actions.log.js` (101 lines): handleLogSet function
  - `actions.skip.js` (89 lines): handleSkipSet, handleSkipRest
  - `actions.js` (60 lines): Re-exports + input/swap handlers
**Dual-Mode Files Documented** (11 CSS):
- `dual-mode.style.css` - Main entry point with all imports
- `dual-mode.layout.css` - CSS table architecture (prevents 2px shift bug)
- `dual-mode.spacing.css` - Tokenized spacing system (16-18px visual rhythm)
- `dual-mode.colors.css` - Static color schemes (Superset green/yellow, Partner green/blue)
- `dual-mode.header.css` - Card header with muscle group icons
- `dual-mode.selector.css` - Exercise selector dual-mode styling
- `dual-mode.fuel-gauge.css` - Side-by-side fuel gauge layout
- `dual-mode.timers.css` - Side-by-side timer display (4.5rem font)
- `dual-mode.active-card.css` - General active card dual-mode overrides
- `dual-mode.partner-modal.css` - Partner-specific green/blue styling
- `dual-mode.superset-modal.css` - Superset-specific green/yellow styling
**Active-Exercise Files Documented** (22 total):
- CSS (11): header, fuel-gauge, inputs, actions, selector.summary, selector.dropdown, selector.muting, youtube-overlay, waiting-card, selector.css (re-exports), style.css (entry)
- JS (11): index, template, workoutCard, completionCard, exerciseSelector, actionArea, fuelGauge, numberInputHandler, actions, actions.log, actions.skip
**Key CEMENT Areas Protected**:
- Dual-mode: CSS table layout (prevents content-based rebalancing), 4.5rem timer font (360px viewport), spacing compensation (font metrics)
- Active-exercise: 100px selector height (anti-layout-shift), absolute positioning (mathematical precision), animation state tracking (timestamp preservation)
- Selectors: Bidirectional muting architecture, border-only muting exceptions, text truncation pattern
**Documentation Pattern Established**:
```css
/* ==========================================================================
   COMPONENT NAME - Purpose description

   CEMENT: Critical architecture notes
   - Key architectural decisions with bullet points

   Architecture: High-level structural overview
   - Layout patterns and positioning strategies

   Dependencies:
   Global: _variables.css (specific tokens used)
   Parent: feature.style.css (if split component)
   Local: --component-token (value explanation)

   Used by: Components that depend on this file
   ========================================================================== */
```
**CLAUDE_STANDARDS.md Updates**:
- Added JavaScript file header pattern (concise vs CSS verbose)
- Added JavaScript CEMENT pattern with 🔒 emoji example
- Clarified file splitting is NOT a standard requirement (split only when logical)
- Updated refactoring checklist for both CSS and JS files
**Technical Discoveries**:
- File splitting improves maintainability when concerns are logically separable (summary/dropdown/muting vs monolithic selector)
- JavaScript headers should be concise with focus on Dependencies/Used by (vs verbose CSS with Architecture sections)
- CEMENT markers must use 🔒 emoji consistently for visual scanning
- "Parent:" dependency category useful for split component files referencing main entry point
- Documentation pattern more reliable than referencing example files (config-card.style.css)
**Status**: COMPLETE - All 33 dual-mode and active-exercise files documented to CLAUDE standards, patterns formalized in CLAUDE_STANDARDS.md

### **v6.26 - CSS Standards Refactor & Confirmation Button**
**Date**: 2025-10-04
**Problem**: CSS files lacked consistent documentation, used ~70 !important flags, had hard-coded values instead of tokens, missing CEMENT markers on critical areas
**Solution**: Comprehensive refactor of 6 major CSS files to enterprise-grade standards, removed all !important flags, complete tokenization, added "Let's Go!" confirmation button
**Key Achievements**:
- **Documentation excellence**: Comprehensive file headers with CEMENT notes, dependencies, architecture overview using config-card as reference standard
- **!important elimination**: Removed ~70 flags across all files, replaced with natural CSS cascade using three-class specificity and :has() pseudo-class
- **Complete tokenization**: All spacing values use global tokens (--space-m, --space-s, --space-xxs, --control-height), muting uses global tokens (--muted-background, --muted-border-color, --muted-brightness, --muted-saturation, --muted-opacity)
- **CEMENT markers applied**: Protected all critical areas (spacing calculations, muting behavior, layout patterns, border compensation, animation preservation)
- **"Let's Go!" button**: Green confirmation button added to config header actions (Cancel | Reset | Let's Go!)
- **Exercise selector fix**: Border-only muting preserves current exercise visibility, full muting only when other selector opens
- **Glowing log scroll fix**: Changed scrollToActiveCard → scrollToTop for proper jump behavior
**Root Causes Identified**:
- **!important overuse**: Natural cascade sufficient with proper three-class specificity (e.g., `.icon-bar-item.icon-plan-wide.is-muted`)
- **Inconsistent documentation**: No standard format, missing dependency lists, historic comments instead of forward-looking
- **Hard-coded values**: Spacing/sizing not tokenized, making changes difficult and inconsistent
- **Missing CEMENT**: Critical areas not protected, increasing risk of accidental breakage
**Technical Architecture**:
- Three-class specificity pattern: `.component.modifier.state` naturally overrides two-class base styles
- :has() pseudo-class provides high specificity for parent-based styling: `body:has(#config-header .config-header-group.expanded)`
- Global muting token system: All selectors use same visual standard for consistency
- Border-only muting pattern: Content visible when displaying active information (plan, focus, session, current exercise)
- CEMENT documentation pattern: Critical areas marked with explanation of what must never change
**Files Refactored**:
- `src/features/config-header/config-header.style.css` (504 lines) - Config header dropdown overlay
- `src/styles/components/_selectors.css` (286 lines) - Global selector base component
- `src/features/active-exercise-card/active-exercise-card.selector.css` (311 lines) - Exercise selector with 100px height
- `src/features/workout-log/workout-log.states.css` (72 lines) - Log item states (completed, skipped, next-up, muted)
- `src/features/workout-log/workout-log.edit-panel.css` (138 lines) - Edit panel dropdown with bidirectional muting
- `src/styles/utils/_helpers.css` (minor update) - Exercise selector border-only muting exception
**Documentation Standards Established**:
- File headers: CEMENT notes, Architecture overview, Dependencies (Global/Local), Used by
- Section headers: `=== SECTION NAME ===` format throughout
- Inline comments: Sparse, targeted, explain visual outcomes and token sources
- No versioning: All historic references removed ("v5.0.6 - fixed bug" → "Border compensation achieves 9px visual")
- CEMENT markers: Applied to spacing, muting, layouts, borders, fonts, styles, calculations
**Key CEMENT Areas Protected**:
- Config header always blue border (never transparent)
- Bidirectional muting architecture (Config ↔ Exercise ↔ Log)
- Custom top padding compensation (13px + 2px border = 16px visual)
- Icon bar three-button layout (flexible plan, fixed 50px focus, flexible session)
- 50px hard constraint prevents layout shift
- Border-only muting preserves active information
- Narrow viewport strategy (lock focus icon, compress plan/session)
- Exercise selector 100px height (anti-layout-shift for 4 lines)
- Absolute positioning for 10px/10px/8px/8px spacing precision
- Font metrics compensation in top values
- Ellipsis color inheritance via wrapper ownership
- Log border compensation (7px + 2px border = 9px visual)
- Rounded shape preservation (style .workout-log-item directly)
- Exercise selector exception (border-only when business logic muted, full when selector opens)
**Technical Discoveries**:
- Three-class specificity naturally overrides two-class base styles without !important
- :has() pseudo-class combines with IDs for very high specificity
- Global muting tokens create consistent UX across all selectors
- Border-only muting pattern preserves information visibility while showing disabled state
- CEMENT markers essential for protecting complex solutions from accidental changes
- Forward-looking comments more useful than historic "fixed bug in v5.2" references
**Confirmation Button**:
- "Let's Go!" - Green background (--log-green), black text, same size as Cancel/Reset
- Layout: Cancel (gray) | Reset (red) | Let's Go! (green) - left to right
- Action: `toggleConfigHeader` - closes dropdown and saves state
- Replaces click-outside pattern with explicit confirmation
**Testing Verified**:
- Business logic muting (first set logged)
- Bidirectional selector muting (Config ↔ Exercise ↔ Log)
- Exercise selector border-only muting (content visible when business logic muted)
- Config header Cancel/Let's Go buttons
- Responsive layout (< 390px viewport)
- Glowing log item scroll behavior (scrollToTop)
**Status**: COMPLETE - All CSS files refactored to enterprise-grade standards, ~70 !important flags removed, complete tokenization, comprehensive CEMENT protection, "Let's Go!" confirmation added

### **v6.25 - One-Selector-To-Rule-Them-All Complete Implementation**
**Date**: 2025-10-04
**Problem**: Selector muting inconsistent across groups, animation resets on dual-mode session cycling, no inter-selector muting within same group
**Solution**: Implemented comprehensive group-based bidirectional muting system, fixed animation preservation, established consistent muting visual standard
**Key Achievements**:
- **Group-based selector architecture**: Three groups (Config, Exercise, Log) with complete mutual exclusivity
- **Bidirectional muting**: All groups mute each other when any selector opens (6 directional rules)
- **Inter-group muting**: Edit log items mute each other (only one item editable at a time)
- **Consistent muting standard**: `brightness(0.6) saturate(0.6) opacity(0.3)` across all selectors
- **Animation preservation**: Fixed dual-mode session cycling to never re-render (preserves 4-second glow)
- **Config component muting**: Icon bar buttons and session chevrons fully mute when external selectors open
**Root Causes Identified**:
- **Animation reset**: Conditional re-render in `updateActiveWorkoutPreservingLogs()` was triggering for dual modes
- **Inconsistent muting**: Different opacity/brightness values across selectors
- **Missing inter-muting**: Edit log items didn't mute each other
- **Double-compound filter**: Wildcard `*` selector applied filter to both container and children
**Technical Architecture**:
- Three selector groups with `getSelectorGroup()` helper function
- Group detection: Config (config header + modals), Exercise (#exercise-selector), Log (#workout-log-card)
- Muting matrix: 6 bidirectional rules + 1 inter-log rule = 7 total muting rules
- Black background preserved: `background: var(--background-dark)` with muted borders
- Targeted selectors: `.plan-quick-button-stack`, `.session-quick-button-stack`, `.icon-label` (prevents double-compounding)
**Files Modified**:
- `src/services/selectorService.js` - Added group detection functions, updated toggle() with group-based blocking
- `src/services/actionService.js` - Updated toggleConfigHeader() to use group-based blocking
- `src/features/config-header/config-header.style.css` - Added 4 muting rules (exercise→config, log→config, config→exercise, general border)
- `src/features/workout-log/workout-log.edit-panel.css` - Added 4 muting rules (config→log, log→config, log→exercise, inter-log)
- `src/features/active-exercise-card/active-exercise-card.selector.css` - Added 3 muting rules (general, exercise→config, exercise→log)
- `src/main.js` - Removed conditional re-render block from updateActiveWorkoutPreservingLogs()
**Selector Group Matrix**:
```
Config Group Open:
  → Mutes Exercise Group (Current Exercise selector)
  → Mutes Log Group (all edit log items)
  → Internal selectors work (Current Plan, Current Focus, modals)

Exercise Group Open:
  → Mutes Config Group (icon bar buttons, session chevrons)
  → Mutes Log Group (all edit log items)

Log Group Open:
  → Mutes Config Group (icon bar buttons, session chevrons)
  → Mutes Exercise Group (Current Exercise selector)
  → Mutes Other Log Items (only one editable at a time)
```
**Standard Muting Style** (consistent across all selectors):
```css
/* Border */
box-shadow: inset 0 0 0 var(--card-border-width) var(--primary-blue-dark);
background: var(--background-dark); /* Keep black background */

/* Content */
filter: brightness(0.6) saturate(0.6);
opacity: 0.3;
```
**Technical Discoveries**:
- Wildcard selector `*` compounds filter effect on nested elements
- Must target specific container classes to prevent double-application
- Session cycling function ONLY called for session changes, never mode switches
- Config icon bar buttons have nested div/span structure requiring targeted selectors
- Font metrics make edit log text more readable than config buttons at same opacity
**Debugging Journey**:
1. Initial edit log muting worked, but config stayed active
2. Fixed by changing `#workout-log` → `#workout-log-card`
3. Config muting too harsh (unreadable) - wildcard causing double-compound
4. Fixed by targeting specific elements: `.plan-quick-button-stack`, `.session-quick-button-stack`, `.icon-label`
5. Established standard muting values by making edit log 10% less muted, applying to all
**Status**: COMPLETE - Full bidirectional group-based muting system operational, animations preserved, consistent visual style

### **v6.24 - Dual-Mode Responsive Design & Session Cycling Fix**
**Date**: 2025-10-03
**Problem**: Dual-mode timer overflow at 360px viewport, config buttons wrapping below 390px, Log Set buttons inconsistent colors, session cycling deleting logged sets in dual modes
**Solution**: Reduced timer font size, implemented responsive flex behavior, matched button colors to timers/fuel gauges, created preserve functions for dual modes
**Key Achievements**:
- **Dual-mode timer sizing**: Reduced from 5.0rem to 4.5rem to fit 360px viewport width
- **Spacing adjustments**: Updated all dual-mode spacing tokens for new timer height (16-18px visual rhythm)
- **Responsive config buttons**: Below 390px, focus button locks at 50px, plan/session buttons shrink evenly
- **Log Set button colors**: Now match timer/fuel gauge colors (Superset: Green left/Yellow right, Partner: Green left/Blue right)
- **Session cycling preservation**: Dual modes now preserve logged sets when changing session types (Standard/Express/Maintenance)
- **Complete tokenization**: All dual-mode spacing values centralized in CSS custom properties
**Root Causes Identified**:
- **Timer overflow**: 5.0rem font size too large for 360px viewport, causing layout breaks
- **Button wrapping**: Default responsive rules allowed wrapping instead of flex compression
- **Button color mismatch**: Log Set buttons used default green instead of side-specific colors
- **Set deletion**: `updateActiveWorkoutPreservingLogs()` regenerated entire log for dual modes instead of preserving
**Technical Architecture**:
- Spacing tokens in `active-exercise-card.style.css`: `--dual-timer-font-size`, `--dual-resting-margin-top`, `--dual-grid-margin-top`, etc.
- Responsive breakpoint: `@media (max-width: 389px)` prevents wrapping, locks focus at 50px
- Color scheme: Static classes `text-plan` (green), `text-warning` (yellow), `text-primary` (blue) applied to Log Set buttons
- Preservation functions: `updateSupersetWorkoutLogForSessionChange()`, `updatePartnerWorkoutLogForSessionChange()` with helper `_mergeExistingWithNew()`
**Files Modified**:
- `src/features/dual-mode/dual-mode.active-card.css` - Timer font size tokenized (4.5rem)
- `src/features/dual-mode/dual-mode.spacing.css` - All spacing values converted to tokens, comprehensive header rewrite
- `src/features/dual-mode/dual-mode.colors.css` - Added Log Set button color rules matching timers
- `src/features/active-exercise-card/active-exercise-card.style.css` - Added 7 new dual-mode spacing tokens
- `src/features/active-exercise-card/active-exercise-card.templates.actionArea.js` - Color class logic for Log Set buttons
- `src/features/config-header/config-header.style.css` - Responsive layout rules for narrow viewports
- `src/services/workoutFactoryService.js` - Added dual-mode session change preserve functions
- `src/main.js` - Updated to call preserve functions instead of regenerate
**Spacing Token Values** (CSS → Visual):
- `--dual-timer-font-size: 4.5rem` - Timer display (down from 5.0rem)
- `--dual-resting-margin-top: 0px` - "Resting For:" to inputs (16px visual)
- `--dual-grid-margin-top: 12px` - "Resting For:" to dual grid (17px visual)
- `--dual-upper-slack-spacing: 12px` - Inactive text top (17px visual)
- `--dual-lower-slack-spacing: 14px` - Inactive text bottom (18px visual)
- `--dual-inactive-margin-top: 11px` - Inactive "Begin Exercise" top (16px visual)
- `--dual-inactive-margin-bottom: 2px` - Inactive "Begin Exercise" bottom (17px visual)
- `--dual-logset-transform-y: 1px` - "Log Set" button alignment (18px visual)
**Technical Discoveries**:
- Font metrics compensation: CSS values 3-5px less than visual spacing due to line-height 1.2 and font descent
- Responsive flex strategy: Lock critical elements (focus icon), compress flexible elements (text buttons)
- Dual-mode log structure: Left/right sides must be filtered, merged separately, then interleaved to preserve pattern
- Color token usage: `--log-green`, `--text-yellow-maintenance`, `--primary-blue` for consistent theming
**CLAUDE.md Standards Applied**:
- CEMENT markers on critical spacing and color architecture
- Token-based CSS system with comprehensive documentation
- Semantic naming convention for dual-mode states
- Architecture headers updated with dependencies and token references
**Status**: COMPLETE - All dual-mode responsive issues resolved, spacing tokenized, session cycling preserves logged sets

### **v6.23 - Config Dropdown & Selector Muting Improvements**
**Date**: 2025-10-03
**Problem**: Config dropdown closing on Superset/Partner confirmation, one-selector-to-rule-them-all not fully enforced, selector muting inconsistent
**Solution**: Fixed unlock timing with setTimeout, implemented bidirectional selector blocking, enhanced visual muting consistency
**Key Achievements**:
- **Modal confirmation fix**: Config dropdown stays open when confirming Superset/Partner modes (setTimeout unlock after re-render)
- **Bidirectional selector blocking**: Config dropdown blocks external selectors AND external selectors block config dropdown
- **Visual muting consistency**: Exercise selector always fully muted when other selectors open, config border mutes to dark blue
- **One-selector enforcement**: Implemented complete mutual exclusivity between config dropdown and all external selectors
**Root Causes Identified**:
- **Dropdown closing on confirm**: Unlock was happening before re-render completed, click-outside was firing
- **Incomplete blocking**: Only prevented config→external, not external→config
- **Visual inconsistency**: Exercise selector had special opacity rules that weren't overridden when other selectors opened
**Technical Architecture**:
- Confirm flow: handleConfirm() → updateActiveWorkoutAndLog() → setTimeout(0) → unlock (ensures all renders complete)
- Bidirectional blocking: selectorService.toggle() checks both directions (config→external, external→config)
- Visual muting: CSS !important rules force exercise selector muting regardless of .is-muted class state
- Config border muting: `body.is-selector-open #config-header:not(:has(details[open]))` dims border when external selector open
**Files Modified**:
- `src/services/actionService.js` - setTimeout unlock in confirmSuperset/confirmPartnerWorkout, bidirectional blocking in toggleConfigHeader
- `src/services/selectorService.js` - Added config dropdown check to prevent external selector opening
- `src/features/config-header/config-header.style.css` - Border muting when external selector open
- `src/features/active-exercise-card/active-exercise-card.selector.css` - Forced muting rules with !important
**Technical Discoveries**:
- setTimeout(0) critical for ensuring unlock happens after ALL render cycles complete
- Bidirectional blocking requires checks in both directions (toggle handler AND action handler)
- CSS !important necessary to override special-case opacity rules for exercise selector
- Visual muting state independent of business logic muting (.is-muted class)
**Status**: IN PROGRESS - Core functionality complete, additional selector muting edge cases identified for next session

### **v6.22 - Config Dropdown Persistence & Dynamic Icons**
**Date**: 2025-10-03
**Problem**: Config dropdown closes when selecting items from "Current Focus" selector, Focus Quick Button needs dynamic icons for dual modes
**Solution**: Fixed event bubbling issue with stopPropagation, added dynamic muscle group icons, enhanced button styling
**Key Achievements**:
- **Config dropdown persistence**: Fixed dropdown closing on day/plan/exercise swap selections using event.stopPropagation()
- **Dynamic Focus icons**: Muscle group icons update based on current/next exercise in Superset/Partner modes
- **Button styling**: Cancel button (solid gray) and Reset Settings button (solid red with black text)
- **Reset menu cleanup**: Removed "Reset Settings - Clear Logs" from selector, kept Reset Settings button
- **Modal state preservation**: Config dropdown stays open when Superset/Partner modes are confirmed or cancelled
- **Dual-mode clear bug**: Fixed exercise duplication when clearing logged sets in dual modes
- **Hamburger menu z-index**: Fixed config card not muting when side nav opens
**Root Causes Identified**:
- **Dropdown closing**: Click event was bubbling to document-level `handleClickOutside()` after list item handler completed and unlocked
- **Exercise duplication**: `resetExerciseForMuscleGroup()` wasn't respecting `supersetSide` parameter, replaced exercises across both sides
- **Modal closing dropdown**: No state restoration on modal confirm/cancel
**Technical Architecture**:
- Event flow: List item click → handler runs → selector closes → unlock → event.stopPropagation() prevents bubbling to handleClickOutside()
- Lock mechanism: `configHeaderLocked` flag prevents click-outside from closing during operations
- State restoration: `wasConfigHeaderExpandedBeforeModal` tracks state before opening Superset/Partner modals
- Dynamic icons: `renderFocusDisplay()` updates icon based on `currentLogIndex` or next pending exercise in dual modes
- Muscle group icons: PNG images at `/icons/muscle-groups/` (arms, chest, back, legs, shoulders)
**Files Modified**:
- `src/services/actionService.js` - Added event.stopPropagation() in list item handler, modal state tracking, extensive debug logging
- `src/services/workoutService.js` - Fixed resetExerciseForMuscleGroup() to respect supersetSide parameter
- `src/services/selectorService.js` - Added closeAllExceptConfigHeader() function
- `src/features/config-header/config-header.index.js` - Added renderFocusDisplay(), configHeaderLocked checks, notifyConfigHeaderToggled()
- `src/features/config-header/config-header.template.js` - Updated getMuscleGroupIcon() for dual-mode dynamic icons, removed Reset menu item
- `src/features/config-header/config-header.style.css` - Button styling (Cancel: gray/white, Reset: red/black)
- `src/features/workout-log/workout-log.index.js` - Pass supersetSide to resetExerciseForMuscleGroup()
- `src/features/superset-modal/superset-modal.index.js` - State restoration before modalService.close()
- `src/features/partner-modal/partner-modal.index.js` - State restoration before modalService.close()
- `src/features/side-nav/side-nav.style.css` - Z-index fix for config card muting
- `src/state.js` - Added wasConfigHeaderExpandedBeforeModal and configHeaderLocked flags
- `src/main.js` - Added renderFocusDisplay() call in updateActiveWorkoutPreservingLogs()
**Debugging Journey**:
1. First attempt: State restoration after renderAll() - FAILED (timing issue)
2. Second attempt: Setting state BEFORE renderAll() - FAILED
3. Third attempt: Lock mechanism - FAILED (event still bubbling)
4. Fourth attempt: Centralized unlock timing - FAILED
5. Fifth attempt: closeAllExceptConfigHeader() - FAILED
6. Debug logging revealed: State TRUE after unlock, FALSE on render - event bubbling to handleClickOutside()
7. Final solution: event.stopPropagation() in list item handler
**Technical Discoveries**:
- Event bubbling continues after handler completes - must explicitly stop propagation
- Lock mechanism alone insufficient if event still bubbles to document level
- Debug logging critical for identifying state change timing
- Modal state preservation requires tracking before modal opens (not after)
- Dual-mode side tracking critical for exercise reset/swap operations
- PNG muscle group icons provide better visual clarity than emoji
**Status**: COMPLETE - Config dropdown persists correctly, dynamic icons working, all styling complete, dual-mode clear bug fixed

### **v6.21 - Session Cycling Bug Fixes & Session Stack Enhancement**
**Date**: 2025-10-02
**Problem**: Critical session cycling double-click bug after Reset, animations restarting on session changes, Plan Quick Button font/spacing issues
**Solution**: Fixed state/config name mismatch, prevented unnecessary re-renders, corrected font inheritance, added stacked "Remain" text to Session Quick Button
**Key Achievements**:
- **Session cycling fixed**: Corrected `state.js` initial session name "Recommended:" → "Standard:" (matches config.js v6.17 rename)
- **Animation preservation**: Modified `updateActiveWorkoutPreservingLogs()` to skip active card/log re-render for normal session cycling (only re-render for dual-mode changes)
- **Plan Quick Button styling**: Fixed font-size inheritance (1rem → 1.25rem), added explicit Roboto font, weight 500, proper 7px/-3px/9px spacing
- **Session Quick Button stack**: Added "Remain" text stacked under "# Mins" with matching font/color/spacing
- **First-click reliability**: Session cycling works on first click after Reset/page load
- **4-second pulse preserved**: Exercise card border glow and button animations no longer restart on session cycling
**Root Causes Identified**:
- **Double-click bug**: State/config name mismatch from incomplete v6.17 migration ("Recommended:" vs "Standard:")
- **Animation restart**: Workout log length change triggered full re-render of active card (line 69-73 in main.js)
- **Font size issue**: `.icon-bar` 1rem font-size inherited by child buttons, overriding intended 1.25rem
**Technical Architecture**:
- Session cycling flow: `cycleNextSession()` → `handleTimeChange()` → `updateActiveWorkoutPreservingLogs()` → setTimeout(50ms) → `renderSessionDisplay()`
- Stack layout pattern: Padding 7px/9px top/bottom, first span margin-bottom -3px (7px visual gap), line-height 1.2
- Render condition: `if (oldLogLength !== newLogLength && (appState.superset.isActive || appState.partner.isActive))` preserves animations
- Font cascade fix: Set font-size on `.icon-bar-item.icon-plan-wide` to override parent `.icon-bar`
**Files Modified**:
- `src/state.js` - Fixed initial currentTimeOptionName (Recommended → Standard)
- `src/main.js` - Modified re-render condition, changed RAF to setTimeout(50)
- `src/features/config-header/config-header.template.js` - Added `getSessionTimeText()` helper, removed inline styles from Plan Quick Button
- `src/features/config-header/config-header.style.css` - Added `.session-quick-button-stack` CSS, fixed Plan Quick Button font inheritance
- `src/features/config-header/config-header.index.js` - Updated `renderSessionDisplay()` to handle stacked spans, updated comments (Recommended → Standard)
- `src/services/actionService.js` - Calls `updateActiveWorkoutPreservingLogs()` for session cycling (not just `updateWorkoutTimeRemaining()`)
**Debugging Discoveries**:
- Console logging revealed state was "Recommended:" but config expected "Standard:"
- First click cycled Recommended→Standard (appeared as no-op), second click Standard→Express (worked correctly)
- Animation restart traced to workout log length comparison triggering active card re-render
- Font size issue traced to CSS specificity: parent `.icon-bar` 1rem inherited by all children
**Technical Discoveries**:
- State/config consistency critical after config renames - must update all references
- Conditional re-renders must check mode context to preserve animations
- CSS font-size inheritance from parent containers can override child declarations
- Stack layout using negative margins (-3px) creates consistent visual gaps with line-height 1.2
**Status**: COMPLETE - All session cycling issues resolved, animations preserved, fonts corrected, stack feature added

### **v6.20 - Config-Header Dropdown Redesign**
**Date**: 2025-10-01
**Problem**: Config-header needed complete UX redesign as giant selector dropdown instead of expand/collapse card, with proper spacing, alignment, and interaction behavior
**Solution**: Transformed config-header into dropdown selector overlay with flexible icon bar buttons and stacked dual-mode text display
**Key Achievements**:
- **Dropdown overlay design**: Config-header dropdown overlays on top of active-exercise card instead of pushing down
- **Icon bar redesign**: Plan (flex 1) | Bodypart (50px) | Session (flex 1) | Dropdown removed
- **Reset button removed**: Reset functionality moved to dropdown footer buttons
- **Session button extended**: Shows "37 Mins" format with colored number matching session type
- **Dual-mode stacking**: Plan Quick Button shows stacked bodyparts (Superset) or names (Partner) with 6px gap
- **Cancel/Reset buttons**: Footer buttons at bottom of dropdown with 16px spacing between
- **Seamless connection**: Blue border throughout, squared corners at transition, matching backgrounds
- **No layout shift**: Dropdown opens/closes without moving active-exercise card (absolute positioning)
- **Session cycling preserved**: Chevrons work on first click, dropdown stays open during cycling
- **Body part removed**: Removed workout focus (push/pull) from active-exercise card header completely
**Technical Architecture**:
- Dropdown uses absolute positioning with `top: 100%` to overlay below card
- Icon bar buttons use `flex: 1` for Plan and Session, fixed `50px` for Bodypart
- Blue border always visible (not transparent), squared bottom corners when expanded
- Margin compensation (`calc(var(--space-m) - 2px)`) prevents 2px shift on expand
- Expanded content padding: 16px bottom to achieve proper spacing accounting for border
- Click-outside handler with `setTimeout(() => ignoreNextOutsideClick = false, 0)` prevents double-click
- Session cycling uses `renderSessionDisplay()` to update both icon bar and expanded text without re-render
**Files Modified**:
- `config-header.template.js` - Removed reset button, extended session button, stacked dual-mode text, wrapped expanded content
- `config-header.style.css` - Absolute positioning for dropdown, flexible icon bar widths, spacing fixes, blue border always visible
- `config-header.index.js` - Click-outside handler improvements, setTimeout for flag clearing, renderSessionDisplay updates icon bar
- `active-exercise-card.templates.workoutCard.js` - Removed workout focus HTML generation completely
- `active-exercise-card.index.js` - Removed workout focus code from renderActiveCardHeader
- `main.js` - Removed renderConfigHeader call from updateActiveWorkoutPreservingLogs to preserve dropdown state
**Spacing Fixes**:
- Current Setup: 13px padding top + 2px border = 16px visual
- Current Plan: -1px margin top = 16px visual from icon bar
- Current Focus: 13px margin top = 16px visual from above selector
- Bottom buttons: 16px padding bottom + 16px gap between buttons
**Bug Fixes**:
- Partner mode action name corrected: `openPartnerModal` → `openPartnerMode`
- Bodypart reappearing after clock updates - completely removed from active card header
- Double-click issue on session chevrons - setTimeout clears ignore flag after render
- Dropdown closing on session cycle - removed renderConfigHeader from update function
- 2px layout shift on expand - added margin-bottom compensation
**Technical Discoveries**:
- Absolute positioned dropdown requires careful border/margin math to prevent shifts
- Click-outside handler must ignore clicks on buttons/selectors inside card
- setTimeout with 0 delay queues flag clearing for next event loop tick
- Always-visible blue border prevents 2px shift from transparent→blue transition
- Flexible icon bar buttons (`flex: 1`) adapt to available space dynamically
**Status**: COMPLETE - Config-header dropdown working with proper spacing, no layout shifts, session cycling functional

### **v6.19 - Config-Header Refinement & Config-Modal Removal** (SUPERSEDED BY v6.20)
**Date**: 2025-10-01
**Status**: This version was partially implemented then redesigned into v6.20 dropdown approach
**Original Goals**: Icon bar reorganization, muscle group icons, plan abbreviation, config-modal removal
**What Survived**: Config-modal business logic preservation, muscle group icon system concept
**What Changed**: Complete UX redesign from expand/collapse to dropdown overlay

### **v6.18 - Collapsible Config-Header Complete**
**Date**: 2025-09-30
**Problem**: Config-header consuming too much vertical space, forcing active-exercise card and workout logs below the fold requiring constant scrolling
**Solution**: Implemented collapsible config-header with minimal icon bar (collapsed state) and full controls (expanded state)
**Key Achievements**:
- **Collapsed state (default)**: Minimal icon bar with plan/session/time status + expand button
- **Icon bar design**: 📋 Plan | 🎯⚡🔧 Session | ⏱️ Time | 🔄 Reset | [▼] Expand
- **Expanded state**: Full selector + session cycling chevrons (all original functionality)
- **Space savings**: ~60-70px vertical space saved when collapsed
- **User flow improvement**: Active card and logs visible without scrolling
- **State persistence**: Collapsed/expanded preference saved across sessions
**Technical Architecture**:
- `appState.ui.isConfigHeaderExpanded` - Controls collapsed/expanded state
- `getCollapsedTemplate()` - Minimal icon bar with status display
- `getExpandedTemplate()` - Full controls (preserved original functionality)
- `toggleConfigHeader` action - Toggles state and triggers full re-render
**Icon Bar Components**:
- **Plan icon** (📋): Shows current plan summary (12-Week/8-Week or Superset/Partner)
- **Session icon** (🎯/⚡/🔧): Dynamic icon based on Standard/Express/Maintenance
- **Time badge** (⏱️): Shows workout duration (e.g., "48 Mins")
- **Reset button** (🔄): Quick access to reset confirmation
- **Expand button** ([▼]): Opens full config controls
**Files Modified**:
- `src/state.js` - Added isConfigHeaderExpanded state field
- `src/services/persistenceService.js` - Added isConfigHeaderExpanded to persisted state
- `src/services/actionService.js` - Added toggleConfigHeader action
- `src/features/config-header/config-header.template.js` - Split into collapsed/expanded templates
- `src/features/config-header/config-header.style.css` - Added icon bar CSS, collapse/expand transitions
**Technical Discoveries**:
- Icon bar uses flexbox with gap for responsive layout
- Emoji icons (📋🎯⚡🔧⏱️🔄) provide intuitive visual status at a glance
- Collapse button positioned absolutely in header (right: 80px before clock)
- CSS transitions on card-content-container padding for smooth state changes
- Responsive design: Icon bar wraps on narrow screens (<480px)
**Status**: COMPLETE - Collapsible config-header saving significant vertical space, collapsed by default

### **v6.17 - Session Cycling Implementation Complete**
**Date**: 2025-09-30
**Problem**: Need ability to cycle between Standard/Express/Maintenance sessions without losing logged exercise data, plus animations were resetting on session changes, plus time not updating on session change
**Solution**: Implemented session cycling control with chevron buttons, validation system, set preservation logic, animation-safe rendering, and time recalculation
**Key Achievements**:
- **Session cycling control**: Chevron buttons below "Current Setup" selector to cycle Standard/Express/Maintenance
- **Validation system**: Prevents cycling to sessions that would remove logged sets
- **Set preservation**: Merge logic keeps logged sets when changing sessions
- **Animation preservation**: textContent updates instead of innerHTML prevents animation restarts
- **Express validation fix**: Check by exercise name instead of set number (accounts for renumbering)
- **Time recalculation fix**: Added workoutService.updateWorkoutTimeRemaining() call on session change
- **Terminology update**: Changed "Recommended:" to "Standard:" throughout UI
**Technical Architecture**:
- Created `src/utils/sessionValidation.js` - shared validation logic (removed duplicates from 5 files)
- `canCycleToSession()` - validates if session change would remove logged sets
- `updateWorkoutLogForSessionChange()` - merges logged sets with new session structure
- `renderSessionDisplay()` - animation-safe updates using textContent/className (no innerHTML)
**Critical Bug Fixes**:
1. **Express validation** - Was comparing set numbers to rules, but log was renumbered. Fixed to check by exercise name.
2. **Animation reset** - innerHTML updates restart ALL CSS animations. Fixed using textContent/className properties.
3. **Initialization chain** - Added `updateActiveWorkoutPreservingLogs` to dependency chain
**Files Created**:
- `src/utils/sessionValidation.js` - Shared validation utility
**Files Modified**:
- `src/main.js` - Added updateActiveWorkoutPreservingLogs() function + workoutService.updateWorkoutTimeRemaining() call
- `src/services/appInitializerService.js` - Pass preservation function through initialization
- `src/services/actionService.js` - Chevron actions use preservation logic
- `src/services/workoutFactoryService.js` - Added updateWorkoutLogForSessionChange() merge function
- `src/features/config-header/config-header.index.js` - Added renderSessionDisplay() with textContent updates
- `src/features/config-header/config-header.template.js` - Use shared validation utility
- `src/features/config-card/config-card.templates.timeSelector.js` - Use shared validation utility
- `src/features/config-modal/config-modal.templates.timeSelector.js` - Use shared validation utility
- `src/config.js` - Changed "Recommended:" to "Standard:"
- `index.html` - Added "utils/" to import map
**Technical Discoveries**:
- innerHTML updates ANYWHERE restart ALL CSS animations in document
- Express/Maintenance filtering changes set positions via renumbering - validation must check by exercise name
- Session cycling control = `.current-session-display` with chevron buttons and session text
- Merge pattern: Keep logged sets that exist in new session + add new pending sets + renumber
- Time recalculation must be called explicitly after session change to reflect new set counts
**Status**: COMPLETE - Session cycling working with validation, preservation, animation stability, and proper time updates

## CRITICAL DISCOVERIES

### **Chrome Autofill Font-Size Limitation (v5.5.2)**
Chrome's autofill system applies font-size at a rendering layer that completely bypasses all CSS and JavaScript override attempts. The CSS transition delay trick (5000000s) successfully prevents background-color changes but has NO effect on font-size. Nine different approaches were attempted (CSS animations, JavaScript style forcing, MutationObserver, polling, programmatic focus/blur, delayed render) - all failed. The font-size appears small on initial autofill load and becomes correct when user clicks the input (real user interaction triggers Chrome's internal style recalculation). Programmatic `focus()` events do NOT trigger the same recalculation. This is a browser security/UX design decision that cannot be circumvented. **Decision**: Accept as minor cosmetic issue - corrects automatically on first user interaction.

### **PNG Transparency Export (v6.19)**
When exporting PNG with transparency in GIMP, must uncheck "Save background color" option to get true transparency. File location matters - icons at root `/icons/` not `/public/icons/` for proper serving.

### **textContent vs innerHTML for Updates (v6.19)**
Using `textContent` to update elements preserves focus state and doesn't restart CSS animations. Using `innerHTML` recreates DOM elements causing focus loss and animation restarts.

### **CSS :has() Selector Power (v6.19)**
`:has()` pseudo-class enables parent styling based on child state. Example: `#config-header:has(.config-header-group.expanded)` applies blue border when dropdown is expanded.

### **Scroll Service Viewport Awareness (v6.19)**
Selectors should only trigger scroll if their menu would overflow the viewport. Check `getBoundingClientRect().bottom > window.innerHeight` before scrolling.

### **Global CSS Reset Constraint (v5.3.6)**
Found that `* { margin: 0; padding: 0; }` combined with component-level !important declarations prevents normal margin control, requiring architectural workarounds.

### **CSS Table Layout Stability (v6.2)**
CSS Grid's content-based column balancing causes positioning instability. CSS table with `table-layout: fixed` provides content-independent equal columns, eliminating layout shifts.

### **CSS Import Order Dependencies (v5.3.5)**
Import sequence in main style files affects cascade specificity, requiring careful ordering and exclusion selectors for dual-mode patterns.

### **CEMENT System Established (v5.3.2)**
Implemented 🔒 markers to protect critical architectural decisions that solve specific bugs or timing issues.
