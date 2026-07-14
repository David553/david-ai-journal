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
