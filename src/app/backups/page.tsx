"use client";

import React, { useState } from "react";
import { useServer } from "@/context/ServerContext";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import {
  ArchiveRestore,
  Download,
  RotateCcw,
  Lock,
  Unlock,
  Trash2,
  Calendar,
  Cloud,
  Clock,
  Plus,
} from "lucide-react";
import { BackupData } from "@/types";

export default function BackupsPage() {
  const {
    backups,
    createBackup,
    restoreBackup,
    deleteBackup,
    toggleBackupLock,
    addToast,
  } = useServer();

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [customBackupName, setCustomBackupName] = useState("");
  const [restoreTarget, setRestoreTarget] = useState<BackupData | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BackupData | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    setIsCreating(true);
    setCreateModalOpen(false);
    await createBackup(customBackupName || undefined);
    setCustomBackupName("");
    setIsCreating(false);
  };

  const handleConfirmRestore = async () => {
    if (!restoreTarget) return;
    const target = restoreTarget;
    setRestoreTarget(null);
    await restoreBackup(target.id);
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    deleteBackup(deleteTarget.id);
    setDeleteTarget(null);
  };

  const typeBadges: Record<string, { label: string; variant: "emerald" | "gold" | "sky" }> = {
    scheduled: { label: "Scheduled", variant: "sky" },
    manual: { label: "Manual", variant: "emerald" },
    pre_update: { label: "Pre-Update", variant: "gold" },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
            <ArchiveRestore className="w-5 h-5 text-emerald-400" />
            Backups
          </h1>
          <p className="text-xs text-zinc-400 font-mono">
            Server archives, automated schedules, and restore points
          </p>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          disabled={isCreating}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-black transition-colors self-start sm:self-auto disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          <span>{isCreating ? "Creating..." : "Create Backup"}</span>
        </button>
      </div>

      {/* Backup Schedule Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        <Card className="p-4 flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-white/5 flex items-center justify-center shrink-0">
            <Calendar className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="text-xs font-semibold text-zinc-200">Daily Automated Schedule</div>
            <div className="text-sm font-bold font-mono text-zinc-100 mt-0.5">Everyday at 04:00 UTC</div>
            <p className="text-[11px] text-zinc-400 mt-0.5">Automated world chunk flush and gzip compression.</p>
          </div>
        </Card>

        <Card className="p-4 flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-white/5 flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <div className="text-xs font-semibold text-zinc-200">Retention Policy</div>
            <div className="text-sm font-bold font-mono text-zinc-100 mt-0.5">30-Day Rolling Window</div>
            <p className="text-[11px] text-zinc-400 mt-0.5">Locked backups are exempt from automatic cleanup.</p>
          </div>
        </Card>

        <Card className="p-4 flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-white/5 flex items-center justify-center shrink-0">
            <Cloud className="w-4 h-4 text-sky-400" />
          </div>
          <div>
            <div className="text-xs font-semibold text-zinc-200">Off-Site Mirror</div>
            <div className="text-sm font-bold font-mono text-zinc-100 mt-0.5">Active (S3 Target)</div>
            <p className="text-[11px] text-zinc-400 mt-0.5">Archives mirrored to off-site cloud storage.</p>
          </div>
        </Card>
      </div>

      {/* Backups List */}
      <Card>
        <CardHeader
          title="Backup Archives"
          subtitle={`${backups.length} snapshots on disk`}
        />

        <CardBody className="p-0 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[580px]">
            <thead>
              <tr className="border-b border-white/[0.06] bg-zinc-900/60 text-zinc-400 font-mono text-[11px] uppercase tracking-wider">
                <th className="py-3 px-5">Archive</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Size</th>
                <th className="py-3 px-4">Created</th>
                <th className="py-3 px-4">Checksum</th>
                <th className="py-3 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {backups.map((bk) => {
                const typeInfo = typeBadges[bk.type] || typeBadges.manual;

                return (
                  <tr
                    key={bk.id}
                    className="hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleBackupLock(bk.id)}
                          className={`p-1 rounded transition-colors ${
                            bk.isLocked
                              ? "text-amber-400 hover:text-amber-300"
                              : "text-zinc-600 hover:text-zinc-400"
                          }`}
                          title={bk.isLocked ? "Locked (Protected)" : "Unlocked"}
                        >
                          {bk.isLocked ? (
                            <Lock className="w-3.5 h-3.5" />
                          ) : (
                            <Unlock className="w-3.5 h-3.5" />
                          )}
                        </button>

                        <div>
                          <div className="font-semibold text-zinc-200 font-mono text-xs flex items-center gap-1.5">
                            <span>{bk.fileName}</span>
                            {bk.status === "creating" && (
                              <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 text-[10px] font-mono animate-pulse">
                                Creating...
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-zinc-500 font-mono">
                            ID: {bk.id}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <Badge variant={typeInfo.variant} size="sm">
                        {typeInfo.label}
                      </Badge>
                    </td>

                    <td className="py-3 px-4 font-mono text-zinc-300">
                      {(bk.sizeMB / 1024).toFixed(2)} GB
                    </td>

                    <td className="py-3 px-4 font-mono text-zinc-400 text-[11px]">
                      {bk.timestamp}
                    </td>

                    <td className="py-3 px-4 font-mono text-zinc-500 text-[11px]">
                      <code>{bk.checksum}</code>
                    </td>

                    <td className="py-3 px-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setRestoreTarget(bk)}
                          className="px-2 py-1 rounded bg-zinc-850 hover:bg-zinc-800 text-zinc-300 hover:text-amber-300 border border-white/5 text-[11px] font-medium transition-colors flex items-center gap-1"
                          title="Restore snapshot"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Restore</span>
                        </button>

                        <button
                          onClick={() => {
                            addToast("Downloading archive", `${bk.fileName}`, "info");
                          }}
                          className="p-1.5 rounded bg-zinc-850 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors"
                          title="Download archive"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => setDeleteTarget(bk)}
                          disabled={bk.isLocked}
                          className="p-1.5 rounded bg-zinc-850 hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400 transition-colors disabled:opacity-20"
                          title={bk.isLocked ? "Cannot delete locked backup" : "Delete"}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardBody>
      </Card>

      {/* Create Backup Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create Server Backup"
        description="Creates a tar.gz archive of world directories and server configuration files."
        footer={
          <>
            <button
              onClick={() => setCreateModalOpen(false)}
              className="px-3 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-zinc-200"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-black transition-colors"
            >
              Start Backup
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Archive Name (Optional)
            </label>
            <input
              type="text"
              value={customBackupName}
              onChange={(e) => setCustomBackupName(e.target.value)}
              placeholder="e.g. backup-manual.tar.gz"
              className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-white/10 text-xs text-zinc-200 focus:outline-none font-mono"
            />
          </div>
          <div className="text-xs text-zinc-400">
            Included paths: <span className="text-zinc-200 font-mono">/world, /world_nether, /world_the_end, /plugins, server.properties</span>.
          </div>
        </div>
      </Modal>

      {/* Restore Warning Modal */}
      <Modal
        isOpen={!!restoreTarget}
        onClose={() => setRestoreTarget(null)}
        title={`Restore Backup: ${restoreTarget?.fileName}`}
        description="Restoring this archive will overwrite current world files and restart the server."
        footer={
          <>
            <button
              onClick={() => setRestoreTarget(null)}
              className="px-3 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-zinc-200"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmRestore}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-black transition-colors"
            >
              Restore and Restart
            </button>
          </>
        }
      >
        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 leading-relaxed">
          Active players will be disconnected and server state will revert to <strong>{restoreTarget?.timestamp}</strong>.
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Backup Archive"
        description={`File: ${deleteTarget?.fileName}`}
        footer={
          <>
            <button
              onClick={() => setDeleteTarget(null)}
              className="px-3 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-zinc-200"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmDelete}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-500 hover:bg-rose-400 text-white transition-colors"
            >
              Delete Archive
            </button>
          </>
        }
      >
        <div className="text-xs text-zinc-400">
          This will free {(Number(deleteTarget?.sizeMB || 0) / 1024).toFixed(2)} GB of disk storage. This action cannot be undone.
        </div>
      </Modal>
    </div>
  );
}
