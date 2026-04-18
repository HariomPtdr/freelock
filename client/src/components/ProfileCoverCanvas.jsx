import { useEffect, useRef } from 'react'
import * as THREE from 'three'

const C = {
  org:   0xFF6803,
  rust:  0xAE3A02,
  amber: 0xD4830A,
  dim:   0x6b2801,
}

export default function ProfileCoverCanvas({ className = '' }) {
  const mountRef = useRef(null)

  useEffect(() => {
    const el = mountRef.current
    if (!el) return

    const W = el.clientWidth
    const H = el.clientHeight

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(W, H)
    renderer.setClearColor(0x000000, 0)
    el.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const cam = new THREE.PerspectiveCamera(60, W / H, 0.1, 100)
    cam.position.z = 5

    const td = []
    const track = x => { td.push(x); return x }

    // ── Lights ──────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0x1a0800, 1.2))
    const p1 = new THREE.PointLight(C.org,  4, 20); p1.position.set(3, 2, 4);  scene.add(p1)
    const p2 = new THREE.PointLight(C.rust, 3, 16); p2.position.set(-4, -1, 3); scene.add(p2)
    const p3 = new THREE.PointLight(C.amber,2, 14); p3.position.set(0, 3, 5);  scene.add(p3)

    // ── Floating particle cluster ────────────────────────────
    const particleCount = 280
    const positions = new Float32Array(particleCount * 3)
    const colors    = new Float32Array(particleCount * 3)
    const sizes     = new Float32Array(particleCount)

    const palette = [
      new THREE.Color(C.org),
      new THREE.Color(C.rust),
      new THREE.Color(C.amber),
      new THREE.Color(C.dim),
    ]

    for (let i = 0; i < particleCount; i++) {
      const spread = 7
      positions[i * 3]     = (Math.random() - 0.5) * spread * (W / H)
      positions[i * 3 + 1] = (Math.random() - 0.5) * spread * 0.5
      positions[i * 3 + 2] = (Math.random() - 0.5) * 3

      const c = palette[Math.floor(Math.random() * palette.length)]
      colors[i * 3]     = c.r
      colors[i * 3 + 1] = c.g
      colors[i * 3 + 2] = c.b

      sizes[i] = 0.012 + Math.random() * 0.028
    }

    const pGeo = track(new THREE.BufferGeometry())
    pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    pGeo.setAttribute('color',    new THREE.BufferAttribute(colors, 3))
    pGeo.setAttribute('size',     new THREE.BufferAttribute(sizes, 1))

    const pMat = track(new THREE.PointsMaterial({
      size: 0.045,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    }))

    const particles = new THREE.Points(pGeo, pMat)
    scene.add(particles)

    // ── Floating geometric cluster pieces ───────────────────
    const meshes = []

    const addMesh = (geo, col, x, y, z, sx = 1, sy = 1, sz = 1) => {
      const mat = track(new THREE.MeshStandardMaterial({
        color: col,
        transparent: true,
        opacity: 0.22,
        wireframe: false,
        roughness: 0.3,
        metalness: 0.8,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }))
      const mesh = new THREE.Mesh(track(geo), mat)
      mesh.position.set(x, y, z)
      mesh.scale.set(sx, sy, sz)
      mesh.userData.speed = { rx: (Math.random() - 0.5) * 0.008, ry: (Math.random() - 0.5) * 0.008 }
      mesh.userData.floatOffset = Math.random() * Math.PI * 2
      scene.add(mesh)
      meshes.push(mesh)
      return mesh
    }

    // Right cluster — icosahedron + ring
    addMesh(new THREE.IcosahedronGeometry(0.38, 1), C.org,   2.8,  0.3, 0.5)
    addMesh(new THREE.TorusGeometry(0.55, 0.04, 8, 40), C.amber, 2.8, 0.3, 0.5)

    // Left cluster — octahedron + ring
    addMesh(new THREE.OctahedronGeometry(0.28, 0),  C.rust, -2.6, -0.2, 0.3)
    addMesh(new THREE.TorusGeometry(0.42, 0.035, 8, 36), C.org, -2.6, -0.2, 0.3)

    // Center-right small tetra
    addMesh(new THREE.TetrahedronGeometry(0.18, 0), C.amber, 1.1, 0.5, 1.0)

    // Far left small sphere
    addMesh(new THREE.SphereGeometry(0.14, 8, 8), C.dim, -1.4, -0.4, 0.8)

    // ── Glow blobs (large transparent spheres) ───────────────
    const addBlob = (r, x, y, z, col, op) => {
      const mat = track(new THREE.MeshBasicMaterial({
        color: col, transparent: true, opacity: op,
        blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.BackSide,
      }))
      const mesh = new THREE.Mesh(track(new THREE.SphereGeometry(r, 10, 10)), mat)
      mesh.position.set(x, y, z)
      scene.add(mesh)
    }

    addBlob(3.2,  2.5,  0.5, -2, C.org,   0.055)
    addBlob(2.6, -2.8, -0.3, -2, C.rust,  0.045)
    addBlob(2.0,  0.2,  0.8, -1, C.amber, 0.035)

    // ── Mouse parallax ────────────────────────────────────────
    const mouse = { x: 0, y: 0 }
    const onMove = (e) => {
      const rect = el.getBoundingClientRect()
      mouse.x = ((e.clientX - rect.left) / rect.width  - 0.5) * 2
      mouse.y = ((e.clientY - rect.top)  / rect.height - 0.5) * -2
    }
    el.addEventListener('mousemove', onMove)

    // ── Animation loop ────────────────────────────────────────
    let raf
    const clock = new THREE.Clock()
    const animate = () => {
      raf = requestAnimationFrame(animate)
      const t = clock.getElapsedTime()

      particles.rotation.y = t * 0.018
      particles.rotation.x = t * 0.007

      meshes.forEach((m, i) => {
        m.rotation.x += m.userData.speed.rx
        m.rotation.y += m.userData.speed.ry
        m.position.y += Math.sin(t * 0.6 + m.userData.floatOffset) * 0.0012
      })

      // Subtle camera parallax on mouse
      cam.position.x += (mouse.x * 0.4 - cam.position.x) * 0.04
      cam.position.y += (mouse.y * 0.2 - cam.position.y) * 0.04
      cam.lookAt(scene.position)

      renderer.render(scene, cam)
    }
    animate()

    // ── Resize ────────────────────────────────────────────────
    const onResize = () => {
      const nW = el.clientWidth
      const nH = el.clientHeight
      renderer.setSize(nW, nH)
      cam.aspect = nW / nH
      cam.updateProjectionMatrix()
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
      el.removeEventListener('mousemove', onMove)
      td.forEach(x => x.dispose?.())
      renderer.dispose()
      if (renderer.domElement.parentNode === el) el.removeChild(renderer.domElement)
    }
  }, [])

  return (
    <div
      ref={mountRef}
      className={className}
      style={{ width: '100%', height: '100%', display: 'block' }}
    />
  )
}
