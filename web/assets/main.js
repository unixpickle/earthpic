(function() {

  var SIZE = {width: 300, height: 300};
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
    this.container.innerHTML = '';
    this.container.style.backgroundColor = 'black';
    this.container.appendChild(this.renderer.domElement);

    this.createGlobe();
    this.createLight();
    this.registerMouseEvents();
    if ('ontouchstart' in document.documentElement) {
      this.registerTouchEvents();
    }
    this.draw();

    var centerButton = document.getElementById('center-button');
    centerButton.addEventListener('click', this.recenter.bind(this));
  }

  App.prototype.draw = function() {
    this.renderer.render(this.scene, this.camera);
  };

  App.prototype.recenter = function() {
    var rotAxis = this.rotationAxis();
    var rotAngle = this.rotationAngle();

    var startMatrix = new THREE.Matrix4();
    startMatrix.copy(this.mesh.matrix);

    var startTime = new Date().getTime();
    var updateFunc = function() {
      var elapsed = (new Date().getTime() - startTime) / 500;
      if (elapsed > 1 || elapsed < 0) {
        elapsed = 1;
      } else {
        window.requestAnimationFrame(updateFunc);
      }
      var rotMatrix = new THREE.Matrix4();
      rotMatrix.makeRotationAxis(rotAxis, -rotAngle*elapsed);
      this.mesh.matrix.copy(startMatrix);
      this.mesh.matrix.premultiply(rotMatrix);
      this.mesh.rotation.setFromRotationMatrix(this.mesh.matrix);
      this.draw();
    }.bind(this);
    updateFunc();
  };

  App.prototype.createGlobe = function() {
    this.sphere = new THREE.SphereGeometry(100, 360, 360);
    for (var i = 0, len = this.sphere.faces.length; i < len; ++i) {
      var face = this.sphere.faces[i];
      var lat = Math.asin(face.normal.y);
      var lon = -Math.acos(face.normal.x / Math.cos(lat));

      if (face.normal.z < 0) {
        lon *= -1;
      }

      lat *= 180 / Math.PI;
      lon *= 180 / Math.PI;

      var color = this.picture.colorAt(lat, lon);
      face.color.setHex(color);
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

  App.prototype.mouseRotate = function(startMatrix, xChange, yChange) {
    var axis = new THREE.Vector3(-yChange, xChange, 0);
    var radians = axis.length() / 120;
    var rotation = new THREE.Matrix4();
    rotation.makeRotationAxis(axis.normalize(), radians);
    this.mesh.matrix.copy(startMatrix);
    this.mesh.matrix.premultiply(rotation);
    this.mesh.rotation.setFromRotationMatrix(this.mesh.matrix);
    this.draw();
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
        this.mouseRotate(oldMatrix, xChange, yChange);
      }.bind(this);
      window.addEventListener('mouseup', upListener);
      window.addEventListener('mousemove', moveListener);
    }.bind(this));
  };

  App.prototype.registerTouchEvents = function() {
    var startEvent, oldMatrix;
    this.container.addEventListener('touchstart', function(e) {
      e.preventDefault();
      startEvent = e;
      oldMatrix = new THREE.Matrix4();
      oldMatrix.copy(this.mesh.matrix);
    }.bind(this));
    this.container.addEventListener('touchmove', function(e) {
      e.preventDefault();
      var xChange = e.pageX - startEvent.pageX;
      var yChange = -(e.pageY - startEvent.pageY);
      this.mouseRotate(oldMatrix, xChange, yChange);
    }.bind(this));
  };

  App.prototype.rotationAxis = function() {
    var almostOne = 1 - 1e-5;

    // Find the approximate nullspace of the matrix
    // (rotation - identity), giving the eigenvector
    // with eigenvalue 1.
    var rotation = new THREE.Matrix4();
    rotation.extractRotation(this.mesh.matrix);
    rotation.elements[0] -= almostOne;
    rotation.elements[5] -= almostOne;
    rotation.elements[10] -= almostOne;

    var invRot = new THREE.Matrix4();
    invRot.getInverse(rotation);
    var eigenvector = [Math.random(), Math.random(), Math.random()];
    invRot.applyToVector3Array(eigenvector);

    var axisVec = new THREE.Vector3(eigenvector[0], eigenvector[1], eigenvector[2]);
    axisVec.normalize();

    // Make sure the axis vector points the same direction
    // across successive calls to rotationAxis, since there
    // are two valid directions it could face.
    if (axisVec.x < 0) {
      axisVec.multiplyScalar(-1);
    }

    return axisVec;
  };

  App.prototype.rotationAngle = function() {
    var axis = this.rotationAxis();
    var orthog = [-axis.y, axis.x, 0];

    var rotation = new THREE.Matrix4();
    rotation.extractRotation(this.mesh.matrix);
    rotation.applyToVector3Array(orthog);

    var oldVec = new THREE.Vector3(-axis.y, axis.x, 0);
    var newVec = new THREE.Vector3(orthog[0], orthog[1], orthog[2]);

    // Figure out which direction the angle needs to
    // be applied in.
    var angle = oldVec.angleTo(newVec);
    oldVec.applyAxisAngle(axis, angle);
    var dist1 = oldVec.distanceTo(newVec);
    oldVec.applyAxisAngle(axis, -2*angle);
    var dist2 = oldVec.distanceTo(newVec);

    if (dist1 < dist2) {
      return angle;
    } else {
      return -angle;
    }
  };

  window.addEventListener('load', function() {
    window.fetchPicture3D('assets/pictures/compressed05_05.csv', function(err, pic) {
      if (err) {
        alert('Error: ' + err);
      } else {
        new App(pic);
      }
    });
  });

})();
