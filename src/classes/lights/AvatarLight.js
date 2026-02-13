import { Color, Group, Mesh, MeshBasicMaterial, PointLight, SphereGeometry } from "three"

export class AvatarLight {
  constructor(position, offset) {
    const color = new Color("#138838ff")
    this.position = position
    this.offset = offset
    this.group = new Group()
    this.pointLight = new PointLight(color, 6, 1)

    this.group.add(this.pointLight)
    this.group.position.set(position.x, position.y, position.z)

    if (window.DEBUG.lights) {
      const helper = new Mesh(new SphereGeometry(0.02), new MeshBasicMaterial(0xffffff))
      this.group.add(helper)
    }
  }

  get light() {
    return this.group
  }

  tick(delta, elapsedTime) {}
}
