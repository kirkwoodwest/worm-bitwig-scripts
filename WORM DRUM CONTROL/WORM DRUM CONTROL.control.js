loadAPI(10);

load('BCR2000.js')
load('TrackHandler.js')
load('RemoteControlHandler.js')
load('../WORM_UTILS/WORM_UTIL.js')
//load('TrackHandler.js');
//load('RemoteControlHandler.js');
///load('WORM_UTIL.js');
// Remove this if you want to be able to use deprecated methods without causing script to stop.
// This is useful during development.
host.setShouldFailOnDeprecatedUse(true);

host.defineController("Kirkwood West", "WORM DRUM CONTROL", "0.1", "e534e523-2b38-4e3d-9958-383006bf7b68", "kirkwoodwest");

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
remoteControlHandlers1 = null;
remoteControlHandlers2 = null;
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
 

const BCR_1_CHANNEL = 1;
const BCR_2_CHANNEL = 2;

function init() {
   midi_out = host.getMidiOutPort(0);
   midi_in = host.getMidiInPort(0);
      
   //Hardware map
   hardware1 = new BCR2000(midi_out, midi_in, midiHandler1);

   //Observe if the project name changes...
   app = host.createApplication();
   app.projectName().addValueObserver(projectNameChanged);

   //Banks
   massiveBank = host.createTrackBank(128,0,0,true);
   bank1 = host.createTrackBank(1,0,0,true);
   bank2 = host.createTrackBank(1,0,0,true);

   banks = [bank1, bank2, bank3, bank4];

   //Cursor
   cursorTrack1 = host.createCursorTrack("CURSOR_TRACK_1", "Cursor 1", 0,0, false);
   cursorTrack2 = host.createCursorTrack("CURSOR_TRACK_2", "Cursor 2", 0,0, false);

   cursorTracks = [cursorTrack1, cursorTrack2];

   //Custom Handler
   trackHandler1 = new TrackHandler(bank1, cursorTrack1, massiveBank,0,"DRUM2");
   trackHandler2 = new TrackHandler(bank2, cursorTrack2, massiveBank,0, "DRUM3");

   trackHandlers = [trackHandler1, trackHandler2]

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
   cursorDevice1 = cursorTrack1.createCursorDevice("CURSOR_DEVICE_1", "Cursor Device 1", 0, follow_mode); // CursorDeviceFollowMode.FIRST_DEVICE
   cursorDevice2 = cursorTrack2.createCursorDevice("CURSOR_DEVICE_2", "Cursor Device 2", 0, follow_mode);
   //cursorDevice3 = cursorTrack3.createCursorDevice("CURSOR_DEVICE_3", "Cursor Device 3", 0, follow_mode);
   //cursorDevice4 = cursorTrack4.createCursorDevice("CURSOR_DEVICE_4", "Cursor Device 4", 0, follow_mode);
   
   remoteHandler1  = new RemoteControlHandler(cursorDevice1, cursorDevice1.createCursorRemoteControlsPage('d1', 4, ''), DRUM_COL_1, BCR_1_CHANNEL, hardware1, 0);
   remoteHandler2 = new RemoteControlHandler(cursorDevice1, cursorDevice1.createCursorRemoteControlsPage('d2', 4, ''), DRUM_COL_2, BCR_1_CHANNEL, hardware1, 1);
   remoteHandler3 = new RemoteControlHandler(cursorDevice1, cursorDevice1.createCursorRemoteControlsPage('d3', 4, ''), DRUM_COL_3, BCR_1_CHANNEL, hardware1, 2);
   remoteHandler4 = new RemoteControlHandler(cursorDevice1, cursorDevice1.createCursorRemoteControlsPage('d4', 4, ''), DRUM_COL_4, BCR_1_CHANNEL, hardware1, 3);
   remoteHandler5 = new RemoteControlHandler(cursorDevice1, cursorDevice1.createCursorRemoteControlsPage('d5', 4, ''), DRUM_COL_5, BCR_1_CHANNEL, hardware1, 4);
   remoteHandler6 = new RemoteControlHandler(cursorDevice1, cursorDevice1.createCursorRemoteControlsPage('d6', 4, ''), DRUM_COL_6, BCR_1_CHANNEL, hardware1, 5);
   remoteHandler7 = new RemoteControlHandler(cursorDevice1, cursorDevice1.createCursorRemoteControlsPage('d7', 4, ''), DRUM_COL_7, BCR_1_CHANNEL, hardware1, 6);
   remoteHandler8 = new RemoteControlHandler(cursorDevice1, cursorDevice1.createCursorRemoteControlsPage('d8', 4, ''), DRUM_COL_8, BCR_1_CHANNEL, hardware1, 7);
   remoteControlHandlers1 = [remoteHandler1, remoteHandler2, remoteHandler3, remoteHandler4, remoteHandler5, remoteHandler6, remoteHandler7, remoteHandler8];
   remoteControlHandlers2 = [];
   /*
   remoteHandler3 = new RemoteControlHandler(cursorDevice1, cursorDevice1.createCursorRemoteControlsPage('d3',4,''), DRUM_COL_3, BCR_1_CHANNEL, hardware1, 2);
   remoteHandler4 = new RemoteControlHandler(cursorDevice1, cursorDevice1.createCursorRemoteControlsPage('d4',4,''), DRUM_COL_4, BCR_1_CHANNEL, hardware1, 3);
   remoteHandler5 = new RemoteControlHandler(cursorDevice1, cursorDevice1.createCursorRemoteControlsPage('d5',4,''), DRUM_COL_5, BCR_1_CHANNEL, hardware1, 4);
   remoteHandler6 = new RemoteControlHandler(cursorDevice1, cursorDevice1.createCursorRemoteControlsPage('d6',4,''), DRUM_COL_6, BCR_1_CHANNEL, hardware1, 5);
   remoteHandler7 = new RemoteControlHandler(cursorDevice1, cursorDevice1.createCursorRemoteControlsPage('d7',4,''), DRUM_COL_7, BCR_1_CHANNEL, hardware1, 6);
   remoteHandler8 = new RemoteControlHandler(cursorDevice1, cursorDevice1.createCursorRemoteControlsPage('d8',4,''), DRUM_COL_8, BCR_1_CHANNEL, hardware1, 7);
  
   remoteControlHandlers1 = [remoteHandler1, remoteHandler2, remoteHandler3, remoteHandler4, remoteHandler5, remoteHandler6, remoteHandler7, remoteHandler8];
   
   remoteHandler1  = new RemoteControlHandler(cursorDevice2, cursorDevice2.createCursorRemoteControlsPage('d1', 4, ''), DRUM_COL_1, BCR_2_CHANNEL, hardware1, 0);
   remoteHandler2 = new RemoteControlHandler(cursorDevice2, cursorDevice2.createCursorRemoteControlsPage('d2', 4, ''), DRUM_COL_2, BCR_2_CHANNEL, hardware1, 1);
   remoteHandler3 = new RemoteControlHandler(cursorDevice2, cursorDevice2.createCursorRemoteControlsPage('d3',4,''), DRUM_COL_3, BCR_2_CHANNEL, hardware1, 2);
   remoteHandler4 = new RemoteControlHandler(cursorDevice2, cursorDevice2.createCursorRemoteControlsPage('d4',4,''), DRUM_COL_4, BCR_2_CHANNEL, hardware1, 3);
   remoteHandler5 = new RemoteControlHandler(cursorDevice2, cursorDevice2.createCursorRemoteControlsPage('d5',4,''), DRUM_COL_5, BCR_2_CHANNEL, hardware1, 4);
   remoteHandler6 = new RemoteControlHandler(cursorDevice2, cursorDevice2.createCursorRemoteControlsPage('d6',4,''), DRUM_COL_6, BCR_2_CHANNEL, hardware1, 5);
   remoteHandler7 = new RemoteControlHandler(cursorDevice2, cursorDevice2.createCursorRemoteControlsPage('d7',4,''), DRUM_COL_7, BCR_2_CHANNEL, hardware1, 6);
   remoteHandler8 = new RemoteControlHandler(cursorDevice2, cursorDevice2.createCursorRemoteControlsPage('d8',4,''), DRUM_COL_8, BCR_2_CHANNEL, hardware1, 7);
  
   remoteControlHandlers2 = [remoteHandler1, remoteHandler2, remoteHandler3, remoteHandler4, remoteHandler5, remoteHandler6, remoteHandler7, remoteHandler8];
  */

   //remoteControlHandlers = [remoteHandler1, remoteHandler2];
   // TODO: Perform further initialization here.
   println("WORM DRUM CONTROL initialized!");
   println(""  + new Date());
}

// Called when a short MIDI message is received on MIDI input port 0.
function midiHandler1(status, data1, data2) {
   if ( MIDIChannel(status) +1 == BCR_1_CHANNEL) {
      for(i=0; i< remoteControlHandlers1.length; i++){
         track_handle_success = remoteControlHandlers1[i].handleMidi(status, data1, data2);
         if(track_handle_success) return;
      }
   }
   if ( MIDIChannel(status) +1 == BCR_2_CHANNEL) {
      for(i=0; i< remoteControlHandlers2.length; i++){
         track_handle_success = remoteControlHandlers2[i].handleMidi(status, data1, data2);
         if(track_handle_success) return;
      }
   }

   debug_midi(status, data1, data2, "midiHandler: Message not Handled", true)
}


function projectNameChanged(){
   println('projectNameChanged()');
   for(i=0; i< trackHandlers.length; i++){
      host.scheduleTask(doObject(trackHandlers[i], trackHandlers[i].moveToProperTrack), 3000);
   }
   for(i=0; i< remoteControlHandlers1.length; i++){
      host.scheduleTask(doObject(remoteControlHandlers1[i], remoteControlHandlers1[i].resetPage), 3000+ (1000*i));
   }
   for(i=0; i< remoteControlHandlers2.length; i++){
      host.scheduleTask(doObject(remoteControlHandlers2[i], remoteControlHandlers2[i].resetPage), 3000+ (1000*i));
   }
}

function updateMidiKnobs(){
   for(i=0; i< remoteControlHandlers1.length; i++){
      track_handle_success = remoteControlHandlers1[i].updateMidiKnobs();
   }
}

function flush() {
   // TODO: Flush any output to your controller here.
}

function exit() {

}