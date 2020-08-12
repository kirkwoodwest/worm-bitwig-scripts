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
   this.control_banks_and_cc_lists = []
   this.playingSlotIndex = -1;

   this.bank_content_slots = [];
   for(i=0;i<bankSize; i++){
      this.bank_content_slots[i] = null;
   }

   this.clip_names = [];

   this.clipEditEnabled = false;
  
   this.morph_parameters_a = [];
   this.morph_parameters_b = [];
   this.parameter_save_data = [];

   //Create Track Bank
   this.trackBank = host.createTrackBank(1, 0, bankSize);
   

   //Create Cursor Track and Cursor Clip
   this.cursorTrack = host.createCursorTrack("PARAM_SAVER_CURSOR", "Param Track", 0,0, true);
   this.cursorClip = this.cursorTrack.createLauncherCursorClip('PARAM_SAVER_CURSOR', 'Param Clip',1,1);
   this.cursorTrack.isPinned().markInterested();

   this.trackBank.followCursorTrack(this.cursorTrack);

   this.control_banks_and_cc_lists = this.buildControlBankAndCCList(remoteHandlers);

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

//Builds our base structure for the data set.
ParameterSaver.prototype.buildControlBankAndCCList = function(remote_control_handlers){
   var data_set = [];
   for (var i = 0; i < remote_control_handlers.length; i++) {
      var remote_control_handler = remote_control_handlers[i];
      var control_bank = remote_control_handler.getRemoteControlsBank();
      var cc_list = remote_control_handler.getCCList();
      var data = [control_bank, cc_list];
      data_set.push(data);
   }
   return data_set;
}


/**
 * Returns the color values in a string format.
 */
ParameterSaver.prototype.dataToString = function(){
   var datas = this.getParameterValues();
   var knob_values = datas[1];
   return knob_values.toString();
}

/**
 * Called when playing status changes...
*/
ParameterSaver.prototype.playingStatusChanged = function(slot_index, is_playing){
   if (is_playing == true){
      //Set global for the slot index
      this.playingSlotIndex = slot_index;
      
      this.readData();
   }

   //If somoething stopped playing and was the current slot index, that means nothing is playing? maybe... fuck.
   //then we need to initialize the slot index as invalid.
   if (is_playing == false && this.playingSlotIndex == slot_index){
      this.playingSlotIndex = -1;
   }
}


//Reads data from the clip slot that is currently playing and applys the values to the parameters.
ParameterSaver.prototype.readData = function() {
   if (this.playingSlotIndex == -1 ){ 
      return;
   }

   //Get playing slot name.
   var playing_slot = this.bank_content_slots[this.playingSlotIndex]
   var playing_slot_name = this.clip_names[this.playingSlotIndex];

   //If no name in the slot return;
   if(playing_slot_name == '') return;

   //If no slot do nothing and return
   if(playing_slot == false || playing_slot == null) return;
 
   //Get knob values and cc_list...
   var knob_and_cc_values = this.getParameterValues();

   //Get the name out of the clip slot...
   var track = this.trackBank.getItemAt(0);
   var launcherslotBank = track.clipLauncherSlotBank();
   var slot = launcherslotBank.getItemAt(this.playingSlotIndex)
   name = slot.name().get();

   
   var parameter_values = []; 

   //Get parameter values out of the name by simply splitting it.
   if (name != '') parameter_values = name.split(',');

   this.setParameterValues(parameter_values);
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
   slot.select();

   //TODOTRY THIS...
   // slot.select();
   launcherslotBank.showInEditor(this.playingSlotIndex);

   this.cursorClip.setName(string);
}


//Returns Indexed Array with two lists containting:
//[0] = full_cc_list[];
//[1] = knob_values[]; (0-127)
ParameterSaver.prototype.getParameterValues = function() {
   var full_cc_list = [];
   var knob_values = [];

   //Loop thru control banks and the cc list.
   for (var i = 0; i < this.control_banks_and_cc_lists.length; i++) {
      var bank_and_cc_list = this.control_banks_and_cc_lists[i];

      var control_bank = bank_and_cc_list[0];
      var cc_list = bank_and_cc_list[1];
      var count = control_bank.getParameterCount();
      
      for (var cb = 0; cb < count; cb++) {
         var parameter = control_bank.getParameter(cb);
         var cc_value_float = parameter.value().get();

         //reduce precision of float
         var cc_value = Math.floor(cc_value_float.toFixed(PARAMETER_SAVER_PRECISION) * 127);
         var cc_target = cc_list[cb];
 
         full_cc_list.push(cc_target);
         knob_values.push(cc_value);
      }
   }

   return [full_cc_list, knob_values];
}

//Saves current knobs to a specific slot..
ParameterSaver.prototype.saveParametersToSlot = function(parameters_slot_index){
   parameter_save_data[parameters_slot_index] = this.getParameterValues();
}

ParameterSaver.prototype.restoreParametersFromSlot = function(parameters_slot_index){
   var parameter_data = parameter_save_data[parameters_slot_index];
   if (parameter_data) {
      var reduced_paramter_data = parameter_data[1]; 
      this.setParameterValues(parameter_data);
   }
}

//Morph A always gets the current values...
ParameterSaver.prototype.setMorphA = function(){
  this.morph_parameters_a = this.getParameterValues();
}

//Morph B points to parameter save data.
ParameterSaver.prototype.setMorphB = function(parameters_slot_index){
   this.morph_parameters_b = parameter_save_data[parameters_slot_index];
}

//Sets all the parameters in the control banks to the parameter_values array.
ParameterSaver.prototype.setParameterValues = function(parameter_values){

   var parameter_index = 0;

   //Loop thru control banks and set them...
   for (var i = 0; i < this.control_banks_and_cc_lists.length; i++) {
      var data_set = this.control_banks_and_cc_lists[i];

      var control_bank = data_set[0];
      var parameter_count = control_bank.getParameterCount();
      
      for(var cb = 0; cb < parameter_count; cb++) {
         var parameter_value = parameter_values[parameter_index];
         var parameter = control_bank.getParameter(cb);
         parameter.value().set(parameter_value, 127);
         parameter_index++;
      }
   }
}

//Send in a float 0 - 1 and it will morph all the parameters according to that value...
ParameterSaver.prototype.morphParameters = function(value) {
   //Have to have valid morph data to do this...
   if(this.morph_parameters_a == [] || this.morph_parameters_b == []) return;

   var param_array = [];
   for(var i = 0; i< this.morph_parameters_a.length; i++) {

      //Get Param values...
      var param_value_a = this.morph_parameters_a[1][i];
      var param_value_b = this.morph_parameters_b[1][i];

      //Morph the parameter by the value.
      param_array[i] = Math.round(map_range(value, 0, 1, param_value_a, param_value_b));
   }
   
   //Send the array...
   this.setParameterValues(param_array)
}

//Set the morph knob...
ParameterSaver.prototype.setMorphKnob = function(value, do_morph) {
   this.morph_knob_value = value;
   if (morph_params) this.morphParameters(value);
}

ParameterSaver.prototype.setMorphKnobInc = function(inc_value) {
   println('inc_value: ' + inc_value);
   
   var old_value = this.morph_knob_value;
   var new value;
   this.setMorphKnob(new_value, true);
   
   if (morph_params) this.morphParameters(value);
}


//-----------------------------------------------------------------------------
// Callbacks
//


/**
 * Called when playing status changes...
 */
ParameterSaver.prototype.slotNameChanged = function(slot_index, name){
   this.clip_names[slot_index] = name;
}

ParameterSaver.prototype.contentChanged = function(slot_index, has_clip){
   this.bank_content_slots[slot_index] = has_clip;
}



//-----------------------------------------------------------------------------
// Externals
//

//Used by external funcs...
ParameterSaver.prototype.getCursorTrack = function(){
   return this.cursorTrack;
}

//Used by external funcs...
ParameterSaver.prototype.getTrackBank = function(){
   return this.trackBank;
}

//Add this to the midi process for the controller used.
ParameterSaver.prototype.updateLeds = function(){
  // if (this.clipEditEnabled == false) return;
   //Update the Leds on this...
   //Flow thru...
   return false;
}

//Add this to the midi process for the controller used.
ParameterSaver.prototype.handleMidi = function(status, data1, data2){

   //This is for managing the clip parameter save.
   if(isNoteOn(status)){
      this.clipEditEnabled = !this.clipEditEnabled;
      if (this.clipEditEnabled == false) {
         this.writeData();
      }
   }

   //Flow thru...
   return false;
}


ParameterSaver.prototype.handleXtouchMidi = function(status, data1, data2) {
   //are we in the xtouch midi mode? 

   if (isNoteOn(status) || isNoteOff(status)) {
      //State Controllers 
      //Edit Button
      if (data1 == XTOUCH_BTN_ROW_2[0]){
         if (isNoteOn(status)) this.btn_edit_pressed = true;
         if (isNoteOff(status)) this.btn_edit_pressed = false;
         return true;
      }
      //Morph Button
      if (data1 == XTOUCH_BTN_ROW_2[1]){
         if (isNoteOn(status)) {
            this.btn_morph_pressed = true;
            this.setMorphA();
            this.setMorphKnob(0, false);
         }
         if (isNoteOff(status)) this.btn_morph_pressed = false;
         return true;
      }

      //Slot Buttons
      if(isNoteOn(status)) {
         var slot_index = 0;
         for(var i = 0;i < XTOUCH_BTN_ROW_1.length) {
            if (data1 == XTOUCH_BTN_ROW_1[i]) {
               slot_index = i;
               break;
            }
         }            
            if (this.btn_edit_pressed){
               this.saveParametersToSlot(slot_index);
            } else if (this.btn_morph_pressed) {
               this.setMorphB(slot_index);
            } else {
               this.restoreParametersFromSlot(slot_index);
            }

         return true;
      }
   }
   if ( isChannelController(status) ) {

      if(data1==XTOUCH_MAIN_CC_LIST[0]){
         
         var data_mapped = floatToRange(data, 127);
         
         var value = data2 > 64 ? 64 - data2 : data2;
         this.setMorphKnob(value, true);
         track.volume().inc (value, 128);

         return true;
      } 
      //handle knob
      
   }
}
