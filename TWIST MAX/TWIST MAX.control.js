load("Config.js")
load('../WORM_UTILS/WORM_UTIL.js')
load('../WORM_UTILS/ChannelFinder.js')
load("HardwareBasic.js");
load("TwisterTrackSetting.js");
load('RemoteControlHandler.js')
load('ColorTrack.js')

loadAPI(12);

// Remove this if you want to be able to use deprecated methods without causing script to stop.
// This is useful during development.
host.setShouldFailOnDeprecatedUse(true);

host.defineController("Kirkwood West", "TWIST MAX", "0.1", "bc190864-8728-48f1-805e-22761801721b", "kirkwoodwest");

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
cursorDevices = [];

twisterTrackSettings = [];

MidiProcesses = [];

function init() {
   //Setup Host Preferences
   Preferences = host.getPreferences();
   
   PrefColorBankSizeSetting = Preferences.getNumberSetting('Color Bank Size', "Settings", 0,1024,16,'', LauncherBankSize);
   PrefColorBankSizeSetting.addValueObserver(127,settingBankSizeChanged);
   LauncherBankSize = floatToRange(PrefColorBankSizeSetting.get(),1024);
   
   //Sertup Document Preferences
   docstate = host.getDocumentState();
   
   DocColorTrackNameSetting = docstate.getStringSetting('Name', SETTINGS_COLOR_TRACK_NAME,8, 'MFT');
   DocColorTrackNameSetting.addValueObserver(settingColorTrackNameChanged);
   colorTrackName = DocColorTrackNameSetting.get();  
   
   // TWISTER_TRACK_SETTINGS_NAMES 
   // TWISTER_CONTROLLER_ID        
   // TWISTER_CC                   
   
   RescanSettings = docstate.getSignalSetting('Rescan','Rescan Tracks', "Rescan Tracks");
   RescanSettings.addSignalObserver(rescanTracks);

   //Observe if the project name changes...
   app = host.createApplication();
   app.projectName().addValueObserver(rescanTracks);
   
   //Setup our hardware instance.
   Hardware = new MidiFighterTwister(host.getMidiInPort(0), host.getMidiOutPort(0), onMidi);


   //Track Banks
   banks = []

   //Cursor Tracks
   cursorTracks = [];
   cursorDevices = [];
   cursorRemotePages = [];

   //Channel Finders
   channelFinders = [];

   //Cursor Device
   follow_mode = CursorDeviceFollowMode.FIRST_DEVICE;

   //START EMULATION
   for (i=0; i< TWISTER_TRACK_SETTINGS_NAMES.length; i++){       
      track_settings_name = TWISTER_TRACK_SETTINGS_NAMES[i];
      controller_id = TWISTER_CONTROLLER_ID[i];
      page_index = TWISTER_TRACK_TARGET_PAGE_INDEX[i];
      page_count = TWISTER_PAGE_COUNT[i];
      twister_cc = TWISTER_CC[i];
      twister_cc_min = twister_cc[0];
      twister_cc_max = twister_cc[1];

      //knob count
      knob_count = twister_cc_max - twister_cc_min + 1
      
      //Create Banks, Tracks and Cursor Devices...
      bank = host.createTrackBank(1,0,0,true) 
      banks.push(bank);

      cursor_track_controller_id = controller_id + '_' + i;
      cursorTrack = host.createCursorTrack("CURSOR_TRACK_" + i, cursor_track_controller_id, 0,0, false);
      cursorTracks.push(cursorTrack);

      cursor_device_id = "CURSOR_DEVICE_" + i;
      cursorDevice = cursorTrack.createCursorDevice(cursor_device_id, cursor_device_id, 0, follow_mode); // CursorDeviceFollowMode.FIRST_DEVICE
      cursorDevices.push(cursorDevice);
   
     // page_count = 1;
      for(p_index = 0; p_index<page_count;p_index++){

         cc_min = twister_cc_min;
         cc_max = twister_cc_max;

         //more than 8 knobs so we need to calculate offset...
         if ( (twister_cc_max - twister_cc_min) > 8 ) {
            offset = p_index * 8;
            cc_min = twister_cc_min + offset;
            cc_max = twister_cc_min + offset +7;
            knob_count = 8;
         }

         page_index = 0;
    

         println('\n\nknob_count : ' + knob_count + '\n');
         //Custom Remote Handler Class
         cursor_remote_page_id = "CURSOR_REMOTE_" +  i + "_" + p_index;
         cursorRemotePage = cursorDevice.createCursorRemoteControlsPage(cursor_remote_page_id, knob_count,'');
         cursorRemotePages.push(cursorRemotePage);

         remoteHandler = new RemoteControlHandler(cursorDevice, cursorRemotePage , p_index, cc_min, cc_max, Hardware) 
         remoteHandlers.push(remoteHandler);
         
         channelFinder = new ChannelFinder(cursorTrack, bank, track_settings_name);
         channelFinders.push(channelFinder);
   

         target_channel_name = track_settings_name;
         twisterTracKSetting = new TwisterTrackSetting(controller_id+i+p_index,target_channel_name, controller_id, channelFinder);
         twisterTrackSettings.push( twisterTracKSetting );
       
      }

     
   }

   //Initialize the color track
   ColorTrackInstance = new ColorTrack(LauncherBankSize, colorTrackName, TWISTER_COLOR_MIDI_CHANNEL, TWISTER_CC_MIN, TWISTER_CC_MAX);
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

function report(){
   println('report()')
   println('report()' + cursorRemotePages)
   println('report()' + cursorRemotePages.length)
   
   for(var i=0;i<cursorRemotePages.length;i++){
      println('selected page index' + cursorRemotePages[i].selectedPageIndex().get());
      println('selected page count' + cursorRemotePages[i].pageCount().get());

   }
}
function selectPage(page_index){
   println('report()')
   println('report()' + cursorRemotePages)
   println('report()' + cursorRemotePages.length)
   
   for(var i=0;i<cursorRemotePages.length;i++){
      println('selected page index' + cursorRemotePages[i].selectedPageIndex().set(page_index));

   }
}
function resetPages(){
   println('report()')
   println('report()' + cursorRemotePages)
   println('report()' + cursorRemotePages.length)
   
   for(var i=0;i<remoteHandlers.length;i++){
      remoteHandlers[i].resetPage();
      println('selected page index' + cursorRemotePages[i].selectedPageIndex().set(page_index));

   }
}