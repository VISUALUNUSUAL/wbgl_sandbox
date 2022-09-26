import * as THREE from '/build/three.module.js';

import { EffectComposer } from '../jsm/postprocessing/EffectComposer.js';
import { RenderPass } from '../jsm/postprocessing/RenderPass.js';
import { ShaderPass } from '../jsm/postprocessing/ShaderPass.js';
import { BloomPass } from '../jsm/postprocessing/BloomPass.js';
import { CopyShader } from '../jsm/shaders/CopyShader.js';

let canvas;
let camera, scene, renderer;
let video, material, mesh;
let composer;
let mouseX = 0;
let mouseY = 0;
let windowHalfX = window.innerWidth / 2;
let windowHalfY = window.innerHeight / 2;

function main(){

    scene = new THREE.Scene();

    //===========================================================
    //======================= Camera ============================
    //===========================================================

    const fov = 40;
    const aspect = window.innerWidth / window.innerHeight;
    const near = 1;
    const far = 10000;

    camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.position.z = 500;

    //===========================================================
    //====================== Lights ===========================
    //===========================================================

    const light = new THREE.DirectionalLight(0xffffff);
    light.position.set(0.5, 1, 1).normalize();
    scene.add(light);

    //===========================================================

    canvas = document.querySelector('#scene');
    renderer = new THREE.WebGLRenderer({
        canvas
    });

    video = document.getElementById('video');
    video.play();
    video.addEventListener('play', function () {
        this.currentTime = 13;
    });

    //===========================================================
    //====================== Geometry ===========================
    //===========================================================

    let geometry;
    let texture = new THREE.VideoTexture(video);

    const xsize = 384;
    const ysize = 240;

    const parameters = {
        color: 0xffffff,
        map: texture
    };

    geometry = new THREE.PlaneGeometry(xsize, ysize);
    material = new THREE.MeshLambertMaterial(parameters);
    mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    //===========================================================
    //===================== Composer ============================
    //===========================================================

    renderer.autoClear = false;

    const renderModel = new RenderPass(scene, camera);
    const effectBloom = new BloomPass(0.0);
    const effectCopy = new ShaderPass(CopyShader);

    composer = new EffectComposer(renderer);
    composer.addPass(renderModel);
    composer.addPass(effectBloom);
    composer.addPass(effectCopy);

    //===========================================================

    document.addEventListener('mousemove', onDocumentMouseMove);

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

    function onDocumentMouseMove(event) {
        mouseX = (event.clientX - windowHalfX);
        mouseY = (event.clientY - windowHalfY) * 0.3;
    }


    //===========================================================
    //====================== Animation ==========================
    //===========================================================

    let then = 0;
    function render(now) {
        now *= 0.001; // convert to seconds
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
        camera.position.x += (mouseX - camera.position.x) * 0.05;
        camera.position.y += (-mouseY - camera.position.y) * 0.05;
        camera.lookAt(scene.position);

        renderer.clear();
        composer.render(deltaTime);

        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);

}

//===========================================================
//================= Text Animation ==========================
//===========================================================

let quote, quotewords, wordCount;

function splitWords() {
  quote = document.querySelector('#q');
  quote.innerText.replace(/(<([^>]+)>)/ig,"");
  quotewords = quote.innerText.split(" "),
  wordCount = quotewords.length;
  quote.innerHTML = "";
  for (let i=0; i < wordCount; i++) {
    quote.innerHTML += "<span>"+quotewords[i]+"</span>";
    if (i < quotewords.length - 1) {
      quote.innerHTML += " ";
    }
  }
  quotewords = document.querySelectorAll("#q span");
  fadeWords(quotewords);
}

function getRandom(min, max) {
  return Math.random() * (max - min) + min;
}

function fadeWords(quotewords) {
  Array.prototype.forEach.call(quotewords, function(word) {
    let animate = word.animate([{
      opacity: 0,
      filter: "blur("+getRandom(2,5)+"px)"
    }, {
      opacity: 1,
      filter: "blur(0px)"
    }],
    {
      duration: 1000,
      delay: getRandom(500,13300),
      fill: 'forwards'
    }
   )
  })
}

main();
splitWords();
