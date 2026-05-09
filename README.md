# H5 跳一跳

Vite + TypeScript + Three.js scaffold for a WeChat 跳一跳-style H5 game.

## 技术选型

| 维度       | 选择              | 理由                                                  |
| ---------- | ----------------- | ----------------------------------------------------- |
| 构建工具   | Vite 5            | 启动快、热更新好、产物体积可控                        |
| 渲染       | Three.js 0.160    | 原版 3D 等距视角天然契合；core gzip ~150KB，预算充足  |
| 语言       | TypeScript 5      | 类型安全，便于多人协作                                |
| 代码规范   | ESLint + Prettier | 业界事实标准                                          |
| 物理       | 自研轻量积分      | 仅水平速度 + 重力，无需 Cannon/Ammo，避免引入数百 KB  |

> 备选 Phaser 3：内置物理引擎友好，但 gzip 通常 400KB+，挤压玩法/资源预算，不选。

## 目录结构

```
src/
  scenes/    # 游戏场景（GameScene 等）
  entities/  # 角色、平台等游戏实体
  utils/     # 通用工具（resize、math 等）
  main.ts    # 入口
  style.css  # 全局样式（移动端适配）
```

## 命令

```bash
npm install
npm run dev          # 启动本地开发服务器（0.0.0.0:5173，手机同 Wi-Fi 直接访问）
npm run build        # 生产构建（terser 压缩 + 资源 hash）
npm run preview      # 本地预览构建产物
npm run lint         # ESLint
npm run format       # Prettier
```

## 移动端适配

- `viewport`：禁用缩放、`viewport-fit=cover` 适配刘海屏。
- 全屏 canvas，使用 `100dvh` 处理 iOS Safari 地址栏高度变化。
- 通过 `env(safe-area-inset-*)` 处理安全区。
- `touch-action: none`、禁用长按菜单/选区，减少误触。

## 体积预算

目标：单页产物 gzip < 500KB。

- three (core) ~150KB gzip
- 业务代码预计 < 100KB gzip
- 留白用于贴图与音效
