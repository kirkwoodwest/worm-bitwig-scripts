load('../Common/HardwareBasic.js')
load('../WORM_UTILS/WORM_UTIL.js')
load('../WORM_UTILS/ChannelFinder.js')
load('ResamplerHandler.js')
load('RemoteControlHandler.js')
load('Psp42Handler.js')
load('LoopLengthHandler.js')
load('TrackSendHandler.js')
load('Config.js')
loadAPI(12);


// Remove this if you want to be able to use deprecated methods without causing script to stop.
// This is useful during development.
host.setShouldFailOnDeprecatedUse(true);

host.defineController("Kirkwood West", "WORM Launch Control XL", "0.1", "0c1bdc16-9e2c-43e4-be70-a467f9c23a91", "kirkwoodwest");

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
   host.addDeviceNameBasedDiscoveryPair(["Launch Control XL"], ["Launch Control XL"]);
}
else if (host.platformIsLinux())
{
   // TODO: Set the correct names of the ports for auto detection on Linux platform here
   // and uncomment this when port names are correct.
   // host.addDeviceNameBasedDiscoveryPair(["Input Port 0"], ["Output Port 0"]);
}


RescanSettings = null;

channelFinder = null;
Hardware = null;

MidiProcesses = [];

bankMain = null;
sendBanks = [];

resamplerHandlers = [];

cursor_track = null
cursorTracks = [];
cursorDevices = [];
cursorRemotePages = [];
remoteHandlers = [];
trackSendHandlers = [];

transport = null;
loopLengthHandler = null;

first_flush = true;

function init() {
   //Setup Host Preferences
   var preferences = host.getPreferences();

   //Sertup Document Preferences
   var docstate = host.getDocumentState();

   channelFinder = new ChannelFinder();

   Hardware = new HardwareBasic(host.getMidiInPort(0), host.getMidiOutPort(0), onMidi);

   //Setup Bass LEDS
   //Select Launch Control Factory Setting
   Hardware.sendSysex(LAUNCH_CTRL_SELECT_TEMPLATE);

   //Set up Blink LED
   Hardware.sendMidi(176+LAUNCH_CTRL_SYSEX_TEMPLATE_ID, 0, 40);
   //Init Color State
   Hardware.sendSysex(LAUNCH_LED_INIT);

   //Rescan Tracks Button
   RescanSettings = docstate.getSignalSetting('Rescan','Rescan Tracks', "Rescan Tracks");
   RescanSettings.addSignalObserver(rescanTracks);

   //Handler for loop length
   transport = host.createTransport();
   loopLengthHandler = new LoopLengthHandler(transport, Hardware);
   loopLengthHandler.setRecordLength(2);

   MidiProcesses.push(loopLengthHandler);

   bankMain = bank;

   //Resamplers...
   var channel_count = 8;
   var resampler_btn = LAUNCH_CONTROL_RESAMPLER1_BTN;
   var resampler_leds = LAUNCH_LED_RESAMPLE1_LEDS;
   var resampler_1 = [channel_count, resampler_btn, resampler_leds];

   var channel_count = 1;
   var resampler_btn = LAUNCH_CONTROL_RESAMPLER2_BTN;
   var resampler_leds = LAUNCH_LED_RESAMPLE2_LEDS;
   var resampler_2 = [channel_count, resampler_btn, resampler_leds];
   var resamplers = [resampler_1, resampler_2];

   //Create REsamp
   for (var i=0;i<resamplers.length;i++) {
      //Grab elements from list...
      var resampler = resamplers[i];
      var channel_count = resampler[0];
      var resampler_btn = resampler[1];
      var resampler_leds = resampler[2];

      //Build bitwig objects
      var num_sends = 0;
      var num_scenes = 1;
      var has_flat_track_list = true;
      var bank = host.createTrackBank(channel_count, num_sends, num_scenes, has_flat_track_list);
   
      var cursorTrackID = "RESAMPLER_CURSOR_TRACK" + i;
      var should_follow_selection = false;
      var cursorTrack = host.createCursorTrack(cursorTrackID,  cursorTrackID, 0,0, should_follow_selection);
      var resampler_handler = new ResamplerHandler(bank, cursorTrack, loopLengthHandler, Hardware, resampler_btn, resampler_leds);
      resamplerHandlers.push(resampler_handler);

      //Set up channel finder
      channelFinder.setupCursorTracks(cursorTrack);
      cursorTracks.push(cursorTrack);

      MidiProcesses.push(resampler_handler);

   }


   //Cursor Devices for Main Mixer
   MIXER_DEVICE_CC_LISTS = [LAUNCH_CONTROL_TRACK1_CONTROLS, LAUNCH_CONTROL_TRACK2_CONTROLS, LAUNCH_CONTROL_TRACK3_CONTROLS];
   follow_mode = CursorDeviceFollowMode.FIRST_DEVICE;
   for (var i=0; i< MIXER_DEVICE_CC_LISTS.length; i++){      
      
      //CC List is a list of cc's used for the cursor remote...
      var cc_list = MIXER_DEVICE_CC_LISTS[i]

      //knob count
      var knob_count = cc_list.length;
      cursorTrack = host.createCursorTrack("CURSOR_TRACK_" + i, "MIXER" + i, 0,0, false);
      channelFinder.setupCursorTracks(cursorTrack);
      cursorTracks.push(cursorTrack);

      cursor_device_id = "CURSOR_DEVICE_" + i;
      cursorDevice = cursorTrack.createCursorDevice(cursor_device_id, "MIXER__DEVICE" + i, 0, follow_mode); // CursorDeviceFollowMode.FIRST_DEVICE
      cursorDevices.push(cursorDevice);

      cursor_remote_page_id = "CURSOR_REMOTE_" +  i;
      cursorRemotePage = cursorDevice.createCursorRemoteControlsPage(cursor_remote_page_id, knob_count,'');
      cursorRemotePages.push(cursorRemotePage);

      remoteHandler = new RemoteControlHandler(cursorDevice, cursorRemotePage, cc_list, Hardware);
      remoteHandlers.push(remoteHandler);     
      MidiProcesses.push(remoteHandler);
   }

   var cc_list = LAUNCH_CONTROL_PSP42_CONTROLS
   cursorTrack = host.createCursorTrack("CURSOR_TRACK_PSP42", "CURSOR_TRACK_PSP42" + i, 0,0, false);
   channelFinder.setupCursorTracks(cursorTrack);
   cursorTracks.push(cursorTrack);

   cursorDevice = cursorTrack.createCursorDevice("CURSOR_DEVICE_PSP42", "CURSOR_DEVICE_PSP42" + i, 0, follow_mode); // CursorDeviceFollowMode.FIRST_DEVICE
   cursorDevices.push(cursorDevice);

   cursor_remote_page_id = "CURSOR_REMOTE_PSP42";
   knob_count = 6;
   cursorRemotePage = cursorDevice.createCursorRemoteControlsPage(cursor_remote_page_id, knob_count,'');
   cursorRemotePages.push(cursorRemotePage);

   remoteHandler = new Psp42Handler(cursorDevice, cursorRemotePage, cc_list, Hardware);
  // remoteHandler.init();
   remoteHandlers.push(remoteHandler);     
   MidiProcesses.push(remoteHandler);

   //PSP42
   
  // LAUNCH_CONTROL_PSP42_INF = LAUNCH_CONTROL_BTNS_1[1];
//LAUNCH_CONTROL_PSP42_DENS = LAUNCH_CONTROL_BTNS_2[1];

   //TODO: Combine this to the mixer device list to use the same cursor track/bank as the mixer.

   //Banks and Cursor Devices for Mixer Sends
   SEND_CC_LISTS = [LAUNCH_CONTROL_TRACK1_SENDS, LAUNCH_CONTROL_TRACK2_SENDS, LAUNCH_CONTROL_TRACK3_SENDS];

   for (var i=0; i< SEND_CC_LISTS.length; i++){      
      var cc_list = SEND_CC_LISTS[i];
      var bank = host.createTrackBank(1,3,0,true);
      sendBanks.push(bank);
 
      //knob count
      var knob_count = LAUNCH_CONTROL_TRACK1_CONTROLS.length;
      cursorTrack = host.createCursorTrack("SEND_CURSOR_TRACK_" + i, "SEND_MIXER" + i, 0,0, false);
      channelFinder.setupCursorTracks(cursorTrack);
      cursorTracks.push(cursorTrack);

      trackSendHandler = new TrackSendHandler(bank, cursorTrack, cc_list, Hardware);
      trackSendHandlers.push(trackSendHandler);     
      MidiProcesses.push(trackSendHandler);
   }
  
   println("Worm Launch Control XL initialized!");
}

function onMidi(status, data1, data2) {
   for(var i=0;i<MidiProcesses.length;i++){
      MidiProcesses[i].handleMidi(status, data1, data2);
   }
}

function flush() {
   if(first_flush == true){
      rescanTracks();
      first_flush = false;
   }

   loopLengthHandler.handleFlush();
}

function exit() {

}

function rescanTracks(){
   //TODO: Clean this the fuck up you filthy animal...
   println('cursore tracks lenght:' + cursorTracks.length);
   //Resampler 
   channelFinder.find(cursorTracks[0], "RE_KICK1");
   channelFinder.find(cursorTracks[1], "LOOPER1");
   
   //mixer
   channelFinder.find(cursorTracks[2], "MAIN");
   channelFinder.find(cursorTracks[3], "RESAMPLER");
   channelFinder.find(cursorTracks[4], "LOOPER1"); 
   channelFinder.find(cursorTracks[5], "SEND_DELAY"); 

   //Sends
   channelFinder.find(cursorTracks[6], "MAIN");
   channelFinder.find(cursorTracks[7], "RESAMPLER");
   channelFinder.find(cursorTracks[8], "LOOPER1");   
}