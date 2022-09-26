import * as THREE from '../../build/three.module.js';
import {OrbitControls}  from '../jsm/controls/OrbitControls.js';
import {EffectComposer} from '../jsm/postprocessing/EffectComposer.js';
import {RenderPass} from '../jsm/postprocessing/RenderPass.js';
import {UnrealBloomPass} from '../jsm/postprocessing/UnrealBloomPass.js';
import {ShaderPass} from '../jsm/postprocessing/ShaderPass.js';
import { FXAAShader } from '../jsm/shaders/FXAAShader.js';
import {GUI} from '../jsm/libs/dat.gui.module.js';


function main() {

    let camera, scene, renderer, controls, canvas;
    let uniforms, clock;
    let floor;
    let t = 0;
    let gui;

    const params = {
            exposure: .8,
            bloomStrength: 1.5,
            bloomThreshold: .9,
            bloomRadius: 1
    };

    clock = new THREE.Clock();

    //===========================================================
    //====================== Shader =============================
    //===========================================================


    const colorShader = {
      uniforms: {
        tDiffuse: { value: null },
        color:    { value: new THREE.Color(0xffeeee) },
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
        uniform float time;
        uniform float fogDensity;
        uniform vec3 fogColor;

        uniform sampler2D texture1;
        uniform sampler2D texture2;

        varying vec2 vUv;

        void main( void ) {

            vec2 position = - 1.0 + 2.0 * vUv;

            vec4 noise = texture2D( texture1, vUv );
            vec2 T1 = vUv + vec2( 1.5, - 1.5 ) * time * 0.02;
            vec2 T2 = vUv + vec2( - 2.0, 2.0 ) * time * 0.01;

            T1.x += noise.x * 1.0;
            T1.y += noise.y * 1.0;
            T2.x += noise.y * 2.2;
            T2.y += noise.z * 2.2;

            float p = texture2D( texture1, T1 * 2.0 ).a;

            vec4 color = texture2D( texture2, T2 * 2.0 );
            vec4 temp = color * ( vec4( p, p, p, p ) * 2.0 ) + ( color * color - 0.1 );

            if( temp.r > 1.0 ) { temp.bg += clamp( temp.r - 2.0, 0.0, 100.0 ); }
            if( temp.g > 1.0 ) { temp.rb += temp.g - 1.0; }
            if( temp.b > 1.0 ) { temp.rg += temp.b - 1.0; }

            gl_FragColor = temp;

            float depth = gl_FragCoord.z / gl_FragCoord.w;
            const float LOG2 = 1.442695;
            float fogFactor = exp2( - fogDensity * fogDensity * depth * depth * LOG2 );
            fogFactor = 1.0 - clamp( fogFactor, 0.0, 0.15 );

            gl_FragColor = mix( gl_FragColor, vec4( fogColor, gl_FragColor.w ), fogFactor );

        }

      `;

      const vertexShader = `
        uniform vec2 uvScale;
            varying vec2 vUv;

            void main()
            {
                vUv = uvScale * uv;
                vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
                gl_Position = projectionMatrix * mvPosition;
            }

      `;

    //===========================================================
    //======================= Loaders ===========================
    //===========================================================

    const loadingManager = new THREE.LoadingManager(() => {
        const loadingScreen = document.getElementById('loading-screen');
        loadingScreen.classList.add('fade-out');
        loadingScreen.addEventListener('transitionend', onTransitionEnd);
    });

    const textureLoader = new THREE.TextureLoader(loadingManager);

    uniforms = {
        "fogDensity": {
            value: 0.25
        },
        "fogColor": {
            value: new THREE.Vector3(0, 0, 0)
        },
        "time": {
            value: 1.0
        },
        "uvScale": {
            value: new THREE.Vector2(1.0,1.0)
        },
        "texture1": {
            value: textureLoader.load('./textures/lava/cloud1.png')
        },
        "texture2": {
            value: textureLoader.load('./textures/lava/nstar1.jpg')
        }
    };

    uniforms["texture1"].value.wrapS = uniforms["texture1"].value.wrapT = THREE.RepeatWrapping;
    uniforms["texture2"].value.wrapS = uniforms["texture2"].value.wrapT = THREE.RepeatWrapping;

    //===========================================================
    //======================= Camera ============================
    //===========================================================

    // Camera
    const fov = 65;
    const aspect = window.innerWidth / window.innerHeight;
    const near = 0.1;
    const far = 75;

    camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.set(-1, 1, 3);
    camera.lookAt(0.0, 0.0, 0.0);

    scene = new THREE.Scene();

    //===========================================================
    //======================== Fog ==============================
    //===========================================================

    //    const color = 0x000000;
    //    const density = 0.09;
    //    scene.fog = new THREE.FogExp2(color, density);

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
    //===================== Composer ============================
    //===========================================================

    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));

    const colorPass = new ShaderPass(colorShader);
    colorPass.renderToScreen = true;
    composer.addPass(colorPass);

    const unrealBloomPass = new UnrealBloomPass(
            new THREE.Vector2( window.innerWidth, window.innerHeight ),
            params.bloomStrength,
            params.bloomEadius,
            params.bloomThreshold,
        );
    composer.addPass(unrealBloomPass);


    //===========================================================
    //====================== Geometry ===========================
    //===========================================================

    const a = 24;
    const floorGeo = new THREE.PlaneGeometry( a, a);
    const shaderMaterial = new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        lights: false
    });
    floor = new THREE.Mesh(floorGeo, shaderMaterial);
    floor.position.set(0, 0, 0);
    floor.rotation.x = -Math.PI * 0.5;
    scene.add(floor);


    //===========================================================
    //========================= UI ==============================
    //===========================================================

    gui = new GUI();
    {
      const bloomUI = gui.addFolder('UnrealBloomPass');
      bloomUI.add(params, 'exposure', 0.1, 2).name('Exposure');;
      bloomUI.add(params, 'bloomThreshold', 0.0, 1.0).name('Threshold');;
      bloomUI.add(params, 'bloomStrength', 0.0, 3.0).name('Strength');;
      bloomUI.add(params, 'bloomRadius', 0.0, 3.0).step(0.01).name('Radius');;

      const shaderUI = gui.addFolder('ShaderPass');
      shaderUI.add(colorPass.uniforms.color.value, 'r', 0, 4).name('red');
      shaderUI.add(colorPass.uniforms.color.value, 'g', 0, 4).name('green');
      shaderUI.add(colorPass.uniforms.color.value, 'b', 0, 4).name('blue');

      const UVUI = gui.addFolder('UVPass');
      UVUI.add(uniforms.uvScale.value, 'x', 0, 8).step(1).name('X');
      UVUI.add(uniforms.uvScale.value, 'y', 0, 8).step(1).name('Y');
    }

    //===========================================================
    //===================== Orbit COntrol =======================
    //===========================================================

    controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0, 0);
    controls.enablePan = false;
    controls.enableZoom = true;
    controls.enableDamping = true;
    controls.dampingFactor = 0.02;
    controls.zoomSpeed = 0.07;
    controls.rotateSpeed = 0.07;
    controls.maxDistance = 10;
    controls.minDistance = .1;
    controls.maxPolarAngle = Math.PI * 0.24;
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

        //=================== Resize ===========================
        if (resizeRendererToDisplaySize(renderer)) {
          const canvas = renderer.domElement;
          camera.aspect = canvas.clientWidth / canvas.clientHeight;
          camera.updateProjectionMatrix();
          composer.setSize(canvas.width, canvas.height);
        }


        //================== Animation =========================
        floor.rotation.z = now * 0.02;
        floor.rotation.x += Math.cos(now * 0.5) * 0.0002;
        floor.position.y += Math.cos(now * 0.2) * 0.001;


        //================ Shader Update =======================
        uniforms['time'].value += 0.2 * deltaTime;


        //====================== UI ============================
        unrealBloomPass.threshold = params.bloomThreshold;
        unrealBloomPass.strength = params.bloomStrength;
        unrealBloomPass.radius = params.bloomRadius;
        renderer.toneMappingExposure = params.exposure;

        controls.update();
        composer.render(deltaTime);

        requestAnimationFrame(render);
    }

     requestAnimationFrame(render);
}

//===========================================================
//====================== JS Stuff ===========================
//===========================================================

main();
