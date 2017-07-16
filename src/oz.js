const turf = require('@turf/turf');

class Cylinder {
  constructor(center, radius) {
    this.center = center;
    this.radius = radius;
  }

  checkEnter(c1, c2) {
    if (!this.isInside(c2) || this.isInside(c1))
      return;

    let intersection = turf.lineIntersect(turf.circle(this.center, this.radius / 1000), turf.lineString([c1, c2]));

    return intersection.features[0];
  }

  isInside(coordinate) {
    let distance = turf.distance(coordinate, this.center);
    return distance <= this.radius / 1000;
  }
}

class Line {
  constructor(center, length) {
    this.center = center;
    this.length = length;
  }

  update() {
    let p1 = turf.destination(this.center, this.length / 2000, this.bearing + 90);
    let p2 = turf.destination(this.center, this.length / 2000, this.bearing - 90);

    this.coordinates = [p1.geometry.coordinates, p2.geometry.coordinates];
  }

  checkEnter(c1, c2) {
    let intersection = turf.lineIntersect(turf.lineString(this.coordinates), turf.lineString([c1, c2]));
    if (intersection.features.length === 0)
      return;

    let bearing = turf.bearing(c1, c2);
    let bearingDiff = turf.bearingToAngle(this.bearing - bearing);
    if (bearingDiff > 90 && bearingDiff < 270)
      return;

    return intersection.features[0];
  }
}

module.exports = { Cylinder, Line };
