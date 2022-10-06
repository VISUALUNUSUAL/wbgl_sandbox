import * as THREE from '../../build/three.module.js';
import { OrbitControls } from '../jsm/controls/OrbitControls.js';
import { FlakesTexture } from '../jsm/textures/FlakesTexture.js';
import { RGBELoader }    from '../jsm/loaders/RGBELoader.js';


function main() {

    //===========================================================
    //====================== Shader =============================
    //===========================================================


    //===========================================================
    //======================= THREEJS ===========================
    //===========================================================

    let camera, scene, renderer, controls, canvas, pointlight;

    //===========================================================
    //====================== Render =============================
    //===========================================================

    canvas = document.querySelector('#scene');
    renderer = new THREE.WebGLRenderer({
        alpha:true,
        antialias:true,
        canvas
    });

    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    
    
    //===========================================================
    //======================= Camera ============================
    //===========================================================

    const fov = 50;
    const aspect = window.innerWidth / window.innerHeight;
    const near = 1;
    const far = 1000;

    camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.set(0, 0, 500);
    camera.lookAt(0, 0, 0);

    scene = new THREE.Scene();


    //===========================================================
    //======================== Fog ==============================
    //===========================================================
  

    //===========================================================
    //======================= Light =============================
    //===========================================================

    pointlight = new THREE.PointLight(0xffffff,1);
    pointlight.position.set(200,200,200);
    scene.add(pointlight);
    
    //===========================================================
    //====================== Loaders ============================
    //===========================================================

    let envmaploader = new THREE.PMREMGenerator(renderer);

    const loadingManager = new THREE.LoadingManager(() => {
        const loadingScreen = document.getElementById('loading-screen');
        loadingScreen.classList.add('fade-out');
        loadingScreen.addEventListener('transitionend', onTransitionEnd);
    });
    
    new RGBELoader(loadingManager).setPath('./textures/hdri/').load('comfy_cafe_2k.hdr', function(hdrmap) {

        let texture = new THREE.CanvasTexture(new FlakesTexture());
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.x = 16;
        texture.repeat.y = 8;

        let envmap = envmaploader.fromCubemap(hdrmap);

        const ballMaterial = {
          clearcoat: 1.0,
          metalness: 0.9,
          roughness:0.5,
          color: 0x8418ca,
          normalMap: texture,
          normalScale: new THREE.Vector2(0.15,0.15),
          envMap: envmap.texture
        };
 
    
    //===========================================================
    //====================== Geometry ===========================
    //===========================================================

        let ballGeo = new THREE.SphereGeometry(100,64,64);
        let ballMat = new THREE.MeshPhysicalMaterial(ballMaterial);
        ballMat.needsUpdate  = true;
        let ballMesh = new THREE.Mesh(ballGeo,ballMat);
        scene.add(ballMesh);

    });
    
    //===========================================================
    //========================= UI ==============================
    //===========================================================

    //===========================================================
    //====================== Controls ===========================
    //===========================================================

    controls = new OrbitControls(camera, renderer.domElement);
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.5;
    controls.enableDamping = true;
    controls.enablePan  = false;


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
        }
        
        //================== Animation =========================
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
