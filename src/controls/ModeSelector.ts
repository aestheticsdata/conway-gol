export type Mode = 'random' | 'zoo'

class ModeSelector {
  constructor(setMode) {
    document.querySelectorAll('input[name="mode"]').forEach(el => {
      el.addEventListener("change", e => {
        setMode((e.currentTarget as HTMLInputElement).value)
      })
    })
  }
}

export default ModeSelector
