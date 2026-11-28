"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/components/admin/admin-api";
import { AdminWorkspaceContentSkeleton } from "@/components/skeletons/admin/admin-content-skeleton";
import type { ResultsOverview } from "@/lib/results-store";
import { exportResultsLeaderboardToExcel } from "./results-export";
import { ResultsSummaryCards } from "./results-summary-cards";
import { ResultsLeaderboardTable } from "./results-leaderboard-table";
import { ResultsChapterInsights } from "./results-chapter-insights";

interface ResultsSectionProps {
  onNotice: (msg: string) => void;
  onError: (msg: string) => void;
}

export function ResultsSection({ onNotice, onError }: ResultsSectionProps) {
  const [data, setData] = useState<ResultsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<
    "ALL" | "INTERNAL" | "EXTERNAL"
  >("ALL");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const filterKey = `${searchQuery}|${categoryFilter}`;
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey);
    setPage(1);
  }

  const loadData = useCallback(
    async (quiet = false) => {
      if (quiet) setRefreshing(true);
      else setLoading(true);
      try {
        const payload = await api<ResultsOverview>("results");
        setData(payload);
      } catch {
        onError("Failed to load results and performance analytics");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [onError],
  );

  useEffect(() => {
    let active = true;
    api<ResultsOverview>("results")
      .then((payload) => {
        if (active) setData(payload);
      })
      .catch(() => {
        if (active) {
          onError("Failed to load results and performance analytics");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [onError]);

  const handleExportExcel = async () => {
    if (!data || exporting) return;
    setExporting(true);
    try {
      await exportResultsLeaderboardToExcel(data);
      onNotice("Results exported to Excel successfully");
    } catch {
      onError("Failed to export results");
    } finally {
      setExporting(false);
    }
  };

  const filteredLeaderboard = useMemo(() => {
    const rows = data?.leaderboard || [];
    const q = searchQuery.trim().toLowerCase();
    return rows.filter((item) => {
      if (categoryFilter !== "ALL" && item.category !== categoryFilter) {
        return false;
      }
      if (q) {
        return (
          item.studentName.toLowerCase().includes(q) ||
          item.studentId.toLowerCase().includes(q) ||
          item.testName.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [data?.leaderboard, categoryFilter, searchQuery]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredLeaderboard.length / pageSize),
  );
  const currentPage = Math.min(page, totalPages);
  const paginatedLeaderboard = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredLeaderboard.slice(start, start + pageSize);
  }, [filteredLeaderboard, currentPage, pageSize]);

  if (loading && !data) {
    return <AdminWorkspaceContentSkeleton section="results" />;
  }

  return (
    <div className="space-y-6">
      <ResultsSummaryCards
        data={data}
        refreshing={refreshing}
        exporting={exporting}
        onRefresh={() => void loadData(true)}
        onExportExcel={() => void handleExportExcel()}
        onPrint={() => window.print()}
      />

      <ResultsLeaderboardTable
        paginatedRows={paginatedLeaderboard}
        totalFilteredCount={filteredLeaderboard.length}
        page={currentPage}
        pageSize={pageSize}
        categoryFilter={categoryFilter}
        searchQuery={searchQuery}
        onCategoryFilterChange={setCategoryFilter}
        onSearchQueryChange={setSearchQuery}
        onPageChange={setPage}
        onClearFilters={() => {
          setSearchQuery("");
          setCategoryFilter("ALL");
        }}
      />

      {data?.chapterInsights && data.chapterInsights.length > 0 && (
        <ResultsChapterInsights insights={data.chapterInsights} />
      )}
    </div>
  );
}
