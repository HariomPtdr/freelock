import { useEffect, useRef } from 'react'
import * as THREE from 'three'

export default function Hero3D() {
  const mountRef = useRef(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return
    let cleanup = () => {}
    try {

    // Use window dimensions — canvas covers full viewport
    let W = window.innerWidth
    let H = window.innerHeight

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.3
    renderer.setSize(W, H)
    renderer.domElement.style.cssText = 'width:100%;height:100%;display:block;'
    mount.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x0B0501)
    scene.fog = new THREE.FogExp2(0x0B0501, 0.018)

    const cam = new THREE.PerspectiveCamera(50, W / H, 0.1, 60)
    cam.position.z = 6.5

    const td = []

    // ── Lights ────────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0x1a0800, 3.5))
    const L1 = new THREE.PointLight(0xFF6803, 22, 18); L1.position.set(4, 3, 4);    scene.add(L1)
    const L2 = new THREE.PointLight(0xAE3A02, 16, 15); L2.position.set(-4, -2, 3);  scene.add(L2)
    const L3 = new THREE.PointLight(0xFF6803, 12, 12); L3.position.set(0, 5, 2);    scene.add(L3)
    const L4 = new THREE.PointLight(0xFF6803,  8, 10); L4.position.set(0, -5, 4);   scene.add(L4)

    // ── Grid floor ────────────────────────────────────────────
    const gridG = new THREE.PlaneGeometry(40, 40, 30, 30)
    const gridM = new THREE.MeshBasicMaterial({ color: 0x3a1400, wireframe: true, transparent: true, opacity: 0.12 })
    td.push(gridG, gridM)
    const grid = new THREE.Mesh(gridG, gridM)
    grid.rotation.x = -Math.PI / 2; grid.position.y = -4.5
    scene.add(grid)

    // ── Main: Torus Knot ──────────────────────────────────────
    const kG = new THREE.TorusKnotGeometry(1.2, 0.36, 200, 24)
    const kM = new THREE.MeshStandardMaterial({
      color: 0x3a1400, emissive: 0xFF6803, emissiveIntensity: 0.80,
      metalness: 0.95, roughness: 0.04,
    })
    td.push(kG, kM)
    const knot = new THREE.Mesh(kG, kM)
    scene.add(knot)

    // ── Wireframe shell ───────────────────────────────────────
    const wG = new THREE.TorusKnotGeometry(1.30, 0.38, 100, 14)
    const wM = new THREE.MeshBasicMaterial({ color: 0xFF6803, wireframe: true, transparent: true, opacity: 0.20 })
    td.push(wG, wM)
    const wire = new THREE.Mesh(wG, wM)
    scene.add(wire)

    // ── Glow blobs ────────────────────────────────────────────
    [[2.2, 0xFF6803, 0.08], [3.5, 0xAE3A02, 0.045], [6, 0xFF6803, 0.02]].forEach(([r, c, o]) => {
      const g = new THREE.SphereGeometry(r, 8, 8)
      const m = new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: o, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.BackSide })
      td.push(g, m); scene.add(new THREE.Mesh(g, m))
    })

    // ── Orbital rings ─────────────────────────────────────────
    const ringsData = [
      [2.5, 0.012, 0xFF6803, 0.40, Math.PI / 2.2, 0],
      [1.9, 0.008, 0xAE3A02, 0.30, -Math.PI / 3, Math.PI / 5],
      [3.2, 0.006, 0xFF6803, 0.22, Math.PI / 4, -Math.PI / 6],
      [4.0, 0.004, 0xFF6803, 0.15, Math.PI / 6, Math.PI / 3],
    ]
    const rings = ringsData.map(([r, t, c, o, rx, rz]) => {
      const g = new THREE.TorusGeometry(r, t, 4, 100)
      const m = new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: o })
      td.push(g, m)
      const mesh = new THREE.Mesh(g, m)
      mesh.rotation.x = rx; mesh.rotation.z = rz
      scene.add(mesh); return mesh
    })

    // ── Particles ─────────────────────────────────────────────
    const mkPts = (n, r0, r1, color, size, opacity) => {
      const pos = new Float32Array(n * 3)
      for (let i = 0; i < n; i++) {
        const phi = Math.acos(2 * Math.random() - 1), theta = Math.random() * Math.PI * 2
        const r = r0 + Math.random() * (r1 - r0)
        pos[i*3] = r*Math.sin(phi)*Math.cos(theta); pos[i*3+1] = r*Math.sin(phi)*Math.sin(theta); pos[i*3+2] = r*Math.cos(phi)
      }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
      const m = new THREE.PointsMaterial({ color, size, transparent: true, opacity, sizeAttenuation: true })
      td.push(g, m); const pts = new THREE.Points(g, m); scene.add(pts); return pts
    }
    const pts1 = mkPts(300, 2.0, 4.5, 0xFF6803, 0.026, 0.85)
    const pts2 = mkPts(150, 1.3, 2.0, 0xFF6803, 0.020, 0.65)
    const pts3 = mkPts( 80, 5.0, 8.0, 0xFF6803, 0.018, 0.45)

    // ── Mouse ─────────────────────────────────────────────────
    let tmx = 0, tmy = 0, mx = 0, my = 0
    const onMove = e => { tmx = (e.clientX / W - 0.5) * 2; tmy = -(e.clientY / H - 0.5) * 2 }
    window.addEventListener('mousemove', onMove)

    // ── Resize ────────────────────────────────────────────────
    const onResize = () => {
      W = window.innerWidth; H = window.innerHeight
      renderer.setSize(W, H); cam.aspect = W / H; cam.updateProjectionMatrix()
    }
    window.addEventListener('resize', onResize)

    // ── Animate ───────────────────────────────────────────────
    let t = 0, id
    const tick = () => {
      id = requestAnimationFrame(tick); t += 0.005
      mx += (tmx - mx) * 0.04; my += (tmy - my) * 0.04

      knot.rotation.y = t * 0.38; knot.rotation.x = Math.sin(t * 0.52) * 0.25
      const b = 1 + Math.sin(t * 1.1) * 0.045; knot.scale.setScalar(b)
      kM.emissiveIntensity = 0.65 + Math.sin(t * 1.4) * 0.25

      wire.rotation.y = -t * 0.22; wire.rotation.x = Math.cos(t * 0.44) * 0.22

      rings[0].rotation.z =  t * 0.15; rings[1].rotation.z = -t * 0.11
      rings[2].rotation.y =  t * 0.09; rings[3].rotation.x =  t * 0.07

      pts1.rotation.y = t * 0.068; pts1.rotation.x = t * 0.040
      pts2.rotation.y = -t * 0.055; pts3.rotation.z = t * 0.025

      grid.position.z = Math.sin(t * 0.3) * 0.6

      L1.intensity = 22 + Math.sin(t * 1.7) * 6
      L2.intensity = 16 + Math.sin(t * 1.3 + 1.0) * 4
      L3.intensity = 12 + Math.sin(t * 1.0 + 2.2) * 3
      L4.intensity =  8 + Math.sin(t * 0.8 + 3.1) * 2

      cam.position.x += (mx * 1.4 - cam.position.x) * 0.035
      cam.position.y += (my * 0.9 - cam.position.y) * 0.035
      cam.lookAt(0, 0, 0)
      renderer.render(scene, cam)
    }
    tick()

      cleanup = () => {
        cancelAnimationFrame(id)
        window.removeEventListener('mousemove', onMove)
        window.removeEventListener('resize', onResize)
        td.forEach(o => o.dispose?.())
        renderer.dispose()
        if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement)
      }
    } catch (e) { console.warn('Hero3D init failed:', e) }
    return () => cleanup()
  }, [])

  return <div ref={mountRef} style={{ position: 'absolute', inset: 0 }} />
}
