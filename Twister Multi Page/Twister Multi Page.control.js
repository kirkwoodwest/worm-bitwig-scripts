loadAPI(12);

// Remove this if you want to be able to use deprecated methods without causing script to stop.
// This is useful during development.
host.setShouldFailOnDeprecatedUse(true);

host.defineController("Kirkwood West", "MULTI PAGE", "0.1", "188cda56-7bf6-4f7f-ba2f-2427a4f48a56", "kirkwoodwest");

host.defineMidiPorts(1, 1);

banks = [];
cursorTracks = [];
cursorRemotePages = [];
cursorTracks = [];
cursorDevices = [];
remoteHandlers = [];

midiOutputPort = undefined;

function init() {
   transport = host.createTransport();
   
   host.getMidiInPort(0).setMidiCallback(onMidi);
   midiOutputPort = host.getMidiOutPort(0)
   
   //Cursor Device
   follow_mode = CursorDeviceFollowMode.FIRST_DEVICE;
  // follow_mode = CursorDeviceFollowMode.FOLLOW_SELECTION;

   //Create Banks, Tracks and Cursor Devices...
   has_flat_track_list = true;
   bank = host.createTrackBank(1, 0, 0,has_flat_track_list) 
   banks.push(bank);

   cursor_track_id = 'CURSOR_TRACK';
   cursor_track_name = 'CURSOR_TRACK';
   should_follow_selection = false;
   cursorTrack = host.createCursorTrack(cursor_track_id, cursor_track_name, 0,0, should_follow_selection);
   cursorTracks.push(cursorTrack);

   bank.followCursorTrack(cursorTrack);
   
   page_count = 2;
   controls_par_page = 8;
   cc_min = 16;
   cc_max = 31;


   //Cursor Device
   cursor_device_index = 0;
   cursor_device_id = 'CURSOR_DEVICE_' + cursor_device_index;
   cursor_device_name = 'Device Page' + cursor_device_index;
   cursorDevice = cursorTrack.createCursorDevice(cursor_device_id, cursor_device_name, 0, follow_mode); // CursorDeviceFollowMode.FIRST_DEVICE
   cursorDevices.push(cursorDevice);

   //Build Cursor Devices for cursor Track
   for (i=0; i< page_count; i++){    
      
      //Cursor Remote
      //Custom Remote Handler Class
      cursor_remote_page_id = "CURSOR_REMOTE_PAGE_" + i;
      //cursorRemotePage = cursorDevice.createCursorRemoteControlsPage(controls_par_page);
      cursorRemotePage = cursorDevice.createCursorRemoteControlsPage(cursor_remote_page_id, controls_par_page, '');
      cursorRemotePages.push(cursorRemotePage);

      page_index = i;
      cursor_cc_min = cc_min + (page_index * controls_par_page);
      cursor_cc_max = cursor_cc_min + controls_par_page - 1;
      remoteHandler = new RemoteControlHandler(cursorDevice, cursorRemotePage, page_index, cursor_cc_min, cursor_cc_max) 
      remoteHandlers.push(remoteHandler);

   }
   println("MultiPage Initialized." + new Date());
   println("Now make some dope beats...");
}



// Called when a short MIDI message is received on MIDI input port 0.
function onMidi(status, data1, data2) {
   for(i=0; i< remoteHandlers.length; i++){
      stop_processing = remoteHandlers[i].handleMidi(status, data1, data2);
      if(stop_processing) return;
   }
}


function flush() {
   // TODO: Flush any output to your controller here.
}

function exit() {

}

//Remote Handler
function RemoteControlHandler (cursorDevice, remoteControlsBank, page_index, twister_cc_min, twister_cc_max) {
   this.cursorDevice = cursorDevice;
   this.remoteControlsBank = remoteControlsBank;

   this.page_index = page_index;
   println('\n init remote control handler----')
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
   this.remoteControlsBank.selectedPageIndex().set(this.page_index);
   println('pageNames(): ' + this.remoteControlsBank.pageNames().get());
   println('pageName: ' + this.remoteControlsBank.pageNames().get()[this.page_index]);
   println('pageNames() length: ' + this.remoteControlsBank.pageNames().get().length);
   println('pageNames() is empty: ' + this.remoteControlsBank.pageNames().isEmpty());

}

RemoteControlHandler.prototype.selectedPageIndexChanged = function(){


   
   println('\nselectedPageIndexChanged Event---------- ');
   println('internal index: ' + this.page_index);

   println('pageNames(): ' + this.remoteControlsBank.pageNames().get());
   println('pageName: ' + this.remoteControlsBank.pageNames().get()[this.page_index]);

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
   midiOutputPort.sendMidi(status, data1, data2);
}

//TODO: Figure out what this is for... i think its just for the color handler.... or some experiment related to it...
RemoteControlHandler.prototype.handleMidi = function (status, data1, data2) {
   data1 = data1;
   if (isChannelController(status)) {
      println('cc: ' + parseInt(data1))
      cc = parseInt(data1);

      if (cc < this.twister_cc_min || cc > this.twister_cc_max) {
         // don't process if the midi is out of range for the knob.
         println('knob out of range');
         println('cc: ' + cc)
         println('cc min: ' + this.twister_cc_min)
         println('cc max: ' + this.twister_cc_max)
         return;
      }
      index = this.cc_translation[parseInt(data1)];
      println('this.cc_translation: '+ this.cc_translation);
      println('status: '+ status);
      println('index: '+ index);

      if(index == undefined || index == null) {
         print('undefined or null')
         return;
      }

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

//UTILS
function doObject (object, f)
{
    return function ()
    {
        f.apply (object, arguments);
    };
}
