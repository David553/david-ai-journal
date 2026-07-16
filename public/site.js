const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) entry.target.classList.add('visible')
  })
}, { threshold: 0.12 })

document.querySelectorAll('.reveal').forEach((element) => observer.observe(element))

const field = document.querySelector('.signal-field')
window.addEventListener('pointermove', (event) => {
  field?.style.setProperty('--x', `${event.clientX}px`)
  field?.style.setProperty('--y', `${event.clientY}px`)
}, { passive: true })

const listenPanel = document.querySelector('.listen-panel')
const lessonAudio = listenPanel?.querySelector('audio')
if (lessonAudio && 'mediaSession' in navigator) {
  navigator.mediaSession.metadata = new MediaMetadata({
    title: listenPanel.dataset.mediaTitle || document.title,
    artist: listenPanel.dataset.mediaArtist || 'David',
    album: '生成式 AI 与模型 Infra 基础课',
  })
  const seek = (seconds) => {
    lessonAudio.currentTime = Math.max(0, Math.min(lessonAudio.duration || Infinity, lessonAudio.currentTime + seconds))
  }
  navigator.mediaSession.setActionHandler('play', () => lessonAudio.play())
  navigator.mediaSession.setActionHandler('pause', () => lessonAudio.pause())
  navigator.mediaSession.setActionHandler('seekbackward', (event) => seek(-(event.seekOffset || 15)))
  navigator.mediaSession.setActionHandler('seekforward', (event) => seek(event.seekOffset || 15))
}
