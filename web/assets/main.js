(function() {

  var SIZE = {width: 400, height: 300};
  var VIEW_ANGLE = 45;
  var NEAR = 0.1;
  var FAR = 10000;
  var WHITE = 0xffffff;

  function App(picture) {
    this.picture = picture;
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
    this.registerMouseEvents();
    this.draw();
  }

  App.prototype.draw = function() {
    this.renderer.render(this.scene, this.camera);
  };

  App.prototype.createGlobe = function() {
    // Courtesy of https://github.com/mrdoob/three.js/issues/465
    this.sphere = new THREE.SphereGeometry(100, 100, 100);
    for (var i = 0, len = this.sphere.faces.length; i < len; ++i) {
      var face = this.sphere.faces[i];
      face.color.setHex(Math.random() * 0xffffff);
    }
    this.mesh = new THREE.Mesh(this.sphere,
      new THREE.MeshLambertMaterial({vertexColors: THREE.FaceColors}));
    this.sphere.__dirtyColors = true;
    this.scene.add(this.mesh);
  };

  App.prototype.createLight = function() {
    var light = new THREE.DirectionalLight(WHITE);
    light.position.x = 0;
    light.position.y = 0;
    light.position.z = 100;
    this.scene.add(light);
  };

  App.prototype.registerMouseEvents = function() {
    this.container.addEventListener('mousedown', function(downEvent) {
      var oldMatrix = new THREE.Matrix4();
      oldMatrix.copy(this.mesh.matrix);

      var upListener, moveListener;
      upListener = function() {
        window.removeEventListener('mouseup', upListener);
        window.removeEventListener('mousemove', moveListener);
      }.bind(this);
      moveListener = function(moveEvent) {
        var xChange = moveEvent.clientX - downEvent.clientX;
        var yChange = -(moveEvent.clientY - downEvent.clientY);
        var axis = new THREE.Vector3(-yChange, xChange, 0);
        var radians = axis.length() / 120;
        var rotation = new THREE.Matrix4();
        rotation.makeRotationAxis(axis.normalize(), radians);
        this.mesh.matrix.copy(oldMatrix);
        this.mesh.matrix.premultiply(rotation);
        this.mesh.rotation.setFromRotationMatrix(this.mesh.matrix);
        this.draw();
      }.bind(this);
      window.addEventListener('mouseup', upListener);
      window.addEventListener('mousemove', moveListener);
    }.bind(this));
  };

  window.addEventListener('load', function() {
    window.fetchPicture3D('assets/pictures/image1_1.csv', function(err, pic) {
      if (err) {
        alert('Error: ' + err);
      } else {
        new App(pic);
      }
    });
  });

})();
