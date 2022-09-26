//====================== JS Stuff ===========================

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
    let diff = rounded - position;
    position += diff * 0.15;
//    position += Math.sign(diff) * Math.pow(Math.abs(diff), 0.7) * 0.05;

    block.style.transform = "translate(0px," + (position * 100) + "px)";
    console.log(position);
    window.requestAnimationFrame(raf);
}

raf();
