export type ServerStatus = "CHECKING" | "ONLINE" | "OFFLINE" | "RESTARTING" | "STARTING" | "STOPPING";

export interface ServerStatusResponse {
  success: boolean;
  status: string;
}

export interface ServerResources {
  cpu: {
    usagePercent: number;
    cores: number;
    model: string;
  };
  memory: {
    totalBytes: number;
    freeBytes: number;
    usedBytes: number;
    usagePercent: number;
  };
  disk: {
    totalBytes: number;
    freeBytes: number;
    usedBytes: number;
    usagePercent: number;
  };
  uptimeSeconds: number;
  hostname: string;
  platform: string;
}

export interface ServerResourcesResponse {
  success: boolean;
  resources: ServerResources;
}

export interface ServerInfo {
  id: string;
  name: string;
  slug: string;
  cluster: string;
  motd: string;
  serverType: "Paper";
  version: string;
  ip: string;
  port: number;
  onlinePlayers: number;
  maxPlayers: number;
  cpuUsage: number; // percentage 0-100
  cpuCores: number;
  cpuModel: string;
  memoryUsedGB: number;
  memoryMaxGB: number;
  storageUsedGB: number;
  storageMaxGB: number;
  networkInKB: number;
  networkOutKB: number;
  tps: number;
  mspt: number;
  uptimeSeconds: number;
  pingMs: number;
  javaVersion: string;
  hardwareModel: string;
}

export type PlayerRank = "Owner" | "Admin" | "Mod" | "VIP+" | "VIP" | "Member";

export interface Player {
  id: string;
  name: string;
  uuid: string | null;
  online: boolean;
  ping?: number;
  playtimeHours: number;
  balance?: number;
  health?: number; // 0 - 20
  hunger?: number; // 0 - 20
  location?: {
    x: number;
    y: number;
    z: number;
    dimension: "overworld" | "nether" | "the_end";
  };
  joinedAt?: string;
  firstSeen?: string | null;
  lastSeen?: string | null;
  ipMasked?: string;
  rank?: PlayerRank;
  dataSource?: string;
  isWhitelisted: boolean;
  isBanned: boolean;
  isMuted?: boolean;
  banReason?: string | null;
}

export interface ApiPlayer {
  id: string;
  uuid: string;
  name: string;
  online: boolean;
  playtimeHours: number;
  isBanned: boolean;
  isWhitelisted: boolean;
  banReason: string | null;
  firstSeen: string | null;
  lastSeen: string | null;
  dataSource: string;
}

export interface WorldData {
  id: string;
  name: string;
  dimension: "overworld" | "nether" | "the_end" | "custom";
  folderSizeMB: number;
  loadedChunks: number;
  entitiesCount: number;
  seed: string;
  difficulty: "Peaceful" | "Easy" | "Normal" | "Hard";
  pvp: boolean;
  autoSave: boolean;
  isLocked: boolean;
  lastBackupDate: string;
}

export interface PluginData {
  id: string;
  name: string;
  version: string;
  author: string;
  description: string;
  category: "Administration" | "Protection" | "Performance" | "Economy" | "Gameplay" | "Chat";
  enabled: boolean;
  updateAvailable: boolean;
  newVersion?: string;
  fileSizeKB: number;
}

export interface FileItem {
  id: string;
  name: string;
  path: string;
  type: "file" | "directory";
  sizeBytes: number;
  updatedAt: string;
  extension?: string;
  permissions: string;
}

export interface BackupData {
  id: string;
  fileName: string;
  timestamp: string;
  sizeMB: number;
  type: "manual" | "scheduled" | "pre_update";
  status: "completed" | "creating" | "failed";
  checksum: string;
  retentionDays: number;
  isLocked: boolean;
}

export interface ActivityEvent {
  id: string;
  timestamp: string;
  type: "security" | "player" | "server" | "backup" | "moderation" | "file";
  title: string;
  description: string;
  actor: {
    name: string;
    role: string;
  };
  severity: "info" | "success" | "warning" | "danger";
  metadata?: Record<string, string | number>;
}

export interface ConsoleLog {
  id: string;
  timestamp: string;
  level: "INFO" | "WARN" | "ERROR" | "CHAT" | "CMD";
  source: string;
  message: string;
}

export interface ServerSettings {
  serverName: string;
  motdFirstLine: string;
  motdSecondLine: string;
  maxPlayers: number;
  viewDistance: number;
  simulationDistance: number;
  difficulty: "peaceful" | "easy" | "normal" | "hard";
  gamemode: "survival" | "creative" | "adventure" | "spectator";
  pvp: boolean;
  hardcore: boolean;
  whiteList: boolean;
  enableCommandBlock: boolean;
  allowFlight: boolean;
  spawnProtection: number;
  jvmFlags: string;
  allocatedRamGB: number;
  autoRestartEnabled: boolean;
  autoRestartTime: string;
  onlineMode: boolean;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: "alert" | "info" | "success" | "warning";
}
