# 安全策略

## 支持的版本

只对 `@vtable-guild/vtable-guild` 的**最新发布版本**提供安全修复。当前为 `2.x`。

| 版本 | 是否支持 |
| ---- | -------- |
| 2.x  | ✅       |
| < 2  | ❌       |

## 报告漏洞

**请不要通过公开 issue 报告安全问题。**

用 GitHub 的私密报告通道：仓库 [Security → Report a vulnerability](https://github.com/parade0393/vtable-guild/security/advisories/new)。这会开一条只有你和维护者可见的私密讨论。

报告里请尽量包含：

- 受影响的版本
- 复现步骤或 PoC（可以用 [Playground](https://parade0393.github.io/vtable-guild/play/) 的分享链接）
- 你判断的影响面
- 如果有修复思路，也欢迎一并提出

## 处理时间

本项目由个人在业余时间维护，无法承诺企业级 SLA。实际节奏大致是：

- 3 个工作日内确认收到
- 10 个工作日内给出评估结论和处理计划
- 修复后在 GitHub Security Advisory 中致谢报告者（除非你希望匿名）

## 需要说明的范围问题

vtable-guild 是一个**纯前端渲染组件**，没有网络请求、没有服务端、不做持久化、不执行用户提供的代码字符串。因此实际的安全面主要集中在渲染路径上，例如：

- 通过 `customRender` / slot 渲染未经转义的内容导致的 XSS
- 主题 `ui` / `class` 注入引发的样式逃逸

需要注意的是：**渲染任意 HTML 的能力是由使用方代码引入的**。如果你在 `customRender` 里返回未转义的用户输入，这属于使用方的问题，不属于本库漏洞。Vue 的模板默认会转义文本内容。

依赖面很小（运行时仅 `tailwind-variants`），上游依赖的漏洞请直接报给对应项目，但如果它实际影响到本库的使用方式，也欢迎告知。
