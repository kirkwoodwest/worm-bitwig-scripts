function RemoteControlHandler (cursorDevice, remoteControlsBank , cc_list, hardware) {
   this.hardware = hardware;
   this.cursorDevice = cursorDevice;
   this.remoteControlsBank = remoteControlsBank;
   this.cc_list = cc_list;
   this.cc_translation = [];
   println('cc_list' + cc_list);
   for(i = 0;i<cc_list.length;i++){
      this.cc_translation[ parseInt(cc_list[i]) ] = i;
      println("this.cc_translation[cc_list[i]: + " + cc_list[i] + " index: " + i);
      println("cc_translation: + " +  this.cc_translation + " index: " + i);
   }

   var i;
   for (i = 0; i < this.remoteControlsBank.getParameterCount(); i++) {
      // this.remoteControlsBank.getParameter (i).markInterested ();
      var callback_func = makeIndexedFunction(i, doObject(this, this.remoteUpdate));
      this.remoteControlsBank.getParameter(i).value().addValueObserver(128,callback_func);
    //  println("created callback funcs: + " + i);
   }
}

RemoteControlHandler.prototype.setIndication = function (enable)
{
    var i;
    for (i = 0; i < this.remoteControlsBank.getParameterCount (); i++){
        this.remoteControlsBank.getParameter (i).setIndication (enable);
   }
}

RemoteControlHandler.prototype.updateLed = function(){
   var i;
   for (i = 0; i < this.remoteControlsBank.getParameterCount (); i++){
      var value = this.remoteControlsBank.getParameter (i).value();
      println('updateLED: ' + i + ': ' + value );


   //    var status = 0xB0;
   //   var data1 = cc;
   //   var data2 = value;
   //this.hardware.sendMidi(status, data1, data2);
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
   println("MIDIChannel(status)" + MIDIChannel(status))
   println("status(status)" + status)
   println("data1(" + data1)
   println("arseInt(data1)(" + parseInt(data1))
   println("data2(" + data2)
   println(" this.cc_translation(" +  this.cc_translation)
   data1 = data1 - CCBase;
   if (isChannelController(status)) {
      index = this.cc_translation[parseInt(data1)];
      println(" this.index(" +  index)
      if (index != undefined) {
         this.remoteControlsBank.getParameter(index).set(data2, 128); 
         return true;
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