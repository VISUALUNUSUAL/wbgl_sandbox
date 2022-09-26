import * as THREE from '../../build/three.module.js';
import {OrbitControls}  from '../jsm/controls/OrbitControls.js';
import {EffectComposer} from '../jsm/postprocessing/EffectComposer.js';
import {RenderPass} from '../jsm/postprocessing/RenderPass.js';
import {UnrealBloomPass} from '../jsm/postprocessing/UnrealBloomPass.js';
import {ShaderPass} from '../jsm/postprocessing/ShaderPass.js';
import { FXAAShader } from '../jsm/shaders/FXAAShader.js';
import {GUI} from '../jsm/libs/dat.gui.module.js';
import Stats from '../jsm/libs/stats.module.js';


function main() {

    //===========================================================
    //====================== Shader =============================
    //===========================================================

    const colorShader = {
      uniforms: {
        tDiffuse: { value: null },
        color:    { value: new THREE.Color(0xffffff) },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        uniform sampler2D tDiffuse;
        uniform vec3 color;
        void main() {
          vec4 previousPassColor = texture2D(tDiffuse, vUv);
          gl_FragColor = vec4(
              previousPassColor.rgb * color,
              previousPassColor.a);
        }
      `,
    };


    const fragmentShader = `
      #include <common>

      uniform vec3 iResolution;
      uniform float iTime;
      //uniform sampler2D iChannel0;

      //solar plasma
      //void mainImage( out vec4 fragColor, in vec2 fragCoord )
      //{
      //    vec2 q=7.0*(fragCoord.xy-0.5*iResolution.xy)/max(iResolution.x,iResolution.y);
      //
      //    for(float i=1.0;i<40.0;i*=1.1)
      //    {
      //        vec2 o=q;
      //        o.x+=(0.5/i)*cos(i*q.y+iTime*0.297+0.03*i)+0.3;
      //        o.y+=(0.5/i)*cos(i*q.x+iTime*0.414+0.03*(i+10.0))+0.9;
      //        q=o;
      //    }
      //
      //    vec3 col=vec3(0.5*sin(3.0*q.x)+0.5,0.5*sin(3.0*q.y)+0.5,sin(1.3*q.x+1.7*q.y));
      //    float f=0.43*(col.x+col.y+col.z);
      //
      //    fragColor=vec4(f+0.6,0.2+0.75*f,0.2,1.0);
      //}

      //    color_swirls
      void mainImage(out vec4 fragColor, in vec2 fragCoord) {
          float time = iTime * 1.0;
          vec2 uv = (fragCoord.xy / iResolution.xx - 0.5) * 8.0;
          vec2 uv0 = uv;
          float i0 = 1.0;
          float i1 = 1.0;
          float i2 = 1.0;
          float i4 = 0.0;
          for (int s = 0; s < 7; s++) {
              vec2 r;
              r = vec2(cos(uv.y * i0 - i4 + time / i1), sin(uv.x * i0 - i4 + time / i1)) / i2;
              r += vec2(-r.y, r.x) * 0.3;
              uv.xy += r;

              i0 *= 1.93;
              i1 *= 1.15;
              i2 *= 1.7;
              i4 += 0.05 + 0.1 * time * i1;
          }
          float r = sin(uv.x - time) * 0.5 + 0.5;
          float b = sin(uv.y + time) * 0.5 + 0.5;
          float g = sin((uv.x + uv.y + sin(time * 0.5)) * 0.5) * 0.5 + 0.5;
          fragColor = vec4(r, g, b, 1.0);
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

    const uniforms = {
        iTime: { value: 0 },
        iResolution:  { value: new THREE.Vector3(1, 1, 1) },
    };


    //===========================================================
    //======================= THREEJS ===========================
    //===========================================================

    let camera, scene, renderer, controls, canvas, stats;
    let sphere;


    const params = {
            exposure: 1,
            bloomStrength: 1.5,
            bloomThreshold: .9,
            bloomRadius: 1
    };

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
    renderer.toneMappingExposure = 1;
    renderer.outputEncoding = THREE.sRGBEncoding;


    //===========================================================
    //===================== Composer ============================
    //===========================================================

    const composer = new EffectComposer(renderer);
    const fxaaPass = new ShaderPass( FXAAShader );

    const unrealBloomPass = new UnrealBloomPass(
        new THREE.Vector2( window.innerWidth, window.innerHeight ),   // Resolution
        1.5,  // bloom strength
        1.0,    // bloom radius
        0.9,  // bloom threshold
    );



    const colorPass = new ShaderPass(colorShader);
//    colorPass.renderToScreen = true;

    composer.addPass(new RenderPass(scene, camera));
    composer.addPass(colorPass);
    composer.addPass(fxaaPass);
    composer.addPass(unrealBloomPass);


    //===========================================================
    //====================== Loaders ============================
    //===========================================================

    const loadingManager = new THREE.LoadingManager(() => {
        const loadingScreen = document.getElementById('loading-screen');
        loadingScreen.classList.add('fade-out');
        loadingScreen.addEventListener('transitionend', onTransitionEnd);
    });
    const loader = new THREE.TextureLoader(loadingManager);
    const texture = loader.load('./textures/bayer.png');


    //===========================================================
    //====================== Geometry ===========================
    //===========================================================

    const material = new THREE.ShaderMaterial({
        side: THREE.DoubleSide,
        vertexShader,
        fragmentShader,
        uniforms,
    });

    const sphereSize = 3;
    const widthSegments = 64;
    const heightSegments  = 64;
    const cubeGeo = new THREE.SphereGeometry(sphereSize, widthSegments, heightSegments);

    sphere = new THREE.Mesh(cubeGeo, material);
    sphere.position.set(0, 0, 0);
    sphere.rotation.x = Math.PI * 0.1;
    sphere.rotation.z = Math.PI * 0.1;
    scene.add(sphere);


    //===========================================================
    //========================= UI ==============================
    //===========================================================

    // stats
    stats = new Stats();
//    document.body.appendChild( stats.dom );

    const gui = new GUI();
    {
      const folder = gui.addFolder('UnrealBloomPass');
      folder.add(params, 'exposure', 0.1, 2).onChange(function (value) {
          renderer.toneMappingExposure = Math.pow(value, 4.0);
      });
      folder.add(params, 'bloomThreshold', 0.0, 1.0);
      folder.add(params, 'bloomStrength', 0.0, 3.0);
      folder.add(params, 'bloomRadius', 0.0, 1.0);
    }

    {
      const folder = gui.addFolder('ShaderPass');
      folder.add(colorPass.uniforms.color.value, 'r', 0, 4).name('red');
      folder.add(colorPass.uniforms.color.value, 'g', 0, 4).name('green');
      folder.add(colorPass.uniforms.color.value, 'b', 0, 4).name('blue');
      // folder.closed();
    }
// );


    //===========================================================
    //====================== Controls ===========================
    //===========================================================

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.autoRotate = false;
    controls.autoRotateSpeed = -.3;
    controls.rotateSpeed = 0.2;
    controls.maxPolarAngle = Math.PI / 2;
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
        if (needResize) {renderer.setSize(width, height, false);}
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

        if (resizeRendererToDisplaySize(renderer)) {
          const canvas = renderer.domElement;
          camera.aspect = canvas.clientWidth / canvas.clientHeight;
          camera.updateProjectionMatrix();
          composer.setSize(canvas.width, canvas.height);
        }
        //================== Animation =========================
        uniforms.iResolution.value.set(window.innerWidth, window.innerHeight, 1);
        uniforms.iTime.value = now * 0.3;

        unrealBloomPass.threshold = params.bloomThreshold;
        unrealBloomPass.strength = params.bloomStrength;
        unrealBloomPass.radius = params.bloomRadius;
        renderer.toneMappingExposure = params.exposure;

        controls.update();
//        stats.update();
        composer.render(deltaTime);
        requestAnimationFrame(render);
    }

     requestAnimationFrame(render);
}

//===========================================================
//====================== JS Stuff ===========================
//===========================================================

main();
