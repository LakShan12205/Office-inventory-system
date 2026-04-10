import { ReplacementRecord } from "@/lib/types";

export function getReplacementOperationalStatus(record: ReplacementRecord) {
  if (record.status === "REMOVED" || record.isReturned) return "RETURNED";
  if (record.status === "PENDING_RESTORE" || record.replacementType === "PERMANENT") {
    return "PERMANENT";
  }

  const expected = record.repair?.expectedReturnDate;
  if (record.status === "ACTIVE" && expected && new Date(expected) < new Date()) {
    return "OVERDUE";
  }

  return "ACTIVE";
}
