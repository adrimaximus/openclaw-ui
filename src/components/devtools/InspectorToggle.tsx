'use client'
// Ported from 7i Portal — adapted for openclaw-ui
// Replaces: lucide-react → Material Symbols, shadcn Button → plain button, sonner → inline toast
import { useState, useEffect, useCallback, useRef } from 'react'

// ── Types ──────────────────────────────────────────────────────────────
interface InspectorInfo {
  componentName: string
  fileName: string
  lineNumber: string
  columnNumber?: string
  fullIdentifier: string
}
interface InspectorItem {
  id: string
  element: HTMLElement
  rect: DOMRect
  info: InspectorInfo
}
interface Point { x: number; y: number }
interface InspectorState {
  active: boolean
  paused: boolean
  multiSelectMode: boolean
  hoverItem: InspectorItem | null
  selectedItems: InspectorItem[]
  x: number; y: number
  rulerStart: Point | null
  rulerEnd: Point | null
  rulerStartItem: InspectorItem | null
  rulerEndItem: InspectorItem | null
}
type ToastType = 'success' | 'info' | 'error'
interface ToastMsg { id: number; msg: string; type: ToastType }

// ── Icon helper (Material Symbols) ────────────────────────────────────
function Icon({ name, className = '' }: { name: string; className?: string }) {
  return <span className={`material-symbols-outlined select-none ${className}`}>{name}</span>
}

// ── Module-level utilities ────────────────────────────────────────────
const cleanPath = (p: string) => {
  const parts = p.split('src/')
  return parts.length > 1 ? 'src/' + parts[1] : p
}

const formatCopy = (item: InspectorItem): string => {
  const path    = cleanPath(item.info.fileName)
  const tag     = item.element.tagName.toLowerCase()
  const classes = Array.from(item.element.classList).slice(0, 6).join('.')
  const w = Math.round(item.rect.width)
  const h = Math.round(item.rect.height)

  // Line 1: component @ src/path/File.tsx:line  → AI dapat langsung buka file
  const src = path === 'External/Library'
    ? `${item.info.componentName} (external)`
    : `${item.info.componentName} @ ${path}:${item.info.lineNumber}`

  // Line 2: element visual context
  const el = `<${tag}${classes ? '.' + classes : ''}>  ${w} \u00d7 ${h}px`

  return `${src}\n${el}`
}

// ── Component ─────────────────────────────────────────────────────────
const InspectorToggle = () => {
  const [inspectorState, setInspectorState] = useState<InspectorState>({
    active: false, paused: false, multiSelectMode: false,
    hoverItem: null, selectedItems: [],
    x: 0, y: 0,
    rulerStart: null, rulerEnd: null,
    rulerStartItem: null, rulerEndItem: null,
  })
  const [btnPos, setBtnPos]   = useState<{ x: number; y: number } | null>(null)
  const [toasts, setToasts]   = useState<ToastMsg[]>([])

  const isDraggingRef      = useRef(false)
  const dragStartTimeRef   = useRef(0)
  const dragStartPosRef    = useRef({ x: 0, y: 0 })
  const dragOffsetRef      = useRef({ x: 0, y: 0 })
  const inspectorStateRef  = useRef(inspectorState)
  const enabledRef         = useRef(false)

  // Sync refs
  useEffect(() => {
    inspectorStateRef.current = inspectorState
    enabledRef.current = inspectorState.active
  }, [inspectorState])

  // ── Toast helper ───────────────────────────────────────────────────
  const showToast = useCallback((msg: string, type: ToastType = 'info') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, msg, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 2500)
  }, [])

  // ── Toggle ─────────────────────────────────────────────────────────
  const toggleInspector = () => {
    setInspectorState(prev => ({
      ...prev, active: !prev.active, paused: false, multiSelectMode: false,
      hoverItem: null, selectedItems: [],
      rulerStart: null, rulerEnd: null, rulerStartItem: null, rulerEndItem: null,
    }))
  }

  const toggleMultiSelect = useCallback(() => {
    setInspectorState(prev => {
      const next = !prev.multiSelectMode
      showToast(next ? 'Multi-Select ON (click multiple items)' : 'Multi-Select OFF', 'info')
      return { ...prev, multiSelectMode: next, paused: false }
    })
  }, [showToast])

  // ── React Fiber helpers ────────────────────────────────────────────
  const getComponentName = useCallback((fiber: unknown): string => {
    if (!fiber) return 'Unknown'
    const f = fiber as { type?: unknown }
    const type = f.type
    if (typeof type === 'string') return type
    if (typeof type === 'function') {
      const fn = type as { displayName?: string; name?: string }
      return fn.displayName || fn.name || 'Anonymous'
    }
    if (typeof type === 'object' && type !== null) {
      const obj = type as { displayName?: string; render?: { displayName?: string; name?: string } }
      if (obj.displayName) return obj.displayName
      if (obj.render && (obj.render.displayName || obj.render.name)) return obj.render.displayName || obj.render.name || ''
    }
    return 'Unknown'
  }, [])

  const getElementDetails = (el: HTMLElement) => {
    let d = ''
    if (el.id) d += `#${el.id}`
    if (el.classList.length > 0) d += `.${Array.from(el.classList).slice(0, 2).join('.')}`
    return d
  }

  const getInspectorItem = useCallback((el: HTMLElement): InspectorItem | null => {
    const key = Object.keys(el).find(k => k.startsWith('__reactFiber$'))

    type Fiber = {
      type?: unknown
      _debugSource?: { fileName: string; lineNumber: number }
      return?: Fiber | null
    }
    const fiber = key ? (el as Record<string, unknown>)[key] as Fiber : null

    let bestFiber: Fiber | null = null
    let current: Fiber | null = fiber
    let attempts = 0

    // Pass 1 — cari user-defined React component (function/class) dengan _debugSource
    while (current && attempts < 30) {
      const isUserComp = typeof current.type === 'function' ||
        (typeof current.type === 'object' && current.type !== null)
      if (isUserComp && current._debugSource) { bestFiber = current; break }
      current = current.return ?? null
      attempts++
    }

    // Pass 2 — fallback: fiber apapun yang punya _debugSource
    if (!bestFiber) {
      current = fiber
      attempts = 0
      while (current && attempts < 30) {
        if (current._debugSource) { bestFiber = current; break }
        current = current.return ?? null
        attempts++
      }
    }

    // Pass 3 — DOM tree walk: naik lewat parentElement jika fiber element sendiri gagal
    if (!bestFiber) {
      let domParent = el.parentElement
      let domSteps = 0
      while (domParent && domSteps < 12 && !bestFiber) {
        const pKey = Object.keys(domParent).find(k => k.startsWith('__reactFiber$'))
        if (pKey) {
          let pCur: Fiber | null = (domParent as Record<string, unknown>)[pKey] as Fiber
          let pAtt = 0
          // Pass 1 on parent fiber
          while (pCur && pAtt < 30) {
            const isUserComp = typeof pCur.type === 'function' ||
              (typeof pCur.type === 'object' && pCur.type !== null)
            if (isUserComp && pCur._debugSource) { bestFiber = pCur; break }
            pCur = pCur.return ?? null
            pAtt++
          }
          // Pass 2 on parent fiber
          if (!bestFiber) {
            pCur = (domParent as Record<string, unknown>)[pKey] as Fiber
            pAtt = 0
            while (pCur && pAtt < 30) {
              if (pCur._debugSource) { bestFiber = pCur; break }
              pCur = pCur.return ?? null
              pAtt++
            }
          }
        }
        domParent = domParent.parentElement
        domSteps++
      }
    }

    const classHint = getElementDetails(el)
    let componentName: string, fileName: string, lineNumber: string

    if (bestFiber?._debugSource) {
      const src = bestFiber._debugSource
      componentName = getComponentName(bestFiber)
      fileName = src.fileName.replace(window.location.origin, '').replace(/^\//, '')
      lineNumber = src.lineNumber.toString()
    } else {
      componentName = el.tagName.toLowerCase()
      const role = el.getAttribute('role')
      if (role) componentName += ` [role="${role}"]`
      fileName = 'External/Library'
      lineNumber = '0'
    }

    const fullIdentifier = `${componentName}${classHint}`
    const id = fileName === 'External/Library'
      ? `node-${Date.now()}-${Math.random()}`
      : `${fileName}:${lineNumber}:${fullIdentifier}`

    return { id, element: el, rect: el.getBoundingClientRect(), info: { componentName, fileName, lineNumber, fullIdentifier } }
  }, [getComponentName])

  // ── Copy ───────────────────────────────────────────────────────────
  const copyToClipboard = useCallback(async () => {
    const cur = inspectorStateRef.current
    const items = cur.selectedItems.length > 0 ? cur.selectedItems : (cur.hoverItem ? [cur.hoverItem] : [])
    if (items.length === 0 && !cur.rulerStart) return

    if (cur.rulerStart && cur.rulerEnd) {
      const dx = cur.rulerEnd.x - cur.rulerStart.x
      const dy = cur.rulerEnd.y - cur.rulerStart.y
      const dist = Math.round(Math.sqrt(dx * dx + dy * dy))
      const fromName = cur.rulerStartItem ? `${cleanPath(cur.rulerStartItem.info.fileName)}:${cur.rulerStartItem.info.lineNumber} (${cur.rulerStartItem.info.componentName})` : 'Point A'
      const toName   = cur.rulerEndItem   ? `${cleanPath(cur.rulerEndItem.info.fileName)}:${cur.rulerEndItem.info.lineNumber} (${cur.rulerEndItem.info.componentName})` : 'Point B'
      await navigator.clipboard.writeText(`${dist}px (w: ${Math.abs(dx)}, h: ${Math.abs(dy)})\nFrom: ${fromName}\nTo: ${toName}`)
      showToast('Measurement copied!', 'success')
      return
    }

    const text = items.map(i => formatCopy(i)).join('\n\n─────────────\n\n')
    await navigator.clipboard.writeText(text)
    showToast(`Copied ${items.length} element${items.length > 1 ? 's' : ''}`, 'success')
  }, [showToast])

  // ── Drag ───────────────────────────────────────────────────────────
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    if ('button' in e && e.button !== 0) return
    isDraggingRef.current = true
    dragStartTimeRef.current = Date.now()
    const cx = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX
    const cy = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY
    dragStartPosRef.current = { x: cx, y: cy }
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    dragOffsetRef.current = { x: cx - rect.left, y: cy - rect.top }
  }

  const handleDragMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDraggingRef.current) return
    e.preventDefault()
    const cx = 'touches' in e ? (e as TouchEvent).touches[0].clientX : (e as MouseEvent).clientX
    const cy = 'touches' in e ? (e as TouchEvent).touches[0].clientY : (e as MouseEvent).clientY
    setBtnPos({
      x: Math.min(Math.max(0, cx - dragOffsetRef.current.x), window.innerWidth - 130),
      y: Math.min(Math.max(0, cy - dragOffsetRef.current.y), window.innerHeight - 50),
    })
  }, [])

  const handleDragEnd = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDraggingRef.current) return
    isDraggingRef.current = false
    const cx = 'changedTouches' in e ? (e as TouchEvent).changedTouches[0].clientX : (e as MouseEvent).clientX
    const cy = 'changedTouches' in e ? (e as TouchEvent).changedTouches[0].clientY : (e as MouseEvent).clientY
    const duration = Date.now() - dragStartTimeRef.current
    const dist = Math.hypot(cx - dragStartPosRef.current.x, cy - dragStartPosRef.current.y)
    if (duration < 200 && dist < 5) toggleInspector()
  }, [])

  // ── Keyboard shortcuts ─────────────────────────────────────────────
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Alt+T or Ctrl+Shift+X → toggle
      if ((e.altKey && e.code === 'KeyT') || ((e.metaKey || e.ctrlKey) && e.shiftKey && e.code === 'KeyX')) {
        e.preventDefault(); toggleInspector(); return
      }
      if (!enabledRef.current) return

      // Escape → close / clear
      if (e.key === 'Escape') {
        e.preventDefault()
        setInspectorState(prev => {
          if (prev.rulerStart || prev.selectedItems.length > 0)
            return { ...prev, rulerStart: null, rulerEnd: null, rulerStartItem: null, rulerEndItem: null, selectedItems: [], multiSelectMode: false, paused: false }
          return { ...prev, active: false }
        })
      }

      // Cmd/Ctrl+C → copy
      if ((e.metaKey || e.ctrlKey) && e.code === 'KeyC') {
        e.preventDefault(); copyToClipboard()
      }

      // D → ruler
      if (e.key === 'd') {
        const tag = document.activeElement?.tagName.toLowerCase()
        if (tag === 'input' || tag === 'textarea') return
        const cur = inspectorStateRef.current
        if (!cur.rulerStart) {
          setInspectorState(prev => ({ ...prev, rulerStart: { x: prev.x, y: prev.y }, rulerEnd: null, rulerStartItem: prev.hoverItem, rulerEndItem: null }))
          showToast(`Point A: ${cur.hoverItem?.info.componentName || 'Unknown'}`, 'info')
        } else {
          const dx = cur.x - cur.rulerStart.x
          const dy = cur.y - cur.rulerStart.y
          const dist = Math.round(Math.sqrt(dx * dx + dy * dy))
          setInspectorState(prev => ({ ...prev, rulerEnd: { x: prev.x, y: prev.y }, rulerEndItem: prev.hoverItem }))
          const fromName = cur.rulerStartItem ? `${cleanPath(cur.rulerStartItem.info.fileName)}:${cur.rulerStartItem.info.lineNumber} (${cur.rulerStartItem.info.componentName})` : 'Point A'
          const toName   = cur.hoverItem ? `${cleanPath(cur.hoverItem.info.fileName)}:${cur.hoverItem.info.lineNumber} (${cur.hoverItem.info.componentName})` : 'Point B'
          showToast(`Distance: ${dist}px`, 'success')
          navigator.clipboard.writeText(`${dist}px (w: ${Math.abs(dx)}, h: ${Math.abs(dy)})\nFrom: ${fromName}\nTo: ${toName}`).catch(() => {})
        }
      }

      // M → multi-select
      if (e.key === 'm' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const tag = document.activeElement?.tagName.toLowerCase()
        const isEditable = (document.activeElement as HTMLElement)?.isContentEditable
        if (tag === 'input' || tag === 'textarea' || isEditable) return
        e.preventDefault(); e.stopPropagation(); toggleMultiSelect()
      }
    }
    document.addEventListener('keydown', onKeyDown, { capture: true })
    return () => document.removeEventListener('keydown', onKeyDown, { capture: true })
  }, [copyToClipboard, showToast, toggleMultiSelect])

  // ── Drag events ────────────────────────────────────────────────────
  useEffect(() => {
    window.addEventListener('mousemove', handleDragMove)
    window.addEventListener('mouseup', handleDragEnd)
    window.addEventListener('touchmove', handleDragMove, { passive: false })
    window.addEventListener('touchend', handleDragEnd)
    return () => {
      window.removeEventListener('mousemove', handleDragMove)
      window.removeEventListener('mouseup', handleDragEnd)
      window.removeEventListener('touchmove', handleDragMove)
      window.removeEventListener('touchend', handleDragEnd)
    }
  }, [handleDragMove, handleDragEnd])

  // ── Mouse move / click ─────────────────────────────────────────────
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!enabledRef.current) return
      const target = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement
      if (!target || target.closest('#inspector-ui')) {
        setInspectorState(prev => ({ ...prev, x: e.clientX, y: e.clientY })); return
      }
      const item = getInspectorItem(target)
      setInspectorState(prev => ({
        ...prev, x: e.clientX, y: e.clientY,
        hoverItem: (prev.paused && !prev.multiSelectMode) ? prev.hoverItem : item,
      }))
    }

    const onInteraction = (e: Event) => {
      if (!enabledRef.current) return
      if ((e.target as HTMLElement).closest('#inspector-ui')) return
      e.preventDefault(); e.stopPropagation()
      const cur = inspectorStateRef.current
      if (!cur.hoverItem) return

      if ((e as MouseEvent).shiftKey || cur.multiSelectMode) {
        setInspectorState(prev => {
          if (prev.selectedItems.find(i => i.element === cur.hoverItem!.element)) return prev
          return { ...prev, paused: false, selectedItems: [...prev.selectedItems, cur.hoverItem!] }
        })
      } else {
        setInspectorState(prev => ({ ...prev, paused: true, selectedItems: [cur.hoverItem!] }))
        navigator.clipboard.writeText(formatCopy(cur.hoverItem))
          .then(() => showToast('Copied!', 'success'))
          .catch(() => showToast('Copy failed', 'error'))
      }
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('pointerdown', onInteraction, { capture: true })
    window.addEventListener('click', (e) => {
      if (enabledRef.current && !(e.target as HTMLElement).closest('#inspector-ui')) {
        e.preventDefault(); e.stopPropagation()
      }
    }, { capture: true })

    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('pointerdown', onInteraction, { capture: true })
    }
  }, [getInspectorItem, showToast])

  // ── Toast stack (always rendered) ─────────────────────────────────
  const toastStack = (
    <div className="fixed bottom-20 right-4 z-[99999999] flex flex-col gap-1.5 pointer-events-none">
      {toasts.map(t => (
        <div key={t.id} className={`px-4 py-2 rounded-lg text-white text-xs font-semibold shadow-lg ${
          t.type === 'success' ? 'bg-emerald-500' : t.type === 'error' ? 'bg-red-500' : 'bg-[#3f484a]'
        }`}>
          {t.msg}
        </div>
      ))}
    </div>
  )

  // ── Inactive state: floating button ───────────────────────────────
  if (!inspectorState.active) {
    return (
      <>
        {toastStack}
        <div
          className="fixed z-[9999] cursor-grab active:cursor-grabbing"
          style={{
            left: btnPos ? btnPos.x : undefined,
            top:  btnPos ? btnPos.y : undefined,
            right:  btnPos ? undefined : '1rem',
            bottom: btnPos ? undefined : '1rem',
          }}
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
          onDoubleClick={toggleInspector}
          title="Double-click to open · Drag to move · Alt+T"
        >
          <button className="flex items-center gap-1.5 px-3 py-2 bg-white border border-primary text-primary text-xs font-semibold rounded-full shadow-lg opacity-80 hover:opacity-100 transition-opacity select-none pointer-events-none">
            <Icon name="drag_indicator" className="text-[16px] opacity-50" />
            DevTools
          </button>
        </div>
      </>
    )
  }

  // ── Active state: overlay ──────────────────────────────────────────
  return (
    <>
      {toastStack}
      <div id="inspector-ui" className="fixed inset-0 z-[2147483647] pointer-events-none">

        {/* Hover highlight */}
        {!inspectorState.paused && !inspectorState.multiSelectMode && inspectorState.hoverItem && (
          <div className="absolute border-2 border-blue-500 bg-blue-500/10 transition-all duration-75"
            style={{ left: inspectorState.hoverItem.rect.left, top: inspectorState.hoverItem.rect.top, width: inspectorState.hoverItem.rect.width, height: inspectorState.hoverItem.rect.height }} />
        )}

        {/* Cursor tooltip */}
        {inspectorState.hoverItem && (
          <HoverTooltip
            item={inspectorState.hoverItem}
            x={inspectorState.x}
            y={inspectorState.y}
            paused={inspectorState.paused}
          />
        )}

        {/* Multi-select hover */}
        {inspectorState.multiSelectMode && inspectorState.hoverItem && (
          <div className="absolute border-2 border-dashed border-orange-500 bg-orange-500/10 transition-all duration-75"
            style={{ left: inspectorState.hoverItem.rect.left, top: inspectorState.hoverItem.rect.top, width: inspectorState.hoverItem.rect.width, height: inspectorState.hoverItem.rect.height }} />
        )}

        {/* Selected items */}
        {inspectorState.selectedItems.map((item, i) => (
          <div key={item.id + i} className="absolute border-2 border-green-500 bg-green-500/20"
            style={{ left: item.rect.left, top: item.rect.top, width: item.rect.width, height: item.rect.height }}>
            <div className="absolute -top-6 left-0 bg-green-500 text-white text-[10px] px-1 rounded shadow-sm whitespace-nowrap z-10 max-w-[200px] truncate">
              {item.info.fullIdentifier}
            </div>
          </div>
        ))}

        {/* Ruler */}
        {inspectorState.rulerStart && (() => {
          const endX = inspectorState.rulerEnd ? inspectorState.rulerEnd.x : inspectorState.x
          const endY = inspectorState.rulerEnd ? inspectorState.rulerEnd.y : inspectorState.y
          const dx = endX - inspectorState.rulerStart.x
          const dy = endY - inspectorState.rulerStart.y
          const dist = Math.round(Math.sqrt(dx * dx + dy * dy))
          const toItem = inspectorState.rulerEndItem || inspectorState.hoverItem
          const fromName = inspectorState.rulerStartItem ? `${cleanPath(inspectorState.rulerStartItem.info.fileName).split('/').pop()} (${inspectorState.rulerStartItem.info.componentName})` : 'A'
          const toName   = toItem ? `${cleanPath(toItem.info.fileName).split('/').pop()} (${toItem.info.componentName})` : 'B'
          return (
            <div className="absolute inset-0 pointer-events-none overflow-visible">
              <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
                <line x1={inspectorState.rulerStart.x} y1={inspectorState.rulerStart.y} x2={endX} y2={endY}
                  stroke="red" strokeWidth="2" strokeDasharray="4 2" />
              </svg>
              <div className="absolute bg-red-500 text-white text-xs px-2 py-1 rounded-md shadow-lg pointer-events-none -translate-x-1/2 -translate-y-full text-center"
                style={{ left: (inspectorState.rulerStart.x + endX) / 2, top: (inspectorState.rulerStart.y + endY) / 2 }}>
                <div className="font-bold">{dist}px</div>
                <div className="text-[10px] opacity-80">w: {Math.abs(dx)} h: {Math.abs(dy)}</div>
                <div className="text-[9px] opacity-70 mt-0.5 max-w-[200px] truncate">{fromName} → {toName}</div>
              </div>
            </div>
          )
        })()}

        {/* Toolbar */}
        <div
          className="fixed bg-white border border-[#e0e3e5] shadow-2xl rounded-full px-4 py-2 flex items-center gap-2 pointer-events-auto cursor-default"
          style={{ left: btnPos ? btnPos.x : '50%', top: btnPos ? btnPos.y : undefined, bottom: btnPos ? undefined : '1.5rem', transform: btnPos ? 'none' : 'translateX(-50%)' }}
        >
          {/* Drag handle */}
          <div className="cursor-grab active:cursor-grabbing text-[#9ca3af] hover:text-[#3f484a]"
            onMouseDown={handleDragStart} onTouchStart={handleDragStart}>
            <Icon name="drag_indicator" className="text-[18px]" />
          </div>

          {/* Label */}
          <div className="flex items-center gap-1.5 mr-1 pr-3 border-r border-[#e0e3e5]">
            <Icon name="document_scanner" className="text-[18px] text-blue-500" />
            <span className="text-sm font-semibold text-[#191c1e]">DevTools</span>
          </div>

          {/* Selection count */}
          <div className="text-[10px] text-[#6f797a] mr-1 flex flex-col leading-tight">
            <span>{inspectorState.selectedItems.length} selected</span>
            <span className="opacity-70">{inspectorState.multiSelectMode ? 'MULTI ON' : 'Single'}</span>
          </div>

          {/* Multi-select */}
          <button
            onClick={toggleMultiSelect}
            title="Multi-Select (M)"
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
              inspectorState.multiSelectMode ? 'bg-orange-100 text-orange-600' : 'hover:bg-[#f2f4f6] text-[#6f797a]'
            }`}
          >
            <Icon name="add_circle" className="text-[18px]" />
          </button>

          {/* Ruler */}
          <button
            onClick={() => {
              const cur = inspectorStateRef.current
              if (!cur.rulerStart) {
                setInspectorState(prev => ({ ...prev, rulerStart: { x: prev.x, y: prev.y }, rulerEnd: null, rulerStartItem: prev.hoverItem, rulerEndItem: null }))
                showToast('Point A set — press D again for Point B', 'info')
              } else {
                setInspectorState(prev => ({ ...prev, rulerStart: null, rulerEnd: null, rulerStartItem: null, rulerEndItem: null }))
              }
            }}
            title="Measure (D)"
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
              inspectorState.rulerStart ? 'bg-red-100 text-red-500' : 'hover:bg-[#f2f4f6] text-[#6f797a]'
            }`}
          >
            <Icon name="straighten" className="text-[18px]" />
          </button>

          {/* Copy */}
          <button onClick={copyToClipboard} title="Copy (Ctrl+C)"
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#f2f4f6] text-[#6f797a] transition-all">
            <Icon name="content_copy" className="text-[18px]" />
          </button>

          {/* Close */}
          <button onClick={toggleInspector} title="Close (Esc)"
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-red-50 hover:text-red-500 text-[#6f797a] transition-all">
            <Icon name="close" className="text-[18px]" />
          </button>
        </div>
      </div>
    </>
  )
}

// ── Hover Tooltip ─────────────────────────────────────────────────────
function HoverTooltip({ item, x, y, paused }: {
  item: InspectorItem; x: number; y: number; paused: boolean
}) {
  const TIP_W = 288, TIP_H = 120
  const OX = 18,  OY = 18
  const left = x + OX + TIP_W > window.innerWidth  ? x - TIP_W - OX : x + OX
  const top  = y + OY + TIP_H > window.innerHeight ? y - TIP_H - OY : y + OY

  const tag     = item.element.tagName.toLowerCase()
  const classes = Array.from(item.element.classList).slice(0, 5)
  const w = Math.round(item.rect.width)
  const h = Math.round(item.rect.height)
  const path = cleanPath(item.info.fileName)

  return (
    <div
      className="absolute pointer-events-none rounded-xl shadow-2xl overflow-hidden"
      style={{ left, top, width: TIP_W, zIndex: 20 }}
    >
      {/* Component name row */}
      <div className="bg-[#1e1e2e] px-3 py-2 border-b border-[#ffffff12] flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
        <span className="font-bold text-white text-xs flex-1 truncate">{item.info.componentName}</span>
        {paused
          ? <span className="text-[9px] bg-green-500 text-white px-1.5 py-0.5 rounded-full font-bold shrink-0">✓ COPIED</span>
          : <span className="text-[9px] text-[#4b5563] shrink-0">click to copy</span>
        }
      </div>

      {/* Details */}
      <div className="bg-[#16162a] px-3 py-2 space-y-1.5">
        {/* File:line */}
        <div className="font-mono text-[10px] text-[#7dd3fc] flex gap-1 min-w-0">
          <span className="opacity-50 shrink-0">src:</span>
          <span className="truncate">{path}:{item.info.lineNumber}</span>
        </div>

        {/* Element tag + classes */}
        <div className="font-mono text-[10px] truncate">
          <span className="text-[#c084fc]">&lt;{tag}&gt;</span>
          {classes.length > 0 && (
            <span className="text-[#86efac] ml-1">.{classes.slice(0, 4).join(' .')}</span>
          )}
        </div>

        {/* Size + position */}
        <div className="text-[10px] flex gap-3">
          <span className="text-[#fbbf24]">{w} × {h}px</span>
          <span className="text-[#4b5563]">@ {Math.round(item.rect.left)}, {Math.round(item.rect.top)}</span>
        </div>
      </div>
    </div>
  )
}

export default InspectorToggle
