import type {
  InternalStudent,
  StudentDirectoryEntry,
  User,
} from "./admin-types";

export type StudentFilterCategory = "ALL" | "INTERNAL" | "EXTERNAL";

export interface FilterStudentDirectoryOptions {
  users: User[];
  internalStudents: InternalStudent[];
  query: string;
  studentType: StudentFilterCategory;
  matchedUsers?: User[] | null;
}

/**
 * Resolves the matching internal roster student record for a given user account.
 */
export function resolveRosterForUser(
  user: User,
  rosterById: Map<string, InternalStudent>,
  rosterByEmail: Map<string, InternalStudent>,
  rosterByStudentId: Map<string, InternalStudent>
): InternalStudent | undefined {
  const membership = user.institutionMembership;
  if (membership?.trustedRecordId) {
    const linked = rosterById.get(membership.trustedRecordId);
    if (linked) return linked;
  }
  if (user.email) {
    const emailMatch = rosterByEmail.get(user.email.trim().toLowerCase());
    if (
      emailMatch &&
      (!emailMatch.authUserId || emailMatch.authUserId === user.authUserId)
    ) {
      return emailMatch;
    }
  }
  const studentIdMatch = membership
    ? rosterByStudentId.get(membership.studentId)
    : undefined;
  return studentIdMatch &&
    (!studentIdMatch.authUserId ||
      studentIdMatch.authUserId === user.authUserId)
    ? studentIdMatch
    : undefined;
}

/**
 * Pure filter function for the Student Directory combining accounts and roster records.
 */
export function filterStudentDirectory({
  users,
  internalStudents,
  query,
  studentType,
  matchedUsers,
}: FilterStudentDirectoryOptions): StudentDirectoryEntry[] {
  const normalizedQuery = query.trim().toLowerCase();

  const rosterById = new Map(
    internalStudents.map((student) => [student.id, student])
  );
  const rosterByEmail = new Map(
    internalStudents
      .filter((student) => student.email)
      .map((student) => [student.email!.trim().toLowerCase(), student])
  );
  const rosterByStudentId = new Map(
    internalStudents.map((student) => [student.studentId, student])
  );

  const rosterForUser = (user: User) =>
    resolveRosterForUser(user, rosterById, rosterByEmail, rosterByStudentId);

  const baseUsers = normalizedQuery ? (matchedUsers ?? users) : users;

  const accountEntries: StudentDirectoryEntry[] = baseUsers
    .filter((user) => {
      const rosterStudent = rosterForUser(user);
      const categoryMatch =
        studentType === "ALL" ||
        user.institutionMembership?.studentCategory === studentType;

      if (!categoryMatch) return false;

      const searchableText = `${user.displayName} ${user.email ?? ""} ${user.phone ?? ""} ${user.institutionMembership?.studentId ?? ""} ${user.institutionMembership?.studentIdHistory?.map((item) => item.studentCode).join(" ") ?? ""} ${rosterStudent?.studentId ?? ""} ${rosterStudent?.fullName ?? ""}`.toLowerCase();

      return searchableText.includes(normalizedQuery);
    })
    .map((user) => ({
      kind: "account",
      id: `account-${user.id}`,
      createdAt: user.createdAt,
      user,
      rosterStudent: rosterForUser(user),
    }));

  const linkedRosterIds = new Set(
    accountEntries
      .map((entry) =>
        entry.kind === "account" ? entry.rosterStudent?.id : undefined
      )
      .filter((id): id is string => Boolean(id))
  );

  const rosterEntries: StudentDirectoryEntry[] = internalStudents
    .filter(
      (student) =>
        !linkedRosterIds.has(student.id) &&
        studentType !== "EXTERNAL" &&
        `${student.fullName ?? ""} ${student.email ?? ""} ${student.studentId}`
          .toLowerCase()
          .includes(normalizedQuery)
    )
    .map((student) => ({
      kind: "roster",
      id: `roster-${student.id}`,
      createdAt: student.createdAt,
      student,
    }));

  return [...accountEntries, ...rosterEntries].sort(
    (left, right) =>
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
  );
}
