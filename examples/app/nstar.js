import * as THREE from '../../build/three.module.js';
import {OrbitControls}  from '../jsm/controls/OrbitControls.js';
import {GLTFLoader}     from '../jsm/loaders/GLTFLoader.js';
import {RGBELoader}     from '../jsm/loaders/RGBELoader.js';

function main() {

    let camera, scene, renderer, canvas, controls;
    let model, core_in;

//    const container = document.createElement('div');
//    document.body.appendChild(container);

    //===========================================================
    //======================= Camera ============================
    //===========================================================

    const fov = 50;
    const aspect = window.innerWidth / window.innerHeight;
    const near = 0.1;
    const far = 25;

    camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.set(0, 3, -7);
    camera.lookAt(0, 0, 0);

    scene = new THREE.Scene();

    //===========================================================
    //======================== Fog ==============================
    //===========================================================

    //    const color = 0x000000;
    //    const density = 0.39;
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
    renderer.toneMappingExposure = .5;

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
        .load('studio_small_08_2k.hdr', function (texture) {
            texture.mapping = THREE.EquirectangularReflectionMapping;
            scene.background = new THREE.Color(0x000000);
            // scene.environment = new THREE.Color(0x000000);
            // scene.background = texture;
            scene.environment = texture;
            model = new GLTFLoader().setPath('models/');
            model.load('star_body_13.gltf', function (gltf) {
                gltf.scene.traverse(function (child) {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });
                // console.log(dumpObject(gltf.scene).join('\n'));
                // core_in = gltf.scene.getObjectByName('1_Cst_Out');
                scene.add(gltf.scene);
                render();
            });
        });


    //===========================================================
    //====================== Lights ===========================
    //===========================================================

    //    const light1 = new THREE.DirectionalLight(0xffffff, .1, 0);
    //    light1.position.set(-4, 0, -4);
    //    light1.target.position.set(0, 0, 0);
    //    scene.add(light1);


    //===========================================================
    //====================== Controls ===========================
    //===========================================================

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.autoRotate = false;
    controls.autoRotateSpeed = -.3;
    controls.rotateSpeed = 0.2;
    controls.maxPolarAngle = Math.PI / 2;
    controls.zoomSpeed = 0.2;
    controls.minDistance = 1.5;
    controls.maxDistance = 4;
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
        controls.update();
        renderer.render(scene, camera);
        requestAnimationFrame(render);
    }

     requestAnimationFrame(render);
}

main();

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
