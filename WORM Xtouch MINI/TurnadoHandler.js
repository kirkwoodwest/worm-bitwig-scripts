function TurnadoHandler (track_names, cc_list, hardware) {
   var follow_mode = CursorDeviceFollowMode.FIRST_DEVICE;
   this.track_names = track_names;
   this.cursorTracks =[];
   this.cursorDevices =[];
   this.cursorRemotes =[];
   this.hardware = hardware;
   this.enabled_bool = false;
   this.cc_list = cc_list;
   //Hardcoded to one for the first knob (Dictation)
   var knob_count = 1;

   for (var i=0;i<track_names.length;i++){
      var cursor_track_id = "CURSOR_TRACK_TURNADO_" + i;
      var cursorTrack = host.createCursorTrack(cursor_track_id, "TURNADO" + i, 0,0, false);
      channelFinder.setupCursorTracks(cursorTrack);
      this.cursorTracks.push(cursorTrack);

      var cursor_device_id = "CURSOR_DEVICE_TURNADO_" + i;
      var cursorDevice = cursorTrack.createCursorDevice(cursor_device_id, "TURNADO" + i, 0, follow_mode);
      this.cursorDevices.push(cursorDevice);

      var cursor_remote_page_id = "CURSOR_REMOTE_TURNADO_" +  i;
      var cursorRemotePage = cursorDevice.createCursorRemoteControlsPage(cursor_remote_page_id, knob_count,'');
      for (var h = 0; h < cursorRemotePage.getParameterCount(); h++) {
         var callback_func = makeIndexedFunction(i, doObject(this, this.remoteUpdate));
         var parameter = cursorRemotePage.getParameter(h);
         parameter.value().addValueObserver(128,callback_func);
      }
      this.cursorRemotes.push(cursorRemotePage);  
   }

   //Build reverse lookup table
   this.cc_translation = [];
   for(var i = 0;i<this.cc_list.length;i++){
      this.cc_translation[ parseInt(this.cc_list[i]) ] = i;
   }
}

/*
TurnadoHandler.prototype.setIndication = function (enable)
{
   var i;
   for (i = 0; i < this.remoteControlsBank.getParameterCount (); i++){
      var parameter = this.remoteControlsBank.getParameter(i);
      parameter.setIndication(enable);
   }
}

*/
TurnadoHandler.prototype.remoteUpdate = function(index, value){
   var cc = this.cc_list[index];
   var status = 0xB0;
   var data1 = cc;
   var data2 = value;
   this.hardware.sendMidi(status, data1, data2);
}

TurnadoHandler.prototype.updateLed = function(){
   if (this.enabled_bool == false) return;
   for (var i = 0; i < this.cursorRemotes.length; i++){
      var parameter = this.cursorRemotes[i].getParameter(0); 
      var value = parameter.get() 

      var min_val = 33;
      var max_val = 43;
      var cc = XTOUCH_LED_KNOBS[0] + i;
      var status = 0xB0;

      value = map_range(value, 0, 1, min_val, max_val);
      value = Math.round(value);

      this.hardware.sendMidi(status, cc, value);

      var cc = this.cc_min + i;
      var status = 0xB0;
   }

      //Update Preset LED
      //TODO: Implement in bitwig device and make flag for updating this value...
      for (i = 0; i < this.cursorRemotes.length; i++){
         var solo_value = false
         status = 0x90;
         note = XTOUCH_BTN_ROW_1[i];
         value = 0;
         if (solo_value) value = 127;
         this.hardware.sendMidi(status, note, value);
      }
  }

//TODO: Convert to using hardware connection...
TurnadoHandler.prototype.handleMidi = function (status, data1, data2) {
   if (this.enabled_bool == false) return false;

   if (isNoteOn(status) && data2 > 64){
      if (data1 == XTOUCH_BTN_ROW_2[0]) {
         
         //resets all turnados to 0.
         for (var i = 0; i < this.cursorRemotes.length; i++){
            var cursor_remote = this.cursorRemotes[i];

            //Set to point at first parameter of every device. (Dictator)
            
            var parameter = cursor_remote.getParameter(0); 
            parameter.set(0, 128);    
         }
      } else {

         //Reset Specific Turnado Knob to 0.
         index = XTOUCH_BTN_KNOBS.indexOf(data1);

         if (index != -1 && index != undefined) {
            var cursor_remote = this.cursorRemotes[index]; 
            var parameter = cursor_remote.getParameter(0); 
            parameter.set(0, 128); 
            return true;
         }
      }
   }

   if (isChannelController(status)) {
      var cc = parseInt(data1);
      var index = this.cc_translation[parseInt(data1)];

      if(index == undefined || index == null) return;
   
      if (index != undefined) {
         var value = data2 > 64 ? 64 - data2 : data2;
         var cursor_remote = this.cursorRemotes[index]; 
         var parameter = cursor_remote.getParameter(0); 
         parameter.inc(value, 128);        
         return true;
      }
   }
   return false;    
}

TurnadoHandler.prototype.enable = function(enabled_bool){
   this.enabled_bool = enabled_bool;
}

TurnadoHandler.prototype.retargetNames = function(channel_finder){
   for(var i = 0; i < this.cursorTracks.length;i++) {
      var cursor_track = this.cursorTracks[i];
      var name = this.track_names[i];
      channel_finder.find(cursor_track, name);
   }
}