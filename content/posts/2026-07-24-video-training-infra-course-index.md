---
title: "视频训练 Infra：数据管线与算法原理课程"
date: 2026-07-24
summary: "面向视频生成训练 infra 的 10 节中文音频课，每节围绕数据管线、算法原理和开源项目实践。"
tags: [视频生成, 训练 Infra, 数据管线, 算法原理]
audioFirst: true
---
# 视频训练 Infra：数据管线与算法原理课程

这套课面向你接下来要做的视频训练 infra。目标不是泛泛了解视频生成，而是能听懂并设计训练系统中的关键环节：数据摄取、切分、caption、过滤、VAE latent、DiT 扩散训练、时间一致性、分布式训练、后训练控制和评估回流。

## 课程列表

- [第 1 节：视频训练 Infra 全景：从数据、VAE、DiT 到评估](/posts/2026-07-24-video-training-infra-01-map-and-scope/)
- [第 2 节：数据摄取与切分：视频样本不是文件，是时间片](/posts/2026-07-24-video-training-infra-02-data-ingestion/)
- [第 3 节：Caption 与语义标注：模型学到的是视频-文本对齐](/posts/2026-07-24-video-training-infra-03-caption-pipeline/)
- [第 4 节：质量过滤与安全过滤：训练集决定上限，也决定事故](/posts/2026-07-24-video-training-infra-04-quality-filtering/)
- [第 5 节：视频 VAE 与 latent 表示：先把像素压到可训练空间](/posts/2026-07-24-video-training-infra-05-vae-latent/)
- [第 6 节：扩散与 DiT：视频生成模型到底在学习什么](/posts/2026-07-24-video-training-infra-06-diffusion-dit/)
- [第 7 节：时间一致性：视频模型为什么容易闪烁和漂移](/posts/2026-07-24-video-training-infra-07-temporal-consistency/)
- [第 8 节：分布式训练：FSDP、context parallel 和 checkpointing](/posts/2026-07-24-video-training-infra-08-distributed-training/)
- [第 9 节：后训练与可控生成：从 LoRA 到 V2V/R2V/MV2V](/posts/2026-07-24-video-training-infra-09-post-training-control/)
- [第 10 节：评估与生产化：从 benchmark 到训练数据回流](/posts/2026-07-24-video-training-infra-10-evaluation-production/)

## 主要项目参照

- [Wan2.2](https://github.com/Wan-Video/Wan2.2)：MoE 视频 DiT、T2V/I2V/TI2V、Wan2.2-VAE 高压缩、720P/24fps、FSDP/Ulysses 推理路径。
- [HunyuanVideo-1.5](https://github.com/Tencent-Hunyuan/HunyuanVideo-1.5)：8.3B、训练代码、FSDP、context parallel、gradient checkpointing、Muon、SSTA、数据治理和后训练。
- [LTX-Video / LTX-2](https://github.com/Lightricks/ltx-video)：DiT 视频生成、音画同步、多关键帧、LoRA 训练、ComfyUI/Diffusers 工作流。
- [CogVideoX](https://github.com/zai-org/CogVideo)：T2V/I2V/视频续写任务，适合学习开源视频模型的任务接口和条件注入。
- [Mochi 1](https://github.com/genmoai/mochi)：Apache-2.0、prompt adherence、LoRA fine-tuning、consumer GPU/ComfyUI 生态。
- [VACE](https://github.com/ali-vilab/VACE)：reference-to-video、video-to-video、masked video editing、基于 Wan/LTX 的全能视频创建编辑范式。
