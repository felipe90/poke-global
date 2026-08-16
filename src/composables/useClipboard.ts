/**
 * Clipboard copy with fallback: `navigator.clipboard.writeText` is primary;
 * `execCommand('copy')` on a detached textarea is the fallback when the
 * Clipboard API is unavailable or rejects. Both failing resolves to `'error'`.
 * Pure text — no network, no share-text building (ShareButton does that in phase 5).
 */
export type CopyStatus = 'success' | 'error'

function fallbackCopy(text: string): CopyStatus {
  try {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.setAttribute('readonly', '')
    textarea.style.position = 'absolute'
    textarea.style.left = '-9999px'
    document.body.appendChild(textarea)
    textarea.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(textarea)
    return ok ? 'success' : 'error'
  } catch {
    return 'error'
  }
}

export function useClipboard() {
  async function copy(text: string): Promise<CopyStatus> {
    const clipboard = navigator.clipboard
    if (clipboard && typeof clipboard.writeText === 'function') {
      try {
        await clipboard.writeText(text)
        return 'success'
      } catch {
        // fall through to the execCommand fallback
      }
    }
    return fallbackCopy(text)
  }

  return { copy }
}
