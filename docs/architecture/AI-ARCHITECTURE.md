
### 2. `docs/architecture/AI-ARCHITECTURE.md`

```md
# Supermama Lark MCP Architecture

## 目標

讓 AI Client 透過標準 MCP Protocol 安全讀取 Supermama 的 Lark 公司知識。

## v0.1 架構

```text
MCP Client
    ↓ stdio
Lark MCP Server
    ↓
read_lark_document
    ↓
Lark Client
    ├── Authentication
    ├── Wiki Node Resolution
    └── Docx Content API