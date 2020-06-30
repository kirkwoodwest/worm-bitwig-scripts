loadAPI(11);
load('../WORM_UTILS/WORM_UTIL.js')
load('../WORM_UTILS/ChannelFinder.js')
load("MidiFighterTwister.js");
load('TrackHandler.js')
load('RemoteControlHandler.js')
load('ColorTrack.js')

// Remove this if you want to be able to use deprecated methods without causing script to stop.
// This is useful during development.
host.setShouldFailOnDeprecatedUse(true);

host.defineController("Kirkwood West", "TWIST8", "0.1", "bc4a769a-c8ae-4164-be46-87ed0bbb038f", "kirkwoodwest");

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

Preferences = null;

KnobSettingEnum = ["Device", "Track Volumes"];

//Setting for knobs, do they control a row of tracks or first 8 parameters of a device?
PrefTopKnobsSetting = null; 
PrefBottomKNobsSetting = null;

const SETTINGS_COLOR_TRACK_NAME = 'Color Track';
const SETTINGS_TOP_TRACK_NAME = 'Top Track';
const SETTINGS_BOTTOM_TRACK_NAME = 'Bottom Track';

DocColorTrackNameSetting = null; //Settings for the color track name
DocTopTrackNameSetting = null//Setting for top track name
DocBottomTrackNameSetting = null//Setting for bottom track name

//Size of the bank
PrefColorBankSizeSetting = null; //

LauncherBankSize = 128;

Hardware = null //Controller Hardware Instance
ColorTrackInstance = null;

NoteOnStack = 0;  //Determines how many side buttons are pressed

channelFinders = [];
remoteHandlers = [];
cursorTracks = [];

MidiProcesses = [];

function init() {
   //Setup Host Preferences
   Preferences = host.getPreferences();
   
   //TODO: Refactor this...
   settingCCBaseNumber = Preferences.getNumberSetting('Base CC', "Settings", 0,127,16,'', 0);
   settingCCBaseNumber.addValueObserver(127,ccBaseNumberChanged);
   var ccBase = floatToRange(settingCCBaseNumber.get());
   
   PrefColorBankSizeSetting = Preferences.getNumberSetting('Color Bank Size', "Settings", 0,1024,16,'', LauncherBankSize);
   PrefColorBankSizeSetting.addValueObserver(127,settingBankSizeChanged);
   LauncherBankSize = floatToRange(PrefColorBankSizeSetting.get(),1024);
   
   //Sertup Document Preferences
   docstate = host.getDocumentState();
   
   DocColorTrackNameSetting = docstate.getStringSetting('Name', SETTINGS_COLOR_TRACK_NAME,8, 'MFT');
   DocColorTrackNameSetting.addValueObserver(settingColorTrackNameChanged);
   colorTrackName = DocColorTrackNameSetting.get();  

   DocTopTrackNameSetting = docstate.getStringSetting('Name', SETTINGS_TOP_TRACK_NAME,8, 'Inst 1');
   DocTopTrackNameSetting.addValueObserver(settingTopTrackNameChanged);
   topTrackName = DocTopTrackNameSetting.get();  

   DocBottomTrackNameSetting = docstate.getStringSetting('Name', SETTINGS_BOTTOM_TRACK_NAME,8, 'Inst 2');
   DocBottomTrackNameSetting.addValueObserver(settingBottomTrackNameChanged);
   bottomTrackName = DocBottomTrackNameSetting.get();  

   RescanSettings = docstate.getSignalSetting('Rescan','Rescan Tracks', "Rescan Tracks")
   RescanSettings.addSignalObserver(rescanTracks);

   //Observe if the project name changes...
   app = host.createApplication();
   app.projectName().addValueObserver(rescanTracks);
   
   //Setup our hardware instance.
   Hardware = new MidiFighterTwister(host.getMidiInPort(0), host.getMidiOutPort(0), onMidi);

   //Track Banks
   banks = []
   banks.push( host.createTrackBank(1,0,0,true) );
   banks.push( host.createTrackBank(1,0,0,true) );

   //Cursor Tracks
   cursorTracks = [];
   cursorTracks.push( host.createCursorTrack("CURSOR_TRACK_1", "Top Rows", 0,0, false) );
   cursorTracks.push( host.createCursorTrack("CURSOR_TRACK_2", "Bottom Rows", 0,0, false) );

   //Channel Finders
   channelFinders = [];
   channelFinders.push( new ChannelFinder(cursorTracks[0], banks[0], topTrackName) );
   channelFinders.push( new ChannelFinder(cursorTracks[1], banks[1], bottomTrackName) );
  
   //Cursor Device
   follow_mode = CursorDeviceFollowMode.FIRST_DEVICE;

   remoteKnobsTop = [KNOB_A_1, KNOB_A_2, KNOB_A_3, KNOB_A_4, KNOB_A_5, KNOB_A_6, KNOB_A_7, KNOB_A_8];
   remoteKnobsBottom = [KNOB_A_9, KNOB_A_10, KNOB_A_11, KNOB_A_12, KNOB_A_13, KNOB_A_14, KNOB_A_15, KNOB_A_16];

   //Cursor Devices
   cursorDevice1 = cursorTracks[0].createCursorDevice("CURSOR_DEVICE_1", "Top Device", 0, follow_mode); // CursorDeviceFollowMode.FIRST_DEVICE
   cursorDevice2 = cursorTracks[1].createCursorDevice("CURSOR_DEVICE_2", "Bottom Device", 0, follow_mode);
   
   //Remote Handlers
   remoteHandlers.push( new RemoteControlHandler(cursorDevice1, cursorDevice1.createCursorRemoteControlsPage(8), remoteKnobsTop, Hardware) );
   remoteHandlers.push( new RemoteControlHandler(cursorDevice2, cursorDevice2.createCursorRemoteControlsPage(8), remoteKnobsBottom, Hardware) );

   remoteHandlers[0].setCCBase(ccBase);
   remoteHandlers[1].setCCBase(ccBase);

   //Initialize the color track
   ColorTrackInstance = new ColorTrack(LauncherBankSize, colorTrackName);
   ColorTrackInstance.setCCBase(ccBase);

   MidiProcesses = [ColorTrackInstance].concat(remoteHandlers);
  

   
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

function flush() {
   // TODO: Flush any output to your controller here.
}

function exit() {

}

/**
 * Project Callbacks.
 */
function rescanTracks(){
   //Project Name CHanged
   for(i=0; i< channelFinders.length; i++){
      host.scheduleTask(doObject(channelFinders[i], channelFinders[i].find), 3000 + (i*200));
   }
   ColorTrackInstance.channelFinder.find();
}

/**
 * Preferences Callbacks
*/

/**
 * Called when the cc base has changed via settings...
 * @param {int} value 
 */
function ccBaseNumberChanged(value) {
   var ccBase = floatToRange(settingCCBaseNumber.get());
   for(i=0;i<remoteHandlers.length;i++){
      remoteHandlers[i].setCCBase(ccBase);
   }
   ColorTrackInstance.setCCBase(ccBase);
}

function settingBankSizeChanged(){

}

function settingColorTrackNameChanged(value){
   ColorTrackInstance.setName(value);
}

function settingTopTrackNameChanged(value){
   channelFinders[0].find(value);
}
function settingBottomTrackNameChanged(value){
   channelFinders[1].find(value);
}