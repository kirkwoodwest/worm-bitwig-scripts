/*
Constants
*/
const INIT_WAIT_TIME = 2000;   //Wait time until init.
const RESTART_DOCUMENT_CHANNEL_SEARCH_TIME = 1000; //Wait time between channel searches.
MFT_EMPTYCOLOR_TABLE = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];   //Default Color Table is empty

/**
 * 
 * @param {Number} bankSize Size of Bank necessary to determine how many color clips this script can manage...
 * @param {String} colorTrackName Name of the color track to match to..
 */
function ColorTrack(bankSize, colorTrackName) {

   this.colorTrackName = colorTrackName;
   this.channelFindIndex = -1; //Index to find the target channel.
   this.channelInitialized = false; //Determines if the channel for holding the color clips is initialized.
   this.playingSlotIndex = -1;

   this.mft_color_values = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
   this.mft_knob_values = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
   this.ccBase = 0;

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

      if(NoteOnStack==1) {
         ColorTrackInstance.randomizeColors();
         ColorTrackInstance.writeData();
      }
      NoteOnStack++;
      ColorTrackInstance.enableEdit(true);
      return true;

   } else if (isNoteOff(status)) {

      if(NoteOnStack==1) {
         ColorTrackInstance.enableEdit(false);
      }
      NoteOnStack--;
      return true;
   }

   //Store Knob Values...
   var cc = parseInt(data1);
   var target_cc = cc - this.ccBase;

   if (ColorTrackInstance.editEnabled) {
      Hardware.sendMidi(status+1, data1, data2);
      ColorTrackInstance.colorValuesUpdate(target_cc, data2);
      return true;
   } else {
      ColorTrackInstance.knobValuesUpdate(target_cc, data2);
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
   var status = 0xB0 | channel;
   for(var cc = 0; cc < this.mft_color_values.length;cc++){
      Hardware.sendMidi(status, cc+this.ccBase, this.mft_color_values[cc]);
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

   if (this.channelsInitialized == false || this.playingSlotIndex == -1 ){ 
      host.scheduleTask(doObject(this, this.readData), RESTART_DOCUMENT_CHANNEL_SEARCH_TIME); 
      return;
   }
  
   colors_array = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];   //Default if empty...

   //Check to see if there already is a color in the clip slot
   var track = this.trackBank.getItemAt(0);
   var launcherslotBank = track.clipLauncherSlotBank();
   var slot = launcherslotBank.getItemAt(this.playingSlotIndex)
   name = slot.name().get();

   //Is the clip name empty?
   if (name != '') colors_array = name.split(',');

   //Loop thru array and send color data to hardware...
   for(i=0;i<colors_array.length;i++){
      var channel = 1;
      var status = 0xB0 | channel;
      var data1 = (i+this.ccBase).toString(16)

      var val = colors_array[i];
      var data2 = parseInt(val).toString(16)
      
      Hardware.sendMidi(status, i+this.ccBase, val);      
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
   for(var cc = 0; cc<value_array.length;cc++){
      Hardware.sendMidi(status, cc+this.ccBase, value_array[cc]);
   }
}

ColorTrack.prototype.colorValuesUpdate = function(target_cc, data2){
   this.mft_color_values[target_cc] = data2;
}

ColorTrack.prototype.knobValuesUpdate = function(target_cc, data2){
   this.mft_knob_values[target_cc] = data2;
}

ColorTrack.prototype.setCCBase = function(ccBase) {
   this.ccBase = ccBase;
}