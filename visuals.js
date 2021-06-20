
class Circle {
  constructor(position, diameter) {
    this.position = position;
    this.diameter = diameter;
    this.color = 200;
  }
  set_color(color) {
    this.color = color;
  }
  draw(size) {

    if (dist(this.position.x, this.position.y, mouseX, mouseY) < this.diameter / 2 && mouseIsPressed) {
      this.position.x = mouseX;
      this.position.y = mouseY;
    }

    fill(this.color / 1.5);
    stroke(this.color / 1.5);
    circle(this.position.x, this.position.y, this.diameter)
    fill(this.color);
    stroke(this.color);
    circle(this.position.x, this.position.y, map(size, 0, 1, 0, this.diameter, true))
  }
}

class Pulse {
  constructor(p1, p2, delay) {
    this.p1 = p1;
    this.p2 = p2;
    this.delay = delay;
    this.pulses = [];
    this.size = 5;
    this.line = true;
    this.color = 200;
  }
  add_event() {
    this.pulses.push(0);
  }
  set_color(color) {
    this.color = color;
  }
  draw() {
    fill(this.color);
    stroke(this.color);
    let fr = frameRate();
    for (let i = 0; i < this.pulses.length; i++) {
      let t = this.pulses[i];
      // let x = p1.x*t+p2.x*(1-t);
      let p3 = p5.Vector.lerp(this.p1, this.p2, t)
      circle(p3.x, p3.y, this.size)
      this.pulses[i] += this.delay / fr;
    }
    this.pulses = this.pulses.filter(x => x < 1);
    if (this.line) {
      noFill();
      stroke(255);
      bezier(this.p1.x, this.p1.y, this.p2.x, this.p2.y, this.p1.x, this.p1.y, this.p2.x, this.p2.y);
    }
  }
}



// function Pulse(p1, p2, delay) {
//   this.p1 = p1;
//   this.p2 = p2;
//   this.delay = delay;
//   this.pulses = [];
//   this.size = 20;
//   this.dt = p2.dist(p1) / delay;
// }
// Pulse.prototype.add_event = function () {
//   console.log(this.pulses);
//   this.pulses.push(0);
// }
// Pulse.prototype.draw = function () {
//   for (let i = 0; i < this.pulses.length; i++) {
//     let t = this.pulses[i];
//     // let x = p1.x*t+p2.x*(1-t);
//     let p3 = p5.Vector.lerp(this.p1, this.p2, t)
//     circle(p3.x, p3.y, this.size)
//     this.pulses[i] += dt;
//   }
//   this.pulses = this.pulses.filter(x => x < 1);
// }

class Scope {
  constructor(left, bottom, width, height) {
    this.buffer_size = 512
    this.buffer = new Array(this.buffer_size).fill(0);
    this.left = left;
    this.bottom = bottom;
    this.width = width;
    this.height = height;
    this.pt = 0;
    this.color = 200;
  }

  set_color(color) {
    this.color = color;
  }

  draw(y) {
    this.buffer[this.pt] = y;
    this.pt = (this.pt + 1) % this.buffer_size;

    noFill();
    stroke(this.color);

    this.x_prev = 0;
    this.y_prev = this.bottom - this.buffer[0] * this.height;

    for (let i = 1; i < this.buffer_size; i++) {
      let xx = this.left + i / this.buffer_size * this.width;
      let yy = this.buffer[i]
      yy = this.bottom - yy * this.height;
      line(this.x_prev, this.y_prev, xx, yy);
      this.x_prev = xx;
      this.y_prev = yy;
    }
  }
}