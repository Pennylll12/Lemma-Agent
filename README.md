# Lemma Agent

Supermama AI Assistant 的 Agent 與 MCP 工程專案。

## Lark MCP v0.3.3

- `read_lark_document`：讀取單篇 Wiki 文件。
- `list_lark_wiki_children`：列出直接子節點（HTTP）。
- `crawl_lark_wiki_tree`：只爬取目錄，不讀正文。
- `read_lark_wiki_subtree`：爬取子樹並批讀 docx 正文，限制讀取數量與回傳量，隔離單篇失敗。

HTTP 使用 stateful MCP sessions；stdio 提供 read、crawl 和 subtree 工具。

## 安裝、測試與啟動

```sh
npm ci --ignore-scripts
npm test
npm run mcp:http
```

真實 Lark 連線需透過環境變數或本地 `.env` 設定 `LARK_APP_ID` 和 `LARK_APP_SECRET`。
不要提交 `.env` 或憑證。自動測試使用模擬 Lark API，不需要真實憑證。

詳細參數、輸出語義、Remote MCP 與 ChatGPT 驗收：

- [v0.3.3 子樹正文讀取](docs/versions/v0.3.3.md)
- [v0.3.2 歷史交付紀錄](docs/versions/v0.3.2.md)

v0.3.2 已於 PR #2 合併，使用者已完成 Codespaces → GitHub → Mac 同步及 GPT 連線。
v0.3.3 在 `feature/lark-wiki-subtree-v0.3.3` 開發，發佈狀態以 Git 分支／PR 為準。
目前 HTTP 仍是未加入鑑權的 POC，不應直接當成公司級正式服務。

## v0.3.4 開發：Metadata 與 Wiki 搜尋

新增 `get_lark_wiki_metadata` 與 `search_lark_wiki`，提供相對 Wiki 路徑、深度、
擷取時間，以及指定子樹的標題／docx 正文字串搜尋。搜尋結果包含來源片段與覆蓋限制。
詳見 [v0.3.4 使用及驗收](docs/versions/v0.3.4.md)。
執行 `npm test` 或 `npm run test:wiki-search`；远端驗收用 `npm run test:wiki-search:remote`。
