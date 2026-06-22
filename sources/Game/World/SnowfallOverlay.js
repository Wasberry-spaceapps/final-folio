import * as THREE from 'three/webgpu'
import { uniform } from 'three/tsl'
import { Game } from '../Game.js'

const COUNT = 100
const DURATION = 7
const FADE_DURATION = 2

export class SnowfallOverlay
{
    constructor()
    {
        this.game = Game.getInstance()
        this.elapsed = 0
        this.active = false
        this.dummy = new THREE.Object3D()
        this._tick = () => this.update()

        this.setMesh()
        this.waitForStart()
    }

    setMesh()
    {
        const geo = new THREE.IcosahedronGeometry(1, 0)

        this.opacityUniform = uniform(0.82)

        this.material = new THREE.MeshBasicNodeMaterial({ color: 0xffffff })
        this.material.transparent = true
        this.material.depthWrite = false
        this.material.alphaNode = this.opacityUniform

        this.mesh = new THREE.InstancedMesh(geo, this.material, COUNT)
        this.mesh.renderOrder = 999
        this.mesh.frustumCulled = false
        this.mesh.raycast = () => {}

        this.group = new THREE.Group()
        this.group.add(this.mesh)

        this.game.view.camera.add(this.group)

        this.flakes = []
        for(let i = 0; i < COUNT; i++)
        {
            // Camera FOV is 25° (half-angle 12.5°), tan(12.5°) ≈ 0.222
            // At z=-10: visible ±2.2 y, ±3.9 x (16:9). Scale positions accordingly.
            const depth = 5 + Math.random() * 12   // z: -5 to -17
            const halfH = depth * 0.222             // visible half-height at this depth
            const halfW = halfH * 1.78              // 16:9 aspect

            this.flakes.push({
                x: (Math.random() - 0.5) * halfW * 2.4,   // slightly wider than view for natural entry
                y: halfH * 0.3 + Math.random() * halfH * 1.8,   // start in upper portion
                z: -depth,
                speed: 0.28 + Math.random() * 0.55,
                swayAmp: 0.04 + Math.random() * 0.14,
                swayFreq: 0.35 + Math.random() * 1.1,
                swayPhase: Math.random() * Math.PI * 2,
                rotX: (Math.random() - 0.5) * 1.6,
                rotY: (Math.random() - 0.5) * 1.6,
                rotZ: (Math.random() - 0.5) * 1.6,
                angX: Math.random() * Math.PI * 2,
                angY: Math.random() * Math.PI * 2,
                angZ: Math.random() * Math.PI * 2,
                sx: 0.06 + Math.random() * 0.16,
                sy: 0.05 + Math.random() * 0.13,
                sz: 0.04 + Math.random() * 0.14,
                delay: Math.random() * 3.5,
                halfH,
                halfW,
            })

            this.dummy.scale.set(0, 0, 0)
            this.dummy.updateMatrix()
            this.mesh.setMatrixAt(i, this.dummy.matrix)
        }
        this.mesh.instanceMatrix.needsUpdate = true
    }

    waitForStart()
    {
        if(document.documentElement.classList.contains('is-started'))
        {
            this.start()
            return
        }
        const observer = new MutationObserver(() =>
        {
            if(document.documentElement.classList.contains('is-started'))
            {
                observer.disconnect()
                this.start()
            }
        })
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    }

    start()
    {
        this.active = true
        this.elapsed = 0
        this.game.ticker.events.on('tick', this._tick, 5)
    }

    update()
    {
        const delta = this.game.ticker.delta
        this.elapsed += delta

        if(this.elapsed > DURATION)
        {
            const fadeRatio = Math.max(0, 1 - (this.elapsed - DURATION) / FADE_DURATION)
            this.opacityUniform.value = 0.82 * fadeRatio
            if(fadeRatio <= 0)
            {
                this.dispose()
                return
            }
        }

        for(let i = 0; i < COUNT; i++)
        {
            const f = this.flakes[i]

            if(this.elapsed < f.delay)
            {
                this.dummy.scale.set(0, 0, 0)
                this.dummy.updateMatrix()
                this.mesh.setMatrixAt(i, this.dummy.matrix)
                continue
            }

            f.y -= f.speed * delta
            f.x += Math.sin(this.elapsed * f.swayFreq + f.swayPhase) * f.swayAmp * delta
            f.angX += f.rotX * delta
            f.angY += f.rotY * delta
            f.angZ += f.rotZ * delta

            if(f.y < -f.halfH * 1.2)
            {
                f.y = f.halfH * 0.3 + Math.random() * f.halfH * 1.5
                f.x = (Math.random() - 0.5) * f.halfW * 2.4
            }

            this.dummy.position.set(f.x, f.y, f.z)
            this.dummy.rotation.set(f.angX, f.angY, f.angZ)
            this.dummy.scale.set(f.sx, f.sy, f.sz)
            this.dummy.updateMatrix()
            this.mesh.setMatrixAt(i, this.dummy.matrix)
        }
        this.mesh.instanceMatrix.needsUpdate = true
    }

    dispose()
    {
        this.active = false
        this.game.ticker.events.off('tick', this._tick)
        this.game.view.camera.remove(this.group)
        this.mesh.geometry.dispose()
        this.material.dispose()
    }
}
