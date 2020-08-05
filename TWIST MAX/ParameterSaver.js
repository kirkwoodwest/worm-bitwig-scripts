ParameterSaverInstance = null;
const PARAMETER_SAVER_PRECISION = 4;

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

   this.mft_color_values = new Array(this.total_knobs); 
   this.mft_knob_values = new Array(this.total_knobs); 
  
   //Create Track Bank
   this.trackBank = host.createTrackBank(1, 0, bankSize);
   

   //Create Cursor Track and Cursor Clip
   this.cursorTrack = host.createCursorTrack("PARAM_SAVER_CURSOR", "Param Track", 0,0, true);
   this.cursorClip = this.cursorTrack.createLauncherCursorClip('PARAM_SAVER_CURSOR', 'Param Clip',1,1);
   this.cursorTrack.isPinned().markInterested();

   this.trackBank.followCursorTrack(this.cursorTrack);

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

   //TODO: Clean this up somewhat, needs to somehow work with color track at the same time.
   //maybe not handle the midi but an event to enable/disable from the parent script. for both color track and param saver.


   if(isNoteOn(status)){
      this.enableEditToggle = !this.enableEditToggle;
      if (this.enableEditToggle == false) {
         this.writeData();
      }
   }

   //Flow thru...
   return false;
}

/**
 * Returns the color values in a string format.
 */
ParameterSaver.prototype.dataToString = function(){
   var datas = this.getKnobValuesFromSet();
   var knob_values = datas[1];
   return knob_values.toString();
}

/**
 * Called when playing status changes...
 */
ParameterSaver.prototype.playingStatusChanged = function(slot_index, is_playing){
   println('playingStatusChanged: ' + slot_index + '___ ' + is_playing)
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
 
   var read_knob_array = [];

   read_knob_array = playing_slot_name.toString();

   var knob_and_cc_values = this.getKnobValuesFromSet();
   var cc_list = knob_and_cc_values[0];
   

   print

   println('cc_list' + cc_list)
   println('knob_values' + knob_values)

   //TODO: Fix comments like this...
   //Check to see if there already is a color in the clip slot
   var track = this.trackBank.getItemAt(0);
   var launcherslotBank = track.clipLauncherSlotBank();
   var slot = launcherslotBank.getItemAt(this.playingSlotIndex)
   name = slot.name().get();

   //Is the clip name empty?
   if (name != '') knob_array = name.split(',');

   var knob_values = knob_array;

   var channel = 0;
   var status = 0xB0 | channel;

   var knob_values_index = 0;

   for (var i = 0; i < this.data_sets.length; i++) {
      var data_set = this.data_sets[i];

      var control_bank = data_set[0];
      var cc_list = data_set[1];
      var count = control_bank.getParameterCount();
      
      for(var cb=0;cb<count;cb++){
         var knob_value = knob_values[knob_values_index];
         var parameter = control_bank.getParameter(cb);
         var knob_value_float = knob_value/127
         parameter.value().set(knob_value, 127);
         println('knob value ' + knob_value);
         println('i ' + i);
         println('cb ' + cb);
         println('knob_values_index ' + knob_values_index);
         knob_values_index++;
      }
   }
}

//Wires the data to a string
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


//restores all the knob values from the settings.
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
         var cc_value_float = parameter.value().get();

         //reduce precision of float
         var cc_value = cc_value_float.toFixed(PARAMETER_SAVER_PRECISION) * 127;
         var cc_target = cc_list[cb];
         this.hardwareTwister.sendMidi(status, cc_target, cc_value);

         println('knobValue: ' + cc_target + ' : ' + cc_value);
      }
   }
}

ParameterSaver.prototype.getKnobValuesFromSet = function(value_array) {
   var channel = 0;
   var status = 0xB0 | channel;
   var full_cc_list = [];
   var knob_values = [];
   for (var i = 0; i < this.data_sets.length; i++) {
      var data_set = this.data_sets[i];

      var control_bank = data_set[0];
      var cc_list = data_set[1];
      var count = control_bank.getParameterCount();
      
      for(var cb=0;cb<count;cb++){
         var parameter = control_bank.getParameter(cb);
         var cc_value_float = parameter.value().get();
         print('cc_value:::' + cc_value_float);

         //reduce precision of float
         var cc_value = Math.floor(cc_value_float.toFixed(PARAMETER_SAVER_PRECISION) * 127);
         var cc_target = cc_list[cb];
         this.hardwareTwister.sendMidi(status, cc_target, cc_value);
         full_cc_list.push(cc_target);
         knob_values.push(cc_value);
      }
   }

   return [full_cc_list, knob_values];
}

//Used by external funcs...
ParameterSaver.prototype.getCursorTrack = function(){
   return this.cursorTrack;
}

ParameterSaver.prototype.getTrackBank = function(){
   return this.trackBank;
}

//Builds our base structure for the data set.
ParameterSaver.prototype.buildDataSet = function(remote_control_handlers){

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