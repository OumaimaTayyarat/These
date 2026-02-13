import { AudioLoader, Group, LoadingManager, TextureLoader ,Scene, AnimationMixer,VideoLoader} from "three"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader"
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader"
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader"

// Model imports

import room_model_file from "url:../../public/models/untitled.glb"
import service_model_file from "url:../../public/models/service1.glb"
// import Avatar_model_file from "url:../../public/models/Avatar.glb"
// import Avatar_model_file1 from "url:../../public/animations/untitled1.fbx"
import Avatar_model_file from "url:../../public/animations/techSiana2.glb"

// Sound imports

import sounds_music_file from "url:../../public/sounds/music.mp3"


import sounds_error_1_file from "url:../../public/sounds/error-1.mp3"
import sounds_cast_1_file from "url:../../public/sounds/cast-1.mp3"
import sounds_cast_2_file from "url:../../public/sounds/cast-2.mp3"

import sounds_torch_1_file from "url:../../public/sounds/torch-1.mp3"
import sounds_torch_2_file from "url:../../public/sounds/torch-2.mp3"
import sounds_torch_3_file from "url:../../public/sounds/torch-3.mp3"


import crumble_file from "url:../../public/sounds/crumble.mp3"

import autophp from "url:../../public/sounds/autoPHP.mp4"
import autorh from "url:../../public/sounds/AUTORH.mp4"
import dashboard from "url:../../public/sounds/dashboard.mp4"
import intranet from "url:../../public/sounds/intranet.mp4"


const T0_LOAD = {
  models: [
    {id: "Avatar", file: Avatar_model_file, scale: 0.042, position: [1, -0.045, 0.190]},
        // {id: "Avatar", file: Avatar_model_file, scale: 100000, position: [0, 0, 0]},

    // { id: "room", file: room_model_file, scale: 0.004, position: [0.03, -0.26, -0.55]},
     { id: "room", file: room_model_file, scale: 0.003, position: [-0.0990, 0.050, 0.9100]},
    { id: "service", file: service_model_file, scale: 0.000000000000000000000001, position: [0.03, 0.03, 0.03] },

  ],
  sounds: [
    { id: "music", file: sounds_music_file },

    { id: "error-1", file: sounds_error_1_file },
    { id: "cast-1", file: sounds_cast_1_file },
    { id: "cast-2", file: sounds_cast_2_file },



    { id: "torch-1", file: sounds_torch_1_file },
    { id: "torch-2", file: sounds_torch_2_file },
    { id: "torch-3", file: sounds_torch_3_file },


    { id: "crumble", file: crumble_file },
  
   
  ],
  textures: [


  
  ],
  videos: [

    { id: "autophp", file: autophp },
    { id: "dashboard", file: dashboard },
    { id: "intranet", file: intranet },
    { id: "autorh", file: autorh },
  
  ],
}

class Assets {
  constructor() {
    this.loadSequence = ["loadModels", "loadSounds","loadVideos", "loadTextures"]

    this.assets = {
      models: {},
      sounds: {},
      textures: {},
      videos: {},
    }

    this.manager = new LoadingManager()

    this.loaders = {
      models: new GLTFLoader(this.manager),
      sounds: new AudioLoader(this.manager),
      textures: new TextureLoader(this.manager),
      // videos:  new VideoLoader(this.manager)
    
    }

    this.completedSteps = {
      download: false,
      audioBuffers: false,

      models: false,
    }
    this.scene = new Scene()
    this.mixer = null; 
    this.audioBufferCount = 0
    this.modelLoadCount = 0
    this.videoLoadCount=0
  
    const dracoLoader = new DRACOLoader()
    dracoLoader.setDecoderPath("https://www.gstatic.com/draco/v1/decoders/")
    this.loaders.models.setDRACOLoader(dracoLoader)

    // this.init()
  }


  checkComplete() {
    const complete = Object.keys(this.completedSteps).reduce((previous, current) =>
      !previous ? false : this.completedSteps[current]
    )
    if (complete) this.onLoadSuccess()
  }


  checkVideos() {
    if (this.videoLoadCount === T0_LOAD.videos.length) {
        this.completedSteps.videos = true;
        this.checkComplete();
    }
}   
checkBuffers() {
  if (this.audioBufferCount === T0_LOAD.sounds.length) {
    this.completedSteps.audioBuffers = true
    this.checkComplete()
  }
}
  checkModels() {
    if (this.modelLoadCount === T0_LOAD.models.length) {
      this.completedSteps.models = true
      this.checkComplete()
    }
  }

  load(onLoadSuccess, onLoadError) {
    this.onLoadSuccess = onLoadSuccess

    this.onLoadError = (err) => {
      console.error(err)
      onLoadError(err)
    }

    this.manager.onStart = (url, itemsLoaded, itemsTotal) => {
      console.log(`Started loading file: ${url} \nLoaded ${itemsLoaded} of ${itemsTotal} files.`)
    }

    this.manager.onLoad = () => {
      console.log("Loading complete! , mrehbaa bik alfunun f portfolio dyali")
      this.completedSteps.download = true
      this.checkComplete()
    }

    // this.manager.on

    
    this.manager.onProgress = (url, itemsLoaded, itemsTotal) => {
      document.body.style.setProperty("--loaded", itemsLoaded / itemsTotal)

    }

    this.manager.onError = (url) => {
  
      this.onLoadError(`error loading ${url}`)
    }

    this.loadNext()
  }

  loadNext() {
    if (this.loadSequence.length) {
      this[this.loadSequence.shift()]()
    } else {
    }
  }
loadModels() {
  T0_LOAD.models.forEach((item) => {
    // GLTFLoader gère TOUT : GLB, GLTF, et même FBX converti
    this.loaders.models.load(
      item.file, 
      (gltf) => {
        const model = gltf.scene;
        
        // Position et scale
        if (item.position) model.position.set(...item.position);
        if (item.scale) model.scale.set(item.scale, item.scale, item.scale);
        
        // Configuration des ombres
        model.traverse(c => {
          c.castShadow = true;
        });
        
        // Enregistrement du modèle
        this.assets.models[item.id] = gltf;
        
        // Gestion des animations (si le modèle en a)
 if (gltf.animations && gltf.animations.length > 0) {
  console.log("Animations trouvées:", gltf.animations);
  
  const mixer = new AnimationMixer(model);
  
  // ✅ Joue SEULEMENT la première animation
  const firstClip = gltf.animations[0];
  const action = mixer.clipAction(firstClip);
  action.play();
  
  console.log("🎬 Animation jouée:", firstClip.name);
  
  if (item.id === "Avatar") {
    this.mixer = mixer;
    console.log("Mixer de l'Avatar initialisé.");
  }
}
        
        // Ajout à la scène
        this.scene.add(model);
        
        // Incrémentation
        this.modelLoadCount++;
        this.checkModels();
      },
      (xhr) => {
        // Progression (optionnel)
        console.log(`${item.id}: ${(xhr.loaded / xhr.total * 100).toFixed(0)}% chargé`);
      },
      (error) => {
        // Gestion d'erreur
        console.error(`Erreur chargement ${item.id}:`, error);
        this.onLoadError(error);
      }
    );
  });

  this.loadNext();
}


  loadSounds() {
    T0_LOAD.sounds.forEach((item) => {
      this.assets.sounds[item.id] = null
      this.loaders.sounds.load(item.file, (buffer) => {
        this.assets.sounds[item.id] = buffer
  
        this.audioBufferCount++
        this.checkBuffers()
      })
    })
    this.loadNext()
  }

  loadTextures() {
    T0_LOAD.textures.forEach((item) => {
      this.loaders.textures.load(item.file, (texture) => {

        this.assets.textures[item.id] = texture
      })
    })

    this.loadNext()
  }
  loadVideos() {
    T0_LOAD.videos.forEach((item) => {
        this.assets.videos[item.id] = null;
        const video = document.createElement('video');
        video.src = item.file;
        video.load();
        video.addEventListener('loadeddata', () => {

            this.assets.videos[item.id] = video;

            this.videoLoadCount++;
            this.checkVideos();
        });
    });
    this.loadNext();
}

  getModel(id, deepClone) {

    const group = new Group()
    const scene = this.assets.models[id].scene.clone()

    scene.traverse((item) => {
      if (item.isMesh) {
        item.home = {
        
          position: item.position.clone(),
          rotation: item.rotation.clone(),
          scale: item.scale.clone(),
        }

        if (deepClone)  ; item.material = item.material.clone()
      }
    })

    group.add(scene)
    return { group, scene, animations: this.assets.models[id].animations }
  }


  getModel1(id, deepClone) {

    const group = new Group()
    const scene = this.scene

    const clonedMaterials = []; // Tableau pour stocker les matériaux clonés
    const animations = this.assets.models[id].animations || [];

    scene.traverse((item) => {
        if (item.isMesh) {
            item.home = {
                position: item.position.clone(),
                rotation: item.rotation.clone(),
                scale: item.scale.clone(),
            }
            // Si deepClone est vrai, clonez le matériau et stockez-le dans le tableau clonedMaterials
            if (deepClone) {
                const clonedMaterial = item.material.clone();
                clonedMaterials.push(clonedMaterial);
                item.material = clonedMaterial;
            }
        }
    });

    group.add(scene);

    // Attendre que les animations du modèle soient chargées et le mixer initialisé
    // this.loadModels();

    // Récupérer le mixer après le chargement des animations
    const mixer = this.mixer;
  

    return { group, scene, animations, mixer, clonedMaterials }; // Retourne également les matériaux clonés
}

  getTexture(id) {
    return this.assets.textures[id]
  }

  getSound(id) {
    return this.assets.sounds[id]
  }
  getVideo(id) {
   
    return this.assets.videos[id]
  }
}

const ASSETS = new Assets()

export { ASSETS }
