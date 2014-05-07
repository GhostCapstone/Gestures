(function() {
	'use strict';

	// CONSTANTS
	var KEYTAP_LIFETIME = 0.5;
	var KEYTAP_START_SIZE = 15;
	var SCREENTAP_LIFETIME = 1;
	var SCREENTAP_START_SIZE = 30;
	var LAYER_GESTURE_FRAMES = 30;
	var LAYER_GESTURE_DELTA = 3.0;

	// Globals
	var canvas = document.getElementById('canvas');
	var width = canvas.width;
	var height = canvas.height;
	var c = canvas.getContext('2d');
			c.font = '15pt Arial';
	var controller = new Leap.Controller({enableGestures: true});
	var frame;
	var keyTaps = [];
	var screenTaps = [];
	var detectingLayerGesture = false;
	var layerGestureFrameCount = 0;
	var layerGestureLastPos;
	var layerGestureDirection;

	// animation loop
	controller.on('frame', function(data) {
		frame = data;
		c.clearRect(0, 0, width, height); // reset canvas between frames
		drawHands(frame);
		var direction = detectLayerGesture(frame);
	});

	// returns the direction of the layer direction if detected as a string, otherwise returns null
  function detectLayerGesture(frame) {
    // console.log("detecting layer gesture");
    if(frame.hands.length > 0) {
	    var handPosX = frame.hands[0].palmPosition[0];
	    var palmNormalX = frame.hands[0].palmNormal[0];
	    c.fillText("hand x coord: " + handPosX , 0, 15);
	    c.fillText("num fingers : " + frame.hands[0].fingers.length, 0, 40);
	    c.fillText("palm norm x : " + palmNormalX , 0, 65);

	    //determine if palm is sideways
	    // -1 = left, 1 = right
			if(Math.abs(palmNormalX) > 0.65){ //start detecting gesture
				c.fillText("gesture start" , 0, 90);
				detectingLayerGesture = true;
				if(layerGestureLastPos !== undefined) {
					var prevDir = layerGestureDirection;
					if(handPosX - LAYER_GESTURE_DELTA < layerGestureLastPos && prevDir === layerGestureDirection) {
						// console.log("gesture left");
						c.fillText("gesture left" , 0, 115);

						layerGestureDirection = "left";
					} else if(handPosX + LAYER_GESTURE_DELTA > layerGestureLastPos && prevDir === layerGestureDirection) {
						// console.log("gesture right");
						c.fillText("gesture right" , 0, 115);

						layerGestureDirection = "right";
					} 
					else {
						console.log("gesture dir change");
						c.fillText("gesture dir change" , 0, 115);

						clearLayerGestureStatus();
					}

					// if(prevDir !== layerGestureDirection){
					// 	console.log("quit gesture detection because of change in dir");
					// 	clearLayerGestureStatus();
					// }
				}
				 else {
					console.log("first frame");
				}
				if(detectingLayerGesture === true){
					layerGestureFrameCount++;
				}
				if(layerGestureFrameCount === LAYER_GESTURE_FRAMES) { //gesture detected
					console.log("gesture detected: " + layerGestureDirection);
					// clearLayerGestureStatus();
					return layerGestureDirection;
				}

				layerGestureLastPos = handPosX;
			} else { // palm rotation out of range
				clearLayerGestureStatus();	
				return undefined;
			}
	  } else { // no hands in frame
	  	clearLayerGestureStatus();
	  }
  }

  function clearLayerGestureStatus() {
		detectingLayerGesture = false;
		layerGestureFrameCount = 0;
		layerGestureDirection = undefined;
		layerGestureLastPos = undefined;
  }

	function onSwipe(gesture) {
		var startPos = leapToScene(gesture.startPosition);
		var pos = leapToScene(gesture.position);

		// prepare c
		c.strokeStyle = '#FFA040';
		c.lineWidth = 3;
		c.beginPath();

		c.moveTo(startPos[0], startPos[1]);
		c.lineTo(pos[0], pos[1]);
		c.closePath();
		c.stroke();
	}

	controller.connect();


	function drawHands(frame) {
    // c.clearRect(0, 0, width, height);
    for (var i = 0; i < frame.hands.length; i++) {
      var hand = frame.hands[i];
      var handPos = leapTo2D(frame, hand.palmPosition);
      for (var j = 0; j < hand.fingers.length; j++) {
        //var finger = hand.fingers[j];
        var fingerPos = leapTo2D(frame, hand.fingers[j].tipPosition);

        // draw finger tips
        c.lineWidth = 5;
        c.fillStyle = '#00FF00';
        c.strokeStyle = '#FFFF00';
        c.beginPath();
        c.arc(fingerPos[0], fingerPos[1], 6, 0, Math.PI * 2);
        c.closePath();
        c.stroke();

        // draw finger lines
        c.strokeStyle = '#0000FF';
        c.lineWidth = 3;
        c.beginPath();
        c.moveTo(handPos[0], handPos[1]);
        c.lineTo(fingerPos[0], fingerPos[1]);
        c.closePath();
        c.stroke();
      }


      // draw palm
      c.fillStyle = '#00FF00';
      c.strokeStyle = '#FFFF00';
      c.beginPath();
      c.arc(handPos[0], handPos[1], 10, 0, Math.PI * 2);
      c.closePath();
      c.fill();
    }
  }
	
	// Convert leap coordinates to 2d canvas coords
	function leapToScene (leapPos) {
		// Gets the interaction box of the current frame
		var iBox = frame.interactionBox;

		// Gets the left border and top border of the box
		// In order to convert the position to the proper
		// location for the canvas
		var left = iBox.center[0] - iBox.size[0]/2;
		var top = iBox.center[1] + iBox.size[1]/2;

		// Takes our leap coordinates, and changes them so
		// that the origin is in the top left corner 
		var x = leapPos[0] - left;
		var y = leapPos[1] - top;

		// Divides the position by the size of the box
		// so that x and y values will range from 0 to 1
		// as they lay within the interaction box
		x /= iBox.size[0];
		y /= iBox.size[1];

		// Uses the height and width of the canvas to scale
		// the x and y coordinates in a way that they 
		// take up the entire canvas
		x *= width / 2;
		y *= height / 2;

		// Returns the values, making sure to negate the sign 
		// of the y coordinate, because the y basis in canvas 
		// points down instead of up
		return [ x , -y ];
	}

  function leapTo2D(frame, leapPos) {
    var iBox = frame.interactionBox;
    var left = iBox.center[0] - iBox.size[0] / 2;
    var top = iBox.center[1] + iBox.size[1] / 2;
    var x = (leapPos[0] - left) / iBox.size[0] * width / 2;
    var y = (leapPos[1] - top) / iBox.size[1] * width / 2;

    return [x, -y];
  }

})();