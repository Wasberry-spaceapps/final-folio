import * as THREE from 'three/webgpu'
import { color, float, Fn, instancedArray, mix, normalWorld, positionGeometry, step, texture, uniform, uv, vec2, vec3, vec4 } from 'three/tsl'
import { Inputs } from '../../Inputs/Inputs.js'
import { InteractivePoints } from '../../InteractivePoints.js'
import { Area } from './Area.js'
import gsap from 'gsap'
import { MeshDefaultMaterial } from '../../Materials/MeshDefaultMaterial.js'
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js'
import { FontLoader } from 'three/addons/loaders/FontLoader.js'
import fontData from 'three/examples/fonts/helvetiker_bold.typeface.json'

export class LandingArea extends Area
{
    constructor(model)
    {
        super(model)

        this.localTime = uniform(0)

        this.setLetters()
        this.setKiosk()
        this.setControls()
        this.setBonfire()
        this.setAchievement()
    }

    setLetters()
    {
        const references = this.references.items.get('letters')

        // Compute bounding box center and ground level from original letters
        const box = new THREE.Box3()
        for(const ref of references)
            box.expandByPoint(ref.position)
        const center = new THREE.Vector3()
        box.getCenter(center)
        let groundY = Infinity
        for(const ref of references)
            groundY = Math.min(groundY, ref.position.y)

        // Hide original "BRUNO SIMON" letters and disable their physics
        for(const reference of references)
        {
            reference.visible = false
            reference.traverse(child => { child.visible = false })
            const object = reference.userData.object
            if(object && object.physical && object.physical.body)
                object.physical.body.setEnabled(false)
        }

        // Build new "WASIU MUTAIRU" letters using TextGeometry
        const loader = new FontLoader()
        const font = loader.parse(fontData)

        const SIZE = 1.25
        const DEPTH = 0.65
        const LETTER_GAP = 0.08
        const ROW_GAP = SIZE * 1.7

        const letterMat = new MeshDefaultMaterial({
            colorNode: color(0x9393D5),
            hasWater: false,
            hasLightBounce: false
        })

        const spawnWord = (word, rowZ) =>
        {
            // Build geometry for each character and measure total width
            const chars = []
            let totalW = 0
            for(const ch of word)
            {
                const geo = new TextGeometry(ch, {
                    font,
                    size: SIZE,
                    depth: DEPTH,
                    curveSegments: 3,
                    bevelEnabled: false
                })
                geo.computeBoundingBox()
                const charW = geo.boundingBox.max.x - geo.boundingBox.min.x
                const charH = geo.boundingBox.max.y - geo.boundingBox.min.y
                const offX  = geo.boundingBox.min.x
                const offY  = geo.boundingBox.min.y
                chars.push({ geo, charW, charH, offX, offY })
                totalW += charW + LETTER_GAP
            }
            totalW -= LETTER_GAP

            // Place each letter physics object
            let xLeft = center.x - totalW / 2

            for(const { geo, charW, charH, offX, offY } of chars)
            {
                const halfW = charW / 2
                const halfH = charH / 2
                const halfD = DEPTH / 2

                // Re-centre geometry so mesh origin == physics body centre
                geo.translate(-(offX + halfW), -(offY + halfH), -halfD)

                const mesh = new THREE.Mesh(geo, letterMat)

                this.game.objects.add(
                    {
                        model: mesh,
                        updateMaterials: false,
                        castShadow: true,
                        receiveShadow: true,
                        parent: this.game.scene
                    },
                    {
                        type: 'dynamic',
                        position: new THREE.Vector3(xLeft + halfW, groundY + halfH, rowZ),
                        sleeping: true,
                        mass: 0.35,
                        friction: 0.7,
                        colliders: [{
                            shape: 'cuboid',
                            parameters: [ halfW + 0.04, halfH + 0.04, halfD + 0.04 ],
                            category: 'object'
                        }],
                        onCollision: (force, position) =>
                        {
                            this.game.audio.groups.get('hitBrick').playRandomNext(force, position)
                        }
                    }
                )

                xLeft += charW + LETTER_GAP
            }
        }

        spawnWord('WASIU',   center.z - ROW_GAP / 2)
        spawnWord('MUTAIRU', center.z + ROW_GAP / 2)
    }

    setKiosk()
    {
        // Interactive point
        const interactivePoint = this.game.interactivePoints.create(
            this.references.items.get('kioskInteractivePoint')[0].position,
            'Map',
            InteractivePoints.ALIGN_RIGHT,
            InteractivePoints.STATE_CONCEALED,
            () =>
            {
                this.game.inputs.interactiveButtons.clearItems()
                this.game.modals.open('map')
                // interactivePoint.hide()
            },
            () =>
            {
                this.game.inputs.interactiveButtons.addItems(['interact'])
            },
            () =>
            {
                this.game.inputs.interactiveButtons.removeItems(['interact'])
            },
            () =>
            {
                this.game.inputs.interactiveButtons.removeItems(['interact'])
            }
        )

        // this.game.map.items.get('map').events.on('close', () =>
        // {
        //     interactivePoint.show()
        // })
    }

    setControls()
    {
        // Interactive point
        const interactivePoint = this.game.interactivePoints.create(
            this.references.items.get('controlsInteractivePoint')[0].position,
            'Controls',
            InteractivePoints.ALIGN_RIGHT,
            InteractivePoints.STATE_CONCEALED,
            () =>
            {
                this.game.inputs.interactiveButtons.clearItems()
                this.game.menu.open('controls')
                interactivePoint.hide()
            },
            () =>
            {
                this.game.inputs.interactiveButtons.addItems(['interact'])
            },
            () =>
            {
                this.game.inputs.interactiveButtons.removeItems(['interact'])
            },
            () =>
            {
                this.game.inputs.interactiveButtons.removeItems(['interact'])
            }
        )

        // Menu instance
        const menuInstance = this.game.menu.items.get('controls')

        menuInstance.events.on('close', () =>
        {
            interactivePoint.show()
        })

        menuInstance.events.on('open', () =>
        {
            if(this.game.inputs.mode === Inputs.MODE_GAMEPAD)
                menuInstance.tabs.goTo('gamepad')
            else if(this.game.inputs.mode === Inputs.MODE_MOUSEKEYBOARD)
                menuInstance.tabs.goTo('mouse-keyboard')
            else if(this.game.inputs.mode === Inputs.MODE_TOUCH)
                menuInstance.tabs.goTo('touch')
        })
    }

    setBonfire()
    {
        const position = this.references.items.get('bonfireHashes')[0].position

        // Particles
        let particles = null
        {
            const emissiveMaterial = this.game.materials.getFromName('emissiveOrangeRadialGradient')
    
            const count = 30
            const elevation = uniform(5)
            const positions = new Float32Array(count * 3)
            const scales = new Float32Array(count)
    
    
            for(let i = 0; i < count; i++)
            {
                const i3 = i * 3
    
                const angle = Math.PI * 2 * Math.random()
                const radius = Math.pow(Math.random(), 1.5) * 1
                positions[i3 + 0] = Math.cos(angle) * radius
                positions[i3 + 1] = Math.random()
                positions[i3 + 2] = Math.sin(angle) * radius
    
                scales[i] = 0.02 + Math.random() * 0.06
            }
            
            const positionAttribute = instancedArray(positions, 'vec3').toAttribute()
            const scaleAttribute = instancedArray(scales, 'float').toAttribute()
    
            const material = new THREE.SpriteNodeMaterial()
            material.outputNode = emissiveMaterial.outputNode
    
            const progress = float(0).toVar()
    
            material.positionNode = Fn(() =>
            {
                const newPosition = positionAttribute.toVar()
                progress.assign(newPosition.y.add(this.localTime.mul(newPosition.y)).fract())
    
                newPosition.y.assign(progress.mul(elevation))
                newPosition.xz.addAssign(this.game.wind.direction.mul(progress))
    
                const progressHide = step(0.8, progress).mul(100)
                newPosition.y.addAssign(progressHide)
                
                return newPosition
            })()
            material.scaleNode = Fn(() =>
            {
                const progressScale = progress.remapClamp(0.5, 1, 1, 0)
                return scaleAttribute.mul(progressScale)
            })()
    
            const geometry = new THREE.CircleGeometry(0.5, 8)
    
            particles = new THREE.Mesh(geometry, material)
            particles.visible = false
            particles.position.copy(position)
            particles.count = count
            this.game.scene.add(particles)
        }

        // Hashes
        {
            const alphaNode = Fn(() =>
            {
                const baseUv = uv(1)
                const distanceToCenter = baseUv.sub(0.5).length()
    
                const voronoi = texture(
                    this.game.noises.voronoi,
                    baseUv
                ).g
    
                voronoi.subAssign(distanceToCenter.remap(0, 0.5, 0.3, 0))
    
                return voronoi
            })()
    
            const material = new MeshDefaultMaterial({
                colorNode: color(0x6F6A87),
                alphaNode: alphaNode,
                hasWater: false,
                hasLightBounce: false
            })
    
            const mesh = this.references.items.get('bonfireHashes')[0]
            mesh.material = material
        }

        // Burn
        const burn = this.references.items.get('bonfireBurn')[0]
        burn.visible = false

        // Interactive point
        this.game.interactivePoints.create(
            this.references.items.get('bonfireInteractivePoint')[0].position,
            'Res(e)t',
            InteractivePoints.ALIGN_RIGHT,
            InteractivePoints.STATE_CONCEALED,
            () =>
            {
                this.game.reset()

                gsap.delayedCall(2, () =>
                {
                    // Bonfire
                    particles.visible = true
                    burn.visible = true
                    this.game.ticker.wait(2, () =>
                    {
                        particles.geometry.boundingSphere.center.y = 2
                        particles.geometry.boundingSphere.radius = 2
                    })

                    // Sound
                    this.game.audio.groups.get('campfire').items[0].positions.push(position)
                })
            },
            () =>
            {
                this.game.inputs.interactiveButtons.addItems(['interact'])
            },
            () =>
            {
                this.game.inputs.interactiveButtons.removeItems(['interact'])
            },
            () =>
            {
                this.game.inputs.interactiveButtons.removeItems(['interact'])
            }
        )
    }

    setAchievement()
    {
        this.events.on('boundingIn', () =>
        {
            this.game.achievements.setProgress('areas', 'landing')
        })
        this.events.on('boundingOut', () =>
        {
            this.game.achievements.setProgress('landingLeave', 1)
        })
    }

    update()
    {
        this.localTime.value += this.game.ticker.deltaScaled * 0.1
    }
}