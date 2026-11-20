"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpDown,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Copy,
  Edit2,
  Eye,
  FileQuestion,
  MoreVertical,
  Search,
  Trash2,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TablePagination } from "@/components/admin/admin-helpers";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import type { TestSeries, TestSeriesCategory, TestSeriesStatus } from "./types";

interface TestSeriesTableProps {
  series: TestSeries[];
  categories: TestSeriesCategory[];
  onViewSeries: (series: TestSeries) => void;
  onEditSeries: (series: TestSeries) => void;
  onDuplicateSeries: (id: string) => Promise<void>;
  onTogglePublishSeries: (series: TestSeries) => Promise<void>;
  onDeleteSeries: (id: string) => Promise<void>;
  onOpenCategoryManager: () => void;
}

export function TestSeriesTable({
  series,
  categories,
  onViewSeries,
  onEditSeries,
  onDuplicateSeries,
  onTogglePublishSeries,
  onDeleteSeries,
  onOpenCategoryManager,
}: TestSeriesTableProps) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [yearFilter, setYearFilter] = useState("ALL");
  const [sortField, setSortField] = useState<"name" | "createdAt" | "totalTests">("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const pageSize = 10;

  // Reset page when search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, categoryFilter, statusFilter, yearFilter, sortField, sortOrder]);

  // Extract unique academic years
  const academicYears = useMemo(() => {
    const years = new Set<string>();
    series.forEach((s) => {
      if (s.academicYear) years.add(s.academicYear);
    });
    return Array.from(years);
  }, [series]);

  // Filter & Sort
  const filteredSeries = useMemo(() => {
    return series
      .filter((s) => {
        if (categoryFilter !== "ALL" && s.categoryId !== categoryFilter) return false;
        if (statusFilter !== "ALL" && s.status !== statusFilter) return false;
        if (yearFilter !== "ALL" && s.academicYear !== yearFilter) return false;
        if (search.trim()) {
          const q = search.toLowerCase();
          const match =
            s.name.toLowerCase().includes(q) ||
            (s.description?.toLowerCase().includes(q) ?? false) ||
            (s.categoryName?.toLowerCase().includes(q) ?? false);
          if (!match) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortField === "name") {
          return sortOrder === "asc"
            ? a.name.localeCompare(b.name)
            : b.name.localeCompare(a.name);
        }
        if (sortField === "totalTests") {
          return sortOrder === "asc"
            ? (a.totalTests || 0) - (b.totalTests || 0)
            : (b.totalTests || 0) - (a.totalTests || 0);
        }
        // default createdAt
        return sortOrder === "asc"
          ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [series, categoryFilter, statusFilter, yearFilter, search, sortField, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(filteredSeries.length / pageSize));
  const validPage = Math.min(currentPage, totalPages);
  const paginatedSeries = useMemo(() => {
    const start = (validPage - 1) * pageSize;
    return filteredSeries.slice(start, start + pageSize);
  }, [filteredSeries, validPage, pageSize]);

  const toggleSort = (field: "name" | "createdAt" | "totalTests") => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  return (
    <section className="space-y-4">
      {/* Search & Filters Toolbar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          {/* Search Box */}
          <div className="relative min-w-[200px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search series by title or keyword..."
              className="h-9 pl-8 text-xs bg-slate-50/50"
            />
          </div>

          {/* Category Filter */}
          <Select
            value={categoryFilter}
            onValueChange={(val) => {
              if (val) setCategoryFilter(val);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="h-9 w-[150px] text-xs font-medium bg-white">
              <SelectValue placeholder="Category">
                {categoryFilter === "ALL"
                  ? "All Categories"
                  : categories.find((c) => c.id === categoryFilter)?.name || categoryFilter}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL" label="All Categories" className="text-xs">All Categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id} label={c.name} className="text-xs">
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Status Filter */}
          <Select
            value={statusFilter}
            onValueChange={(val) => {
              if (val) setStatusFilter(val);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="h-9 w-[130px] text-xs font-medium bg-white">
              <SelectValue placeholder="Status">
                {statusFilter === "ALL"
                  ? "All Statuses"
                  : statusFilter === "PUBLISHED"
                  ? "Published"
                  : statusFilter === "DRAFT"
                  ? "Draft"
                  : "Archived"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL" label="All Statuses" className="text-xs">All Statuses</SelectItem>
              <SelectItem value="PUBLISHED" label="Published" className="text-xs">Published</SelectItem>
              <SelectItem value="DRAFT" label="Draft" className="text-xs">Draft</SelectItem>
              <SelectItem value="ARCHIVED" label="Archived" className="text-xs">Archived</SelectItem>
            </SelectContent>
          </Select>

          {/* Academic Year Filter */}
          <Select
            value={yearFilter}
            onValueChange={(val) => {
              if (val) setYearFilter(val);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="h-9 w-[120px] text-xs font-medium bg-white">
              <SelectValue placeholder="Year">
                {yearFilter === "ALL" ? "All Years" : yearFilter}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL" label="All Years" className="text-xs">All Years</SelectItem>
              {academicYears.map((yr) => (
                <SelectItem key={yr} value={yr} label={yr} className="text-xs">
                  {yr}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-end md:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenCategoryManager}
            className="h-9 rounded-full border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs"
          >
            Manage Categories
          </Button>
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-100 bg-slate-50/75 text-3xs font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th
                  onClick={() => toggleSort("name")}
                  className="cursor-pointer py-3.5 pl-5 pr-3 hover:text-slate-900"
                >
                  <div className="flex items-center gap-1.5">
                    Series Name
                    <ArrowUpDown className="size-3" />
                  </div>
                </th>
                <th className="px-3 py-3.5">Category</th>
                <th className="px-3 py-3.5">Academic Year</th>
                <th
                  onClick={() => toggleSort("totalTests")}
                  className="cursor-pointer px-3 py-3.5 hover:text-slate-900"
                >
                  <div className="flex items-center gap-1.5">
                    Tests
                    <ArrowUpDown className="size-3" />
                  </div>
                </th>
                <th className="px-3 py-3.5">Status</th>
                <th
                  onClick={() => toggleSort("createdAt")}
                  className="cursor-pointer px-3 py-3.5 hover:text-slate-900"
                >
                  <div className="flex items-center gap-1.5">
                    Created Date
                    <ArrowUpDown className="size-3" />
                  </div>
                </th>
                <th className="py-3.5 pl-3 pr-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {paginatedSeries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-slate-400">
                    No test series match your filters.
                  </td>
                </tr>
              ) : (
                paginatedSeries.map((s) => {
                  const cat = categories.find((c) => c.id === s.categoryId);

                  return (
                    <tr
                      key={s.id}
                      className="group transition hover:bg-slate-50/70"
                    >
                      <td className="py-3.5 pl-5 pr-3">
                        <div
                          onClick={() => onViewSeries(s)}
                          className="cursor-pointer font-bold text-slate-900 hover:text-brand-red transition"
                        >
                          {s.name}
                        </div>
                        {s.description && (
                          <p className="mt-0.5 line-clamp-1 text-3xs font-normal text-slate-400">
                            {s.description}
                          </p>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3.5">
                        <span className="rounded-md bg-blue-50 px-2 py-0.5 text-2xs font-bold text-brand-blue border border-blue-200">
                          {cat?.name || s.categoryName || "Grade Course"}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-3.5 font-mono text-2xs text-slate-600">
                        {s.academicYear}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3.5">
                        <span className="rounded-md bg-purple-50 px-2 py-0.5 font-mono text-2xs font-bold text-purple-700">
                          {s.totalTests || s.tests?.length || 0} Tests
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-3.5">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-3xs font-bold ${
                            s.status === "PUBLISHED"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : s.status === "DRAFT"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-slate-100 text-slate-600 border border-slate-200"
                          }`}
                        >
                          {s.status}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-3.5 text-3xs text-slate-500">
                        {new Date(s.createdAt).toLocaleDateString()}
                      </td>
                      <td className="whitespace-nowrap py-3.5 pl-3 pr-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onViewSeries(s)}
                            className="h-7 gap-1 rounded-full text-3xs font-semibold border-slate-200 text-slate-700 hover:bg-slate-100"
                          >
                            <FileQuestion className="size-3 text-brand-blue" />
                            Manage Tests
                          </Button>

                          <DropdownMenu>
                            <DropdownMenuTrigger
                              disabled={processingId === s.id}
                              className="grid size-7 place-items-center rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 outline-none cursor-pointer disabled:opacity-50"
                              aria-label="Actions menu"
                            >
                              {processingId === s.id ? (
                                <Loader2 className="size-3.5 animate-spin text-brand-red" />
                              ) : (
                                <MoreVertical className="size-3.5" />
                              )}
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44 rounded-2xl p-1.5 shadow-lg">
                              <DropdownMenuItem
                                onClick={() => onViewSeries(s)}
                                className="cursor-pointer text-xs font-medium"
                              >
                                <Eye className="mr-2 size-3.5 text-brand-blue" /> View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => onEditSeries(s)}
                                className="cursor-pointer text-xs font-medium"
                              >
                                <Edit2 className="mr-2 size-3.5 text-slate-700" /> Edit Series
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={async () => {
                                  setProcessingId(s.id);
                                  try {
                                    await onTogglePublishSeries(s);
                                  } finally {
                                    setProcessingId(null);
                                  }
                                }}
                                className="cursor-pointer text-xs font-medium"
                              >
                                <CheckCircle2 className="mr-2 size-3.5 text-emerald-600" />
                                {s.status === "PUBLISHED" ? "Unpublish Series" : "Publish Series"}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={async () => {
                                  setProcessingId(s.id);
                                  try {
                                    await onDuplicateSeries(s.id);
                                  } finally {
                                    setProcessingId(null);
                                  }
                                }}
                                className="cursor-pointer text-xs font-medium"
                              >
                                <Copy className="mr-2 size-3.5 text-blue-600" /> Duplicate Series
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={async () => {
                                  if (confirm(`Delete test series "${s.name}"?`)) {
                                    setProcessingId(s.id);
                                    try {
                                      await onDeleteSeries(s.id);
                                    } finally {
                                      setProcessingId(null);
                                    }
                                  }
                                }}
                                className="cursor-pointer text-xs font-medium text-rose-600 hover:text-rose-700"
                              >
                                <Trash2 className="mr-2 size-3.5" /> Delete Series
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {filteredSeries.length > 0 && (
          <div className="border-t border-slate-200 bg-[#fbfbfa] px-5 py-3.5">
            <TablePagination
              page={validPage}
              pageSize={pageSize}
              totalItems={filteredSeries.length}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>
    </section>
  );
}
