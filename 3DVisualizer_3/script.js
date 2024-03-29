class Loader {
  constructor() {
    this.callback = null;
  }

  load(file) {

    const request = new XMLHttpRequest();

    request.open('GET', file, true);
    request.onprogress = evt => {
      let percent = Math.floor(evt.loaded / evt.total * 100);

      this.callback(percent);
    };

    request.onload = () => {this.complete(file);};
    request.send();
  }

  progress(callback) {this.callback = callback;}

  complete() {}}



class App {
  constructor() {

    this.loader = new Loader();
    this.loader.progress(percent => {
      this.progress(percent);
    });

    this.playIntro = document.querySelector('.play-intro');
    this.loaderBar = document.querySelector('.loader');

    this.loader.load('https://christinecheng1013.github.io/2Dvisualizer/3DVisualizer_1/acid-sounds.mp3');
    this.loader.complete = this.complete.bind(this);

    this.playing = false;
  }

  progress(percent) {
    this.loaderBar.style.transform = 'scale(' + percent / 100 + ', 1)';

    if (percent === 100) {
      setTimeout(() => {
        requestAnimationFrame(() => {
          this.playIntro.classList.add('control-show');
          this.loaderBar.classList.add('removeLoader');
          this.loaderBar.style.transform = 'scale(1, 0)';
        });
      }, 300);
    }
  }

  addSoundControls() {
    this.btnPlay = document.querySelector('.play');
    this.btnPause = document.querySelector('.pause');

    this.btnPlay.addEventListener('click', () => {
      this.play();
    });

    this.btnPause.addEventListener('click', () => {
      this.pause();
    });
  }

  play() {
    this.audioCtx.resume();
    this.audioElement.play();
    this.btnPlay.classList.remove('control-show');
    this.btnPause.classList.add('control-show');
  }

  pause() {
    this.audioElement.pause();
    this.btnPause.classList.remove('control-show');
    this.btnPlay.classList.add('control-show');
  }

  complete(file) {
    setTimeout(() => {
      this.spheres = [];
      this.setupAudio();
      this.createScene();
      this.addAmbientLight();
      this.addHemisphereLight();
      this.addDirectionalLight();
      this.addSpotLight();
      this.addSoundControls();
      this.sphereGroup = new THREE.Object3D();
      this.scene.add(this.sphereGroup);

      this.addFloor();
      this.addGrid();
      this.positionSpheres();

      this.animate();
      this.playSound(file);
    }, 200);
  }

  createScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xffffff);
    this.camera = new THREE.PerspectiveCamera(25, window.innerWidth / window.innerHeight, .1, 1000);
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.gammaInput = true;
    this.renderer.gammaOutput = true;

    document.body.appendChild(this.renderer.domElement);

    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enablePan = true;
    this.camera.position.z = 35;
    this.camera.position.y = 0;

    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.04;

    document.body.style.cursor = "-moz-grabg";
    document.body.style.cursor = "-webkit-grab";

    this.controls.addEventListener("start", () => {
      requestAnimationFrame(() => {
        document.body.style.cursor = "-moz-grabbing";
        document.body.style.cursor = "-webkit-grabbing";
      });
    });

    this.controls.addEventListener("end", () => {
      requestAnimationFrame(() => {
        document.body.style.cursor = "-moz-grab";
        document.body.style.cursor = "-webkit-grab";
      });
    });

    this.scene.rotateX(.8);
    this.scene.rotateY(.8);
  }

  createSphere(geometry, material) {
    const sphere = new THREE.Mesh(geometry, material);

    sphere.position.y = .5;
    sphere.castShadow = true;
    sphere.receiveShadow = true;

    return sphere;
  }

  addDirectionalLight() {
    this.light = new THREE.DirectionalLight(0x000000, 100);
    this.light.position.set(0, 1000, 10);
    this.scene.add(this.light);
  }

  addAmbientLight() {
    const light = new THREE.AmbientLight(0xffffff, 0);
    this.scene.add(light);
  }

  addHemisphereLight() {
    const light = new THREE.HemisphereLight(0xffffff, 0x0, .5);

    this.scene.add(light);
  }

  addSpotLight() {
    const spotLight = new THREE.SpotLight(0xffffff, .5);

    spotLight.position.set(0, 50, 20);
    spotLight.castShadow = true;
    spotLight.shadow.mapSize.width = 8000;
    spotLight.shadow.mapSize.height = spotLight.shadow.mapSize.width;

    this.scene.add(spotLight);
  }


  animate() {
    this.renderer.render(this.scene, this.camera);

    this.controls.update();

    this.drawWave();

    requestAnimationFrame(this.animate.bind(this));
  }

  addGrid() {
    const size = 70;
    const divisions = 70;

    const gridHelper = new THREE.GridHelper(size, divisions);
    gridHelper.position.set(0, 0, 0);
    gridHelper.material.opacity = .6;
    gridHelper.material.transparent = true;
    this.scene.add(gridHelper);
  }

  radians(degrees) {
    return degrees * Math.PI / 180;
  }

  positionSpheres() {
    const width = 8;
    const geometry = new THREE.SphereGeometry(.3, 32, 32);
    const material = new THREE.MeshPhongMaterial({
      color: 0x4b12b3,
      specular: 0x4b12b3,
      shininess: 100,
      emissive: 0x0,
      side: THREE.DoubleSide });



    for (let i = 0; i < width; i++) {
      for (let j = 0; j < width; j++) {
        let sphere = this.createSphere(geometry, material);

        this.sphereGroup.add(sphere);

        sphere.position.x = i;
        sphere.position.z = j;

        this.spheres.push(sphere);
      }
    }
    this.sphereGroup.position.set(-4, 0, -4);
  }

  addFloor() {
    const material = new THREE.MeshPhongMaterial({
      color: 0xffffff,
      specular: 0x0000,
      shininess: 100,
      flatShading: true,
      side: THREE.BackSide });


    this.object = new THREE.Mesh(new THREE.PlaneGeometry(70, 70), material);
    this.object.position.set(0, 0, 0);
    this.object.receiveShadow = true;
    this.object.rotation.x = this.radians(90);
    this.scene.add(this.object);
  }


  drawWave() {
    if (this.playing) {
      this.analyser.getByteFrequencyData(this.frequencyData);

      for (let i = 0; i < 64; i++) {
        const p = this.frequencyData[i];
        const s = this.spheres[i];
        const z = s.position;

        TweenMax.to(z, .2, {
          y: p / 40 });

      }
    }
  }

  setupAudio() {
    this.audioElement = document.getElementById('audio');
    this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    this.analyser = this.audioCtx.createAnalyser();

    this.source = this.audioCtx.createMediaElementSource(this.audioElement);
    this.source.connect(this.analyser);
    this.source.connect(this.audioCtx.destination);

    this.bufferLength = this.analyser.frequencyBinCount;

    this.frequencyData = new Uint8Array(this.bufferLength);
    this.audioElement.volume = 1;

    this.audioElement.addEventListener('playing', () => {
      this.playing = true;
    });

    this.audioElement.addEventListener('pause', () => {
      this.playing = false;
    });

    this.audioElement.addEventListener('ended', () => {
      this.playing = false;
    });
  }

  playSound(file) {
    this.playIntro.addEventListener('click', evt => {
      evt.currentTarget.classList.remove('control-show');
      this.play();
    });
    this.audioElement.src = file;
  }

  onResize() {
    const ww = window.innerWidth;
    const wh = window.innerHeight;
    this.camera.aspect = ww / wh;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(ww, wh);
  }}


const app = new App();

window.addEventListener("resize", app.onResize.bind(app));
