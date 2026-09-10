
### 3. `docs/versions/CHANGELOG.md`

```md
# Changelog

所有重要工程改動均記錄於此文件。

## [0.1.0] - 2026-09-10

### Added

- Lark MCP Server stdio runtime
- `read_lark_document` MCP Tool
- MCP Client 端到端測試
- MCP、Lark authentication 及 Tool 測試指令
- `.env.example`
- MCP 架構及專案說明文件

### Changed

- dotenv 改為 quiet mode，避免污染 MCP stdio
- 測試工具改由命令列接收 Lark URL
- 更新 Lark Knowledge Skill 規則

### Security

- `.env` 和 `.env.*` 已加入忽略規則
- MCP v0.1 僅開放文件讀取
- 文件內容不在 MCP 自動測試中輸出

### Verified

- Lark authentication：通過
- Lark Tool reading：通過
- MCP Client connection：通過
- MCP Tool discovery：通過
- MCP document reading：通過