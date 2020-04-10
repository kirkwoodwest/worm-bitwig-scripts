const KNOB_A_1 = 0x00;
const KNOB_A_2 = 0x01;
const KNOB_A_3 = 0x02;
const KNOB_A_4 = 0x03;
const KNOB_A_5 = 0x04;
const KNOB_A_6 = 0x05;
const KNOB_A_7 = 0x06;
const KNOB_A_8 = 0x07;
const KNOB_A_9 = 0x08;
const KNOB_A_10 = 0x09;
const KNOB_A_11 = 0x0A;
const KNOB_A_12 = 0x0B;
const KNOB_A_13 = 0x0C;
const KNOB_A_14 = 0x0D;
const KNOB_A_15 = 0x0E;
const KNOB_A_16 = 0x0F;

function MidiFighterTwister(outputPort, inputPort, inputCallback) {
   this.outputPort = outputPort;
   this.inputPort = inputPort;
   this.inputPort.setMidiCallback(inputCallback);
}

MidiFighterTwister.prototype.sendMidi = function(status, data1, data2) {
   this.outputPort.sendMidi(status, data1, data2);
}