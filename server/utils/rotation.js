const dayjs = require("dayjs");

const ROTATION_START = dayjs("2026-01-05"); // Monday

function getRotationWeek(date) {
  const diff = dayjs(date).diff(ROTATION_START, "week");
  return Math.abs(diff % 2);
}

function isDesignatedDay(user, date) {
  const day = dayjs(date).day(); // 0 Sun - 6 Sat
  const rotationWeek = getRotationWeek(date);

  // Week 0 pattern
  if (rotationWeek === 0) {
    if (user.batch === 1) {
      return day >= 1 && day <= 3; // Mon Tue Wed
    } else {
      return day >= 4 && day <= 5; // Thu Fri
    }
  }

  // Week 1 pattern (reverse)
  if (rotationWeek === 1) {
    if (user.batch === 1) {
      return day >= 4 && day <= 5; // Thu Fri
    } else {
      return day >= 1 && day <= 3; // Mon Tue Wed
    }
  }

  return false;
}

module.exports = { isDesignatedDay };