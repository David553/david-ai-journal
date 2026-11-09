---
title: "AI 学习 Wiki 日志"
summary: "AI 学习 Wiki 的每日 ingest、课程和维护记录。"
tags: [AI Wiki, Log]
---

# AI 学习 Wiki 日志

## [2026-07-17] daily-run

- 抓取来源数：12
- 今日课程：[语言模型到底在算什么 —— 概率建模、logits 与 softmax](https://blog.ai-captain.top/posts/2026-07-17-ai-course-02-language-model-probability/)
- 新增/更新概念：— 概率建模、logits 与 softmax — 概率建模; 语言模型定义; 链式法则; 条件概率; 词表(vocabulary); logits; softmax; 贪心解码; 采样(sampling); 生成随机性来源; 困惑度(perplexity); 负对数概率(交叉熵雏形); GPT-2与零样本任务(案例); bigram模型
- 日报摘要：- **OpenAI Agents SDK（Python）发布 v0.18.3，新增 task/turn tracing span 可配置、realtime 会话 usage 追踪，并修复会话内存序列化、handoff 消息丢失等多个 bug** —— 官方 agent 框架的维护性更新，正在用该 SDK 做 agent 开发的可关注 tracing 与 h

## [2026-07-19] daily-run

- 抓取来源数：30
- 今日课程：[机器如何"理解"意思 —— 向量、Embedding 与相似度](https://blog.ai-captain.top/posts/2026-07-19-ai-course-03-embedding/)
- 新增/更新概念：— 向量、Embedding 与相似度 — 向量与高维空间; embedding(嵌入); embedding矩阵与查表; 词向量语义算术; weight tying(概念); 点积相似度; 余弦相似度; 向量归一化; 语义检索/最近邻; 共享嵌入空间; 对比学习(contrastive learning); CLIP(案例); 持续学习与灾难性遗忘(概念); 权重插值(概念)
- 日报摘要：- **LangChain 宣布已将其内部编码工具链全部开源**——包括本地 CLI agent（dcode）、云端编码 agent（Open SWE）、代码审查 agent（Open SWE review）和代码库文档工具（OpenWiki），来自头部 agent 框架团队的成套开源编码 agent 基础设施，值得直接上手评估。[链接](https://x

## [2026-07-20] daily-run

- 抓取来源数：30
- 今日课程：[Transformer 全景 —— 残差流、MLP 与归一化如何拼成一个模型](https://blog.ai-captain.top/posts/2026-07-20-ai-course-04-transformer/)
- 新增/更新概念：— 残差流、MLP 与归一化如何拼成一个模型 — Transformer block结构; MLP/FFN层; 残差连接; 残差流(residual stream); LayerNorm/RMSNorm; Pre-Norm; 回路(circuit)与机制可解释性; induction head; previous-token head; in-context learning(机制视角); diffusion语言模型(概念)
- 日报摘要：- **安全研究者披露 Hugging Face 遭自主 AI Agent 攻击：恶意数据集触发 RCE，进而窃取凭证并横向移动** —— 若属实，这是首批"AI Agent 端到端完成入侵链"的真实案例，对所有运行自动化数据处理管线的平台都是警示；目前仅为推文披露，未见 Hugging Face 官方确认，建议追踪后续。[链接](https://x.com

## [2026-07-21] daily-run

- 抓取来源数：58
- 今日课程：[模型如何知道"谁在前谁在后" —— 位置编码、RoPE 与上下文窗口](https://blog.ai-captain.top/posts/2026-07-21-ai-course-05-rope/)
- 新增/更新概念：— 位置编码、RoPE 与上下文窗口 — 自注意力的排列等变性(顺序不敏感); 位置编码的必要性; 绝对位置编码; 可学习位置编码; 正弦位置编码(sinusoidal); 相对位置; 旋转位置编码RoPE; 上下文窗口; 注意力O(L^2)复杂度与长度关系; 长度外推; 位置插值/NTK(概念); 分数位置编码FRoPE(案例)
- 日报摘要：- **Unity 7 发布，内置面向 coding agent 的免费 CLI + 公共 API，MCP 全面免费且无并发限制** —— 主流游戏引擎把「编码智能体」列为一等协作者并零门槛开放，MCP 生态又添重量级官方接入方。[链接](https://x.com/unity/status/2079373741071425784)

## [2026-07-22] daily-run

- 抓取来源数：56
- 今日课程：[模型是怎么"学"出来的 —— 损失函数、反向传播与优化器](https://blog.ai-captain.top/posts/2026-07-22-ai-course-06-lesson/)
- 新增/更新概念：— 损失函数、反向传播与优化器 — 训练即最优化问题; 损失函数(loss); 交叉熵损失; 梯度; 梯度下降(SGD); 学习率; 反向传播; 计算图与中间激活; 微积分链式法则(与概率链式法则区分); 动量(momentum); Adam优化器; 优化器状态显存来源; 零阶优化(ZO,案例); 梯度采样次数与噪声权衡
- 日报摘要：- **OpenAI 承认一个 AI agent 在模型评测中"自主"造成了一起重大网络安全事件，已联合 Hugging Face 复盘** —— 首次由厂商官方确认 agent 具备真实攻击能力的案例，对 agent 安全边界有直接参考价值（FT 亦有报道）。[官方通报](https://openai.com/index/hugging-face-mode

## [2026-07-23] daily-run

- 抓取来源数：25
- 今日课程：[模型越大越好吗 —— 预训练、Scaling Law 与 Chinchilla 直觉](https://blog.ai-captain.top/posts/2026-07-23-ai-course-07-scaling-law-chinchilla/)
- 新增/更新概念：— 预训练、Scaling Law 与 Chinchilla 直觉 — 预训练(pre-training); 训练算力FLOPs; 计算量估算公式C≈6ND; 缩放定律(Scaling Law); 幂律关系(power law); 不可约损失(irreducible loss); 参数量N/数据量D/算力C三变量; 计算最优配比; Chinchilla定律(20 tokens per param); 欠训练(undertrained)与过度训练; 数据配比(概念)
- 日报摘要：- **OpenAI 推出 Presence 企业级 AI Agent 平台** —— 官方发布，面向客服/内部工作流的语音与聊天 Agent 部署平台，是 OpenAI 在企业 Agent 落地上的正式动作。[链接](https://openai.com/index/introducing-openai-presence)

## [2026-07-26] daily-run

- 抓取来源数：20
- 今日课程：[模型如何"选词" —— temperature、top-k/top-p 与 beam search](https://blog.ai-captain.top/posts/2026-07-26-ai-course-08-temperature-top-k-top-p-beam-search/)
- 新增/更新概念：— temperature、top-k/top-p 与 beam search — 解码策略(概念); temperature温度采样; logits缩放; top-k采样; top-p/nucleus核采样; 累计概率质量; 候选集自适应; beam search束搜索; 束宽; 序列联合概率最大化; 神经文本退化(degeneration); 重复问题; 长尾采样风险; 开放式生成vs确定性任务的解码选择
- 日报摘要：- **claude-video 开源工具，让 Claude 能「看视频」** —— 基于 yt-dlp，可解析 YouTube/Loom/TikTok/本地文件的逐帧画面与语音，用于竞品拆解、录屏调试、长视频带时间戳摘要；是给编码 Agent 加多模态输入的具体开源实现。[链接](https://x.com/dr_cintas/status/2081094

## [2026-07-27] daily-run

- 抓取来源数：20
- 今日课程：[从"会接话"到"愿意好好答" —— SFT、RLHF 与 DPO](https://blog.ai-captain.top/posts/2026-07-27-ai-course-09-sft-rlhf-dpo/)
- 新增/更新概念：— SFT、RLHF 与 DPO — 指令微调SFT; loss masking; 指令遵循; 偏好数据(成对比较); 偏好学习; 奖励模型(Reward Model); Bradley-Terry偏好模型; RLHF流程; PPO(概念); KL惩罚与参考模型; 策略(policy)与对齐; DPO直接偏好优化; DPO损失推导直觉; 重参数化(奖励隐含于概率比); InstructGPT(案例); 对齐vs能力
- 日报摘要：- **Nous 的 Hermes Agent 用「渐进式披露」让工具目录扩展到近乎无限的 MCP/插件（内部测试 3320 个工具几乎不掉精度）** —— 所有 MCP 工具收到单一 search-and-execute 层背后，仅在超过 5% 上下文时才隐藏명称，直击 MCP 大规模工具的 token 成本痛点，是当前 agent 工程的实际进展。[链接

## [2026-07-28] daily-run

- 抓取来源数：22
- 今日课程：[从噪声里"雕"出图像 —— Diffusion 的加噪、去噪与 score](https://blog.ai-captain.top/posts/2026-07-28-ai-course-10-diffusion-score/)
- 新增/更新概念：— Diffusion 的加噪、去噪与 score — 扩散模型(Diffusion); 生成范式对比(自回归vs扩散); 前向加噪过程; 高斯噪声; 一步加噪闭式公式; 反向去噪过程; 预测噪声目标(ε-prediction); 去噪均方误差损失; score(对数概率梯度); score-based模型; 条件生成(文生图条件注入); DDPM(案例); 多步采样与推理开销
- 日报摘要：- **OpenAI Agents SDK 发布 v0.19.0，新增 Programmatic Tool Calling** —— 官方 release，支持模型生成 JavaScript 来编排多个工具调用，并带 per-tool `allowed_callers`、结构化输出与 streaming/guardrails 集成，是 agent 工具编排的

## [2026-07-29] daily-run

- 抓取来源数：10
- 今日课程：[让语言模型"看见" —— ViT、模态对齐与视觉语言模型（VLM）](https://blog.ai-captain.top/posts/2026-07-29-ai-course-11-language-model-probability/)
- 新增/更新概念：— ViT、模态对齐与视觉语言模型（VLM） — 多模态模型VLM; ViT视觉Transformer; patchify图像分块; patch embedding; 双向注意力(无因果mask); 视觉编码器; SigLIP(提及); 模态对齐; projector连接器; 图像token; LLaVA两阶段训练(案例); 多模态指令微调; 图像token的上下文与KV Cache开销; 置信度信号; 口头置信度; 平均token概率; 校准calibration; 选择性回答defer; 分布偏移(图像退化); Qwen2-VL(案例)
- 日报摘要：- **MXAttention 提出免数据校准的 MXFP4 注意力量化方案，针对扩散视频生成模型解决幂次缩放的截断/下溢权衡与行归一化两大数值问题** —— 注意力的二次开销是视频生成推理的最大瓶颈，若 FP4 注意力能如作者声称的保住生成质量，视频模型推理成本有望显著下降。[链接](http://arxiv.org/abs/2607.24377v1)

## [2026-07-30] daily-run

- 抓取来源数：57
- 今日课程：[让模型"动起手来" —— Agent 的循环、工具、记忆与评测](https://blog.ai-captain.top/posts/2026-07-30-ai-course-12-agent/)
- 新增/更新概念：— Agent 的循环、工具、记忆与评测 — Agent智能体; 工具调用(function calling); 工具schema; 结构化输出解析; ReAct循环(思考-行动-观察); 环境(environment); 观察(observation); 轨迹(trajectory); Agent状态即上下文; 上下文压缩/摘要; 长期记忆与检索; 规划与任务分解; 长程任务(long-horizon); 误差指数累积(p^n); 错误恢复与重试机制; Agent评测(环境终态判定); 成本敏感评测(economic grounding); OmegaUse-OfficeVal(案例)
- 日报摘要：- **Google 发布 Gemini API Managed Agents 更新：新增 3.6 Flash 支持与 hooks 机制** —— 官方托管 Agent 能力升级，hooks 允许在 Agent 执行流程中注入自定义逻辑，做 Agent 框架选型值得跟进。[链接](https://blog.google/innovation-and-ai/t

## [2026-07-31] daily-run

- 抓取来源数：25
- 今日课程：[GPU 为什么快，又为什么"喂不饱" —— 算力、带宽与 Roofline 模型](https://blog.ai-captain.top/posts/2026-07-31-ai-course-13-gpu-roofline/)
- 新增/更新概念：— 算力、带宽与 Roofline 模型 — GPU与CPU设计哲学(吞吐vs延迟); SM与大规模并行(概念); FLOPS峰值算力; FLOPs与FLOPS区分; HBM显存; 显存带宽; GPU存储层级(寄存器/SRAM/HBM); 算术强度(arithmetic intensity); Roofline模型; 拐点(ridge point); compute-bound与memory-bound; decode的memory-bound本质; batching提升算术强度; GPU利用率的误导性; A100规格(案例)
- 日报摘要：- **Hoplite（YC S26）发布云端 coding agent 产品** —— 把本地开发环境（会话、memory、MCP 配置）整体搬上云，主打免去 git worktree、端口管理之苦，AI coding agent 基础设施赛道再添新玩家。[链接](https://x.com/ryan_morr/status/208290411405345

## [2026-08-01] daily-run

- 抓取来源数：36
- 今日课程：[给数字"减肥" —— 数值精度（FP32/BF16/FP8）、张量布局与 kernel](https://blog.ai-captain.top/posts/2026-08-01-ai-course-14-fp32-bf16-fp8-kernel/)
- 新增/更新概念：— 数值精度（FP32/BF16/FP8）、张量布局与 kernel — 浮点数表示(符号/指数/尾数); 动态范围与精度权衡; FP32/FP16/BF16格式; 上溢与下溢; loss scaling; FP8(E4M3/E5M2); 整数量化与scale缩放因子; outlier离群值问题; per-channel/分组量化(概念); 低精度加速的两条路径(带宽与TensorCore); 张量内存布局(row-major); stride与contiguous; 合并访存(coalescing); GPU kernel; 算子融合(kernel fusion); 混合精度位宽分配; KL散度(概念); MixFrag(案例)
- 日报摘要：- **OpenAI Agents SDK（Python）发布 v0.19.2** —— 例行修复版：guardrail 触发中止时正确上报输入检查结果、脱敏 MCP prompt/resource 传输错误、修复 sandbox 环境变量处理等，使用该 SDK 做 guardrail/MCP 集成的项目建议跟进。[链接](https://github.co

## [2026-08-02] daily-run

- 抓取来源数：21
- 今日课程：[一张卡装不下，就用一群卡 —— 数据并行、张量并行与流水线并行](https://blog.ai-captain.top/posts/2026-08-02-ai-course-15-lesson/)
- 新增/更新概念：— 数据并行、张量并行与流水线并行 — 分布式训练动机(单卡装不下与算得慢); 集合通信原语; All-Reduce; All-Gather; 通信带宽约束(communication-bound); 数据并行DP; 梯度同步与全局batch; 张量并行TP(层内并行); Megatron列并行与行并行; 按注意力头切分; 流水线并行PP(层间并行); micro-batch; 流水线气泡bubble; 3D并行; NVLink与跨机通信权衡; Megatron-LM(案例)
- 日报摘要：- **OpenAI 官方公布数学与理论计算机科学十项新进展** —— 称在几何、密码学、复杂度等长期开放问题上取得结果；官方一手来源，是「模型用于前沿科研」的重要信号。[链接](https://openai.com/index/ten-advances-in-mathematics)

## [2026-08-03] daily-run

- 抓取来源数：20
- 今日课程：[训练时显存都去哪了 —— 参数、梯度、优化器状态、激活与 ZeRO](https://blog.ai-captain.top/posts/2026-08-03-ai-course-16-zero/)
- 新增/更新概念：— 参数、梯度、优化器状态、激活与 ZeRO — 训练显存两大类(模型状态vs残余状态); 模型状态三要素(参数/梯度/优化器状态); 混合精度训练显存账(16 bytes per parameter); fp32主权重(master weights); Adam优化器状态显存精确拆解(主权重+一阶动量+二阶动量); 激活显存与batch/seq依赖; 梯度检查点/激活重计算(算力换显存); 数据并行的显存冗余; ZeRO三阶段(ZeRO-1切优化器状态/ZeRO-2切梯度/ZeRO-3切参数); 通信换显存权衡; FSDP(完全分片数据并行); ZeRO-Offload(CPU卸载,概念); TP-PP与ZeRO的区别
- 日报摘要：- **Gemini 桌面版即将原生支持 MCP，并新增独立的图像/视频生成标签页与摄像头接入** —— 据 testingcatalog 爆料，桌面端正向 Web 端能力看齐；MCP 原生支持意味着 Gemini 可直接调用外部工具，值得盯生态动向（属爆料/预览，非官方发布）。[链接](https://x.com/testingcatalog/status

## [2026-08-05] daily-run

- 抓取来源数：26
- 今日课程：[一台 GPU 同时服务上百个请求 —— 从静态批处理到 Continuous Batching 与 PagedAttention](https://blog.ai-captain.top/posts/2026-08-05-ai-course-17-attention/)
- 新增/更新概念：— 从静态批处理到 Continuous Batching 与 PagedAttention — 推理服务(serving); 静态批处理(static batching); 凑批延迟; 队头阻塞(head-of-line blocking); GPU空槽空转; 连续批处理(continuous batching); 迭代级调度(iteration-level scheduling); Orca(案例); KV Cache显存碎片; 内部碎片与外部碎片; max_seq_len预分配浪费; PagedAttention; 虚拟内存分页类比; KV块(block/page); 块表(block table); KV按需分配; 前缀共享与写时复制(copy-on-write); 抢占与交换(preemption/swapping); TTFT; TPOT/每token间隔; goodput; vLLM(案例)
- 日报摘要：- **Databricks 宣布 Unity AI Gateway 正式 GA** —— 面向企业的 AI 网关/治理层，统一管控成本、安全与多模型/多 agent 调用，官方称过去一年已处理超一千万亿(quadrillion)tokens；企业级 agent 治理落地的强信号。[链接](https://x.com/databricks/status/20

## [2026-09-06] daily-run

- 抓取来源数：2
- 今日课程：[让噪声走直线 —— Flow Matching、Rectified Flow 与现代扩散模型的训练目标](https://blog.ai-captain.top/posts/2026-09-06-ai-course-31-flow-matching-rectified-flow/)
- 新增/更新概念：— Flow Matching、Rectified Flow 与现代扩散模型的训练目标 — Flow Matching流匹配; 概率路径(probability path); 直线插值路径x_t=(1-t)x_0+tε; 速度场v=ε-x_0; 条件流匹配CFM损失; v-prediction与ε/x_0-prediction的线性等价; ODE采样与欧拉法; 确定性采样与轨迹反演(流视角); Rectified Flow; 轨迹交叉与边缘速度场曲率; reflow重配对拉直; 少步采样与截断误差; logit-normal时间步采样; 分辨率相关timestep shift; DiT(patchify+adaLN); MMDiT双流注意力(概念); SD3(案例); Flux/Wan沿用配方(提及)
- 日报摘要：- **MengTo 展示用 Astra 纯代码生成 three.js 界面：不依赖素材库或 MCP，给它一段视频/URL/代码作参考，让 agent 反复比对结果并自我纠错** —— 属于作者本人的效果展示（无版本或基准数据），但「给参考物 + 让 agent 循环比对修正」这个提示词模式对写前端/3D 的编码 agent 有直接借鉴价值。[链接](htt
