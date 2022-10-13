// var synth = new Tone.PolySynth().toDestination();

const synth = new Tone.Sampler({
    urls: {
        A1: "A1.mp3",
        A2: "A2.mp3",
    },
    baseUrl: "https://tonejs.github.io/audio/casio/",

}).toDestination();

function Voice(note, duration) {
    this.set_note(note);
    this.set_duration(duration);
}

Voice.prototype.set_midi_note = function (note) {
    this.note = Tone.Frequency(note, "midi");
}

Voice.prototype.set_note = function (note) {
    this.note = Tone.Frequency(note);
}

Voice.prototype.set_duration = function (duration) {
    this.duration = Tone.Time(duration).toNotation();
}

Voice.prototype.trigger = function () {
    synth.triggerAttackRelease(this.note, this.duration);
}
