loadAPI(10);

load('LaunchControlXL.js')
load('TrackHandler.js');
load('RemoteControlHandler.js');
load('../WORM_UTILS/WORM_UTIL.js')

// Remove this if you want to be able to use deprecated methods without causing script to stop.
// This is useful during development.
host.setShouldFailOnDeprecatedUse(true);

host.defineController("Kirkwood West", "WORM_MIX", "0.1", "fa0aaa90-1d67-4080-b3f6-dd01580ac221", "kirkwoodwest");

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

hardware = null
mainTrackHandler = null
loop1TrackHandler = null
loop2TrackHandler = null
loop3TrackHandler = null
trackHandlers = null;
remoteControlHandlers = null;
cursorTrack = null

cursorDevice = null
remoteControlHandler = null

function init() {
   midi_out = host.getMidiOutPort(0);
   midi_in = host.getMidiInPort(0);
   hardware = new LaunchControlXL(midi_out, midi_in, midiHandler);

   //Observe if the project name changes...
   app = host.createApplication();
   app.projectName().addValueObserver(projectNameChanged);

   mainBank = host.createTrackBank(1,0,0,true);
   loop1Bank = host.createTrackBank(1,0,0,true);
   loop2Bank = host.createTrackBank(1,0,0,true);
   loop3Bank = host.createTrackBank(1,0,0,true);
   massiveBank = host.createTrackBank(100,0,0,true);

   mainCursorTrack = host.createCursorTrack("MAIN_CURSOR_TRACK", "Main 1", 0,0, false);
   loop1CursorTrack = host.createCursorTrack("LOOP1_CURSOR_TRACK", "Loop 1", 0,0, false);
   loop2CursorTrack = host.createCursorTrack("LOOP2_CURSOR_TRACK", "Loop 2", 0,0, false);
   loop3CursorTrack = host.createCursorTrack("LOOP3_CURSOR_TRACK", "Loop 3", 0,0, false);

   mainTrackHandler = new TrackHandler(mainBank, mainCursorTrack, massiveBank, FADER_5, "Main 1");
   loop1TrackHandler = new TrackHandler(loop1Bank, loop1CursorTrack, massiveBank, FADER_6, "Loop1");
   loop2TrackHandler = new TrackHandler(loop2Bank, loop2CursorTrack, massiveBank, FADER_7, "Loop2");
   loop3TrackHandler = new TrackHandler(loop3Bank, loop3CursorTrack, massiveBank, FADER_8, "Loop3");
   trackHandlers = [mainTrackHandler, loop1TrackHandler, loop2TrackHandler, loop3TrackHandler];

   println(CursorDeviceFollowMode);
   
   //Cursor Device
   follow_mode = CursorDeviceFollowMode.FIRST_DEVICE;

   mainCursorDevice = mainCursorTrack.createCursorDevice ("MAIN_1_CONTROLS", "Main 1 Remote", 0, follow_mode); // CursorDeviceFollowMode.FIRST_DEVICE
   loop1CursorDevice = loop1CursorTrack.createCursorDevice ("LOOP_1_CONTROLS", "Loop 1 Remote", 0, follow_mode);
   loop2CursorDevice = loop2CursorTrack.createCursorDevice ("LOOP_2_CONTROLS", "Loop 2 Remote", 0, follow_mode);
   loop3CursorDevice = loop3CursorTrack.createCursorDevice ("LOOP_3_CONTROLS", "Loop 3 Remote", 0, follow_mode);
   
  // mainRemoteControlHandlers = new RemoteControlHandler(mainCursorDevice, mainCursorDevice.createCursorRemoteControlsPage(8), [KNOB_3_5, KNOB_2_5]);
   mainRemoteControlHandler  = new RemoteControlHandler(mainCursorDevice,  mainCursorDevice.createCursorRemoteControlsPage(8), [KNOB_3_5, KNOB_2_5]);
   loop1RemoteControlHandler = new RemoteControlHandler(loop1CursorDevice, loop1CursorDevice.createCursorRemoteControlsPage(8), [KNOB_3_6, KNOB_2_6]);
   loop2RemoteControlHandler = new RemoteControlHandler(loop2CursorDevice, loop2CursorDevice.createCursorRemoteControlsPage(8), [KNOB_3_7, KNOB_2_7]);
   loop3RemoteControlHandler = new RemoteControlHandler(loop3CursorDevice, loop3CursorDevice.createCursorRemoteControlsPage(8), [KNOB_3_8, KNOB_2_8]);
   
   remoteControlHandlers = [loop1RemoteControlHandler,mainRemoteControlHandler,  loop2RemoteControlHandler, loop3RemoteControlHandler];
 
   //remoteControlHandlers = [mainRemoteControlHandlers]
   // transport = host.createTransport();
   // .setMidiCallback(onMidi0);
   // host.getMidiInPort(0).setSysexCallback(onSysex0);
   // TODO: Perform further initialization here.


   println("WORM_MIX initialized! TEST");
   println(""  + new Date());
}

// Called when a short MIDI message is received on MIDI input port 0.
function midiHandler(status, data1, data2) {

   for(i=0; i< trackHandlers.length; i++){
      track_handle_success = trackHandlers[i].handleMidi(status, data1, data2);
      if(track_handle_success) return;
   }

   for(i=0; i< remoteControlHandlers.length; i++){
      track_handle_success = remoteControlHandlers[i].handleMidi(status, data1, data2);
      if(track_handle_success) return;
   }

   debug_midi(status, data1, data2, "midiHandler: Message not Handled", true)
}

// Called when a MIDI sysex message is received on MIDI input port 0.
function onSysex0(data) {
   // MMC Transport Controls:
   switch (data) {
      case "f07f7f0605f7":
         transport.rewind();
         break;
      case "f07f7f0604f7":
         transport.fastForward();
         break;
      case "f07f7f0601f7":
         transport.stop();
         break;
      case "f07f7f0602f7":
         transport.play();
         break;
      case "f07f7f0606f7":
         transport.record();
         break;
   }
}

function projectNameChanged(){
   println('projectNameChanged()');
   for(i=0; i< trackHandlers.length; i++){
      host.scheduleTask(doObject(trackHandlers[i], trackHandlers[i].moveToProperTrack), 3000);
   }
}

function flush() {
   // TODO: Flush any output to your controller here.
}

function exit() {

}

function okok(){
  // trackHandler.moveToProperTrack();

}