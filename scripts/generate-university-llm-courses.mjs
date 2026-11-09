import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const day = '2026-07-17'

const sources = {
  cs324: {
    label: 'Stanford CS324',
    title: 'Foundation Models 全景基础',
    url: 'https://stanford-cs324.github.io/winter2023/syllabus/',
    official: 'https://stanford-cs324.github.io/winter2022/',
    premise: 'CS324 把大模型放在 foundation model 的完整系统里：能力、数据、架构、训练、规模化、适配、风险与社会影响。',
  },
  cos597g: {
    label: 'Princeton COS 597G',
    title: 'LLM 论文研究路线',
    url: 'https://www.cs.princeton.edu/courses/archive/fall22/cos597G/',
    official: 'https://www.cs.princeton.edu/courses/archive/fall22/cos597G/',
    premise: 'COS 597G 是研究生讨论课，围绕 BERT、T5、GPT、prompting、reasoning、retrieval、RLHF、code/multimodal LMs 等论文主题组织。',
  },
  cs336: {
    label: 'Stanford CS336',
    title: 'Language Modeling from Scratch',
    url: 'https://cs336.stanford.edu/',
    official: 'https://cs336.stanford.edu/',
    premise: 'CS336 以“从零实现语言模型”为主线，把 tokenizer、Transformer、资源核算、GPU kernel、并行、推理、数据、后训练串成工程闭环。',
  },
}

const series = [
  {
    id: 'cs324-foundation-models',
    source: 'cs324',
    title: '系列 A：Foundation Models 全景基础',
    summary: '基于 Stanford CS324 的公开大纲重构，建立大模型的能力、数据、训练、架构、适配与风险全景。',
    positioning: '适合作为总览路线：先知道大模型为什么重要、由哪些系统部件组成、能力和风险边界在哪里。',
    lessons: [
      ['foundation-model-map', '什么是 Foundation Model：从任务模型到通用底座', ['foundation model', '预训练', '下游任务', '迁移学习'], '从“一个任务一个模型”切换到“一个大底座服务很多任务”，核心变化不是模型更大，而是训练目标、数据规模、迁移方式和产品形态一起变化。你要先把 foundation model 看成一套可复用的能力基础设施：预训练阶段吸收通用模式，适配阶段把能力转到具体任务，评估阶段判断它在哪些场景可靠。'],
      ['data-and-dedup', '数据决定模型上限：语料、去重、混合与污染', ['训练数据', '数据去重', '数据混合', 'benchmark contamination'], '大模型不是凭空“懂世界”，它从训练数据里学习统计结构。数据质量影响能力上限，数据重复影响泛化和记忆，数据污染会让评测结果虚高。工程上要关心来源、清洗、去重、语言/领域配比，以及训练集和测试集是否发生泄漏。'],
      ['architecture-objectives', '架构与训练目标：BERT、GPT、T5 为什么不同', ['encoder-only', 'decoder-only', 'encoder-decoder', 'masked LM', 'causal LM'], 'BERT、GPT、T5 的差异不是名字，而是信息流和训练目标不同。encoder-only 擅长理解，decoder-only 擅长自回归生成，encoder-decoder 适合输入到输出的转换。理解 mask、因果注意力和 text-to-text 框架，是读懂现代 LLM 架构的入口。'],
      ['emergent-capabilities', '能力从哪里冒出来：规模、上下文学习与评估幻觉', ['emergent abilities', 'in-context learning', 'few-shot', 'scaling'], '所谓涌现能力通常来自规模、数据、训练目标和评测方式共同作用。不要把曲线上的突然上升神秘化：离散指标、prompt 敏感性、评测集选择都会制造“突然出现”的观感。正确问题是：这种能力是否稳定、可复现、可迁移、可被产品依赖。'],
      ['adaptation-stack', '适配大模型：Prompt、SFT、LoRA、RAG 的分工', ['prompting', 'SFT', 'LoRA', 'RAG', 'domain adaptation'], '适配不是只有 fine-tuning。一条实用判断线是：知识变化快就优先 RAG，格式和风格要稳定就做 SFT，低成本领域迁移可考虑 LoRA，临时任务先用 prompt。好的系统会把这些方法组合，而不是迷信单一技巧。'],
      ['training-infrastructure', '训练与 Infra：为什么大模型首先是分布式系统', ['distributed training', 'data parallelism', 'tensor parallelism', 'pipeline parallelism', 'checkpointing'], '当模型和数据超过单机容量，训练就变成分布式系统问题。你需要同时核算显存、通信、吞吐、故障恢复和 checkpoint。模型并行解决参数放不下，数据并行解决吞吐，流水线并行解决层级切分，但它们都会引入通信和调度成本。'],
      ['scaling-and-cost', 'Scaling Laws：参数、数据、算力的三角关系', ['scaling laws', 'compute optimal', 'Chinchilla', 'loss curve'], 'Scaling law 的价值不是预测一个神奇模型，而是帮助你在预算下分配参数量、token 数和训练算力。工程决策里，模型更大不一定更优；如果数据不足或训练 token 不够，额外参数会浪费。要关注 loss 曲线、边际收益和推理成本。'],
      ['risk-and-governance', '风险不是附录：安全、隐私、偏见、版权与能耗', ['AI safety', 'privacy', 'bias', 'copyright', 'environmental impact'], 'Foundation model 的风险来自它的通用性：同一能力可以服务生产力，也可以放大误导、泄露、偏见和滥用。基础课阶段就要把风险当作系统指标：数据治理、评测红队、输出约束、日志审计和成本/能耗都要进入设计。'],
    ],
  },
  {
    id: 'cos597g-llm-research',
    source: 'cos597g',
    title: '系列 B：LLM 论文研究路线',
    summary: '基于 Princeton COS 597G 的公开课程结构重构，训练读论文、拆机制、判断研究贡献的能力。',
    positioning: '适合想把 LLM 论文读透的人：每节课围绕一个研究主题，训练“问题—方法—证据—局限”的阅读方式。',
    lessons: [
      ['bertology', 'BERTology：怎样研究一个预训练模型到底学了什么', ['BERT', 'probing', 'representation', 'attention analysis'], 'BERTology 的关键不是崇拜 attention heatmap，而是设计探针任务和对照实验，判断表示里是否真的编码了语法、语义或知识。读这类论文要问：probe 是否太强？基线是否公平？结论是模型机制还是实验 artifact？'],
      ['t5-text-to-text', 'T5 与 text-to-text：把所有 NLP 任务统一成生成问题', ['T5', 'text-to-text', 'span corruption', 'transfer learning'], 'T5 的重要性在于接口统一：分类、翻译、摘要、问答都变成文本输入到文本输出。统一接口降低任务工程复杂度，也让多任务预训练更自然。代价是推理更贵，评估和解码策略也更复杂。'],
      ['gpt-few-shot', 'GPT 系列与 few-shot：为什么 prompt 变成了编程接口', ['GPT-2', 'GPT-3', 'few-shot learning', 'prompting'], 'GPT 把语言模型从“生成文本”推到“用上下文指定任务”。few-shot prompt 像临时程序：示例定义输入输出关系，模型在上下文里完成模式匹配。研究上要区分真正推理、模板记忆和分布相似性。'],
      ['prompting-and-icl', 'Prompting 与 In-Context Learning：上下文里的学习是真学习吗', ['in-context learning', 'prompt engineering', 'demonstrations', 'calibration'], 'ICL 看起来像学习，但参数没有更新。更准确的说法是：模型利用预训练中学到的模式，在上下文里做条件化推断。实验要关注示例顺序、标签空间、校准、格式敏感性和失败样本。'],
      ['reasoning-and-knowledge', '知识与推理：LLM 会背事实，也会伪造因果链', ['reasoning', 'chain-of-thought', 'knowledge', 'faithfulness'], 'LLM 的知识来自参数和上下文，推理能力则常常受 prompt、搜索空间和评测形式影响。Chain-of-thought 能改善很多任务，但不保证解释忠实。研究判断要看中间过程是否可验证，而不是只看答案像不像。'],
      ['retrieval-augmented-lms', 'Retrieval-based LMs：把参数记忆和外部记忆分开', ['RAG', 'retrieval', 'kNN-LM', 'memory augmentation'], '检索增强的核心思想是：不要把所有知识都压进参数。外部检索可以降低幻觉、更新知识、提供证据，但会引入召回、排序、上下文压缩和引用忠实性问题。好的 RAG 是信息系统，不是简单拼接搜索结果。'],
      ['rlhf-and-alignment', 'RLHF 与对齐：从“会续写”到“愿意按人类偏好回答”', ['RLHF', 'preference model', 'instruction tuning', 'alignment'], 'RLHF 把人类偏好引入训练循环，常见路径是 SFT、偏好建模、强化学习或直接偏好优化。它改善可用性，但也可能带来过度迎合、拒答偏差和 reward hacking。对齐不是一次训练，而是持续评估和治理。'],
      ['code-and-multimodal-lms', '代码模型与多模态模型：语言接口外溢到工具和视觉', ['code LMs', 'program synthesis', 'CLIP', 'multimodal LMs'], '代码模型说明语言模型可以学习形式系统和 API 使用，多模态模型说明文本可以成为跨模态对齐接口。研究上要分别评估语法正确、语义正确、执行正确和交互正确；多模态还要处理视觉 grounding 和数据配对噪声。'],
    ],
  },
  {
    id: 'cs336-from-scratch',
    source: 'cs336',
    title: '系列 C：从零实现语言模型与模型 Infra',
    summary: '基于 Stanford CS336 的公开安排重构，按工程实现顺序学习 tokenizer、Transformer、训练、并行、推理、数据与后训练。',
    positioning: '适合工程路线：不满足于“知道概念”，而是能估算资源、写出组件、解释瓶颈、做出训练和推理取舍。',
    lessons: [
      ['tokenization', 'Tokenizer：模型看到的不是字，而是 token 序列', ['tokenization', 'BPE', 'vocabulary', 'Unicode'], 'Tokenizer 是文本进入模型的编译器。它决定序列长度、词表大小、跨语言表现和罕见词处理。BPE/Unigram 等方法用统计压缩构造子词单位；工程上要关注特殊 token、Unicode 规范化、训练语料和推理一致性。'],
      ['resource-accounting', '资源核算：FLOPs、显存、带宽和 arithmetic intensity', ['FLOPs', 'memory bandwidth', 'arithmetic intensity', 'activation memory'], '大模型工程第一课是算账。参数占显存，activation 占训练显存，attention 随序列长度二次增长，吞吐受计算和内存带宽共同限制。Arithmetic intensity 帮你判断瓶颈在算还是在搬数据。'],
      ['transformer-block', 'Transformer Block：Attention、MLP、Norm 与残差的组合', ['Transformer', 'self-attention', 'MLP', 'LayerNorm', 'residual connection'], '一个 decoder-only Transformer block 通常由归一化、因果自注意力、残差、MLP 组成。Attention 做 token 间信息路由，MLP 做逐位置非线性变换，残差保证梯度和信息通道稳定。实现时 shape、mask 和数值稳定性最容易出错。'],
      ['attention-kernels', 'Attention Kernel 与 FlashAttention：为什么同一公式速度差很多', ['attention kernel', 'FlashAttention', 'tiling', 'SRAM', 'HBM'], '标准 attention 公式简单，但中间矩阵巨大。FlashAttention 的关键是分块计算和 IO-aware：尽量在高速 SRAM 内完成局部计算，减少 HBM 读写。它不是改数学，而是改计算组织方式。'],
      ['parallel-training', '并行训练：DP、TP、PP、ZeRO 各自解决什么问题', ['data parallelism', 'tensor parallelism', 'pipeline parallelism', 'ZeRO'], '数据并行复制模型、切 batch；张量并行切矩阵；流水线并行切层；ZeRO 切优化器状态、梯度和参数。没有免费午餐：并行度越高，通信、气泡、调试和恢复越复杂。'],
      ['inference-serving', '推理 Serving：KV Cache、batching、prefill/decode 分离', ['LLM inference', 'KV cache', 'continuous batching', 'prefill', 'decode'], '训练追求吞吐，推理同时追求延迟、吞吐和成本。Prefill 阶段并行处理输入，decode 阶段逐 token 生成并受 KV cache 显存约束。Serving 系统要做 continuous batching、调度、缓存管理和限流。'],
      ['data-pipeline', '预训练数据管线：抓取、过滤、去重、混合、采样', ['data pipeline', 'filtering', 'deduplication', 'data mixing', 'synthetic data'], '数据管线是模型质量的隐形主体。抓取只是一小步，后面还有内容抽取、语言识别、质量过滤、去重、PII 处理、领域混合和采样策略。数据 recipe 往往比模型结构更影响最终体验。'],
      ['post-training-eval', '后训练与评估：SFT、RLHF/RLVR、Benchmark 与部署门槛', ['SFT', 'RLHF', 'RLVR', 'evaluation', 'deployment'], '基础模型到产品模型还要经过后训练：指令微调改善交互格式，偏好优化改善可用性，RLVR 用可验证奖励强化数学/代码等任务。部署前要看能力、拒答、安全、延迟、成本和回归测试。'],
    ],
  },
]

const conceptDescriptions = {
  'foundation model': '可迁移到多类任务的大规模预训练模型底座。',
  '预训练': '在大规模通用数据上学习统计结构，为后续任务适配提供初始能力。',
  '训练数据': '决定模型知识、风格、偏差和能力上限的原材料。',
  '数据去重': '移除重复或近重复样本，降低记忆和评测污染。',
  'benchmark contamination': '评测数据进入训练数据导致指标虚高的问题。',
  'encoder-only': '只使用编码器结构，常用于理解类任务。',
  'decoder-only': '使用因果解码器结构，现代生成式 LLM 的主流形态。',
  'encoder-decoder': '编码输入、解码输出，适合翻译、摘要等转换任务。',
  'masked LM': '通过预测被遮蔽 token 学习双向表示的目标。',
  'causal LM': '通过预测下一个 token 学习自回归生成的目标。',
  'in-context learning': '模型在不更新参数的情况下利用上下文示例完成任务。',
  'scaling laws': '描述模型规模、数据、算力与损失之间经验关系的规律。',
  'SFT': '用监督样本把基础模型调成更符合指令和格式的模型。',
  'LoRA': '低秩适配方法，用较少可训练参数完成微调。',
  'RAG': '检索增强生成，把外部知识检索结果放入上下文辅助回答。',
  'distributed training': '用多设备协同完成模型训练的系统技术。',
  'data parallelism': '复制模型、切分 batch 的并行训练方式。',
  'tensor parallelism': '切分矩阵或张量计算的并行方式。',
  'pipeline parallelism': '按层切分模型并流水线执行的并行方式。',
  'checkpointing': '保存训练状态或重算 activation 以降低显存/恢复故障的技术。',
  'BERT': '典型 encoder-only 预训练语言模型。',
  'T5': '把 NLP 任务统一为 text-to-text 的 encoder-decoder 模型。',
  'GPT-3': '展示 few-shot 能力的大规模 decoder-only 语言模型。',
  'prompting': '用自然语言和示例指定模型任务的接口方式。',
  'reasoning': '模型在多步约束下得到答案的能力，需用可验证任务谨慎评估。',
  'retrieval': '从外部语料库取回相关信息的过程。',
  'RLHF': '利用人类偏好信号优化模型行为的后训练方法。',
  'code LMs': '面向代码补全、生成、解释和工具调用的语言模型。',
  'multimodal LMs': '同时处理文本、图像、音频或视频等多模态输入输出的模型。',
  'tokenization': '把文本切分成模型可处理 token 序列的过程。',
  'BPE': '常见子词切分算法，通过合并高频片段构造词表。',
  'FLOPs': '浮点运算次数，用于估算训练和推理计算量。',
  'memory bandwidth': '内存读写带宽，常是推理和 kernel 性能瓶颈。',
  'Transformer': '基于自注意力和前馈网络堆叠的主流序列模型架构。',
  'FlashAttention': 'IO-aware attention 实现，通过分块减少显存读写。',
  'KV cache': '推理时缓存历史 key/value，避免重复计算上下文。',
  'continuous batching': 'Serving 中动态合批请求以提升吞吐的调度方法。',
  'prefill': '推理中处理输入 prompt 并生成初始 KV cache 的阶段。',
  'decode': '推理中逐 token 生成输出的阶段。',
  'data pipeline': '从数据获取到过滤、去重、混合、采样的训练数据生产链路。',
  'evaluation': '用任务、基准、人评和系统指标判断模型是否可用。',
}

function slugify(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function fm(title, summary, tags, extra = {}) {
  const lines = ['---', `title: "${title}"`, `date: ${day}`, `summary: "${summary}"`, `tags: [${tags.join(', ')}]`]
  for (const [k, v] of Object.entries(extra)) lines.push(`${k}: ${JSON.stringify(v)}`)
  lines.push('---', '')
  return lines.join('\n')
}

function lessonBody(seriesItem, idx, lesson) {
  const [slug, title, concepts, thesis] = lesson
  const source = sources[seriesItem.source]
  const previous = idx > 0 ? seriesItem.lessons[idx - 1][1] : '无'
  const next = idx < seriesItem.lessons.length - 1 ? seriesItem.lessons[idx + 1][1] : '本系列收束，回到总览做复盘'
  const primary = concepts[0]
  const secondary = concepts[1] || concepts[0]
  const tertiary = concepts[2] || concepts[0]
  const conceptBullets = concepts.map((c) => `- \`${c}\`：${conceptDescriptions[c] || '本节需要掌握的关键概念，重点是理解它在模型系统中的作用、边界和代价。'}`).join('\n')
  return `${fm(`${source.label} 中文拆解 ${String(idx + 1).padStart(2, '0')}：${title}`, thesis.slice(0, 92), ['大学课程拆解', source.label, '大模型基础'], {
    sourceCourse: source.label,
    sourceUrl: source.url,
    series: seriesItem.title,
    concepts,
  })}# ${title}

> 本文是基于 ${source.label} 公开课程结构的中文原创拆解，不是官方讲义翻译。官方课程入口：${source.url}

## 这一课要解决的问题

${thesis}

## 放在整条路线里的位置

- 上一课：${previous}
- 下一课：${next}
- 本课关键词：${concepts.map((c) => `\`${c}\``).join('、')}

## 先建立直觉

学大模型最危险的方式，是把每个词都背下来，但不知道它在系统里解决什么问题。本课先把 \`${primary}\` 放到一个具体场景里：你有一批数据、一个模型、一套训练或推理预算，还要把它变成可靠的产品能力。概念不是装饰，它一定对应一个瓶颈：可能是数据不够干净，可能是模型无法利用上下文，可能是训练算力不足，也可能是推理延迟和成本压不下来。

如果你只记住“某个方法很先进”，基本没有用。正确的学习方式是问四个问题。第一，它改变了什么输入输出关系？第二，它依赖什么前提？第三，它把成本转移到了哪里？第四，它失败时会以什么形式暴露？这四个问题能把多数论文和工程方案拆开。

本节的直觉可以压缩成一句话：${thesis} 这句话不是结论，而是后面分析的入口。你要把它和 \`${secondary}\`、\`${tertiary}\` 连起来看，因为大模型系统里很少有孤立概念；数据、目标函数、架构、训练过程、推理服务和评估会互相牵制。

## 核心概念

${conceptBullets}

这些概念的共同点是：它们都不是“知识点孤岛”。例如一个训练侧概念会影响推理成本，一个数据侧概念会影响评测可信度，一个模型结构概念会影响系统能否并行。读 ${source.label} 这类课程时，不要只按章节线性阅读，而要把概念放进自己的图谱里：数据从哪里来，token 如何进入模型，模型如何产生 logits，训练如何更新参数，推理如何缓存状态，评估如何判断输出是否可靠。

## 核心机制

机制层面要拆成三步。

第一步，看信息如何流动。大模型里的信息从原始文本进入 tokenizer，变成 token id；token id 通过 embedding 进入向量空间；每一层 Transformer 在 attention 和 MLP 之间交替处理；最后输出 logits，再通过解码策略变成文本。无论本节讲的是 \`${primary}\` 还是 \`${secondary}\`，你都应该能指出它介入了这条链路的哪一段。

第二步，看优化目标如何塑造能力。如果训练目标只是预测下一个 token，模型学到的是“在上下文条件下，下一个符号最可能是什么”。很多复杂能力并不是直接被标注出来的，而是从大量文本的统计结构中被间接学习出来。后训练、检索、prompt 和工具调用，本质上都是在改变条件信息或反馈信号，让模型的生成更符合任务需求。

第三步，看计算和系统约束。一个方法在论文里有效，不等于在产品里可用。训练阶段要算 FLOPs、显存、通信和数据吞吐；推理阶段要算首 token 延迟、decode 吞吐、KV cache 占用、batching 策略和峰值并发。很多“模型能力问题”落地后会变成 Infra 问题。

## 一个可手算的小例子

假设模型正在生成一句话：“大模型的核心瓶颈是”。词表里候选 token 简化成三个：\`数据\`、\`算力\`、\`运气\`。模型输出 logits 分别是 4.0、3.0、0.5。softmax 会把它们变成概率，大致会让 \`数据\` 和 \`算力\` 占据绝大多数概率，而 \`运气\` 很低。这里你能看到三个层次：

1. logits 不是概率，只是未归一化分数。
2. 解码策略决定最终选哪个 token：贪心会选最高分，采样可能偶尔选第二名。
3. 如果上下文、训练数据或后训练偏好不同，logits 分布会变化。

把这个例子迁移到本课主题：如果你讨论的是数据，那么 logits 背后是训练语料塑造的统计偏好；如果你讨论的是架构，那么 logits 背后是 attention/MLP 的表达能力；如果你讨论的是推理 Infra，那么同样的 logits 还受 batch、cache、量化和 kernel 实现影响。一个小例子足够说明：模型输出不是神谕，它是数据、目标函数和系统实现共同作用的结果。

## 数学/系统视角

大模型课程里很多内容可以统一成一个条件概率问题：模型在上下文 \`x\` 下，估计下一个 token \`y\` 的分布 \`P(y|x)\`。训练是在大量样本上降低预测错误，推理是在这个分布上按某种策略取样，后训练是在分布外面再加人类偏好、规则或可验证奖励。这个视角能把很多看似分散的主题连起来。

但系统视角会提醒你：概率分布只是最终表象。为了得到它，你要先把文本变成 token，把 token 放进 GPU，把矩阵乘法排进 kernel，把跨卡通信安排好，把 KV cache 放进显存，把请求调度进 batch。任何一环出问题，用户看到的都不是“理论上的模型”，而是一个会慢、会贵、会抖、会错的线上系统。

所以学习本课时，要同时保留两套语言：一套是数学语言，用来描述目标函数、概率、优化和评估；另一套是系统语言，用来描述显存、带宽、吞吐、延迟和可靠性。只懂数学，容易低估部署难度；只懂系统，容易看不清方法为什么有效。真正能做判断的人，必须在两套语言之间切换。

## 工程/研究判断

做工程时，优先判断“这个概念是否改变约束”。如果它只提升 benchmark 一点点，但引入大量复杂度，就未必值得进生产。如果它能显著降低成本、提升稳定性或让系统更可解释，即使模型分数没有大涨，也可能非常重要。

做研究时，优先判断“证据是否支持结论”。很多 LLM 论文会展示漂亮案例，但你要看消融实验、负例、基线、数据泄漏控制和统计显著性。尤其是 prompting、reasoning、alignment 这类主题，案例很容易让人误判；真正要看的是方法在不同任务、不同 prompt、不同模型规模下是否稳定。

做个人学习时，优先判断“它能否解释你今天看到的现象”。比如日报里出现一个新的 serving 框架，你应该能把它放到 KV cache、batching、kernel、并行或部署成本里；看到一个新的 agent 框架，你应该能判断它是在改善 planning、tool use、memory，还是只是在包装 prompt。

## 常见误区

- 误区一：把术语当理解。会说 \`${primary}\` 不代表理解，能说出它的输入、输出、代价和失败场景才算理解。
- 误区二：只看模型不看数据。大模型能力很大一部分来自数据分布，数据污染、重复、低质量样本都会改变你对能力的判断。
- 误区三：只看论文指标不看系统成本。训练和推理的成本曲线会决定一个方法能不能实际使用。
- 误区四：把一次成功 demo 当稳定能力。LLM 对 prompt、上下文和采样参数敏感，必须看多样本和失败案例。
- 误区五：把“更大”当唯一方向。更大模型可能带来能力，也可能带来不可承受的延迟、成本、部署复杂度和安全风险。

## 和你的系统怎么连接

你现在的学习系统有三层：每日信号、系统课程、概念 Wiki。本节内容应该进入这三层循环。

每日信号负责提供新材料。看到新论文、新框架、新模型发布时，先不要问“热不热门”，先问它对应本节哪个概念。系统课程负责把材料放回结构里，避免每天被热点牵着走。概念 Wiki 负责长期沉淀：今天学到的判断，下周遇到反例时要能更新。

如果你把这套循环坚持下去，学习大模型不会变成收藏链接，而会变成持续校准判断的过程。这比一次性读完某门课更重要。

## 读论文/看项目时的检查清单

看到一篇论文或一个开源项目时，用下面这张表快速判断它和本课的关系：

| 检查项 | 你要问的问题 |
| --- | --- |
| 问题定义 | 它到底在解决数据、模型、训练、推理、评估还是产品交互的问题？ |
| 方法变化 | 它改变了输入、架构、目标函数、训练流程、检索流程还是 serving 调度？ |
| 证据质量 | 它有没有强基线、消融实验、负例和跨任务验证？ |
| 成本结构 | 它把成本放在训练、推理、存储、标注、人审还是运维上？ |
| 可迁移性 | 它只在一个 benchmark 上有效，还是能迁移到你的真实场景？ |
| 风险 | 它是否增加幻觉、隐私泄露、延迟抖动、不可解释性或维护复杂度？ |

这张表的作用是降低“被新名词带跑”的概率。很多方法看起来不同，拆到底可能只是在同一个位置做了不同取舍。反过来，有些看起来朴素的方法，如果显著改变成本结构或可靠性，实际价值会很高。

## 本课小结

本课不是要求你一次性掌握所有细节，而是建立一个判断框架。你至少要带走三件事：第一，\`${primary}\` 不是孤立术语，它必须放回大模型系统链路里理解；第二，任何方法都要同时看能力收益和系统代价；第三，学习大模型要持续维护概念图谱，因为新论文和新产品每天都会改变你对旧概念的理解。

下一次看到相关内容时，不要只问“这是什么”，要进一步问：“它改变了什么约束？它让我原来的判断哪里需要更新？”这才是把大学课程变成个人能力的关键。

## 练习

1. 用 100 字解释 \`${primary}\` 解决的问题，禁止使用“提升效果”“增强能力”这种空话。
2. 画一条链路：数据 → token → Transformer → logits → decode → 用户输出，标出本课概念介入的位置。
3. 找一个真实 AI 产品，判断它在本课主题上可能做了什么工程取舍。
4. 写一个失败案例：什么情况下本课方法不会带来收益，甚至会让系统更差？
5. 把本课至少 2 个关键词追加到自己的概念笔记里，并写一句“我现在还不确定的问题”。

## 延伸阅读

- 先看 ${source.label} 官方课程结构，确认本节在原课程中的位置。
- 再找一篇相关论文，只读摘要、方法图和实验表，训练自己抓主张和证据。
- 最后回到本站 [AI 学习 Wiki](/wiki/)，把本课概念和日报里出现的新材料连起来。

## 参考来源

- [${source.label} 官方课程/大纲](${source.url})
- [${source.label} 课程主页](${source.official})
`
}

function seriesBody(seriesItem) {
  const source = sources[seriesItem.source]
  const lessons = seriesItem.lessons.map((lesson, i) => {
    const slug = `${day}-${seriesItem.id}-${String(i + 1).padStart(2, '0')}-${lesson[0]}`
    return `- 第 ${i + 1} 课：[${lesson[1]}](/posts/${slug}/) — ${lesson[2].join(' / ')}`
  }).join('\n')
  return `${fm(seriesItem.title, seriesItem.summary, ['大学课程拆解', source.label, '大模型基础'], {
    sourceCourse: source.label,
    sourceUrl: source.url,
  })}# ${seriesItem.title}

${seriesItem.summary}

## 定位

${seriesItem.positioning}

${source.premise}

## 课程目录

${lessons}

## 学习方法

- 先读中文拆解，建立概念地图。
- 再回到官方课程页面看原始 readings / slides / assignments。
- 每学完一节，把关键词写进自己的项目或日报系统里，看它能解释什么、不能解释什么。

## 官方来源

- [${source.label} 官方课程/大纲](${source.url})
- [${source.label} 课程主页](${source.official})
`
}

function mapPost() {
  const items = series.map((s) => `- [${s.title}](/posts/${day}-${s.id}-series/)：${s.summary}`).join('\n')
  return `${fm('大模型大学课程中文路线图：CS324 / COS 597G / CS336', '把 Stanford CS324、Princeton COS 597G、Stanford CS336 拆成三条中文学习路线：全景基础、论文研究、从零实现与 Infra。', ['大学课程拆解', '大模型基础', '学习路线'])}# 大模型大学课程中文路线图

我把三门公开顶级课程拆成三条互补路线：

${items}

## 怎么学

1. 先学系列 A，建立 foundation model 全景。
2. 再学系列 C，理解模型从数据到训练再到推理服务的工程闭环。
3. 同步学系列 B，用论文研究路线校准自己对前沿能力、局限和评估的判断。

## 和本站 Wiki 的关系

每节课的关键词都会沉淀到 [AI 学习 Wiki](/wiki/) 的概念页里。日报里出现的新论文、新工具、新 Infra 变化，也会继续追加到这些概念页。

## 官方来源

- [Stanford CS324: Large Language Models](https://stanford-cs324.github.io/winter2023/syllabus/)
- [Princeton COS 597G: Understanding Large Language Models](https://www.cs.princeton.edu/courses/archive/fall22/cos597G/)
- [Stanford CS336: Language Modeling from Scratch](https://cs336.stanford.edu/)
`
}

function wikiCourseMap() {
  return `---
title: "大学大模型课程地图"
summary: "把 Stanford CS324、Princeton COS 597G、Stanford CS336 映射为本站中文课程和概念 Wiki。"
tags: [AI Wiki, 大学课程, 大模型基础]
---

# 大学大模型课程地图

## 三条路线

${series.map((s) => `- [${s.title}](/posts/${day}-${s.id}-series/)：${s.summary}`).join('\n')}

## 概念维护方式

- 课程页负责“体系化讲解”。
- 概念页负责“长期增量”：日报、论文、工程经验都会继续追加到同一页。
- 原始课程链接只作为结构参考；本站内容是中文原创拆解。

## 官方来源

- [Stanford CS324](https://stanford-cs324.github.io/winter2023/syllabus/)
- [Princeton COS 597G](https://www.cs.princeton.edu/courses/archive/fall22/cos597G/)
- [Stanford CS336](https://cs336.stanford.edu/)
`
}

function wikiIndex() {
  const allConcepts = [...new Set(series.flatMap((s) => s.lessons.flatMap((l) => l[2])))]
  const conceptLines = allConcepts.sort((a, b) => a.localeCompare(b)).map((c) => `- [${c}](/wiki/concepts/${slugify(c)}/)：${conceptDescriptions[c] || '持续更新的大模型基础概念。'}`).join('\n')
  return `---
title: "AI 学习 Wiki"
summary: "每天由 Signal Radar 维护的生成式 AI、模型 Infra 与大学课程知识库。"
tags: [AI Wiki]
---

# AI 学习 Wiki

这是一个持续更新的个人 AI 学习知识库：日报提供新信号，课程提供体系化学习，概念页负责长期沉淀。

## 大学课程系列

- [大学大模型课程地图](/wiki/courses/university-llm-map/)
- [大模型大学课程中文路线图](/posts/${day}-university-llm-course-map/)

## 今日课程

- [语言模型到底在算什么 —— 概率建模、logits 与 softmax](/posts/2026-07-17-ai-course-02-language-model-probability/)（2026-07-17）

## 概念索引

${conceptLines}

## 维护规则

- [Wiki Schema](/wiki/WIKI_SCHEMA/)
- [更新日志](/wiki/log/)
`
}

function conceptPage(concept) {
  const links = []
  for (const s of series) {
    s.lessons.forEach((lesson, i) => {
      if (lesson[2].includes(concept)) {
        links.push(`- [${s.title} 第 ${i + 1} 课：${lesson[1]}](/posts/${day}-${s.id}-${String(i + 1).padStart(2, '0')}-${lesson[0]}/)`)
      }
    })
  }
  return `---
title: "${concept}"
summary: "${conceptDescriptions[concept] || `${concept} 的持续学习笔记。`}"
tags: [AI Wiki, Concept, 大模型基础]
---

# ${concept}

${conceptDescriptions[concept] || '这是大模型基础课程中的核心概念，会随着课程和日报持续更新。'}

## 在课程中的位置

${links.join('\n') || '- 暂无课程链接'}

## 学习检查

- 我能否不用术语复述它解决的问题？
- 我能否说出它依赖的前提和一个失败场景？
- 我能否把它连接到模型训练、推理、Agent 或产品系统里的具体位置？
`
}

async function main() {
  const postsDir = path.join(root, 'content/posts')
  const wikiDir = path.join(root, 'content/wiki')
  const conceptDir = path.join(wikiDir, 'concepts')
  const wikiCoursesDir = path.join(wikiDir, 'courses')
  await mkdir(postsDir, { recursive: true })
  await mkdir(conceptDir, { recursive: true })
  await mkdir(wikiCoursesDir, { recursive: true })

  await writeFile(path.join(postsDir, `${day}-university-llm-course-map.md`), mapPost(), 'utf8')
  for (const s of series) {
    await writeFile(path.join(postsDir, `${day}-${s.id}-series.md`), seriesBody(s), 'utf8')
    for (const [i, lesson] of s.lessons.entries()) {
      const slug = `${day}-${s.id}-${String(i + 1).padStart(2, '0')}-${lesson[0]}`
      await writeFile(path.join(postsDir, `${slug}.md`), lessonBody(s, i, lesson), 'utf8')
    }
  }

  await writeFile(path.join(wikiCoursesDir, 'university-llm-map.md'), wikiCourseMap(), 'utf8')
  await writeFile(path.join(wikiDir, 'index.md'), wikiIndex(), 'utf8')
  const allConcepts = [...new Set(series.flatMap((s) => s.lessons.flatMap((l) => l[2])))]
  for (const concept of allConcepts) {
    const file = path.join(conceptDir, `${slugify(concept)}.md`)
    try {
      const existing = await readFile(file, 'utf8')
      if (existing.includes('## 在课程中的位置')) continue
    } catch {}
    await writeFile(file, conceptPage(concept), 'utf8')
  }
  console.log(`Generated ${1 + series.length + series.reduce((n, s) => n + s.lessons.length, 0)} posts and ${allConcepts.length} concept pages.`)
}

await main()
