// Written by Kirkwood West - kirkwoodwest.com
// (c) 2020
// Licensed under LGPLv3 - http://www.gnu.org/licenses/lgpl-3.0.txt


const INIT_WAIT_TIME = 2000;   //Wait time until init.
const RESTART_DOCUMENT_CHANNEL_SEARCH_TIME = 1000; //Wait time between channel searches.

ColorTrackInstance = null;

/**
 * 
 * @param {Number} bankSize Size of Bank necessary to determine how many color clips this script can manage...
 */
function ColorTrack(hardwareTwister, bankSize, color_midi_channel, cc_min, cc_max) {
   this.hardwareTwister = hardwareTwister;
   this.color_midi_channel = color_midi_channel;
   this.status = 0xB0 | color_midi_channel;
   this.playingSlotIndex = -1;

   this.bank_content_slots = [];
   for(i=0;i<bankSize; i++){
      this.bank_content_slots[i] = null;
   }

   this.clip_names = [];

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

   //Get Slots
   var track = this.trackBank.getItemAt(0);
   this.slotBank = track.clipLauncherSlotBank();
   this.slotBank.addIsPlayingObserver(doObject(this, this.playingStatusChanged));
   //
   this.slotBank.addHasContentObserver(doObject(this, this.contentChanged));
   
   this.slotBank.setIndication(true)

   for (i=0;i < this.slotBank.getSizeOfBank(); i++){
      var slot = this.slotBank.getItemAt(i);

      name = slot.name();
      name.markInterested();
      
      var callback_func = makeIndexedFunction(i, doObject(this, this.slotNameChanged));
      name.addValueObserver(callback_func);
     // slot.hasContent().markInterested();
   }
}

ColorTrack.prototype.handleMidi = function(status, data1, data2){
 
   //Store Knob Values...
   var cc = parseInt(data1);

    //Deal with color track input...
    if(isNoteOn(status)){
      this.enableEditToggle = !this.enableEditToggle
      ColorTrackInstance.enableEdit(this.enableEditToggle);
   }

   if (ColorTrackInstance.editEnabled) {
      //TODO: probably should check if this is in range for the twisters before cancelling all other midi input.
      this.hardwareTwister.sendMidi(this.status, data1, data2);
      ColorTrackInstance.colorValuesUpdate(cc, data2);
      return true;
   } else {
      //TODO: This could probably get killed but when returning to knob values go thru the params and update the respective knobs.
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
      this.writeData();
      refreshTwisterKnobs();
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

   var channel = TWISTER_COLOR_MIDI_CHANNEL;
   
   var index = 0;
   for(var cc = this.cc_min; cc<=this.cc_max.length;cc++){
      this.hardwareTwister.sendMidi(status, cc, this.mft_color_values[index]);
      index++;
   }
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

/**
 * Called when playing status changes...
 */
ColorTrack.prototype.slotNameChanged = function(slot_index, name){
   this.clip_names[slot_index] = name;
}

ColorTrack.prototype.contentChanged = function(slot_index, has_clip){
   this.bank_content_slots[slot_index] = has_clip;
}


ColorTrack.prototype.readData = function() {
   if (this.playingSlotIndex == -1 ){ 
     // host.scheduleTask(doObject(this, this.readData), RESTART_DOCUMENT_CHANNEL_SEARCH_TIME); 
      return;
   }

   var playing_slot = this.bank_content_slots[this.playingSlotIndex]
   var playing_slot_name = this.clip_names[this.playingSlotIndex];

   //If no name in the slot return;
   if(playing_slot_name == '') return;

   //If no slot do nothing and return
   if(playing_slot == false || playing_slot == null) return;
 
   //Build colors array
   var colors_array = [];
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

   //Loop thru array and send color data to hardware...
   var index = 0;
   for(var cc_index = this.cc_min; cc_index<=this.cc_max; cc_index++){
      var val = colors_array[index];
      this.hardwareTwister.sendMidi(this.status, cc_index, val);    
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
      this.hardwareTwister.sendMidi(status, cc, value_array[index]);
      println('restor knob value: ' + status + ' : ' + cc + ' : ' + value_array[index])
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

ColorTrack.prototype.getCursorTrack = function(){
   return this.cursorTrack;
}

ColorTrack.prototype.getTrackBank = function(){
   return this.trackBank;
}

ColorTrack.prototype.updateLed = function(){
   //do nothing
}


