class Aircraft {

 constructor(lat, lng) {
// other assignment
    this.positions = [
       [lat, lng]
    ]
 }

  draw(layer) {
    // algo to draw a line based on all
    // the lat,lng in the positions
    //  1. how to draw a line in leaflet

  }

  addPosition(lat, lng) {

    this.positions.push([lat,lng]);
  }

}