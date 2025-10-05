import { appState } from "state";
import { timeOptions } from "config";
import * as workoutLogGenerationService from "services/workout/workoutLogGenerationService.js";

function _getLedgerSide(session, day1Source, day2Source) {
  const sessionType = timeOptions.find(
    (t) => t.name === session.currentTimeOptionName
  )?.type;
  if (!sessionType) return "left";

  const tempLog1 = workoutLogGenerationService.generateWorkoutLog(
    true,
    sessionType,
    day1Source
  );
  const tempLog2 = workoutLogGenerationService.generateWorkoutLog(
    true,
    sessionType,
    day2Source
  );

  if (tempLog1.length > tempLog2.length) {
    return "left";
  }
  return "right";
}

export function calculateRemainingTime(
  session,
  superset,
  partner,
  rest,
  baselineDuration,
  bonusMinutes = 0
) {
  const { workoutLog } = session;
  if (workoutLog.length === 0) return 0;

  let ledgerSide = null;

  if (superset.isActive) {
    ledgerSide = _getLedgerSide(session, superset.day1, superset.day2);
  } else if (partner.isActive) {
    ledgerSide = _getLedgerSide(session, partner.user1Day, partner.user2Day);
  }

  let timeSpent = 0;
  workoutLog.forEach((log, index) => {
    if (ledgerSide && log.supersetSide !== ledgerSide) {
      return;
    }

    if (log.status === "pending") {
      return;
    }

    timeSpent += 1;

    if (log.restCompleted) {
      timeSpent += 5;
    } else {
      const restStateForThisLog = log.supersetSide
        ? rest.superset[log.supersetSide]
        : rest.normal;

      if (
        restStateForThisLog.type !== "none" &&
        restStateForThisLog.triggeringSetIndex === index
      ) {
        const elapsedSeconds =
          (Date.now() - restStateForThisLog.startTime) / 1000;
        const minutesElapsed = Math.floor(elapsedSeconds / 60);
        timeSpent += minutesElapsed;
      }
    }
  });

  let finalTime = baselineDuration + bonusMinutes;

  return Math.max(0, Math.round(finalTime - timeSpent));
}
