
settings =
{
  'weight mean': 1000,
  'weight size': 500,
  'delay mean': 1,
  'delay size': .001,
  'dt': 0.25,
  'circle size': 50,
  'note duration': 0.125,
  'note volume': -12,
  'syn type': 0.5,
  'dropout': 0.5,
  'net': true,
  'scale': {},
  'dc all': 0.0,
  'noise': 0,
  'knobs': false,
  'syn tau': 0.05
}

var syn_colors;
var color_base;
var color_bright

i = 0;
marginx = 50
gravityConstant = 1;
forceConstantRepulsive = 10000;
forceConstantAttractive = 0.00005;
mass = 1;
knobR = 20
score_sep = (12 - n_neurons) * 5 + 60

var net_score_border
circles = [];
pulses = [];
knobs = [];
scopes = [];
voices = [];
scores = [];
NN = null;

nodes = []
nodeCon = []

clicked = false;
lerpValue = 0.2;

// scale = ["A4",]
escala_mayor = ['D3', 'E3', 'F#3', 'G#3', 'A3', 'B3', 'C#4', 'D4', 'E4', 'F#4', 'G#4', 'A4']
escala_menor = ['D3', 'E3', 'F3', 'G3', 'A3', 'B3', 'C4', 'D4', 'E4', 'F4', 'G4', 'A4']
drumnotes = ['A1', 'B1', 'C2', 'D2', 'E2', 'F2', 'G2', 'A2', 'B2']

function setup() {
  net_score_border = (net_scale - 0.6) * windowWidth
  createCanvas(windowWidth, windowHeight);
  colorMode(HSB, 100);
  syn_colors = { '-1': color(0, 80, 100), '1': color(20, 80, 100) };
  color_base = color(0, 0, 70)
  color_bright = color(0, 0, 100)
  console.log('Setup')

  NN = new NeuralNetwork();
  NN.add_neurons(n_neurons);
  NN.add_all_synapses();


  NN.set_random_weight(settings['weight mean'], settings['weight size']);
  NN.set_random_delay(settings['delay mean'], settings['delay size']);
  NN.set_dropout(settings['dropout']);
  NN.set_type_proportion(settings['syn type']);



  for (let i = 0; i < n_neurons; i++) {
    let x = random(-width * 0.25, width * 0.25)
    let y = random(-height * 0.25, height * 0.25)
    node = new Node(createVector(x, y), mass)
    nodes.push(node);
  }
  closeNode = nodes[0]

  for (let i = 0; i < NN.neurons.length; i++) {
    if (i < escala_mayor.length)
      nota = escala_mayor[i]
    else
      nota = escala_mayor[0]
    let voice = new Voice(nota, 1 / 16);
    NN.neurons[i].set_event_callback(function () { voice.trigger(); });
    voices.push(voice);
    let circle = new Circle(nodes[i].pos, settings['circle size']);
    circles.push(circle);
    settings['dc ' + (i + 1)] = 0
  }


  for (let k = 0; k < NN.synapses.length; k++) {
    let S = NN.synapses[k];
    i = S.from.id;
    j = S.to.id;
    syn_type = NN.neurons[i].syn_type
    let pulse = new Pulse(circles[i].position, circles[j].position, S.delay, syn_type);
    S.set_event_callback(pulse.add_event.bind(pulse));
    pulses.push(pulse);
    nodeCon.push([i, j, S.weight])

    // let y = NN.neurons.length - j + 1
    // let x = -i + (NN.neurons.length - 1) * 0.5
    let x = i
    let y = j
    let knob = new Knob(knobR * x * 2.2 - 200, knobR * y * 2.2 - width / 5, knobR, 0)
    knob.set_callback(function (v) {
      if (v * 2000 < 10)
        v = 0;
      S.set_weight(v * 2000);
      weights_to_nodes(false);
    })
    knobs.push(knob)
  }

  for (let i = 0; i < NN.neurons.length; i++) {
    let y = -i * score_sep + (NN.neurons.length - 1) * score_sep / 2
    scope = new Scope(-width / 2 + net_score_border, y, width - net_score_border - marginx, 40);
    scopes.push(scope);
    score = new Score(-width / 2 + net_score_border, y, width - net_score_border - marginx, 40);
    scores.push(score);
  }

  var gui = new dat.GUI();
  const netFolder = gui.addFolder('Network');
  netFolder.open()
  netFolder.add(settings, 'syn type', 0, 1, 0.01).onChange(
    function () {
      NN.set_type_proportion(this.getValue());
      for (let k = 0; k < NN.synapses.length; k++) {
        let S = NN.synapses[k];
        i = S.from.id;
        j = S.to.id;
        syn_type = NN.neurons[i].syn_type
        pulses[k].set_syn_type(syn_type)
      }
    }
  );
  netFolder.add(settings, 'weight mean', 0, 2000.0, 10.0).onChange(
    function () {
      NN.set_mean_weight(this.getValue());
      weights_to_nodes(true);
    }
  );
  netFolder.add(settings, 'weight size', 0, 1000.0, 10).onChange(
    function () {
      NN.set_size_weight(this.getValue());
      weights_to_nodes(true);
    }
  );
  netFolder.add(settings, 'delay mean', 0.01, 2.0, 0.001).onChange(
    function () {
      NN.set_mean_delay(this.getValue());
      delay_to_pulses();
    }
  );
  netFolder.add(settings, 'delay size', 0.001, 0.5, 0.001).onChange(
    function () {
      NN.set_size_delay(this.getValue());
      delay_to_pulses();
    }
  );
  netFolder.add(settings, 'syn tau', 0, 0.1, 0.001).onChange(
    (val) => {
      for (let i = 0; i < NN.neurons.length; i++) {
        NN.neurons[i].set_syn_tau(val)
      }
    }
  );

  // netFolder.add(settings, 'delay all', 0.02, 10.0, 0.01).onChange(
  //   (val) => {
  //     NN.set_all_delay(val);
  //     for (let k = 0; k < NN.synapses.length; k++) {
  //       let S = NN.synapses[k];
  //       delay = S.delay
  //       pulses[k].set_delay(delay)
  //     }
  //     weights_to_nodes(true);
  //   }
  // );
  netFolder.add(settings, 'dropout', 0, 1.0, 0.01).onChange(
    function () {
      NN.set_dropout(this.getValue());
      weights_to_nodes(true);
    }
  );
  netFolder.add(settings, 'knobs').onChange(
    (val) => {
      NN.print()
      for (let k = 0; k < NN.synapses.length; k++) {
        knobs[k].on = val;
      }
    }
  );
  const currentFolder = gui.addFolder('Currents');

  currentFolder.add(settings, 'noise', 0, 500, 1)

  currentFolder.add(settings, 'dc all', 0, 1000, 0.1).onChange(
    (val) => {
      for (let i = 0; i < NN.neurons.length; i++) {
        settings['dc ' + (i + 1)] = val;
        // console.log(gui.__folders['Currents'].__controllers[i + 1])
        gui.__folders['Currents'].__controllers[i + 2].setValue(val)
      }
    }
  );
  for (let i = 0; i < NN.neurons.length; i++) {
    currentFolder.add(settings, 'dc ' + (i + 1), 0, 1000, 0.1);
  }

  const visFolder = gui.addFolder('Vis');
  visFolder.open()
  const visnetFolder = visFolder.addFolder('Net');
  visnetFolder.open()
  visnetFolder.add(settings, 'net').onChange(
    (val) => {
      for (let i = 0; i < NN.neurons.length; i++) {
        circles[i].on = val;
      }
      for (let k = 0; k < NN.synapses.length; k++) {
        pulses[k].on = val;
      }
    }
  );
  visnetFolder.add(settings, 'circle size', 0, 50, 1).onChange(
    function () {
      for (let i = 0; i < NN.neurons.length; i++) {
        circles[i].diameter = this.getValue();
      }
    }
  );
  const sndFolder = gui.addFolder('Sound');
  sndFolder.open()
  sndFolder.add(settings, 'note duration', .01, 1, 0.01).onChange(
    function () {
      for (let i = 0; i < voices.length; i++) {
        voices[i].set_duration(this.getValue());
      }
    }
  );
  sndFolder.add(settings, 'note volume', -24, 0, 1).onChange(
    (val) => { synth.volume.value = val }
  )
  sndFolder.add(settings, 'scale', { Drum: 'drum', Major: 'major', Minor: 'minor', Harmonics: 'harmonics' }).onChange(
    (val) => {
      var notes;
      if (val == 'drum') {
        synth = drum
        notes = drumnotes
      }
      else if (val == 'major') {
        synth = casio
        notes = escala_mayor
      }
      else if (val == 'menor') {
        synth = casio
        notes = escala_menor
      }
      else if (val == 'harmonics') {
        synth = casio
        notes = Array(NN.neurons.length).fill().map((v, i) => 25 * (i + 1) + "Hz");
      }
      console.log(notes)
      for (let i = 0; i < voices.length; i++) {
        if (i < notes.length)
          voices[i].set_note(notes[i]);
      }
    }
  )
  // gui.add({ 'kick': function () { kick() } }, 'kick');
  windowResized()
}

function draw() {
  translate(width / 2, height / 2)
  background(20);

  i += 1;
  if (i % 100)
    applyForces(nodes)

  nodes.forEach(node => {
    node.update()
  })

  if (clicked == true && closeNode) {
    let mousePos = createVector(mouseX - width / 2 - net_offset_x, mouseY - height / 2 - net_offset_y)
    closeNode.pos.lerp(mousePos, lerpValue)
    if (lerpValue < 0.95) {
      lerpValue += 0.02;
    }
  }

  for (let i = 0; i < NN.neurons.length; i++) {
    NN.neurons[i].dc = settings['dc ' + (i + 1)];
    NN.neurons[i].noise = settings['noise'];
  }

  NN.update();

  for (let k = 0; k < NN.synapses.length; k++) {
    let wnorm = map(NN.synapses[k].weight, 0, 2000, 0, 10);
    // console.log(NN.synapses[k].weight, wnorm)
    wnorm = wnorm * !NN.synapses[k].drop;
    pulses[k].draw_line(Math.sqrt(wnorm) * 2)
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
  for (let k = 0; k < NN.synapses.length; k++) {
    knobs[k].draw(mouseX - width / 2, mouseY - height / 2)
  }

}

function weights_to_nodes(propagate) {
  for (let k = 0; k < NN.synapses.length; k++) {
    let S = NN.synapses[k];
    nodeCon[k][2] = S.weight;
    if (propagate)
      knobs[k].set_value(map(S.weight, 0, 2000, 0, 1))
  }
}

function delay_to_pulses() {
  for (let k = 0; k < NN.synapses.length; k++) {
    let S = NN.synapses[k];
    delay = S.delay
    pulses[k].set_delay(delay)
  }
}

function mouseReleased() {
  clicked = false
  for (let k = 0; k < NN.synapses.length; k++) {
    knobs[k].mouseReleased()
  }
}

function touchStarted() {
  if (clicked == true) {
    clicked = false
    lerpValue = 0.2
  } else {
    clicked = true
    // let mousePos = createVector(mouseX - width / 2, mouseY - height / 2)
    let mousePos = createVector(mouseX - width / 2 - net_offset_x, mouseY - height / 2 - net_offset_y)

    let i = 0;
    closeNode = null;
    nodes.forEach((node) => {
      if (dist(node.pos.x, node.pos.y, mousePos.x, mousePos.y) < circles[i].diameter / 2) {
        closeNode = node;
      }
      i++;

    })
  }
  for (let k = 0; k < NN.synapses.length; k++) {
    let mousePos = createVector(mouseX - width / 2, mouseY - height / 2)
    knobs[k].mousePressed(mouseX - width / 2, mouseY - height / 2)
  }
}


function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  net_score_border = (net_scale - 0.5) * width
  net_offset_x = -windowWidth / 2 + net_score_border / 2;
  for (let i = 0; i < NN.neurons.length; i++) {
    // scopes[i].width = windowWidth;
    // scopes[i].height = windowHeight / NN.neurons.length;
  }

}

document.documentElement.addEventListener(
  "mousedown", function () {
    if (Tone.context.state !== 'running') {
      Tone.context.resume();
    }
  }
)
