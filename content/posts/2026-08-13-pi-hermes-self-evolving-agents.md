---
title: 一小时读懂 Pi、Hermes 与“自主进化”Agent：它们到底在进化什么
date: 2026-08-13
summary: 从源码而不是宣传语出发，拆解两个热门 Agent 的执行循环、桌面形态、技能系统，并比较 GenericAgent 与 AgentEvolver 两种完全不同的自进化路线。
tags: [AI Agent, 开源, 自主进化, 架构]
audio: /audio/2026-08-13-pi-hermes-self-evolving-agents.mp3
audioDuration: "15:02"
audioBytes: 3608973
---

这篇文章来自一次约一小时的定向源码调研。代码快照取自 2026 年 8 月 13 日：Pi 为 `7d8c11d`，Hermes 为 `9460cc1`，GenericAgent 与 AgentEvolver 均取当日 `main`。我关心的不是“谁更像钢铁侠的 Jarvis”，而是四个可以落到代码的问题：Agent 如何循环执行？桌面端只是皮肤还是运行时的一部分？所谓学习究竟写到了哪里？下一次任务真的会更好吗？

先给结论：**Pi 是精干、可嵌入的 Agent harness；Hermes 是常驻、多入口、带技能生命周期的个人 Agent 操作系统；GenericAgent 把成功路径沉淀为本地 Skill；AgentEvolver 则在训练流水线中生成任务、复用经验并更新模型策略。**它们都使用“进化”这个词，但改变的对象并不相同。

## 先纠正一个容易混淆的前提：Pi 并不是典型桌面 Agent

Pi 和 Hermes 最近都很热门，但不能简单叫作“两款桌面 Agent”。

Pi 的主产品是交互式 coding-agent CLI。它的 monorepo 同时提供统一模型 API、Agent core、终端 UI、Web UI、协议和服务端包，因此别人很容易把 Pi 嵌入桌面壳或聊天产品。可它自身最核心的体验仍是终端里的编码代理。

Hermes 才是完整覆盖 CLI、Ink TUI、Web dashboard、消息网关与 Electron Desktop 的常驻个人 Agent。它的 Electron 客户端通过 JSON-RPC 连接 Python 后端；同一个 Agent core 还能被 Telegram、Discord、Slack 等入口调用。桌面只是一个 session surface，能力和状态仍由后端管理。

这一区别很重要：**Pi 更像发动机与驾驶舱组件，Hermes 更像一辆已经装好发动机、仪表、车库和长期保养计划的车。**

| 维度 | Pi | Hermes | GenericAgent | AgentEvolver |
| --- | --- | --- | --- | --- |
| 主要定位 | 编码 Agent 与可嵌入 runtime | 常驻个人 Agent 平台 | 极简本地自主 Agent | 自进化 Agent 训练框架 |
| 主语言 | TypeScript | Python + TypeScript | Python | Python |
| 主要入口 | CLI / SDK / TUI / Web 组件 | CLI / TUI / Electron / Web / IM | TUI / Web / IM / 桌面辅助 | 训练 launcher / 环境服务 |
| “学习”落点 | 会话、扩展、人工/Agent 创建的 Skill | 记忆、会话检索、Agent-created Skill、Curator | L0–L4 记忆与任务 SOP/Skill | 任务数据、经验池、轨迹归因、模型权重 |
| 是否默认改模型权重 | 否 | 否 | 否 | 是，训练路线的核心目标 |
| 最适合 | 开发工具、定制 harness | 24×7 个人助理与跨渠道自动化 | 本地电脑操作与轻量自举 | Agentic RL 研究与训练 |

## 四者共享的骨架：模型并不“执行”，循环才执行

不论包装多复杂，工具型 Agent 的最小循环都很朴素：

```text
用户目标
  ↓
拼接系统提示、历史、可用工具
  ↓
调用模型
  ├─ 返回文本 → 结束本轮
  └─ 返回 tool call
       ↓
     校验参数、执行工具、记录结果
       ↓
     把 tool result 交回模型 ──┐
                               └─ 继续循环
```

模型只负责提出下一步；文件读写、终端命令、浏览器操作、权限拦截、失败重试、上下文压缩、状态持久化，全是 harness 的工作。今天 Agent 产品的差异，越来越少在这十几行概念循环里，而在循环周围的工程约束：怎样组织上下文，怎样暴露工具，怎样恢复会话，怎样让失败可控，以及怎样把一次成功转成可复用资产。

## Pi：把 Agent 拆成稳定内核与自由扩展层

Pi 的代码分层非常清楚。`@earendil-works/pi-ai` 统一不同模型提供商；`pi-agent-core` 管消息、工具调用和事件流；`pi-coding-agent` 负责真实产品体验；`pi-tui` 与 Web UI 包负责呈现。核心没有绑定具体模型、终端界面或数据库实现。

### 1. 核心循环是一条可观察的事件流水线

`packages/agent/src/agent-loop.ts` 的 `runLoop()` 有内外两层循环。内层处理模型回复、工具调用和用户中途 steering；外层在 Agent 本来准备结束时再检查 follow-up 队列。一次调用会依序发出 `turn_start`、`message_update`、`tool_execution_start`、`tool_execution_end`、`turn_end` 等事件，UI 不必猜测 Agent 当前正在做什么。

工具默认可并行执行，但有两个细节很成熟：

1. 如果任一工具标记为 sequential，整批调用转为串行，避免有副作用的操作乱序。
2. 并行完成事件可以按真实完成顺序发出，但写回模型上下文的 tool result 仍按原始 tool call 顺序排列，保证可复现性。

此外还有 `beforeToolCall`、`afterToolCall`、`transformContext`、`prepareNextTurn`、`shouldStopAfterTurn` 等挂点。权限确认、审计、模型切换、压缩和提前终止都可以在循环外实现，而不必把产品逻辑塞回内核。

### 2. Pi 的核心优势不是“自主进化”，而是可塑性

Pi 的扩展系统能注册工具、命令、快捷键、组件、消息渲染和生命周期事件。coding-agent 仓库里的示例包括危险命令确认、Git checkpoint、动态工具、SSH、provider payload、compaction、handoff 等。它鼓励使用者把自己的工作方式编码成 extension。

Pi 也支持 Agent Skills 标准。启动时只扫描 Skill 的名称和描述，把索引放进系统提示；任务匹配后才读取完整 `SKILL.md`、脚本与参考资料。这种 progressive disclosure 能避免几十个 Skill 同时挤占上下文。Pi 甚至明确写着“可以让 Pi 为你的用例创建 Skill”。

但要把措辞说准：**Pi 提供自扩展的材料和接口，不等于它默认运行一个后台进化器。**Skill 是否创建、何时整理、如何验证，通常仍由用户指令、项目规则或外部扩展决定。它更接近“给 Agent 一套优秀的编程语言”，而不是“替 Agent 安排一套自动学习制度”。

### 3. Pi 适合怎样的人

如果你想做自己的 coding agent、IDE 助手、垂直终端工具，或者需要一个不替你决定产品形态的 TypeScript runtime，Pi 很合适。它的取舍是少预设、强组合。代价也来自同一处：长期记忆、跨渠道常驻、技能治理和任务调度不是内核替你一站式做完的。

## Hermes：把“会做一次”变成“以后更容易做”

Hermes 的 Agent loop 本身并不神秘，核心仍在 `run_agent.py`：构造稳定系统提示和工具 schema，调用模型，执行 tool call，把结果追加到消息，再继续迭代。真正让 Hermes 不同的，是它围绕这个循环建立了长期运行系统。

### 1. 同一 Agent core，多种会话表面

Hermes 可以运行在本地、Docker、SSH、Modal、Daytona 等终端后端上；用户可以从 CLI、TUI、Electron、Web 或消息软件进入。Cron 能唤醒无人值守任务，delegation 能启动隔离子 Agent，SQLite 会话库负责跨会话检索。

这里有一个重要架构原则：能力属于 session，不属于某个进程环境变量。桌面端能看到的 UI 工具，由会话平台选择相应 toolset，而不是简单检查“这个 Python 进程是不是由 Electron 启动”。这让远程后端也能被桌面客户端正确驱动。

### 2. Hermes 的“自我改进”是 Skill 写入闭环

`tools/skill_manager_tool.py` 暴露 `create`、`patch`、`edit`、`write_file`、`remove_file`、`delete` 等操作。Agent 遇到复杂、易错或反复出现的任务后，可以把流程、坑点、脚本和模板写进 `~/.hermes/skills/`。下一次只需在 Skill 索引中匹配，再按需加载完整内容。

这是一种**外部化策略更新**：模型参数没有变化，但 Agent 下次收到的操作说明变了。它很像工程师写 runbook。第一次排障靠搜索和推理，第二次直接按经过验证的步骤执行。

这种方式比“每次都回忆完整历史”更便宜，也更可检查：Skill 是普通文件，可以 diff、审阅、固定、回滚。它的缺点同样明显：错误经验也可能被固化；描述写得不好就检索不到；Skill 越积越多，索引噪声和冲突会反过来拖累模型。

### 3. Curator 解决 Skill 越学越乱的问题

Hermes 的 Curator 是这套闭环里最值得研究的部分。它为 Agent-created Skill 记录 `use_count`、`view_count`、`patch_count`、最后活动时间、状态和 pin 标记。确定性规则让 Skill 经历：

```text
active ──长期未使用──> stale ──更长期未使用──> archived
```

归档是可恢复的，不做自动物理删除；被 pin 的 Skill 不参与自动迁移；Hub 安装、用户手写和外部目录的 Skill 默认不归 Curator 管。更有判断性的“把多个窄 Skill 合并为领域级 umbrella Skill”由一个独立的后台 `AIAgent` 完成，而且默认关闭，需要显式开启 consolidation。

独立后台 Agent 不是多余复杂度。Hermes 把 per-conversation prompt caching 看得很重：如果在活跃对话中途重建系统提示或替换工具集，缓存前缀会失效，成本会显著上升。Curator 用自己的会话和提示缓存，既能维护 Skill 库，又不污染用户正在进行的对话。

### 4. 这仍不是魔法

Curator 有 dry-run、备份、pin、provenance、只归档不删除等护栏，但风险不能被“自进化”三个字抹掉。项目 issue 已出现过后台整理长时间循环、消耗大量 token，以及自建 Skill 缺少机制级正确性保证的讨论。换言之，Hermes 已经解决“如何产生与维护经验资产”，尚未彻底解决“如何证明经验资产始终正确”。

一个生产可用的评估指标不应是“今天多生成了几个 Skill”，而应是：相似任务成功率是否提高？平均工具步数是否下降？人工接管是否减少？发生环境变化时是否能识别旧 Skill 已失效？

## Python 自主进化路线一：GenericAgent 的“边做边长 Skill 树”

我把“近期很火的 Python 自主进化 Agent”按一类问题理解，而不是强行猜成唯一项目。GenericAgent 是消费级、本地运行路线中最有代表性的一个。

它的 `agent_loop.py` 只有约 132 行，真实循环更短：调用模型、解析 tool call、交给 handler、把结果变成下一条 user message。复杂性主要放在 handler、分层记忆和 SOP 中。官方概括为 9 个原子工具，包括执行代码、文件读写、网页扫描与 JS 控制、询问用户、更新工作 checkpoint、触发长期记忆更新。

GenericAgent 把记忆分为 L0 到 L4：元规则、索引、长期事实、任务 Skill/SOP、原始会话归档。它的核心主张是“不预装所有能力，让 Agent 自己长出来”：遇到新任务时安装依赖、编写脚本、调试验证，再把成功路径固化到记忆层。真实浏览器与登录态、ADB、桌面输入让这些 SOP 能直接作用于用户电脑。

这条路线的优点是极简、直观、个人化强。一个有能力的基础模型配上代码执行，确实可以在很小的框架里做出大量事情。局限也很清楚：

- `code_run` 既是最强扩展点，也是最大的安全边界；
- “任务完成后写入 Skill”不自动等于 Skill 经过回归测试；
- 本地环境变化、网页改版、权限变化会让旧 SOP 快速过期；
- 项目 README 中的自举、token 节省等结果是项目方报告，应与独立复现分开看待。

GenericAgent 的“进化”本质上和 Hermes 类似，都是**运行时资产增长**。差别是 Hermes 更重视平台化、来源边界和生命周期治理；GenericAgent 更重视极少代码、真实电脑控制和让 Agent 自己搭环境。

## Python 自主进化路线二：AgentEvolver 更新的是训练策略

AgentEvolver 不是另一款桌面助理，而是一套端到端 Agentic RL 训练框架。它把自进化拆成三个机制：

1. **Self-questioning**：Agent 探索环境并自动生成任务，减少人工标注任务集。
2. **Self-navigating**：经验管理器从历史轨迹提炼经验，并注入后续 rollout，引导探索。
3. **Self-attributing**：对长轨迹中的中间步骤做语义归因，把最终成败更精细地分配到动作上，再用于策略优化。

源码结构也吻合这个叙事：`env_manager` 管沙盒实例和 rollout，`task_manager` 管数据混合、环境 profile 与 reward，`exp_manager` 为新任务选择历史经验，`context_manager` 管多轮上下文，`adv_processor` 做 ADCA-GRPO 语义归因，trainer 接到 veRL/Ray 训练栈。

这里真正可能变化的是模型权重。Agent 先给自己出题，在 AppWorld、BFCL 或游戏环境中产生轨迹，环境/判分器给 reward，归因模块判断哪些步骤贡献了结果，训练器再更新 policy。下一轮不是因为多读了一份 Markdown 而变强，而是模型在相似决策上的概率分布被训练改变了。

这条路线更接近机器学习意义上的“进化”，成本也高得多：需要可重置环境、可信 reward、足够 rollout、GPU 训练和严格评测。reward 写错会稳定地训练出错误行为；自动出题分布太窄会自我强化偏见；经验注入有效不代表权重更新有效。它适合研究团队，而不是普通用户在笔记本后台一直开着。

## “自主进化”至少有四个层级

讨论这类项目时，最好先问一句：**下一轮到底改了什么？**

| 层级 | 被修改的对象 | 代表 | 优点 | 主要风险 |
| --- | --- | --- | --- | --- |
| L1 会话适应 | 当前上下文、checkpoint | 所有工具 Agent | 快、无需持久化 | 会话结束即消失 |
| L2 记忆适应 | 事实、历史摘要、用户模型 | Hermes、GenericAgent | 跨会话个性化 | 污染、隐私、错误召回 |
| L3 策略资产适应 | Skill、SOP、脚本、模板 | Pi 可扩展能力、Hermes、GenericAgent | 可审计、可回滚、成本低 | 技能膨胀、过期、错误固化 |
| L4 参数适应 | 模型 policy/权重 | AgentEvolver | 行为真正内化 | 训练昂贵、reward hacking、灾难性遗忘 |

很多产品把 L2 或 L3 叫作 self-evolving，并没有错，只是它不是在线微调。把层级说清，才能公平比较。

## 我会怎样选

### 做开发者工具或垂直 Agent runtime：选 Pi

你得到一个边界清晰的 TypeScript 内核、统一模型接口、稳定事件协议和强扩展系统。长期学习机制可以按产品需要自己加，不会被框架预设绑住。

### 做常驻个人助理、跨渠道自动化：选 Hermes

它已经处理了会话、网关、cron、subagent、远程环境、Skill、记忆、桌面端和生命周期。需要接受更大的系统复杂度，并认真配置权限、Skill provenance、备份和 Curator 策略。

### 想用最少代码试验“电脑越用越会用”：看 GenericAgent

它适合研究极简 Agent、真实浏览器/桌面操作和个人 SOP 生长。不要因为代码少就降低安全审查；恰恰因为代码执行权很大，更应在隔离账号、测试机或容器中实验。

### 想训练更强的工具调用模型：看 AgentEvolver

前提是你已经有环境、任务分布、grader、GPU 与评估能力。它不是装好就替你整理邮件的产品，而是生产 Agent 训练数据和更新 policy 的基础设施。

## 一个比“自动写 Skill”更严格的验证实验

如果要判断某个 Agent 是否真的在进化，我会设计 30 个可重复任务，分成 10 个领域，每个领域三个难度。第一轮禁止加载旧 Skill；完成后允许系统沉淀经验。隔一天在干净会话中执行等价但不完全相同的任务，并记录：

- 成功率和人工接管次数；
- 工具调用总步数、重复失败步数；
- 输入 token、总成本、完成时间；
- 新经验是否被正确检索；
- 环境变化后能否拒绝过期经验；
- Skill/记忆回滚后指标是否回到基线。

只有第二轮稳定变好，而且提升能通过禁用新增资产而消失，才有理由说“学习闭环产生了因果效果”。只展示一次华丽的长任务，证明的是模型和工具当时完成了任务，不足以证明系统在持续进化。

## 最后的判断

Agent 的下一阶段未必是让模型在你的电脑上偷偷改自己的权重。更现实的路线，是把能力拆成可治理的层：稳定的执行循环、最小工具集、可检索记忆、可审计 Skill、离线评测，以及在证据充分时才进行的策略训练。

Pi 把执行内核做得干净；Hermes 把长期运行和 Skill 生命周期做成产品；GenericAgent 展示了极简框架也能长出复杂能力；AgentEvolver 把问题推进到自动数据与策略优化。它们不是同一赛道的四个替代品，而是 Agent 技术栈的四个截面。

真正值得关注的不是哪个项目最会说“自我进化”，而是谁能回答三个问题：**它改了什么？凭什么认为改对了？出错后怎样恢复？**

## 资料与源码入口

- [Pi monorepo](https://github.com/earendil-works/pi-mono)；重点文件：`packages/agent/src/agent-loop.ts`、`packages/coding-agent/docs/skills.md`
- [Hermes Agent](https://github.com/NousResearch/hermes-agent)；重点文件：`run_agent.py`、`tools/skill_manager_tool.py`、`agent/curator.py`
- [Hermes Curator 文档](https://github.com/NousResearch/hermes-agent/blob/main/website/docs/user-guide/features/curator.md)
- [GenericAgent](https://github.com/lsdefine/GenericAgent) 与其[技术报告](https://arxiv.org/abs/2604.17091)
- [AgentEvolver](https://github.com/modelscope/AgentEvolver) 与其[论文](https://arxiv.org/abs/2511.10395)
- 延伸阅读：[Self-Evolving Coding Agents 综述](https://arxiv.org/abs/2608.03392)
