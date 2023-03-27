class Loader {
  constructor() {
    this.callback = null;
  }

  load(file) {
    const request = new XMLHttpRequest();

    request.open('GET', file, true);
    request.onprogress = evt => {
      let percent = Math.round(evt.loaded / evt.total * 100);

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

    this.count = 0;
    this.percent = 0;
    this.playing = false;

    this.objects = [];
  }

  progress(percent) {
    this.loaderBar.style.transform = `scale(${percent / 100}, 1)`;

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

  complete(file) {
    setTimeout(() => {
      this.firstRing = new THREE.Object3D();
      this.secondRing = new THREE.Object3D();
      this.thirdRing = new THREE.Object3D();
      this.fourthRing = new THREE.Object3D();

      this.setupAudio();
      this.addSoundControls();
      this.createScene();
      this.createCamera();
      this.addAmbientLight();
      this.addSpotLight();

      this.addCameraControls();
      this.addFloor();

      this.createRingOfSquares(20, 1, 0x4250ca, this.firstRing);
      this.createRingOfSquares(30, 2, 0x721fa1, this.secondRing);
      this.createRingOfSquares(40, 3, 0xf95c38, this.thirdRing);
      this.createRingOfSquares(50, 4, 0x5e0f86, this.fourthRing);

      this.animate();

      this.playSound(file);
    }, 200);

    document.addEventListener('visibilitychange', evt => {
      if (evt.target.hidden) {
        this.pause();
      } else {
        this.play();
      }

    }, false);
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

  createRingOfSquares(count, radius, color, group) {
    const size = .5;
    const geometry = new THREE.BoxGeometry(size, size, size);
    const material = new THREE.MeshLambertMaterial({
      color });


    for (let index = 0; index < count; index++) {
      const l = 360 / count;
      const pos = this.radians(l * index);
      const obj = this.createObj(color, geometry, material);
      const distance = radius * 2;
      const sin = Math.sin(pos) * distance;
      const cos = Math.cos(pos) * distance;

      obj.position.set(sin, 0, cos);

      obj.rotateY(pos);

      this.objects.push(obj);

      group.add(obj);
    }

    this.scene.add(group);
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

  createScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xf15f48);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    document.body.appendChild(this.renderer.domElement);
  }

  createCamera() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.camera = new THREE.PerspectiveCamera(70, width / height, 1, 1000);
    this.camera.position.set(-12, 17, 10);

    this.scene.add(this.camera);
  }

  addCameraControls() {
    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
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
  }

  createObj(color, geometry, material) {
    const obj = new THREE.Mesh(geometry, material);

    obj.castShadow = true;
    obj.receiveShadow = true;

    return obj;
  }

  onResize() {
    const ww = window.innerWidth;
    const wh = window.innerHeight;

    this.camera.aspect = ww / wh;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(ww, wh);
  }

  addFloor() {
    const planeGeometry = new THREE.PlaneGeometry(2000, 2000);
    const planeMaterial = new THREE.ShadowMaterial({ opacity: 0.08 });
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);

    planeGeometry.rotateX(-Math.PI / 2);

    plane.position.y = -1;
    plane.receiveShadow = true;

    this.scene.add(plane);
  }

  moveRingGroup(group, value) {
    group.rotation.y += value;
  }

  addSpotLight() {
    const spotLight = new THREE.SpotLight(0xffffff);

    spotLight.position.set(0, 20, 1);
    spotLight.castShadow = true;

    this.scene.add(spotLight);

    const spotLightHelper = new THREE.SpotLightHelper(spotLight);
  }

  addAmbientLight() {
    const light = new THREE.AmbientLight(0xffffff);

    this.scene.add(light);
  }

  animate() {
    this.controls.update();

    this.drawWave();

    this.renderer.render(this.scene, this.camera);

    requestAnimationFrame(this.animate.bind(this));
  }

  radians(degrees) {
    return degrees * Math.PI / 180;
  }

  drawWave() {
    if (this.playing) {
      this.analyser.getByteFrequencyData(this.frequencyData);

      for (var i = 0; i < 140; i++) {
        const p = this.frequencyData[i];
        const s = this.objects[i];
        const z = s.position;

        TweenMax.to(z, .2, {
          y: p / 20 });

      }
    }

    this.moveRingGroup(this.firstRing, .01);
    this.moveRingGroup(this.secondRing, -.01);
    this.moveRingGroup(this.thirdRing, .02);
    this.moveRingGroup(this.fourthRing, -.02);
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
    this.audioElement.volume = .5;

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
    setTimeout(() => {
      this.playIntro.addEventListener('click', evt => {
        evt.currentTarget.classList.remove('control-show');
        this.play();
      });

      this.audioElement.src = file;
    }, 500);
  }}


window.app = new App();
window.addEventListener('resize', app.onResize.bind(app));
