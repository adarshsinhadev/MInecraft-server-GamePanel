"use client";

import React, { useState } from "react";
import { useServer } from "@/context/ServerContext";
import { Card, CardBody } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import {
  FolderTree,
  Folder,
  FileCode,
  Search,
  Upload,
  Plus,
  Edit3,
  Download,
  ChevronRight,
  Save,
} from "lucide-react";
import { FileItem } from "@/types";

export default function FilesPage() {
  const { files, addToast } = useServer();
  const [currentPath, setCurrentPath] = useState<string>("/");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingFile, setEditingFile] = useState<FileItem | null>(null);
  const [fileContent, setFileContent] = useState("");
  const [newFileModalOpen, setNewFileModalOpen] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  const sampleConfigs: Record<string, string> = {
    "server.properties": `# Minecraft server properties
server-port=25565
server-ip=0.0.0.0
motd=\\u00A7a\\u00A7lValoriaSMP \\u00A77- \\u00A7eSurvival Season 4
max-players=100
view-distance=12
simulation-distance=8
difficulty=hard
gamemode=survival
pvp=true
hardcore=false
white-list=true
enable-command-block=false
spawn-protection=16
allow-flight=false
online-mode=true
level-name=world
level-seed=-83948194820194821
sync-chunk-writes=true
network-compression-threshold=256`,

    "paper-global.yml": `# Paper 26.3 Global Configuration
_version: 30
chunk-loading-advanced:
  auto-config-send-distance: true
  player-max-concurrent-chunk-generates: 0
  player-max-concurrent-chunk-loads: 0
misc:
  max-joins-per-tick: 3
  region-file-cache-size: 256
proxies:
  velocity:
    enabled: false
    online-mode: false
    secret: ''`,

    "whitelist.json": `[
  {
    "uuid": "a1b2c3d4-e5f6-47a8-b9c0-112233445566",
    "name": "QuartzFox"
  },
  {
    "uuid": "b2c3d4e5-f6a7-48b9-c0d1-223344556677",
    "name": "LumaVale"
  },
  {
    "uuid": "c3d4e5f6-a7b8-49c0-d1e2-334455667788",
    "name": "KiteVale"
  },
  {
    "uuid": "d4e5f6a7-b8c9-40d1-e2f3-445566778899",
    "name": "AnvilDawn"
  }
]`,
  };

  const handleOpenFile = (file: FileItem) => {
    if (file.type === "directory") {
      setCurrentPath(file.path);
      return;
    }
    const content =
      sampleConfigs[file.name] ||
      `# ${file.name}\n# Last modified: ${file.updatedAt}\n`;
    setEditingFile(file);
    setFileContent(content);
  };

  const handleSaveFile = () => {
    if (!editingFile) return;
    addToast("File saved", `${editingFile.name} updated.`, "success");
    setEditingFile(null);
  };

  const handleDownloadFile = (file: FileItem) => {
    const content = sampleConfigs[file.name] || `# ${file.name}`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(url);
    addToast("Download started", `${file.name}`, "info");
  };

  const formatFileSize = (bytes: number) => {
    if (bytes >= 1024 * 1024 * 1024) return (bytes / (1024 * 1024 * 1024)).toFixed(2) + " GB";
    if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + " MB";
    if (bytes >= 1024) return (bytes / 1024).toFixed(0) + " KB";
    return bytes + " B";
  };

  const filteredFiles = files.filter((f) => {
    if (searchQuery) {
      return f.name.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
            <FolderTree className="w-5 h-5 text-emerald-400" />
            Files
          </h1>
          <p className="text-xs text-zinc-400 font-mono">
            Server directory and configuration editor
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setNewFileModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-900 hover:bg-zinc-850 text-zinc-200 border border-white/10 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New File</span>
          </button>

          <button
            onClick={() => setUploadModalOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-black transition-colors"
          >
            <Upload className="w-4 h-4" />
            <span>Upload</span>
          </button>
        </div>
      </div>

      {/* Path Breadcrumbs & Search Bar */}
      <Card className="p-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-xs font-mono text-zinc-400 overflow-x-auto">
            <button
              onClick={() => setCurrentPath("/")}
              className="px-2 py-1 rounded hover:bg-white/5 hover:text-white transition-colors"
            >
              /root
            </button>
            {currentPath !== "/" && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
                <span className="text-zinc-200 font-semibold px-2 py-1 rounded bg-zinc-900">
                  {currentPath.replace("/", "")}
                </span>
              </>
            )}
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Filter files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-lg bg-zinc-950 border border-white/10 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 w-full sm:w-56 font-mono"
            />
          </div>
        </div>
      </Card>

      {/* File Table */}
      <Card>
        <CardBody className="p-0 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[560px]">
            <thead>
              <tr className="border-b border-white/[0.06] bg-zinc-900/60 text-zinc-400 font-mono text-[11px] uppercase tracking-wider">
                <th className="py-3 px-5">Name</th>
                <th className="py-3 px-4">Size</th>
                <th className="py-3 px-4">Permissions</th>
                <th className="py-3 px-4">Modified</th>
                <th className="py-3 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filteredFiles.map((file) => {
                const isDir = file.type === "directory";

                return (
                  <tr
                    key={file.id}
                    className="hover:bg-white/[0.02] transition-colors group cursor-pointer"
                    onClick={() => handleOpenFile(file)}
                  >
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-3">
                        {isDir ? (
                          <div className="w-7 h-7 rounded bg-zinc-900 text-zinc-400 flex items-center justify-center shrink-0">
                            <Folder className="w-4 h-4" />
                          </div>
                        ) : (
                          <div className="w-7 h-7 rounded bg-zinc-900 text-zinc-400 flex items-center justify-center shrink-0">
                            <FileCode className="w-4 h-4 text-emerald-400" />
                          </div>
                        )}

                        <div>
                          <div className="font-semibold text-zinc-200 text-xs font-mono group-hover:text-emerald-300 transition-colors">
                            {file.name}
                          </div>
                          <div className="text-[10px] text-zinc-500 font-mono">
                            {file.path}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono text-zinc-400">
                      {isDir ? "Directory" : formatFileSize(file.sizeBytes)}
                    </td>

                    <td className="py-3 px-4 font-mono text-zinc-500 text-[11px]">
                      {file.permissions}
                    </td>

                    <td className="py-3 px-4 font-mono text-zinc-400 text-[11px]">
                      {file.updatedAt}
                    </td>

                    <td className="py-3 px-5 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        {!isDir && (
                          <button
                            onClick={() => handleOpenFile(file)}
                            className="p-1.5 rounded bg-zinc-850 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors"
                            title="Edit file"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          onClick={() => handleDownloadFile(file)}
                          className="p-1.5 rounded bg-zinc-850 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors"
                          title="Download"
                        >
                          <Download className="w-3.5 h-3.5" />
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

      {/* File Editor Modal */}
      <Modal
        isOpen={!!editingFile}
        onClose={() => setEditingFile(null)}
        title={`Edit: ${editingFile?.name}`}
        description={`Path: ${editingFile?.path}`}
        maxWidth="2xl"
        footer={
          <>
            <button
              onClick={() => setEditingFile(null)}
              className="px-3 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-zinc-200"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveFile}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-black transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save File</span>
            </button>
          </>
        }
      >
        <div className="rounded-lg border border-white/10 bg-[#080b0a] overflow-hidden">
          <div className="px-3 py-1.5 bg-zinc-900 border-b border-white/5 text-[11px] font-mono text-zinc-400 flex items-center justify-between">
            <span>Lines: {fileContent.split("\n").length}</span>
            <span>UTF-8</span>
          </div>
          <textarea
            value={fileContent}
            onChange={(e) => setFileContent(e.target.value)}
            rows={14}
            className="w-full p-3 bg-transparent font-mono text-xs text-zinc-200 focus:outline-none resize-none leading-relaxed"
            spellCheck={false}
          />
        </div>
      </Modal>

      {/* New File Modal */}
      <Modal
        isOpen={newFileModalOpen}
        onClose={() => setNewFileModalOpen(false)}
        title="Create File"
        description="Creates a new empty file in the active folder."
        footer={
          <button
            onClick={() => {
              if (newFileName) {
                addToast("File created", `${newFileName}`, "success");
                setNewFileModalOpen(false);
                setNewFileName("");
              }
            }}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-black transition-colors"
          >
            Create
          </button>
        }
      >
        <div>
          <label className="block text-xs font-medium text-zinc-300 mb-1">
            File Name
          </label>
          <input
            type="text"
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            placeholder="e.g. server-icon.png or custom.yml"
            className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-white/10 text-xs text-zinc-200 focus:outline-none font-mono"
          />
        </div>
      </Modal>

      {/* Upload Modal */}
      <Modal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        title="Upload File"
        description="Select files to place into the server directory."
        footer={
          <button
            onClick={() => {
              addToast("Upload complete", "File uploaded.", "success");
              setUploadModalOpen(false);
            }}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-black transition-colors"
          >
            Done
          </button>
        }
      >
        <div className="border border-dashed border-zinc-700 rounded-xl p-8 text-center bg-zinc-950/40">
          <Upload className="w-8 h-8 text-zinc-500 mx-auto mb-2" />
          <div className="text-xs font-semibold text-zinc-200">Drag files here or click to browse</div>
          <div className="text-[11px] text-zinc-500 mt-1">.jar, .yml, .properties, .json</div>
        </div>
      </Modal>
    </div>
  );
}
