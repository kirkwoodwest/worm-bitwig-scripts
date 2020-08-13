// Written by Kirkwood West - kirkwoodwest.com
// (c) 2020
// Licensed under LGPLv3 - http://www.gnu.org/licenses/lgpl-3.0.txt

load('ChannelFinder.js')
loadAPI(12);

// Remove this if you want to be able to use deprecated methods without causing script to stop.
// This is useful during development.
host.setShouldFailOnDeprecatedUse(true);

host.defineController("Kirkwood West", "Channel Finder ", "0.1", "9077497e-f617-4275-b286-15d68cfb5b03", "kirkwoodwest");
DocFindTrackSetting = null;
DocFindTrackName = null;
RescanSettings = null;
ChannelFinderInstance = null;

main_cursor_track = null;

function init() {
   //Sertup Document Preferences
   docstate = host.getDocumentState();
   DocFindTrackSetting = docstate.getStringSetting('Name', "Target Track Name",8, 'Inst 11');
   DocFindTrackSetting.addValueObserver(settingMainTrackNameChanged);
   DocFindTrackName = DocFindTrackSetting.get();  

   RescanSettings = docstate.getSignalSetting('Rescan','Rescan Tracks', "Rescan Tracks")
   RescanSettings.addSignalObserver(settingMainTrackNameChanged);
   
   main_cursor_track = host.createCursorTrack("CURSOR_TRACK_2", "CURSOR TRACK", 0,0, false);

   ChannelFinderInstance = new ChannelFinder();
   ChannelFinderInstance.setupCursorTracks(main_cursor_track);
   ChannelFinderInstance.find(main_cursor_track, DocFindTrackName)

   println("Channel Finder  initialized!");
}


function flush() {
   // TODO: Flush any output to your controller here.
}

function exit() {

}

function settingMainTrackNameChanged(value){
   ChannelFinderInstance.find(main_cursor_track, DocFindTrackSetting.get());
}