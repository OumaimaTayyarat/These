import {
  Color,
  ConeGeometry,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  VideoTexture,
  ShaderMaterial,
  Vector3,
  LinearFilter, 
  RGBAFormat
 
} from "three"
import { ASSETS } from "./Assets"
import { gsap } from "gsap"
import { SOUNDS } from "./sounds/SoundController"
import { FragmentShader } from "../shaders/FragmentShader"
import Projet3FragmentShader from "../shaders/Projet3/frag.glsl"
import Projet3VertexShader from "../shaders/Projet3/vert.glsl"

export class Room {
  constructor() {

    this.group = new Group()
    this.group.scale.set(0.7, 0.72, 0.7)
    this.group.position.set(0, -0.03, -0.12)
    this.paused = false

    this.uniforms = []
    this.items = {
      "trapdoor-door": null,
      "door-right": null,
      "sub-floor": null,
      bookshelf: null,
    }

    this.afterCompile = null

    this.allItems = []
    this.Projet3Items = []
   
    const room = ASSETS.getModel("room")
    const video= ASSETS.getVideo("autophp")
    const video1= ASSETS.getVideo("autorh")
    const video2= ASSETS.getVideo("intranet")
    const video3= ASSETS.getVideo("dashboard")


    video.loop = true;
    video.muted = true;
    video.play();

    const texture1 = new VideoTexture(video);
    texture1.minFilter = LinearFilter;
    texture1.magFilter = LinearFilter;
    texture1.format = RGBAFormat;
    const material1 = new MeshBasicMaterial({ map: texture1 });



    
    video1.loop = true;
    video1.muted = true;
    video1.play();
    const texture2 = new VideoTexture(video1);
    texture2.minFilter = LinearFilter;
    texture2.magFilter = LinearFilter;
    texture2.format = RGBAFormat;
    const material2 = new MeshBasicMaterial({ map: texture2 });


    video2.loop = true;
    video2.muted = true;
    video2.play();
    const texture3 = new VideoTexture(video2);
    texture3.minFilter = LinearFilter;
    texture3.magFilter = LinearFilter;
    texture3.format = RGBAFormat;
    const material3 = new MeshBasicMaterial({ map: texture3 });



    video3.loop = true;
    video3.muted = true;
    video3.play();
    const texture4 = new VideoTexture(video3);
    texture4.minFilter = LinearFilter;
    texture4.magFilter = LinearFilter;
    texture4.format = RGBAFormat;
    const material4 = new MeshBasicMaterial({ map: texture4 });

    this.group.add(room.group)
    this.scene = room.scene

    this.skirt = new Mesh(new PlaneGeometry(2, 1), new MeshBasicMaterial({ color: new Color("#000000") }))
    this.skirt.position.set(0, -0.77, 0.9)
    this.group.add(this.skirt)

    const Projet3Geometry = new ConeGeometry(0.7, 1, 100, 1, true, Math.PI)
    this.Projet3Material = new ShaderMaterial({
      vertexShader: Projet3VertexShader,
      fragmentShader: FragmentShader(Projet3FragmentShader),
      side: DoubleSide,
      uniforms: {
        uTime: { value: 0 },
      },
    })

    this.Projet3 = new Mesh(Projet3Geometry, this.Projet3Material)
    this.Projet3.position.set(0, -0.77, 0.165)
    this.Projet3.rotation.x = Math.PI
    this.Projet3.visible = false
    this.group.add(this.Projet3)

    room.scene.traverse((item) => {

      
        if (item.type === "Mesh" && item.name === "Cube_tableau_0005") {
        
          item.material = material1; // Associer le matériau 1 à cet élément
        }
      if (item.type === "Mesh" && item.name === "Cube_tableau_0002") {
      
        item.material = material2; // Associer le matériau 1 à cet élément
      }

      if (item.type === "Mesh" && item.name === "Cube_tableau_0003") {
      
        item.material = material3; // Associer le matériau 1 à cet élément
      }

      if (item.type === "Mesh" && item.name === "Cube_tableau_0004") {
      
        item.material = material4; // Associer le matériau 1 à cet élément
      }


      item.frustumCulled = false

      if (this.items[item.name] !== undefined) {
        const object = item
        this.items[item.name] = {
          object,
          uniforms: {},
          originalPosition: { x: object.position.x, y: object.position.y, z: object.position.z },
          originalRotation: { x: object.rotation.x, y: object.rotation.y, z: object.rotation.z },
        }
      }


  this.allItems.push(item)

  item.home = {
    position: item.position.clone(),
    rotation: item.rotation.clone(),
    scale: item.scale.clone(),
  }

  const itemWorldPos = new Vector3()
  item.getWorldPosition(itemWorldPos)
  const distance = 0.3
  const Projet3able =
    item.name !== "sub-floor" && 
    Math.abs(itemWorldPos.x) < distance && 
    Math.abs(itemWorldPos.z) < distance

  if (Projet3able) {
    this.Projet3Items.push({
      worldPosition: itemWorldPos,
      distance: Math.abs(itemWorldPos.x) + Math.abs(itemWorldPos.z),
      item,
    })
  }

  // onBeforeCompile VIDE - texture reste intacte
  if (item.material) {
    item.material.onBeforeCompile = (shader) => {
      if (this.afterCompile) {
        this.afterCompile()
        this.afterCompile = null
      }
    }
  }
}

    )
  }

  show(amount = 1) {
    const duration = 2.5

    this.scene.visible = true

    gsap.killTweensOf(this.uniforms)
    gsap.to(this.uniforms, {
      value: amount,
      ease: "power1.in",
      duration,
    })
  }

  hide(instant = false) {

    const duration = instant ? 0 : 1.5
    gsap.killTweensOf(this.uniforms)
    gsap.to(this.uniforms, {
      value: 0.0,
      duration,
      onComplete: () => {
        this.scene.visible = false
      },
    })
  }

  showProjet3(cb) {
    const duration = 1

    this.Projet3Material.uniforms.uTime.value = 0
    this.Projet3.visible = true
    gsap.fromTo(this.Projet3.scale, { y: 0.4 }, { y: 1, duration, delay: 0.5 })
    const getRandomAngle = () => Math.random() * (Math.PI * 0.5) - Math.PI * 0.25

    SOUNDS.play("portal")
    setTimeout(() => {
      SOUNDS.play("crumble")
    }, 300)

    this.items["sub-floor"].object.visible = false
    for (let i = 0; i < this.Projet3Items.length; i++) {
      const obj = this.Projet3Items[i]
      gsap.to(obj.item.position, {
        x: "*= 1.5",
        z: "-=0.5",
        y: obj.item.name === "pedestal" ? "-=5" : "-=0",
        delay: obj.distance * 1.2,
        duration,
        ease: "power4.in",
      })

      gsap.to(obj.item.scale, {
        x: 0,
        y: 0,
        z: 0,

        delay: obj.distance * 1.5,
        duration,
        ease: "power3.in",
      })
    }

    gsap.delayedCall(duration * 2, () => {
      if (cb) cb()
    })
  }

  hideProjet3(cb) {
    const duration = 0.6
    let longestDelay = 0

    SOUNDS.play("reform")

    for (let i = 0; i < this.Projet3Items.length; i++) {
      const obj = this.Projet3Items[i]
      const delay = Math.max(0, 0.4 - obj.distance * 0.5)

      longestDelay = Math.max(longestDelay, delay)
      const values = ["position", "rotation", "scale"]
      values.forEach((type) => {
        gsap.to(obj.item[type], {
          x: obj.item.home[type].x,
          y: obj.item.home[type].y,
          z: obj.item.home[type].z,
          delay,
          duration,
          ease: "power4.out",
        })
      })
    }

    gsap.delayedCall(duration + longestDelay, () => {
      this.items["sub-floor"].object.visible = true
      this.Projet3.visible = false
      if (cb) cb()
    })
  }

  trapdoorEnter = () => {
    const tl = gsap.timeline()
    const item = this.items["trapdoor-door"]
    tl.to(item.object.rotation, { x: item.originalRotation.x - Math.PI * 0.5, ease: "power2.out", duration: 0.4 })
    tl.to(item.object.rotation, {
      onStart: () => {
        setTimeout(() => SOUNDS.play("trapdoor-close"), 300)
      },
      x: item.originalRotation.x,
      ease: "bounce",
      duration: 0.9,
    })
  }

  doorEnter = () => {
    const tl = gsap.timeline()
    const item = this.items["door-right"]
    tl.to(item.object.rotation, { z: item.originalRotation.z + Math.PI * 0.7, ease: "none", duration: 0.3 })
    tl.to(item.object.rotation, { z: item.originalRotation.z, ease: "elastic", duration: 2.5 })
  }

  add(item) {
    this.group.add(item)
  }

  pause() {
    this.paused = true
    this.skirt.visible = false
  }

  resume() {
    this.paused = false
    this.skirt.visible = true
  }

  tick(delta, elapsedTime) {
    this.Projet3Material.uniforms.uTime.value += delta

  }
}
