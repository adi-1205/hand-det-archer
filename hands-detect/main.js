import {
  HandLandmarker, FilesetResolver
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0";
import { HAND_CONNECTIONS, Hands } from '@mediapipe/hands';
// import { drawConnectors, drawLandmarks, lerp } from '@mediapipe/drawing_utils';

const demosSection = document.getElementById("demos");

let handLandmarker = undefined;
let runningMode = "IMAGE";
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
    runningMode: runningMode,
    numHands: 2
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
const SNAP_DISTANCE = 15

async function predictWebcam() {
  canvasElement.style.width = video.videoWidth;;
  canvasElement.style.height = video.videoHeight;
  canvasElement.width = video.videoWidth;
  canvasElement.height = video.videoHeight;

  if (runningMode === "IMAGE") {
    runningMode = "VIDEO";
    await handLandmarker.setOptions({ runningMode: "VIDEO" });
  }
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
        console.log('KHATAK');
      }
    }
    if (_results[1]) {
      drawPinchCircles(_results[1], 'green')
      drawPinchLine(_results[1], 'green')
      if (snapDistance(_results[1]) < SNAP_DISTANCE) {
        console.log('KHATAK');
      }
    }
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
  let distance = Math.sqrt(Math.pow(start.x - end.x, 2), Math.pow(start.y - end.y, 2))

  return distance
}

function extractPoint(landmark) {
  let point = {
    x: Math.floor(landmark.x * 640),
    y: Math.floor(landmark.y * 480),
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