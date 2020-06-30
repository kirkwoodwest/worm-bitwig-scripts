loadAPI(10);

load('BCR2000.js')
load('CIRKLON.js')
load('MidiFighterTwister.js')
//load('TrackHandler.js')
load('RemoteControlHandler.js')
load('TwisterSurfaceHandler.js')
load('DrumSurfaceHandler.js')

load('../WORM_UTILS/WORM_UTIL.js')
load('../WORM_UTILS/ChannelFinder.js')
//load('TrackHandler.js');
//load('RemoteControlHandler.js');
///load('WORM_UTIL.js');
// Remove this if you want to be able to use deprecated methods without causing script to stop.
// This is useful during development.
host.setShouldFailOnDeprecatedUse(true);

host.defineController("Kirkwood West", "WORM CIRKLON CC", "0.1", "9d78afb1-b5ce-4c65-bf46-4bc2ab85ef49", "kirkwoodwest");

host.defineMidiPorts(2, 2);

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
const MFT_1_CHANNEL = 1;
  

RescanSettings =null; //Button to rescan settings.
//Cursor Device
const CURSOR_DEVICE_FOLLOW_MODE = CursorDeviceFollowMode.FIRST_DEVICE;

trackBanks = null;
trackHandlers = null;
cursorTracks = null;
remoteHandlers = null;


   //Drum Machine Block..
drumTrackBank = null;
cursorTrack = null;
drumSurfaceHandler = null;
drumChannelFinder = null;
drumCursorDevice = null;
drumRemoteHandlers = null;;

hardware = null;
HardwareCirklon1 = null;
HardwareCirklon2 = null;
hardwareSurface = null;


MFT1topTrackName     = "KICK1"
MFT1bottomTrackName  = "TRACK3"
MFT2topTrackName     = "TRACK4"
MFT2bottomTrackName  = "TRACK5"
MFT3topTrackName     = "TRACK6"
MFT3bottomTrackName  = "TRACK7"
DrumMachineTrackName = "DRUM2"

function init() {


   cirklon1_midi_out = host.getMidiOutPort(0);
   cirklon1_midi_in = host.getMidiInPort(0);

   cirklon2_midi_out = host.getMidiOutPort(1);
   cirklon2_midi_in = host.getMidiInPort(1);

   //Hardware map
   HardwareCirklon1 = new CIRKLON(cirklon1_midi_out, cirklon1_midi_in, midiHandler);
   HardwareCirklon2 = new CIRKLON(cirklon2_midi_out, cirklon2_midi_in, midiHandler);

   hardwareSurface = host.createHardwareSurface();

   //Observe if the project name changes...
   app = host.createApplication();
   app.projectName().addValueObserver(rescanTracks);

   docstate = host.getDocumentState();
   RescanSettings = docstate.getSignalSetting('Rescan','Rescan Tracks', "Rescan Tracks")
   RescanSettings.addSignalObserver(rescanTracks);

   //MidiFighter Twister Stuff
   trackBanks = []
   trackBanks.push( host.createTrackBank(1,0,1,true) );
   trackBanks.push( host.createTrackBank(1,0,1,true) );
   trackBanks.push( host.createTrackBank(1,0,1,true) );
   trackBanks.push( host.createTrackBank(1,0,1,true) );
   trackBanks.push( host.createTrackBank(1,0,1,true) );
   trackBanks.push( host.createTrackBank(1,0,1,true) );

   //Cursor Tracks
   cursorTracks = [];
   cursorTracks.push( host.createCursorTrack("CURSOR_TRACK_0", "MFT1 Top Rows", 0,0, false) );
   cursorTracks.push( host.createCursorTrack("CURSOR_TRACK_1", "MFT1 Bottom Rows", 0,0, false) );
   cursorTracks.push( host.createCursorTrack("CURSOR_TRACK_2", "MFT2 Top Rows", 0,0, false) );
   cursorTracks.push( host.createCursorTrack("CURSOR_TRACK_3", "MFT2 Bottom Rows", 0,0, false) );
   cursorTracks.push( host.createCursorTrack("CURSOR_TRACK_4", "MFT3 Top Rows", 0,0, false) );
   cursorTracks.push( host.createCursorTrack("CURSOR_TRACK_5", "MFT3 Bottom Rows", 0,0, false) );

   //Channel Finders
   channelFinders = [];
   channelFinders.push( new ChannelFinder(cursorTracks[0], trackBanks[0], MFT1topTrackName) );
   channelFinders.push( new ChannelFinder(cursorTracks[1], trackBanks[1], MFT1bottomTrackName) );
   channelFinders.push( new ChannelFinder(cursorTracks[2], trackBanks[2], MFT2topTrackName) );
   channelFinders.push( new ChannelFinder(cursorTracks[3], trackBanks[3], MFT2bottomTrackName) );
   channelFinders.push( new ChannelFinder(cursorTracks[4], trackBanks[4], MFT3topTrackName) );
   channelFinders.push( new ChannelFinder(cursorTracks[5], trackBanks[5], MFT3bottomTrackName) );

   //Cursor Devices
   cursorDevices = []
   cursorDevices.push( cursorTracks[0].createCursorDevice("CURSOR_DEVICE_0", "MFT1 Top Device", 0, CURSOR_DEVICE_FOLLOW_MODE) );
   cursorDevices.push( cursorTracks[1].createCursorDevice("CURSOR_DEVICE_1", "MFT1 Bottom Device", 0, CURSOR_DEVICE_FOLLOW_MODE) );
   cursorDevices.push( cursorTracks[2].createCursorDevice("CURSOR_DEVICE_2", "MFT2 Top Device", 0, CURSOR_DEVICE_FOLLOW_MODE) );
   cursorDevices.push( cursorTracks[3].createCursorDevice("CURSOR_DEVICE_3", "MFT2 Bottom Device", 0, CURSOR_DEVICE_FOLLOW_MODE) );
   cursorDevices.push( cursorTracks[4].createCursorDevice("CURSOR_DEVICE_4", "MFT3 Top Device", 0, CURSOR_DEVICE_FOLLOW_MODE) );
   cursorDevices.push( cursorTracks[5].createCursorDevice("CURSOR_DEVICE_5", "MFT3 Bottom Device", 0, CURSOR_DEVICE_FOLLOW_MODE) );
   
   hardwareSurfaceHandlers = []
   hardwareSurfaceHandlers.push( new TwisterSurfaceHandler(hardwareSurface, HardwareCirklon1.inputPort, 1, 16));
   hardwareSurfaceHandlers.push( new TwisterSurfaceHandler(hardwareSurface, HardwareCirklon1.inputPort, 1, 32));
   hardwareSurfaceHandlers.push( new TwisterSurfaceHandler(hardwareSurface, HardwareCirklon1.inputPort, 1, 48));

   TwisterSurfaceKnobs = [];
   TwisterSurfaceKnobs.push( hardwareSurfaceHandlers[0].getDeviceKnobs(0) );
   TwisterSurfaceKnobs.push( hardwareSurfaceHandlers[0].getDeviceKnobs(1) );
   TwisterSurfaceKnobs.push( hardwareSurfaceHandlers[1].getDeviceKnobs(0) );
   TwisterSurfaceKnobs.push( hardwareSurfaceHandlers[1].getDeviceKnobs(1) );
   TwisterSurfaceKnobs.push( hardwareSurfaceHandlers[2].getDeviceKnobs(0) );
   TwisterSurfaceKnobs.push( hardwareSurfaceHandlers[2].getDeviceKnobs(1) );

   //Remote Handlers
   remoteHandlers = [];
   remoteHandlers.push( new RemoteControlHandler(cursorDevices[0].createCursorRemoteControlsPage(8), TwisterSurfaceKnobs[0]) );
   remoteHandlers.push( new RemoteControlHandler(cursorDevices[1].createCursorRemoteControlsPage(8), TwisterSurfaceKnobs[1]) );
   remoteHandlers.push( new RemoteControlHandler(cursorDevices[2].createCursorRemoteControlsPage(8), TwisterSurfaceKnobs[2]) );
   remoteHandlers.push( new RemoteControlHandler(cursorDevices[3].createCursorRemoteControlsPage(8), TwisterSurfaceKnobs[3]) );
   remoteHandlers.push( new RemoteControlHandler(cursorDevices[4].createCursorRemoteControlsPage(8), TwisterSurfaceKnobs[4]) );
   remoteHandlers.push( new RemoteControlHandler(cursorDevices[5].createCursorRemoteControlsPage(8), TwisterSurfaceKnobs[5]) );


   //Drum Machine Block..
   drumTrackBank = host.createTrackBank(1,0,1,true)
   cursorTrack = host.createCursorTrack("DRUM_CURSOR_TRACK_0", "BCR2000", 0,0, false);

   drumChannelFinder = new ChannelFinder(cursorTrack,drumTrackBank, DrumMachineTrackName);
  
   channel = 1;
   drumSurfaceHandler = new DrumSurfaceHandler(hardwareSurface,HardwareCirklon2.inputPort, channel);

   //Cursur Devices
   drumCursorDevice = this.cursorTrack.createCursorDevice("DRUM_CURSOR_DEVICE_0" + channel, "Drum Cursor Device " + 0, 0, CURSOR_DEVICE_FOLLOW_MODE); 
   
   drumRemoteHandlers = [];
   drumRemoteHandlers.push( new RemoteControlHandler(drumCursorDevice.createCursorRemoteControlsPage('d1', 8, ''), drumSurfaceHandler.getDeviceKnobs(0) ) );
   drumRemoteHandlers.push( new RemoteControlHandler(drumCursorDevice.createCursorRemoteControlsPage('d2', 8, ''), drumSurfaceHandler.getDeviceKnobs(1) ) );
   drumRemoteHandlers.push( new RemoteControlHandler(drumCursorDevice.createCursorRemoteControlsPage('d3', 8, ''), drumSurfaceHandler.getDeviceKnobs(2) ) );
   drumRemoteHandlers.push( new RemoteControlHandler(drumCursorDevice.createCursorRemoteControlsPage('d4', 8, ''), drumSurfaceHandler.getDeviceKnobs(3) ) );
   drumRemoteHandlers.push( new RemoteControlHandler(drumCursorDevice.createCursorRemoteControlsPage('d5', 8, ''), drumSurfaceHandler.getDeviceKnobs(4) ) );
   drumRemoteHandlers.push( new RemoteControlHandler(drumCursorDevice.createCursorRemoteControlsPage('d6', 8, ''), drumSurfaceHandler.getDeviceKnobs(5) ) );
   drumRemoteHandlers.push( new RemoteControlHandler(drumCursorDevice.createCursorRemoteControlsPage('d7', 8, ''), drumSurfaceHandler.getDeviceKnobs(6) ) );
   drumRemoteHandlers.push( new RemoteControlHandler(drumCursorDevice.createCursorRemoteControlsPage('d8', 8, ''), drumSurfaceHandler.getDeviceKnobs(7) ) );
DrumMachineTrackName

   // TODO: Perform further initialization here.
   println("WORM CIRKLON CC initialized!");
   println(""  + new Date());
}

// Called when a short MIDI message is received on MIDI input port 0.
function midiHandler(status, data1, data2) {
}


function rescanTracks(){
   for(i=0; i< channelFinders.length; i++){
      channelFinders[i].find();
   }
   drumChannelFinder.find();
}


function flush() {
   // TODO: Flush any output to your controller here.
}

function exit() {

}