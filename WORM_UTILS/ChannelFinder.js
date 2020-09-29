// Written by Kirkwood West - kirkwoodwest.com
// (c) 2020
// Licensed under LGPLv3 - http://www.gnu.org/licenses/lgpl-3.0.txt

var CHANNEL_FINDER_TRACK_COUNT = 64;
_ChannelFinderInstance = null;
function ChannelFinder(){
   if (_ChannelFinderInstance == null ){ 
      this.channels = [];
      this.channel_names = [];
      this.trackBank = host.createTrackBank(CHANNEL_FINDER_TRACK_COUNT,0,0, true);
      this.trackBank.scrollPosition().markInterested();
      this.searches = []
     
      //Mark names as interested.
      for(var i=0;i<CHANNEL_FINDER_TRACK_COUNT-1; i++){
         var channel = this.trackBank.getItemAt(i);
         channel.name().markInterested();
         channel.name().addValueObserver(doObject(this, this._nameUpdate));
         
         var name = channel.name()
         this.channels[i] = channel;
         this.channel_names[name] = channel;
      }
      
      _ChannelFinderInstance = this;
   } else { 
      return _ChannelFinderInstance;
   }
 }

ChannelFinder.prototype._nameUpdate = function(name) {
}

 
ChannelFinder.prototype.setupCursorTracks = function(){
   for(var i=0;i< arguments.length;i++) {
      var cursor_track = arguments[i];
      cursor_track.isPinned().markInterested();   
      cursor_track.name().markInterested();   
   }
}


//Moves cursor track to target channel;
ChannelFinder.prototype.find = function(cursor_track, name){

   //Reset base trackbank
   this.trackBank.scrollPosition().set(0);
   //LOOP 
   for(var i=0;i<CHANNEL_FINDER_TRACK_COUNT-1; i++){
      var channel = this.trackBank.getItemAt(i);
      var channel_name = channel.name().get();
      
      if (channel_name == name) {
         cursor_track.selectChannel(channel);
         cursor_track.isPinned().set(true);
         return;
      }
   }
}
//TODO: Fix the Channel finder by not using a target bank. When it does the find it should do a looping search. 
// But also first search the current name to start out with.

//Moves cursor track to target channel;
ChannelFinder.prototype.findTrackBank = function(track_bank, name){

   var index = this.searches.length
   this.searches[index] = {'track_bank':track_bank, 'name':name, 'position': 0}
   var task_func = makeIndexedFunction(index, doObject(this, this.trackBankFindNext));
   task_func();
}

ChannelFinder.prototype.trackBankFindNext = function(index){
   var track_bank = this.searches[index].track_bank
   var name = this.searches[index]['name']  
   var channel = track_bank.getItemAt(0);
   var channel_name = channel.name().get();
   println('trackbank find: ' + name)


   if ( channel_name == name) {
      return
   } else {
      position = this.searches[index]['position']  
      var channel = track_bank.scrollPosition().set(position);
      this.searches[index].position = position + 1
      
      var task_func = makeIndexedFunction(index, doObject(this, this.trackBankFindNext));
      host.scheduleTask(task_func, 500); 
   }
}