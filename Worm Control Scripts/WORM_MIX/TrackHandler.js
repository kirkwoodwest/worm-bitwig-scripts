function TrackHandler(trackbank, cursorTrack, massiveBank, fader_cc, track_name) {
   this.track_name = track_name;
   this.trackbank = trackbank;
   this.cursorTrack = cursorTrack;
   this.massiveBank = massiveBank;
   
   this.fader_cc = fader_cc;
   this.targetScrollIndex = 0;
   this.baseChannel = null
   //this.trackbank.itemCount.markInterested()
   for (i=0;i <this.trackbank.getSizeOfBank(); i++){
      var track = this.trackbank.getItemAt(i);

      var p = track.pan();
      p.markInterested();
      p.setIndication(true);

      p = track.volume();
      p.markInterested();
      p.setIndication(true);

      p = track.name();
      p.markInterested();
   }
   this.trackbank.itemCount().markInterested();
   this.massiveBank.itemCount().markInterested();
   for(i=0;i< this.massiveBank.getSizeOfBank();i++){
      var track = this.massiveBank.getItemAt(i);
      p = track.name();
      p.markInterested();
   }
   this.trackbank.scrollPosition().markInterested();
   this.cursorTrack.isPinned().markInterested();
   this.moveToProperTrack()
}

TrackHandler.prototype.moveToProperTrack = function() {
   var massiveBankCount = this.massiveBank.itemCount().get();
   var trackBankCount = this.trackbank.itemCount().get();

   //Determine if we have initialized the proper track...
   if ( massiveBankCount == 0 || trackBankCount == 0){
      host.scheduleTask(doObject(this, this.moveToProperTrack), 1000);
      return;
   }

   //Loop through the massive Bank... assuming its everything....
   targetScrollIndex = 0;
   for(i=0;i< this.massiveBank.getSizeOfBank();i++){
      if ( this.massiveBank.getItemAt(i).name().get()  == this.track_name ) {
         this.baseChannel = this.massiveBank.getItemAt(i);
         targetScrollIndex = i
         this.targetScrollIndex = targetScrollIndex
         break;
      }
   }

   if (this.trackbank.scrollPosition().get() != targetScrollIndex){
      //Attempt ot set the scroll position....
      this.trackbank.scrollPosition().set(targetScrollIndex);
      
      //restart it.
      host.scheduleTask(doObject(this, this.moveToProperTrack), 1000);
      host.scheduleTask(doObject(this, this.selectParent), 1000);
      return;
   }
}

TrackHandler.prototype.selectParent = function(){
   this.cursorTrack.selectChannel(this.baseChannel);
   this.cursorTrack.isPinned().set(true);
}

TrackHandler.prototype.handleMidi = function(status, data1, data2) {
   var success = false

   //this.moveToProperTrack();
//
   if (isChannelController(status)){
      switch(data1){
         case this.fader_cc:
            this.trackbank.getItemAt(0).volume().set(data2, 128);
            success = true;
            break;
            /*
         case FADER_6:
            this.trackbank.getItemAt(1).volume().set(data2, 128);
            success = true;
            break;
         case FADER_7:
            this.trackbank.getItemAt(2).volume ().set(data2, 128);
            success = true;
            break;
         case FADER_8:
            this.trackbank.getItemAt(3).volume ().set(data2, 128);
            success = true;
            break;
            */
      }
   }


  /* 
   if (isNoteOn(status) && data2 == 127) {
      println("Process is happening");
      switch (data1) {
         case FIRST_BTN_B_1:
           //println(getMethodsNames(this.trackbank));
           
           this.trackbank.scrollIntoView(-4);
           
          // this.trackbank.cursorIndex(1)
            success = true;
            break;
         case FIRST_BTN_B_2:
            //this.trackbank.scrollPageForwards()
            this.trackbank.scrollIntoView(5);
            println("cursor index: " +this.trackbank.cursorIndex()); 
            success = true;
            break;
         case FIRST_BTN_B_3:
            //this.trackbank.scrollPageForwards()
            track = this.trackbank.getItemAt(1);
            println("say my name: " +track.name().get() ); 
           // track.setName("blah" + Math.random())
           
            success = true;
            break;
      }
      println("SCROLLPOSITION index: " +this.trackbank.scrollPosition());
   }

   */
   return success;
}
