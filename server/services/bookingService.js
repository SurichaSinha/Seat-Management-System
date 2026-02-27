const Booking = require("../models/Booking");
const Seat = require("../models/Seat");
const Holiday = require("../models/Holiday");
const dayjs = require("dayjs");
const weekOfYear = require("dayjs/plugin/weekOfYear");
dayjs.extend(weekOfYear);

//Weekend Check
const isWeekend = (date) => {
  const day = dayjs(date).day();
  return day === 0 || day === 6;
};

//Holiday Check
const isHoliday = async (date) => {
  const holiday = await Holiday.findOne({
    date: dayjs(date).startOf("day").toDate()
  });
  return !!holiday;
};

//Check if Date in Current or Next Week
const isWithinAllowedDesignatedWindow = (date) => {
  const now = dayjs();
  const bookingWeek = dayjs(date).week();
  const currentWeek = now.week();

  return bookingWeek === currentWeek || bookingWeek === currentWeek + 1;
};

//Floater Rule (Tomorrow + After 10AM)
const canBookFloater = (date) => {
  const now = dayjs();
  const tomorrow = now.add(1, "day").startOf("day");

  const bookingDate = dayjs(date).startOf("day");

  if (!bookingDate.isSame(tomorrow)) return false;
  if (now.hour() < 10) return false;

  return true;
};

//Check If It's User's Designated Batch Day
const isUserBatchDay = (user, date) => {
  const week = dayjs(date).week();
  const day = dayjs(date).day(); // 0-6

  if (user.batch === 1) {
    return week % 2 === 0 && [1, 2, 3].includes(day);
  }

  if (user.batch === 2) {
    return week % 2 !== 0 && [4, 5].includes(day);
  }

  return false;
};

module.exports = {
  isWeekend,
  isHoliday,
  isWithinAllowedDesignatedWindow,
  canBookFloater,
  isUserBatchDay
};