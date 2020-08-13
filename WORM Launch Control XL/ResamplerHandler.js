// Written by Kirkwood West - kirkwoodwest.com
// (c) 2020
// Licensed under LGPLv3 - http://www.gnu.org/licenses/lgpl-3.0.txt

function ResamplerHandler(trackBank, cursorTrack, loop_length_handler, hardware, resample_btn, leds) {
    
   this.trackBank = trackBank;
   this.cursorTrack = cursorTrack;
   this.loop_length_handler = loop_length_handler;
   this.loop_length_handler_id = loop_length_handler;
   this.hardware = hardware;
   this.resample_btn = resample_btn;
   this.leds = leds;
   this.led_ready = leds[0];
   this.led_queue_record = leds[1];
   this.led_record = leds[2];
   this.led_queue_play = leds[3];
   this.led_play = leds[4];

   //Make trackbank follow cursor...
   this.trackBank.followCursorTrack(cursorTrack);
   this.cursorTrack.position().markInterested();

   //var navigation_mode = CursorNavigationMode.FLAT;
   //this.cursorTrack.setCursorNavigationMode(navigation_mode);
   
   for (var i=0;i < this.trackBank.getSizeOfBank(); i++){
      var track = this.trackBank.getItemAt(i);
      track.name().markInterested();
  
      var clipLauncherBank = track.clipLauncherSlotBank();
      for(var c =0; c<clipLauncherBank.getSizeOfBank();c++){
         var clip_launcher_slot = clipLauncherBank.getItemAt(c);
         clip_launcher_slot.isRecording().markInterested();
         if(i==0 && c==0){    
            //Only listen to events in the first slot in the first track of bank 
            clip_launcher_slot.isRecording().addValueObserver(doObject(this, this.isRecording));
            clip_launcher_slot.isPlaying().addValueObserver(doObject(this, this.isPlaying));
            clip_launcher_slot.isPlaybackQueued().addValueObserver(doObject(this, this.isPlaybackQueued));
            clip_launcher_slot.isRecordingQueued().addValueObserver(doObject(this, this.isRecordingQueued));

            //loop length handler stuff for auto playback after recording...
            this.loop_length_handler_id = this.loop_length_handler.addLaunchSlot(doObject(this, this.launchSlots));
         } 
      }
   }
}


ResamplerHandler.prototype.handleMidi = function(status, data1, data2) {
   if (isNoteOn(status) && data2 > 64){
      if (data1 == this.resample_btn) {  
         var count = this.trackBank.getSizeOfBank();
         for (var i=0;i < count; i++){
            var track = this.trackBank.getItemAt(i);
   
            var name = track.name().get();
            println('cursor Track position: ' + this.cursorTrack.position().get());
        
            println('Report: Bank Index: ' + i + " | Name: " + name);
        
            var clipLauncherBank = track.clipLauncherSlotBank();
            var clip_launcher_slot = clipLauncherBank.getItemAt(0);
            this.clip_launcher_slot = clip_launcher_slot;

            if (clip_launcher_slot.isRecording().get() == true) {
               clip_launcher_slot.launch();
               this.loop_length_handler.clearTimeIndex(this.loop_length_handler_id);
            } else {
               
               clip_launcher_slot.record();
               //Reset time index so it auto plays.
               this.loop_length_handler.setTimeIndex(this.loop_length_handler_id);
            }
         }      
      
         return true;
      }
   }
}

ResamplerHandler.prototype.launchSlots = function() {
      for (var i=0;i < this.trackBank.getSizeOfBank(); i++){
         var track = this.trackBank.getItemAt(i);
         var clipLauncherBank = track.clipLauncherSlotBank();
         var clip_launcher_slot = clipLauncherBank.getItemAt(0);
         clip_launcher_slot.launch();
      }      
}

ResamplerHandler.prototype.isRecording = function(val){
   if(val==true) this.hardware.sendSysex(this.led_record);

}

ResamplerHandler.prototype.isPlaybackQueued = function(val){
  // if(val==true) this.hardware.sendSysex(this.led_queue_play);
}

ResamplerHandler.prototype.isRecordingQueued = function(val){
   if(val==true) this.hardware.sendSysex(this.led_queue_record);
}

ResamplerHandler.prototype.isPlaying = function(val){
   if(val==true) this.hardware.sendSysex(this.led_play);
   if(val==false) this.hardware.sendSysex(this.led_ready);
}
