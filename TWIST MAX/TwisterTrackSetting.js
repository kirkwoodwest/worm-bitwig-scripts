function TwisterTrackSetting (settings_id, target_channel_name, twister_id, cursor_track, channel_finder) {
   /*
      label	the name of the setting, must not be null
      category	the name of the category, may not be null
      numChars	the maximum number of character used for the text value
      initialText	the initial text value of the setting
   */
   label = settings_id; 
   category = twister_id; 
   numChars = 8;
   initialText = target_channel_name;
   this.setting = docstate.getStringSetting("Track", target_channel_name , numChars, initialText);
   this.setting.addValueObserver(doObject(this, this.trackNameChanged));
   this.twister_id = twister_id;
   this.settings_id = settings_id;
   this.target_channel_name = target_channel_name;
   this.channel_finder = channel_finder;
   this.cursor_track = cursor_track;
   this.trackBank = null;
}

//Alternative option to include a trackbank as well as the defualt cursor channel
TwisterTrackSetting.prototype.setTrackBank = function(trackBank) {
   this.trackBank = trackBank;
}

//Move cursor 
TwisterTrackSetting.prototype.retargetCursor = function(){
   println('cursor track' + this.cursor_track);
   if (this.cursor_track) this.channel_finder.find(this.cursor_track, this.target_channel_name);
}


TwisterTrackSetting.prototype.getTwisterID = function(){
   return this.twister_id;
}

TwisterTrackSetting.prototype.trackNameChanged = function(value){

   this.channel_finder.find(this.cursor_track, value);

   if (this.trackBank ) {
      this.channel_finder.findTrackBank(this.trackBank, value);
   }
   this.target_channel_name = value;
}