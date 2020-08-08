function RemoteControlHandler (cursorDevice, remoteControlsBank, cc_list, hardware, knob_index) {
   //TODO: Modify CC_MIN/MAX to take a cc list which will be mapped to the cursor device.
   //Make tool support variety of cc that are not exactly one after anoth.
   println('new remote handler:' + remoteControlsBank);
   
   println('new remote cc_list:' + cc_list);
   
   this.cursorDevice = cursorDevice;
   this.remoteControlsBank = remoteControlsBank;
   this.hardware = hardware;
   
   this.cc_list = cc_list;
   this.cc_translation = [];
   this.enabled_bool = false;
   this.knob_index = knob_index;

   //Build reverse lookup table
   for(var i = 0;i<this.cc_list.length;i++){
      this.cc_translation[ parseInt(this.cc_list[i]) ] = i;
   }

   var i;
   for (var i = 0; i < this.remoteControlsBank.getParameterCount(); i++) {
      var callback_func = makeIndexedFunction(i, doObject(this, this.remoteUpdate));
      var parameter = this.remoteControlsBank.getParameter(i);
      parameter.value().addValueObserver(128,callback_func);
      parameter.name().markInterested();
   }
   this.setIndication(true);
}

RemoteControlHandler.prototype.selectedPageIndexChanged = function(){}
RemoteControlHandler.prototype.resetPage = function(){}

RemoteControlHandler.prototype.setIndication = function (enable)
{
   var i;
   for (i = 0; i < this.remoteControlsBank.getParameterCount (); i++){
      var parameter = this.remoteControlsBank.getParameter(i);
      parameter.setIndication(enable);
   }
}

RemoteControlHandler.prototype.remoteUpdate = function(index, value){
   var cc = this.cc_list[index];
   var status = 0xB0;
   var data1 = cc;
   var data2 = value;
   this.hardware.sendMidi(status, data1, data2);
}

RemoteControlHandler.prototype.updateLed = function(){
   if (this.enabled_bool == false) return;
   println('this.remoteControlsBank:::' + this.remoteControlsBank);
   for (var i = 0; i < this.remoteControlsBank.getParameterCount(); i++){
      var parameter = this.remoteControlsBank.getParameter(i); 
      var value = parameter.get() 
   
      //var min_val = 1;
      //var max_val = 11;

      var min_val = 33;
      var max_val = 43;
      var cc = XTOUCH_LED_KNOBS[0] + this.knob_index;
     // cc = this.cc_min + 8 + i;
      var status = 0xB0;

      //println('volume_value' + volume_value)
      value = map_range(value, 0, 1, min_val, max_val);
      value = Math.round(value);
      //println('value' + value);
      this.hardware.sendMidi(status, cc, value);

      var cc = this.cc_min + i;
      var status = 0xB0;
     // this.hardware.sendMidi(status, cc, 2);

   }

   /*
   //Update Solo LED
   for (i = 0; i < this.trackBank.getSizeOfBank (); i++){
      var track = this.trackBank.getItemAt(i);
      var solo_value = track.solo().get();
      
      status = 0x90;
      note = XTOUCH_BTN_ROW_1[i];
      value = 0;
      if (solo_value) value = 127;
      this.hardware.sendMidi(status, note, value);
   }
*/
  }

//TODO: Convert to using hardware connection...
RemoteControlHandler.prototype.handleMidi = function (status, data1, data2) {
   if (this.enabled_bool == false) return false;

   if (isNoteOn(status) && data2 > 64){
      if (data1 == XTOUCH_BTN_ROW_2[0]) {
         //reset all faders to max.

         for (var i = 0; i < this.remoteControlsBank.getParameterCount(); i++){
            var parameter = this.remoteControlsBank.getParameter(i); 
            parameter.set(0, 128);    
         }
      } else {

         //Reset Turnado
         index = XTOUCH_BTN_KNOBS.indexOf(data1);

         if (index == this.knob_index){
            var parameter = this.remoteControlsBank.getParameter(0); 
            parameter.set(0, 128); 
            return true;
         }
      }
   }

   if (isChannelController(status)) {
      var cc = parseInt(data1);
      var index = this.cc_translation[parseInt(data1)];

      println('data1: ' + data1)
      println('index: ' + index)
      if(index == undefined || index == null) return;

   
      if (index != undefined) {
         var value = data2 > 64 ? 64 - data2 : data2;
         this.remoteControlsBank.getParameter(index).inc(value, 128);        
         return true;
      }
   }
/*
   if (isChannelController(status)) {
      if(data1>=this.cc_min && data1<=this.cc_max){
         knob_id = data1-this.cc_min;

         var track = this.trackBank.getItemAt(knob_id);
         var data = track.volume().get();
         var data_mapped = floatToRange(data, 127);

        
         track.volume().inc (value, 128);

         return true;
      } 
   }
   */
   return false;    
}

RemoteControlHandler.prototype.enable = function(enabled_bool){
   this.enabled_bool = enabled_bool;
}