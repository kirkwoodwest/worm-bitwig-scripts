function RemoteControlHandler (cursorDevice, remoteControlsBank , cc_list, midi_channel, hardware, page_index) {
   this.hardware = hardware;
   this.cursorDevice = cursorDevice;
   this.remoteControlsBank = remoteControlsBank;
   this.cc_list = cc_list;
   this.cc_translation = {};
   this.midi_channel = midi_channel;
   this.page_index = page_index;
   for(i = 0;i<cc_list.length;i++){
   this.cc_translation[cc_list[i]] = i;
   }

   
   this.remoteControlsBank.selectedPageIndex().markInterested();
   this.remoteControlsBank.selectedPageIndex().set(page_index);
   var i;
   for (i = 0; i < this.remoteControlsBank.getParameterCount(); i++) {
      // this.remoteControlsBank.getParameter (i).markInterested ();
      var callback_func = makeIndexedFunction(i, doObject(this, this.remoteUpdate));
      this.remoteControlsBank.getParameter(i).value().addValueObserver(128,callback_func);
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

   var status = 0xB0;
   var data1 = cc;
   var data2 = value;
   this.hardware.sendMidi(status, data1, data2);
   println('remote update: index: ' + index + ": value: " + value);
}

RemoteControlHandler.prototype.handleMidi = function (status, data1, data2)
{
   println(this.midi_channel)
   println("MIDIChannel(status)" + MIDIChannel(status))
   println("status(status)" + status)
   if ( MIDIChannel(status) +1 == this.midi_channel) {
      if (isChannelController(status)) {
         index = this.cc_translation[data1];
         if (index != undefined) {
            this.remoteControlsBank.getParameter(index).set(data2, 128); 
            return true;
         }
      }
   }

   return false;    
}

function makeIndexedFunction(index, f)
{
	return function(value)
	{
		f(index, value);
	};
}