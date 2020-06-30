function TwisterSurfaceHandler(hardwareSurface, inputPort, midi_channel, cc_base) {

   this.hardwareSurface = hardwareSurface;
   
   var remoteKnobsTop = [KNOB_A_1, KNOB_A_2, KNOB_A_3, KNOB_A_4, KNOB_A_5, KNOB_A_6, KNOB_A_7, KNOB_A_8];
   var remoteKnobsBottom = [KNOB_A_9, KNOB_A_10, KNOB_A_11, KNOB_A_12, KNOB_A_13, KNOB_A_14, KNOB_A_15, KNOB_A_16];
  // var remoteKnobs = [remoteKnobsTop, remoteKnobsBottom];

   this.hardware_knobs = [];

   //Create Knob and pack it into arow
   var knobsTop = []
   for(var i=0;i<remoteKnobsTop.length;i++){
      var knob_name = 'KNOB_' + (remoteKnobsTop[i] + cc_base);
      var knob = this.hardwareSurface.createAbsoluteHardwareKnob(knob_name);
      knob.setAdjustValueMatcher(inputPort.createAbsoluteCCValueMatcher(midi_channel-1, remoteKnobsTop[i] + cc_base));
      println(knob_name);
      knobsTop.push(knob);
   }

   var knobsBottom = []
   for(var i=0;i<remoteKnobsBottom.length;i++){
      var knob_name = 'KNOB_' + (remoteKnobsBottom[i] + cc_base);
      var knob = this.hardwareSurface.createAbsoluteHardwareKnob(knob_name);
      knob.setAdjustValueMatcher(inputPort.createAbsoluteCCValueMatcher(midi_channel-1, remoteKnobsBottom[i] + cc_base));
      knobsBottom.push(knob);
   }
   this.hardware_knobs = [knobsTop, knobsBottom];
}

TwisterSurfaceHandler.prototype.getDeviceKnobs = function(deviceIndex){
   return this.hardware_knobs[deviceIndex]; 
}