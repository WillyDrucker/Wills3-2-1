export function getInitialAppState() {
  return {
    // Static data and overall app status
    todayDayName: "",
    allExercises: [],
    weeklyPlan: {},

    // State for the current workout session
    session: {
      id: Date.now(), // Unique ID for the current workout session
      currentWorkoutPlanName: "Will's 3-2-1:",
      currentDayName: "Sunday",
      currentTimeOptionName: "Recommended:",
      currentLogIndex: 0,
      workoutLog: [],
      isWorkoutComplete: false,
      lastLoggedSet: {
        normal: { index: null, weight: 0, reps: 10 },
        supersetLeft: { index: null, weight: 0, reps: 10 },
        supersetRight: { index: null, weight: 0, reps: 10 },
      },
      activeCardMessage: "Begin Exercise - Log Results",
      activeCardHeaderMessage: "Current Exercise", // CEMENTED FIX: New state property for the header.
      currentExerciseColorClass: "text-plan",
      currentSessionColorClass: "text-plan", /* 🔒 CEMENT: Controls header colors (Minutes Remaining, clock) */
      currentTimerColorClass: "text-plan", /* 🔒 CEMENT: Controls timer colors, separate from headers */
      workoutTimeRemaining: 0,
      playCompletionAnimation: false,
    },

    // State for Superset-specific session data
    superset: {
      isActive: false,
      day1: null,
      day2: null,
      bonusMinutes: 0,
      timeDeductionSetIndexes: [],
    },

    // State for Partner-specific session data
    partner: {
      isActive: false,
      user1Name: "Will",
      user1Day: null,
      user2Name: "Guest",
      user2Day: null,
    },

    // State for Normal and Superset rest timers
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

    // State controlling the UI that isn't part of a session
    ui: {
      currentTime: "0:00 AM", // Real-time clock display
      currentPage: "home", // Can be 'home', 'workout', or 'myData'
      isFullscreen: false,
      activeModal: null, // CEMENTED: 'superset', 'partner', 'reset', etc.
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
      partnerModal: {
        // No specific state needed, managed by central service
      },
      resetConfirmationModal: {
        // No specific state needed, managed by central service
      },
      sideNav: {
        isOpen: false,
      },
      myDataPage: {
        selectedTab: "Workouts", // Can be 'Workouts', 'Conditioning', 'Stretching'
        weekOffset: 0, // 0 is current week, 1 is last week, etc.
      },
    },

    // User-specific data, including persistent history
    user: {
      isLoggedIn: false,
      data: null,
      history: {
        workouts: [], // Array of completed workout session objects
      },
    },
  };
}

export let appState = getInitialAppState();
