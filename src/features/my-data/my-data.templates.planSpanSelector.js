/* ==========================================================================
   MY DATA - Plan Span Selector Template

   Generates plan span selector HTML for Plan Results page. Shows high-level
   plan progress with weeks reached and body parts logged per week.

   Architecture:
   - Always expanded (no collapse/expand functionality)
   - Green border (vs blue for workout session selector)
   - 9px padding from border (matches workout selector)
   - Week entries: 50px left indent
   - Body part entries: 100px left indent
   - Font sizes/weights: Match workout session selector exactly

   Data Source:
   - Plan progress entries from plan_progress table
   - Workout history to calculate body parts per week
   - Week calculation based on plan start date

   Display Rules:
   - Only show plans with logged data in database
   - Only show weeks that have been reached by date
   - Only show body parts if at least one set was logged that week
   - Empty weeks still show "Week #" label

   Dependencies: appState, getPlanWeeksReached utility
   Used by: my-data.template.js (Plan Results section)
   ========================================================================== */

import { appState } from "state";
import { getPlanWeeksReached } from "utils";

/**
 * Format date as abbreviated month + day (e.g., "Nov 7")
 * @param {Date} date - Date to format
 * @returns {string} Formatted date string
 */
function formatDateAbbreviated(date) {
  const month = date.toLocaleString('en-US', { month: 'short' });
  const day = date.getDate();
  return `${month} ${day}`;
}

/**
 * Get the Sunday of the week containing the given date
 * Matches the week calculation used in My Workout Results calendar
 * @param {Date} date - Any date
 * @returns {Date} Sunday of that week
 */
function getStartOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sunday, 6 = Saturday
  const diff = -day; // Go back to Sunday of this week
  const sunday = new Date(d);
  sunday.setDate(d.getDate() + diff);
  return sunday;
}

/**
 * Get week range for a specific week in a plan (Sunday-Saturday)
 * Aligns with My Workout Results calendar week boundaries
 * @param {Date} planStartDate - When the plan started
 * @param {number} weekNumber - Week number (1-indexed)
 * @returns {string} Week range (e.g., "Nov 3-9")
 */
function getWeekRangeForPlanWeek(planStartDate, weekNumber) {
  // Find the Sunday of the week containing the plan start date (Week 1 starts here)
  const week1Sunday = getStartOfWeek(planStartDate);

  // Calculate this week's Sunday (0-indexed offset from Week 1)
  const thisWeekSunday = new Date(week1Sunday);
  thisWeekSunday.setDate(week1Sunday.getDate() + (weekNumber - 1) * 7);

  // Saturday is 6 days later
  const thisWeekSaturday = new Date(thisWeekSunday);
  thisWeekSaturday.setDate(thisWeekSunday.getDate() + 6);

  const startMonth = thisWeekSunday.toLocaleString('en-US', { month: 'short' });
  const endMonth = thisWeekSaturday.toLocaleString('en-US', { month: 'short' });
  const startDay = thisWeekSunday.getDate();
  const endDay = thisWeekSaturday.getDate();

  // If same month, show "Nov 3-9", otherwise "Oct 28-Nov 3"
  if (startMonth === endMonth) {
    return `${startMonth} ${startDay}-${endDay}`;
  } else {
    return `${startMonth} ${startDay}-${endMonth} ${endDay}`;
  }
}

/**
 * Get unique body parts logged for a specific week in a plan
 * @param {string} planId - Plan name (e.g., "Will's 3-2-1")
 * @param {Date} planStartDate - When the plan started
 * @param {number} weekNumber - Week number (1-indexed)
 * @returns {string[]} Array of unique body part names
 */
function getBodyPartsForWeek(planId, planStartDate, weekNumber) {
  const workouts = appState.user.history.workouts || [];

  // Calculate Sunday-Saturday date range for this week (aligned with calendar view)
  // Week 1 starts on the Sunday of the week containing the plan start date
  const week1Sunday = getStartOfWeek(planStartDate);

  // Calculate this week's Sunday (0-indexed offset from Week 1)
  const weekStartDate = new Date(week1Sunday);
  weekStartDate.setDate(week1Sunday.getDate() + (weekNumber - 1) * 7);

  // Saturday is 6 days later
  const weekEndDate = new Date(weekStartDate);
  weekEndDate.setDate(weekStartDate.getDate() + 6);
  weekEndDate.setHours(23, 59, 59, 999);

  // Normalize planId by removing trailing colon (planId from DB has no colon, but workout.planName may have one)
  const normalizedPlanId = planId.replace(/:$/, '');

  // Filter workouts for this plan and week
  const weekWorkouts = workouts.filter(workout => {
    // Normalize workout plan name for comparison (remove trailing colon)
    const workoutPlanName = (workout.planName || '').replace(/:$/, '');
    if (workoutPlanName !== normalizedPlanId) return false;

    const workoutDate = new Date(workout.timestamp);
    return workoutDate >= weekStartDate && workoutDate <= weekEndDate;
  });

  // Extract unique body parts with logged dates (only if at least one set was logged)
  const bodyPartsMap = new Map(); // Map<bodyPart, earliestDate>

  weekWorkouts.forEach(workout => {
    // Only include if workout has logged sets
    if (workout.logs && workout.logs.length > 0) {
      // Check if at least one set was completed (not skipped)
      const hasCompletedSet = workout.logs.some(log => log.status === 'completed');
      if (hasCompletedSet) {
        const bodyPart = workout.bodyPart;
        const workoutDate = new Date(workout.timestamp);

        // Keep the earliest date for each body part
        if (!bodyPartsMap.has(bodyPart) || workoutDate < bodyPartsMap.get(bodyPart).date) {
          bodyPartsMap.set(bodyPart, {
            name: bodyPart,
            date: workoutDate,
            dateString: formatDateAbbreviated(workoutDate)
          });
        }
      }
    }
  });

  // Sort chronologically by date (Sunday-Saturday order)
  return Array.from(bodyPartsMap.values()).sort((a, b) => a.date - b.date);
}

/**
 * Generate HTML for a single plan span selector
 * @param {Object} planProgress - Plan progress entry from plan_progress table
 * @returns {string} HTML for plan span selector
 */
export function getPlanSpanSelectorHTML(planProgress) {
  const { id, plan_id, plan_duration_weeks, start_date } = planProgress;

  // Format plan activation date
  const planStartDate = new Date(start_date);
  const activationDate = formatDateAbbreviated(planStartDate);

  // Calculate which weeks have been reached based on current date
  const weeksReached = getPlanWeeksReached(start_date, plan_duration_weeks);

  // Generate week entries with body parts
  const weekEntriesHtml = weeksReached.map(weekNumber => {
    const bodyParts = getBodyPartsForWeek(plan_id, planStartDate, weekNumber);
    const weekRange = getWeekRangeForPlanWeek(planStartDate, weekNumber);

    // Week label with date range (50px indent via CSS, date right-aligned)
    const weekLabelHtml = `<div class="plan-week-label">
      <span class="plan-week-text">Week ${weekNumber}</span>
      <span class="plan-week-date data-highlight text-plan">${weekRange}</span>
    </div>`;

    // Body part entries (100px indent via CSS) - body part name in gray, date in green (right-aligned)
    const bodyPartsHtml = bodyParts.length > 0
      ? bodyParts.map(bodyPart =>
          `<div class="plan-body-part-label">
             <span class="plan-body-part-text">${bodyPart.name}</span>
             <span class="plan-body-part-date data-highlight text-plan">${bodyPart.dateString}</span>
           </div>`
        ).join('')
      : '';

    return weekLabelHtml + bodyPartsHtml;
  }).join('');

  // Plan name header with activation date (right-aligned, green)
  const planNameHtml = `<div class="plan-name-label">
    <span class="plan-name-text">
      <span class="text-info">${plan_id}:</span> <span class="data-highlight text-plan">${plan_duration_weeks} Weeks</span>
    </span>
    <span class="plan-activation-date data-highlight text-plan">${activationDate}</span>
  </div>`;

  // Check if this plan span selector is active or should be muted
  const selectedPlanProgressId = appState.ui.myDataPage.selectedPlanProgressId;
  const isActive = selectedPlanProgressId === id;
  const hasActiveSelection = selectedPlanProgressId !== null;
  const isMuted = hasActiveSelection && !isActive;

  const activeClass = isActive ? ' is-active' : '';
  const mutedClass = isMuted ? ' is-muted' : '';

  // Render Cancel/Clear buttons when selector is active
  const buttonsHtml = isActive
    ? `<div class="plan-span-buttons">
         <button class="plan-span-cancel-button" data-action="cancelPlanSpanSelection">Cancel</button>
         <button class="plan-span-clear-button" data-action="clearPlanProgress" data-plan-progress-id="${id}">Clear</button>
       </div>`
    : '';

  return `<div class="plan-span-selector${activeClass}${mutedClass}" data-plan-progress-id="${id}" data-action="selectPlanSpan">
    <div class="plan-span-content">
      ${planNameHtml}
      ${weekEntriesHtml}
    </div>
    ${buttonsHtml}
  </div>`;
}

/**
 * Generate HTML for all plan span selectors
 * Loops through plan progress entries and creates selectors with 16px spacing
 * @returns {string} HTML for all plan span selectors
 */
export function getAllPlanSpanSelectorsHTML() {
  const planProgress = appState.user.history.planProgress || [];
  const workouts = appState.user.history.workouts || [];

  // Filter to show: active plan always, and switched/completed plans only if they have logged workouts
  const visiblePlans = planProgress.filter(plan => {
    // Must have valid status
    if (plan.status !== 'active' && plan.status !== 'completed' && plan.status !== 'switched') {
      return false;
    }

    // Always show active plan (even if no workouts yet)
    if (plan.status === 'active') {
      return true;
    }

    // For switched/completed plans, only show if they have logged workouts with this plan name
    const normalizedPlanId = plan.plan_id.replace(/:$/, '');

    const hasLoggedWorkouts = workouts.some(workout => {
      const normalizedWorkoutPlan = (workout.planName || '').replace(/:$/, '');

      // Check if workout belongs to this plan (by name only - ignore date range)
      if (normalizedWorkoutPlan !== normalizedPlanId) return false;

      // Check if workout has completed sets
      return workout.logs && workout.logs.length > 0 && workout.logs.some(log => log.status === 'completed');
    });

    return hasLoggedWorkouts;
  });

  if (visiblePlans.length === 0) {
    return '<p class="plan-results-placeholder">No plan data available yet.</p>';
  }

  // Sort by start_date descending (newest first)
  const sortedPlans = visiblePlans.sort((a, b) => {
    const dateA = new Date(a.start_date);
    const dateB = new Date(b.start_date);
    return dateB - dateA; // Newest first
  });

  // Generate selector for each plan with 16px margin between them
  return sortedPlans.map((plan, index) => {
    const selectorHtml = getPlanSpanSelectorHTML(plan);
    const marginClass = index > 0 ? ' plan-span-margin-top' : '';
    return `<div class="plan-span-container${marginClass}">${selectorHtml}</div>`;
  }).join('');
}
