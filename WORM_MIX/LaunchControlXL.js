const FIRST_CTRL_PLAYBACK = 0x29;
const FIRST_CTRL_STOP = 0x2A;
const FIRST_BTN_B_1 = 0x49;
const FIRST_BTN_B_2 = 0x4A;
const FIRST_BTN_B_3 = 0x4B;
const FIRST_BTN_B_4 = 0x4C;
const FIRST_BTN_B_5 = 0x4D;

const FIRST_CTRL_KNOB_1 = 0x31;
const FIRST_CTRL_KNOB_2 = 0x32;
const FIRST_CTRL_KNOB_3 = 0x33;
const FIRST_CTRL_KNOB_4 = 0x34;
const FIRST_CTRL_KNOB_5 = 0x35;

const FADER_1 = 0x4D;
const FADER_2 = 0x4E;
const FADER_3 = 0x4F;
const FADER_4 = 0x50;
const FADER_5 = 0x51;
const FADER_6 = 0x52;
const FADER_7 = 0x53;
const FADER_8 = 0x54;

const KNOB_1_1 = 0x0D;
const KNOB_1_2 = 0x0E;
const KNOB_1_3 = 0x0F;
const KNOB_1_4 = 0x10;
const KNOB_1_5 = 0x11;
const KNOB_1_6 = 0x12;
const KNOB_1_7 = 0x13;
const KNOB_1_8 = 0x14;

const KNOB_2_1 = 0x1D;
const KNOB_2_2 = 0x1E;
const KNOB_2_3 = 0x1F;
const KNOB_2_4 = 0x20;
const KNOB_2_5 = 0x21;
const KNOB_2_6 = 0x22;
const KNOB_2_7 = 0x23;
const KNOB_2_8 = 0x24;

const KNOB_3_1 = 0x31;
const KNOB_3_2 = 0x32;
const KNOB_3_3 = 0x33;
const KNOB_3_4 = 0x34;
const KNOB_3_5 = 0x35;
const KNOB_3_6 = 0x36;
const KNOB_3_7 = 0x37;
const KNOB_3_8 = 0x38;

const FIRST_CTRL_MIDI_CHANNEL = 9 
const FIRST_CTRL_MIDI_CHANNEL_OFFSET = FIRST_CTRL_MIDI_CHANNEL - 1

function LaunchControlXL(outputPort, inputPort, inputCallback) {
   this.portOut = outputPort;
   this.portIn = inputPort;
   this.portIn.setMidiCallback(inputCallback);
}

LaunchControlXL.prototype.updateLED = function(note, isOn){
   led_on_message = 0x90 + FIRST_CTRL_MIDI_CHANNEL_OFFSET
   this.portOut.sendMidi(led_on_message, note, isOn ? 100:0)
}