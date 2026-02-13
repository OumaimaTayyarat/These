import { GUI } from 'lil-gui';
import { PointLight, DirectionalLight, SpotLight, PointLightHelper, DirectionalLightHelper, SpotLightHelper } from 'three';

class LightPositionHelper {
  constructor(scene) {
    this.scene = scene;
    this.gui = new GUI();
    this.lights = [];
    this.helpers = [];
    this.currentLightFolder = null;

    // Style du GUI
    this.gui.domElement.style.position = 'absolute';
    this.gui.domElement.style.top = '10px';
    this.gui.domElement.style.left = '10px'; // À gauche pour ne pas chevaucher l'autre GUI

    this.createInfoPanel();
    this.createLightCreator();
    this.scanExistingLights();
  }

  createInfoPanel() {
    const info = this.gui.addFolder('💡 LIGHT HELPER');
    info.add({ text: 'Créez et ajustez vos lumières' }, 'text').name('').disable();
    info.open();
  }

  scanExistingLights() {
    // Chercher toutes les lumières déjà dans la scène
    this.scene.traverse((object) => {
      if (object instanceof PointLight || object instanceof DirectionalLight || object instanceof SpotLight) {
        // Ignorer les lumières helper
        if (!object.isHelper) {
          this.addLight(object, object.name || 'ExistingLight');
        }
      }
    });

    if (this.lights.length > 0) {
      console.log(`✅ ${this.lights.length} lumière(s) existante(s) détectée(s)`);
    }
  }

  createLightCreator() {
    const creator = this.gui.addFolder('➕ CRÉER LUMIÈRE');

    // Boutons pour créer différents types de lumières
    creator.add({
      createPointLight: () => {
        const light = new PointLight(0xffffff, 1, 10);
        light.position.set(0, 1, 0);
        this.scene.add(light);
        this.addLight(light, `PointLight_${this.lights.length + 1}`);
      }
    }, 'createPointLight').name('🔆 Point Light');

    creator.add({
      createDirectionalLight: () => {
        const light = new DirectionalLight(0xffffff, 1);
        light.position.set(0, 3, 0);
        light.target.position.set(0, 0, 0);
        this.scene.add(light);
        this.scene.add(light.target);
        this.addLight(light, `DirectionalLight_${this.lights.length + 1}`);
      }
    }, 'createDirectionalLight').name('☀️ Directional Light');

    creator.add({
      createSpotLight: () => {
        const light = new SpotLight(0xffffff, 1, 10, Math.PI / 4, 0.5, 2);
        light.position.set(0, 2, 0);
        light.target.position.set(0, 0, 0);
        this.scene.add(light);
        this.scene.add(light.target);
        this.addLight(light, `SpotLight_${this.lights.length + 1}`);
      }
    }, 'createSpotLight').name('🔦 Spot Light');

    creator.open();
  }

  addLight(light, name) {
    // Créer un helper visuel
    let helper;
    if (light instanceof PointLight) {
      helper = new PointLightHelper(light, 0.1);
    } else if (light instanceof DirectionalLight) {
      helper = new DirectionalLightHelper(light, 0.5);
    } else if (light instanceof SpotLight) {
      helper = new SpotLightHelper(light);
    }
    
    if (helper) {
      this.scene.add(helper);
      this.helpers.push(helper);
    }

    const lightData = { light, name, helper };
    this.lights.push(lightData);

    // Créer le contrôle dans le GUI
    this.createLightControl(lightData);
  }

  createLightControl(lightData) {
    const { light, name } = lightData;
    
    const lightFolder = this.gui.addFolder(`💡 ${name}`);

    // Position
    const posFolder = lightFolder.addFolder('📍 Position');
    posFolder.add(light.position, 'x', -10, 10, 0.1).name('X').onChange(() => {
      this.updateHelper(lightData);
      this.logValues(lightData);
    });
    posFolder.add(light.position, 'y', -10, 10, 0.1).name('Y').onChange(() => {
      this.updateHelper(lightData);
      this.logValues(lightData);
    });
    posFolder.add(light.position, 'z', -10, 10, 0.1).name('Z').onChange(() => {
      this.updateHelper(lightData);
      this.logValues(lightData);
    });

    // Couleur
    const colorController = {
      color: `#${light.color.getHexString()}`
    };
    lightFolder.addColor(colorController, 'color').name('🎨 Couleur').onChange((value) => {
      light.color.set(value);
      this.updateHelper(lightData);
      this.logValues(lightData);
    });

    // Intensité
    lightFolder.add(light, 'intensity', 0, 5, 0.1).name('💪 Intensité').onChange(() => {
      this.logValues(lightData);
    });

    // Paramètres spécifiques selon le type de lumière
    if (light instanceof PointLight || light instanceof SpotLight) {
      lightFolder.add(light, 'distance', 0, 50, 0.5).name('📏 Distance').onChange(() => {
        this.updateHelper(lightData);
        this.logValues(lightData);
      });
      lightFolder.add(light, 'decay', 0, 5, 0.1).name('📉 Decay');
    }

    if (light instanceof SpotLight) {
      lightFolder.add(light, 'angle', 0, Math.PI / 2, 0.01).name('🔺 Angle').onChange(() => {
        this.updateHelper(lightData);
      });
      lightFolder.add(light, 'penumbra', 0, 1, 0.01).name('🌫️ Penumbra').onChange(() => {
        this.updateHelper(lightData);
      });

      // Target pour SpotLight et DirectionalLight
      const targetFolder = lightFolder.addFolder('🎯 Target');
      targetFolder.add(light.target.position, 'x', -10, 10, 0.1).name('X').onChange(() => {
        this.updateHelper(lightData);
        this.logValues(lightData);
      });
      targetFolder.add(light.target.position, 'y', -10, 10, 0.1).name('Y').onChange(() => {
        this.updateHelper(lightData);
        this.logValues(lightData);
      });
      targetFolder.add(light.target.position, 'z', -10, 10, 0.1).name('Z').onChange(() => {
        this.updateHelper(lightData);
        this.logValues(lightData);
      });
    }

    if (light instanceof DirectionalLight && light.target) {
      const targetFolder = lightFolder.addFolder('🎯 Target');
      targetFolder.add(light.target.position, 'x', -10, 10, 0.1).name('X').onChange(() => {
        this.updateHelper(lightData);
        this.logValues(lightData);
      });
      targetFolder.add(light.target.position, 'y', -10, 10, 0.1).name('Y').onChange(() => {
        this.updateHelper(lightData);
        this.logValues(lightData);
      });
      targetFolder.add(light.target.position, 'z', -10, 10, 0.1).name('Z').onChange(() => {
        this.updateHelper(lightData);
        this.logValues(lightData);
      });
    }

    // Boutons d'action
    lightFolder.add({
      copy: () => this.copyToClipboard(lightData)
    }, 'copy').name('📋 COPIER CODE');

    lightFolder.add({
      toggleHelper: () => {
        if (lightData.helper) {
          lightData.helper.visible = !lightData.helper.visible;
        }
      }
    }, 'toggleHelper').name('👁️ Toggle Helper');

    lightFolder.add({
      delete: () => this.deleteLight(lightData, lightFolder)
    }, 'delete').name('🗑️ Supprimer');

    this.logValues(lightData);
  }

  updateHelper(lightData) {
    if (lightData.helper && lightData.helper.update) {
      lightData.helper.update();
    }
  }

  deleteLight(lightData, folder) {
    // Retirer de la scène
    this.scene.remove(lightData.light);
    if (lightData.helper) {
      this.scene.remove(lightData.helper);
    }
    if (lightData.light.target) {
      this.scene.remove(lightData.light.target);
    }

    // Retirer du tableau
    const index = this.lights.indexOf(lightData);
    if (index > -1) {
      this.lights.splice(index, 1);
    }

    // Retirer le dossier GUI
    this.gui.removeFolder(folder);

    console.log(`🗑️ Lumière "${lightData.name}" supprimée`);
  }

  logValues(lightData) {
    const { light, name } = lightData;
    console.clear();
    console.log(`%c💡 ${name} - Valeurs actuelles:`, 'color: #ffff00; font-size: 16px; font-weight: bold');
    console.log(`%cPosition: (${light.position.x.toFixed(2)}, ${light.position.y.toFixed(2)}, ${light.position.z.toFixed(2)})`, 'color: #ffaa00');
    console.log(`%cCouleur: #${light.color.getHexString()}`, 'color: #00aaff');
    console.log(`%cIntensité: ${light.intensity.toFixed(2)}`, 'color: #ff00ff');
    
    if (light.distance !== undefined) {
      console.log(`%cDistance: ${light.distance.toFixed(2)}`, 'color: #00ff00');
    }
    
    if (light.target) {
      console.log(`%cTarget: (${light.target.position.x.toFixed(2)}, ${light.target.position.y.toFixed(2)}, ${light.target.position.z.toFixed(2)})`, 'color: #ff8800');
    }
    
    console.log('\n📋 Code Three.js:');
    console.log(this.generateCode(lightData));
  }

  generateCode(lightData) {
    const { light, name } = lightData;
    let code = '';

    if (light instanceof PointLight) {
      code = `const ${name} = new PointLight(0x${light.color.getHexString()}, ${light.intensity.toFixed(2)}, ${light.distance.toFixed(2)});
${name}.position.set(${light.position.x.toFixed(2)}, ${light.position.y.toFixed(2)}, ${light.position.z.toFixed(2)});
scene.add(${name});`;
    } else if (light instanceof DirectionalLight) {
      code = `const ${name} = new DirectionalLight(0x${light.color.getHexString()}, ${light.intensity.toFixed(2)});
${name}.position.set(${light.position.x.toFixed(2)}, ${light.position.y.toFixed(2)}, ${light.position.z.toFixed(2)});`;
      if (light.target) {
        code += `
${name}.target.position.set(${light.target.position.x.toFixed(2)}, ${light.target.position.y.toFixed(2)}, ${light.target.position.z.toFixed(2)});
scene.add(${name});
scene.add(${name}.target);`;
      }
    } else if (light instanceof SpotLight) {
      code = `const ${name} = new SpotLight(0x${light.color.getHexString()}, ${light.intensity.toFixed(2)}, ${light.distance.toFixed(2)}, ${light.angle.toFixed(2)}, ${light.penumbra.toFixed(2)}, ${light.decay.toFixed(2)});
${name}.position.set(${light.position.x.toFixed(2)}, ${light.position.y.toFixed(2)}, ${light.position.z.toFixed(2)});`;
      if (light.target) {
        code += `
${name}.target.position.set(${light.target.position.x.toFixed(2)}, ${light.target.position.y.toFixed(2)}, ${light.target.position.z.toFixed(2)});
scene.add(${name});
scene.add(${name}.target);`;
      }
    }

    return code;
  }

  copyToClipboard(lightData) {
    const code = this.generateCode(lightData);
    navigator.clipboard.writeText(code).then(() => {
      alert('✅ Code copié dans le presse-papier !');
      console.log('%c✅ CODE COPIÉ !', 'color: #00ff00; font-size: 20px; font-weight: bold');
      console.log(code);
    });
  }

  destroy() {
    // Nettoyer les helpers
    this.helpers.forEach(helper => {
      this.scene.remove(helper);
    });
    this.gui.destroy();
  }
}

export { LightPositionHelper };