load('../WORM_UTILS/WORM_UTIL.js')
load('../WORM_UTILS/ChannelFinder.js')
load("../Common/HardwareBasic.js");

//Twister Cirklon stuff
load("Config.js")
load("TwisterTrackSetting.js");
load('RemoteControlHandler.js')
load('ColorTrack.js')
load('ParameterSaver.js')

//Xtouch Mini Stuff
load('TrackHandler.js')
load('TurnadoHandler.js')

loadAPI(12);

// Remove this if you want to be able to use deprecated methods without causing script to stop.
// This is useful during development.
host.setShouldFailOnDeprecatedUse(true);

host.defineController("Kirkwood West", "Centrifuge", "0.9", "6564f3e3-616f-488d-8938-073be485c705", "Kirkwood West");

host.defineMidiPorts(3, 3);

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
const SETTINGS_PARAM_TRACK_NAME = 'Parameter Track'

const SETTINGS_MAIN_OUTPUT_FIRST_TRACK = 'Main Output First Track';
const SETTINGS_RESAMPLE_OUTPUT_FIRST_TRACK = 'Resample Output First Track';

const XTOUCH_MODES = {
   MAIN_MIX: 0,
   RESAMPLE_MIX: 1,
   TURNADO: 2,
   PARAM_SAVER: 3,
}

//Turnado Hardcoded names.
turnado_track_names = ['RE_KICK1', 'RE_DRUM2', 'RE_TRACK3', 'RE_TRACK4', 'RE_TRACK5', 'RE_TRACK6', 'RE_TRACK7', 'RE_TRACK8'];


DocColorTrackNameSetting = null; //Settings for the color track name
DocParamSaverTrackNameSetting = null;
DocMainTrackSetting = null    //Setting for Main Tracks on XTouch
DocResampleTrackSetting = null   //Setting for Resample Tracks XTouch

//Size of the bank
PrefColorBankSizeSetting = null; //

LauncherBankSize = 128;

HardwareTwister = null //Controller Instance
HardwareCirklon = null //Controller Instance




paramSaver = null;

channelFinder = null;
remoteHandlers = [];
cursorTracks = [];
cursorDevices = [];

twisterTrackSettings = [];

//Xtouch Turnado
turnadoHandler = null

banks = [];
cursorRemotePages = [];
trackHandlers = [];

ColorTrackInstance = null;


MidiProcesses = [];

function init() {

   //Setup our hardware instance.
   HardwareTwister = new HardwareBasic(host.getMidiInPort(0), host.getMidiOutPort(0), onMidiTwister);
   HardwareCirklon = new HardwareBasic(host.getMidiInPort(1), host.getMidiOutPort(1), onMidiCirklon);
   HardwareXtouch = new HardwareBasic(host.getMidiInPort(2), host.getMidiOutPort(2), onMidiXtouch);

   //Setup Host Preferences
   Preferences = host.getPreferences();
   
   PrefColorBankSizeSetting = Preferences.getNumberSetting('Color Bank Size', "Settings", 0,1024,16,'', LauncherBankSize);
   PrefColorBankSizeSetting.addValueObserver(127,settingBankSizeChanged);
   LauncherBankSize = floatToRange(PrefColorBankSizeSetting.get(),1024);
   
   //Sertup Document Preferences
   docstate = host.getDocumentState();

   //Channel Finder
   channelFinder = new ChannelFinder();
  
   //Rescan Tracks Button
   RescanSettings = docstate.getSignalSetting('Rescan','Rescan Tracks', "Rescan Tracks");
   RescanSettings.addSignalObserver(rescanTracks);

   //Initialize the color track
   ColorTrackInstance = new ColorTrack(HardwareTwister, LauncherBankSize, TWISTER_COLOR_MIDI_CHANNEL, TWISTER_CC_MIN, TWISTER_CC_MAX);
   color_track_cursor_track = ColorTrackInstance.getCursorTrack();
   var color_track_bank = ColorTrackInstance.getTrackBank();
  
   DocColorTrackNameSetting = new TwisterTrackSetting("COLOR_TRACK_NAME", SETTINGS_COLOR_TRACK_NAME, SETTINGS_COLOR_TRACK_NAME, color_track_cursor_track, channelFinder);
  
   twisterTrackSettings.push(DocColorTrackNameSetting);
   // TWISTER_TRACK_SETTINGS_NAMES 
   // TWISTER_CONTROLLER_ID        
   // TWISTER_CC                   

   //Observe if the project name changes...
   app = host.createApplication();
   app.projectName().addValueObserver(rescanTracks);
   
   //Cursor Device
   follow_mode = CursorDeviceFollowMode.FIRST_DEVICE;

   //START EMULATION
   for (var i=0; i< TWISTER_TRACK_SETTINGS_NAMES.length; i++){       
      track_settings_name = TWISTER_TRACK_SETTINGS_NAMES[i];
      controller_id = TWISTER_CONTROLLER_ID[i];
      page_count = TWISTER_PAGE_COUNT[i];
      twister_cc = TWISTER_CC[i];
      twister_cc_min = twister_cc[0];
      twister_cc_max = twister_cc[1];

      //knob count
      knob_count = twister_cc_max - twister_cc_min + 1
      
      cursor_track_controller_id = controller_id + '_' + i;
      cursorTrack = host.createCursorTrack("CURSOR_TRACK_" + i, track_settings_name, 0,0, false);
      channelFinder.setupCursorTracks(cursorTrack);
      cursorTracks.push(cursorTrack);

      cursor_device_id = "CURSOR_DEVICE_" + i;
      cursorDevice = cursorTrack.createCursorDevice(cursor_device_id, track_settings_name + "_DEVICE", 0, follow_mode); // CursorDeviceFollowMode.FIRST_DEVICE
      cursorDevices.push(cursorDevice);
   
     // page_count = 1;
      for(var p_index = 0; p_index<page_count;p_index++){

         cc_min = twister_cc_min;
         cc_max = twister_cc_max;

         //more than 8 knobs so we need to calculate offset...
         if ( (twister_cc_max - twister_cc_min) > 8 ) {
            offset = p_index * 8; //8 parameters possible per page.
            cc_min = twister_cc_min + offset;
            cc_max = twister_cc_min + offset + 7;
            
            //Do not exceed the max number of items.
            if(cc_max > twister_cc_max) cc_max = twister_cc_max;
         
            knob_count = cc_max - cc_min+1;
         }

         //Custom Remote Handler Class
         cursor_remote_page_id = "CURSOR_REMOTE_" +  i + "_" + p_index;
         cursorRemotePage = cursorDevice.createCursorRemoteControlsPage(cursor_remote_page_id, knob_count,'');
         cursorRemotePages.push(cursorRemotePage);

         remoteHandler = new RemoteControlHandler(cursorDevice, cursorRemotePage, p_index, cc_min, cc_max, HardwareTwister, HardwareCirklon) 
         remoteHandlers.push(remoteHandler);      
      }
      
      target_channel_name = TWISTER_TRACK_SETTINGS_NAMES[i];
      twisterTrackSetting = new TwisterTrackSetting(controller_id+i+p_index, target_channel_name, controller_id+i+p_index, cursor_track, channelFinder);
      twisterTrackSettings.push( twisterTrackSetting );
      
   }

   MidiProcesses = [ColorTrackInstance].concat(remoteHandlers);


   var cursor_track = paramSaver.getCursorTrack();
   var track_bank = paramSaver.getTrackBank();
   DocParamSaverTrackNameSetting = new TwisterTrackSetting("PARAM_SAVER_NAME", SETTINGS_PARAM_TRACK_NAME, SETTINGS_PARAM_TRACK_NAME, cursor_track, channelFinder);
   
   MidiProcesses.push(paramSaver);

   //TODO: Build settings for param saver...,
   paramSaver = new ParameterSaver(HardwareTwister, LauncherBankSize, remoteHandlers)

   //XTOUCH MINI 
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

   cursorTracks = [];

   bank = host.createTrackBank(8,0,0,true);

   cursor_track = host.createCursorTrack("CURSOR_TRACK_1", "Main", 0,0, false);
   cc_min = XTOUCH_MAIN_CC[0];
   cc_max = XTOUCH_MAIN_CC[1];

   track_handler = new TrackHandler(bank, cursor_track, Hardware, cc_min, cc_max);
   
   banks.push(bank); 
   cursorTracks.push(cursor_track);
   trackHandlers.push(track_handler); 
   MidiProcesses.push(track_handler);

   bank = host.createTrackBank(8,0,0,true);
   cursor_track = host.createCursorTrack("CURSOR_TRACK_2", "Resampler", 0,0, false);
   cc_min = XTOUCH_MAIN_CC[0];
   cc_max = XTOUCH_MAIN_CC[1];

   track_handler = new TrackHandler(bank, cursor_track, Hardware, cc_min, cc_max);

   banks.push(bank); 
   cursorTracks.push(cursor_track);
   trackHandlers.push(track_handler); 
   MidiProcesses.push(track_handler);

   //Multipage Cursor Remotes for Turnado Implement
   var cc_list = XTOUCH_MAIN_CC_LIST;
   turnadoHandler = new TurnadoHandler(turnado_track_names, cc_list, Hardware);
   MidiProcesses.push(turnadoHandler);

   //Start with selecting the first track handler
   setXtouchMode(XTOUCH_MODES.MAIN_MIX);

   host.scheduleTask(channelFinderRescan, 1000);
      
   //If your reading this... I hope you say hello to a loved one today. <3
   println(new Date());
   println("Connecting to Cirklon...");
   println("Connecting to MidiFighter 1...");
   println("Connecting to MidiFighter 2...");
   println("Connecting to MidiFighter 3...");
   println("Connecting to MidiFighter 4...");
   println("Connecting to MidiFighter (1)...");
   println("Connecting to X Touch MINI...");
   println("Centrifuged Initialized...." );
   println("Let Me Bang." );
}

// Called when a short MIDI message is received on MIDI input port 0.
function onMidiTwister(status, data1, data2) {
   for(i=0; i< MidiProcesses.length; i++){
      stop_processing = MidiProcesses[i].handleMidi(status, data1, data2);
      if(stop_processing) return;
   }
}

// Called when a short MIDI message is received on MIDI input port 1.
function onMidiCirklon(status, data1, data2) {
   //process remote handlers only...
   for(i=0; i< remoteHandlers.length; i++){
      stop_processing = remoteHandlers[i].handleMidi(status, data1, data2);
      if(stop_processing) return;
   }
}

// Called when a short MIDI message is received on MIDI input port 2.
function onMidiXtouch(status, data1, data2) {

   //process remote handlers only...
   if (isNoteOn(status) && data1 == XTOUCH_BTN_A){
      setXtouchMode(XTOUCH_MODES.MAIN_MIX);
      return;
   } else if (isNoteOn(status) && data1 == XTOUCH_BTN_B){
      setXtouchMode(XTOUCH_MODES.RESAMPLE_MIX);
      return;
   } else if (isNoteOn(status) && data1 == XTOUCH_BTN_ROW_2[7]){
      setXtouchMode(XTOUCH_MODES.TURNADO);
      return;
   } else if (isNoteOn(status) && data1 == XTOUCH_BTN_ROW_2[7]){
      setXtouchMode(XTOUCH_MODES.TURNADO);
      return;
   }
   for(i=0; i< MidiProcesses.length; i++){
      stop_processing = MidiProcesses[i].handleMidi(status, data1, data2);
      if(stop_processing) return;
   }

}



function flush() {
   // TODO: Flush any output to your controller here. --> do the remote update here for the LEDs on the midifighter.

   // TODO: Flush any output to your controller here.
   for(i=0; i< MidiProcesses.length; i++){
      stop_processing = MidiProcesses[i].updateLed();
      if(stop_processing) return;
   }
}

function exit() {

}

//Sets the Xtouch Mode and flips all the states...
//This could be abstracted and put in its own class "Xtouch Modes"
function setXtouchMode(id){
   if (id == XTOUCH_MODES.MAIN_MIX) {
      trackHandlers[0].enable(true);
      trackHandlers[1].enable(false);
      turnadoHandler.enable(false);
      parameterSaver.enable(false);

      status = 0x90;
      Hardware.sendMidi(status, XTOUCH_BTN_A, 127);
      Hardware.sendMidi(status, XTOUCH_BTN_B, 0);
      Hardware.sendMidi(status, XTOUCH_BTN_ROW_2[6], 0);
      Hardware.sendMidi(status, XTOUCH_BTN_ROW_2[7], 0);
   } else if (id == XTOUCH_MODES.RESAMPLE_MIX) {
      trackHandlers[0].enable(false);
      trackHandlers[1].enable(true);
      turnadoHandler.enable(false);
      parameterSaver.enable(false);

      status = 0x90;
      Hardware.sendMidi(status, XTOUCH_BTN_A, 0);
      Hardware.sendMidi(status, XTOUCH_BTN_B, 127);
      Hardware.sendMidi(status, XTOUCH_BTN_ROW_2[6], 0);
      Hardware.sendMidi(status, XTOUCH_BTN_ROW_2[7], 0);
   } else if (id == XTOUCH_MODES.TURNADO) {
      trackHandlers[0].enable(false);
      trackHandlers[1].enable(false);
      turnadoHandler.enable(true);
      parameterSaver.enable(false);

      status = 0x90;
      Hardware.sendMidi(status, XTOUCH_BTN_A, 0);
      Hardware.sendMidi(status, XTOUCH_BTN_B, 0);
      Hardware.sendMidi(status, XTOUCH_BTN_ROW_2[6], 0);
      Hardware.sendMidi(status, XTOUCH_BTN_ROW_2[7], 127);
   } else if (id == XTOUCH_MODES.PARAM_SAVER) {
      trackHandlers[0].enable(false);
      trackHandlers[1].enable(false);
      turnadoHandler.enable(false);
      parameterSaver.enable(true);

      status = 0x90;
      Hardware.sendMidi(status, XTOUCH_BTN_A, 0);
      Hardware.sendMidi(status, XTOUCH_BTN_B, 0);
      Hardware.sendMidi(status, XTOUCH_BTN_ROW_2[6], 127);
      Hardware.sendMidi(status, XTOUCH_BTN_ROW_2[7], 0);
   }
}

//-----------------------------------------------------------------------------
// Callbacks
//
function rescanTracks(){

   //Twister Track Retarget
   for(var i=0;i<twisterTrackSettings.length;i++){
      twisterTrackSettings[i].retargetCursor();
   }

   //Xtouch Retarget
   //do nothing...
   mainTrackName = DocMainTrackSetting.get();
   settingMainTrackNameChanged(mainTrackName);

   resampleTrackName = DocResampleTrackSetting.get(); 
   settingResampleTrackNameChanged(resampleTrackName);

   turnadoHandler.retargetNames(channelFinder);  
}

function settingBankSizeChanged(){}

//Main track for xtouch...
function settingMainTrackNameChanged(value){
   channelFinder.find(cursorTracks[0], value);
   channelFinder.findTrackBank(banks[0], value);
}

//Resample track for xtouch...
function settingResampleTrackNameChanged(value){
   channelFinder.find(cursorTracks[1], value);
   channelFinder.findTrackBank(banks[1], value);
}