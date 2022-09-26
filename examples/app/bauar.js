import * as THREE from '../../build/three.module.js';
import {OrbitControls}  from '../jsm/controls/OrbitControls.js';
import {GLTFLoader}     from '../jsm/loaders/GLTFLoader.js';
import {RGBELoader}     from '../jsm/loaders/RGBELoader.js';

function main() {

    let camera, scene, renderer, controls, canvas;
    let model, sculpture;



    //===========================================================
    //======================= Camera ============================
    //===========================================================

    const fov = 23;
    const aspect = window.innerWidth / window.innerHeight;
    const near = 0.1;
    const far = 55;

    camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.set(0, 4, -15);
    camera.lookAt(0, 2, 0);

    scene = new THREE.Scene();
//    scene.background = new THREE.Color(0xffffff);


    //===========================================================
    //======================== Fog ==============================
    //===========================================================

//    const color = 0xffffff;
//    const density = 0.05;
//    scene.fog = new THREE.FogExp2(color, density);


    //===========================================================
    //====================== Render =============================
    //===========================================================

    canvas = document.querySelector('#scene');
    renderer = new THREE.WebGLRenderer({
        alpha:true,
        antialias:true,
        canvas
    });
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    renderer.outputEncoding = THREE.sRGBEncoding;


    //===========================================================
    //====================== Loaders ============================
    //===========================================================

    const loadingManager = new THREE.LoadingManager(() => {
        const loadingScreen = document.getElementById('loading-screen');
        loadingScreen.classList.add('fade-out');
        loadingScreen.addEventListener('transitionend', onTransitionEnd);
    });

    const loader = new THREE.TextureLoader(loadingManager);

    //======================= Floor ==============================
    const texture = loader.load('textures/uv_grid_opengl.jpg');
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.magFilter = THREE.NearestFilter;
    const repeats = 20;
    texture.repeat.set(repeats, repeats);

    //======================= GLTF ==============================
    model = new GLTFLoader(loadingManager).setPath('models/');
    model.load('ar_basic_webgl_v08.glb', function (gltf) {
        gltf.scene.traverse(function (child) {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
        scene.add(gltf.scene);
                console.log(dumpObject(gltf.scene).join('\n'));
        sculpture = gltf.scene.getObjectByName('SculptureCube2');
        render();
    });


    const shadowTexture = loader.load('textures/roundshadow.png');
    const sphereShadowBases = [];
    {
    const sphereRadius = 1;
    const sphereWidthDivisions = 32;
    const sphereHeightDivisions = 16;
    const sphereGeo = new THREE.SphereGeometry(sphereRadius, sphereWidthDivisions, sphereHeightDivisions);

    const planeSize = 4;
    const shadowGeo = new THREE.PlaneGeometry(planeSize, planeSize);

    // make a base for the shadow and the sphere. so they move together.
    const base = new THREE.Object3D();
    scene.add(base);

    // add the shadow to the base
    // note: we make a new material for each sphere
    // so we can set that sphere's material transparency
    // separately.
    const shadowMat = new THREE.MeshBasicMaterial({
    map: shadowTexture,
    transparent: true,    // so we can see the ground
    depthWrite: false,    // so we don't have to sort
    });

    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.position.y = 0.001;  // so we're above the ground slightly
    shadowMesh.rotation.x = Math.PI * -.5;
    const shadowSize = 1;
    shadowMesh.scale.set(shadowSize, shadowSize, shadowSize);
    base.add(shadowMesh);

    // add the sphere to the base
    //      const u = i / numSpheres;
    //      const sphereMat = new THREE.MeshPhongMaterial();
    //      sphereMat.color.setHSL(u, 1, .75);
    //      const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
    //      sphereMesh.position.set(0, sphereRadius + 2, 0);
    //      base.add(sphereMesh);

    }


    //===========================================================
    //====================== Geometry ===========================
    //===========================================================

    const planeSize = 40;
    const planeGeo = new THREE.PlaneGeometry(planeSize, planeSize);
    const planeMat = new THREE.MeshBasicMaterial({
//        map: texture,
    color: new THREE.Color(0xFFFFFF),
    side: THREE.DoubleSide,
    });

    const mesh = new THREE.Mesh(planeGeo, planeMat);
    mesh.rotation.x = Math.PI * -.5;
//    scene.add(mesh);


    //===========================================================
    //====================== Lights ===========================
    //===========================================================

//    {
//        const skyColor = 0xB1E1FF;      // light blue
//        const groundColor = 0xB97A20;   // brownish orange
//        const intensity = 2;
//        const light = new THREE.HemisphereLight(skyColor, groundColor, intensity);
//        scene.add(light);
//    }
//    {
//        const color = 0xFFFFFF;
//        const intensity = 1;
//        const light = new THREE.DirectionalLight(color, intensity);
//        light.position.set(0, 10, 5);
//        light.target.position.set(0, 0, 0);
//        scene.add(light);
//        scene.add(light.target);
//    }


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
        controls.maxDistance = 14;
        controls.target.set(0, 1.5, 0);
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

        //==================== Timer ============================
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
        if (sculpture) {
            sculpture.rotation.y = now * 0.1;
        }

        //================ Shader Update =======================
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
