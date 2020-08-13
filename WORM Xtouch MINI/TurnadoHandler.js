// Written by Kirkwood West - kirkwoodwest.com
// (c) 2020
// Licensed under LGPLv3 - http://www.gnu.org/licenses/lgpl-3.0.txt

function TurnadoHandler (track_names, cc_list, hardware) {
   var follow_mode = CursorDeviceFollowMode.FIRST_DEVICE;
   this.track_names = track_names;
   this.cursorTracks =[];
   this.cursorDevices =[];
   this.cursorRemotes =[];
   this.hardware = hardware;
   this.enabled_bool = false;
   this.cc_list = cc_list;


   //Preset selection
   this.preset_knob_data = [0,0,0,0,0,0,0,0];
   this.preset_knobs_pressed = [false,false,false,false,false,false,false];
   this.preset_edit_all = false;
   this.preset_edit_knobs = false;

   //Hardcoded to one for the first knob (Dictation)
   var knob_count = 2;

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

   if( this.preset_edit_knobs){
      //indicate current preset selection
     
      //Light up LED BUTTONS for which presets are selected.
      for(var i=0;i<this.preset_knobs_pressed.length;i++){
         var status = 0x90; //note status
         var note = XTOUCH_LED_KNOBS[0] + i;
 
         note = XTOUCH_BTN_ROW_1[i];
         var value = 0;
         if (this.preset_knobs_pressed[i]) value = 127;
         this.hardware.sendMidi(status, note, value);
      }

      //Knobs, show values for currently selected preset
      //Change knob values to match preset first id
      for(var i=0;i<this.preset_knobs_pressed.length;i++){
         //Do action based on the first knob that was pressed.
         if (this.preset_knobs_pressed[i]) {
            var parameter = this.cursorRemotes[i].getParameter(1); 
            var preset_value = parameter.getRaw() - 1;
            
            //set LED status of knobs
            for(var d=0;d<XTOUCH_LED_KNOBS_LIST.length;d++){
               var status = 0xB0; //cc status
               var cc = XTOUCH_LED_KNOBS_LIST[0] + d;
               var value = 33;//OFF
               if (d == preset_value) value = 43; //Full On
               println('preset value' + preset_value);
               this.hardware.sendMidi(status, cc, value);
            }
            break;
         }
      }


      //Exit 
      return;
   }

   //show values for knobs...
   for (var i = 0; i < this.cursorRemotes.length; i++){
      var parameter = this.cursorRemotes[i].getParameter(0); 
      var value = parameter.get() 

      var min_val = 33;
      var max_val = 43;
      var cc = XTOUCH_LED_KNOBS_LIST[0] + i;
      var status = 0xB0;//CC Status

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

TurnadoHandler.prototype.KnobData = function(knob_index){
   //these are values 0-7 (preset 1 - 8)

}

//Flags which buttons are pressed for editing
TurnadoHandler.prototype.editTurnadoPreset = function(turnado_id, edit_bool) {
   this.preset_knobs_pressed[turnado_id] = edit_bool;

   var button_is_pressed = false;
   for(var i=0;i<this.preset_knobs_pressed.length;i++){
      if (this.preset_knobs_pressed[i]) {
         this.preset_edit_knobs = true;
         return;
      }
   }

   //No buttons are pressed.
   this.preset_edit_knobs = false;
}

//Selects preset for flagged knobs for edit knobs.
TurnadoHandler.prototype.presetSelect = function(preset_index) {
   for(var i=0;i<this.preset_knobs_pressed.length;i++){
      if (this.preset_knobs_pressed[i]){
         //send value to turnado...
         var cursor_remote = this.cursorRemotes[i]; 
         var parameter = cursor_remote.getParameter(1); 
         parameter.set(preset_index, 128); 
      }
   }
}


//TODO: Convert to using hardware connection...
TurnadoHandler.prototype.handleMidi = function (status, data1, data2) {
   if (this.enabled_bool == false) return false;

   if (isNoteOn(status) || isNoteOff(status)) {
      var find_index = XTOUCH_BTN_ROW_1.indexOf(data1);
      if (find_index != -1){
         this.preset_knobs_pressed[find_index] = true;
         var edit = false
         if (data2 > 64) edit = true;
         this.editTurnadoPreset(find_index, edit);
         return;
      }
   }
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
         //knob presses
         if ((this.preset_edit_knobs) ) {
            //Preset Selection mode
            index = XTOUCH_BTN_KNOBS.indexOf(data1);

            if (index != -1 && index != undefined) {
               this.presetSelect(index);
               return true;
            }
         } else {
            //Knob value Reset Mode
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
   }

   if (isChannelController(status)) {
      if (this.preset_edit_knobs) {
         //do nothing.

      } else { 
         //Control Turnado Dictator
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