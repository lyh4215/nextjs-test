'use client'

import React, { useState } from 'react'

export default function DiagonalEditableBlockDemo() {
  const [topText, setTopText] = useState('상단 블록')
  const [bottomText, setBottomText] = useState('하단 블록')
  const [topColor, setTopColor] = useState('#3b82f6')
  const [bottomColor, setBottomColor] = useState('#ec4899')

  const [editing, setEditing] = useState<'top' | 'bottom' | null>(null)
  const [draft, setDraft] = useState('')

  const startEdit = (type: 'top' | 'bottom') => {
    setEditing(type)
    setDraft(type === 'top' ? topText : bottomText)
  }

  const save = () => {
    if (editing === 'top') setTopText(draft)
    if (editing === 'bottom') setBottomText(draft)
    setEditing(null)
  }

  return (
    <div style={{ padding: 40 }}>
      {/* 색상 변경 */}
      <div style={{ marginBottom: 20 }}>
        <input type="color" value={topColor} onChange={(e) => setTopColor(e.target.value)} /> 상단
        <input
          type="color"
          value={bottomColor}
          onChange={(e) => setBottomColor(e.target.value)}
          style={{ marginLeft: 20 }}
        />{' '}
        하단
      </div>

      {/* 블록 */}
      <div
        style={{
          width: 400,
          height: 400,
          position: 'relative',
          border: '1px solid #ccc',
        }}
      >
        {/* 상단 */}
        <div
          onDoubleClick={() => startEdit('top')}
          style={{
            position: 'absolute',
            inset: 0,
            background: topColor,
            clipPath: 'polygon(0 0, 100% 0, 0 100%)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'flex-start',
            padding: 20,
            color: 'white',
            cursor: 'pointer',
          }}
        >
          {editing === 'top' ? (
            <input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={save}
              onKeyDown={(e) => e.key === 'Enter' && save()}
            />
          ) : (
            topText
          )}
        </div>

        {/* 하단 */}
        <div
          onDoubleClick={() => startEdit('bottom')}
          style={{
            position: 'absolute',
            inset: 0,
            background: bottomColor,
            clipPath: 'polygon(100% 0, 100% 100%, 0 100%)',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'flex-end',
            padding: 20,
            color: 'white',
            cursor: 'pointer',
          }}
        >
          {editing === 'bottom' ? (
            <input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={save}
              onKeyDown={(e) => e.key === 'Enter' && save()}
            />
          ) : (
            bottomText
          )}
        </div>
      </div>
    </div>
  )
}
