/*
Constants
*/
const INIT_WAIT_TIME = 2000;   //Wait time until init.
const RESTART_DOCUMENT_CHANNEL_SEARCH_TIME = 1000; //Wait time between channel searches.

/**
 * 
 * @param {Number} bankSize Size of Bank necessary to determine how many color clips this script can manage...
 * @param {String} colorTrackName Name of the color track to match to..
 */
function ColorTrack(bankSize, colorTrackName, color_midi_channel, cc_min, cc_max) {

   this.colorTrackName = colorTrackName;
   this.color_midi_channel = color_midi_channel;
   this.status = 0xB0 | color_midi_channel;
   this.playingSlotIndex = -1;

   this.enableEditToggle = false;

   this.total_knobs = cc_max - cc_min + 1;
   this.cc_min = cc_min;
   this.cc_max = cc_max;

   this.cc_to_index = [];
   index = 0;
   for(i=cc_min;i<=cc_max;i++){
      this.cc_to_index[i] = index;
      index++;
   }

   this.mft_color_values = new Array(this.total_knobs); 
   this.mft_knob_values = new Array(this.total_knobs); 
  
   //Create Track Bank
   this.trackBank = host.createTrackBank(1, 0, bankSize);

   //Create Cursor Track and Cursor Clip
   this.cursorTrack = host.createCursorTrack("COLOR_CURSOR_TRACK", "Color Track", 0,0, true);
   this.cursorClip = this.cursorTrack.createLauncherCursorClip('COLOR_CURSOR_CLIP_1', 'Color Clip',1,1);
   this.cursorTrack.isPinned().markInterested();

   //Channel Finder
   this.channelFinder = new ChannelFinder(this.cursorTrack, this.trackBank);
   this.channelFinder.find(colorTrackName);

   //Get Slots
   var track = this.trackBank.getItemAt(0);
   this.slotBank = track.clipLauncherSlotBank();
   this.slotBank.addIsPlayingObserver(doObject(this, this.playingStatusChanged));
   this.slotBank.setIndication(true)

   for (i=0;i < this.slotBank.getSizeOfBank(); i++){
      var slot = this.slotBank.getItemAt(i);

      name = slot.name();
      name.markInterested();
   }
}

ColorTrack.prototype.handleMidi = function(status, data1, data2){
   //Deal with color track input...
   if(isNoteOn(status)){
      this.enableEditToggle = !this.enableEditToggle
      ColorTrackInstance.enableEdit(this.enableEditToggle);
   }
   //    }

      //toggle on or off...

   // if(isNoteOn(status)){

   //    if(NoteOnStack==1) {
   //       ColorTrackInstance.randomizeColors();
   //       ColorTrackInstance.writeData();
   //    }
   //    NoteOnStack++;
   //    ColorTrackInstance.enableEdit(true);
   //    return true;

   // } else if (isNoteOff(status)) {

   //    if(NoteOnStack==1) {
   //       ColorTrackInstance.enableEdit(false);
   //    }
   //    NoteOnStack--;
   //    return true;
   // }

   //Store Knob Values...
   var cc = parseInt(data1);

   if (ColorTrackInstance.editEnabled) {
      Hardware.sendMidi(this.status, data1, data2);
      ColorTrackInstance.colorValuesUpdate(cc, data2);
      return true;
   } else {
      ColorTrackInstance.knobValuesUpdate(cc, data2);
   }

   //Normal knobs just go thru the game...
   return false;   
}

ColorTrack.prototype.enableEdit = function(isEnabled){
   if(isEnabled == true) {
      //Store off current knob positions
      //Get colors from clip and send to twister knobs
      this.restoreKnobColorValues();
   } else {
      //Restore Knob positions...
      this.restoreKnobCCValues();
      this.writeData();
   }
   this.editEnabled = isEnabled;
}


/**
 * Randomizes colors for the Entire Bank
 */
ColorTrack.prototype.randomizeColors = function() {
   for (i=0;i<this.mft_color_values.length;i++) {
      this.mft_color_values[i] = Math.floor(Math.random() *127);
   }

   var channel = 1;
   
   var index = 0;
   for(var cc = this.cc_min; cc<=this.cc_max.length;cc++){
      Hardware.sendMidi(status, cc, this.mft_color_values[index]);
      index++;
   }
}

/**
 * Changes the name for the color track and attempts to find the channel again.
 */
ColorTrack.prototype.setName = function(name){
   this.colorTrackName = name;
   this.channelFinder.find( this.colorTrackName );
}

/**
 * Returns the color values in a string format.
 */
ColorTrack.prototype.dataToString = function(){
   return this.mft_color_values.toString();
}

/**
 * Called when playing status changes...
 */
ColorTrack.prototype.playingStatusChanged = function(slot_index, is_playing){
   if (is_playing == true){
      this.playingSlotIndex = slot_index;
      this.readData();
   }
   if (is_playing == false && this.playingSlotIndex == slot_index){
      this.playingSlotIndex = -1;
   }
}


ColorTrack.prototype.readData = function() {
   if (this.channelFinder.channelFound == false || this.playingSlotIndex == -1 ){ 
     // host.scheduleTask(doObject(this, this.readData), RESTART_DOCUMENT_CHANNEL_SEARCH_TIME); 
      return;
   }
  
   colors_array = [];
   for(i=0;i<this.total_knobs;i++){
      colors_array[i] = 0;
   }
 
   //Check to see if there already is a color in the clip slot
   var track = this.trackBank.getItemAt(0);
   var launcherslotBank = track.clipLauncherSlotBank();
   var slot = launcherslotBank.getItemAt(this.playingSlotIndex)
   name = slot.name().get();

   //Is the clip name empty?
   if (name != '') colors_array = name.split(',');

   println('name: ' +name);
   println('colors_array: ' +colors_array);

   //Loop thru array and send color data to hardware...
   var index = 0;
   for(var cc_index = this.cc_min; cc_index<=this.cc_max; cc_index++){
    //  Hardware.sendMidi(status, cc, value_array[cc]);
      var val = colors_array[index];
      Hardware.sendMidi(this.status, cc_index, val);    
      index++;  
   }

   this.mft_color_values = colors_array;
   string = this.dataToString();

   launcherslotBank.showInEditor(this.playingSlotIndex);
   this.cursorClip.setName(string);
}

ColorTrack.prototype.writeData = function(){

   //Turn Data into string
   string = this.dataToString();
   
   println("write data" + string);
   //Make sure we are playing a slot...
   if(this.playingSlotIndex == -1) return;

   //Complicated process to write the data to the clip.
   //Get track out of track bank, get launcherslot bank, 
   //then get slot, set cursor to that slot so we can rename
   //Move the cursor to the slot and set the name.
   var track = this.trackBank.getItemAt(0);
   var launcherslotBank = track.clipLauncherSlotBank();
   var slot = launcherslotBank.getItemAt(this.playingSlotIndex)
   launcherslotBank.showInEditor(this.playingSlotIndex);
   this.cursorClip.setName(string);
}

ColorTrack.prototype.restoreKnobCCValues = function(){
   this.restoreKnobValues(this.mft_knob_values);
}

ColorTrack.prototype.restoreKnobColorValues = function(){
   this.restoreKnobValues(this.mft_color_values);
}

ColorTrack.prototype.restoreKnobValues = function(value_array) {
   var channel = 0;
   var status = 0xB0 | channel;
   var index = 0;
   for(var cc = this.cc_min; cc<=this.cc_max;cc++){
      Hardware.sendMidi(status, cc, value_array[index]);
      index++;
   }
}

ColorTrack.prototype.colorValuesUpdate = function(cc, data2){
   index = this.cc_to_index[cc]
   this.mft_color_values[index] = data2;
}

ColorTrack.prototype.knobValuesUpdate = function(cc, data2){
   index = this.cc_to_index[cc];
   this.mft_knob_values[index] = data2;
}