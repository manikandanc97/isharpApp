import { useEffect, useMemo, useState } from "react";
import { api } from "./admin-api";
import type { InternalStudent, User } from "./admin-types";
import {
  filterStudentDirectory,
  type StudentFilterCategory,
} from "./student-search-utils";

export interface UseStudentSearchOptions {
  users: User[];
  internalStudents: InternalStudent[];
  pageSize?: number;
  onError?: (message: string) => void;
}

export function useStudentSearch({
  users,
  internalStudents,
  pageSize = 10,
  onError,
}: UseStudentSearchOptions) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [studentType, setStudentType] = useState<StudentFilterCategory>("ALL");
  const [matchedUsers, setMatchedUsers] = useState<User[] | null>(null);

  // Debounced server search for larger user databases
  useEffect(() => {
    const normalized = query.trim();
    if (!normalized) return;

    let cancelled = false;
    const timer = window.setTimeout(() => {
      void api<User[]>(`users?query=${encodeURIComponent(normalized)}`)
        .then((result) => {
          if (!cancelled) setMatchedUsers(result);
        })
        .catch((error: unknown) => {
          if (!cancelled && onError) {
            onError(
              error instanceof Error ? error.message : "Student search failed"
            );
          }
        });
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [onError, query]);

  // Pure memoized filtering of accounts and roster
  const filtered = useMemo(() => {
    return filterStudentDirectory({
      users,
      internalStudents,
      query,
      studentType,
      matchedUsers,
    });
  }, [internalStudents, matchedUsers, query, studentType, users]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedEntries = useMemo(() => {
    return filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  }, [currentPage, filtered, pageSize]);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    setMatchedUsers(null);
    setPage(1);
  };

  const handleStudentTypeChange = (type: StudentFilterCategory) => {
    setStudentType(type);
    setPage(1);
  };

  const resetSearch = () => {
    setQuery("");
    setMatchedUsers(null);
    setPage(1);
  };

  return {
    query,
    setQuery: handleQueryChange,
    studentType,
    setStudentType: handleStudentTypeChange,
    page: currentPage,
    setPage,
    totalPages,
    pageSize,
    filtered,
    paginatedEntries,
    resetSearch,
  };
}
