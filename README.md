# ValoriaSMP Panel

A commercial-grade Minecraft server control panel frontend built with **Next.js 14 App Router**, **TypeScript**, and **Tailwind CSS**.

---

## 🛠️ Server Environment & Architecture

- **Server Software:** Paper 26.3 (Build #148) on Java 21 LTS
- **Host Hardware:** HPE ProLiant DL380 Gen10 (Intel Xeon Silver 4214R @ 3.20GHz, 8 vCPU assigned)
- **Memory Allocation:** 16,384 MB DDR4 ECC
- **Storage Controller:** HP Smart Array / NVMe SSD
- **Tick Performance:** Target 20.0 TPS / ~13.4 ms MSPT

---

## 📋 Audit Improvements

1. **Content & Language:**
   - Removed artificial marketing adjectives ("Insights", "Intelligence", "Next-Gen", "Powerful", "Ultimate", "Seamless", "Zero Leak", "Echoes of Eternity").
   - Rewritten with standard systems engineering terminology (e.g. "Heap allocation", "Region files", "Tick boundary", "Audit Log").
   - Corrected server software from Purpur to **Paper 26.3**.

2. **Visual Hierarchy & Styling:**
   - Eliminated heavy glowing box-shadows, scanline filters, and muddy gradient backgrounds.
   - Restored high-contrast, clean dark surfaces (`#0a0e0d`, `#0f1412`, `#131916`) with sharp, subtle borders.
   - Maintained Minecraft-inspired emerald accents (`#10b981`) and grass-green indicators (`#22c55e`).

3. **Data Accuracy:**
   - Added a clear **Demo Environment** indicator in the top navigation bar to distinguish prototype demonstration data from live production server operations.
   - Resource metrics and configurations match the actual HPE server hardware specifications.

---

## 🚀 Pages Included

1. **Overview (`/`)**: Core metrics (Players, Memory, CPU, TPS, Storage, Network), connected players preview, recent activity, common commands, and host specifications.
2. **Console (`/console`)**: Real-time terminal output, log level filters (INFO, WARN, ERROR, CHAT, CMD), auto-scroll lock, log export, and command history (Up/Down arrow navigation).
3. **Players (`/players`)**: Roster tabs (Online, All, Whitelist, Banned), player vitals (health, hunger), coordinates, ping, playtime, and moderation controls (Kick, Ban, Whitelist).
4. **Worlds (`/worlds`)**: Overworld, Nether, The End, and spawn hub dimension tracking, Chunky chunk pre-generation modal, and dimension reset confirmation.
5. **Plugins (`/plugins`)**: Installed Paper extensions, active/disabled status toggles, version tags, and catalog installer.
6. **Files (`/files`)**: Directory navigation, file sizes, permissions, in-browser code editor for `server.properties` and YAML configs.
7. **Backups (`/backups`)**: Tar.gz archive management, SHA-256 checksums, retention rules, and restore confirmation.
8. **Analytics (`/analytics`)**: Timeframe filtering (24h/7d/30d), hourly concurrency chart, tick stability breakdown, and playtime rankings.
9. **Settings (`/settings`)**: Live multiplayer MOTD preview with Minecraft color code formatting, gameplay toggles, and JVM memory slider.
10. **Activity (`/activity`)**: Chronological audit trail with filter categories, actor roles, and JSON log export.

---

## 🏃 Running Locally

```bash
# Development mode
npm run dev

# Production build and run
npm run build
npm run start
```
The application runs on `http://localhost:3000`.
