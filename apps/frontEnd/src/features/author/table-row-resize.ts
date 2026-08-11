import { Extension } from '@tiptap/react'
import { TableRow } from '@tiptap/extension-table-row'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import type { EditorView } from '@tiptap/pm/view'

const MIN_ROW_HEIGHT = 36
const EDGE_ZONE = 6

type DragState = {
  rowPos: number
  startY: number
  startHeight: number
}

function findRowInfo(view: EditorView, clientX: number, clientY: number) {
  const dom = document.elementFromPoint(clientX, clientY)
  if (!dom) return null
  const cell = dom.closest('td, th') as HTMLElement | null
  if (!cell || !view.dom.contains(cell)) return null
  const row = cell.parentElement
  if (!row || row.tagName !== 'TR') return null
  const table = row.closest('table')
  if (!table || !view.dom.contains(table)) return null

  const rowRect = row.getBoundingClientRect()
  const nearBottom = clientY >= rowRect.bottom - EDGE_ZONE && clientY <= rowRect.bottom + EDGE_ZONE
  if (!nearBottom) return null

  let pos: number
  try {
    pos = view.posAtDOM(row, 0)
  } catch {
    return null
  }
  const $pos = view.state.doc.resolve(pos)
  for (let d = $pos.depth; d > 0; d -= 1) {
    const node = $pos.node(d)
    if (node.type.name === 'tableRow') {
      return {
        rowPos: $pos.before(d),
        rowNode: node,
        rowEl: row as HTMLTableRowElement,
        height: rowRect.height,
      }
    }
  }
  return null
}

function applyRowHeight(view: EditorView, rowPos: number, height: number) {
  const node = view.state.doc.nodeAt(rowPos)
  if (!node || node.type.name !== 'tableRow') return
  const next = Math.max(MIN_ROW_HEIGHT, Math.round(height))
  if (node.attrs.height === next) return
  const tr = view.state.tr.setNodeMarkup(rowPos, undefined, {
    ...node.attrs,
    height: next,
  })
  view.dispatch(tr)
}

/** 带可持久化高度的表格行 */
export const ResizableTableRow = TableRow.extend({
  name: 'tableRow',
  addAttributes() {
    return {
      ...this.parent?.(),
      height: {
        default: null,
        parseHTML: (element) => {
          const raw =
            element.getAttribute('data-row-height') ||
            element.style.height ||
            element.getAttribute('height')
          if (!raw) return null
          const n = parseInt(String(raw), 10)
          return Number.isFinite(n) && n > 0 ? n : null
        },
        renderHTML: (attributes) => {
          if (!attributes.height) return {}
          return {
            'data-row-height': String(attributes.height),
            style: `height: ${attributes.height}px`,
          }
        },
      },
    }
  },
})

/**
 * 表格行高拖拽：靠近行底边出现调整光标，拖动即可改变行高。
 */
export const TableRowResize = Extension.create({
  name: 'tableRowResize',

  addProseMirrorPlugins() {
    let drag: DragState | null = null
    let hoverHandle: HTMLElement | null = null

    const clearHandle = () => {
      hoverHandle?.remove()
      hoverHandle = null
    }

    const showHandle = (rowEl: HTMLElement) => {
      const table = rowEl.closest('table')
      if (!table) return
      const wrapper = (table.closest('.tableWrapper') as HTMLElement | null) ?? table.parentElement
      if (!wrapper) return
      if (getComputedStyle(wrapper).position === 'static') {
        wrapper.style.position = 'relative'
      }
      if (!hoverHandle) {
        hoverHandle = document.createElement('div')
        hoverHandle.className = 'row-resize-handle'
        wrapper.appendChild(hoverHandle)
      }
      const wrapperRect = wrapper.getBoundingClientRect()
      const rowRect = rowEl.getBoundingClientRect()
      hoverHandle.style.top = `${rowRect.bottom - wrapperRect.top + wrapper.scrollTop - 2}px`
      hoverHandle.style.left = `${rowRect.left - wrapperRect.left + wrapper.scrollLeft}px`
      hoverHandle.style.width = `${rowRect.width}px`
    }

    return [
      new Plugin({
        key: new PluginKey('tableRowResize'),
        view: () => ({
          destroy() {
            clearHandle()
            drag = null
          },
        }),
        props: {
          handleDOMEvents: {
            mousemove(view, event) {
              if (drag) {
                const dy = event.clientY - drag.startY
                const next = Math.max(MIN_ROW_HEIGHT, drag.startHeight + dy)
                applyRowHeight(view, drag.rowPos, next)
                const info = findRowInfo(view, event.clientX, event.clientY)
                if (info) showHandle(info.rowEl)
                else {
                  // 拖拽中仍根据 rowPos 定位手柄
                  try {
                    const dom = view.nodeDOM(drag.rowPos)
                    if (dom instanceof HTMLElement) showHandle(dom)
                  } catch {
                    /* ignore */
                  }
                }
                return true
              }

              const info = findRowInfo(view, event.clientX, event.clientY)
              if (info) {
                view.dom.classList.add('row-resize-cursor')
                showHandle(info.rowEl)
              } else {
                view.dom.classList.remove('row-resize-cursor')
                clearHandle()
              }
              return false
            },
            mousedown(view, event) {
              if (event.button !== 0) return false
              const info = findRowInfo(view, event.clientX, event.clientY)
              if (!info) return false
              event.preventDefault()
              drag = {
                rowPos: info.rowPos,
                startY: event.clientY,
                startHeight: info.rowNode.attrs.height ?? info.height,
              }
              view.dom.classList.add('row-resize-cursor')
              showHandle(info.rowEl)

              const onUp = () => {
                drag = null
                view.dom.classList.remove('row-resize-cursor')
                clearHandle()
                window.removeEventListener('mouseup', onUp)
              }
              window.addEventListener('mouseup', onUp)
              return true
            },
            mouseleave(view) {
              if (drag) return false
              view.dom.classList.remove('row-resize-cursor')
              clearHandle()
              return false
            },
          },
        },
      }),
    ]
  },
})
