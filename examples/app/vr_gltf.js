import * as THREE from '../../build/three.module.js';
import {OrbitControls}  from '../jsm/controls/OrbitControls.js';
import {GLTFLoader}     from '../jsm/loaders/GLTFLoader.js';
import {RGBELoader}     from '../jsm/loaders/RGBELoader.js';
import {VRButton}       from '../jsm/webxr/VRButton.js';

function main() {

    let camera, scene, renderer, controls;
    let model, Statue;

    const container = document.createElement('div');
    document.body.appendChild(container);

    //===========================================================
    //======================= Camera ============================
    //===========================================================

    const fov = 65;
    const aspect = window.innerWidth / window.innerHeight;
    const near = 0.1;
    const far = 25;

    camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.set(0, 1.75, -4);
    camera.lookAt(0, 1.6, -9);

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

    renderer = new THREE.WebGLRenderer({
        antialias: true,
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    renderer.outputEncoding = THREE.sRGBEncoding;
    container.appendChild(renderer.domElement);

    //======================== VR ===============================
    renderer.xr.enabled = true;
    document.body.appendChild(VRButton.createButton(renderer));


    //===========================================================
    //====================== Loaders ============================
    //===========================================================

            const loadingManager = new THREE.LoadingManager(() => {
        const loadingScreen = document.getElementById('loading-screen');
        loadingScreen.classList.add('fade-out');
        loadingScreen.addEventListener('transitionend', onTransitionEnd);
    });

    new RGBELoader(loadingManager)
        .setPath('textures/hdri/')
        .load('comfy_cafe_2k.hdr', function (texture) {
            texture.mapping = THREE.EquirectangularReflectionMapping;
            scene.background = new THREE.Color(0x000000);
            scene.environment = texture;
            model = new GLTFLoader().setPath('models/');
            model.load('VR_test5.gltf', function (gltf) {
                gltf.scene.traverse(function (child) {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });
                scene.add(gltf.scene);
                Statue = gltf.scene.getObjectByName('Statue');
                render();
            });
        });


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
    controls.maxPolarAngle = Math.PI / 2;
    controls.zoomSpeed = 0.2;
    controls.minDistance = 3;
    controls.maxDistance = 8;
    controls.target.set(0, 1.6, -9);
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

    function render(time) {

        if (resizeRendererToDisplaySize(renderer)) {
            const canvas = renderer.domElement;
            camera.aspect = canvas.clientWidth / canvas.clientHeight;
            camera.updateProjectionMatrix();
        }

        //================== Animation =========================
        time *= 0.0001; // convert to seconds
        if (Statue) {
            Statue.rotation.y = time;
        }

        //================== VR enable =========================
        if (renderer.xr.isPresenting === false) {
            controls.update();
            camera.updateProjectionMatrix();
        }

        renderer.render(scene, camera);
        // requestAnimationFrame(render);
    }

    // requestAnimationFrame(render);
    renderer.setAnimationLoop(render);
}

//===========================================================
//====================== JS Stuff ===========================
//===========================================================

//============= Dump GLTF structure to console ==================
function dumpObject(obj, lines = [], isLast = true, prefix = '') {
    const localPrefix = isLast ? '└─' : '├─';
    lines.push(`${prefix}${prefix ? localPrefix : ''}${obj.name || '*no-name*'} [${obj.type}]`);
    const newPrefix = prefix + (isLast ? '  ' : '│ ');
    const lastNdx = obj.children.length - 1;
    obj.children.forEach((child, ndx) => {
        const isLast = ndx === lastNdx;
        dumpObject(child, lines, isLast, newPrefix);
    });
    return lines;
}

main();
