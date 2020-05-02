function RemoteControlHandler (cursorDevice, remoteControlsBank , cc_list, midi_channel, hardware, page_index) {
   this.hardware = hardware;
   this.cursorDevice = cursorDevice;
   this.remoteControlsBank = remoteControlsBank;
   this.cc_list = cc_list;
   
   this.cc_translation = {};
   this.cc_values = {};
   
   this.midi_channel = midi_channel;
   this.page_index = page_index;
   
   for(i = 0;i<cc_list.length;i++){
      this.cc_translation[cc_list[i]] = i;
      this.cc_values[cc_list[i]] = -1;
   }

   this.remoteControlsBank.selectedPageIndex().markInterested();
   this.remoteControlsBank.pageCount().addValueObserver(doObject(this, this.resetPage),-1);
   println('page count' + this.remoteControlsBank.pageCount().get());

   var i;
   for (i = 0; i < this.remoteControlsBank.getParameterCount(); i++) {
      var callback_func = makeIndexedFunction(i, doObject(this, this.remoteUpdate));
      this.remoteControlsBank.getParameter(i).value().addValueObserver(128,callback_func);
      this.remoteControlsBank.getParameter(i).setIndication(true);
   }
}

RemoteControlHandler.prototype.resetPage = function(){
   this.remoteControlsBank.selectedPageIndex().set(this.page_index);
}

RemoteControlHandler.prototype.setIndication = function (enable)
{
    var i;
    for (i = 0; i < this.remoteControlsBank.getParameterCount (); i++){
        this.remoteControlsBank.getParameter (i).setIndication (enable);
   }
}

RemoteControlHandler.prototype.remoteUpdate = function(index, value){
   var cc = this.cc_list[index];

   return;

   if(this.cc_values[cc] == value){ 
    //  println('this.cc_values[cc] == value) ' + index + ": value: " + value);
      return;
   } else {
   //   println('update) ' + index + ": value: " + value);

   };

   println('page count' + this.remoteControlsBank.pageCount().get());

   var status = 0xB0;
   var data1 = cc;
   var data2 = value;
   this.hardware.sendMidi(status, data1, data2);
 //  println('remote update: index: ' + index + ": value: " + value);
}

RemoteControlHandler.prototype.updateLED = function(){
   //
   println('RemoteControlHandler.prototype.updateLED :' );
   var status = 0xB0 | (this.midi_channel-1);
   for (var i = 0; i < this.remoteControlsBank.getParameterCount (); i++){
      var value = Math.round(this.remoteControlsBank.getParameter(i).value().get() * 127);
      var cc = this.cc_list[i];

      println('RemoteControlHandler.prototype.updateLED :' + cc + ' : ' + value  );
      this.hardware.sendMidi(status, cc, value);
      if (this.cc_values[cc] != value) {
         
      }
      //println('updateLED: cc ' + cc + '--- value: ' + value)
   }
}

RemoteControlHandler.prototype.updateValues = function(){
   var i;
   for (i = 0; i < this.remoteControlsBank.getParameterCount (); i++){
      this.remoteControlsBank.getParameter (i);
  }
}

RemoteControlHandler.prototype.handleMidi = function (status, data1, data2){
   if (isChannelController(status)) {
      if (data1 == BCR_BTN_BOX_1) {
      }


      index = this.cc_translation[data1];
      
      //return if its already there...
      if(this.cc_values[data1] == data2) return true;

      if (index != undefined) {
        // println('identified...')
         this.remoteControlsBank.getParameter(index).set(data2, 128); 
         this.cc_values[data1] = data2;
         return true;
      }
   }


   return false;    
}
