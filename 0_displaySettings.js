//keyboard shortcuts 
// ! = save screenshot
// h = show UI
// 1 = handmode
// 2 = facemode 
// 3 = both 
// d = show debug
// c = "clear painting"

// GESTURE/ EXPRESSION DETECTOR INFO (defined here but a useful tool for you to use elsewhere.):
// detectHandGesture(hand) returns "Pinch", "Peace", "Thumbs Up", "Pointing", "Open Palm", or "Fist"


// 4:3 webcam dimensions:
// 640 x 480
// 800 x 600
// 1024 x 768
// 1280 x 960 (default)
// 1440 x 1080
// 1600 x 1200
// 1920 x 1440


// If using video file use these dimentions: 
const  CaptureWidth = 1280;
const  CaptureHeight = 720;

// const  CaptureWidth = 640;
// const  CaptureHeight = 360;


// If using Webcam use these dimentions
// const  CaptureWidth = 1280;
// const  CaptureHeight = 960;

// const  CaptureWidth = 1024;
// const  CaptureHeight = 768;



// program Mode
const webCam = true; // set to false to use video
const videoFile = "hands1.mov" // update this to match the video file you want to load
const flipVideo = true; // changes from mirror mode to standard video mode


// global variables 
let uiVisible = false;
let currentMode = 'hands';// this totally doesnt work  // 'hands', 'face', or 'both'
let showDebugInfo = false;
let showKeypoints = false;


// What is the program looking for
const numberOfFaces = 1;
const numberOfHands = 2; 


const threshold = 0.9 // only change if you're having hand detection issues

const performanceMode = 'high'; // 'low', 'balanced', 'high'


