function TrackHandler(trackBank, cursorTrack, hardware, cc_min, cc_max) {
 
   this.trackBank = trackBank;
   this.cursorTrack = cursorTrack;
   this.hardware = hardware;
   this.cc_min = cc_min;
   this.cc_max = cc_max;


   for (i=0;i < this.trackBank.getSizeOfBank(); i++){
      var track = this.trackBank.getItemAt(i);

 
      p = track.volume();
      p.markInterested();
      p.setIndication(true);

      var callback_func = makeIndexedFunction(i, doObject(this, this.volumeUpdate));
      p.value().addValueObserver(callback_func);

      p = track.name();
      p.markInterested();

      var cc = this.cc_min + i;
      var status = 0xB0;
      this.hardware.sendMidi(status, cc, 0);
   }

}

TrackHandler.prototype.volumeUpdate = function(index, value){
   var cc = XTOUCH_LED_KNOBS[0] + index;
   var status = 0xB0;
   var data1 = cc;
   var data2 = value;
   this.hardware.sendMidi(status, data1, data2);

   //midi channel
   //var status = 0xB0 | XTOUCH_MIDI_CHANNEL;
//   this.hardware.sendMidi(status, data1, data2);

   println('volumeUpdate: ' + status)
  // this.hardware_cirklon.sendMidi(status, data1, data2);
}

TrackHandler.prototype.updateLed = function(){
   var i;
   for (i = 0; i < this.trackBank.getSizeOfBank (); i++){
      var track = this.trackBank.getItemAt(i);
      var volume_value = track.volume().get();
     
  

      var min_val = 1;
      var max_val = 13;
      var cc = XTOUCH_LED_KNOBS[0] + index;
     // cc = this.cc_min + 8 + i;
      var status = 0xB0;

      println('volume_value' + volume_value)
      value = map_range(volume_value, 0, 1, min_val, max_val);
      value = Math.round(value);
      println('value' + value);
      this.hardware.sendMidi(status, cc, value);

      var cc = this.cc_min + i;
      var status = 0xB0;
     // this.hardware.sendMidi(status, cc, 2);

   }
   println('update LED')
  }


TrackHandler.prototype.handleMidi = function(status, data1, data2) {
   if (isNoteOn(status)){
      switch (data1)
      {
          case XTOUCH_RESET_FADER_NOTE:
             //reset all faders to max.
            for (i=0;i < this.trackBank.getSizeOfBank(); i++){
               var track = this.trackBank.getItemAt(i);
               track.volume().set(VOLUME_MAX_CC, 127);
            }
         
            return true;
      }
   }
   if (isChannelController(status)) {
      if(data1>=this.cc_min||data1<=this.cc_max){
         knob_id = data1-this.cc_min;
         println('knob_id' + knob_id)
         println('bank size: ' + this.trackBank.getSizeOfBank());
         var track = this.trackBank.getItemAt(knob_id);

         remapped_data2 = map_range(data2, 0, 127, 0, VOLUME_MAX_CC);
         track.volume().set(remapped_data2, 127);
         return true;
      } 
   }
}
