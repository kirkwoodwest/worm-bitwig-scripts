ParameterSaverInstance = null;
const PARAMETER_SAVER_PRECISION = 4;

/**
 * 
 * @param {Number} bankSize Size of Bank necessary to determine how many color clips this script can manage...
 */
function ParameterSaver(hardware, bankSize, remoteHandlers) {

   //incoming paramters, twister, remoteControl Handlers
   //Need to retreive a list of parameters from the remote control handler
      //GetParameter list from remotecontrol handler and cc
         //get prarameter list and cc return array of parameter list, and array of cc.
         //save them into list for retrieval.
   //Store them in a single clip.
      //Method for writing the paramter values.
   //retreive them from clip
      //Method for reading paramter values, matching it up with paramter list and sending cc value to the twister hardware.
   

   this.hardware = hardware; //Likely the Xtouch...
   this.control_banks_and_cc_lists = []
   this.playingSlotIndex = -1;

   this.bank_content_slots = [];
   for(i=0;i<bankSize; i++){
      this.bank_content_slots[i] = null;
   }

   this.clip_names = [];

   this.clipEditEnabled = false; //This is a flag to determine if we are editing a clip for saving? //TODO: Is it needed?
   this.enabled_bool = false; //Whether or not the Parameter saving/morphing mode is enabled
  
   this.morph_parameters_a = [];
   this.morph_parameters_b = [];
   this.parameter_save_data = [];

   //Initialize morph knob...
   this.setMorphKnob(0, false);

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
   this.parameter_save_data[parameters_slot_index] = this.getParameterValues()[1];
   println('saveParametersToSlot' + parameters_slot_index);
   println('this.getParameterValues()[1]' + this.parameter_save_data[parameters_slot_index]);
}

ParameterSaver.prototype.restoreParametersFromSlot = function(parameters_slot_index){
   var parameter_data_values = this.parameter_save_data[parameters_slot_index];
   if (parameter_data_values) {

      println('restoreParametersFromSlot' + parameters_slot_index);
      println('this.setParameterValues()' + this.parameter_save_data[parameters_slot_index]);
      this.setParameterValues(parameter_data_values);
   }
}

//Morph A always gets the current values...
ParameterSaver.prototype.setMorphA = function(){
   //For morphs and parameter save data we just store the values list [1];
   this.morph_parameters_a = this.getParameterValues()[1];
}

//Morph B points to parameter save data.
ParameterSaver.prototype.setMorphB = function(parameters_slot_index){
   this.morph_parameters_b = this.parameter_save_data[parameters_slot_index];
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

   println('this.morph_parameters_a' + this.morph_parameters_a);
   println('this.morph_parameters_b' + this.morph_parameters_b);
   var param_array = [];
   for(var i = 0; i< this.morph_parameters_a.length; i++) {

      //Get Param values...
      var param_value_a = this.morph_parameters_a[i];
      var param_value_b = this.morph_parameters_b[i];

      println('param index:' + i + " || " + param_value_b);

      //Morph the parameter by the value.
      param_array[i] = Math.round(map_range(value, 0, 1, param_value_a, param_value_b));
   }
   
   println('morph parameters array: ' + param_array);
   //Send the array...
   this.setParameterValues(param_array)
}

//Set the morph knob...
ParameterSaver.prototype.setMorphKnob = function(value, do_morph) {
   this.morph_knob_value = value;
   if (do_morph) this.morphParameters(value);
}

ParameterSaver.prototype.setMorphKnobInc = function(inc_value) {
   println('inc_value: ' + inc_value);
   var inc_value_float = inc_value / 128 * -1;
   var old_value = this.morph_knob_value;
   
   new_value = old_value - inc_value_float;
   var new_value = valBetween(new_value,0,1);
   println("new value: " + new_value);
   println(" inc_value_float: " + inc_value_float);
   this.setMorphKnob(new_value, true);
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

//Set enabled flag 
ParameterSaver.prototype.enable = function(enabled_bool){
   this.enabled_bool = enabled_bool;
}


//Used by external funcs...
ParameterSaver.prototype.getCursorTrack = function(){
   return this.cursorTrack;
}

//Used by external funcs...
ParameterSaver.prototype.getTrackBank = function(){
   return this.trackBank;
}

//Add this to the midi process for the controller used.
ParameterSaver.prototype.updateLed = function(){
   if (this.enabled_bool == false) return;
   //Update the Leds on this...


   //show values for knobs...
   for (var i = 0; i < XTOUCH_LED_KNOBS_LIST.length; i++){
      var value = 0
      var min_val = 33;
      var max_val = 43;
      var cc = XTOUCH_LED_KNOBS_LIST[0] + i;
      var status = 0xB0;//CC Status
   
      if(i==0 ) value = map_range(this.morph_knob_value, 0,1, min_val,max_val);
      value = Math.round(value);
      this.hardware.sendMidi(status, cc, value);
   }

   //Highlight Buttons
   for (var i = 0; i < XTOUCH_LED_ROW_1.length;i++) {
      var status = 0x90;
      var note = XTOUCH_BTN_ROW_1[i];
      var value = 0;
      if (this.parameter_save_data[i]) value = 127;
      this.hardware.sendMidi(status, note, value);
   }

   //Always lit buttons
   var status = 0x90;
   var note = XTOUCH_BTN_ROW_2[0];
   var value = 127;
   this.hardware.sendMidi(status, note, value);

   note = XTOUCH_BTN_ROW_2[1];
   this.hardware.sendMidi(status, note, value);

   //Remaining leds off
   for(var i=2;i<XTOUCH_BTN_ROW_2.length;i++){
      note = XTOUCH_BTN_ROW_2[i];
      value = 0;
      this.hardware.sendMidi(status, note, value);
   }


   
   //Flow thru...
   return false;
}

//Add this to the midi process for the controller used.
ParameterSaver.prototype.handleTwisterMidi = function(status, data1, data2){

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
   debug_midi(status, data1, data2);
   //are we in the xtouch midi mode? 
   if (this.enabled_bool == false) return;

   if (isNoteOn(status) || isNoteOff(status)) {
      var is_pressed = (data2 > 64);
      println('is pressed' + is_pressed)

      //State Controllers 
      //Edit Button
      if (data1 == XTOUCH_BTN_ROW_2[0]){
         if (is_pressed) this.btn_edit_pressed = true;
         if (!is_pressed) this.btn_edit_pressed = false;
         return true;
      }
      //Morph Button
      if (data1 == XTOUCH_BTN_ROW_2[1]){
         if (is_pressed) {
            this.btn_morph_pressed = true;
            this.setMorphA();
            this.setMorphKnob(0, false);
         }
         if (!is_pressed) this.btn_morph_pressed = false;
         return true;
      }

      //Slot Buttons
      if(is_pressed) {
         var slot_index = 0;
         for(var i = 0;i < XTOUCH_BTN_ROW_1.length;i++) {
            if (data1 == XTOUCH_BTN_ROW_1[i]) {
               slot_index = i;
               break;
            }
         }            
         println('slot index: ' + slot_index);
         println('this.btn_edit_pressed: ' + this.btn_edit_pressed);
         if (this.btn_edit_pressed){
            this.saveParametersToSlot(slot_index);
         } else if (this.btn_morph_pressed) {
            this.setMorphB(slot_index);
         } else {
            //Parameter hard recall...
            this.restoreParametersFromSlot(slot_index);
            
            //If param recall reset the morph values to this index.
            this.setMorphKnob(0, false);
            this.setMorphB(slot_index);
         }

         return true;
      }
   }
   if ( isChannelController(status) ) {

      if(data1==XTOUCH_MAIN_CC_LIST[0]){
         
        // var data_mapped = floatToRange(data, 127);
         
         var value = data2 > 64 ? 64 - data2 : data2;
         this.setMorphKnobInc(value, true);
       //  track.volume().inc (value, 128);

         return true;
      } 
      //handle knob
      
   }
}
