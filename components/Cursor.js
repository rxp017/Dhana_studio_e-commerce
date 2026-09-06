'use client'
import { useEffect, useRef } from 'react'

export default function Cursor() {
  const dot = useRef(), ring = useRef()
  useEffect(() => {
    if (matchMedia('(pointer: coarse)').matches) return
    const d = dot.current, r = ring.current
    let x = innerWidth / 2, y = innerHeight / 2, rx = x, ry = y, started = false
    const move = e => {
      x = e.clientX; y = e.clientY
      if (!started) { started = true; d.style.opacity = 1; r.style.opacity = 1; document.body.classList.add('has-cursor') }
    }
    const over = e => {
      const t = e.target.closest('a,button,[data-cursor]')
      r.classList.toggle('big', !!t)
    }
    let raf
    const loop = () => {
      rx += (x - rx) * 0.16; ry += (y - ry) * 0.16
      d.style.transform = `translate(${x}px,${y}px)`
      r.style.transform = `translate(${rx}px,${ry}px)`
      raf = requestAnimationFrame(loop)
    }
    addEventListener('mousemove', move, { passive: true })
    addEventListener('mouseover', over, { passive: true })
    raf = requestAnimationFrame(loop)
    return () => {
      removeEventListener('mousemove', move)
      removeEventListener('mouseover', over)
      cancelAnimationFrame(raf)
    }
  }, [])
  return (
    <>
      <div ref={dot} className="cursor-dot" />
      <div ref={ring} className="cursor-ring" />
    </>
  )
}