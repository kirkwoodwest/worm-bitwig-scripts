function ResamplerHandler(trackBank, cursorTrack, hardware, resample_btn, leds) {
    
   this.trackBank = trackBank;
   this.cursorTrack = cursorTrack;
   this.hardware = hardware;
   this.resample_btn = resample_btn;
   this.leds = leds;
   this.led_ready = leds[0];
   this.led_queue_record = leds[1];
   this.led_record = leds[2];
   this.led_queue_play = leds[3];
   this.led_play = leds[4];

   //Make trackbank follow cursor...
   trackBank.followCursorTrack(cursorTrack);
   
   for (i=0;i < this.trackBank.getSizeOfBank(); i++){
      var track = this.trackBank.getItemAt(i);
      track.name().markInterested();
  
      var clipLauncherBank = track.clipLauncherSlotBank();
      for(var c =0; c<clipLauncherBank.getSizeOfBank();c++){
         clip_launcher_slot = clipLauncherBank.getItemAt(c);
         clip_launcher_slot.isRecording().markInterested();
         if(i==0 && c==0){    
            //Only listen to events in the first slot in the first track of bank 
            clip_launcher_slot.isRecording().addValueObserver(doObject(this, this.isRecording));
            clip_launcher_slot.isPlaying().addValueObserver(doObject(this, this.isPlaying));
            clip_launcher_slot.isPlaybackQueued().addValueObserver(doObject(this, this.isPlaybackQueued));
            clip_launcher_slot.isRecordingQueued().addValueObserver(doObject(this, this.isRecordingQueued));
         } 
      }
   }
}


ResamplerHandler.prototype.handleMidi = function(status, data1, data2) {
   if (isNoteOn(status) && data2 > 64){
      if (data1 == this.resample_btn) {  
         for (i=0;i < this.trackBank.getSizeOfBank(); i++){
            var track = this.trackBank.getItemAt(i);
            var clipLauncherBank = track.clipLauncherSlotBank();
            var clip_launcher_slot = clipLauncherBank.getItemAt(0);
            
            if (clip_launcher_slot.isRecording().get() == true) {
               clip_launcher_slot.launch();
            } else {
               clip_launcher_slot.record();
            }
         }      
      
         return true;
      }
   }
}


ResamplerHandler.prototype.isRecording = function(val){
   if(val==true) this.hardware.sendSysex(this.led_record);
}

ResamplerHandler.prototype.isPlaybackQueued = function(val){
   if(val==true) this.hardware.sendSysex(this.led_queue_play);
}

ResamplerHandler.prototype.isRecordingQueued = function(val){
   if(val==true) this.hardware.sendSysex(this.led_queue_record);
}

ResamplerHandler.prototype.isPlaying = function(val){
   if(val==true) this.hardware.sendSysex(this.led_play);
   if(val==false) this.hardware.sendSysex(this.led_ready);
}