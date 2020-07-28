function HardwareBasic(inputPort, outputPort, inputCallback) {
   this.outputPort 	= outputPort;
   this.inputPort 	= inputPort;
   this.inputPort.setMidiCallback(inputCallback);
}

HardwareBasic.prototype.sendMidi = function(status, data1, data2) {
   this.outputPort.sendMidi(status, data1, data2);
}