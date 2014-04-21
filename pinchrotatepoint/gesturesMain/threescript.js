if (!Detector.webgl) Detector.addGetWebGLMessage();

var container, stats;

var camera, scene, renderer, objects, controls;
var particleLight, pointLight;
var dae, skin;

var loader = new THREE.ColladaLoader();
loader.options.convertUpAxis = true;
loader.load('./models/collada/human/Skull.dae', function (collada) {

	dae = collada.scene;
	skin = collada.skins[0];

	dae.scale.x = dae.scale.y = dae.scale.z = .3;
	dae.updateMatrix();

	init();
	animate();

});


function init() {

	container = document.getElementById('container');

	camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 10000);	
			camera.position.x = 0;
			camera.position.y = 4;
			camera.position.z = 12;
			camera.up.x = 0;
			camera.up.y = 1;
			camera.up.z = 0;

	// Trackball Controls
	controls = new THREE.TrackballControls(camera);
	controls.rotateSpeed = 1.0;
	controls.zoomSpeed = 1.2;
	controls.panSpeed = 0.8;

	controls.noZoom = false;
	controls.noPan = false;

	controls.staticMoving = true;
	controls.dynamicDampingFactor = 0.3;

	controls.keys = [65, 83, 68];

	controls.addEventListener('change', render);

	scene = new THREE.Scene();

	// Grid

	var size = 14,
		step = 1;

	var geometry = new THREE.Geometry();
	var material = new THREE.LineBasicMaterial({
		color: 0x303030
	});

	for (var i = -size; i <= size; i += step) {

		geometry.vertices.push(new THREE.Vector3(-size, -0.04, i));
		geometry.vertices.push(new THREE.Vector3(size, -0.04, i));

		geometry.vertices.push(new THREE.Vector3(i, -0.04, -size));
		geometry.vertices.push(new THREE.Vector3(i, -0.04, size));

	}

	var line = new THREE.Line(geometry, material, THREE.LinePieces);
	scene.add(line);

	// Add the COLLADA

	scene.add(dae);

	particleLight = new THREE.Mesh(new THREE.SphereGeometry(4, 8, 8), new THREE.MeshBasicMaterial({
		color: 0xffffff
	}));
	scene.add(particleLight);

	// Lights

	scene.add(new THREE.AmbientLight(0xcccccc));

	var directionalLight = new THREE.DirectionalLight( /*Math.random() * 0xffffff*/ 0xeeeeee);
	directionalLight.position.x = Math.random() - 0.5;
	directionalLight.position.y = Math.random() - 0.5;
	directionalLight.position.z = Math.random() - 0.5;
	directionalLight.position.normalize();
	scene.add(directionalLight);

	pointLight = new THREE.PointLight(0x696969, 4);
	pointLight.position = particleLight.position;
	scene.add(pointLight);

	renderer = new THREE.WebGLRenderer();
	renderer.setSize(window.innerWidth, window.innerHeight);

	container.appendChild(renderer.domElement);

	stats = new Stats();
	stats.domElement.style.position = 'absolute';
	stats.domElement.style.top = '0px';
	container.appendChild(stats.domElement);

	//

	window.addEventListener('resize', onWindowResize, false);

}

function onWindowResize() {

	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	renderer.setSize(window.innerWidth, window.innerHeight);

}

//

var t = 0;
var clock = new THREE.Clock();

function animate() {

	requestAnimationFrame(animate);
	controls.update();

	render();
	stats.update();

}

function render() {

	var timer = Date.now() * 0.0005;

	camera.lookAt(scene.position);

	particleLight.position.x = Math.sin(timer * 4) * 3009;
	particleLight.position.y = Math.cos(timer * 5) * 4000;
	particleLight.position.z = Math.cos(timer * 4) * 3009;

	renderer.render(scene, camera);

}