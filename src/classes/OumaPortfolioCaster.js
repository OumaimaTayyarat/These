import { interpret } from "xstate"
import { CasterMachine } from "../machines/caster-machine"
import { CastEmitter } from "./emitters/CastEmitter"
import { gsap } from "gsap"
import { MotionPathPlugin } from "gsap/MotionPathPlugin"
import { Color, Mesh, MeshBasicMaterial, PlaneGeometry, PointLight, Raycaster, ShaderMaterial, Vector2 } from "three"
import { SOUNDS } from "./sounds/SoundController"

import { FragmentShader } from "../shaders/FragmentShader"
import fragmentShader from "../shaders/OumaPortfolios/frag.glsl"
import vertexShader from "../shaders/OumaPortfolios/vert.glsl"
import { ASSETS } from "./Assets"
import { PARTICLE_STYLES, OumaPortfolioS } from "../consts"

gsap.registerPlugin(MotionPathPlugin)
class OumaPortfolioCaster {
  constructor(sim, container, stage, DOMElement, onOumaPortfolioSuccess, onOumaPortfolioFail) {
    this.machine = interpret(CasterMachine)
    this.state = this.machine.initialState.value

    this.sim = sim
    this.container = container
    this.stage = stage

    this.successCallback = onOumaPortfolioSuccess
    this.failCallback = onOumaPortfolioFail
    this.DOMElement = DOMElement
    this.currentTouchId = null

    this.pathElement = document.querySelector("#OumaPortfolio-path")
    this.pathPointsGroup = document.querySelector("#OumaPortfolio-points")
    this.OumaPortfoliosInfoElement = document.querySelector(".OumaPortfolios")
    this.chargingNotification = document.querySelector(".charging-notification")
    this.chargingNotificationOumaPortfolioName = this.chargingNotification.querySelector(".charging-OumaPortfolio")

    this.rechargeNotificationTimeout = null

    this.noRecharge = false

    this.OumaPortfolioStates = {
      Projet1: {
        charge: 0,
        rechargeRate: 0.25,
        svg: this.OumaPortfoliosInfoElement.querySelector("#OumaPortfolio-svg-viz-Projet1"),
        path: this.OumaPortfoliosInfoElement.querySelector("#OumaPortfolio-path-viz-Projet1"),
      },
      Projet2: {
        charge: 0,
        rechargeRate: 0.09,
        svg: this.OumaPortfoliosInfoElement.querySelector("#OumaPortfolio-svg-viz-Projet2"),
        path: this.OumaPortfoliosInfoElement.querySelector("#OumaPortfolio-path-viz-Projet2"),
      },
      Projet3: {
        charge: 0,
        rechargeRate: 0.05,
        svg: this.OumaPortfoliosInfoElement.querySelector("#OumaPortfolio-svg-viz-Projet3"),
        path: this.OumaPortfoliosInfoElement.querySelector("#OumaPortfolio-path-viz-Projet3"),
      },
    }

    this.OumaPortfolioNames = Object.keys(this.OumaPortfolioStates)
    this.allowed = this.OumaPortfolioNames

    if (window.DEBUG.casting) {
      document.querySelector("#OumaPortfolio-stats").style.display = "block"
      document.querySelector("#OumaPortfolio-helper").style.display = "block"
    }

    this.OumaPortfolioPath = []
    this.OumaPortfolios = []
    this.emitter = new CastEmitter(sim)
    this.raycaster = new Raycaster()
    this.DOMElementSize = { width: 0, height: 0 }
    this.emitPoint = { x: 0, y: 0, z: 0 }

    this.touchOffset = { x: 0, y: 0 }

    this.init()
  }

  init() {
    this.clearOumaPortfolio()
    this.machine.onTransition((s) => this.onStateChange(s))
    this.machine.start()

    this.pointLight = new PointLight(new Color("#ffffff"), 0, 1.2)
    this.pointLight.castShadow = true
    this.container.add(this.pointLight)

    this.pointLight.position.x = 0.5
    this.pointLight.position.y = 0.5
    this.pointLight.position.z = 1

    this.hitPlane = new Mesh(
      new PlaneGeometry(this.sim.size.x, this.sim.size.y),
      new MeshBasicMaterial({
        color: 0x248f24,
        alphaTest: 0,
        wireframe: true,
        visible: window.DEBUG.casting,
      })
    )
    this.hitPlane.position.set(this.sim.size.x * 0.5, this.sim.size.y * 0.5, this.sim.size.z * 0.95)

    this.OumaPortfolioPlane = new Mesh(
      new PlaneGeometry(1, 1),
      new ShaderMaterial({
        transparent: true,
        vertexShader,
        fragmentShader: FragmentShader(fragmentShader),
        uniforms: {
          uSeed: { value: Math.random() },
          uColor: { value: new Color("#E1BBFF") },
          uTime: { value: 0 },
          uProgress: { value: 0 },
          uTexture: { value: null },
        },
      })
    )
    this.OumaPortfolioPlane.position.set(this.sim.size.x * 0.5, this.sim.size.y * 0.5, this.sim.size.z * 0.93)
    this.OumaPortfolioPlane.visible = false

    this.container.add(this.hitPlane)
    this.container.add(this.OumaPortfolioPlane)

    // this.OumaPortfolioNames.forEach((OumaPortfolio) => {
    //   const length = this.OumaPortfolioStates[OumaPortfolio].path.getTotalLength()
    //   this.OumaPortfolioStates[OumaPortfolio].svg.style.setProperty("--length", length)
    // })

    this.onResize()
    this.setupOumaPortfolios()
  }

  onResize() {
    this.DOMElementSize = {
      width: this.DOMElement.clientWidth,
      height: this.DOMElement.clientHeight,
    }

    const bbox = this.DOMElement.getBoundingClientRect()
    this.touchOffset.x = bbox.left
    this.touchOffset.y = bbox.top
  }

  setupOumaPortfolios() {
    this.OumaPortfolios = [...document.querySelectorAll(".OumaPortfolio")].map((pathElement) => {
      const pathString = pathElement.getAttribute("d")
      const OumaPortfolioType = pathElement.dataset.OumaPortfolio
      const OumaPortfolioID = pathElement.id
      const group = document.querySelector(`[data-OumaPortfolio-shape="${OumaPortfolioID}"]`)

      const points = pathString.replace("M", "").split("L")
      const path = this.getEvenlySpacedPoints(
        points.map((p) => {
          const arr = p.split(" ")
          return { x: Number(arr[0]), y: Number(arr[1]) }
        })
      )

      return {
        videElement: group.querySelector(".vide"),
        groupElement: group,
        type: OumaPortfolioType,
        id: OumaPortfolioID,
        path,
        lengths: {
          x: this.getPathLengths(path, "x"),
          y: this.getPathLengths(path, "y"),
        },
      }
    })
  }

  getLength(pointA, pointB) {
    const deltaX = pointA.x - pointB.x
    const deltaY = pointA.y - pointB.y
    return Math.sqrt(deltaX * deltaX + deltaY * deltaY)
  }

  getPathLengths(path, type) {
    const lengths = []
    for (let i = 0; i < path.length; i++) {
      const point = path[i]
      lengths.push(this.getLength({ ...point, [type]: 0 }, point))
    }
    return lengths
  }

  clearOumaPortfolio() {
    this.OumaPortfolioPath = []
  }

  addOumaPortfolioPathPoint(x, y, clearBoundingBox = false) {
    this.OumaPortfolioPath.push({ x, y })

    let mouse = new Vector2()

    mouse.x = (x / this.DOMElementSize.width) * 2 - 1
    mouse.y = -(y / this.DOMElementSize.height) * 2 + 1

    this.raycaster.setFromCamera(mouse, this.stage.camera)
    var intersects = this.raycaster.intersectObject(this.hitPlane)

    if (intersects.length) {
  
      const uv = intersects[0].uv

      this.newPoint = {
        x: uv.x,
        y: uv.y,
        z: this.hitPlane.position.z,
      }

      if (clearBoundingBox){this.resetBoundingBox(this.newPoint), console.log()} 
      else this.addToBoundingBox(this.newPoint)

      this.emitter.move(this.newPoint)
      this.pointLight.position.x = this.newPoint.x * this.sim.size.x
      this.pointLight.position.y = this.newPoint.y * this.sim.size.y
      this.pointLight.position.z = this.newPoint.z * this.sim.size.z
    }
  }

  animateOumaPortfolioPlane() {
    gsap.killTweensOf(this.OumaPortfolioPlane.material.uniforms.uProgress)
    gsap.killTweensOf(this.OumaPortfolioPlane.scale)

    this.OumaPortfolioPlane.visible = true

    this.OumaPortfolioPlane.position.x = this.boundingBox.center.x * this.sim.size.x
    this.OumaPortfolioPlane.position.y = this.boundingBox.center.y * this.sim.size.y
    this.OumaPortfolioPlane.scale.x = this.boundingBox.scale.value
    this.OumaPortfolioPlane.scale.y = this.boundingBox.scale.value

    this.OumaPortfolioPlane.material.uniforms.uSeed.value = Math.random()

    const duration = 2

    gsap.fromTo(
      this.OumaPortfolioPlane.material.uniforms.uProgress,
      { value: 0 },
      { duration, value: 1, onComplete: () => (this.OumaPortfolioPlane.visible = false) }
    )

    gsap.fromTo(
      this.OumaPortfolioPlane.scale,
      { x: this.boundingBox.scale.value + 0.1, y: this.boundingBox.scale.value + 0.1 },
      { x: this.boundingBox.scale.value, y: this.boundingBox.scale.value, duration: duration * 0.9, ease: "power2.out" }
    )

    gsap.fromTo(
      this.OumaPortfolioPlane.rotation,
      { z: (Math.random() > 0.5 ? -Math.PI : Math.PI) * 0.5 },
      { z: 0, duration: duration, ease: "power2.out" }
    )
  }

  addToBoundingBox(point) {
    const { topLeft, bottomRight, center, scale } = this.boundingBox

    if (!point) point = { x: 0.5, y: 0.5 }
    if (point.x === undefined) point.x = 0.5
    if (point.y === undefined) point.y = 0.5

    topLeft.x = Math.min(topLeft.x, point.x)
    topLeft.y = Math.min(topLeft.y, point.y)
    bottomRight.x = Math.max(bottomRight.x, point.x)
    bottomRight.y = Math.max(bottomRight.y, point.y)
    center.x = topLeft.x + (bottomRight.x - topLeft.x) * 0.5
    center.y = topLeft.y + (bottomRight.y - topLeft.y) * 0.5
    scale.value =
      Math.max((bottomRight.x - topLeft.x) * this.sim.size.x, (bottomRight.y - topLeft.y) * this.sim.size.y) * 1.1

    if (scale.value < 0.2) scale.value = 0.2
    if (scale.value > 0.4) scale.value = 0.4

    this.emitPoint = { x: center.x, y: center.y, z: this.hitPlane.position.z }
  }

  resetBoundingBox(firstPoint) {

    if (!firstPoint) firstPoint = { x: 0.5, y: 0.5 }
    if (firstPoint.x === undefined) firstPoint.x = 0.5
    if (firstPoint.y === undefined) firstPoint.y = 0.5

    this.boundingBox = {
      topLeft: { x: firstPoint.x, y: firstPoint.y },
      bottomRight: { x: firstPoint.x, y: firstPoint.y },
      center: { x: firstPoint.x, y: firstPoint.y },
      scale: { value: 0.25 },
    }
  
  }

  setDownListeners(type) {
    this.DOMElement[type + "EventListener"]("mousedown", this.onMouseDown)
    this.DOMElement[type + "EventListener"]("touchstart", this.onTouchStart)
  }

  setMoveListeners(type) {
    this.DOMElement[type + "EventListener"]("mousemove", this.onMouseMove)
    this.DOMElement[type + "EventListener"]("touchmove", this.onTouchMove)
  }

  setUpListeners(type) {
    this.DOMElement[type + "EventListener"]("mouseup", this.onMouseUp)
    this.DOMElement[type + "EventListener"]("touchend", this.onTouchEndOrCancel)
    this.DOMElement[type + "EventListener"]("touchcancel", this.onTouchEndOrCancel)
  }

  onStateChange = (state) => {
    this.lastState = this.state
    this.state = state.value

    if (state.changed || this.state === "IDLE") {
      switch (this.state) {
        case "IDLE":
          this.machine.send("ready")
          break
        case "ACTIVE":
          this.clearOumaPortfolio()
          this.setDownListeners("add")
          break
        case "SUCCESS":
          this.successCallback(this.castOumaPortfolio.type)
          this.machine.send("complete")
          break
        case "FAIL":
          this.failCallback()
          this.machine.send("complete")
          break
        case "CASTING":
          this.castOumaPortfolio = null
          this.clearInput()

          this.setDownListeners("remove")
          this.setMoveListeners("add")
          this.setUpListeners("add")

          break
        case "PROCESSING":
          this.setMoveListeners("remove")
          this.setUpListeners("remove")
          this.proccessPath()
          break
        case "INACTIVE":
          this.setDownListeners("remove")
          this.setMoveListeners("remove")
          this.setUpListeners("remove")
          this.castOumaPortfolio = null
          this.clearInput()
          if (this.lastState === "CASTING") {
            this.clearOumaPortfolio()
            this.onCastFail()
          }
      }
    }
  }

  drawInputPath() {
    if (window.DEBUG.casting) {
      this.pathElement.setAttribute(
        "d",
        `M${this.OumaPortfolioPath[0].x} ${this.OumaPortfolioPath[0].y}L${this.OumaPortfolioPath
          .map((point) => `${point.x} ${point.y}`)
          .join("L")}`
      )
    }
  }

  clearInput() {
    if (window.DEBUG.casting) {
      this.pathElement.setAttribute("d", "")
      this.pathPointsGroup.innerHTML = ""
    }
  }

  drawInputPoints(points) {
    if (window.DEBUG.casting) {
      points.forEach((point) => {
        var circle = document.createElementNS("http://www.w3.org/2000/svg", "circle")
        circle.setAttributeNS(null, "cx", point.x)
        circle.setAttributeNS(null, "cy", point.y)
        circle.setAttributeNS(null, "r", 2)
        this.pathPointsGroup.appendChild(circle)
      })
    }
  }

  proccessPath() {
    this.drawInputPath()
    const points = this.getEvenlySpacedPoints(this.OumaPortfolioPath)

    this.drawInputPoints(points)

    const checks = {
      x: this.getPathLengths(points, "x"),
      y: this.getPathLengths(points, "y"),
    }

    const results = this.OumaPortfolios.map((OumaPortfolio, i) => {
      const result = {
        x: this.getCorrelation(checks.x, OumaPortfolio.lengths.x),
        y: this.getCorrelation(checks.y, OumaPortfolio.lengths.y),
      }

      const vide = (result.x + result.y) / 2

      return { type: OumaPortfolio.type, OumaPortfolio, vide, index: i, result }
    })

    const utilisateur = results.reduce(
      (currentutilisateur, contender) => {

        if (contender.vide > currentutilisateur.vide) {
          return contender;
        } else {
          return currentutilisateur;
        }
      },
      { vide: -Infinity, type: null, index: -1 }
    );
    utilisateur.type="Projet1"


    if (utilisateur) {
       utilisateur.type = "Projet1"
      // if ((this.OumaPortfolioStates[utilisateur.type].charge === 1 || this.noRecharge) && this.allowed.includes(utilisateur.type)) {
        this.onCastSuccess(utilisateur)
      // } else {
      //   this.onInsufficientPower(utilisateur)
      // }
    } else this.onCastFail()

    this.outputResults(results, utilisateur)

    this.emitter.reset()
  }

  getOumaPortfolioColor(type) {
    switch (type) {
      case "Projet1":
        return { r: 0.2, g: 0, b: 1 }
      case "Projet2":
        return { r: 1, g: 0.8, b: 0 }
      case "Projet3":
      default:
        return { r: 0, g: 1, b: 0 }
    }
  }

  onCastSuccess(OumaPortfolio) {
    this.castOumaPortfolio = OumaPortfolio
    this.OumaPortfolioStates[OumaPortfolio.type].charge = this.noRecharge ? 1 : 0
    this.machine.send("success")

    SOUNDS.play("cast")

    this.sim.castParticles.forEach((index) => {
      const point = {
        index,
        life: 0.5,
        ...this.sim.getVectorFromArray(this.sim.getParticlesProperties("magic", "position"), index),
      }

      const newPointType = Math.random() > 0.5 ? PARTICLE_STYLES.circle : PARTICLE_STYLES.point
      const spark = newPointType === PARTICLE_STYLES.point
      setTimeout(
        () => (this.sim.getParticlesProperties("magic", "type")[index] = newPointType),
        Math.random() * (spark ? 10 : 100)
      )

      this.sim.updateArrayFromVector(
        this.sim.getParticlesProperties("magic", "color"),
        index,
        spark ? { r: 1, g: 1, b: 1 } : this.getOumaPortfolioColor(OumaPortfolio.type)
      )

      gsap.to(point, {
        motionPath: [
          {
            x: this.emitPoint.x,
            y: point.y,
            z: 0.9,
          },
          {
            x: this.emitPoint.x + Math.random() * 0.1 - 0.05,
            y: point.y + Math.random() * 0.1 - 0.05,
            z: 0.9,
          },
          !spark
            ? this.emitPoint
            : {
                x: this.emitPoint.x + Math.random() * 0.4 - 0.2,
                y: point.y + Math.random() * 0.4 - 0.2,
                z: 0.9 - Math.random() * 0.2,
              },
        ],
        ease: !spark ? "power4.in" : "power1.out",
        duration: (spark ? 2 : 0.9) + Math.random() * 0.05,
        life: spark ? 0 : 0.3,
        onUpdateParams: [point],
        onUpdate: (d) => {
          this.sim.getParticlesProperties("magic", "life")[d.index] = d.life
          this.sim.updateArrayFromVector(this.sim.getParticlesProperties("magic", "position"), d.index, {
            x: d.x,
            y: d.y,
            z: d.z,
          })
        },
        onCompleteParams: [point],
        onComplete: (d) => {
          this.sim.getParticlesProperties("magic", "life")[d.index] = 0
        },
      })
    })
    this.sim.castParticles = []
  }

  onInsufficientPower(OumaPortfolio) {
    this.machine.send("fail")

    this.castOumaPortfolio = OumaPortfolio
    const newPointType = PARTICLE_STYLES.circle

    this.sim.castParticles.forEach((index) => {
      this.sim.updateArrayFromVector(this.sim.getParticlesProperties("magic", "color"), index, { r: 1, g: 0, b: 0 })
    })

    setTimeout(() => {
      while (this.sim.castParticles.length) {
        const particleIndex = this.sim.castParticles.shift()
        this.sim.getParticlesProperties("magic", "lifeDecay")[particleIndex] = 0.4
        this.sim.getParticlesProperties("magic", "force")[particleIndex] = 0
        this.sim.getParticlesProperties("magic", "forceDecay")[particleIndex] = 0.2
      }
    }, 500)

    if (this.rechargeNotificationTimeout) clearTimeout(this.rechargeNotificationTimeout)

    this.rechargeNotificationTimeout = setTimeout(() => {
      this.chargingNotification.classList.remove("show")
    }, 2000)

    this.chargingNotificationOumaPortfolioName.innerText = OumaPortfolioS[OumaPortfolio.type]
    this.chargingNotification.classList.add("show")
  }

  onCastFail() {
    this.castOumaPortfolio = null
    this.machine.send("fail")

    SOUNDS.play("OumaPortfolio-failed")

    while (this.sim.castParticles.length) {
      const particleIndex = this.sim.castParticles.shift()
      this.sim.getParticlesProperties("magic", "lifeDecay")[particleIndex] = 0.4
      this.sim.getParticlesProperties("magic", "force")[particleIndex] = 0
      this.sim.getParticlesProperties("magic", "forceDecay")[particleIndex] = 0.2

      const point = {
        index: particleIndex,
        speed: 0.015,
      }

      gsap.to(point, {
        speed: 0.15,
        ease: "power2.in",
        duration: 0.3,

        onUpdateParams: [point],
        onUpdate: (d) => {
          this.sim.getParticlesProperties("magic", "speed")[d.index] = d.speed
        },
      })
    }
  }

  outputResults(results, utilisateur) {
    if (window.DEBUG.casting) {
      this.OumaPortfolios.forEach((OumaPortfolio, i) => {
        OumaPortfolio.groupElement.classList[i === utilisateur.index ? "add" : "remove"]("cast")
      })

      results.forEach((result) => {
        result.OumaPortfolio.videElement.innerText = result.vide
    
      })
    }
  }

  getCorrelation(x, y) {
    var shortestArrayLength = 0
    if (x.length == y.length) {
      shortestArrayLength = x.length
    } else if (x.length > y.length) {
      shortestArrayLength = y.length
    } else {
      shortestArrayLength = x.length
    }

    var xy = []
    var x2 = []
    var y2 = []

    for (var i = 0; i < shortestArrayLength; i++) {
      xy.push(x[i] * y[i])
      x2.push(x[i] * x[i])
      y2.push(y[i] * y[i])
    }

    var sum_x = 0
    var sum_y = 0
    var sum_xy = 0
    var sum_x2 = 0
    var sum_y2 = 0

    for (var i = 0; i < shortestArrayLength; i++) {
      sum_x += x[i]
      sum_y += y[i]
      sum_xy += xy[i]
      sum_x2 += x2[i]
      sum_y2 += y2[i]
    }

    var step1 = shortestArrayLength * sum_xy - sum_x * sum_y
    var step2 = shortestArrayLength * sum_x2 - sum_x * sum_x
    var step3 = shortestArrayLength * sum_y2 - sum_y * sum_y
    var step4 = Math.sqrt(step2 * step3)
    var answer = step1 / step4

    return answer
  }

  getEvenlySpacedPoints(path, numPoints = 100) {
    const totalLength = path.reduce((length, point, index) => {
      if (index > 0) {
        const prevPoint = path[index - 1]
        const deltaX = point.x - prevPoint.x
        const deltaY = point.y - prevPoint.y
        length += Math.sqrt(deltaX * deltaX + deltaY * deltaY)
      }
      return length
    }, 0)

    const segmentLength = totalLength / (numPoints - 1)
    let currentLength = 0
    let currentPointIndex = 0
    const evenlySpacedPoints = [path[0]]
    let lastPoint = null

    for (let i = 1; i < numPoints - 1; i++) {
      const targetLength = i * segmentLength

      while (currentLength < targetLength) {
        const startPoint = lastPoint ? lastPoint : path[currentPointIndex]
        const endPoint = path[currentPointIndex + 1]
        const deltaX = endPoint.x - startPoint.x
        const deltaY = endPoint.y - startPoint.y
        const segmentLength = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

        if (currentLength + segmentLength >= targetLength) {
          const t = (targetLength - currentLength) / segmentLength
          lastPoint = {
            x: startPoint.x + t * deltaX,
            y: startPoint.y + t * deltaY,
          }

          evenlySpacedPoints.push(lastPoint)
          currentLength = targetLength
        } else {
          currentLength += segmentLength
          lastPoint = null
          currentPointIndex++
        }
      }
    }

    evenlySpacedPoints.push(path[path.length - 1])

    return evenlySpacedPoints
  }

  activate(limit) {
    this.allowed = limit ? [limit] : this.OumaPortfolioNames
    this.machine.send("activate")
  }

  deactivate() {
    this.machine.send("deactivate")
  }

  getXYFromTouch = (event) => {
    const touches = event.changedTouches

    for (let i = 0; i < touches.length; i++) {
      const touch = touches[i]
      if (!this.currentTouchId || this.currentTouchId === touch.identifier) {
        this.currentTouchId = touch.identifier
        return { x: touch.clientX - this.touchOffset.x, y: touch.clientY - this.touchOffset.y }
      }
    }
  }

  onTouchStart = (event) => {
    const touchPoint = this.getXYFromTouch(event)
    this.onOumaPortfolioStart(touchPoint.x, touchPoint.y)
  }

  onMouseDown = (event) => {
    this.onOumaPortfolioStart(event.offsetX, event.offsetY)
  }

  onOumaPortfolioStart = (x, y) => {
    gsap.killTweensOf(this.pointLight)
    this.pointLight.intensity = 0.6
    this.machine.send("start_cast")
    this.addOumaPortfolioPathPoint(x, y, true)
  }

  onTouchMove = (event) => {
    const touchPoint = this.getXYFromTouch(event)
    this.onOumaPortfolioMove(touchPoint.x, touchPoint.y)
  }

  onMouseMove = (event) => {
    this.onOumaPortfolioMove(event.offsetX, event.offsetY)
  }

  onOumaPortfolioMove = (x, y) => {
    this.addOumaPortfolioPathPoint(x, y)
    this.drawInputPath()
  }

  onTouchEndOrCancel = (event) => {
    const touchPoint = this.getXYFromTouch(event)
    this.currentTouchId = null
    this.onOumaPortfolioEnd(touchPoint.x, touchPoint.y)
  }

  onMouseUp = (event) => {
    this.onOumaPortfolioEnd(event.offsetX, event.offsetY)
  }

  onOumaPortfolioEnd = (x, y) => {
    gsap.to(this.pointLight, { intensity: 0 })
    this.addOumaPortfolioPathPoint(x, y)
    this.machine.send("finished")
  }

  reset(disableCharging = false) {
    this.OumaPortfolioNames.forEach((OumaPortfolio) => {
      this.OumaPortfolioStates[OumaPortfolio].charge = disableCharging ? 1 : 0
    })
    this.noRecharge = disableCharging ? true : false
    this.updateViz()
  }

  updateViz() {
    this.OumaPortfolioNames.forEach((OumaPortfolio) => {
      this.OumaPortfolioStates[OumaPortfolio].svg.style.setProperty("--charge", this.OumaPortfolioStates[OumaPortfolio].charge)
      this.OumaPortfolioStates[OumaPortfolio].svg.classList[this.OumaPortfolioStates[OumaPortfolio].charge === 1 ? "add" : "remove"]("ready")
    })
  }

  tick(delta) {
    if (this.state !== "IDLE" && !this.noRecharge) {
      this.OumaPortfolioNames.forEach((OumaPortfolio) => {
        const state = this.OumaPortfolioStates[OumaPortfolio]

        if (state.charge < 1) state.charge += state.rechargeRate * delta
        if (state.charge > 1) state.charge = 1

        this.updateViz()
      })
    }
  }
}

export { OumaPortfolioCaster }
