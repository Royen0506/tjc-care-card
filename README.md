# tjc-care-card

山佳社青關懷小卡（Angular 20），資料來源為 Google Apps Script API。

## 需求

- Node.js：`^20.19.0`、`^22.12.0` 或 `>=24.0.0`（建議使用 `.nvmrc` 的 `22.12.0`）
- 進入專案後執行：`npm install`

## 指令

| 指令                    | 說明                                                 |
| ----------------------- | ---------------------------------------------------- |
| `npm start`             | 本機開發（`http://localhost:4200`）                  |
| `npm run build`         | 正式建置（根路徑 `/`）                               |
| `npm run build:pages`   | GitHub Pages 建置（`baseHref` 為 `/tjc-care-card/`） |
| `npm run preview:pages` | 本機模擬 GitHub Pages 子路徑預覽                     |
| `npm test`              | 單元測試（Karma）                                    |

## GitHub Pages

**線上網址：** https://royen0506.github.io/tjc-care-card/#/

（使用 Hash 路由，無痕／重新整理也不會 404。）

`main` 分支推送後，[Deploy to GitHub Pages](.github/workflows/deploy-github-pages.yml) 會自動建置並部署。

### Google Apps Script

- 範例程式：`scripts/gas-doGet.example.js`（需支援 JSONP `callback`）
- 部署權限必須是 **「任何人」**，無痕模式／未登入 Google 的訪客才能讀到資料

### 首次啟用（只需做一次）

1. 開啟 repo **Settings → Pages**
2. **Build and deployment → Source** 選 **GitHub Actions**
3. 推送至 `main` 後，在 **Actions** 分頁確認 workflow 成功

### 本機預覽 Pages 版型

```bash
npm run preview:pages
```

瀏覽器開啟：`http://127.0.0.1:8080/tjc-care-card/`
