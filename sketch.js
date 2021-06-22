settings =
{
  'weight mean': 1000,
  'weight size': 500,
  'dc 1': 0.1,
  'dt': 0.25,
  'circle size': 50,
  'note duration': 0.125,
  'syn type': 0.5,
  'dropout': 0.5
}

gravityConstant = 0.2;
forceConstant = 2000;
mass = 1;

circles = [];
pulses = [];
scopes = [];
voices = [];
scores = [];
NN = null;
n_neurons = 12;

nodes = []
nodeCon = []

clicked = false;
lerpValue = 0.2;

function setup() {
  createCanvas(windowWidth, windowHeight);

  NN = new NeuralNetwork();
  NN.add_neurons(n_neurons);
  NN.add_all_synapses();

  for (let i = 0; i < n_neurons; i++) {
    let x = random(-width * 0.25, width * 0.25)
    let y = random(-height * 0.25, height * 0.25)
    node = new Node(createVector(x, y), mass)
    nodes.push(node);
  }
  closeNode = nodes[0]

  for (let i = 0; i < NN.neurons.length; i++) {
    let voice = new Voice(60 + i * 2, 0.125);
    NN.neurons[i].set_event_callback(function () { voice.trigger(); });
    voices.push(voice);
    let circle = new Circle(nodes[i].pos, settings['circle size']);
    circles.push(circle);
  }

  NN.set_random_weight(1000, 100);
  NN.set_random_delay(1, 0.5);
  NN.set_dropout(0.8);
  NN.set_type_proportion(0.5);

  for (let k = 0; k < NN.synapses.length; k++) {
    let S = NN.synapses[k];
    i = S.from.id;
    j = S.to.id;
    let pulse = new Pulse(circles[i].position, circles[j].position, S.delay);
    S.set_event_callback(pulse.add_event.bind(pulse));
    pulses.push(pulse);
    nodeCon.push([i, j, S.weight / 2.0])
  }


  for (let i = 0; i < NN.neurons.length; i++) {
    scope = new Scope(-width / 2, height / 2 - (i + 1) * 60, width, 40);
    scopes.push(scope);
    score = new Score(-width / 2, height / 2 - (i + 1) * 60, width, 40);
    scores.push(score);
  }

  let gui = new dat.GUI();
  gui.add(settings, 'syn type', 0, 1, 0.01).onChange(
    function () {
      NN.set_type_proportion(this.getValue());
    }
  );
  gui.add(settings, 'weight mean', 0, 1000.0, 10.0).onChange(
    function () {
      NN.set_mean_weight(this.getValue());
      weights_to_nodes();
    }
  );
  gui.add(settings, 'weight size', 0, 500.0, 5).onChange(
    function () {
      NN.set_size_weight(this.getValue());
      weights_to_nodes();
    }
  );
  gui.add(settings, 'dropout', 0, 1.0, 0.01).onChange(
    function () {
      NN.set_dropout(this.getValue());
      weights_to_nodes();
    }
  );
  gui.add(settings, 'dc 1', 0, 500, 0.1);
  gui.addFolder('Vis');
  gui.add(settings, 'circle size', 0, 50, 1).onChange(
    function () {
      for (let i = 0; i < NN.neurons.length; i++) {
        circles[i].diameter = this.getValue();
      }
    }
  );
  gui.add(settings, 'note duration', 0, 4, 0.01).onChange(
    function () {
      for (let i = 0; i < voices.length; i++) {
        voices[i].set_duration(this.getValue());
      }
    }
  );
  gui.add({ 'kick': function () { kick() } }, 'kick');

}

function draw() {
  translate(width / 2, height / 2)
  background(50);

  applyForces(nodes)
  nodes.forEach(node => {
    node.update()
  })

  if (clicked == true && closeNode) {
    let mousePos = createVector(mouseX - width / 2, mouseY - height / 2)
    closeNode.pos.lerp(mousePos, lerpValue)
    if (lerpValue < 0.95) {
      lerpValue += 0.02;
    }
  }

  NN.neurons[0].dc = settings['dc 1'];

  NN.update();

  for (let k = 0; k < NN.synapses.length; k++) {
    let wnorm = map(NN.synapses[k].weight, 0, 2000, 0, 10);
    wnorm = wnorm * !NN.synapses[k].drop;
    pulses[k].draw_line(wnorm)
  }
  for (let i = 0; i < NN.neurons.length; i++) {
    circles[i].draw(NN.neurons[i].Vnorm)
    scopes[i].draw(NN.neurons[i].Vnorm)
    scores[i].draw(NN.neurons[i].spike_event)
  }
  for (let k = 0; k < NN.synapses.length; k++) {
    let wnorm = map(NN.synapses[k].weight, 0, 2000, 0, 10);
    wnorm = wnorm * !NN.synapses[k].drop;
    pulses[k].draw(wnorm)
  }

}

function weights_to_nodes() {
  for (let k = 0; k < NN.synapses.length; k++) {
    let S = NN.synapses[k];
    nodeCon[k][2] = S.weight / 10.0;
  }

}

function mouseReleased() {
  clicked = false
}

function touchStarted() {
  if (clicked == true) {
    clicked = false
    lerpValue = 0.2
  } else {
    clicked = true
    let mousePos = createVector(mouseX - width / 2, mouseY - height / 2)
    let i = 0;
    closeNode = null;
    nodes.forEach((node) => {
      if (dist(node.pos.x, node.pos.y, mousePos.x, mousePos.y) < circles[i].diameter / 2) {
        closeNode = node;
      }
      i++;

    })
  }
}


function windowResized() {
  resizeCanvas(windowWidth, windowHeight);

  for (let i = 0; i < NN.neurons.length; i++) {
    scopes[i].width = width;
    scopes[i].height = height - (i + 1) * 60;
  }

}

document.documentElement.addEventListener(
  "mousedown", function () {
    if (Tone.context.state !== 'running') {
      Tone.context.resume();
    }
  }
)
