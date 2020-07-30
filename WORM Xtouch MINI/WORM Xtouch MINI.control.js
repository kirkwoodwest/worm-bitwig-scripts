loadAPI(12);
load('../WORM_UTILS/WORM_UTIL.js')
load('../WORM_UTILS/ChannelFinder.js')
load("HardwareBasic.js");
load('TrackHandler.js')
load('RemoteControlHandler.js')
load('Config.js')

// Remove this if you want to be able to use deprecated methods without causing script to stop.
// This is useful during development.
host.setShouldFailOnDeprecatedUse(true);

host.defineController("Kirkwood West", "WORM Xtouch MINI", "0.2", "766a3bd0-d1b9-11ea-8b6e-0800200c9a66", "kirkwoodwest");

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

const SETTINGS_MAIN_OUTPUT_FIRST_TRACK = 'Main Output First Track';
const SETTINGS_RESAMPLE_OUTPUT_FIRST_TRACK = 'Resample Output First Track';


DocColorTrackNameSetting = null; //Settings for the color track name

DocMainTrackSetting = null//Setting for top track name
DocResampleTrackSetting = null//Setting for bottom track name

//Size of the bank
PrefColorBankSizeSetting = null; //

LauncherBankSize = 128;

Hardware = null //Controller Hardware Instance
ColorTrackInstance = null;

NoteOnStack = 0;  //Determines how many side buttons are pressed

banks = [];
channelFinder = null;
remoteHandlers = [];
cursorTracks = [];
trackHandlers = [];

MidiProcesses = [];

function init() {
   //Setup Host Preferences
   Preferences = host.getPreferences();
   
   //Sertup Document Preferences
   docstate = host.getDocumentState();
   
   DocMainTrackSetting = docstate.getStringSetting('Name', SETTINGS_MAIN_OUTPUT_FIRST_TRACK,8, 'KICK1');
   DocMainTrackSetting.addValueObserver(settingMainTrackNameChanged);
   mainTrackName = DocMainTrackSetting.get();  

   DocResampleTrackSetting = docstate.getStringSetting('Name', SETTINGS_RESAMPLE_OUTPUT_FIRST_TRACK,8, 'RE_KICK1');
   DocResampleTrackSetting.addValueObserver(settingResampleTrackNameChanged);
   resampleTrackName = DocResampleTrackSetting.get();  

   RescanSettings = docstate.getSignalSetting('Rescan','Rescan Tracks', "Rescan Tracks")
   RescanSettings.addSignalObserver(channelFinderRescan);

   //Observe if the project name changes...
   app = host.createApplication();
   app.projectName().addValueObserver(channelFinderRescan);
   
   //Setup our hardware instance.
   Hardware = new HardwareBasic(host.getMidiInPort(0), host.getMidiOutPort(0), onMidi);

   channelFinder = new ChannelFinder();
   //Containers for controls
   banks = []
   cursorTracks = [];

   bank = host.createTrackBank(8,0,0,true);
   cursor_track = host.createCursorTrack("CURSOR_TRACK_1", "Main", 0,0, false);
   cc_min = XTOUCH_MAIN_CC[0];
   cc_max = XTOUCH_MAIN_CC[1];
   track_handler = new TrackHandler(bank, cursor_track, Hardware, cc_min, cc_max);
  
   banks.push(bank); 
   cursorTracks.push(cursor_track);
   trackHandlers.push(track_handler); 

   bank = host.createTrackBank(8,0,0,true);
   cursor_track = host.createCursorTrack("CURSOR_TRACK_2", "Resampler", 0,0, false);
   cc_min = XTOUCH_MAIN_CC[0];
   cc_max = XTOUCH_MAIN_CC[1];
   track_handler = new TrackHandler(bank, cursor_track, Hardware, cc_min, cc_max);

   banks.push(bank); 
   cursorTracks.push(cursor_track);
   trackHandlers.push(track_handler); 


   //Start with selecting the first track handler
   selectTrackHandler(0);

   /* */
   MidiProcesses = trackHandlers;

   host.scheduleTask(channelFinderRescan, 1000);
   
   //If your reading this... I hope you say hello to a loved one today. <3
   println("TWIST8 Initialized." + new Date());
   println("Now make some dope beats...");
}

// Called when a short MIDI message is received on MIDI input port 0.
function onMidi(status, data1, data2) {
  
   if (isNoteOn(status) && data1 == XTOUCH_BTN_A){
      selectTrackHandler(0);
   } else if (isNoteOn(status) && data1 == XTOUCH_BTN_B){
      selectTrackHandler(1);
   }
   for(i=0; i< MidiProcesses.length; i++){
      stop_processing = MidiProcesses[i].handleMidi(status, data1, data2);
      if(stop_processing) return;
   }
}

function selectTrackHandler(id){
   if (id == 0) {
      trackHandlers[0].enable(true);
      trackHandlers[1].enable(false);

      status = 0x90;
      Hardware.sendMidi(status, XTOUCH_BTN_A, 127);
      Hardware.sendMidi(status, XTOUCH_BTN_B, 0);

   } else {
      trackHandlers[0].enable(false);
      trackHandlers[1].enable(true);

      status = 0x90;
      Hardware.sendMidi(status, XTOUCH_BTN_A, 0);
      Hardware.sendMidi(status, XTOUCH_BTN_B, 127);
   }
}

function flush() {
   // TODO: Flush any output to your controller here.
   for(i=0; i< MidiProcesses.length; i++){
      stop_processing = MidiProcesses[i].updateLed();
      if(stop_processing) return;
   }
}

function exit() {

}

/**
 * Preferences Callbacks
*/
function settingBankSizeChanged(){

}

function settingMainTrackNameChanged(value){
   println('value:' + value );
   channelFinder.find(cursorTracks[0], value);

   println('value:' + value );
   channelFinder.findTrackBank(banks[0], value);

   println('value:' + value );
}
function settingResampleTrackNameChanged(value){
   channelFinder.find(cursorTracks[1], value);
   channelFinder.findTrackBank(banks[1], value);
}

function channelFinderRescan(){
   //do nothing...
   mainTrackName = DocMainTrackSetting.get();
   settingMainTrackNameChanged(mainTrackName);

   resampleTrackName = DocResampleTrackSetting.get(); 
   settingResampleTrackNameChanged(resampleTrackName);
}