function NeuralNetwork() {
    this.neurons = [];
    this.synapses = [];
}

NeuralNetwork.prototype.add_neuron = function () {

    let N = new Neuron();
    this.neurons.push(N);
}

NeuralNetwork.prototype.add_neurons = function (N) {

    for (let i = 0; i < N; i++) {
        this.add_neuron();
    }
}

NeuralNetwork.prototype.add_synapse = function (from, to) {

    let S = new Synapse(from, to);
    this.synapses.push(S);
}

NeuralNetwork.prototype.add_all_synapses = function () {

    for (let i = 0; i < this.neurons.length; i++) {
        for (let j = 0; j < this.neurons.length; j++) {
            if (i != j) {
                let existed = false;

                for (let k = 0; k < this.synapses.length; k++) {
                    if ((this.synapses[k].from.id == i) && (this.synapses[k].to.id == j)) {
                        existed = true;
                    }
                }

                if (!existed) {
                    this.add_synapse(this.neurons[i], this.neurons[j])
                }

            }
        }
    }
}


NeuralNetwork.prototype.print = function () {
    for (let k = 0; k < this.synapses.length; k++) {
        console.log(k, 'W:', this.synapses[k].weight);
        console.log(k, 'D:', this.synapses[k].delay);
    }
    for (let i = 0; i < this.neurons.length; i++) {
        console.log(i, 'ST:', this.neurons[i].syn_type)
    }
}


NeuralNetwork.prototype.update = function () {
    for (let i = 0; i < this.neurons.length; i++) {
        this.neurons[i].update();
    }
    for (let k = 0; k < this.synapses.length; k++) {
        this.synapses[k].update();
    }
}

NeuralNetwork.prototype.set_type_proportion = function (type_prop) {
    let c = 0;
    for (let i = 0; i < this.neurons.length; i++) {
        this.neurons[i].syn_type = (c < type_prop * this.neurons.length) * 2 - 1;
        c++;
    }
}

NeuralNetwork.prototype.set_dropout = function (prob) {
    for (let k = 0; k < this.synapses.length; k++) {
        let coin = prob > random();
        if (coin)
            this.synapses[k].drop = true;
        else {
            this.synapses[k].drop = false;
        }
    }
}

NeuralNetwork.prototype.set_random_weight = function (mean, size) {

    for (let k = 0; k < this.synapses.length; k++) {
        this.synapses[k].set_random_weight(mean - size / 2, mean + size / 2);
    }
}

NeuralNetwork.prototype.set_random_delay = function (mean, size) {

    for (let k = 0; k < this.synapses.length; k++) {
        this.synapses[k].set_random_delay(mean - size / 2, mean + size / 2);
    }
}

NeuralNetwork.prototype.set_all_w_d = function (weight, delay) {
    for (let k = 0; k < this.synapses.length; k++) {
        this.synapses[k].set_weight_delay(weight, delay);
    }
}

NeuralNetwork.prototype.set_mean_weight = function (mean) {
    let m = 0;
    for (let k = 0; k < this.synapses.length; k++) {
        m += this.synapses[k].weight;
    }
    m = m / this.synapses.length;
    for (let k = 0; k < this.synapses.length; k++) {
        this.synapses[k].weight = this.synapses[k].weight - m + mean;
        if (this.synapses[k].weight < 0)
            this.synapses[k].weight = 0;
    }
}

NeuralNetwork.prototype.set_size_weight = function (size) {
    if (size > 0) {
        let m = 0;
        for (let k = 0; k < this.synapses.length; k++) {
            m += this.synapses[k].weight;
        }
        m = m / this.synapses.length;

        let smin = m;
        let smax = m;
        for (let k = 0; k < this.synapses.length; k++) {
            smin = Math.min(this.synapses[k].weight, smin);
            smax = Math.max(this.synapses[k].weight, smax);
        }

        for (let k = 0; k < this.synapses.length; k++) {
            this.synapses[k].weight = m + (this.synapses[k].weight - m) / (smax - smin) * size;
            if (this.synapses[k].weight < 0)
                this.synapses[k].weight = 0;
        }
    }
}

NeuralNetwork.prototype.reset = function () {
    for (let i = 0; i < this.neurons.length; i++) {
        this.neurons[i].reset();
    }
}

Synapse.id = 0;

function Synapse(from, to) {
    this.from = from;
    this.to = to;
    this.weight = 0;
    this.delay = 0;
    this.id = Synapse.id++;
}

Synapse.prototype.update = function () {
    this.to.currentBuffer(this.weight * !this.drop, this.delay, this.from);
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
    this.weight = Math.random() * (_max - _min) + _min;
}

Synapse.prototype.set_random_delay = function (_min, _max) {
    this.delay = Math.random() * (_max - _min) + _min;
}

Synapse.prototype.set_weight_delay = function (w, d) {
    this.weight = w;
    this.delay = d;
}

Neuron.id = 0

function Neuron() {
    this.id = null;
    this.setup();
}

Neuron.prototype.setup = function () {
    this.id = Neuron.id++;
    this.I = 0;
    this.dc = 0;
    this.Ibuf = 0;
    this.dt = 0.01;
    this.maxIdt = 50;

    this.sp_bufferSize = 256;
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

    if (past > (now - neuron.sp_bufferSize)) {
        if (past < 0) {
            past += neuron.sp_bufferSize;
        }
        this.Ibuf += w * neuron.sp_buff[past];
    }

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