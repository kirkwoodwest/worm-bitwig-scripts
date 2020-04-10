loadAPI(10);

load('CIRKLON.js')
load('TrackHandler.js')
load('RemoteControlHandler.js')
load('../WORM_UTILS/WORM_UTIL.js')
//load('TrackHandler.js');
//load('RemoteControlHandler.js');
///load('WORM_UTIL.js');
// Remove this if you want to be able to use deprecated methods without causing script to stop.
// This is useful during development.
host.setShouldFailOnDeprecatedUse(true);

host.defineController("Kirkwood West", "WORM CIRKLON CC", "0.1", "9d78afb1-b5ce-4c65-bf46-4bc2ab85ef49", "kirkwoodwest");

host.defineMidiPorts(1, 1);

if (host.platformIsWindows())
{
   // TODO: Set the correct names of the ports for auto detection on Windows platform here
   // and uncomment this when port names are correct.
   // host.addDeviceNameBasedDiscoveryPair(["Input Port 0"], ["Output Port 0"]);
}
else if (host.platformIsMac())
{
   // TODO: Set the correct names of the ports for auto detection on Mac OSX platform here
   // and uncomment this when port names are correct.
   // host.addDeviceNameBasedDiscoveryPair(["Input Port 0"], ["Output Port 0"]);
}
else if (host.platformIsLinux())
{
   // TODO: Set the correct names of the ports for auto detection on Linux platform here
   // and uncomment this when port names are correct.
   // host.addDeviceNameBasedDiscoveryPair(["Input Port 0"], ["Output Port 0"]);
}
trackHandlers = null;
cursorTracks = null;
remoteControlHandlers = null;
hardware = null
trackBank = null
bank1 = null
bank2 = null
bank3 = null
bank4 = null
banks = null
trackHandler1 = null
trackHandler2 = null
trackHandler3 = null
trackHandler4 = null

//Cursur Devic
cursorDevice1 = null
cursorDevice2 = null
cursorDevice3 = null
cursorDevice4 = null
 

function init() {
   midi_out = host.getMidiOutPort(0);
   midi_in = host.getMidiInPort(0);
      
   //Hardware map
   hardware1 = new CIRKLON(midi_out, midi_in, midiHandler1);

   // midi_out = host.getMidiOutPort(1);
   // midi_in = host.getMidiInPort(1);
   // hardware2 = new MidiFighterTwister(midi_out, midi_in, midiHandler2);

   //Observe if the project name changes...
   app = host.createApplication();
   app.projectName().addValueObserver(projectNameChanged);

   //Banks
   massiveBank = host.createTrackBank(128,0,0,true);
   bank1 = host.createTrackBank(1,0,0,true);
   bank2 = host.createTrackBank(1,0,0,true);
   bank3 = host.createTrackBank(1,0,0,true);
   bank4 = host.createTrackBank(1,0,0,true );
   banks = [bank1, bank2];
   
   //, bank3, bank4];

   //Cursor
   cursorTrack1 = host.createCursorTrack("CURSOR_TRACK_1", "Cursor 1", 0,0, false);
   cursorTrack2 = host.createCursorTrack("CURSOR_TRACK_2", "Cursor 2", 0,0, false);
  // cursorTrack3 = host.createCursorTrack("SECOND_CURSOR_3", "Cursor 3", 0,0, false);
  // cursorTrack4 = host.createCursorTrack("SECOND_CURSOR_4", "Cursor 4", 0,0, false);

   //cursorTracks = [cursorTrack1, cursorTrack2, cursorTrack3, cursorTrack4];
   cursorTracks = [cursorTrack1, cursorTrack2];

   //Custom Handler
   trackHandler1 = new TrackHandler(bank1, cursorTrack1, massiveBank,0,"TRACK4");
   trackHandler2 = new TrackHandler(bank2, cursorTrack2, massiveBank,0, "TRACK5");
  // trackHandler3 = new TrackHandler(bank3, cursorTrack3, massiveBank,0, "TRACK6");
  // trackHandler4 = new TrackHandler(bank4, cursorTrack4, massiveBank,0, "TRACK7");

  // trackHandlers = [trackHandler1, trackHandler2, trackHandler3, trackHandler4];
   trackHandlers = [trackHandler1, trackHandler2];

   //Cursor Device
   follow_mode = CursorDeviceFollowMode.FIRST_DEVICE;

   remoteKnobsTop = [KNOB_A_1, KNOB_A_2, KNOB_A_3, KNOB_A_4, KNOB_A_5, KNOB_A_6, KNOB_A_7, KNOB_A_8];
   remoteKnobsBottom = [KNOB_A_9, KNOB_A_10, KNOB_A_11, KNOB_A_12, KNOB_A_13, KNOB_A_14, KNOB_A_15, KNOB_A_16];

   MFT_1_CHANNEL = 1;
   MFT_2_CHANNEL = 11;

   //Cursur Devices
   cursorDevice1 = cursorTrack1.createCursorDevice("CURSOR_DEVICE_1", "Cursor Device 1", 0, follow_mode); // CursorDeviceFollowMode.FIRST_DEVICE
   cursorDevice2 = cursorTrack2.createCursorDevice("CURSOR_DEVICE_2", "Cursor Device 2", 0, follow_mode);
 //  cursorDevice3 = cursorTrack3.createCursorDevice("CURSOR_DEVICE_3", "Cursor Device 3", 0, follow_mode);
 //  cursorDevice4 = cursorTrack4.createCursorDevice("CURSOR_DEVICE_4", "Cursor Device 4", 0, follow_mode);
   
   remoteHandler1  = new RemoteControlHandler(cursorDevice1,  cursorDevice1.createCursorRemoteControlsPage(8), remoteKnobsTop, MFT_1_CHANNEL, hardware1);
   remoteHandler2 = new RemoteControlHandler(cursorDevice2, cursorDevice2.createCursorRemoteControlsPage(8), remoteKnobsBottom, MFT_1_CHANNEL, hardware1);
 //  remoteHandler3  = new RemoteControlHandler(cursorDevice3,  cursorDevice3.createCursorRemoteControlsPage(8), remoteKnobsTop, MFT_2_CHANNEL,hardware2);
 //  remoteHandler4 = new RemoteControlHandler(cursorDevice4, cursorDevice4.createCursorRemoteControlsPage(8), remoteKnobsBottom, MFT_2_CHANNEL, hardware2);
  
   //remoteControlHandlers = [remoteHandler1, remoteHandler2, remoteHandler3, remoteHandler4];
   remoteControlHandlers = [remoteHandler1, remoteHandler2];
   // TODO: Perform further initialization here.
   println("WORM CIRKLON CC initialized!");
   println(""  + new Date());
}

// Called when a short MIDI message is received on MIDI input port 0.
function midiHandler1(status, data1, data2) {
   for(i=0; i< remoteControlHandlers.length; i++){
      track_handle_success = remoteControlHandlers[i].handleMidi(status, data1, data2);
      if(track_handle_success) return;
   }

   debug_midi(status, data1, data2, "midiHandler: Message not Handled", true)
}
// Called when a short MIDI message is received on MIDI input port 0.
function midiHandler2(status, data1, data2) {
   for(i=0; i< remoteControlHandlers.length; i++){
      track_handle_success = remoteControlHandlers[i].handleMidi(status, data1, data2);
      if(track_handle_success) return;
   }

   debug_midi(status, data1, data2, "midiHandler: Message not Handled", true)
}

function projectNameChanged(){
   println('projectNameChanged()');
   for(i=0; i< trackHandlers.length; i++){
      host.scheduleTask(doObject(trackHandlers[i], trackHandlers[i].moveToProperTrack), 3000);
   }
}

// Called when a MIDI sysex message is received on MIDI input port 0.
function onSysex0(data) {

}

function flush() {
   // TODO: Flush any output to your controller here.
}

function exit() {

}