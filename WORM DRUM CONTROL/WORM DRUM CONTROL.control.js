loadAPI(10);

load('BCR2000.js')
load('DrumMachine.js')
load('TrackHandler.js')
load('RemoteControlHandler.js')
load('HardwareSurfaceHandler.js')
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

//TODO: Remove necessity to use a massive bank. observe new Color implementation of that.
//Drum machine 

//Settings
const BCR_1_CHANNEL = 1;
const BCR_2_CHANNEL = 2;

Hardware = null;
HardwareSurface = null;
Machines = null;
Drum1 = null
Drum2 = null

function init() {
   midi_out = host.getMidiOutPort(0);
   midi_in = host.getMidiInPort(0);
      
   //Hardware map
   Hardware = new BCR2000(midi_out, midi_in, midiHandler);
   HardwareSurface = host.createHardwareSurface();

   host.getNotificationSettings().setShouldShowValueNotifications(true);

   //Observe if the project name changes...
   app = host.createApplication();
   app.projectName().addValueObserver(projectNameChanged);

   //Banks
   massiveBank = host.createTrackBank(128,0,0,true);

   midi_channel = 1;
   channel_name = "DRUM2"
   Drum1 = new DrumMachine(massiveBank, Hardware, HardwareSurface, midi_channel, channel_name);

   midi_channel = 2;
   channel_name = "DRUM3"
   Drum2 = new DrumMachine(massiveBank, Hardware, HardwareSurface, midi_channel, channel_name);
   
   Machines = [Drum1, Drum2];
   
   // TODO: Perform further initialization here.
   println("WORM DRUM CONTROL initialized!");
   println(""  + new Date());
}

// Called when a short MIDI message is received on MIDI input port 0.
function midiHandler(status, data1, data2) {
   if (data1 == BCR_BTN_BOX_1) {
      println('updateMidiKnobs');
      updateMidiKnobs();
   }
   var success= true;
 //  var success = Machines[MIDIChannel(status)].handleMidi(status, data1, data2);

   if (success == true) return;
   
   debug_midi(status, data1, data2, "midiHandler: Message not Handled", true);
}


function projectNameChanged(){
   for(i=0; i < Machines.length; i++){
      //We need to update where the cursor track is pointed...
      host.scheduleTask(doObject(Machines[i], Machines[i].moveToProperTrack), 3000);
   }
}

function updateMidiKnobs(){
   for(i=0; i < Machines.length; i++){
      track_handle_success = Machines[i].updateMidiKnobs();
   }
}

function flush() {
   // TODO: Flush any output to your controller here.
 //  updateMidiKnobs();
   //println('flush!');
}

function exit() {

}