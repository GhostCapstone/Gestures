// Ghost's Anatomy
// Leap Motion Script
// Pinch, Rotation, and Point gestures

// Global keyTap and screenTap arrays
var keyTaps = [];
var KEYTAP_LIFETIME = .5;
var KEYTAP_START_SIZE = 15;

// Global keyTap and screenTap arrays
var screenTaps = [];
var SCREENTAP_LIFETIME = 1;
var SCREENTAP_START_SIZE = 30;

// Setting up Canvas

var canvas = document.getElementById('canvas');
var c = canvas.getContext('2d');

// Making sure we have the proper aspect ratio for our canvas
canvas.width = canvas.clientWidth;
canvas.height = canvas.clientHeight;

// Setup variables
var width = canvas.width;
var height = canvas.height;
var frame, lastFrame;
var numberFingers;

// Create a rotation matrix for the DAE model (For Rotation Gesture)
// http://stackoverflow.com/questions/11060734/how-to-rotate-a-3d-object-on-axis-three-js
var rotObjectMatrix;
var xAxis = new THREE.Vector3(1,0,0);
var yAxis = new THREE.Vector3(0,1,0);
var zAxis = new THREE.Vector3(0,0,1);
function rotateAroundObjectAxis(object, axis, radians) {
    rotObjectMatrix = new THREE.Matrix4();
    rotObjectMatrix.makeRotationAxis(axis.normalize(), radians);

    // old code for Three.JS pre r54:
    // object.matrix.multiplySelf(rotObjectMatrix);      // post-multiply
    // new code for Three.JS r55+:
    object.matrix.multiply(rotObjectMatrix);

    // old code for Three.js pre r49:
    // object.rotation.getRotationFromMatrix(object.matrix, object.scale);
    // new code for Three.js r50+:
    object.rotation.setFromRotationMatrix(object.matrix);
}

// LeapToScene
function leapToScene(leapPos) {
    var iBox = frame.interactionBox;

    // Left coordinate = Center X - Interaction Box Size / 2
    // Top coordinate = Center Y + Interaction Box Size / 2
    var left = iBox.center[0] - iBox.size[0] / 2;
    var top = iBox.center[1] + iBox.size[1] / 2;

    // X Poisition = Current
    var x = leapPos[0] - left;
    var y = leapPos[1] - top;

    x /= iBox.size[0];
    y /= iBox.size[1];

    x *= width;
    y *= height;

    return [x, -y];
}

function onScreenTap(gesture) {

    var pos = leapToScene(gesture.position);

    var time = frame.timestamp;

    screenTaps.push([pos[0], pos[1], time]);

}

function updateScreenTaps() {

    for (var i = 0; i < screenTaps.length; i++) {

        var screenTap = screenTaps[i];
        var age = frame.timestamp - screenTaps[i][2];
        age /= 1000000;

        if (age >= SCREENTAP_LIFETIME) {
            screenTaps.splice(i, 1);
        }

    }

}

function drawScreenTaps() {

    for (var i = 0; i < screenTaps.length; i++) {

        var screenTap = screenTaps[i];

        var x = screenTap[0];
        var y = screenTap[1];

        var age = frame.timestamp - screenTap[2];
        age /= 1000000;

        var completion = age / SCREENTAP_LIFETIME;
        var timeLeft = 1 - completion;

        /*
        
        Drawing the static ring

        */
        c.strokeStyle = "#FFB300";
        c.lineWidth = 3;

        // Save the canvas context, so that we can restore it
        // and have it un affected
        c.save();

        // Translate the contex and rotate around the
        // center of the  square
        c.translate(x, y);

        //Starting x and y ( compared to the pivot point )
        var left = -SCREENTAP_START_SIZE / 2;
        var top = -SCREENTAP_START_SIZE / 2;
        var width = SCREENTAP_START_SIZE;
        var height = SCREENTAP_START_SIZE;

        // Draw the rectangle
        c.strokeRect(left, top, width, height);

        // Restore the context, so we don't draw everything rotated
        c.restore();


        // Drawing the non-static part

        var size = SCREENTAP_START_SIZE * timeLeft;
        var opacity = timeLeft;
        var rotation = timeLeft * Math.PI;

        c.fillStyle = "rgba( 255 , 179 , 0 , " + opacity + ")";

        c.save();

        c.translate(x, y);
        c.rotate(rotation);

        var left = -size / 2;
        var top = -size / 2;
        var width = size;
        var height = size;

        c.fillRect(left, top, width, height);

        c.restore();


    }

}

// Setting up the Leap Controller
var controller = new Leap.Controller({
    enableGestures: true
});

// Frame event
controller.on('frame', function (data) {
    lastFrame = frame;
    frame = data;
    numberFingers = frame.fingers.length;

    // Clears the window
    c.clearRect(0, 0, width, height);

    // Loops through each hand
    for (var i = 0; i < frame.hands.length; i++) {

        // Setting up the hand
        var hand = frame.hands[i]; // The current hand
        var handPos = leapToScene(hand.palmPosition); // Palm position
        var scaleFactor = hand.scaleFactor(lastFrame, frame);
        var translation = lastFrame.translation(frame);

        /* GESTURES */

        // ZOOM GESTURE - Pinch Motion
        // If there are two fingers and they're separating
        if (numberFingers == 2 & scaleFactor < 1) { // Zoom out
            camera.position.z += (1 - scaleFactor) * 2.5;
        // If there are two fingers and they're closing in
        } else if (numberFingers == 2 & scaleFactor > 1) { // Zoom in
            camera.position.z -= (scaleFactor - 1) * 2.5;
        }

        // ROTATION GESTURE - Movement With Five Fingers
        // If there are five fingers in the screen
        if (numberFingers == 5) {
            console.log('Horizontal direction: '  + translation[0]);    // Y direction; positive down, negative up
            console.log('Vertical direction: ' + translation[1]);    // X direction; positive left, negative right
            console.log('Depth: ' + translation[2]);    // Z direction; positive away, negative towards 

            var tX = translation[1] * .02;    // Scale translation
            var tY = translation[0] * .02;    // Scale translation
            var tZ = translation[2] * .02;    // Scale translation

            rotateAroundObjectAxis(dae, xAxis, tX);
            rotateAroundObjectAxis(dae, yAxis, tY); 
            rotateAroundObjectAxis(dae, xAxis, tX); 
        }

        // POINT GESTURE - Only display pointer when one finger is present
        if (numberFingers == 1) {
            var fingerPos = leapToScene(hand.fingers[0].tipPosition);

            c.strokeStyle = "#FF5A40";
            c.lineWidth = 6;
            c.beginPath();
            c.arc(fingerPos[0], fingerPos[1], 6, 0, Math.PI * 2);
            c.closePath();
            c.stroke();
        }


        // Loops through and draws each finger; Disabled
/**        for (var j = 0; j < hand.fingers.length; j++) {
            var finger = hand.fingers[j]; // Current finger
            var fingerPos = leapToScene(finger.tipPosition); // Finger position

            // Drawing the finger
            c.strokeStyle = "#FF5A40";
            c.lineWidth = 6;
            c.beginPath();
            c.arc(fingerPos[0], fingerPos[1], 6, 0, Math.PI * 2);
            c.closePath();
            c.stroke();

        }
*/  }   // Close Hand loop


    // BUILT-IN GESTURES - Switch case
    for (var k = 0; k < frame.gestures.length; k++) {
        var gesture = frame.gestures[k];
        var type = gesture.type;

        switch (type) {
        case "screenTap":
            onScreenTap(gesture);
            break;
        }
    }

    updateScreenTaps();
    drawScreenTaps();

});

controller.connect();