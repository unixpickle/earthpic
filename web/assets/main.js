(function() {

  var SIZE = {width: 400, height: 300};
  var VIEW_ANGLE = 45;
  var NEAR = 0.1;
  var FAR = 10000;
  var WHITE = 0xffffff;

  function App() {
    this.container = document.getElementById('view');
    this.renderer = new THREE.WebGLRenderer();
    this.camera = new THREE.PerspectiveCamera(VIEW_ANGLE,
      SIZE.width/SIZE.height, NEAR, FAR);
    this.scene = new THREE.Scene();

    this.scene.add(this.camera);
    this.camera.position.z = 300;
    this.renderer.setSize(SIZE.width, SIZE.height);
    this.container.appendChild(this.renderer.domElement);

    this.createGlobe();
    this.createLight();
    this.renderer.render(this.scene, this.camera);
  }

  App.prototype.createGlobe = function() {
    // Courtesy of https://github.com/mrdoob/three.js/issues/465
    var sphere = new THREE.SphereGeometry(100, 100, 100);
    for (var i = 0, len = sphere.faces.length; i < len; ++i) {
      var face = sphere.faces[i];
      face.color.setHex(Math.random() * 0xffffff);
    }
    var mesh = new THREE.Mesh(sphere,
      new THREE.MeshLambertMaterial({vertexColors: THREE.FaceColors}));
    sphere.__dirtyColors = true;
    this.scene.add(mesh);
  };

  App.prototype.createLight = function() {
    var light = new THREE.DirectionalLight(WHITE);
    light.position.x = 0;
    light.position.y = 0;
    light.position.z = 100;
    this.scene.add(light);
  };

  window.addEventListener('load', function() {
    new App();
  });

})();
