settings =
{
  'avg weight': 1.0,
  'std weight': 0.005,
  'dc 1': 0.1,
  'dt': 0.25,
  'circle size': 100,
}

function setup() {
  createCanvas(windowWidth, windowHeight);

  V1 = new Voice("C4");
  V2 = new Voice("D4");

  N1 = new Neuron();
  N1.set_event_callback(function () { V1.trigger(); })
  D1 = new Circle(createVector(width / 3, 200), 100);

  N2 = new Neuron();
  N2.set_event_callback(function () { V2.trigger(); })
  D2 = new Circle(createVector(width * 2 / 3, 200), 100);

  S12 = new Synapse(N1, N2);
  S12.set_weight_delay(1000, 1);
  D12 = new Pulse(D1.position, D2.position, S12.delay);

  S12.set_event_callback(D12.add_event.bind(D12))

  N1.synapses.push(S12);

  scope1 = new Scope(0, height - 100, width, 40);
  scope2 = new Scope(0, height - 60, width, 40);



  let gui = new dat.GUI();
  gui.add(settings, 'avg weight', 0.01, 1.0, 0.05);
  gui.add(settings, 'std weight', 1, 30.0, 0.05);
  gui.add(settings, 'dc 1', 0, 500, 0.1);
  gui.addFolder('Vis');
  gui.add(settings, 'circle size', 0, 50, 1);
  gui.add({ 'kick': function () { kick() } }, 'kick');

}

function draw() {

  background(50);
  N1.update();
  N1.dc = settings['dc 1'];
  N2.update();
  S12.update();

  D1.draw(N1.Vnorm);
  D2.draw(N2.Vnorm);
  scope1.draw(N1.Vnorm);
  scope2.draw(N2.Vnorm);
  D12.draw();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  scope1.width = width
  scope2.width = width
  scope1.bottom = height - 100
  scope2.bottom = height - 60
}

document.documentElement.addEventListener(
  "mousedown", function () {
    if (Tone.context.state !== 'running') {
      Tone.context.resume();
    }
  }
)
