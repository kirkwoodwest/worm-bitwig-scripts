// Written by Kirkwood West - kirkwoodwest.com
// (c) 2020
// Licensed under LGPLv3 - http://www.gnu.org/licenses/lgpl-3.0.txt

function TrackSendHandler(trackBank, cursorTrack, cc_list, hardware) {   

   this.trackBank = trackBank;
   this.cursorTrack = cursorTrack;
   this.hardware = hardware;

   this.sendBanks = [];

   this.cc_list = cc_list;
   this.cc_translation = [];

   //Build reverse lookup table
   for(var i = 0; i < this.cc_list.length; i++){
      this.cc_translation[ parseInt(this.cc_list[i]) ] = i;
   }


   //Follow Cursor Track
   this.trackBank.followCursorTrack(cursorTrack);

   //NOTE: Trackbank size should be 1, so everything is coded accordingly.
   for (var i=0; i < this.trackBank.getSizeOfBank(); i++){
      var track = this.trackBank.getItemAt(i);
      track.name().markInterested();
      
      var sendBank = track.sendBank();
      sendBank.setSizeOfBank(2);
      this.sendBanks[i] = sendBank;
      
      for(var s=0;s< sendBank.getSizeOfBank();s++) {
         var send = sendBank.getItemAt(s);
         var callback_func = makeIndexedFunction(s, doObject(this, this.remoteUpdate));
         send.value().addValueObserver(callback_func);
      }
   }

}


TrackSendHandler.prototype.remoteUpdate = function(index, value){
   var cc = this.cc_list[index];
   var status = 0xB0;
   var data1 = cc;
   var data2 = value;
   this.hardware.sendMidi(status, data1, data2);
}

TrackSendHandler.prototype.updateLed = function(){}


TrackSendHandler.prototype.handleMidi = function(status, data1, data2) {
   if (isChannelController(status)) {

      var cc = parseInt(data1);
      println('cctransl:' + this.cc_translation)
      println('cctransl:' + this.cc_translation)
      var index = this.cc_translation[parseInt(data1)];

      if(index == undefined || index == null) return;

      if (index != undefined) {
   
         this.sendBanks[0].getItemAt(index).value().set(data2, 128);        
         return true;
      }
   } 
   return false;
}
