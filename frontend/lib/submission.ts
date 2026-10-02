export const submissionTypes = ["booking", "ticket", "job", "leader"] as const;
export type SubmissionType = (typeof submissionTypes)[number];

export function clean(value: FormDataEntryValue | null, max = 500) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export function isPhone(value: string) {
  return /^\+?[0-9][0-9 ]{8,14}$/.test(value);
}
