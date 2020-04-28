loadAPI(11);
load('../WORM_UTILS/WORM_UTIL.js')
load("MidiFighterTwister.js");
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
DocColorTrackNameSetting = null; //Settings for the color track name


//Size of the bank
PrefColorBankSizeSetting = null; //
CCBase = 0;
LauncherBankSize = 128;

Hardware = null //Controller Hardware Instance
ColorTrackInstance = null;

NoteOnStack = 0;  //Determines how many side buttons are pressed


function init() {
   //Setup Host Preferences
   Preferences = host.getPreferences();

   //TODO: Refactor this.
   settingCCBaseNumber = Preferences.getNumberSetting('Base CC', "Settings", 0,127,16,'', CCBase);
   settingCCBaseNumber.addValueObserver(127,ccBaseNumberChanged);
   CCBase = floatToRange(settingCCBaseNumber.get());
   
   PrefTopKnobsSetting = Preferences.getEnumSetting("Top 8 Knobs Target", "Targets", KnobSettingEnum, KnobSettingEnum[0]);
   PrefBottomKNobsSetting = Preferences.getEnumSetting("Bottom 8 Knobs Target", "Targets", KnobSettingEnum, KnobSettingEnum[0]);

   PrefColorBankSizeSetting = Preferences.getNumberSetting('Color Bank Size', "Settings", 0,1024,16,'', LauncherBankSize);
   PrefColorBankSizeSetting.addValueObserver(127,settingBankSizeChanged);
   LauncherBankSize = floatToRange(PrefColorBankSizeSetting.get(),1024);
   
   //Sertup Document Preferences
   docstate = host.getDocumentState();
   
   DocColorTrackNameSetting = docstate.getStringSetting('Name', SETTINGS_COLOR_TRACK_NAME,8, 'MFT');
   DocColorTrackNameSetting.addValueObserver(settingColorTrackNameChanged);
   colorTrackName = DocColorTrackNameSetting.get();  

   //Observe if the project name changes...
   app = host.createApplication();
   app.projectName().addValueObserver(projectNameChanged);
   
   //Setup our hardware instance.
   Hardware = new MidiFighterTwister(host.getMidiInPort(0), host.getMidiOutPort(0), onMidi);

   //Initialize the color track
   ColorTrackInstance = new ColorTrack(LauncherBankSize, colorTrackName);

   // TODO: Perform further initialization here.
   println("TWIST8 initialized!");
}

// Called when a short MIDI message is received on MIDI input port 0.
function onMidi(status, data1, data2) {

   //Deal with color track input...
   if(isNoteOn(status)){

      if(NoteOnStack==1) {
         ColorTrackInstance.randomizeColors();
         ColorTrackInstance.writeData();
      }
      NoteOnStack++;
      ColorTrackInstance.enableEdit(true);
      return;
   
   } else if (isNoteOff(status)) {
   
      if(NoteOnStack==1) {
         ColorTrackInstance.enableEdit(false);
      }

      NoteOnStack--;
      return;
   }

   
   //Store Knob Values...
   cc = parseInt(data1);
   target_cc = cc - CCBase;

   if (ColorTrackInstance.editEnabled) {
      Hardware.sendMidi(status+1, data1, data2);
      ColorTrackInstance.colorValuesUpdate(target_cc, data2);
   } else {
      ColorTrackInstance.knobValuesUpdate(target_cc, data2);
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
function projectNameChanged(){
   //Project Name CHanged
   
}

/**
 * Preferences Callbacks
*/

/**
 * Called when the cc base has changed via settings...
 * @param {int} value 
 */
function ccBaseNumberChanged(value) {
   CCBase = floatToRange(settingCCBaseNumber.get());
}


function settingBankSizeChanged(){

}

function settingColorTrackNameChanged(value){
   ColorTrackInstance.setName(value);
}