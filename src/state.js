/* ==========================================================================
   STATE - Application state management

   Central state tree for entire application. Defines initial state structure
   and provides state reset function.

   State tree sections:
   1. Static data: Exercise database, weekly plan, current day
   2. Session: Current workout state, logs, progress
   3. Superset: Dual-mode workout state (day1/day2)
   4. Partner: Partner workout state (user1/user2)
   5. Rest timers: Normal and superset rest timer states
   6. UI: Page navigation, modals, video player, side nav, My Data, My Plan
   7. Plan: Training plans database
   8. Auth: Authentication state (isAuthenticated, isGuest, user, session)
   9. User: User history and persistent data

   CEMENT: Color class separation for independent styling
   - currentSessionColorClass: Header colors (Minutes Remaining, clock)
   - currentTimerColorClass: Timer colors (independent from headers)
   - currentExerciseColorClass: Exercise-specific coloring

   Dependencies: utils (formatTime12Hour)
   Used by: All services and features requiring state access
   ========================================================================== */

import { formatTime12Hour } from "utils";

export function getInitialAppState() {
  return {
    todayDayName: "",
    allExercises: [],
    weeklyPlan: {},

    session: {
      id: Date.now(),
      currentWorkoutName: "Will's 3-2-1:",
      currentDayName: "Sunday",
      currentTimeOptionName: "Standard:",
      currentLogIndex: 0,
      workoutLog: [],
      isWorkoutComplete: false,
      lastLoggedSet: {
        normal: { index: null, weight: 0, reps: 10 },
        supersetLeft: { index: null, weight: 0, reps: 10 },
        supersetRight: { index: null, weight: 0, reps: 10 },
      },
      activeCardMessage: "Begin Exercise - Log Results",
      activeCardHeaderMessage: "Current Exercise",
      currentExerciseColorClass: "text-plan",
      currentSessionColorClass: "text-plan",
      currentTimerColorClass: "text-plan",
      workoutTimeRemaining: 0,
      playCompletionAnimation: false,
    },

    superset: {
      isActive: false,
      day1: null,
      day2: null,
      bonusMinutes: 0,
      timeDeductionSetIndexes: [],
    },

    partner: {
      isActive: false,
      user1Name: "Will",
      user1Day: null,
      user2Name: "Guest",
      user2Day: null,
    },

    rest: {
      normal: {
        type: "none",
        timerId: null,
        startTime: null,
        timeRemaining: 300,
        completedSegments: Array(5).fill(false),
        animatingSegments: Array(5).fill(false),
        isFadingOut: false,
        finalAnimationType: "none",
        triggeringSetIndex: null,
        triggeringCycleId: null,
        animationStartTime: null,
      },
      superset: {
        left: {
          type: "none",
          timerId: null,
          startTime: null,
          timeRemaining: 300,
          completedSegments: Array(5).fill(false),
          animatingSegments: Array(5).fill(false),
          isFadingOut: false,
          finalAnimationType: "none",
          triggeringSetIndex: null,
          triggeringCycleId: null,
          animationStartTime: null,
        },
        right: {
          type: "none",
          timerId: null,
          startTime: null,
          timeRemaining: 300,
          completedSegments: Array(5).fill(false),
          animatingSegments: Array(5).fill(false),
          isFadingOut: false,
          finalAnimationType: "none",
          triggeringSetIndex: null,
          triggeringCycleId: null,
          animationStartTime: null,
        },
      },
    },

    ui: {
      currentTime: formatTime12Hour(new Date()),
      currentPage: "home",
      isFullscreen: false,
      isConfigHeaderExpanded: false,
      configHeaderLocked: false,
      wasConfigHeaderExpandedBeforeModal: false,
      isLetsGoButtonPulsing: false,
      activeModal: null,
      selectedWorkoutId: null,
      selectedHistoryWorkoutId: null,
      deleteLogContext: null,
      editWorkout: {
        originalWorkout: null, // Deep clone of workout before editing
        hasChanges: false, // Track if user made any changes
        changeCount: 0, // Number of changes detected (for display in Cancel modal)
      },
      modal: {
        elementToFocusOnClose: null,
      },
      scrollAfterRender: {
        target: null,
      },
      videoPlayer: {
        isVisible: false,
        videoId: null,
        isApiReady: false,
        isCountdownActive: false,
        countdownLine1: "",
        countdownLine2: "",
        countdownTimerIds: [],
      },
      supersetModal: {
        selection: {
          day1: null,
          day2: null,
        },
        error: null,
      },
      partnerModal: {},
      resetConfirmationModal: {},
      sideNav: {
        isOpen: false,
      },
      myDataPage: {
        selectedTab: "Workouts",
        weekOffset: 0,
        scrollPosition: 0,
      },
      myPlanPage: {
        selectedPlanId: "Will's 3-2-1",
        activePlanId: "Will's 3-2-1",
        startDate: null,
        currentWeekNumber: null,
        planHistory: [],
      },
    },

    plan: {
      plans: [],
    },

    auth: {
      isAuthenticated: false,
      isGuest: false,
      user: null,
      session: null,
    },

    user: {
      history: {
        workouts: [],
      },
    },
  };
}

export let appState = getInitialAppState();
