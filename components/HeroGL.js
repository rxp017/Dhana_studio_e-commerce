'use client'
import { useEffect, useRef } from 'react'

const VERT = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}'

// Elegant cream wash: soft sage base, blush drift, rose bloom toward the mouse, gold shimmer.
const FRAG = `
precision highp float;
uniform vec2 uRes;uniform float uTime;uniform vec2 uMouse;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<4;i++){v+=a*noise(p);p=p*2.02+vec2(3.7,9.1);a*=.5;}return v;}
void main(){
vec2 uv=gl_FragCoord.xy/uRes;
vec2 p=uv;p.x*=uRes.x/uRes.y;
float t=uTime*.025;
vec2 m=uMouse;m.x*=uRes.x/uRes.y;
float dye=exp(-length(p-m)*2.6);
vec2 q=vec2(fbm(p*1.15+t),fbm(p*1.15-t*.45+4.7));
vec2 r=vec2(fbm(p*1.15+q*1.4+vec2(1.7,9.2)+t*.5),fbm(p*1.15+q*1.4+vec2(8.3,2.8)-t*.35));
float f=fbm(p*1.15+r*1.5+dye*1.1);
vec3 cream=vec3(.965,.937,.878);
vec3 sage=vec3(.839,.867,.796);
vec3 blush=vec3(.953,.855,.792);
vec3 rose=vec3(.906,.573,.443);
vec3 gold=vec3(.929,.816,.588);
vec3 col=cream;
col=mix(col,sage,smoothstep(.05,.35,f)*.5);
col=mix(col,blush,smoothstep(.35,.75,f)*.65);
col=mix(col,rose,smoothstep(.68,.98,f)*(.30+.35*dye));
col=mix(col,gold,smoothstep(.8,1.,q.x*.5+r.y*.5)*.22);
col+=(hash(gl_FragCoord.xy+fract(uTime))-.5)*.02;
gl_FragColor=vec4(col,1.);}`

export default function HeroGL() {
  const ref = useRef(null)
  useEffect(() => {
    const canvas = ref.current
    const gl = canvas.getContext('webgl', { antialias: false, alpha: false, depth: false, stencil: false, powerPreference: 'low-power' })
    if (!gl) return
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s }
    const prog = gl.createProgram()
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT))
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG))
    gl.linkProgram(prog); gl.useProgram(prog)
    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
    const loc = gl.getAttribLocation(prog, 'p')
    gl.enableVertexAttribArray(loc)
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)
    const uRes = gl.getUniformLocation(prog, 'uRes')
    const uTime = gl.getUniformLocation(prog, 'uTime')
    const uMouse = gl.getUniformLocation(prog, 'uMouse')
    const resize = () => {
      const s = Math.min(window.devicePixelRatio || 1, 1.5) * 0.7
      canvas.width = Math.max(2, Math.floor(canvas.clientWidth * s))
      canvas.height = Math.max(2, Math.floor(canvas.clientHeight * s))
      gl.viewport(0, 0, canvas.width, canvas.height)
    }
    resize()
    window.addEventListener('resize', resize)
    let visible = true
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting }, { threshold: 0 })
    io.observe(canvas)
    let mx = .5, my = .4, tx = .5, ty = .4
    const move = e => {
      const r = canvas.getBoundingClientRect()
      tx = (e.clientX - r.left) / r.width
      ty = 1 - (e.clientY - r.top) / r.height
    }
    window.addEventListener('mousemove', move, { passive: true })
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
    const t0 = performance.now()
    let raf
    const frame = () => {
      raf = requestAnimationFrame(frame)
      if (!visible || document.hidden) return
      mx += (tx - mx) * .04; my += (ty - my) * .04
      gl.uniform2f(uRes, canvas.width, canvas.height)
      gl.uniform1f(uTime, (performance.now() - t0) / 1000)
      gl.uniform2f(uMouse, mx, my)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
      if (reduced) cancelAnimationFrame(raf)
    }
    raf = requestAnimationFrame(frame)
    return () => {
      cancelAnimationFrame(raf); io.disconnect()
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', move)
      gl.getExtension('WEBGL_lose_context')?.loseContext()
    }
  }, [])
  return <canvas ref={ref} className="hero-gl" aria-hidden="true" />
}