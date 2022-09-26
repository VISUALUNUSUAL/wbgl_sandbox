import * as THREE from '../../build/three.module.js';
import {OrbitControls}  from '../jsm/controls/OrbitControls.js';

function main() {

    let camera, scene, renderer, controls, canvas;
    let floor, cube, wall;
    let t = 0;


    //===========================================================
    //======================= Camera ============================
    //===========================================================

    const fov = 65;
    const aspect = window.innerWidth / window.innerHeight;
    const near = 0.1;
    const far = 25;

    camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.set(0, 1.75, -6);
    camera.lookAt(0, 0, 0);

    scene = new THREE.Scene();

    //===========================================================
    //======================== Fog ==============================
    //===========================================================

    const color = 0x000000;
    const density = 0.09;
    scene.fog = new THREE.FogExp2(color, density);

    //===========================================================
    //====================== Render =============================
    //===========================================================

    canvas = document.querySelector('#scene');
    renderer = new THREE.WebGLRenderer({
        canvas
    });

    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.outputEncoding = THREE.sRGBEncoding;
    //===========================================================
    //====================== Shader =============================
    //===========================================================

     const fragmentShader = `
      #include <common>

      uniform vec3 iResolution;
      uniform float iTime;
      uniform sampler2D iChannel0;

      //Calculate the squared length of a vector
      float length2(vec2 p) {
          return dot(p, p);
      }

      //Generate some noise to scatter points.
      float noise(vec2 p) {
          return fract(sin(fract(sin(p.x) * (43.13311)) + p.y) * 31.0011);
      }

      float worley(vec2 p) {
          //Set our distance to infinity
          float d = 1e30;
          //For the 9 surrounding grid points
          for (int xo = -1; xo <= 1; ++xo) {
              for (int yo = -1; yo <= 1; ++yo) {
                  //Floor our vec2 and add an offset to create our point
                  vec2 tp = floor(p) + vec2(xo, yo);
                  //Calculate the minimum distance for this grid point
                  //Mix in the noise value too!
                  d = min(d, length2(p - tp - noise(tp)));
              }
          }
          return 3.0 * exp(-4.0 * abs(2.5 * d - 1.0));
      }

      float fworley(vec2 p) {
          //Stack noise layers
          return sqrt(sqrt(sqrt(
              worley(p * 5.0 + 0.05 * iTime) *
              sqrt(worley(p * 50.0 + 0.12 + -0.1 * iTime)) *
              sqrt(sqrt(worley(p * -10.0 + 0.03 * iTime))))));
      }

      void mainImage(out vec4 fragColor, in vec2 fragCoord) {
          vec2 uv = fragCoord.xy / iResolution.xy;
          //Calculate an intensity
          float t = fworley(uv * iResolution.xy / 1500.0);
          //Add some gradient
          t *= exp(-length2(abs(0.7 * uv - 1.0)));
          //Make it blue!
          fragColor = vec4(t * vec3(0.1, 1.1 * t, pow(t, 0.5 - t)), 1.0);
      }

      varying vec2 vUv;

      void main() {
          mainImage(gl_FragColor, vUv * iResolution.xy);
      }
      `;

      const vertexShader = `
      varying vec2 vUv;
      void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
      `;

    //===========================================================
    //====================== Geometry ===========================
    //===========================================================

    const loadingManager = new THREE.LoadingManager(() => {
        const loadingScreen = document.getElementById('loading-screen');
        loadingScreen.classList.add('fade-out');
        loadingScreen.addEventListener('transitionend', onTransitionEnd);
    });

    const loader = new THREE.TextureLoader(loadingManager);
    const texture = loader.load('./textures/bayer.png');
    texture.minFilter = THREE.NearestFilter;
    texture.magFilter = THREE.NearestFilter;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;

    const uniforms = {
        iTime: { value: 0 },
        iResolution:  { value: new THREE.Vector3(1, 1, 1) },
        iChannel0: { value: texture },
    };

    const material = new THREE.ShaderMaterial({
    side: THREE.DoubleSide,
        vertexShader,
        fragmentShader,
        uniforms,
    });

    const cubeSize = 3;
    const cubeGeo = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);

    cube = new THREE.Mesh(cubeGeo, material);
    cube.position.set(0, 0, 0);
    cube.rotation.x = Math.PI * 0.1;
    cube.rotation.z = Math.PI * 0.1;
    scene.add(cube);


    //===========================================================
    //====================== Controls ===========================
    //===========================================================

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.autoRotate = true;
    controls.autoRotateSpeed = -.3;
    controls.rotateSpeed = 0.2;
//    controls.maxPolarAngle = Math.PI / 2;
    controls.zoomSpeed = 0.2;
    controls.minDistance = 3;
    controls.maxDistance = 8;
    controls.target.set(0, 0, 0);
    controls.update();


    //===========================================================
    //======================== UTILS ============================
    //===========================================================

    function resizeRendererToDisplaySize(renderer) {
        const canvas = renderer.domElement;
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        const needResize = canvas.width !== width || canvas.height !== height;
        if (needResize) {
            renderer.setSize(width, height, false);
        }
        return needResize;
    }

    function onTransitionEnd(event) {
        event.target.remove();
    }
    //===========================================================
    //====================== Animation ==========================
    //===========================================================

    let then = 0;
    function render(now) {

        now *= 0.001;  // convert to seconds
        const deltaTime = now - then;
        then = now;

        //=================== Resize ===========================
        if (resizeRendererToDisplaySize(renderer)) {
            const canvas = renderer.domElement;
            camera.aspect = canvas.clientWidth / canvas.clientHeight;
            camera.updateProjectionMatrix();
        }

        //================== Animation =========================
        cube.rotation.y = now/10;

        //================ Shader Update =======================
        uniforms.iResolution.value.set(window.innerWidth, window.innerHeight, 1);
        uniforms.iTime.value = now;

        //====================== UI ============================

        controls.update();
        renderer.render(scene, camera);
        requestAnimationFrame(render);
    }

     requestAnimationFrame(render);
}

//===========================================================
//====================== JS Stuff ===========================
//===========================================================

main();
