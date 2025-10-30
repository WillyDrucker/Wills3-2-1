/* ==========================================================================
   LOGIN PAGE - Timing Constants

   Centralized authentication timing constants for consistent UX across all
   login handlers. These values control button state transitions, success/error
   displays, and animation durations.

   Timing Philosophy:
   - Quick feedback: 600ms for success states (checking, logged in)
   - Smooth transitions: 1000ms for multi-step flows (signup transitions)
   - Complete animations: 1700ms for error flash (3 pulses × 560ms)

   Used by: All login page handlers (signin, signup, reset, guest, buttonstate)
   ========================================================================== */

// Authentication check delay - "Checking..." state duration
export const AUTH_CHECK_DURATION = 600; // 600ms - Quick feedback

// Success display duration - "Logged In!" state
export const AUTH_SUCCESS_DURATION = 600; // 600ms - Quick confirmation

// State transition delays - "Already Registered!" → "Logging In..." flow
export const AUTH_TRANSITION_DURATION = 1000; // 1000ms - Smooth multi-step transitions

// Error animation duration - Red flash with restore
// CSS animation: button-red-pulse @ 560ms × 3 pulses = 1680ms total
// Buffer: 20ms (smaller than standard 100ms - error animations need tighter timing)
export const AUTH_ERROR_DURATION = 1700; // 1700ms = 1680ms animation + 20ms buffer
