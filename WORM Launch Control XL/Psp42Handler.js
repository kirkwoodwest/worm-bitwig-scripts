// Written by Kirkwood West - kirkwoodwest.com
// (c) 2020
// Licensed under LGPLv3 - http://www.gnu.org/licenses/lgpl-3.0.txt

var BANK_INDEX_DENS = 4;
var BANK_INDEX_RPT = 3;

var DENS_VALS = [48, 64, 88, 120];
function Psp42Handler(cursorDevice, remoteControlsBank, cc_list, hardware) {
   RemoteControlHandler.call(this, cursorDevice, remoteControlsBank, cc_list, hardware);
   this.psp42inf = false;
   this.psp42dens = 0;
}

// inherit RemoteHandler
Psp42Handler.prototype = Object.create(RemoteControlHandler.prototype);

// correct the constructor pointer because it points to Person
Psp42Handler.prototype.constructor = Psp42Handler;



Psp42Handler.prototype.remoteUpdate = function(index, value){
   var cc = this.cc_list[index];
   var status = 0xB0;
   var data1 = cc;
   var data2 = value;
   this.hardware.sendMidi(status, data1, data2);
}

Psp42Handler.prototype.densValIncrement = function() {
   
   var value = DENS_VALS[this.psp42dens];
   this.psp42dens++;
   if(this.psp42dens == DENS_VALS.length) this.psp42dens = 0;
   return value; 
}

Psp42Handler.prototype.infToggle = function() {
   this.psp42inf = !this.psp42inf;
   var value = 127;
   if( this.psp42inf == false) value = 0;
   return value; 
}

Psp42Handler.prototype.updateLeds = function () {
   println('this.psp42dens' + this.psp42dens);
   this.hardware.sendSysex(LAUNCH_LED_BTN_DELAY_DENS[this.psp42dens]);

   var led=0;
   if(this.psp42inf) led=1;
   this.hardware.sendSysex(LAUNCH_LED_BTN_DELAY_INF[led]);

}

//TODO: Convert to using hardware connection...
Psp42Handler.prototype.handleMidi = function(status, data1, data2) {
   data1 = data1;
   if (isNoteOn(status)) {
      var value = 0;
      var index = -1;
      if (data1 == LAUNCH_CONTROL_PSP42_INF) {
         value = this.infToggle();
         index = 3;
      }

      if (data1 == LAUNCH_CONTROL_PSP42_DENS) {
         value = this.densValIncrement();
         index = 4;
      }

      if(index!=-1){
         this.remoteControlsBank.getParameter(index).set(value, 128);
         this.updateLeds();
      }
      return true;
   }
   if (isChannelController(status)) {
      var cc = parseInt(data1);
      var index = this.cc_translation[parseInt(data1)];
      if(index == undefined || index == null) return;

      if (index != undefined) {
         this.remoteControlsBank.getParameter(index).set(data2, 128);        
         return true;
      }
   }
   return false;    
}