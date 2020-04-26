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


var launch = null

var mft_color_values = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
var mft_knob_values = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];

var settingCCBaseNumber = null;
var CCBase = 0; //CC Base Value will go up + 16 from ehre.

//Settings
editModeEnum = ['EDIT','LOCKED'];
editModeDefault = editModeEnum[1];
var EditColorsEnabled = false;

TargetTrackNameSetting = null;
TargetTrackName = null;

ChannelFindIndex = 0;   //Index to find the target channel.

function init() {
   prefs = host.getPreferences();
   settingCCBaseNumber = prefs.getNumberSetting('Base CC', "Settings", 0,127,1,'', CCBase);
   settingCCBaseNumber.addValueObserver(127,ccBaseNumberChanged);

   blah = floatToRange(settingCCBaseNumber.get());
   
   println("midifighter color demo initialized!:" + blah);
   docstate = host.getDocumentState();
   
   TargetTrackNameSetting = docstate.getStringSetting('Target', 'Color Track Name',8, 'MFT');
   TargetTrackNameSetting.addValueObserver(settingTargetTrackNameChanged);
   TargetTrackName = TargetTrackNameSetting.get();

   launch = docstate.getSignalSetting('Reset','Target Track Name', "Reset");

   editMode = docstate.getEnumSetting('Edit Mode','Edit Mode', editModeEnum, editModeDefault);
   editMode.addValueObserver(mftEnableEdit);


   launch.addSignalObserver (doAction);
   var input =  host.getMidiInPort(0);
   var output = host.getMidiOutPort(0);

   //docstate.getSignalSetting();

   hardware = new MidiFighterTwister(input, output, onMidi0);

   cursorClip = host.createLauncherCursorClip(1,1)

   
   cursorTrack = host.createCursorTrack("MAIN_CURSOR_TRACK", "Main 1", 0,0, true);
   cursorClip = cursorTrack.createLauncherCursorClip('CURSOR_CLIP_1', 'Cursor Clip 1',1,1);
   //cursorDevice = cursorClip.createCursorDevice();

   trackBank = host.createTrackBank(1, 0, 10);
   trackBank.scrollPosition().markInterested();
   var track = trackBank.getItemAt(0);

   p = track.name();
   p.markInterested();
   //get slots

   slotBank = track.clipLauncherSlotBank();
   //slotBank.markInterested();
   slotBank.setIndication(true)

   host.scheduleTask(doInit, 100);
   name = slotBank.getItemAt(0).name();
   name.markInterested();

   // TODO: Perform further initialization here.
   println("midifighter color demo initialized!");
   //println("midifighter color demo initialized!" + slotBank.getItemAt(0)   );


      //nal String label, final String category, final int numChars, final String initialText))
}

function doInit(){
   initialized = true
   println("doinit()")
   //slotBank.getItemAt(0).name().setValue('dfdsfs');
   //cursorTrack.selectFirstChild();
   findChannel();
}

function doAction(){
   ChannelFindIndex = -1;
   findChannel()
}


function findChannel(){
  
   var channel = trackBank.getItemAt(0)
   var name = channel.name().get();

   if (name != TargetTrackName) {
      ChannelFindIndex++;
      trackBank.scrollPosition().set(ChannelFindIndex);
      host.scheduleTask(findChannel, 100)
   } 
}


// Changes the track we are targeting.
function settingTargetTrackNameChanged(value){
   TargetTrackName = value;
}

// Called when a short MIDI message is received on MIDI input port 0.
function onMidi0(status, data1, data2) {
   // TODO: Implement your MIDI input handling code here.

   debug_midi(status, data1, data2, "midiHandler: Message not Handled", true)

   if(isNoteOn(status)){
      mftEnableEditManual(true);
      return;
   } else if (isNoteOff(status)) {
      mftEnableEditManual(false);
      return;
   }

   //Knob Values...
   if (EditColorsEnabled) {
      hardware.sendMidi(status+1, data1, data2);
      mft_color_values[data1] = data2;
   } else {
      mft_knob_values[data1] = data2;
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

function writeData(){
  string = dataToString();
  cursorClip.setName(string);
}

function mftEnableEdit(value){
   if (editModeEnum[0] == value) {
      EditColorsEnabled = true;
   } else {
      EditColorsEnabled = false;
   }
}

function mftEnableEditManual(isEnabled){


   if(isEnabled == true) {
      //Store off current knob positions
      //Get colors from clip and send to twister knobs
      restoreKnobColorValues();
   } else {
      //Restore Knob positions...
      restoreKnobCCValues();
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
      hardware.sendMidi(status, cc, value_array[cc]);
      println(' value_array[cc]' +  value_array[cc]);
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
}updateControllerLED



function updateControllerLED(){
   writeData();

   /*
   //  controllerLEDTest();

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
      hardware.sendMidi(status, i, color);
   }
*/
}


function controllerLEDTest(){
   // TODO: Flush any output to your controller here.
   println('yo!!')
   println("Item: " +  slotBank.getItemAt(0).name().getValue());
   var string = ''
   for(i=0;i<16;i++){
      var val = Math.floor(Math.random() * 16)
      var hex = val.toString(16)
      var channel = 1;
      var status = 0xB0 | channel;
      string = string + ',' + hex;
  
   }
   
   //var name = cursorClip.name().get();
   var launcherslot = cursorClip.clipLauncherSlot();
   println('name:' + launcherslot.name().getValue())
  
  // println("Item: " +  slotBank.getItemAt(0).name().getValue());
   
  // h//ost.getMidiOutPort(0).sendMidi(0xB0 | channel, controller, value);
  // hardware.sendMidi(status, 2, val);
  /*
   if (initialized ) {
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
     // hardware.sendMidi(status, i, color);
     }
   }
   */
}
function ccBaseNumberChanged(value) {

   println('ccBaseNumberChanged:' + value);
  
}
function flush() {
   updateControllerLED();
  
}

function exit() {

}