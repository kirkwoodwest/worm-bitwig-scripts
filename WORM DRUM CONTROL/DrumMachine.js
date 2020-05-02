function DrumMachine(massiveBank, hardware, channel, target_track) {

   this.target_track = target_track;
   
   this.trackBank = host.createTrackBank(1, 0, 0, true);
   this.cursorTrack = host.createCursorTrack("CURSOR_TRACK_" + channel, "Cursor " + channel, 0,0, false);

   //Custom Handler
   this.trackHandler = new TrackHandler(this.trackBank, this.cursorTrack, massiveBank, 0, target_track);
  
   //Cursor Device
   follow_mode = CursorDeviceFollowMode.FIRST_DEVICE;

   DRUM_COL_1 = [BCR_ROW_3_1, BCR_ROW_2_1, BCR_ROW_1_1, BCR_ENCODER_GRP_1_1, BCR_ENCODER_GRP_2_1, BCR_ENCODER_GRP_3_1, BCR_ENCODER_GRP_4_1, BCR_BTN_1_1, BCR_BTN_2_1];
   DRUM_COL_2 = [BCR_ROW_3_2, BCR_ROW_2_2, BCR_ROW_1_2, BCR_ENCODER_GRP_1_2, BCR_ENCODER_GRP_2_2, BCR_ENCODER_GRP_3_2, BCR_ENCODER_GRP_4_2, BCR_BTN_1_2, BCR_BTN_2_2];
   DRUM_COL_3 = [BCR_ROW_3_3, BCR_ROW_2_3, BCR_ROW_1_3, BCR_ENCODER_GRP_1_3, BCR_ENCODER_GRP_2_3, BCR_ENCODER_GRP_3_3, BCR_ENCODER_GRP_4_3, BCR_BTN_1_3, BCR_BTN_2_3];
   DRUM_COL_4 = [BCR_ROW_3_4, BCR_ROW_2_4, BCR_ROW_1_4, BCR_ENCODER_GRP_1_4, BCR_ENCODER_GRP_2_4, BCR_ENCODER_GRP_3_4, BCR_ENCODER_GRP_4_4, BCR_BTN_1_4, BCR_BTN_2_4];
   DRUM_COL_5 = [BCR_ROW_3_5, BCR_ROW_2_5, BCR_ROW_1_5, BCR_ENCODER_GRP_1_5, BCR_ENCODER_GRP_2_5, BCR_ENCODER_GRP_3_5, BCR_ENCODER_GRP_4_5, BCR_BTN_1_5, BCR_BTN_2_5];
   DRUM_COL_6 = [BCR_ROW_3_6, BCR_ROW_2_6, BCR_ROW_1_6, BCR_ENCODER_GRP_1_6, BCR_ENCODER_GRP_2_6, BCR_ENCODER_GRP_3_6, BCR_ENCODER_GRP_4_6, BCR_BTN_1_6, BCR_BTN_2_6];
   DRUM_COL_7 = [BCR_ROW_3_7, BCR_ROW_2_7, BCR_ROW_1_7, BCR_ENCODER_GRP_1_7, BCR_ENCODER_GRP_2_7, BCR_ENCODER_GRP_3_7, BCR_ENCODER_GRP_4_7, BCR_BTN_1_7, BCR_BTN_2_7];
   DRUM_COL_8 = [BCR_ROW_3_8, BCR_ROW_2_8, BCR_ROW_1_8, BCR_ENCODER_GRP_1_8, BCR_ENCODER_GRP_2_8, BCR_ENCODER_GRP_3_8, BCR_ENCODER_GRP_4_8, BCR_BTN_1_8, BCR_BTN_2_8];
   
   //Cursur Devices
   this.cursorDevice = this.cursorTrack.createCursorDevice("CURSOR_DEVICE_" + channel, "Cursor Device " + channel, 0, follow_mode); 
   
   remoteHandler1 = new RemoteControlHandler(this.cursorDevice, this.cursorDevice.createCursorRemoteControlsPage('d1', 8, ''), DRUM_COL_1, channel, hardware, 0);
   remoteHandler2 = new RemoteControlHandler(this.cursorDevice, this.cursorDevice.createCursorRemoteControlsPage('d2', 8, ''), DRUM_COL_2, channel, hardware, 1);
   remoteHandler3 = new RemoteControlHandler(this.cursorDevice, this.cursorDevice.createCursorRemoteControlsPage('d3', 8, ''), DRUM_COL_3, channel, hardware, 2);
   remoteHandler4 = new RemoteControlHandler(this.cursorDevice, this.cursorDevice.createCursorRemoteControlsPage('d4', 8, ''), DRUM_COL_4, channel, hardware, 3);
   remoteHandler5 = new RemoteControlHandler(this.cursorDevice, this.cursorDevice.createCursorRemoteControlsPage('d5', 8, ''), DRUM_COL_5, channel, hardware, 4);
   remoteHandler6 = new RemoteControlHandler(this.cursorDevice, this.cursorDevice.createCursorRemoteControlsPage('d6', 8, ''), DRUM_COL_6, channel, hardware, 5);
   remoteHandler7 = new RemoteControlHandler(this.cursorDevice, this.cursorDevice.createCursorRemoteControlsPage('d7', 8, ''), DRUM_COL_7, channel, hardware, 6);
   remoteHandler8 = new RemoteControlHandler(this.cursorDevice, this.cursorDevice.createCursorRemoteControlsPage('d8', 8, ''), DRUM_COL_8, channel, hardware, 7);

   this.remoteControlHandlers = [remoteHandler1, remoteHandler2, remoteHandler3, remoteHandler4, remoteHandler5, remoteHandler6, remoteHandler7, remoteHandler8];
}

DrumMachine.prototype.handleMidi = function(status, data1, data2) {
   for (var i=0; i<this.remoteControlHandlers.length; i++) {
      var success = this.remoteControlHandlers[i].handleMidi(status, data1, data2);
      if (success == true) return true;
   }
   return false;
}

DrumMachine.prototype.sendMidi = function(status, data1, data2) {
   this.outputPort.sendMidi(status, data1, data2);
}

DrumMachine.prototype.moveToProperTrack = function(){
   for (var i=0; i<this.remoteControlHandlers.length; i++) {
      this.remoteControlHandlers[i].resetPage();
    }
}

DrumMachine.prototype.updateMidiKnobs = function(){
   //TODO: Updates the midi knobs?? 
   println('DrumMachine.prototype.updateMidiKnobs');
   for (var i=0; i<this.remoteControlHandlers.length; i++) {
     this.remoteControlHandlers[i].updateLED();
     println('updateMidiKnobs: ' + i)
   }

}