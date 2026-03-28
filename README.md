# AwakenSphere

awakens.life 的前台源码。

## 项目说明

- **网站地址**：https://awakens.life
- **部署平台**：Netlify（项目 ID：friendly-daffodil-81cfed）
- **域名 DNS**：在 WordPress.com 管理
- **构建方式**：无需构建，直接编辑 HTML 文件即可
- **自动部署**：push 到 `main` 分支后，Netlify 自动部署

## 文件说明

| 文件 | 说明 |
|------|------|
| `index.html` | 主网站（前台 SPA） |
| `admin.html` | 临时后台管理页面 |

## 本地开发

直接用浏览器打开 `index.html` 即可预览，或用任意本地服务器：

```bash
npx serve .
```

## 部署流程

```
编辑 HTML → git add → git commit → git push → Netlify 自动部署
```

## 给 AI 的上下文

使用 Claude Code 开发时，请先阅读 [`CLAUDE.md`](./CLAUDE.md)，里面记录了前后端连接点、数据结构和开发约束。
