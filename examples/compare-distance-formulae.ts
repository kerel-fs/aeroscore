const turfDistance = require('@turf/distance').default;
import cheapRuler = require('cheap-ruler');

var vincenty = require('node-vincenty');


let p1 = [8.3991667, 49.41]; // 333 BASF Limburgerhof
let p2 = [9.986666667, 49.90111667, ]; // 111 Gramschatz Tv
// let p3 = [9.115, 49.5066667]; // 247 Reisenbach Tv

var results = [];

// Heavasine
{
    let method = 'Heavasine  ';
    let distance = turfDistance(p1, p2);
    results.push({distance, method});
}

// Vincenty inverse
{
let method = 'Vincenty   ';
let distance = vincenty.distVincenty(p1[1], p1[0], p2[1], p2[0]).distance / 1000;
results.push({distance, method});
}

// cheap-ruler approx.
{
let method = 'cheap-ruler';
let ruler = cheapRuler(p1[1]);
let distance = ruler.distance([p1[0], p1[1]], [p2[0], p2[1]]);
results.push({distance, method});
}

results.forEach(function(item, index, array) {
    console.log(item.method + ": " + item.distance.toFixed(20) + " km");
});
