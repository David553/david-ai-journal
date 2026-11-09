import { mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises'
import { execFile } from 'node:child_process'
import path from 'node:path'
import { promisify } from 'node:util'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const day = '2026-07-17'
const siteUrl = 'https://blog.ai-captain.top'
const execFileAsync = promisify(execFile)

const lectures = [
  ['SQ3fZ1sAqXI', 'overview-tokenization', 'Overview and Tokenization', ['tokenization', 'BPE', 'vocabulary', 'data pipeline'], '先建立全局地图：语言模型不是直接读文字，而是读 token 序列。tokenizer 决定上下文预算、跨语言效率和训练成本。'],
  ['msHyYioAyNE', 'pytorch-resource-accounting', 'PyTorch and Resource Accounting', ['PyTorch', 'FLOPs', 'activation memory', 'GPU memory'], '这一讲训练你做资源核算：参数、activation、optimizer state、FLOPs 和显存峰值，决定 4060 能跑什么。'],
  ['ptFiH_bHnJw', 'architectures-hyperparameters', 'Architectures and Hyperparameters', ['Transformer', 'hyperparameters', 'learning rate', 'context length'], '把模型结构和超参连起来：层数、宽度、head、MLP ratio、上下文长度和学习率都在预算里互相制约。'],
  ['LPv1KfUXLCo', 'mixture-of-experts', 'Mixture of Experts', ['MoE', 'routing', 'expert parallelism', 'load balancing'], 'MoE 用稀疏激活提高参数容量，但引入路由、负载均衡和通信问题。它是模型能力和系统复杂度的交换。'],
  ['6OBtO9niT00', 'gpus', 'GPUs', ['GPU', 'HBM', 'SM', 'tensor cores'], 'GPU 不是“更快的 CPU”。它依赖内存层级、并行调度、tensor cores 和高吞吐矩阵运算。'],
  ['E8Mju53VB00', 'kernels-triton', 'Kernels and Triton', ['kernel', 'Triton', 'tiling', 'FlashAttention'], 'Kernel 是数学公式真正落到 GPU 的地方。Triton/FlashAttention 的核心是重排计算，减少 HBM 读写。'],
  ['l1RJcDjzK8M', 'parallelism-1', 'Parallelism 1', ['data parallelism', 'tensor parallelism', 'pipeline parallelism'], '并行不是越多越好。你要知道切 batch、切矩阵、切层分别解决什么问题，又增加什么通信成本。'],
  ['LHpr5ytssLo', 'parallelism-2', 'Parallelism 2', ['ZeRO', 'checkpointing', 'communication', 'bubble'], '第二讲并行进入组合策略：ZeRO、activation checkpointing、流水线气泡和通信瓶颈。'],
  ['6Q-ESEmDf4Q', 'scaling-laws-1', 'Scaling Laws 1', ['scaling laws', 'compute optimal', 'loss curve'], 'Scaling laws 把训练决策变成预算问题：参数、数据 token 和算力如何分配。'],
  ['fcgPYo3OtV0', 'inference', 'Inference', ['prefill', 'decode', 'KV cache', 'batching'], '推理系统和训练系统完全不同。重点是 prefill/decode、KV cache、batching、量化和延迟吞吐权衡。'],
  ['OSYuUqGBQxw', 'scaling-laws-2', 'Scaling Laws 2', ['Chinchilla', 'data scaling', 'compute budget'], '进一步理解 compute-optimal：模型更大、数据更多、训练更久之间怎么取舍。'],
  ['x-R5l2HsXqM', 'evaluation', 'Evaluation', ['evaluation', 'benchmark', 'contamination', 'robustness'], '评估不是跑一个榜单。要区分能力、鲁棒性、安全、污染、prompt 敏感性和线上指标。'],
  ['WePxmeXU1xg', 'data-1', 'Data 1', ['data collection', 'filtering', 'deduplication'], '数据是模型质量的地基。抓取、清洗、过滤、去重会比很多架构细节更影响模型表现。'],
  ['9Cd0THLS1t0', 'data-2', 'Data 2', ['data mixture', 'synthetic data', 'quality filtering'], '第二讲数据更接近 recipe：领域混合、质量过滤、合成数据和 contamination 控制。'],
  ['Dfu7vC9jo4w', 'alignment-sft-rlhf', 'Alignment: SFT/RLHF', ['SFT', 'RLHF', 'preference model', 'alignment'], 'SFT/RLHF 把基础模型变成更符合人类指令和偏好的助手，但也带来 reward hacking 和过度迎合。'],
  ['46f2QTDB08Q', 'alignment-rl-1', 'Alignment: RL 1', ['policy', 'reward', 'KL penalty', 'advantage'], 'RL 进入语言模型后训练后，核心是把奖励、KL 约束和策略更新接到文本生成上。'],
  ['JdGFdViaOJk', 'alignment-rl-2', 'Alignment: RL 2', ['RLVR', 'verifiable reward', 'reasoning', 'post-training'], '最后一讲看可验证奖励和 RL 后训练，理解为什么数学、代码等任务适合引入环境反馈。'],
]

function fm(title, summary, tags, extra = {}) {
  const lines = ['---', `title: "${title}"`, `date: ${day}`, `summary: "${summary}"`, `tags: [${tags.join(', ')}]`]
  for (const [k, v] of Object.entries(extra)) lines.push(`${k}: ${JSON.stringify(v)}`)
  lines.push('---', '')
  return lines.join('\n')
}

function slug(n, short) {
  return `${day}-cs336-video-${String(n).padStart(2, '0')}-${short}`
}

async function transcriptStats(id) {
  const files = await readdir(path.join(root, 'data/cs336-video-analysis/subtitles'))
  const file = files.find((name) => name.includes(`[${id}]`) && name.endsWith('.vtt'))
  if (!file) return { file: '', cues: 0, chars: 0 }
  const text = await readFile(path.join(root, 'data/cs336-video-analysis/subtitles', file), 'utf8')
  const cues = (text.match(/-->/g) || []).length
  return { file, cues, chars: text.length }
}

function audioScript(n, title, concepts, thesis) {
  return `你现在不用看屏幕。这是 Stanford CS336 视频课第 ${n} 讲的中文伴听课程：${title}。

这一讲的核心是：${thesis}

你听英文原课时，先不要试图逐字翻译。第一遍只抓三个词：${concepts.slice(0, 3).join('、')}。听到这些词时，暂停一下，问自己：它在语言模型系统的哪一层？是数据层、模型层、训练层、GPU kernel 层、推理 serving 层，还是后训练评估层？

这一讲可以放进 CS336 的主线里理解：从文本进入 tokenizer，到 Transformer 计算 logits，再到训练 loop 更新参数，最后到推理服务把 token 一个一个吐给用户。CS336 的价值不是给你一堆术语，而是让你看到每个术语背后的资源约束。模型效果、显存、吞吐、延迟、数据质量和评估可信度，是同一件事的不同侧面。

如果你用 RTX 4060 自学，这一讲不要追求复现 Stanford 的完整 assignment。你要做的是一个缩小版实验：把概念变成可测量的数字。比如显存用了多少，tokens per second 是多少，sequence length 翻倍后哪里爆了，KV cache 打开前后 decode 速度差多少。小实验能让你真正理解 infra。

第一段，先建立 CS336 的学习方式。CS336 和很多大模型课不一样，它不是只讲 Transformer 公式，也不是只讲应用效果。它真正训练的是系统直觉：一个模型为什么能训练起来，为什么训练慢，为什么显存爆，为什么推理延迟高，为什么数据质量一变模型行为就变。你每听一讲，都要把内容放进同一个流水线里：文本或者多模态数据进入 tokenizer，变成 token；token 进入 embedding 和 Transformer block；训练时算 loss、反向传播、更新权重；推理时模型做 prefill、decode、维护 KV cache；上线后还要评估、监控、蒸馏、量化和持续迭代。这样听英文课时，你不会被单个术语打散。

第二段，讲本节的核心概念：${concepts.join('、')}。这些词不是孤立名词，而是一组工程开关。你要问三个问题。第一，它解决的原始问题是什么？第二，它把成本转移到了哪里？第三，如果我在 4060 上做一个缩小版 demo，我能测出什么数字。比如有些概念主要影响训练吞吐，有些概念主要影响显存峰值，有些概念主要影响模型质量，有些概念主要影响推理延迟。真正的 infra 能力，就是把概念翻译成指标。

第三段，讲算法和系统如何连起来。很多课程会把算法讲成数学对象，把系统讲成部署对象，但大模型里两者没有明显分界。一个 attention 公式，落到系统里就是 Q、K、V 张量的 shape、矩阵乘法的 FLOPs、activation 的保存策略、显存读写、kernel fusion 和通信。一个 tokenizer 决策，落到系统里就是上下文长度、训练 token 预算、多语言效率和服务成本。一个 evaluation benchmark，落到系统里就是采样参数、prompt 模板、数据污染检查和线上指标。你听这一讲时，要不断问：这个算法设计最终改变了哪一个系统约束。

第四段，讲 4060 的学习策略。你的 4060 不适合复刻 Stanford 大规模训练，但很适合建立真实直觉。最小实验有四类。第一类是 shape 实验，把 batch、sequence length、hidden size、layer 数改来改去，记录显存和耗时。第二类是 throughput 实验，测 tokens per second，观察 prefill 和 decode 的差别。第三类是 quality 实验，用一个很小的数据集训练或微调，观察 loss 和样例输出。第四类是 failure 实验，故意把上下文拉长、batch 加大、数据变脏、精度切换，看系统如何失败。小实验的目标不是效果好，而是让你能预测失败。

第五段，讲英语听力。技术英语不要逐词听。你重点捕捉四类句子。第一类是定义句，通常以 “the key idea is”、“we define”、“we can think of it as” 开头。第二类是瓶颈句，通常出现 “bottleneck”、“memory-bound”、“compute-bound”、“communication” 这些词。第三类是实践句，通常出现 “in practice”、“empirically”、“it turns out”。第四类是失败句，通常出现 “this breaks when”、“the problem is”、“however”。你听到这些句子就慢下来，因为它们往往是课程真正的知识点。

第六段，给你一个听课检查表。听完本节后，你要能用中文复述五件事。第一，本节概念在大模型流水线的哪一段。第二，它和显存、算力、数据或评估哪个资源最相关。第三，它为什么在小模型里不明显、在大模型里变关键。第四，开源工程里通常会用什么参数或配置暴露它。第五，如果出问题，日志或指标会怎么表现。只要能回答这五件事，这节课就不是被动听过，而是真的进入你的工程知识库。

第七段，回到本节主题。${thesis}。围绕这个主题，你要特别注意一个模式：CS336 经常先给一个简单直觉，再逐步把隐藏成本摊开。最开始你会觉得概念只是“让模型更好”或者“让训练更快”，但往下听会发现每个优化都会换来别的代价：更复杂的数据、更高的通信、更难的调参、更不稳定的评估，或者更麻烦的推理部署。这种 trade-off 意识，比记住任何单个公式都重要。

第八段，讲逐段听英文视频的方法。你可以把一节英文课拆成四轮。第一轮只听前十五到二十分钟，不暂停，不查词，只听讲者在搭什么框架。第二轮打开字幕，暂停每个关键定义，把英文术语和中文含义写成一行笔记。第三轮关掉中文字幕或中文讲解，只保留英文声音，专门训练耳朵识别技术词的发音。第四轮再回到本站中文课程，把刚才听到的英文片段翻译成系统问题。比如听到 memory bandwidth，就不要只翻译成内存带宽，要问这是 HBM 带宽、PCIe 带宽，还是跨卡网络带宽；听到 batch size，就要问它影响的是统计效率、吞吐，还是显存。

第九段，给你一个本地实验记录模板。每个 demo 都记录六行。第一行，实验目标：我想验证 ${concepts[0]} 的哪一个机制。第二行，环境：显卡、显存、驱动、CUDA、PyTorch 或推理框架版本。第三行，输入：batch、sequence length、模型大小、精度、数据样本。第四行，指标：显存峰值、wall time、tokens per second、loss 或输出质量。第五行，变量：这次只改了什么。第六行，结论：变化是否符合预期，如果不符合，下一步查哪里。这个模板看起来简单，但它会强迫你从“跑起来”升级到“解释为什么这样跑”。

第十段，讲和视频训练 infra 的连接。虽然 CS336 主要围绕语言模型，但它对你做视频训练 infra 很有用。视频模型也要 tokenizer 或 latent tokenizer，也要计算资源核算，也要 Transformer 或 DiT，也要并行训练，也要数据配方，也要推理优化和评估。区别是视频多了时间维度、VAE 压缩、帧采样、运动一致性和更重的数据管线。所以学 CS336 时，你可以不断类比：语言里的 sequence length，对视频就是帧数乘以空间 patch 数；语言里的 KV cache，对视频推理就是跨时间上下文缓存和显存压力；语言里的数据去重，对视频就是镜头级重复、字幕水印和版权过滤。

本讲结束后，你至少要能回答三个问题。第一，${concepts[0]} 解决的原始问题是什么？第二，它把成本转移到了哪里？第三，如果我要在自己的机器上复现一个 demo，最小可运行版本是什么？

接下来建议你先听英文视频的前二十分钟，熟悉术语发音；然后看本站中文讲解；最后回到英文视频听第二遍。这种顺序对英语听力和技术理解都更稳。`
}

function postBody(n, id, short, title, concepts, thesis, stats, audioInfo) {
  const s = slug(n, short)
  const audioExtra = audioInfo.exists ? {
    audio: `/audio/${s}.mp3`,
    audioDuration: audioInfo.duration,
    audioBytes: audioInfo.bytes,
  } : {}
  return `${fm(`CS336 视频课 ${String(n).padStart(2, '0')}：${title}`, thesis, ['Stanford CS336', '视频课程', '大模型 Infra'], {
    youtubeId: id,
    youtubeUrl: `https://www.youtube.com/watch?v=${id}`,
    concepts,
    ...audioExtra,
  })}# CS336 视频课 ${String(n).padStart(2, '0')}：${title}

> 英文原课通过官方 YouTube 播放器观看；本站提供中文讲解、听力目标和 4060 实验路线，不重新分发原视频文件。

## 这一讲听什么

${thesis}

关键词：${concepts.map((c) => `\`${c}\``).join('、')}。

## 英文听力目标

第一遍听英文时，不要求听懂每一句。你只需要抓住讲者在定义问题、提出约束、给公式/代码、解释 trade-off 时用的表达。技术英语听力最重要的不是背单词，而是识别结构：

- “The key idea is...” 后面通常是核心机制。
- “The bottleneck is...” 后面通常是 infra 约束。
- “In practice...” 后面通常是工程经验。
- “This breaks when...” 后面通常是失败条件。

## 中文讲解

${audioScript(n, title, concepts, thesis)}

## 4060 实验建议

用你的 4060 跑这一讲时，目标不是做大，而是做清楚。

1. 写一个最小 demo，只验证本讲一个核心机制。
2. 记录显存、耗时、tokens/sec 或 loss，不要只看“能不能跑”。
3. 改一个变量，比如 batch size、sequence length、hidden size、是否打开 KV cache。
4. 把变化写成表格，贴到自己的学习日志里。

## 字幕抓取状态

- 本地英文字幕文件：\`${stats.file || '未找到'}\`
- VTT cues：${stats.cues}
- 字幕字符数：${stats.chars}

## 链接

- [官方 YouTube 视频](https://www.youtube.com/watch?v=${id})
- [CS336 官方课程页](https://cs336.stanford.edu/)
- [CS336 视频学习地图](/posts/2026-07-17-cs336-video-study-map/)
`
}

async function audioInfo(s) {
  const p = path.join(root, 'public/audio', `${s}.mp3`)
  try {
    const st = await stat(p)
    let duration = ''
    try {
      const { stdout } = await execFileAsync('ffprobe', [
        '-v', 'error',
        '-show_entries', 'format=duration',
        '-of', 'default=noprint_wrappers=1:nokey=1',
        p,
      ])
      const seconds = Math.floor(Number.parseFloat(stdout.trim()) || 0)
      duration = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
    } catch {
      duration = ''
    }
    return { exists: true, bytes: st.size, duration }
  } catch {
    return { exists: false, bytes: 0, duration: '' }
  }
}

async function main() {
  await mkdir(path.join(root, 'content/posts'), { recursive: true })
  await mkdir(path.join(root, 'audio-scripts/cs336'), { recursive: true })
  for (const [i, lecture] of lectures.entries()) {
    const n = i + 1
    const [id, short, title, concepts, thesis] = lecture
    const s = slug(n, short)
    const script = audioScript(n, title, concepts, thesis)
    await writeFile(path.join(root, 'audio-scripts/cs336', `${s}.txt`), script, 'utf8')
    const stats = await transcriptStats(id)
    await writeFile(path.join(root, 'content/posts', `${s}.md`), postBody(n, id, short, title, concepts, thesis, stats, await audioInfo(s)), 'utf8')
  }
  await writeFile(path.join(root, 'content/posts', `${day}-cs336-video-course-index.md`), `${fm('Stanford CS336 视频课双语学习入口', '17 讲 Stanford CS336 视频课：官方英文视频 + 中文讲解音频 + 4060 实验路线。', ['Stanford CS336', '视频课程', '大模型 Infra'])}# Stanford CS336 视频课双语学习入口

这里是 CS336 公开视频的双语学习入口：每讲包含官方 YouTube 视频、英文听力目标、中文讲解和 4060 实验建议。

${lectures.map((l, i) => `- [第 ${i + 1} 讲：${l[2]}](/posts/${slug(i + 1, l[1])}/)`).join('\n')}
`, 'utf8')
  console.log(`Generated ${lectures.length} CS336 video lesson posts.`)
}

await main()
