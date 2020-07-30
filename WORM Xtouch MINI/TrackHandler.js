function TrackHandler(trackBank, cursorTrack, hardware, cc_min, cc_max) {
 
   this.trackBank = trackBank;
   this.cursorTrack = cursorTrack;
   this.hardware = hardware;
   this.cc_min = cc_min;
   this.cc_max = cc_max;

   this.solo_status = [false, false, false, false, false, false, false, false];

   this.enable(true);

   for (i=0;i < this.trackBank.getSizeOfBank(); i++){
      var track = this.trackBank.getItemAt(i);

      //Volume
      p = track.volume();
      p.markInterested();
      p.setIndication(true);
   
      var callback_func = makeIndexedFunction(i, doObject(this, this.volumeUpdate));
      p.value().addValueObserver(callback_func);

      //SOLO
      p = track.solo();
      p.markInterested();
   
      var callback_func = makeIndexedFunction(i, doObject(this, this.soloUpdate));
      p.addValueObserver(callback_func);

      p = track.name();
      p.markInterested();
   }

}

TrackHandler.prototype.volumeUpdate = function(index, value){
   var cc = XTOUCH_LED_KNOBS[0] + index;
   var status = 0xB0;
   var data1 = cc;
   var data2 = value;
  // this.hardware.sendMidi(status, data1, data2);

   //midi channel
   //var status = 0xB0 | XTOUCH_MIDI_CHANNEL;
//   this.hardware.sendMidi(status, data1, data2);

   println('volumeUpdate: ' + status)
  // this.hardware_cirklon.sendMidi(status, data1, data2);
}

TrackHandler.prototype.soloUpdate = function(index, value){
}

TrackHandler.prototype.enable = function(enabled_bool){
   this.enabled_bool = enabled_bool;
}

TrackHandler.prototype.updateLed = function(){
   if (this.enabled_bool == false) return;

   var i;
   for (i = 0; i < this.trackBank.getSizeOfBank (); i++){
      var track = this.trackBank.getItemAt(i);
      var volume_value = track.volume().get();
   
      //var min_val = 1;
      //var max_val = 11;

      var min_val = 33;
      var max_val = 43;
      var cc = XTOUCH_LED_KNOBS[0] + i;
     // cc = this.cc_min + 8 + i;
      var status = 0xB0;

      //println('volume_value' + volume_value)
      value = map_range(volume_value, 0, 1, min_val, max_val);
      value = Math.round(value);
      //println('value' + value);
      this.hardware.sendMidi(status, cc, value);

      var cc = this.cc_min + i;
      var status = 0xB0;
     // this.hardware.sendMidi(status, cc, 2);

   }

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

  }


TrackHandler.prototype.handleMidi = function(status, data1, data2) {
   println('TrackHandler.prototype.handleMidi ');
   println('TrackHandler.prototype.handleMidi ' + status);
   println('TrackHandler.prototype.handleMidi ' + status);
   debug_midi(status, data1, data2, 'Midi Note Handled', false);
   if (this.enabled_bool == false) return;
   if (isNoteOn(status) && data2 > 64){


      if (data1 == XTOUCH_BTN_ROW_2[0]) {
         //reset all faders to max.
         for (var i=0;i < this.trackBank.getSizeOfBank(); i++){
            var track = this.trackBank.getItemAt(i);
            //reset Track Bank...
            println('reset track bank')
            track.volume().set(VOLUME_MAX_CC, 127);
            
         }
      }

      index = XTOUCH_BTN_ROW_1.indexOf(data1);

      if (index != -1){

         solo_status = this.solo_status[index];
         solo_status = !solo_status;
         this.solo_status[index] = solo_status;

         var track = this.trackBank.getItemAt(index);
         track.solo().set(solo_status);
         return true;
      }
   }
   if (isChannelController(status)) {
      if(data1>=this.cc_min && data1<=this.cc_max){
         knob_id = data1-this.cc_min;

         var track = this.trackBank.getItemAt(knob_id);
         var data = track.volume().get();
         var data_mapped = floatToRange(data, 127);

         var value = data2 > 64 ? 64 - data2 : data2;
         track.volume().inc (value, 128);

         return true;
      } 
   }
}
