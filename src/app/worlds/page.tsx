"use client";

import React, { useState } from "react";
import { useServer } from "@/context/ServerContext";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import {
  Globe,
  Upload,
  Download,
  Sparkles,
  RefreshCw,
  Lock,
  Copy,
  Check,
} from "lucide-react";
import { WorldData } from "@/types";

export default function WorldsPage() {
  const { worlds, createBackup, addToast, copyToClipboard } = useServer();
  const [selectedWorld, setSelectedWorld] = useState<WorldData | null>(null);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [chunkGenModalOpen, setChunkGenModalOpen] = useState(false);
  const [copiedSeed, setCopiedSeed] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCopySeed = (seed: string) => {
    copyToClipboard(seed, "World Seed");
    setCopiedSeed(seed);
    setTimeout(() => setCopiedSeed(null), 2000);
  };

  const handleBackupWorld = async (world: WorldData) => {
    await createBackup(`backup-${world.name}-${new Date().toISOString().split("T")[0]}.tar.gz`);
  };

  const handleRunChunky = async () => {
    setIsProcessing(true);
    addToast("Chunky pre-generation started", `Generating radius for ${selectedWorld?.name}...`, "info");
    await new Promise((res) => setTimeout(res, 2000));
    setIsProcessing(false);
    setChunkGenModalOpen(false);
    addToast("Pre-generation complete", `Chunky finished generating chunks for ${selectedWorld?.name}.`, "success");
  };

  const handleConfirmReset = async () => {
    if (!selectedWorld) return;
    setIsProcessing(true);
    addToast("Resetting dimension", `Purging region files for ${selectedWorld.name}...`, "warning");
    await new Promise((res) => setTimeout(res, 2000));
    setIsProcessing(false);
    setResetModalOpen(false);
    addToast("Dimension reset complete", `${selectedWorld.name} will generate fresh chunks on next restart.`, "success");
  };

  const dimensionBadges: Record<string, { label: string; variant: "grass" | "rose" | "purple" | "neutral" }> = {
    overworld: { label: "Overworld", variant: "grass" },
    nether: { label: "Nether", variant: "rose" },
    the_end: { label: "The End", variant: "purple" },
    custom: { label: "Custom", variant: "neutral" },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
            <Globe className="w-5 h-5 text-emerald-400" />
            Worlds
          </h1>
          <p className="text-xs text-zinc-400 font-mono">
            Region file sizes, loaded chunks, and dimension archives
          </p>
        </div>

        <button
          onClick={() => setUploadModalOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-black transition-colors self-start sm:self-auto"
        >
          <Upload className="w-4 h-4" />
          <span>Upload World</span>
        </button>
      </div>

      {/* World Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {worlds.map((world) => {
          const dim = dimensionBadges[world.dimension] || dimensionBadges.custom;

          return (
            <Card key={world.id} className="p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-zinc-100 font-mono">
                        {world.name}
                      </h3>
                      <Badge variant={dim.variant} size="sm">
                        {dim.label}
                      </Badge>
                      {world.isLocked && (
                        <span className="p-1 rounded bg-zinc-800 text-zinc-400 border border-white/5" title="Locked Dimension">
                          <Lock className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-zinc-400 mt-1 flex items-center gap-2 font-mono">
                      <span>Seed:</span>
                      <code className="text-zinc-300 font-mono bg-zinc-900 px-1 py-0.5 rounded border border-white/5">
                        {world.seed}
                      </code>
                      <button
                        onClick={() => handleCopySeed(world.seed)}
                        className="text-zinc-500 hover:text-zinc-300 transition-colors"
                        title="Copy Seed"
                      >
                        {copiedSeed === world.seed ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="text-right font-mono">
                    <div className="text-sm font-bold text-zinc-200">
                      {(world.folderSizeMB / 1024).toFixed(2)} GB
                    </div>
                    <div className="text-[10px] text-zinc-500">Region directory</div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-4 p-2.5 rounded-lg bg-zinc-900 border border-white/5 text-xs font-mono">
                  <div>
                    <span className="text-[10px] text-zinc-500 block">Loaded Chunks</span>
                    <span className="text-zinc-200 font-semibold">{world.loadedChunks.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 block">Active Entities</span>
                    <span className="text-zinc-200 font-semibold">{world.entitiesCount}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 block">Difficulty</span>
                    <span className="text-zinc-200 font-semibold">{world.difficulty}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 pt-3 border-t border-white/5 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleBackupWorld(world)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-850 hover:bg-zinc-800 text-xs font-medium text-zinc-200 border border-white/5 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Backup</span>
                  </button>

                  <button
                    onClick={() => {
                      setSelectedWorld(world);
                      setChunkGenModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-850 hover:bg-zinc-800 text-xs font-medium text-zinc-200 border border-white/5 transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Pre-generate Chunks</span>
                  </button>
                </div>

                {world.dimension === "nether" || world.dimension === "the_end" ? (
                  <button
                    onClick={() => {
                      setSelectedWorld(world);
                      setResetModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-rose-400 hover:bg-rose-500/10 transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Reset Dimension</span>
                  </button>
                ) : null}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Reset Dimension Modal */}
      <Modal
        isOpen={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
        title={`Reset Dimension: ${selectedWorld?.name}`}
        description="Deletes region files in this dimension. Terrain will generate anew on next server launch."
        footer={
          <>
            <button
              onClick={() => setResetModalOpen(false)}
              className="px-3 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-zinc-200"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmReset}
              disabled={isProcessing}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-500 hover:bg-rose-400 text-white transition-colors disabled:opacity-50"
            >
              {isProcessing ? "Resetting..." : "Confirm Reset"}
            </button>
          </>
        }
      >
        <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 leading-relaxed">
          Ensure you have a recent backup archive before resetting this dimension. All structures and player blocks in {selectedWorld?.name} will be permanently removed.
        </div>
      </Modal>

      {/* Chunky Modal */}
      <Modal
        isOpen={chunkGenModalOpen}
        onClose={() => setChunkGenModalOpen(false)}
        title={`Pre-generate Chunks: ${selectedWorld?.name}`}
        description="Pre-loads and saves world chunks to disk using Chunky."
        footer={
          <>
            <button
              onClick={() => setChunkGenModalOpen(false)}
              className="px-3 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-zinc-200"
            >
              Cancel
            </button>
            <button
              onClick={handleRunChunky}
              disabled={isProcessing}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-black transition-colors disabled:opacity-50"
            >
              {isProcessing ? "Running..." : "Start Chunky"}
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Radius (Blocks)
            </label>
            <input
              type="number"
              defaultValue={5000}
              className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-white/10 text-xs text-zinc-200 focus:outline-none"
            />
          </div>
          <div className="text-xs text-zinc-400">
            Estimated chunk count: <span className="text-zinc-200">16,384 chunks</span> (~3.2 GB disk).
          </div>
        </div>
      </Modal>

      {/* Upload Modal */}
      <Modal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        title="Upload World"
        description="Upload a .zip or .tar.gz archive containing region and level.dat files."
        footer={
          <button
            onClick={() => {
              addToast("World uploaded", "World archive extracted.", "success");
              setUploadModalOpen(false);
            }}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-black transition-colors"
          >
            Upload
          </button>
        }
      >
        <div className="border border-dashed border-zinc-700 hover:border-zinc-500 rounded-xl p-8 text-center transition-colors cursor-pointer bg-zinc-950/50">
          <Upload className="w-8 h-8 text-zinc-500 mx-auto mb-2" />
          <div className="text-xs font-semibold text-zinc-200">Drag archive here or click to select file</div>
          <div className="text-[11px] text-zinc-500 mt-1">Supported formats: .zip, .tar.gz</div>
        </div>
      </Modal>
    </div>
  );
}
