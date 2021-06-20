Synapse.id = 0;

function Synapse(from, to) {
    this.from = from;
    this.to = to;
    this.weight = 0;
    this.delay = 0;
    this.id = Synapse.id++;
}

Synapse.prototype.update = function () {
    this.to.currentBuffer(this.weight, this.delay, this.from);
    if (this.from.spike_event) {
        this.event()
    }
}

Synapse.prototype.set_event_callback = function (cb) {
    this.event_callback = cb;
}

Synapse.prototype.event = function () {
    if (this.event_callback && typeof this.event_callback === "function") {
        this.event_callback();
    }
}

Synapse.prototype.set_random_weight = function (_min, _max) {
    this.weight = rand() * (_max - _min) + _min;
}
Synapse.prototype.set_weight_delay = function (w, d) {
    this.weight = w;
    this.delay = d;
}

function Neuron() {
    this.id = null;
    this.setup();
}

Neuron.id = 0
Neuron.prototype.setup = function () {
    this.id = Neuron.id++;
    this.I = 0;
    this.dc = 0;
    this.Ibuf = 0;
    this.dt = 0.01;
    this.maxIdt = 50;

    this.sp_bufferSize = 128;
    this.sp_buff_ptr = 0;
    this.sp_buff = new Array(this.sp_bufferSize).fill(0);

    this.synapses = []

    this.V = 0;
    this.u = 0;

    this.spike_event = false;
    this.syn_type = 1;
    this.scale_dt = 1;

    this.reset();
}


Neuron.prototype.set_event_callback = function (cb) {
    this.event_callback = cb;
}

Neuron.prototype.event = function () {
    if (this.event_callback && typeof this.event_callback === "function") {
        this.event_callback();
    }
}

Neuron.prototype.reset = function () {
    this.t = 0;
    this.maxV = 30;
    this.minV = -80;

    this.a = 0.02;
    this.b = 0.2;
    this.c = -65;
    this.d = 8;
    this.V = -65;
    this.u = this.b * this.V;

    //Synaptic variables
    this.sp = 0;
    this.s0 = 0;
    this.tau = 0.05;
}

Neuron.prototype.update = function () {

    let I = this.dc + this.Ibuf;

    if (I * this.dt > this.maxIdt)
        I = this.maxIdt / this.dt;

    this.V = this.V + (0.04 * this.V * this.V + 5 * this.V + 140 - this.u + I) * this.dt;
    this.u = this.u + this.a * (this.b * this.V - this.u) * this.dt;

    this.Vnorm = map(this.V, -70, this.maxV, 0, 1);

    this.spike_event = false;

    if (this.V > this.maxV) {
        this.spike_event = true;
        this.V = this.c;
        this.u = this.u + this.d;
        this.s0 = this.syn_type;
        this.event();
    }

    this.sp = this.sp - this.sp * this.dt / this.tau;
    this.sp = this.sp + this.s0;

    this.sp_buff_ptr = (this.sp_buff_ptr + 1) % this.sp_bufferSize
    this.sp_buff[this.sp_buff_ptr] = this.sp;

    this.s0 = 0;
    this.Ibuf = 0;

    return { 'V': this.V, 'Vnorm': this.Vnorm, 'u': this.u, 'spike': this.spike_event };
}

Neuron.prototype.currentBuffer = function (w, d, neuron) {
    let now = neuron.sp_buff_ptr;
    let fr = frameRate();
    let past = now - Math.floor(d * fr);
    // console.log(neuron.sp_buff[now], neuron.sp_buff[past])
    if (past < 0)
        past += neuron.sp_bufferSize;

    this.Ibuf += w * neuron.sp_buff[past];
}

Neuron.prototype.get_vars = function () {
    return { 'V': this.V, 'u': this.u };
}

Neuron.prototype.get_params = function () {
    return { 'a': this.a, 'b': this.b, 'c': this.c, 'd': this.d };
}


Neuron.prototype.set_dc = function (dc_) {
    this.dc = dc_;
    console.log('Current ' + this.dc)
}