import * as THREE from '../../build/three.module.js';
import {OrbitControls}  from '../jsm/controls/OrbitControls.js';
import {EffectComposer} from '../jsm/postprocessing/EffectComposer.js';
import {RenderPass} from '../jsm/postprocessing/RenderPass.js';
import {UnrealBloomPass} from '../jsm/postprocessing/UnrealBloomPass.js';
import {GUI} from '../jsm/libs/dat.gui.module.js';

function main() {

    let camera, scene, renderer, controls, canvas;
    let sun_light, sphere;

    let t = 0;
    let r = 5;

    const params = {
            exposure: 0.7,
            bloomStrength: 1.5,
            bloomThreshold: .0,
            bloomRadius: 2
    };

//    const container = document.createElement('div');
//    document.body.appendChild(container);

    //===========================================================
    //======================= Camera ============================
    //===========================================================

    const fov = 75;
    const aspect = window.innerWidth / window.innerHeight;
    const near = 0.1;
    const far = 15;

    camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.set(0, 0, -2);
    camera.lookAt(0, 0, 0);

    scene = new THREE.Scene();

    //===========================================================
    //======================== Fog ==============================
    //===========================================================

    const fogNear = 1;
    const fogFar = 3;
    const fogColor = 'black';
    scene.fog = new THREE.Fog(fogColor, fogNear, fogFar);
    scene.background = new THREE.Color(fogColor);

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
    composer.addPass(new RenderPass(scene, camera));
    composer.renderToScreen = true;

    const unrealBloomPass = new UnrealBloomPass(
            new THREE.Vector2( window.innerWidth, window.innerHeight ),
            params.bloomStrength,
            params.bloomEadius,
            params.bloomThreshold,
        );

//    unrealBloomPass.renderToScreen = true;
//    composer.addPass(unrealBloomPass);

    //===========================================================
    //======================= Loaders ===========================
    //===========================================================

    const loadingManager = new THREE.LoadingManager(() => {
        const loadingScreen = document.getElementById('loading-screen');
        loadingScreen.classList.add('fade-out');
        loadingScreen.addEventListener('transitionend', onTransitionEnd);
    });

    const textureLoader = new THREE.TextureLoader(loadingManager);
    textureLoader.load("./textures/moon/lroc_color_poles_4k.jpg", function (map) {
        map.anisotropy = renderer.capabilities.getMaxAnisotropy();
        map.encoding = THREE.sRGBEncoding;
        sphMat.map = map;
        sphMat.needsUpdate = true;
    });


    //===========================================================
    //======================== Light ============================
    //===========================================================

    const color = 0xFFFFFF;
    const intensity = 1.6;

    sun_light = new THREE.DirectionalLight(color, intensity);
    sun_light.position.set(0, 0, r);
    sun_light.target.position.set(0, 0, 0);

    scene.add(sun_light);
    scene.add(sun_light.target);

    //===========================================================
    //====================== Geometry ===========================
    //===========================================================

    // .sphere
    const sphRadius = 1;
    const widthSegments = 64;
    const heightSegments = 64;
    const sphGeo = new THREE.SphereGeometry(sphRadius, widthSegments, heightSegments);
    const sphMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.7,
        metalness: 1.0,
    });

    sphere = new THREE.Mesh(sphGeo, sphMat);
    scene.add(sphere);


    //===========================================================
    //====================== Controls ===========================
    //===========================================================

    controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0, 0);
    controls.enablePan = false;
    controls.enableZoom = true;
    controls.enableDamping = true;
    controls.dampingFactor = 0.03;
    controls.zoomSpeed = 0.2;
    controls.rotateSpeed = 0.4;
    controls.maxDistance = 3;
    controls.minDistance = 1.5;
    controls.maxPolarAngle = Math.PI / 2;


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

        if (resizeRendererToDisplaySize(renderer)) {
            const canvas = renderer.domElement;
            camera.aspect = canvas.clientWidth / canvas.clientHeight;
            camera.updateProjectionMatrix();
            composer.setSize(canvas.width, canvas.height);
        }

        //================== Animation =========================
        //        time *= 0.0001; // convert to seconds
        t += 0.0007;

        // sun light rotation around sphere
        sun_light.position.x = Math.sin(t * 4) * r;
        sun_light.position.z = Math.cos(t * 4) * r;

        // sphere libration
        sphere.rotation.x = Math.cos(t * 8) * 0.01;
        sphere.position.z = Math.cos(t * 4) * 0.01;
        sphere.rotation.y = t;

        unrealBloomPass.threshold = params.bloomThreshold;
        unrealBloomPass.strength = params.bloomStrength;
        unrealBloomPass.radius = params.bloomRadius;

        renderer.toneMappingExposure = params.exposure;

        controls.update();
        composer.render(deltaTime);
    }

    renderer.setAnimationLoop(render);
}

//===========================================================
//====================== JS Stuff ===========================
//===========================================================

main();
