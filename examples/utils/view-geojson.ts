const tempWrite = require('temp-write');
const opn = require('opn');

export function viewGeoJSON(geojson: any, enls: number[], enl_times: Date[]) {
  let html = `<html>
<head>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.1.0/dist/leaflet.css"/>
  <style>
  body { margin: 0; }
  #mapid { height: 100%; }
  </style>
</head>
<body>
  <div id="map">
    <div id="mapid"></div>
  </div>
  <div id="baro">
  </div>

  <script src="https://unpkg.com/leaflet@1.1.0/dist/leaflet.js"></script>
  <script src='https://unpkg.com/@turf/turf/turf.min.js'></script>
  <script src='https://unpkg.com/plotly.js@1.48.3/dist/plotly.min.js'></script>
  <script>
  var json = ${JSON.stringify(geojson)};
  var bbox = turf.bbox(json);

  var map = L.map('map').fitBounds([
    [bbox[1], bbox[0]],
    [bbox[3], bbox[2]],
  ]);

  L.control.scale().addTo(map);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: 'Map data © <a href="http://openstreetmap.org">OpenStreetMap</a> contributors',
  }).addTo(map);

  L.geoJSON(json, {
    style: function (feature) {
      return {
        color: feature.properties.color || 'blue',
        opacity: feature.properties.opacity || 0.35,
      };
    }
  }).addTo(map);


var enls = ${JSON.stringify(enls)};
var enl_times = ${JSON.stringify(enl_times)};

var trace1 = {
  x: enl_times,
  y: enls,
  type: 'scatter'
};

var data = [trace1];

Plotly.newPlot('baro', data);
  </script>
</body>
</html>`;

  let path = tempWrite.sync(html, 'map.html');

  opn(path, { wait: false });
}
