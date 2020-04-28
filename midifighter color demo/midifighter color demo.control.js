loadAPI(11);
load("MidiFighterTwister.js");
load('../WORM_UTILS/WORM_UTIL.js')
// Remove this if you want to be able to use deprecated methods without causing script to stop.
// This is useful during development.
host.setShouldFailOnDeprecatedUse(true);

host.defineController("Kirkwood West", "midifighter color demo", "0.1", "aae1979e-2c59-4d24-89e5-5382f164ea6c", "kirkwoodwest");

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

var hardware = null
var cursorClip = null
var cursorDevice = null
var cursorTrack= null
var trackBank = null
var slotBank = null
var initialized = false




var MFT_EMPTYCOLOR_TABLE = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
var mft_color_values = MFT_EMPTYCOLOR_TABLE;
var mft_knob_values = MFT_EMPTYCOLOR_TABLE;

/*
Constants
*/
const INIT_WAIT_TIME = 2000;   //Wait time until init.
const CHANNEL_SEARCH_TIME = 200; //Wait time between channel searches.
const RESTART_DOCUMENT_CHANNEL_SEARCH_TIME = 1000; //Wait time between channel searches.

/*
SETTINGS
*/
const SETTINGS_COLOR_TRACK_NAME = 'Color Track Name';

var settingBankSize = null;
var LauncherBankSize = 128;

var settingCCBaseNumber = null;
var CCBase = 0; //CC Base Value will go up + 16 from there.

var settingLaunch = null //Launch Button

TargetTrackNameSetting = null;
TargetTrackName = null;

var EditColorsEnabled = false; //Flag to determine if we are editing colors or just twisting knobs

var ChannelFindIndex = -1; //Index to find the target channel.
var Playing_slot_index = 0; //Current playing slot in the MFT channel

function init() {
   prefs = host.getPreferences();
   settingCCBaseNumber = prefs.getNumberSetting('Base CC', "Settings", 0,127,1,'', CCBase);
   settingCCBaseNumber.addValueObserver(127,ccBaseNumberChanged);
   CCBase = floatToRange(settingCCBaseNumber.get());
   
   settingBankSize = prefs.getNumberSetting('Launcher Bank Size', "Settings", 0,1024,16,'', LauncherBankSize);
   settingBankSize.addValueObserver(127,settingBankSizeChanged);
   LauncherBankSize = floatToRange(settingBankSize.get(),1024);
   
   
   println("midifighter color demo initialized!:" + CCBase);
   docstate = host.getDocumentState();
   
   TargetTrackNameSetting = docstate.getStringSetting('Target', SETTINGS_COLOR_TRACK_NAME,8, 'MFT');
   TargetTrackNameSetting.addValueObserver(settingTargetTrackNameChanged);
   TargetTrackName = TargetTrackNameSetting.get();

   settingLaunch = docstate.getSignalSetting('Reset',SETTINGS_COLOR_TRACK_NAME, "Reset");


   settingLaunch.addSignalObserver(doAction);

   //Observe if the project name changes...
   app = host.createApplication();
   app.projectName().addValueObserver(projectNameChanged);

   var input =  host.getMidiInPort(0);
   var output = host.getMidiOutPort(0);

   //docstate.getSignalSetting();

   hardware = new MidiFighterTwister(input, output, onMidi0);

   cursorClip = host.createLauncherCursorClip(1,1)
   
   cursorTrack = host.createCursorTrack("MAIN_CURSOR_TRACK", "Main 1", 0,0, true);
   cursorClip = cursorTrack.createLauncherCursorClip('CURSOR_CLIP_1', 'Cursor Clip 1',1,1);
   cursorTrack.isPinned().markInterested();

   trackBank = host.createTrackBank(1, 0, LauncherBankSize);
   trackBank.scrollPosition().markInterested();
   trackBank.itemCount().markInterested();

   var track = trackBank.getItemAt(0);

   p = track.name();
   p.markInterested();

   //Get Slots
   slotBank = track.clipLauncherSlotBank();
   slotBank.addIsPlayingObserver(slotPlaying);
   slotBank.setIndication(true)

   //
   host.scheduleTask(doInit, INIT_WAIT_TIME);

   for (i=0;i <this.slotBank.getSizeOfBank(); i++){
      var slot = this.slotBank.getItemAt(i);

      p = slot.name();
      p.markInterested();
   }
   name = slotBank.getItemAt(0).name();
   name.markInterested();

   // TODO: Perform further initialization here.
   println("midifighter color demo initialized!");
   //println("midifighter color demo initialized!" + slotBank.getItemAt(0)   );
   
   //nal String label, final String category, final int numChars, final String initialText))
}

/*
Settings Callbacks
*/

/**
 * Called when the base has changed via settings...
 * @param {int} value 
 */
function ccBaseNumberChanged(value) {
   CCBase = floatToRange(settingCCBaseNumber.get());
   println('ccBaseNumberChanged:' + value);
  
}

function doInit(){
   initialized = true
   println("doinit()")
   ChannelFindIndex = -1;
   //slotBank.getItemAt(0).name().setValue('dfdsfs');
   //cursorTrack.selectFirstChild();
   findChannel();
}

function doAction(){
   ChannelFindIndex = -1;
   findChannel()
}

function slotPlaying(slot_index, is_playing){
   println("slot playing" + slot_index + " - " + is_playing);
   if (is_playing == true){
      
      Playing_slot_index = slot_index;
      readData();
   }
   if (is_playing == false && Playing_slot_index == slot_index){
      Playing_slot_index = -1;
   }
}

function projectNameChanged(){
   ChannelFindIndex = -1;
   host.scheduleTask(findChannel, RESTART_DOCUMENT_CHANNEL_SEARCH_TIME);
   println('projectNameChanged');
}

/**
 * Finds the channel for the trackbank and cursor track. Gives up if it reaches the end of the channel index.
 */
function findChannel(){

   //Get current channel for the trackbank
   var channel = trackBank.getItemAt(0)
   var name = channel.name().get();

   // println("name: " + name);
   // println("findchannel: " + TargetTrackName);
   // println("ChannelFindIndex: " + ChannelFindIndex);
   // println("channel_count: " + trackBank.itemCount().get());
   // println('\n');
   
   //attempt to match with the track name...
   if (name == TargetTrackName) {
      //Matched Select the channel and pin it.
      cursorTrack.selectChannel(channel);
      cursorTrack.isPinned().set(true);

   } else {
      //Keep searching, increment index and move the position and attempt to refind.
      ChannelFindIndex++;
      trackBank.scrollPosition().set(ChannelFindIndex);
      channel_count = trackBank.itemCount().get();

      if (ChannelFindIndex <= channel_count) {
         //Only attempt again if our index doesn't exceed the channel count...
         host.scheduleTask(findChannel, CHANNEL_SEARCH_TIME + (Math.random()*200));
      }
   }
}



function settingTargetTrackNameChanged(value){
   TargetTrackName = value;
}

function settingBankSizeChanged(value){
   LauncherBankSize = value;
}

NoteOnStack = 0;
// Called when a short MIDI message is received on MIDI input port 0.
function onMidi0(status, data1, data2) {
   // TODO: Implement your MIDI input handling code here.

   debug_midi(status, data1, data2, "midiHandler: Message not Handled", true)

   if(isNoteOn(status)){
      if(NoteOnStack==1) randomizeColors();
      NoteOnStack++;
      mftEnableEdit(true);
      return;
   } else if (isNoteOff(status)) {
      mftEnableEdit(false);
      NoteOnStack--;
      return;
   }

   //Store Knob Values...
   cc = parseInt(data1);
   target_cc = cc - CCBase;

   if (EditColorsEnabled) {
      hardware.sendMidi(status+1, data1, data2);
      mft_color_values[target_cc] = data2;
   } else {
      mft_knob_values[target_cc] = data2;
   }
      
      /*
      println("Item: " +  slotBank.getItemAt(0).name().getValue());
      var string = ''
      for(i=0;i<16;i++){
         var val = Math.floor(Math.random() * 16)
         var hex = val.toString(16)
         var channel = 1;
         var status = 0xB0 | channel;
         string = string + ',' + hex;
      }
   
      var launcherslot = cursorClip.clipLauncherSlot();
      println('name:' + launcherslot.name().getValue())
   
      var bank = Math.floor(Math.random() * 5);
      // slotBank.getItemAt(0).select(bank);
      println("Item: " +  slotBank.getItemAt(0).name().getValue());
   
      values = slotBank.getItemAt(0).name().getValue();
      values_array = values.split(',');
      for(i=0;i<values_array.length;i++){ 
         value = values_array[i];
         v = '0x' + value; 
         v = parseInt(v);
         
         if (v > MFT_COLOR_TABLE.length) { v = 0;}
         
         color = MFT_COLOR_TABLE[v];
  
      }*/

}

function readData(){
   var track = trackBank.getItemAt(0);
   var launcherslotBank = track.clipLauncherSlotBank();
   var slot = launcherslotBank.getItemAt(Playing_slot_index)
   name = slot.name().get();
   println('readData: name-' + name +'-')
   colors_array = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
   if (name != '') colors_array = name.split(',');

   for(i=0;i<colors_array.length;i++){
      var channel = 1;
      var status = 0xB0 | channel;
      var data1 = (i+CCBase).toString(16)

      var val = colors_array[i];
      var data2 = parseInt(val).toString(16)
      
      hardware.sendMidi(status, i+CCBase, val);      
   }

   mft_color_values = colors_array;
   string = dataToString();

   launcherslotBank.showInEditor(Playing_slot_index);
   cursorClip.setName(string);

}

function writeData(){

   //Turn Data into string
   string = dataToString();
   
   //Make sure we are playing a slot...
   if(Playing_slot_index == -1) return;

   //Complicated process to write the data to the clip.
   //Get track out of track bank, get launcherslot bank, 
   //then get slot, set cursor to that slot so we can rename
   //Move the cursor to the slot and set the name.
   var track = trackBank.getItemAt(0);
   var launcherslotBank = track.clipLauncherSlotBank();
   var slot = launcherslotBank.getItemAt(Playing_slot_index)
   launcherslotBank.showInEditor(Playing_slot_index);
   cursorClip.setName(string);
}

function mftEnableEdit(isEnabled){
   if(isEnabled == true) {
      //Store off current knob positions
      //Get colors from clip and send to twister knobs
      restoreKnobColorValues();
   } else {
      //Restore Knob positions...
      restoreKnobCCValues();
      writeData();
   }
   EditColorsEnabled = isEnabled;
}

function restoreKnobCCValues(){
   restoreKnobValues(mft_knob_values);
}

function restoreKnobColorValues(){
   restoreKnobValues(mft_color_values);
}

function restoreKnobValues(value_array) {
   var channel = 0;
   var status = 0xB0 | channel;
   for(var cc = 0; cc<value_array.length;cc++){
      hardware.sendMidi(status, cc+CCBase, value_array[cc]);
   }
}

function dataToString(){
   var string = '';
   for(i=0; i < mft_color_values.length; i++){
      if (i ==0){
         string = mft_color_values[i]
      } else {
      string = string + ',' + mft_color_values[i];
      }
   }
   return string;
}

function randomizeColors() {
   for (i=0;i<mft_color_values.length;i++) {
      mft_color_values[i] = Math.floor(Math.random() *127);
 
 
   }

   var channel = 0;
   var status = 0xB0 | channel;
   for(var cc = 0; cc<value_array.length;cc++){
      hardware.sendMidi(status, cc+CCBase, value_array[cc]);
   }
}


function flush() {
}

function exit() {

}