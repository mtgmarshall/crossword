function main() {
  let input = document.getElementById("myInput").value;
  let words = input.split(", ");
  words.sort(function(a, b){return b.length - a.length});
  alert("Arranged by length so far" + words);



  setup();
  draw();
}

function setup() {
  createCanvas(705, 705);
  textSize(30);
}

function draw() {
  background(0);
  for (let i = 0; i < 20; i++){
    for (let j = 0; j < 20; j++){
    rectMode(CENTER);
    fill(255);
    rect(35*i+20, 35*j+20, 35, 35);
    }
  }
  fill(0);
  text('t', 15, 30);
  text('e', 45, 30);
  text('s', 85, 30);
  text('t', 120, 30);
}
