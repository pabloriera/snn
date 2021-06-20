var synth = new Tone.PolySynth().toMaster();

function Voice(note) {
    this.note = note;
}

Voice.prototype.set_note = function (note) {
    this.note = note;
}

Voice.prototype.trigger = function () {
    synth.triggerAttackRelease(this.note, "16n");
}
