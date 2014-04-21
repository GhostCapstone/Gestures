(function() {
	'use strict';

	// CONSTANTS
	var KEYTAP_LIFETIME = 0.5;
	var KEYTAP_START_SIZE = 15;
	var SCREENTAP_LIFETIME = 1;
	var SCREENTAP_START_SIZE = 30;

	// Globals
	var canvas = document.getElementById('canvas');
	var width = canvas.width;
	var height = canvas.height;
	var c = canvas.getContext('2d');
	var controller = new Leap.Controller({enableGestures: true});
	var frame;
	var keyTaps = [];
	var screenTaps = [];

	// animation loop
	controller.on('frame', function(data) {
		frame = data;
		c.clearRect(0, 0, width, height); // reset canvas between frames

		for (var i = 0; i < frame.gestures.length; i++) {
			var gesture = frame.gestures[i];
			var type = gesture.type;
			switch(type) {
				case "circle":
					onCircle(gesture);
					break;

				case "swipe":
					onSwipe(gesture);
					break;
				case "screenTap":
					onScreenTap(gesture);
					break;
				case "keyTap":
					onKeyTap(gesture);
					break;
			}

		}
		updateKeyTaps();
		drawKeyTaps();

		updateScreenTaps();
		drawScreenTaps();
	});

	function onCircle(gesture) {
		// get pos
		var pos = leapToScene(gesture.center);
		var r = gesture.radius;
		var clockwise = false;

		if (gesture.normal[2] <= 0) {
			clockwise = true;
		}

		// Set up style for the stroke, and fill
		c.fillStyle = '#39AECF';
		c.strokeStyle = '39AECF';
		c.lineWidth = 5;

		// draw the circle
		c.beginPath();
		c.arc(pos[0], pos[1], r, 0, Math.PI*2);
		c.closePath();

		if (clockwise) {
			c.stroke();
		} else {
			c.fill();
		}

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

	function onScreenTap(gesture) {
		var pos = leapToScene(gesture.position);
		var time = frame.timestamp;
		screenTaps.push([pos[0], pos[1], time]);
	}

	function onKeyTap(gesture) {
		var pos = leapToScene(gesture.position);
		var time = frame.timestamp;
		// add tuples of x, y, timestamp
		keyTaps.push([pos[0], pos[1], time]);
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
			// draw

			c.strokeStyle = "#FFB300";
			c.lineWidth = 3;

			c.save(); // save context

			c.translate(x, y);

			// Starting x and y
			var left = -SCREENTAP_START_SIZE / 2;
			var top = -SCREENTAP_START_SIZE / 2;
			var localWidth = SCREENTAP_START_SIZE;
			var localHeight = SCREENTAP_START_SIZE;

			// Draw the rectangle
			c.strokeRect(left, top, localWidth, localHeight);

			c.restore(); // Restore context
			// Drawing the non-static part

			var size = SCREENTAP_START_SIZE * timeLeft;
			var opacity =  timeLeft;
			var rotation = timeLeft * Math.PI;

			c.fillStyle = "rgba( 255 , 179 , 0 , " + opacity + ")";

			c.save();

			c.translate(x, y);
			c.rotate(rotation); // spin that square yo

			left = -size / 2;
			top = -size / 2;
			localWidth = size;
			localHeight = size;

			c.fillRect(left, top, localWidth, localHeight);

			c.restore();


		}
	}

	function drawKeyTaps() {
		for (var i = 0; i < keyTaps.length; i++) {
			var keyTap = keyTaps[i];
			var age = frame.timestamp - keyTap[2];
			age /= 1000000;
			var x = keyTap[0];
			var y = keyTap[1];
			var completion = age / KEYTAP_LIFETIME;
			var timeLeft = 1 - completion;
			var opacity = timeLeft;
			var radius = KEYTAP_START_SIZE * timeLeft;

			// drawing static circle
			c.strokeStyle = '#FF2300';
			c.lineWidth = 3;
			c.beginPath();
			c.arc(x, y, KEYTAP_START_SIZE, 0, Math.PI*2);
			c.closePath();
			c.stroke();

			// finger circle
			c.fillStyle = "rgba(256, 33, 0, " + opacity + ")";
			c.arc(x, y, radius, 0, Math.PI*2);
			c.closePath();
			c.fill();
		}
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

	// removes/checks for expired keytaps
	function updateKeyTaps () {
		for (var i = 0; i < keyTaps.length; i++) {
			var keyTap = keyTaps[i];

			// get the difference in time
			var age = frame.timestamp - keyTaps[i][2];
			age /= 1000000;
			if (age >= KEYTAP_LIFETIME) {
				keyTaps.splice(i, 1);
			}
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
		x *= width;
		y *= height;

		// Returns the values, making sure to negate the sign 
		// of the y coordinate, because the y basis in canvas 
		// points down instead of up
		return [ x , -y ];
	}
	controller.connect();
})();