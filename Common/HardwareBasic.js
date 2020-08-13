// Written by Kirkwood West - kirkwoodwest.com
// (c) 2020
// Licensed under LGPLv3 - http://www.gnu.org/licenses/lgpl-3.0.txt

function HardwareBasic(inputPort, outputPort, inputCallback) {
   this.outputPort 	= outputPort;
   this.inputPort 	= inputPort;
   this.inputPort.setMidiCallback(inputCallback);
}

HardwareBasic.prototype.sendMidi = function(status, data1, data2) {
   this.outputPort.sendMidi(status, data1, data2);
}

HardwareBasic.prototype.sendSysex = function(hexstring) {
   println('sysex:'+hexstring);
   this.outputPort.sendSysex(hexstring);
}