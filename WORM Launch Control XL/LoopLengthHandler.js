function LoopLengthHandler(transport, hardware) {
   this.transport = transport;
   this.hardware = hardware;
   this.transport.getPosition().markInterested();
   this.launch_slot_callbacks = [];
   this.launch_slot_times = [];
   this.setRecordLength(1);
}

LoopLengthHandler.prototype.addLaunchSlot = function(launch_slot_callback) {
   var launch_slot_id = this.launch_slot_callbacks.length;
   this.launch_slot_callbacks[launch_slot_id] = launch_slot_callback;
   this.launch_slot_times[launch_slot_id] = -1;
   return launch_slot_id;
}

LoopLengthHandler.prototype.setRecordLength = function(bars) {

   if (bars == 1) this.hardware.sendSysex(LAUNCH_LED_RESAMPLE_1BAR);
   if (bars == 2) this.hardware.sendSysex(LAUNCH_LED_RESAMPLE_2BAR);
   if (bars == 4) this.hardware.sendSysex(LAUNCH_LED_RESAMPLE_4BAR);
   if (bars == 8) this.hardware.sendSysex(LAUNCH_LED_RESAMPLE_8BAR);
   this.record_length = bars;
}

LoopLengthHandler.prototype.setTimeIndex = function(launch_slot_index) {
   this.launch_slot_times[launch_slot_index] = this.transport.getPosition().getFormatted();
}


LoopLengthHandler.prototype.clearTimeIndex = function(launch_slot_index) {
   this.launch_slot_times[launch_slot_index] = -1;
}

LoopLengthHandler.prototype.handleMidi = function(status, data1, data2) {
   //89,90,91,92...
   if (isNoteOn(status) && data2 > 64){
      if (data1 == LAUNCH_BTN_RESAMPLE_1BAR) {  
         this.setRecordLength(1);
         return true;
      } else if (data1 ==LAUNCH_BTN_RESAMPLE_2BAR) {
         this.setRecordLength(2);
         return true;
      } else if (data1 == LAUNCH_BTN_RESAMPLE_4BAR) {
         this.setRecordLength(4);
         return true;
      } else if (data1 == LAUNCH_BTN_RESAMPLE_8BAR) {
         this.setRecordLength(8);
         return true;
      }
   }
}

LoopLengthHandler.prototype.handleFlush = function(){
   for(var i = 0; i<this.launch_slot_callbacks.length; i++) {
      if(this.launch_slot_times[i] != -1) {
         //Get positions
         var pos = this.transport.getPosition().getFormatted();
         var old_pos =  this.launch_slot_times[i];
   
         //Get the bars data out of positions for compare.
         var bars = pos.split(':')[0];
         var beats = pos.split(':')[1];
         var bars_old = old_pos.split(':')[0];
         var beats_old = old_pos.split(':')[1];
   
         //Diff between the two positions against our traget record length
         var diff_bars = bars - bars_old;
         var diff_beats = bars - bars_old;

         //Check to see if we have matched the record length and launch the clip slots.
         if(diff_beats >= this.record_length && beats >= beats_old) { 
            //Do callback
            var cb_func = this.launch_slot_callbacks[i];
            cb_func();

            //Reset Launch slot times.
            this.launch_slot_times[i] = -1;
         }
      }
   }
   
}

LoopLengthHandler.prototype.launchSlots = function() {
   //Launches first slot of each track in the track bank...
   var clip_slot_index = 0;
   for (i=0;i < this.trackBank.getSizeOfBank(); i++){
      var track = this.trackBank.getItemAt(i);
      var clipLauncherBank = track.clipLauncherSlotBank();
      var clip_launcher_slot = clipLauncherBank.getItemAt(clip_slot_index);
      clip_launcher_slot.launch();
      this.time_index = -1;
   }      
}