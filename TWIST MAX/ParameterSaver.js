ParameterSaverInstance = null;
const PARAMETER_SAVER_PRECISION = 3;

/**
 * 
 * @param {Number} bankSize Size of Bank necessary to determine how many color clips this script can manage...
 */
function ParameterSaver(hardwareTwister, bankSize, remoteHandlers) {

   //incoming paramters, twister, remoteControl Handlers
   //Need to retreive a list of parameters from the remote control handler
      //GetParameter list from remotecontrol handler and cc
         //get prarameter list and cc return array of parameter list, and array of cc.
         //save them into list for retrieval.
   //Store them in a single clip.
      //Method for writing the paramter values.
   //retreive them from clip
      //Method for reading paramter values, matching it up with paramter list and sending cc value to the twister hardware.
   
   this.hardwareTwister = hardwareTwister;
   this.data_sets = []
   this.status = 0xB0 
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
   this.cursorTrack = host.createCursorTrack("PARAM_SAVER_CURSOR", "Param Track", 0,0, true);
   this.cursorClip = this.cursorTrack.createLauncherCursorClip('PARAM_SAVER_CURSOR', 'Param Clip',1,1);
   this.cursorTrack.isPinned().markInterested();

   this.buildDataSet(remoteHandlers);

   //Get Slots
   var track = this.trackBank.getItemAt(0);
   this.slotBank = track.clipLauncherSlotBank();
   this.slotBank.addIsPlayingObserver(doObject(this, this.playingStatusChanged));
   this.slotBank.addHasContentObserver(doObject(this, this.contentChanged));
   this.slotBank.setIndication(true)

   for (i=0;i < this.slotBank.getSizeOfBank(); i++){
      var slot = this.slotBank.getItemAt(i);

      name = slot.name();
      name.markInterested();
      
      var callback_func = makeIndexedFunction(i, doObject(this, this.slotNameChanged));
      name.addValueObserver(callback_func);
   }
}

ParameterSaver.prototype.handleMidi = function(status, data1, data2){
   println('restore knob vals')
   this.reportKnobValues();
   return false;
   //Deal with color track input...
   if(isNoteOn(status)){
      this.enableEditToggle = !this.enableEditToggle
      ParameterSaverInstance.enableEdit(this.enableEditToggle);
   }

   //Normal knobs just go thru the game...
   return false;   
}

ParameterSaver.prototype.enableEdit = function(isEnabled){
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
 * Returns the color values in a string format.
 */
ParameterSaver.prototype.dataToString = function(){
   return this.mft_color_values.toString();
}

/**
 * Called when playing status changes...
 */
ParameterSaver.prototype.playingStatusChanged = function(slot_index, is_playing){
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
ParameterSaver.prototype.slotNameChanged = function(slot_index, name){
   this.clip_names[slot_index] = name;
}

ParameterSaver.prototype.contentChanged = function(slot_index, has_clip){
   this.bank_content_slots[slot_index] = has_clip;
}


ParameterSaver.prototype.readData = function() {
   if (this.playingSlotIndex == -1 ){ 
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

ParameterSaver.prototype.writeData = function(){

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

ParameterSaver.prototype.restoreKnobCCValues = function(){
   this.restoreKnobValues(this.mft_knob_values);
}

ParameterSaver.prototype.restoreKnobColorValues = function(){
   this.restoreKnobValues(this.mft_color_values);
}

ParameterSaver.prototype.restoreKnobValues = function(value_array) {
   var channel = 0;
   var status = 0xB0 | channel;

   for (var i = 0; i < this.data_sets.length; i++) {
      var data_set = this.data_sets[i];

      var control_bank = data_set[0];
      var cc_list = data_set[1];
      var count = control_bank.getParameterCount();
      
      for(var cb=0;cb<count;cb++){
         var parameter = control_bank.getParameter(cb);
         var cc_value = parameter.value().get();
         var cc_target = cc_list[cb];
         this.hardwareTwister.sendMidi(status, cc_target, cc_value);
      }
   }
}

ParameterSaver.prototype.reportKnobValues = function(value_array) {
   var channel = 0;
   var status = 0xB0 | channel;

   for (var i = 0; i < this.data_sets.length; i++) {
      var data_set = this.data_sets[i];

      var control_bank = data_set[0];
      var cc_list = data_set[1];
      var count = control_bank.getParameterCount();
      
      for(var cb=0;cb<count;cb++){
         var parameter = control_bank.getParameter(cb);
         var cc_value = parameter.value().get();
         var cc_target = cc_list[cb];
       // this.hardwareTwister.sendMidi(status, cc_target, cc_value);

         println('knobValue: ' + cc_target + ' : ' + cc_value);
      }
   }
}

//Used by external funcs...
ParameterSaver.prototype.getCursorTrack = function(){
   return this.cursorTrack;
}

ParameterSaver.prototype.getTrackBank = function(){
   return this.trackBank;
}



ParameterSaver.prototype.buildDataSet = function(remote_control_handlers){
   //var data_set = [[control_bank, cc_list],...];
   var data_set = [];
   
   for (var i = 0; i < remote_control_handlers.length; i++) {
      var remote_control_handler = remote_control_handlers[i];
      var control_bank = remote_control_handler.getRemoteControlsBank();
      var cc_list = remote_control_handler.getCCList();
      var data = [control_bank, cc_list];
      data_set.push(data);
   }
   this.data_sets = data_set;
}