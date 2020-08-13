// Written by Kirkwood West - kirkwoodwest.com
// (c) 2020
// Licensed under LGPLv3 - http://www.gnu.org/licenses/lgpl-3.0.txt

function RemoteControlHandler (cursorDevice, remoteControlsBank, cc_list, hardware) {
   //TODO: Modify CC_MIN/MAX to take a cc list which will be mapped to the cursor device.
   //Make tool support variety of cc that are not exactly one after anoth.

   
   this.cursorDevice = cursorDevice;
   this.remoteControlsBank = remoteControlsBank;
   this.hardware = hardware;
   
   this.cc_list = cc_list;
   this.cc_translation = [];

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

//TODO: Convert to using hardware connection...
RemoteControlHandler.prototype.handleMidi = function (status, data1, data2) {
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