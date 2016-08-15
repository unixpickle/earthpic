(function() {

  function Picture3D(csvData) {
    this._latitudes = [];
    this._rows = {};

    var lines = csvData.split('\n');
    for (var i = 0, len = lines.length; i < len; ++i) {
      if (!lines[i]) {
        break;
      }
      var line = lines[i].split(',');
      if (line.length !== 5) {
        throw new Error('invalid field count: ' + line.length);
      }
      var lat = parseFloat(line[0]);
      var lon = parseFloat(line[1]);
      var r = parseFloat(line[2]);
      var g = parseFloat(line[3]);
      var b = parseFloat(line[4]);

      var idx = this._latitudes.indexOf(lat);
      if (idx < 0) {
        this._latitudes.push(lat);
        this._rows[lat] = [];
      }
      this._rows[lat].push({lon: lon, r: r, g: g, b: b});
    }
  }

  Picture3D.prototype.colorAt = function(lat, lon) {
    var bestLat = 0;
    for (var i = 0, len = this._latitudes.length; i < len; ++i) {
      var theLat = this._latitudes[i];
      if (i === 0 || Math.abs(theLat-lat) < Math.abs(bestLat-lat)) {
        bestLat = theLat;
      }
    }
    var entries = this._rows[bestLat];
    var bestLon = 0;
    var bestEntry = null;
    for (var i = 0, len = entries.length; i < len; ++i) {
      var entry = entries[i];
      if (i === 0 || Math.abs(entry.lon-lon) < Math.abs(bestLon-lon)) {
        bestLon = lon;
        bestEntry = entry;
      }
    }
    var r = Math.round(bestEntry.r * 0xff);
    var g = Math.round(bestEntry.r * 0xff);
    var b = Math.round(bestEntry.r * 0xff);
    return (r << 16) | (g << 8) | b;
  };

  function fetchPicture3D(urlPath, cb) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', urlPath);
    xhr.send(null);
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          try {
            cb(null, new Picture3D(xhr.responseText));
          } catch (e) {
            cb(e, null);
          }
        } else {
          cb('Failed to make request: '+xhr.status, null);
        }
      }
    };
  }

  window.fetchPicture3D = fetchPicture3D;

})();
