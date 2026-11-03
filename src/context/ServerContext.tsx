"use client";

import React, { createContext, useCallback, useContext, useEffect, useRef, useState, ReactNode } from "react";
import {
  ServerInfo,
  ServerStatus,
  Player,
  WorldData,
  PluginData,
  FileItem,
  BackupData,
  ActivityEvent,
  ServerSettings,
  NotificationItem,
  ServerResources,
  ServerResourcesResponse,
  ServerStatusResponse,
} from "@/types";
import {
  ApiClientError,
  PlayersResponse,
  banPlayer as banPlayerRequest,
  getServerResources,
  getServerStatus,
  getPlayers,
  kickPlayer as kickPlayerRequest,
  restartServer as restartServerRequest,
  setPlayerWhitelist as setPlayerWhitelistRequest,
  startServer as startServerRequest,
  stopServer as stopServerRequest,
  unbanPlayer as unbanPlayerRequest,
} from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import {
  initialServers,
  initialWorlds,
  initialPlugins,
  initialFiles,
  initialBackups,
  initialActivity,
  initialSettings,
  initialNotifications,
} from "@/data/mockData";

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  type: "success" | "info" | "warning" | "error";
}

export type ServerPowerAction = "start" | "stop" | "restart";
type ConfirmableServerAction = Exclude<ServerPowerAction, "start">;

interface ServerContextType {
  servers: ServerInfo[];
  currentServer: ServerInfo;
  serverStatus: ServerStatus;
  serverStatusLoading: boolean;
  serverStatusError: string | null;
  serverResources: ServerResources | null;
  serverResourcesLoading: boolean;
  serverResourcesError: string | null;
  serverAction: ServerPowerAction | null;
  pendingServerAction: ConfirmableServerAction | null;
  players: Player[];
  playersLoading: boolean;
  playersError: string | null;
  refreshPlayers: () => Promise<boolean>;
  worlds: WorldData[];
  plugins: PluginData[];
  files: FileItem[];
  backups: BackupData[];
  activities: ActivityEvent[];
  settings: ServerSettings;
  notifications: NotificationItem[];
  toasts: ToastMessage[];

  // Actions
  selectServer: (id: string) => void;
  startServer: () => void;
  restartServer: () => void;
  stopServer: () => void;
  confirmServerAction: () => void;
  cancelServerAction: () => void;
  kickPlayer: (username: string, reason?: string) => Promise<boolean>;
  banPlayer: (username: string, reason?: string) => Promise<boolean>;
  unbanPlayer: (username: string) => Promise<boolean>;
  toggleWhitelistPlayer: (username: string, isWhitelisted: boolean) => Promise<boolean>;
  togglePlugin: (id: string) => void;
  updatePlugin: (id: string) => void;
  installPlugin: (plugin: Partial<PluginData>) => void;
  createBackup: (name?: string) => Promise<void>;
  restoreBackup: (id: string) => Promise<void>;
  deleteBackup: (id: string) => void;
  toggleBackupLock: (id: string) => void;
  updateSettings: (newSettings: Partial<ServerSettings>) => void;
  markNotificationRead: (id: string) => void;
  clearAllNotifications: () => void;
  addToast: (title: string, description?: string, type?: "success" | "info" | "warning" | "error") => void;
  removeToast: (id: string) => void;
  copyToClipboard: (text: string, label?: string) => void;
}

const ServerContext = createContext<ServerContextType | undefined>(undefined);

function normalizeServerStatus(status: string): ServerStatus {
  switch (status.trim().toLowerCase()) {
    case "active":
    case "online":
      return "ONLINE";
    case "inactive":
    case "offline":
    case "stopped":
    case "dead":
    case "failed":
      return "OFFLINE";
    case "starting":
    case "activating":
      return "STARTING";
    case "stopping":
    case "deactivating":
      return "STOPPING";
    case "restarting":
      return "RESTARTING";
    default:
      throw new Error("The server status endpoint returned an unknown status.");
  }
}

function responseMessage(response: unknown): string | undefined {
  if (!response || typeof response !== "object") return undefined;
  const payload = response as Record<string, unknown>;
  if (payload.success === false) {
    const message = typeof payload.message === "string" ? payload.message :
      typeof payload.error === "string" ? payload.error : undefined;
    throw new Error(message || "The server rejected the operation.");
  }
  return typeof payload.message === "string" ? payload.message : undefined;
}

export const ServerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { status: authStatus, refreshAuth } = useAuth();
  const [servers] = useState<ServerInfo[]>(initialServers);
  const [currentServerId, setCurrentServerId] = useState<string>("valoria-smp");
  const [serverStatus, setServerStatus] = useState<ServerStatus>("CHECKING");
  const [serverStatusLoading, setServerStatusLoading] = useState(true);
  const [serverStatusError, setServerStatusError] = useState<string | null>(null);
  const [serverResources, setServerResources] = useState<ServerResources | null>(null);
  const [serverResourcesLoading, setServerResourcesLoading] = useState(true);
  const [serverResourcesError, setServerResourcesError] = useState<string | null>(null);
  const [serverAction, setServerAction] = useState<ServerPowerAction | null>(null);
  const [pendingServerAction, setPendingServerAction] = useState<ConfirmableServerAction | null>(null);
  const actionInFlightRef = useRef(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const [playersLoading, setPlayersLoading] = useState(true);
  const [playersError, setPlayersError] = useState<string | null>(null);
  const [worlds] = useState<WorldData[]>(initialWorlds);
  const [plugins, setPlugins] = useState<PluginData[]>(initialPlugins);
  const [files] = useState<FileItem[]>(initialFiles);
  const [backups, setBackups] = useState<BackupData[]>(initialBackups);
  const [activities, setActivities] = useState<ActivityEvent[]>(initialActivity);
  const [settings, setSettings] = useState<ServerSettings>(initialSettings);
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const currentServer = servers.find((s) => s.id === currentServerId) || servers[0];

  const refreshPlayers = useCallback(async (): Promise<boolean> => {
    if (authStatus !== "authenticated") return false;

    setPlayersLoading(true);
    setPlayersError(null);
    try {
      const response = await getPlayers<PlayersResponse>();
      if (response.success !== true || !Array.isArray(response.players)) {
        throw new Error("The players endpoint returned an unexpected response.");
      }

      setPlayers(response.players);
      return true;
    } catch (cause) {
      if (cause instanceof ApiClientError && cause.status === 401) {
        setPlayers([]);
        void refreshAuth();
      } else {
        setPlayersError(cause instanceof Error ? cause.message : "Could not load players.");
      }
      return false;
    } finally {
      setPlayersLoading(false);
    }
  }, [authStatus, refreshAuth]);

  useEffect(() => {
    if (authStatus === "authenticated") {
      void refreshPlayers();
    } else {
      setPlayers([]);
      setPlayersError(null);
      setPlayersLoading(authStatus === "checking" || authStatus === "loading");
    }
  }, [authStatus, refreshPlayers]);

  useEffect(() => {
    if (authStatus !== "authenticated") {
      setServerStatus("CHECKING");
      setServerStatusLoading(true);
      setServerStatusError(null);
      setServerResources(null);
      setServerResourcesLoading(true);
      setServerResourcesError(null);
      return;
    }

    let active = true;
    let inFlight = false;

    const pollServerMetrics = async () => {
      if (!active || inFlight) return;
      inFlight = true;
      let unauthorized = false;

      try {
        const statusResponse = await getServerStatus<ServerStatusResponse>();
        if (!active) return;
        if (statusResponse.success !== true || typeof statusResponse.status !== "string") {
          throw new Error("The server status endpoint returned an unexpected response.");
        }

        setServerStatus(normalizeServerStatus(statusResponse.status));
        setServerStatusError(null);
      } catch (cause) {
        if (!active) return;
        if (cause instanceof ApiClientError && cause.status === 401) {
          unauthorized = true;
        } else {
          setServerStatusError(
            cause instanceof Error ? cause.message : "Could not load server status."
          );
        }
      } finally {
        if (active) setServerStatusLoading(false);
      }

      if (!active || unauthorized) {
        inFlight = false;
        if (active && unauthorized) void refreshAuth();
        return;
      }

      try {
        const resourcesResponse = await getServerResources<ServerResourcesResponse>();
        if (!active) return;
        if (resourcesResponse.success !== true || !resourcesResponse.resources) {
          throw new Error("The server resources endpoint returned an unexpected response.");
        }

        setServerResources(resourcesResponse.resources);
        setServerResourcesError(null);
      } catch (cause) {
        if (!active) return;
        if (cause instanceof ApiClientError && cause.status === 401) {
          unauthorized = true;
        } else {
          setServerResourcesError(
            cause instanceof Error ? cause.message : "Could not load server resources."
          );
        }
      } finally {
        if (active) setServerResourcesLoading(false);
        inFlight = false;
      }

      if (active && unauthorized) void refreshAuth();
    };

    void pollServerMetrics();
    const interval = window.setInterval(() => void pollServerMetrics(), 5000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [authStatus, refreshAuth]);

  const addToast = (
    title: string,
    description?: string,
    type: "success" | "info" | "warning" | "error" = "info"
  ) => {
    const id = "toast-" + Date.now() + Math.random().toString(36).substring(2, 6);
    setToasts((prev) => [...prev, { id, title, description, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const runPlayerAction = async (
    username: string,
    action: "kick" | "ban" | "unban" | "whitelist",
    reason?: string,
    isWhitelisted?: boolean
  ): Promise<boolean> => {
    try {
      let response: unknown;
      switch (action) {
        case "kick":
          response = await kickPlayerRequest(username, reason);
          break;
        case "ban":
          response = await banPlayerRequest(username, reason);
          break;
        case "unban":
          response = await unbanPlayerRequest(username);
          break;
        case "whitelist":
          response = await setPlayerWhitelistRequest(username, isWhitelisted === true);
          break;
      }

      const serverMessage = responseMessage(response);
      const refreshed = await refreshPlayers();
      const actionTitles = {
        kick: "Player kicked",
        ban: "Player permanently banned",
        unban: "Player unbanned",
        whitelist: isWhitelisted ? "Player whitelisted" : "Player removed from whitelist",
      };
      addToast(
        actionTitles[action],
        serverMessage || (refreshed ? `${username} updated successfully.` : `${username} updated, but the roster could not be refreshed.`),
        refreshed ? "success" : "warning"
      );
      return true;
    } catch (cause) {
      if (cause instanceof ApiClientError && cause.status === 401) {
        addToast("Session expired", "Please sign in again to moderate players.", "error");
        void refreshAuth();
      } else {
        addToast(
          `Could not ${action} player`,
          cause instanceof Error ? cause.message : "The backend request failed.",
          "error"
        );
      }
      return false;
    }
  };

  const copyToClipboard = (text: string, label: string = "IP Address") => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      addToast(`Copied ${label}`, text, "success");
    } else {
      addToast(`Copied ${label}`, text, "info");
    }
  };

  const selectServer = (id: string) => {
    setCurrentServerId(id);
    const target = servers.find((s) => s.id === id);
    if (target) {
      addToast(`Selected ${target.name}`, `Node: ${target.cluster}`, "info");
    }
  };

  const addActivity = (
    title: string,
    description: string,
    type: ActivityEvent["type"],
    severity: ActivityEvent["severity"] = "info",
    actorName: string = "Console"
  ) => {
    const newAct: ActivityEvent = {
      id: "act-" + Date.now(),
      timestamp: "Just now",
      type,
      title,
      description,
      actor: { name: actorName, role: "Admin" },
      severity,
    };
    setActivities((prev) => [newAct, ...prev]);
  };

  // Power Controls
  const executeServerAction = async (action: ServerPowerAction) => {
    if (actionInFlightRef.current) return;
    const statusAllowsAction = action === "start"
      ? serverStatus === "OFFLINE"
      : serverStatus === "ONLINE";
    if (!statusAllowsAction) {
      setPendingServerAction(null);
      addToast("Server status changed", `The ${action} request was not sent because the server is now ${serverStatus.toLowerCase()}.`, "warning");
      return;
    }

    actionInFlightRef.current = true;
    setServerAction(action);

    const labels: Record<ServerPowerAction, { past: string; verb: string }> = {
      start: { past: "Server start request", verb: "start" },
      stop: { past: "Server stop request", verb: "stop" },
      restart: { past: "Server restart request", verb: "restart" },
    };
    let unauthorized = false;

    try {
      const response = await (
        action === "start"
          ? startServerRequest<unknown>()
          : action === "stop"
          ? stopServerRequest<unknown>()
          : restartServerRequest<unknown>()
      );
      const message = responseMessage(response);
      addToast(
        `${labels[action].past} accepted`,
        message || `The backend accepted the ${labels[action].verb} operation.`,
        "success"
      );
    } catch (cause) {
      if (cause instanceof ApiClientError && cause.status === 401) {
        unauthorized = true;
        addToast("Session expired", "Please sign in again to control the server.", "error");
        void refreshAuth();
      } else {
        addToast(
          `Could not ${labels[action].verb} server`,
          cause instanceof Error ? cause.message : "The backend request failed.",
          "error"
        );
      }
    }

    // Always ask the status endpoint for the current state after the action request.
    try {
      if (!unauthorized) {
        try {
          const statusResponse = await getServerStatus<ServerStatusResponse>();
          if (statusResponse.success !== true || typeof statusResponse.status !== "string") {
            throw new Error("The server status endpoint returned an unexpected response.");
          }
          setServerStatus(normalizeServerStatus(statusResponse.status));
          setServerStatusError(null);
        } catch (cause) {
          if (cause instanceof ApiClientError && cause.status === 401) {
            addToast("Session expired", "Please sign in again to check server status.", "error");
            void refreshAuth();
          } else {
            const message = cause instanceof Error ? cause.message : "Could not refresh server status.";
            setServerStatusError(message);
            addToast("Status refresh failed", message, "warning");
          }
        }
      }
    } finally {
      setServerStatusLoading(false);
      actionInFlightRef.current = false;
      setServerAction(null);
      setPendingServerAction(null);
    }
  };

  const startServer = () => {
    void executeServerAction("start");
  };

  const restartServer = () => {
    if (serverStatus === "ONLINE" && !actionInFlightRef.current && pendingServerAction === null) {
      setPendingServerAction("restart");
    }
  };

  const stopServer = () => {
    if (serverStatus === "ONLINE" && !actionInFlightRef.current && pendingServerAction === null) {
      setPendingServerAction("stop");
    }
  };

  const confirmServerAction = () => {
    if (pendingServerAction) void executeServerAction(pendingServerAction);
  };

  const cancelServerAction = () => {
    if (!actionInFlightRef.current) setPendingServerAction(null);
  };

  // Moderation Controls
  const kickPlayer = (username: string, reason?: string) => runPlayerAction(username, "kick", reason);
  const banPlayer = (username: string, reason?: string) => runPlayerAction(username, "ban", reason);
  const unbanPlayer = (username: string) => runPlayerAction(username, "unban");
  const toggleWhitelistPlayer = (username: string, isWhitelisted: boolean) =>
    runPlayerAction(username, "whitelist", undefined, isWhitelisted);

  // Plugins
  const togglePlugin = (id: string) => {
    setPlugins((prev) =>
      prev.map((pl) => {
        if (pl.id === id) {
          const nextState = !pl.enabled;
          addToast(
            nextState ? "Plugin enabled" : "Plugin disabled",
            `${pl.name} is now ${nextState ? "active" : "disabled"}. Requires server restart.`,
            nextState ? "success" : "warning"
          );
          return { ...pl, enabled: nextState };
        }
        return pl;
      })
    );
  };

  const updatePlugin = (id: string) => {
    setPlugins((prev) =>
      prev.map((pl) => {
        if (pl.id === id && pl.updateAvailable) {
          addToast("Plugin updated", `${pl.name} updated to v${pl.newVersion || "latest"}.`, "success");
          return {
            ...pl,
            version: pl.newVersion || pl.version,
            updateAvailable: false,
            newVersion: undefined,
          };
        }
        return pl;
      })
    );
  };

  const installPlugin = (plugin: Partial<PluginData>) => {
    const newPlugin: PluginData = {
      id: plugin.id || "plug-" + Date.now(),
      name: plugin.name || "Plugin",
      version: plugin.version || "1.0.0",
      author: plugin.author || "Community",
      description: plugin.description || "Installed plugin file.",
      category: plugin.category || "Gameplay",
      enabled: true,
      updateAvailable: false,
      fileSizeKB: plugin.fileSizeKB || 850,
    };
    setPlugins((prev) => [newPlugin, ...prev]);
    addToast("Plugin installed", `${newPlugin.name} v${newPlugin.version} added to /plugins.`, "success");
    addActivity("Plugin Installed", `Added ${newPlugin.name} v${newPlugin.version}.`, "server", "info");
  };

  // Backups
  const createBackup = async (name?: string) => {
    const backupName = name || `backup-valoria-manual-${new Date().toISOString().split("T")[0]}.tar.gz`;
    const tempId = "bk-" + Date.now();

    const newBk: BackupData = {
      id: tempId,
      fileName: backupName,
      timestamp: "Creating...",
      sizeMB: 3410.0,
      type: "manual",
      status: "creating",
      checksum: "Calculating...",
      retentionDays: 60,
      isLocked: true,
    };
    setBackups((prev) => [newBk, ...prev]);
    addToast("Backup started", "Compressing world and server files.", "info");

    await new Promise((res) => setTimeout(res, 2000));

    setBackups((prev) =>
      prev.map((b) =>
        b.id === tempId
          ? {
              ...b,
              status: "completed",
              timestamp: "Just now",
              checksum: "sha256:7f9a2e34c901a8ef",
            }
          : b
      )
    );
    addToast("Backup created", `${backupName} saved.`, "success");
    addActivity("Backup Created", `Saved snapshot ${backupName}.`, "backup", "success");
  };

  const restoreBackup = async (id: string) => {
    const bk = backups.find((b) => b.id === id);
    if (!bk) return;

    addToast("Restoring backup", `Restoring ${bk.fileName}. Server will restart.`, "warning");

    await new Promise((res) => setTimeout(res, 2800));

    addToast("Restore complete", "Server files restored from archive.", "success");
    addActivity("Backup Restored", `Restored files from ${bk.fileName}.`, "backup", "warning");
  };

  const deleteBackup = (id: string) => {
    const bk = backups.find((b) => b.id === id);
    if (!bk) return;
    setBackups((prev) => prev.filter((b) => b.id !== id));
    addToast("Backup deleted", `${bk.fileName} removed from disk.`, "info");
  };

  const toggleBackupLock = (id: string) => {
    setBackups((prev) =>
      prev.map((b) => (b.id === id ? { ...b, isLocked: !b.isLocked } : b))
    );
  };

  const updateSettings = (newSettings: Partial<ServerSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
    addToast("Settings saved", "Configuration updated in server.properties.", "success");
    addActivity("Configuration Updated", "Server properties were modified.", "server", "info");
  };

  const markNotificationRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const clearAllNotifications = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    addToast("Notifications cleared", "All notifications marked as read.", "info");
  };

  return (
    <ServerContext.Provider
      value={{
        servers,
        currentServer,
        serverStatus,
        serverStatusLoading,
        serverStatusError,
        serverResources,
        serverResourcesLoading,
        serverResourcesError,
        serverAction,
        pendingServerAction,
        players,
        playersLoading,
        playersError,
        refreshPlayers,
        worlds,
        plugins,
        files,
        backups,
        activities,
        settings,
        notifications,
        toasts,
        selectServer,
        startServer,
        restartServer,
        stopServer,
        confirmServerAction,
        cancelServerAction,
        kickPlayer,
        banPlayer,
        unbanPlayer,
        toggleWhitelistPlayer,
        togglePlugin,
        updatePlugin,
        installPlugin,
        createBackup,
        restoreBackup,
        deleteBackup,
        toggleBackupLock,
        updateSettings,
        markNotificationRead,
        clearAllNotifications,
        addToast,
        removeToast,
        copyToClipboard,
      }}
    >
      {children}
    </ServerContext.Provider>
  );
};

export const useServer = () => {
  const context = useContext(ServerContext);
  if (!context) {
    throw new Error("useServer must be used within a ServerProvider");
  }
  return context;
};
