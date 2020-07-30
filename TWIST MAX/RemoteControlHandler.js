

function RemoteControlHandler (cursorDevice, remoteControlsBank, page_index, twister_cc_min, twister_cc_max, hardware_twister, hardware_cirklon) {
   this.cursorDevice = cursorDevice;
   this.remoteControlsBank = remoteControlsBank;
   this.page_index = page_index;
   this.twister_cc_min = twister_cc_min;
   this.twister_cc_max = twister_cc_max;
   this.hardware_twister = hardware_twister;
   this.hardware_cirklon = hardware_cirklon;

   this.cc_list = [];
   index = 0;
   for(i=twister_cc_min;i<=twister_cc_max;i++){
      this.cc_list[index] = i;
      index++;
   }

   this.cc_translation = [];
   this.ccBase = 0;

   //Build reverse lookup table
   for(i = 0;i<this.cc_list.length;i++){
      this.cc_translation[ parseInt(this.cc_list[i]) ] = i;
   }

   //Get Page Data
   this.remoteControlsBank.pageNames().markInterested();
   this.remoteControlsBank.pageNames().addValueObserver(doObject(this, this.pageNamesChanged));

   var i;
   for (i = 0; i < this.remoteControlsBank.getParameterCount(); i++) {
      var callback_func = makeIndexedFunction(i, doObject(this, this.remoteUpdate));
      var parameter = this.remoteControlsBank.getParameter(i);
      parameter.value().addValueObserver(128,callback_func);
      parameter.name().markInterested();
   }
   this.setIndication(true);
}

RemoteControlHandler.prototype.pageNamesChanged = function(){
   //Page update so make sure to update the indexes...
   page_names = this.remoteControlsBank.pageNames().get();
   index = 0;
   if (this.page_index < page_names.length) index = this.page_index;
   this.remoteControlsBank.selectedPageIndex().set(this.page_index);
}

RemoteControlHandler.prototype.selectedPageIndexChanged = function(){}
RemoteControlHandler.prototype.resetPage = function(){}


RemoteControlHandler.prototype.setIndication = function (enable)
{
   var i;
   for (i = 0; i < this.remoteControlsBank.getParameterCount (); i++){
      var parameter = this.remoteControlsBank.getParameter(i);
      parameter.setIndication (enable);
   }
}

RemoteControlHandler.prototype.remoteUpdate = function(index, value){

   //Do not update if editing color
   //TODO: make this more up to code standards...
   if(ColorTrackInstance.enableEditToggle) return;

   var cc = this.cc_list[index];//.toString(16);
   var status = 0xB0;
   var data1 = cc;
   var data2 = value;
   this.hardware_twister.sendMidi(status, data1, data2);
}

//TODO: Convert to using hardware connection...
RemoteControlHandler.prototype.handleMidi = function (status, data1, data2) {
   data1 = data1;
   if (isChannelController(status)) {

      cc = parseInt(data1);

       //skip process if the midi is out of range for the knob.
      if (cc < this.twister_cc_min || cc > this.twister_cc_max) return;

      index = this.cc_translation[parseInt(data1)];

      if(index == undefined || index == null) {
         print('undefined or null')
         return;
      }
      
      if (index != undefined) {
         this.remoteControlsBank.getParameter(index).set(data2, 128);        
         return true;
      }
   }
   return false;    
}