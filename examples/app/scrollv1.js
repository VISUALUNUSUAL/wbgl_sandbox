import * as THREE from '/build/three.module.js';
//import {OrbitControls}  from '../jsm/controls/OrbitControls.js';

function main() {

    let camera, scene, renderer, controls, canvas;

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



    //===========================================================
    //====================== Render =============================
    //===========================================================

    canvas = document.getElementById('scene');
    renderer = new THREE.WebGLRenderer({
        canvas
    });


    //===========================================================
    //===================== Composer ============================
    //===========================================================



    //===========================================================
    //======================= Loaders ===========================
    //===========================================================



    //===========================================================
    //======================== Light ============================
    //===========================================================



    //===========================================================
    //====================== Geometry ===========================
    //===========================================================



    //===========================================================
    //====================== Controls ===========================
    //===========================================================



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
            renderer.setSize(canvas.width, canvas.height);
        }

        //================== Animation =========================


        raf();

        renderer.render(scene, camera);
        requestAnimationFrame(render);

    }

    requestAnimationFrame(render);
}

main();

//===========================================================
//====================== JS Stuff ===========================
//===========================================================

let speed = 0;
let position =  0;
let rounded = 0;
let block = document.getElementById('block');

window.addEventListener('wheel', (e)=>{
    speed += e.deltaY * 0.0003;
});

function raf(){

    position += speed;
    position *= 0.8;

    rounded = Math.round(position);
    let diff = (rounded - position);
    position += diff * 0.05;

    block.style.transform = "translate(0px," + position * 100 + "px)";
    console.log(position);
}

