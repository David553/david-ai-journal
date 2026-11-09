import { execFile } from 'node:child_process'
import { mkdir, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { promisify } from 'node:util'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const day = '2026-07-24'
const execFileAsync = promisify(execFile)

const sources = [
  ['Wan2.2', 'https://github.com/Wan-Video/Wan2.2', 'MoE 视频 DiT、T2V/I2V/TI2V、Wan2.2-VAE 高压缩、720P/24fps、FSDP/Ulysses 推理路径'],
  ['HunyuanVideo-1.5', 'https://github.com/Tencent-Hunyuan/HunyuanVideo-1.5', '8.3B、训练代码、FSDP、context parallel、gradient checkpointing、Muon、SSTA、数据治理和后训练'],
  ['LTX-Video / LTX-2', 'https://github.com/Lightricks/ltx-video', 'DiT 视频生成、音画同步、多关键帧、LoRA 训练、ComfyUI/Diffusers 工作流'],
  ['CogVideoX', 'https://github.com/zai-org/CogVideo', 'T2V/I2V/视频续写任务，适合学习开源视频模型的任务接口和条件注入'],
  ['Mochi 1', 'https://github.com/genmoai/mochi', 'Apache-2.0、prompt adherence、LoRA fine-tuning、consumer GPU/ComfyUI 生态'],
  ['VACE', 'https://github.com/ali-vilab/VACE', 'reference-to-video、video-to-video、masked video editing、基于 Wan/LTX 的全能视频创建编辑范式'],
]

const lessons = [
  {
    short: 'map-and-scope',
    title: '视频训练 Infra 全景：从数据、VAE、DiT 到评估',
    summary: '建立视频生成训练系统的地图：为什么视频比图像和文本更吃数据、显存、吞吐和评估体系。',
    focus: ['系统地图', '视频 token', '训练预算', '数据闭环'],
    projects: ['Wan2.2', 'HunyuanVideo-1.5', 'LTX-Video / LTX-2'],
    drill: '画出你自己的视频训练流水线：原始视频、切分、审查、caption、编码、训练、评估、回流，每一段标出最可能炸的资源。'
  },
  {
    short: 'data-ingestion',
    title: '数据摄取与切分：视频样本不是文件，是时间片',
    summary: '讲清视频采集、去重、切镜头、抽帧、转码、时长过滤和元数据索引如何影响模型学习。',
    focus: ['shot detection', 'transcode', 'fps', 'metadata index'],
    projects: ['HunyuanVideo-1.5', 'Wan2.2', 'CogVideoX'],
    drill: '用 ffmpeg/ffprobe 对 100 个短视频做元数据表，记录 duration、fps、resolution、codec、是否有音频、首尾黑帧比例。'
  },
  {
    short: 'caption-pipeline',
    title: 'Caption 与语义标注：模型学到的是视频-文本对齐',
    summary: '把 caption 看成训练信号工程：粗 caption、密集 caption、运动描述、镜头语言和多语言对齐。',
    focus: ['caption quality', 'motion words', 'dense caption', 'text encoder'],
    projects: ['LTX-Video / LTX-2', 'HunyuanVideo-1.5', 'Mochi 1'],
    drill: '同一段视频写三版 caption：物体版、动作版、导演版。比较它们会给模型提供什么不同梯度。'
  },
  {
    short: 'quality-filtering',
    title: '质量过滤与安全过滤：训练集决定上限，也决定事故',
    summary: '解释清晰度、美学、运动质量、OCR/水印、NSFW、版权和重复样本过滤如何做成可维护的数据系统。',
    focus: ['quality score', 'aesthetic filter', 'safety filter', 'dedup'],
    projects: ['HunyuanVideo-1.5', 'VACE', 'Wan2.2'],
    drill: '设计一个视频数据打分表：画质、运动、主体、字幕水印、安全风险、版权风险，每项给出自动规则和人工抽检规则。'
  },
  {
    short: 'vae-latent',
    title: '视频 VAE 与 latent 表示：先把像素压到可训练空间',
    summary: '从空间压缩、时间压缩、重建损失和 motion preservation 理解为什么视频模型离不开强 VAE。',
    focus: ['video VAE', 'latent compression', 'temporal compression', 'reconstruction'],
    projects: ['Wan2.2', 'LTX-Video / LTX-2', 'VACE'],
    drill: '比较 8×8×4 和 16×16×4 压缩的含义：一段 5 秒 720P 视频进入 DiT 前 token 数大概减少多少。'
  },
  {
    short: 'diffusion-dit',
    title: '扩散与 DiT：视频生成模型到底在学习什么',
    summary: '用听得懂的方式讲 diffusion、noise schedule、denoising target、DiT block、cross attention 和条件注入。',
    focus: ['diffusion', 'DiT', 'noise schedule', 'conditioning'],
    projects: ['Mochi 1', 'HunyuanVideo-1.5', 'CogVideoX'],
    drill: '把一次训练 step 写成伪代码：取 latent、采样噪声和 timestep、加噪、DiT 预测、算 loss、反传。'
  },
  {
    short: 'temporal-consistency',
    title: '时间一致性：视频模型为什么容易闪烁和漂移',
    summary: '围绕 temporal attention、3D patch、运动先验、多帧条件、keyframe 控制，解释视频比图像难在哪里。',
    focus: ['temporal attention', 'motion coherence', 'keyframe', 'camera motion'],
    projects: ['LTX-Video / LTX-2', 'VACE', 'CogVideoX'],
    drill: '拿一个失败视频做诊断：主体漂移、纹理闪烁、运动不连续、物理错误分别可能来自哪一层。'
  },
  {
    short: 'distributed-training',
    title: '分布式训练：FSDP、context parallel 和 checkpointing',
    summary: '解释视频训练为什么会碰到显存墙，以及 FSDP、context parallel、gradient checkpointing、数据加载吞吐怎么配合。',
    focus: ['FSDP', 'context parallel', 'gradient checkpointing', 'throughput'],
    projects: ['HunyuanVideo-1.5', 'Wan2.2'],
    drill: '为一台 4060 和一组 8×80GB 机器分别设计训练/微调策略，写清楚哪些东西只能模拟，哪些可以真跑。'
  },
  {
    short: 'post-training-control',
    title: '后训练与可控生成：从 LoRA 到 V2V/R2V/MV2V',
    summary: '把 LoRA、SFT、偏好数据、参考图/视频条件、mask 编辑和视频续写统一成“条件控制”问题。',
    focus: ['LoRA', 'SFT', 'R2V', 'V2V', 'masked editing'],
    projects: ['VACE', 'Mochi 1', 'LTX-Video / LTX-2'],
    drill: '设计一个 LoRA 数据集：目标风格、样本数量、caption 规范、负样本、验证 prompt 和过拟合检查。'
  },
  {
    short: 'evaluation-production',
    title: '评估与生产化：从 benchmark 到训练数据回流',
    summary: '讲清视频生成的评估维度、人工评测、自动指标、线上反馈、失败样本挖掘和下一轮数据配方。',
    focus: ['VBench', 'human preference', 'failure mining', 'data flywheel'],
    projects: ['Wan2.2', 'HunyuanVideo-1.5', 'LTX-Video / LTX-2', 'VACE'],
    drill: '搭一个评估表：prompt adherence、subject consistency、motion、aesthetic、安全、时长稳定性、生产可用率。'
  },
]

function slug(n, short) {
  return `${day}-video-training-infra-${String(n).padStart(2, '0')}-${short}`
}

function fm(title, summary, extra = {}) {
  const lines = [
    '---',
    `title: "${title}"`,
    `date: ${day}`,
    `summary: "${summary}"`,
    'tags: [视频生成, 训练 Infra, 数据管线, 算法原理]',
  ]
  for (const [key, value] of Object.entries(extra)) lines.push(`${key}: ${JSON.stringify(value)}`)
  lines.push('---', '')
  return lines.join('\n')
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

function projectNotes(projects) {
  return projects.map((name) => sources.find((source) => source[0] === name)).filter(Boolean)
}

function spokenScript(n, lesson) {
  const refs = projectNotes(lesson.projects)
  return `你现在不用看屏幕。这是视频训练 infra 课程第 ${n} 节，题目是：${lesson.title}。

先说结论。本节的核心不是记住几个模型名字，而是建立一个判断框架：视频生成训练，表面上是在训练一个更大的 diffusion transformer，实际上是在运营一个持续变动的数据系统。数据管线负责把混乱的视频世界变成可学习的样本；算法原理负责决定模型从这些样本里到底学什么；infra 负责让这两件事在成本、吞吐、质量和安全之间稳定循环。

本节你要抓住四个关键词：${lesson.focus.join('、')}。如果你开车听，只需要记住它们之间的因果关系：第一个关键词通常定义输入，第二个关键词定义训练信号，第三个关键词定义资源约束，第四个关键词定义系统如何闭环。

第一段，我们先把问题讲清楚。${lesson.summary}。视频和图像最大的差异，不只是多了时间维度。真正麻烦的是，一个视频样本同时包含画面质量、主体一致性、运动轨迹、镜头变化、文本语义、可能的音频、压缩伪影、字幕水印、版权和安全风险。任何一个维度处理不好，训练时都会变成噪声；任何一个维度过滤过度，又会让模型学不到真实世界的多样性。所以视频训练 infra 的第一原则是：不要把视频当成 mp4 文件，要把视频当成带时间结构、语义结构、质量结构和权限结构的训练记录。

第二段，我们对照开源项目看现实选择。${refs.map(([name, url, note]) => `${name} 的公开信息显示，它的重点是 ${note}。`).join('')}这些项目的共同点是，它们都不再只是“给一个 prompt 生成几秒视频”的 demo。它们开始显式暴露数据治理、VAE 压缩、DiT 结构、条件控制、分布式训练、缓存推理、ComfyUI 或 Diffusers 集成等工程接口。对你来说，学习价值不在于本地直接训练一个大模型，而在于读懂这些接口为什么存在。接口背后的问题，就是真实 infra 问题。

第三段，进入算法原理。视频生成通常把原始像素压进 latent 空间，然后在 latent 上做扩散建模。训练时，系统会抽取一个视频片段，把它编码成 latent，随机采样一个 timestep，加噪声，让模型根据文本条件或图像条件预测噪声、速度或者去噪目标。这个过程听起来像图像 diffusion，但视频多了两个关键压力。第一，token 数量暴涨，空间分辨率乘以时间帧数会直接推高 attention 和显存。第二，模型不仅要让单帧好看，还要让前后帧保持主体、纹理、光照和运动连续。于是你会看到 temporal attention、3D patch、window attention、sliding tile attention、context parallel、latent temporal compression 这些设计。它们不是炫技，而是在回答同一个问题：怎样让模型看到足够长的时间上下文，同时又不把显存和通信打爆。

第四段，进入数据管线。一个可用的数据管线至少有八步。第一步，摄取原始视频，保存来源、许可、上传时间、分辨率、fps、codec、音频轨和基础 hash。第二步，切分镜头，把长视频切成语义更稳定的片段。第三步，转码和抽帧，把训练需要的格式标准化。第四步，质量过滤，去掉过暗、过糊、抖动严重、黑边、重复、水印过重或字幕占比过高的片段。第五步，安全和版权过滤，把高风险内容拦在训练集外。第六步，caption，生成粗粒度描述、动作描述、镜头描述和必要的负面标签。第七步，编码，把视频压成 latent 或提前缓存特征。第八步，采样和混合，让不同来源、分辨率、时长、风格的数据按配方进入训练。你要注意，训练代码里看起来只有 dataloader，但真正决定模型上限的是 dataloader 前面的这些步骤。

第五段，讲 infra 取舍。视频训练最常见的瓶颈有三个：存储 IO、GPU 显存、跨卡通信。存储 IO 的问题是视频文件大、解码慢、随机访问差，所以很多团队会做预处理、缓存 latent、按 shard 存储、把元数据放进索引库。显存的问题是 batch、帧数、分辨率、模型宽度和 activation 一起增长，所以你需要 gradient checkpointing、混合精度、optimizer state sharding、LoRA 或冻结部分模块。跨卡通信的问题是视频序列太长，单纯 data parallel 不够，FSDP、tensor parallel、context parallel、sequence parallel 会一起出现。判断一个训练 infra 是否成熟，不是看它能不能启动，而是看它能不能稳定回答：今天为什么慢，为什么 OOM，为什么 loss 抖，为什么某类 prompt 退化。

第六段，给你一个不用看屏幕也能记住的心智模型。把视频模型训练想成一条工厂流水线。原始视频是矿石；清洗和过滤是选矿；caption 是给矿石贴成分标签；VAE 是把矿石压成标准形状；DiT 训练是高炉；评估是质检；失败样本回流是重新配矿。很多人只盯着高炉，也就是模型结构，但真正的成本和质量，往往被配矿决定。你做视频训练 infra 时，最重要的能力是把“模型不好”翻译成“哪一段数据、哪一个条件、哪一个资源约束出了问题”。

第七段，落到你的工作。${lesson.drill}。这个练习不要追求大规模。你可以先用 4060 或普通 CPU 做缩小版：处理几十到几百个短视频，跑 ffprobe，切片，生成 caption，建立 metadata jsonl，写一个能按条件采样的 dataset。然后再把一个开源模型的 LoRA 或 inference workflow 接进来。这样你会真的理解大系统，而不是只会跑 notebook。

第八段，讲一个排障方法。以后你看到视频模型效果不好，不要直接说模型不行。先把问题分成四类。第一类是语义错误，比如 prompt 里说红色汽车，画面却生成蓝色汽车，这通常和 caption、text encoder、条件注入或训练数据分布有关。第二类是时间错误，比如主体脸在变、衣服纹理在闪、手指形状前后不一致，这通常和 temporal modeling、latent 压缩、帧采样、运动数据质量有关。第三类是画质错误，比如糊、噪点、边缘撕裂、压缩感强，这通常和 VAE、分辨率 curriculum、数据清晰度、后处理超分有关。第四类是系统错误，比如训练很慢、GPU 利用率低、偶发 OOM、loss 突然跳，这通常和 dataloader、缓存、batch 组成、并行策略和 checkpoint 有关。你做 infra 的价值，就是把一句“效果不好”拆成可以定位、可以复现、可以修的工程问题。

第九段，讲一个数据表设计。每个视频样本最好不要只存路径。你至少要存 source_id、license、duration、fps、width、height、codec、audio_flag、shot_id、start_time、end_time、quality_score、aesthetic_score、motion_score、watermark_score、safety_label、caption_short、caption_dense、caption_motion、language、hash、near_duplicate_group、latent_path、split、sampling_weight。听起来字段很多，但这些字段决定了你能不能回答训练中的关键问题：为什么这批数据让模型动作变好但文字理解变差？为什么某个来源的视频总导致水印？为什么高分辨率训练突然变慢？为什么某个 checkpoint 对人物稳定但对镜头运动差？没有元数据，你只能靠感觉调参；有元数据，你才有资格做实验。

第十段，讲实验纪律。视频生成训练特别容易被样例骗。一个 demo 好看，不代表训练配方对；一个 prompt 失败，也不代表模型整体差。每次改数据或算法，你至少要保留三类验证集：固定 prompt 集，用来看纵向变化；困难 prompt 集，用来看边界；真实业务 prompt 集，用来看生产可用性。每次训练都记录 commit、数据版本、caption 版本、过滤规则版本、VAE 版本、模型初始化、学习率、batch、帧数、分辨率、并行策略和随机种子。你后面做视频训练 infra，如果没有这个纪律，系统很快会变成“玄学炼丹平台”。有了这个纪律，它才会变成可以迭代的工程系统。

第十一段，给你一个十五分钟课程里最值得反复听的判断标准。凡是视频训练 infra 的设计，都要问五个问题。第一，这个设计是在减少噪声，还是只是在增加吞吐？如果只增加吞吐，但把低质量视频更快送进训练，模型会更快变差。第二，这个设计是在降低显存，还是在牺牲时间上下文？如果省显存的方式让模型看不到关键帧之间的关系，视频会更容易漂移。第三，这个设计是在改善平均质量，还是在改善长尾失败？产品里最伤人的通常不是平均分，而是明显穿帮的长尾样本。第四，这个设计有没有可回滚的数据版本？没有版本，失败就无法归因。第五，这个设计能不能被 4060 的小实验模拟？如果完全不能模拟，你至少要用小数据验证其中一个机制，否则你只是复制别人的配置。

第十二段，给你一个学习路径。第一遍听本课时，只记大框架。第二遍打开博客，把项目参照里的开源仓库逐个点进去，只看 README 里的系统要求、训练入口、数据格式和推理参数。第三遍回到自己的笔记，把每个项目归类：它解决的是基础 T2V，还是 I2V，还是 V2V，还是编辑和控制；它暴露的是训练能力，还是主要暴露推理能力；它依赖的是普通 DiT、MoE DiT、多模态 DiT，还是额外的控制模块。第四遍开始做本节练习。不要等“学完视频生成”再动手，infra 的理解只能从真实文件、真实显存、真实耗时和真实失败样本里长出来。

最后复盘。本节你要带走三句话。第一，视频训练 infra 的核心对象不是模型，而是“视频样本记录”。第二，算法原理必须和数据管线绑定理解，因为模型学到什么，取决于样本如何切、如何标、如何混。第三，开源项目是最好的教材，但读项目时不要只看 README 的效果图，要看它暴露了哪些训练、推理、缓存、并行和数据处理接口。下一节继续往下拆。`
}

function articleBody(n, lesson, script, audio) {
  const s = slug(n, lesson.short)
  const refs = projectNotes(lesson.projects)
  const audioExtra = audio.exists
    ? { audio: `/audio/${s}.mp3`, audioDuration: audio.duration, audioBytes: audio.bytes }
    : {}
  return `${fm(`视频训练 Infra ${String(n).padStart(2, '0')}：${lesson.title}`, lesson.summary, {
    concepts: lesson.focus,
    projects: lesson.projects,
    ...audioExtra,
  })}# 视频训练 Infra ${String(n).padStart(2, '0')}：${lesson.title}

## 开车听这一节

这节课按 15 分钟音频设计。你可以先直接播放上方音频，不需要看屏幕。听的时候只抓四个词：${lesson.focus.join('、')}。

## 本节目标

${lesson.summary}

学完后，你应该能把本节问题拆成三层：

1. 数据管线：输入如何被采集、切分、标注、过滤、缓存和采样。
2. 算法原理：模型训练目标、条件注入、latent 表示、时间一致性如何工作。
3. Infra 取舍：显存、吞吐、IO、通信、评估和回流如何影响工程设计。

## 音频讲稿

${script}

## 项目参照

${refs.map(([name, url, note]) => `- [${name}](${url})：${note}。`).join('\n')}

## 本节练习

${lesson.drill}

## 参考来源

${sources.map(([name, url]) => `- [${name}](${url})`).join('\n')}
`
}

async function main() {
  const postsDir = path.join(root, 'content/posts')
  const scriptsDir = path.join(root, 'audio-scripts/video-training-infra')
  await mkdir(postsDir, { recursive: true })
  await mkdir(scriptsDir, { recursive: true })

  for (const [index, lesson] of lessons.entries()) {
    const n = index + 1
    const s = slug(n, lesson.short)
    const script = spokenScript(n, lesson)
    await writeFile(path.join(scriptsDir, `${s}.txt`), script, 'utf8')
    await writeFile(path.join(postsDir, `${s}.md`), articleBody(n, lesson, script, await audioInfo(s)), 'utf8')
  }

  await writeFile(path.join(postsDir, `${day}-video-training-infra-course-index.md`), `${fm('视频训练 Infra：数据管线与算法原理课程', '面向视频生成训练 infra 的 10 节中文音频课，每节围绕数据管线、算法原理和开源项目实践。', {
    audioFirst: true,
  })}# 视频训练 Infra：数据管线与算法原理课程

这套课面向你接下来要做的视频训练 infra。目标不是泛泛了解视频生成，而是能听懂并设计训练系统中的关键环节：数据摄取、切分、caption、过滤、VAE latent、DiT 扩散训练、时间一致性、分布式训练、后训练控制和评估回流。

## 课程列表

${lessons.map((lesson, i) => `- [第 ${i + 1} 节：${lesson.title}](/posts/${slug(i + 1, lesson.short)}/)`).join('\n')}

## 主要项目参照

${sources.map(([name, url, note]) => `- [${name}](${url})：${note}。`).join('\n')}
`, 'utf8')

  console.log(`Generated ${lessons.length} video training infra lessons.`)
}

await main()
