

function RemoteControlHandler (cursorDevice, remoteControlsBank, page_index, twister_cc_min, twister_cc_max, hardware) {
   this.hardware = hardware;
   this.cursorDevice = cursorDevice;
   this.remoteControlsBank = remoteControlsBank;

   this.page_index = page_index;
   println('page index: ' + page_index);
   println('twister_cc_min: ' + twister_cc_min);
   println('twister_cc_max: ' + twister_cc_max);

   this.twister_cc_min = twister_cc_min;
   this.twister_cc_max = twister_cc_max;

   this.cc_list = [];
   index = 0;
   for(i=twister_cc_min;i<=twister_cc_max;i++){
      println('indexed: ' + i)
      println('indexed: ' + index)
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

   this.remoteControlsBank.selectedPageIndex().markInterested();
   this.remoteControlsBank.selectedPageIndex().addValueObserver(doObject(this, this.selectedPageIndexChanged));
   this.remoteControlsBank.pageCount().addValueObserver(doObject(this, this.resetPage),-1);

   var i;
   for (i = 0; i < this.remoteControlsBank.getParameterCount(); i++) {
      var callback_func = makeIndexedFunction(i, doObject(this, this.remoteUpdate));
      var parameter = this.remoteControlsBank.getParameter(i);
      parameter.value().addValueObserver(128,callback_func);
      parameter.name().markInterested();
   }
   this.setIndication(true);
   this.resetPage();
}

RemoteControlHandler.prototype.pageNamesChanged = function(){
   println('pageNames(): ' + this.remoteControlsBank.pageNames().get());
   println('pageNames() length: ' + this.remoteControlsBank.pageNames().get().length);
   println('pageNames() is empty: ' + this.remoteControlsBank.pageNames().isEmpty());

}

RemoteControlHandler.prototype.selectedPageIndexChanged = function(){

   println('\nselectedPageIndexChanged Event---------- ');
   println('internal index: ' + this.page_index);
   this.remoteControlsBank.selectedPageIndex().set(this.page_index);
   println('this.remoteControlsBank.selectedPageIndex().get() : ' + this.remoteControlsBank.selectedPageIndex().get());
}
RemoteControlHandler.prototype.resetPage = function(){
   println('\nRESET PAGE---------- ');
   this.remoteControlsBank.selectedPageIndex().set(this.page_index);
   println('twister_cc_min' + this.twister_cc_min + '  | this.page_index:' + this.page_index);
   println('this.remoteControlsBank.selectedPageIndex().get()' + this.remoteControlsBank.selectedPageIndex().get());
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
   var cc = this.cc_list[index];//.toString(16);
   var status = 0xB0;
   var data1 = cc;
   var data2 = value;
   this.hardware.sendMidi(status, data1, data2);
}

//TODO: Figure out what this is for... i think its just for the color handler.... or some experiment related to it...
RemoteControlHandler.prototype.handleMidi = function (status, data1, data2) {
   data1 = data1;
   if (isChannelController(status)) {
      index = this.cc_translation[parseInt(data1)];
      println('this.cc_translation: '+ this.cc_translation);
      println('status: '+ status);
      println('index: '+ index);

      if(index == undefined || index == null) return;

      println('data1: '+ data1);
      if (index != undefined) {
         this.remoteControlsBank.getParameter(index).set(data2, 128); 

         //set color?
         name_str = this.remoteControlsBank.getParameter(index).name().get();
         split_str = name_str.split('|')
         if (split_str[1] != null) {
            color_number = split_str[1];
            base_string = split_str[0];
            
            new_string = base_string + '|' + data2;
            this.remoteControlsBank.getParameter(index).name().set(new_string)
         }
         
         return true;
      }
   }
   return false;    
}