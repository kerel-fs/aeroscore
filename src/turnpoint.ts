import {ObservationZone} from "./oz";

export class Turnpoint {
    name: string;
    altitude: number;
    location: GeoJSON.Position;
    observationZone: ObservationZone;

    constructor(name: string, altitude: number, location, observationZone) {
    this.name = name;
    this.altitude = altitude;
    this.location = location;
    this.observationZone = observationZone;
  }
}