# Kiss Translator 中转仓 PR 工作流

本仓库是 fishjar/kiss-translator 的 fork，充当 PR 自动化工作流的中转演练仓：默认分支承载控制工作流，定期镜像上游代码，PR 流水线（描述自动填充、AI 审查打标、临时分支回收）在真实 fork 上循环运行。

## 生效方式

`.github/workflows/` 下的工作流由 GitHub Actions 读取，仅当定义位于仓库默认分支（控制分支 hub）上才对后续事件生效。sync-upstream 会把清理工作流注入临时分支 wip，保证以 wip 为基的 PR 合并后清理仍可执行。AI 接线（变量与密钥）由人工在目标仓工作区运行 `.github/scripts/set-agnes-config.ps1` 完成，前置为 gh CLI 已登录。

## 工作流闭环

1. **Sync Upstream**（`sync-upstream.yml`，每 6 小时 + 手动触发）
   探测上游（手动输入 > 仓库变量 UPSTREAM_REPO > 自动识别 fork parent），强推对齐镜像分支 dev 到上游 dev，再以上游最新提交重建临时分支 wip 并注入清理工作流。
2. **提 PR**
   贡献者从自建 head 分支向 wip 发起 PR，作为流水线演练入口。
3. **Auto Fill PR**（`auto-fill-pr.yml`，pull_request_target 触发）
   经 REST API 读取变更事实，调用 AI 按 `pull_request_template.md` 生成并回写 PR 标题与正文；机器人 PR、draft、开关停用、外部作者四类情况不代笔。
4. **Bot Review 聚合打标**（`bot-review-labeler.yml`）
   汇总当前 head 轮次 CodeRabbit / Kilo Code 的审查证据，自动开通标签体系并写入 review / risk 标签，维护一条带状态表格与徽章的评论；kilocode 为必需 bot，缺席即等待。
5. **Cleanup**（`pr-cleanup-reset.yml`，PR 合并入 wip 后触发）
   wip 强推重置到镜像 dev（即上游最新提交），演练合并内容丢弃，wip 常驻等待下一轮。

## 核心入口

- 工作流定义: `.github/workflows/`
- PR 自动填充脚本: `.github/scripts/auto-fill-pr.mjs`
- 审查状态徽章资产: `.github/assets/badges/`

## 全局约束

- Fork PR 依赖 `pull_request_target`；GitHub 自 2026-11-02 起默认收紧该触发器，需在仓库 Actions 设置保持放行，否则打标与填充对 fork PR 静默失效。
- 仓库变量开关只认小写字面量：`AUTO_FILL_PR_ENABLED` 置 false 停用自动填充；`AUTO_FILL_PR_ALLOW_EXTERNAL` 置 true 才对外部作者开放。
- wip 是一次性演练分支，合入内容不保留；功能落地仍走上游仓库自身流程。
