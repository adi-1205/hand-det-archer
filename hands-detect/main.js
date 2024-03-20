import {
  HandLandmarker, FilesetResolver
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0";
// import {
//   HandLandmarker, FilesetResolver
// } from "@mediapipe/tasks-vision";
// import { HAND_CONNECTIONS, Hands } from '@mediapipe/hands';
// import { drawConnectors, drawLandmarks, lerp } from '@mediapipe/drawing_utils';

const demosSection = document.getElementById("demos");

let handLandmarker = undefined;
let enableWebcamButton;
let webcamRunning = false;


const createHandLandmarker = async () => {
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
  );
  handLandmarker = await HandLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
      delegate: "GPU"
    },
    runningMode: 'VIDEO',
    numHands: 2,
    minHandDetectionConfidence: 0.9,
    // minHandPresenceConfidence:0.9,
    // minTrackingConfidence:0.9
  });
  demosSection.classList.remove("invisible");
};
createHandLandmarker();

const video = document.getElementById("webcam");
const canvasElement = document.getElementById(
  "output_canvas"
);
const canvasCtx = canvasElement.getContext("2d");

const hasGetUserMedia = () => !!navigator.mediaDevices?.getUserMedia;

if (hasGetUserMedia()) {
  enableWebcamButton = document.getElementById("webcamButton");
  enableWebcamButton.addEventListener("click", enableCam);
} else {
  console.warn("getUserMedia() is not supported by your browser");
}

function enableCam(event) {
  if (!handLandmarker) {
    console.log("Wait! objectDetector not loaded yet.");
    return;
  }

  if (webcamRunning === true) {
    webcamRunning = false;
    enableWebcamButton.innerText = "ENABLE PREDICTIONS";
  } else {
    webcamRunning = true;
    enableWebcamButton.innerText = "DISABLE PREDICTIONS";
  }
  const constraints = {
    video: true
  };

  // Activate the webcam stream.
  navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
    video.srcObject = stream;
    video.addEventListener("loadeddata", predictWebcam);
  });
}

let lastVideoTime = -1;
let results = undefined;
let lastInFrame = undefined
const SNAP_DISTANCE = 20
let leftPoint = { x: 100, y: 100 }
let rightPoint = { x: 100, y: 100 }
let leftPinched = false
let rightPinched = false
let lastAimAngle = 0
let lastDrawDist = 0

async function predictWebcam() {
  canvasElement.style.width = video.videoWidth / 2;
  canvasElement.style.height = video.videoHeight / 2;
  canvasElement.width = video.videoWidth / 2;
  canvasElement.height = video.videoHeight / 2;

  let startTimeMs = performance.now();
  if (lastVideoTime !== video.currentTime) {
    lastVideoTime = video.currentTime;
    results = handLandmarker.detectForVideo(video, startTimeMs);
  }
  canvasCtx.save();
  canvasCtx.fill();
  if (results.landmarks) {
    let _results = handify(results)
    if (_results[0]) {
      drawPinchCircles(_results[0], 'red')
      drawPinchLine(_results[0], 'red')
      if (snapDistance(_results[0]) < SNAP_DISTANCE) {
        leftPinched = true
      } else {
        leftPinched = false
      }

      let fig1Point = extractPoint(_results[0][8])
      let fig2Point = extractPoint(_results[0][4])
      leftPoint = {
        x: (fig1Point.x + fig2Point.x) / 2,
        y: (fig1Point.y + fig2Point.y) / 2
      }
      canvasCtx.point(leftPoint)
    }
    if (_results[1]) {
      drawPinchCircles(_results[1], 'green')
      drawPinchLine(_results[1], 'green')
      if (snapDistance(_results[1]) < SNAP_DISTANCE) {
        rightPinched = true
      } else {
        rightPinched = false
      }

      let fig1Point = extractPoint(_results[1][8])
      let fig2Point = extractPoint(_results[1][4])
      rightPoint = {
        x: (fig1Point.x + fig2Point.x) / 2,
        y: (fig1Point.y + fig2Point.y) / 2
      }
      canvasCtx.point(rightPoint)
    }
  } else {
    leftPinched = rightPinched = false
  }



  canvasCtx.restore();

  if (webcamRunning === true) {
    window.requestAnimationFrame(predictWebcam);
  }
}

CanvasRenderingContext2D.prototype.circle = (landmark) => {
  let point = extractPoint(landmark)
  canvasCtx.beginPath();
  canvasCtx.ellipse(point.x, point.y, 5, 5, Math.PI, 0, 360)
  canvasCtx.fill();
}
CanvasRenderingContext2D.prototype.point = (point) => {
  canvasCtx.beginPath();
  canvasCtx.ellipse(point.x, point.y, 5, 5, Math.PI, 0, 360)
  canvasCtx.fill();
}

function drawPinchCircles(landmark, color) {
  let fig1 = landmark[8]
  let fig2 = landmark[4]
  canvasCtx.fillStyle = color
  canvasCtx.circle(fig1)
  canvasCtx.circle(fig2)
}
function drawPinchLine(landmark, color) {
  let start = extractPoint(landmark[8])
  let end = extractPoint(landmark[4])
  canvasCtx.strokeStyle = color
  canvasCtx.beginPath()
  canvasCtx.moveTo(start.x, start.y)
  canvasCtx.lineTo(end.x, end.y)
  canvasCtx.stroke()
}
function snapDistance(landmark) {
  let start = extractPoint(landmark[8])
  let end = extractPoint(landmark[4])
  // let distance = Math.sqrt(Math.pow(start.x - end.x, 2), Math.pow(start.y - end.y, 2))
  let distance = Math.max(start.y, end.y) - Math.min(start.y, end.y)
  return distance
}
function extractPoint(landmark) {
  let point = {
    x: Math.floor(landmark.x * video.videoWidth / 2),
    y: Math.floor(landmark.y * video.videoHeight / 2),
  }
  return point
}
function handify(results) {
  let _results = [undefined, undefined]
  if (results.handednesses.length > 1) {
    _results[0] = results.landmarks[lastInFrame == 'left' ? 0 : 1]
    _results[1] = results.landmarks[lastInFrame == 'left' ? 1 : 0]
  } else if (results.handednesses.length == 1) {
    if (results.handednesses[0][0].displayName == 'Left') {
      _results[0] = results.landmarks[0]
      lastInFrame = 'left'
    }
    if (results.handednesses[0][0].displayName == 'Right') {
      lastInFrame = 'right'
      _results[1] = results.landmarks[0]
    }
  }
  return _results
}

// ####################################################################################################
// ####################################################################################################
// GAME
// ####################################################################################################
// ####################################################################################################


const canvas = document.getElementById('game-canvas')
const arrowImage = document.getElementById('arrow-img') // 26x286
const bowImage = document.getElementById('bow-img') //380x75

const ctx = canvas.getContext('2d')
canvas.setAttribute('width', innerWidth);
canvas.setAttribute('height', innerHeight);

canvas.midX = canvas.width / 2
canvas.midY = canvas.height / 2
const mouse = {
  x: 0,
  y: 0
}
const ARROW_SPEED = 20
const colors = ["#5E1675", "#EE4266", "#FFD23F", "#337357"];
let balloonColors = generateBeautifulColors(10);

class Bow {

  constructor() {
    this.width = bowImage.width / 2
    this.height = bowImage.height / 2
    this.x = canvas.midX
    this.y = canvas.height - arrow.height
  }

  reset() {
    this.width = bowImage.width / 2
    this.height = bowImage.height / 2
    this.x = canvas.midX
    this.y = canvas.height - arrow.height
    // this.angle = -Math.PI / 2
  }

  update() {
    // drawArc(this.x, this.y, 'green')
    ctx.save()
    const isArrowShot = emitEvent('get arrow isShot');
    const arrowX = emitEvent('get arrow x');
    const arrowY = emitEvent('get arrow y');
    const arrowMidY = emitEvent('get arrow midY');
    const arrowDrawLength = emitEvent('get arrow drawLength');
    let angle = isArrowShot ? emitEvent('get arrow shootAngle') : emitEvent('get arrow aimAngle');
    ctx.translate(this.x, this.y)
    ctx.rotate(angle + Math.PI / 2)
    ctx.translate(-this.x, -this.y)
    if (!isArrowShot) {
      ctx.strokeStyle = 'white';
      ctx.beginPath();
      ctx.moveTo(this.x - this.width / 2, this.y + this.height);
      ctx.lineTo(this.x, this.y + arrowMidY + arrowDrawLength);
      ctx.moveTo(this.x, this.y + arrowMidY + arrowDrawLength);
      ctx.lineTo(this.x + this.width / 2, this.y + this.height);
      ctx.stroke();
      ctx.closePath();
    }
    this.draw()
    ctx.restore()
  }

  draw() {
    ctx.drawImage(bowImage, this.x - this.width / 2, this.y, this.width, this.height)
  }
}

class Arrow {

  constructor() {
    this.width = arrowImage.width / 2
    this.height = arrowImage.height / 2
    this.midX = this.width / 2
    this.midY = this.height / 2
    this.x = canvas.midX
    this.y = canvas.height - this.height
    this.isShot = false
    this.shootAngle = -Math.PI / 2
    this.aimAngle = -Math.PI / 2
    this.drawLength = 30
    this.velocity = {
      x: 0,
      y: 0
    }
  }

  reset() {
    this.x = canvas.midX
    this.y = canvas.height - this.height
    this.isShot = false
    this.drawLength = 30
    this.velocity = {
      x: 0,
      y: 0
    }
  }

  update() {
    // drawArc(this.x, this.y, 'blue')
    ctx.save()
    // let angle = this.aimAngle;
    let angle = this.isShot ? this.shootAngle : this.aimAngle;
    this.x += this.velocity.x * mapValue(this.drawLength)
    this.y += this.velocity.y * mapValue(this.drawLength)
    ctx.translate(this.x, this.y)
    ctx.rotate(angle + Math.PI / 2)
    ctx.translate(-this.x, -this.y)
    this.draw()

    ctx.restore()


    if ((this.x + this.midY) < 0 ||
      (this.x - this.midY) > canvas.width ||
      (this.y + this.midY) < 0 ||
      (this.y - this.midY) > canvas.height) {
      this.reset()
      emitEvent('reset bow')
      // emitEvent('reset balloon')
    }
  }

  draw() {
    ctx.drawImage(arrowImage, this.x - this.midX, this.y - this.midY + this.drawLength, this.width, this.height)
    // ctx.drawImage(arrowImage, 0, 0, arrowImage.width, arrowImage.height,
    //     this.x - this.width / 2, this.y - this.height / 2, this.width, this.height)
  }
}

class Balloon {
  constructor(x, y, radius, color) {
    this.x = x
    this.y = y
    this.radius = radius
    this.color = color
  }

  update() {
    this.draw()
  }


  draw() {
    ctx.beginPath()
    ctx.fillStyle = this.color
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2)
    ctx.fill()
  }
}

class Particle {
  constructor(x, y, radius, velocity) {
    this.x = x
    this.y = y
    this.radius = radius
    this.velocity = velocity
    this.opacity = 1
    this.color = randomColor()
  }
  update() {
    this.draw()
    this.velocity.y += 0.2
    this.x += this.velocity.x
    this.y += this.velocity.y
    this.y += 1
    this.opacity -= 0.01
  }
  draw() {
    ctx.save()
    ctx.beginPath()
    ctx.globalAlpha = this.opacity
    ctx.fillStyle = this.color
    ctx.arc(this.x, this.y, this.radius, degToRad(0), degToRad(360))
    ctx.fill()
    ctx.restore()
  }
}

const arrow = new Arrow()
const bow = new Bow()
const balloons = []
const particles = [];

for (let i = 1; i < 10; i++) {
  const balloon = new Balloon(i * canvas.width / 10, 50, 30, balloonColors[i])
  balloons.push(balloon)
}


function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  requestAnimationFrame(animate)
  // setTimeout(animate, 1000)
  drawBackground()
  bow.update()
  arrow.update()
  balloons.forEach((balloon, index) => {
    balloon.update()
    let pX = arrow.x + Math.sin(arrow.aimAngle + Math.PI / 2) * (arrow.midY - arrow.drawLength)
    let pY = arrow.y + Math.cos(arrow.aimAngle - Math.PI / 2) * (arrow.midY - arrow.drawLength)
    let dist = Math.hypot(
      balloon.x - pX,
      balloon.y - pY
    )
    if (dist <= balloon.radius) {
      setTimeout(() => {
        generateParticals(balloon.x, balloon.y)
        balloons.splice(index, 1)
      }, 0)
    }
  })
  particles.forEach((particle, index) => {
    particle.update();
    if (particle.opacity < 0) {
      particles.splice(index, 1)
    }
  });

  if (leftPinched && rightPinched) {
    let pinchDrawDist = Math.max(leftPoint.y, rightPoint.y) - Math.min(leftPoint.y, rightPoint.y)
    let drawDistance = mapPinchToArrowDrawLenth(pinchDrawDist)
    if (Math.abs(drawDistance - lastDrawDist) >= 5) {
      arrow.drawLength = drawDistance
      lastDrawDist = drawDistance
    }
    let aimXDist = leftPoint.x - rightPoint.x;
    let mappedAimAngle = mapAimAngle(aimXDist)
    if (Math.abs(mappedAimAngle - lastAimAngle) > 0.05) {
      arrow.aimAngle = mappedAimAngle
      lastAimAngle = mappedAimAngle
    }

  }

  if (rightPinched && !leftPinched) {
    if (
      mapValue(arrow.drawLength) &&
      !arrow.isShot) {
      arrow.velocity.x = Math.cos(arrow.aimAngle)
      arrow.velocity.y = Math.sin(arrow.aimAngle)
      arrow.isShot = true
      arrow.shootAngle = arrow.aimAngle
    }
  }
}

animate()

function drawBackground() {
  ctx.save()
  ctx.fillStyle = '#222'
  ctx.rect(0, 0, canvas.width, canvas.height)
  ctx.fill()
  ctx.restore()
}




// CONTROLS

function updateAimAngle() {
  //   if (!arrow.isShot) {
  //     mouse.x = e.x
  //     mouse.y = e.y
  //     arrow.aimAngle = Math.atan2(mouse.y - arrow.y, mouse.x - arrow.x)
  //   }
}
function updateShootAngle() {
  //   if (
  //     mapValue(arrow.drawLength) &&
  //     !arrow.isShot) {
  //     let angle = Math.atan2(mouse.y - arrow.y, mouse.x - arrow.x);
  //     arrow.velocity.x = Math.cos(angle)
  //     arrow.velocity.y = Math.sin(angle)
  //     arrow.isShot = true
  //     arrow.shootAngle = angle
  //   }
}

// addEventListener('mousemove', (e) => {
//   if (!arrow.isShot) {
//     mouse.x = e.x
//     mouse.y = e.y
//     arrow.aimAngle = Math.atan2(mouse.y - arrow.y, mouse.x - arrow.x)
//   }
// })

// addEventListener('click', (e) => {
//   if (
//     mapValue(arrow.drawLength) &&
//     !arrow.isShot) {
//     let angle = Math.atan2(mouse.y - arrow.y, mouse.x - arrow.x);
//     arrow.velocity.x = Math.cos(angle)
//     arrow.velocity.y = Math.sin(angle)
//     arrow.isShot = true
//     arrow.shootAngle = angle
//   }
// })

// addEventListener('keypress', (e) => {
//     switch (e.key) {
//         case 'a':
//             arrow.aimAngle -= 0.09
//             break;
//         case 'd':
//             arrow.aimAngle += 0.09
//             break;
//         case 'w':
//             if (arrow.drawLength > -35) {
//                 arrow.drawLength -= 5
//             }
//             break;
//         case 's':
//             if (arrow.drawLength < 50) {
//                 arrow.drawLength += 5
//             }
//             break;
//         case ' ':
//             if (
//                 mapValue(arrow.drawLength) &&
//                 !arrow.isShot) {
//                 arrow.velocity.x = Math.cos(arrow.aimAngle)
//                 arrow.velocity.y = Math.sin(arrow.aimAngle)
//                 arrow.isShot = true
//                 arrow.shootAngle = arrow.aimAngle
//             }
//             break
//     }
// })


// Event Handler

function emitEvent(e) {
  switch (e) {
    case 'reset bow':
      bow.reset()
      break
    case 'get arrow isShot':
      return arrow.isShot
    case 'get arrow shootAngle':
      return arrow.shootAngle
    case 'get arrow aimAngle':
      return arrow.aimAngle
    case 'get arrow x':
      return arrow.x
    case 'get arrow y':
      return arrow.y
    case 'get arrow midX':
      return arrow.midX
    case 'get arrow midY':
      return arrow.midY
    case 'get arrow drawLength':
      return arrow.drawLength

  }
}

function drawArc(x, y, color) {
  ctx.save()
  ctx.beginPath()
  ctx.fillStyle = color
  ctx.arc(x, y, 5, degToRad(0), degToRad(360))
  ctx.fill()
  ctx.restore()
}

function generateParticals(x, y) {
  for (let i = 0; i < 40; i++) {
    const particle = new Particle(x, y,
      randomBetween(3, 6), {
      x: Math.cos(randomAngle()) * 5,
      y: Math.sin(randomAngle()) * 6
    });
    particles.push(particle);
  }
}

// HELPERS
function degToRad(deg) {
  return deg * Math.PI / 180
}
function radToDeg(rad) {
  return (rad * 180) / Math.PI
}
function mapValue(value, minInput = -35, maxInput = 50, minOutput = 0, maxOutput = 50) {
  value = Math.max(minInput, Math.min(value, maxInput));
  const normalizedValue = (value - minInput) / (maxInput - minInput);
  const mappedValue = normalizedValue * (maxOutput - minOutput) + minOutput;
  return mappedValue;
}
function mapPinchToArrowDrawLenth(value, minInput = 0, maxInput = 100, minOutput = -35, maxOutput = 50) {
  value = Math.max(minInput, Math.min(value, maxInput));
  const normalizedValue = (value - minInput) / (maxInput - minInput);
  const mappedValue = normalizedValue * (maxOutput - minOutput) + minOutput;
  return mappedValue;
}
function mapAimAngle(value, minInput = -150, maxInput = -50, minOutput = degToRad(-180), maxOutput = degToRad(0)) {
  value = Math.max(minInput, Math.min(value, maxInput));
  const normalizedValue = (value - minInput) / (maxInput - minInput);
  const mappedValue = normalizedValue * (maxOutput - minOutput) + minOutput;
  return mappedValue;
}
function randomAngle() {
  const minAngle = -Math.PI / 2;
  const maxAngle = Math.PI / 2;
  const random = Math.random() * 2 - 1;
  const angleRange = maxAngle - minAngle;
  const angle = minAngle + random * angleRange;
  return angle;
}
function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}
function randomColor() {
  const randomIndex = Math.floor(Math.random() * colors.length);
  return colors[randomIndex];
}
function generateBeautifulColors(count) {
  const colors = [];
  for (let i = 0; i < count; i++) {
    const hue = Math.floor(Math.random() * 360); // Random hue between 0 and 360
    const saturation = Math.floor(Math.random() * 50) + 50; // Random saturation between 50 and 100
    const lightness = Math.floor(Math.random() * 30) + 50; // Random lightness between 50 and 80
    const color = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    colors.push(color);
  }
  return colors;
}