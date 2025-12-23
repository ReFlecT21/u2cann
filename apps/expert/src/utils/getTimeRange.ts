import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);
dayjs.extend(timezone);
const tz = "Asia/Singapore";

export function getOneDayRange(date: Date) {
  const start = dayjs(date).tz(tz).hour(0).minute(0).second(0).millisecond(0);
  const end = dayjs(date)
    .tz(tz)
    .hour(23)
    .minute(59)
    .second(59)
    .millisecond(999);
  return { start: start.toDate(), end: end.toDate() };
}

export function getIntervals(date: Date | null | undefined, length = 2) {
  if (length > 24) {
    throw new Error("Length cannot be more than 24 hours");
  }
  if (!date) {
    return { intervals: [], current: null };
  }
  const intervals = [];
  let currentInterval: number | null = null;
  for (let i = 0; i < 24 / length; i++) {
    const start = new Date(date);
    start.setHours(i * length, 0, 0, 0);
    const end = new Date(date);
    if (Math.floor(24 / length) === i + 1) {
      end.setHours(23, 59, 59, 999);
    } else {
      end.setHours((i + 1) * length, 0, 0, 0);
    }
    intervals.push({ start, end, future: currentInterval ? false : true });

    if (start.getTime() <= date.getTime() && date.getTime() <= end.getTime()) {
      currentInterval = i;
    }
  }
  return { intervals, current: currentInterval };
}
