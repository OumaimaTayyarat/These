import { gsap } from "gsap"
import {
  AmbientLight,
  BackSide,
  Color,
  ColorManagement,
  DirectionalLight,
  Group,
  LinearSRGBColorSpace,
  Mesh,
  PerspectiveCamera,
  PlaneGeometry,
  ReinhardToneMapping,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  Vector3,
  WebGLRenderer,
} from "three"

import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js"
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js"
import { SSAOPass } from "three/examples/jsm/postprocessing/SSAOPass.js"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
import vertexShader from "../shaders/fade/vert.glsl"
import fragmentShader from "../shaders/fade/frag.glsl"

export class Stage {
  constructor(mount) {
    this.container = mount
    

    this.scene = new Scene()
    // this.scene.background = new Color("#000000")
    this.scene.background = null // ← Fond transparent pour voir le dégradé

    this.group = new Group()
    this.scene.add(this.group)
    this.paused = false

    const overlayGeometry = new PlaneGeometry(2, 2, 1, 1)
    this.overlayMaterial = new ShaderMaterial({
      transparent: true,
      vertexShader,
      fragmentShader,
      uniforms: {
        uAlpha: { value: 0 },
      },
    })
    this.overlay = new Mesh(overlayGeometry, this.overlayMaterial)
    this.scene.add(this.overlay)

    this.size = {
      width: 1,
      height: 1,
    }

    ColorManagement.enabled = true

    this.cameraPositions = {
      playing: { x: -1.160, y: 0.490, z: 0.250 },

      overhead: { x: 0, y: 2, z: 0 },
      paused: { x: -1.160, y: 0.490, z: 0.290 },
      AvatarOffset: { x: 0.410, y: 0.250, z: 0.250 },
      AvatarIntro: { x: 0.960, y: 0.000, z: 0.250 },
      service: { x: 1.430, y: 0.330, z: 0.170 },
      Avatar: { x: 1.120, y: 0.090, z: 0.800 },

      bookshelf: { x: 1.430, y: 0.330, z: 0.170 },
      OumaPortfolioLesson: { x: -1.240, y: -0.140, z: 0.720 },
      Projet3: { x: 0, y: 0.7, z: 1.3 },
      win:  { x: -1.550, y: 0.570, z: -1.320 },

    }

    this.cameraLookAts = {
  playing: { x: 0.090, y: -0.220, z: -0.140 }, 
     overhead: { x: 0.090, y: -0.220, z: -0.170 }, 
      paused: { x: 0, y: -0.12, z: 0 },
      AvatarOffset: { x: 0.960, y: -0.140, z: -0.220 },   
      AvatarIntro: { x: 0.900, y: 0.000, z: 0.160 },
      service: { x: -0.200, y: -0.100, z: -0.200 },    
      Avatar:{ x: 2.140, y: -0.140, z: -3.000 },
      bookshelf: { x: -0.200, y: -0.100, z: -0.200 }, 
OumaPortfolioLesson: { x: 3.000, y: 0.020, z: 0.330 },     
 Projet3: { x: 0, y: -0.12, z: 0 },
      win: { x: 0, y: -0.1, z: 0 },
    }

    this.defaultCameraPosition = "AvatarOffset"

    this.setupCamera()
    this.setupRenderer()
    this.setupLights()
    this.createGradientBackground() // ← Ajouté : créer le fond dégradé
    this.setupOrbitControls()
    this.onResize()
    this.render()
  }

createGradientBackground() {
  const geometry = new SphereGeometry(50, 32, 32)

  const material = new ShaderMaterial({
    side: BackSide,
    vertexShader: `
      varying vec3 vWorldPosition;
      
      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec3 vWorldPosition;
      
      void main() {
        // COULEURS TRÈS ORANGES
        vec3 topColor = vec3(0.3, 0.12, 0.0);          // Orange foncé
        vec3 middleColor = vec3(0.6, 0.25, 0.05);      // Orange vif
        vec3 bottomColor = vec3(1.0, 0.5, 0.1);  
        // Calculer la position verticale normalisée
        float h = normalize(vWorldPosition).y;
        float mixValue = (h + 1.0) * 0.5;
        
        // 80% d'orange, seulement 20% de sombre en haut
        vec3 color;
        if (mixValue > 0.8) {
          // Partie haute : seulement 20% en brun foncé
          float t = (mixValue - 0.8) / 0.2;
          color = mix(middleColor, topColor, t);
        } else {
          // Partie basse : 80% en ORANGE !
          float t = mixValue / 0.8;
          color = mix(bottomColor, middleColor, t);
        }
        
        // Grille orange TRÈS VISIBLE
        if (mixValue < 0.7) {
          float gridSize = 10.0;
          float lineWidth = 0.94;
          
          float gridX = step(lineWidth, fract(vWorldPosition.x * gridSize));
          float gridZ = step(lineWidth, fract(vWorldPosition.z * gridSize));
          float grid = max(gridX, gridZ);
          
          // Lignes orange brillantes
          vec3 gridColor = vec3(0.9, 0.4, 0.1);
          color = mix(color, gridColor, grid * 0.6 * (1.0 - mixValue));
        }
        
        gl_FragColor = vec4(color, 1.0);
      }
    `
  })

  const backgroundMesh = new Mesh(geometry, material)
  this.scene.add(backgroundMesh)
}
  setupRenderPasses() {
    this.composer = new EffectComposer(this.renderer)
    this.composer.setSize(this.size.width, this.size.height)
    this.composer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    const renderPass = new RenderPass(this.scene, this.camera)
    this.composer.addPass(renderPass)

    const ssaoPass = new SSAOPass(this.scene, this.camera, this.size.width, this.size.height)
    this.composer.addPass(ssaoPass)

    this.gui
      .add(ssaoPass, "output", {
        Default: SSAOPass.OUTPUT.Default,
        "SSAO Only": SSAOPass.OUTPUT.SSAO,
        "SSAO Only + Blur": SSAOPass.OUTPUT.Blur,
        Depth: SSAOPass.OUTPUT.Depth,
        Normal: SSAOPass.OUTPUT.Normal,
      })
      .onChange(function (value) {
        ssaoPass.output = value
      })

    this.gui.add(ssaoPass, "kernelRadius").min(0).max(32)
    this.gui.add(ssaoPass, "minDistance").min(0.001).max(0.02)
    this.gui.add(ssaoPass, "maxDistance").min(0.01).max(0.3)
    this.gui.add(ssaoPass, "enabled")
  }

  setupCamera() {
    const lookat = this.cameraLookAts[this.defaultCameraPosition]
    this.lookAt = new Vector3(lookat.x, lookat.y, lookat.z)
    this.camera = new PerspectiveCamera(35, this.size.width / this.size.height, 0.1, 3)

    this.camera.position.set(
      this.cameraPositions[this.defaultCameraPosition].x,
      this.cameraPositions[this.defaultCameraPosition].y,
      this.cameraPositions[this.defaultCameraPosition].z
    )
    this.camera.home = {
      position: { ...this.camera.position },
    }

    this.scene.add(this.camera)
  }

  reveal() {
    gsap.to(this.overlayMaterial.uniforms.uAlpha, {
      value: 0,
      duration: 2,
      onComplete: () => {
        this.overlay.visible = false
      },
    })
  }

  setupOrbitControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.enableDamping = true

    this.controls.enabled = false
  }

  moveCamera(state, cb) {
    if (this.cameraPositions[state] && this.cameraLookAts[state]) {
      gsap.killTweensOf(this.camera.position)
      gsap.killTweensOf(this.lookAt)

      gsap.to(this.camera.position, {
        ...this.cameraPositions[state],
        duration: 2,
        ease: "power2.inOut",
        onComplete: () => {
          if (cb) cb()
        },
      })
      gsap.to(this.lookAt, { ...this.cameraLookAts[state], duration: 2, ease: "power2.inOut" })
    }
  }

  resetCamera() {
    this.moveCamera(this.defaultCameraPosition)
  }

  setupRenderer() {
    this.renderer = new WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
    })

    // this.renderer.outputColorSpace = LinearSRGBColorSpace
    // this.renderer.toneMapping = ReinhardToneMapping
    // this.renderer.toneMappingExposure = 2

    this.container.appendChild(this.renderer.domElement)
  }

  setupLights() {
    this.scene.add(new AmbientLight(0xffffff, 0.1))

    const light = new DirectionalLight(0xfcc088, 0.1)
    light.position.set(0, 3, -2)
    this.scene.add(light)
  }

  onResize() {
    this.size.width = this.container.clientWidth
    this.size.height = this.container.clientHeight

    this.camera.aspect = this.size.width / this.size.height

    this.camera.updateProjectionMatrix()

    this.renderer.setSize(this.size.width, this.size.height)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    if (this.composer) {
      this.composer.setSize(this.size.width, this.size.height)
      this.composer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    }
  }

  compile() {
    this.renderer.compile(this.scene, this.camera)
  }

  render() {
    if (!this.paused || !window.DEBUG.allowLookAtMoveWhenPaused) {
      this.camera.lookAt(this.lookAt)
      this.controls.target.x = this.lookAt.x
      this.controls.target.y = this.lookAt.y
      this.controls.target.z = this.lookAt.z
    }
    this.controls.update()

    if (this.composer) this.composer.render()
    else this.renderer.render(this.scene, this.camera)
  }

  add(element) {
    this.group.add(element)
  }

  destroy() {
    this.container.removeChild(this.renderer.domElement)
    window.removeEventListener("resize", this.onResize)
  }

  get everything() {
    return this.group
  }

  set defaultCamera(state) {

    if (this.cameraPositions[state]) {
      this.defaultCameraPosition = state
      this.resetCamera()
    }
  }

  set useOrbitControls(enabled) {
    this.controls.enabled = enabled
  }
}
