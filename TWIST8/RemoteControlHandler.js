function RemoteControlHandler (cursorDevice, remoteControlsBank, cc_list, hardware) {
   this.hardware = hardware;
   this.cursorDevice = cursorDevice;
   this.remoteControlsBank = remoteControlsBank;
   this.cc_list = cc_list;
   this.cc_translation = [];
   this.ccBase = 0;

   for(i = 0;i<cc_list.length;i++){
      this.cc_translation[ parseInt(cc_list[i]) ] = i;
   }

   var i;
   for (i = 0; i < this.remoteControlsBank.getParameterCount(); i++) {
      var callback_func = makeIndexedFunction(i, doObject(this, this.remoteUpdate));
      var parameter = this.remoteControlsBank.getParameter(i);
      parameter.value().addValueObserver(128,callback_func);
      parameter.name().markInterested();
   }
   this.setIndication(true);
}

RemoteControlHandler.prototype.updateLed = function(){
   var i;
   for (i = 0; i < this.remoteControlsBank.getParameterCount (); i++){
      var value = this.remoteControlsBank.getParameter (i).value();
   }
  }

RemoteControlHandler.prototype.setIndication = function (enable)
{
   var i;
   for (i = 0; i < this.remoteControlsBank.getParameterCount (); i++){
      var parameter = this.remoteControlsBank.getParameter(i);
      parameter.setIndication (enable);
   }
}

RemoteControlHandler.prototype.remoteUpdate = function(index, value){
   var cc = this.cc_list[index] + this.ccBase;
   var status = 0xB0;
   var data1 = cc;
   var data2 = value;
   this.hardware.sendMidi(status, data1, data2);
}

RemoteControlHandler.prototype.setCCBase = function(ccBase) {
   this.ccBase = ccBase;
}

RemoteControlHandler.prototype.handleMidi = function (status, data1, data2) {
   data1 = data1 - this.ccBase;
   if (isChannelController(status)) {
      index = this.cc_translation[parseInt(data1)];
      if (index != undefined) {
         this.remoteControlsBank.getParameter(index).set(data2, 128); 
         this.remoteControlsBank.getParameter(index).name().set('yolo')
         return true;
      }
   }
   return false;    
}