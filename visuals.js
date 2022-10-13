
var net_offset_x = 0;
var net_offset_y = 0;
var net_scale = 1.0;


class Circle {
  constructor(position, diameter) {
    this.position = position;
    this.diameter = diameter;
    this.color = color_base;
    this.color_bright = color_bright;
    this.on = true;
  }
  set_color(color) {
    this.color = color;
  }
  draw(size) {

    // if (dist(this.position.x, this.position.y, mouseX, mouseY) < this.diameter / 2 && mouseIsPressed) {
    //   this.position.x = mouseX;
    //   this.position.y = mouseY;
    // }
    if (this.on) {
      push();
      translate(net_offset_x, net_offset_y)
      scale(net_scale)
      fill(this.color);
      stroke(this.color);
      circle(this.position.x, this.position.y, this.diameter)
      fill(this.color_bright);
      stroke(this.color_bright);
      circle(this.position.x, this.position.y, map(size, -0.1, 1, 0, this.diameter, true))
      pop();

    }
  }
}

class Pulse {
  constructor(p1, p2, delay, syn_type) {
    this.p1 = p1;
    this.p2 = p2;
    this.delay = delay;
    this.pulses = [];
    this.size = 5;
    this.line = true;
    this.color = color_base;
    this.on = true;
    this.syn_type = syn_type;
    this.syn_color = syn_colors[syn_type.toString()]
  }
  add_event() {
    this.pulses.push(0);
  }
  set_color(color) {
    this.color = color;
  }
  set_delay(delay) {
    this.delay = delay;
  }
  set_syn_type(syn_type) {
    this.syn_type = syn_type;
    this.syn_color = syn_colors[syn_type.toString()]
  }
  draw(size) {
    if (this.on) {
      push();
      translate(net_offset_x, net_offset_y)
      scale(net_scale)
      fill(this.syn_color);
      stroke(this.syn_color);
      let fr = frameRate();
      for (let i = 0; i < this.pulses.length; i++) {
        let t = this.pulses[i];
        // let x = p1.x*t+p2.x*(1-t);
        let p3 = p5.Vector.lerp(this.p1, this.p2, t)
        circle(p3.x, p3.y, size)
        this.pulses[i] += 1 / fr / (this.delay + 0.001);
      }
      this.pulses = this.pulses.filter(x => x < 1);
      pop()
    }
  }
  draw_line(size) {
    if (this.on) {
      push();
      translate(net_offset_x, net_offset_y)
      scale(net_scale)
      if (this.line) {
        noFill();
        stroke(this.color);
        strokeWeight(size);
        bezier(this.p1.x, this.p1.y, this.p2.x, this.p2.y,
          this.p1.x, this.p1.y, this.p2.x, this.p2.y);
      }
      pop()
    }

  }
}

class Score {
  constructor(left, bottom, width, height) {
    this.buffer_size = 64
    this.buffer = new Array(this.buffer_size).fill(0);
    this.left = left;
    this.bottom = bottom;
    this.width = width;
    this.height = height;
    this.color = color_bright;
    this.pt = 0;

  }

  set_color(color) {
    this.color = color;
  }

  draw(event) {
    if (event)
      event = 1;
    else
      event = 0;

    this.buffer[Math.floor(this.pt)] += event;
    this.pt = this.pt + 64 / 512

    if (this.pt > this.buffer_size) {
      this.pt -= this.buffer_size;
      for (let i = 1; i < this.buffer_size; i++) {
        this.buffer[i] = 0;
      }
    }

    fill(this.color);
    stroke(this.color);

    for (let i = 1; i < this.buffer_size; i++) {
      if (this.buffer[i] > 0) {
        let x = this.left + i / this.buffer_size * this.width;
        strokeWeight(0.5);
        rect(x - 1, this.bottom, 2, this.height);
        // line(x, this.bottom, x, this.height);
      }
    }
  }
}

class Scope {
  constructor(left, bottom, width, height) {
    this.buffer_size = 512
    this.buffer = new Array(this.buffer_size).fill(0);
    this.left = left;
    this.bottom = bottom;
    this.width = width;
    this.height = height;
    this.pt = 0;
    this.color = color_bright;
  }

  set_color(color) {
    this.color = color;
  }

  draw(y) {
    this.buffer[this.pt] = y;
    this.pt = (this.pt + 1) % this.buffer_size;

    noFill();
    stroke(this.color);

    this.x_prev = this.left;
    this.y_prev = this.bottom - this.buffer[0] * this.height;

    for (let i = 1; i < this.buffer_size; i++) {
      let xx = this.left + i / this.buffer_size * this.width;
      let yy = this.buffer[i]
      yy = this.bottom - yy * this.height;
      strokeWeight(0.5);
      line(this.x_prev, this.y_prev, xx, yy);
      this.x_prev = xx;
      this.y_prev = yy;
    }
  }
}