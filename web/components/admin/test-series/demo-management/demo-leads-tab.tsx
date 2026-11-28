"use client";

import { DemoLeadsStats } from "./demo-leads/demo-leads-stats";
import { DemoLeadsFilters } from "./demo-leads/demo-leads-filters";
import { DemoLeadsTable } from "./demo-leads/demo-leads-table";
import {
  DeleteDemoLeadDialog,
  DemoLeadHistoryDialog,
  EditDemoLeadDialog,
} from "./demo-leads/demo-lead-modals";
import { useDemoLeads } from "./demo-leads/use-demo-leads";
import type { DemoLeadRecord, FollowUpStatus } from "./demo-leads/demo-leads.types";

export type { DemoLeadRecord, FollowUpStatus };

interface Props {
  onNotice: (message: string) => void;
  onError: (message: string) => void;
}

export function DemoLeadsTab({ onNotice, onError }: Props) {
  const vm = useDemoLeads({ onNotice, onError });

  return (
    <div className="space-y-5">
      <DemoLeadsStats stats={vm.stats} />

      <DemoLeadsFilters
        query={vm.query}
        onQueryChange={(val) => {
          vm.setPage(1);
          vm.setQuery(val);
        }}
        followUpFilter={vm.followUpFilter}
        onFollowUpFilterChange={(val) => {
          vm.setPage(1);
          vm.setFollowUpFilter(val);
        }}
        consentFilter={vm.consentFilter}
        onConsentFilterChange={(val) => {
          vm.setPage(1);
          vm.setConsentFilter(val);
        }}
        dateRange={vm.dateRange}
        onDateRangeChange={(range) => {
          vm.setPage(1);
          vm.setDateRange(range);
        }}
        datePopoverOpen={vm.datePopoverOpen}
        onDatePopoverOpenChange={vm.setDatePopoverOpen}
        onApplyDatePreset={vm.applyDatePreset}
        onResetFilters={vm.resetFilters}
      />

      <DemoLeadsTable
        leads={vm.leads}
        loading={vm.loading}
        page={vm.page}
        totalPages={vm.totalPages}
        total={vm.total}
        copiedId={vm.copiedId}
        onPageChange={vm.setPage}
        onCopy={(lead) => void vm.handleCopy(lead)}
        onEdit={vm.openEditModal}
        onOpenHistory={(lead) => void vm.openHistoryModal(lead)}
        onDelete={vm.setDeletingLead}
      />

      <EditDemoLeadDialog
        lead={vm.editingLead}
        phone={vm.editPhone}
        onPhoneChange={vm.setEditPhone}
        status={vm.editStatus}
        onStatusChange={vm.setEditStatus}
        consent={vm.editConsent}
        onConsentChange={vm.setEditConsent}
        notes={vm.editNotes}
        onNotesChange={vm.setEditNotes}
        saving={vm.savingEdit}
        onClose={() => vm.setEditingLead(null)}
        onSubmit={(e) => void vm.saveLeadUpdate(e)}
      />

      <DeleteDemoLeadDialog
        lead={vm.deletingLead}
        busy={vm.deletingBusy}
        onClose={() => vm.setDeletingLead(null)}
        onConfirm={() => void vm.confirmDeleteLead()}
      />

      <DemoLeadHistoryDialog
        lead={vm.historyLead}
        attempts={vm.historyAttempts}
        loading={vm.loadingHistory}
        onClose={() => vm.setHistoryLead(null)}
      />
    </div>
  );
}
