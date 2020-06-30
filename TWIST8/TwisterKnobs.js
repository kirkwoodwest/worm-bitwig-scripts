function TwisterKnobs(){

   //Controller

   //Banks
   massiveBank = host.createTrackBank(128,0,0,true);
   bank1 = host.createTrackBank(8,0,0,true);
   bank2 = host.createTrackBank(8,0,0,true);
   banks = [bank1, bank2];

   //Cursor
   cursorTracks.push( host.createCursorTrack("CURSOR_TRACK_1", "Top Rows", 0,0, false) );
   cursorTracks.push( host.createCursorTrack("CURSOR_TRACK_2", "Bottom Rows", 0,0, false) );

   //Custom Handler
   trackHandlers.push( new TrackHandler(bank1, cursorTracks[0], massiveBank,0,"TRACK4") );
   trackHandlers.push( new TrackHandler(bank2, cursorTracks[1], massiveBank,0, "TRACK5") );

   //Cursor Device
   follow_mode = CursorDeviceFollowMode.FIRST_DEVICE;

   remoteKnobsTop = [KNOB_A_1, KNOB_A_2, KNOB_A_3, KNOB_A_4, KNOB_A_5, KNOB_A_6, KNOB_A_7, KNOB_A_8];
   remoteKnobsBottom = [KNOB_A_9, KNOB_A_10, KNOB_A_11, KNOB_A_12, KNOB_A_13, KNOB_A_14, KNOB_A_15, KNOB_A_16];

   //Cursur Devices
   cursorDevice1 = cursorTracks[0].createCursorDevice("CURSOR_DEVICE_1", "Top Device", 0, follow_mode); // CursorDeviceFollowMode.FIRST_DEVICE
   cursorDevice2 = cursorTracks[1].createCursorDevice("CURSOR_DEVICE_2", "Bottom Device", 0, follow_mode);
   
   remoteHandlers.push( new RemoteControlHandler(cursorDevice1, cursorDevice1.createCursorRemoteControlsPage(8), remoteKnobsTop, Hardware) );
   remoteHandlers.push( new RemoteControlHandler(cursorDevice2, cursorDevice2.createCursorRemoteControlsPage(8), remoteKnobsBottom, Hardware) );

   //Initialize the color track
   ColorTrackInstance = new ColorTrack(LauncherBankSize, colorTrackName);

   MidiProcesses = [ColorTrackInstance].concat(mftKnobber.remoteHandlers);
  
   //If your reading this... I hope you say hello to a loved one today. <3
   println("TWIST8 Initialized." + new Date());
   println("Now make some dope beats...");
}


// Called when a short MIDI message is received on MIDI input port 0.
function onMidi(status, data1, data2) {
   for(i=0; i< MidiProcesses.length; i++){
      stop_processing = MidiProcesses[i].handleMidi(status, data1, data2);
      if(stop_processing) return;
   }
}
