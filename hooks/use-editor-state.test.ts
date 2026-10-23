// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useEditorState } from './use-editor-state'
import { type FreeElement } from '@/lib/types'

vi.mock('@/lib/firebase', () => ({ auth: { currentUser: null } }))
vi.mock('@/lib/invitation-service', () => ({
  saveInvitation: vi.fn(),
  loadInvitation: vi.fn(),
}))

const HISTORY_COMMIT_DELAY_MS = 400

function makeElement(id: string): FreeElement {
  return {
    id, type: 'text', x: 0, y: 0, width: 10, height: 10,
    rotation: 0, zIndex: 0, opacity: 1, locked: false,
  }
}

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

// invitationId가 비어 있으면 loadInvitation 이펙트가 건너뛰어져서, undo/redo
// 히스토리 로직만 격리해서 볼 수 있다.
function renderEditorState() {
  return renderHook(() => useEditorState(''))
}

describe('useEditorState history (undo/redo)', () => {
  it('commits a debounced edit into history after the delay', () => {
    const { result } = renderEditorState()

    act(() => {
      result.current.addFreeElement(makeElement('a'))
    })
    expect(result.current.canUndo).toBe(false)

    act(() => {
      vi.advanceTimersByTime(HISTORY_COMMIT_DELAY_MS)
    })
    expect(result.current.canUndo).toBe(true)
  })

  it('collapses rapid successive edits within the debounce window into one history step', () => {
    const { result } = renderEditorState()

    act(() => {
      result.current.addFreeElement(makeElement('a'))
      result.current.addFreeElement(makeElement('b'))
      vi.advanceTimersByTime(HISTORY_COMMIT_DELAY_MS)
    })

    expect(result.current.canUndo).toBe(true)
    act(() => {
      result.current.undo()
    })
    // 한 번의 undo로 두 요소가 모두 사라져야 한다 (하나의 히스토리 스텝으로 묶였으므로).
    expect(result.current.state.customLayout?.freeElements).toHaveLength(0)
    expect(result.current.canUndo).toBe(false)
  })

  it('undo while an edit is still pending (not yet debounced) flushes it and restores the prior layout', () => {
    const { result } = renderEditorState()

    act(() => {
      result.current.addFreeElement(makeElement('a'))
    })
    expect(result.current.state.customLayout?.freeElements).toHaveLength(1)

    // 디바운스 타이머가 끝나기 전에 undo를 누른 상황.
    act(() => {
      result.current.undo()
    })

    expect(result.current.state.customLayout?.freeElements).toHaveLength(0)
    expect(result.current.canRedo).toBe(true)
  })

  it('redo restores the layout that undo just reverted, exactly one step', () => {
    const { result } = renderEditorState()

    // 각 편집을 별도 act()로 분리해, 실제 사용 때처럼 커밋 사이에 stateRef가
    // 갱신(useEffect 플러시)된 뒤 다음 편집이 이어지도록 한다.
    act(() => {
      result.current.addFreeElement(makeElement('a'))
    })
    act(() => {
      vi.advanceTimersByTime(HISTORY_COMMIT_DELAY_MS)
    })
    act(() => {
      result.current.addFreeElement(makeElement('b'))
    })
    act(() => {
      vi.advanceTimersByTime(HISTORY_COMMIT_DELAY_MS)
    })
    expect(result.current.state.customLayout?.freeElements.map((e) => e.id)).toEqual(['a', 'b'])

    act(() => {
      result.current.undo()
    })
    // 한 단계만 되돌아가야 한다 — 'a'는 남아 있어야 함.
    expect(result.current.state.customLayout?.freeElements.map((e) => e.id)).toEqual(['a'])

    act(() => {
      result.current.redo()
    })
    expect(result.current.state.customLayout?.freeElements.map((e) => e.id)).toEqual(['a', 'b'])
  })

  it('does nothing when there is no history to undo or redo', () => {
    const { result } = renderEditorState()

    act(() => {
      result.current.undo()
      result.current.redo()
    })

    expect(result.current.state.customLayout?.freeElements).toHaveLength(0)
    expect(result.current.canUndo).toBe(false)
    expect(result.current.canRedo).toBe(false)
  })
})
