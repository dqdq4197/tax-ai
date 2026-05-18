import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";

export function formatRelativeDate(date: Date): string {
  return formatDistanceToNow(date, { addSuffix: true, locale: ko });
}
