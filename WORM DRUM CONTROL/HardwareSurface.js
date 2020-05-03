function HardwareSurface(hardwareSurface, inputPort, midi_channel) {
  
   DRUM_COL_1 = [BCR_ROW_3_1, BCR_ROW_2_1, BCR_ROW_1_1, BCR_ENCODER_GRP_1_1, BCR_ENCODER_GRP_2_1, BCR_ENCODER_GRP_3_1, BCR_ENCODER_GRP_4_1, BCR_BTN_1_1, BCR_BTN_2_1];
   DRUM_COL_2 = [BCR_ROW_3_2, BCR_ROW_2_2, BCR_ROW_1_2, BCR_ENCODER_GRP_1_2, BCR_ENCODER_GRP_2_2, BCR_ENCODER_GRP_3_2, BCR_ENCODER_GRP_4_2, BCR_BTN_1_2, BCR_BTN_2_2];
   DRUM_COL_3 = [BCR_ROW_3_3, BCR_ROW_2_3, BCR_ROW_1_3, BCR_ENCODER_GRP_1_3, BCR_ENCODER_GRP_2_3, BCR_ENCODER_GRP_3_3, BCR_ENCODER_GRP_4_3, BCR_BTN_1_3, BCR_BTN_2_3];
   DRUM_COL_4 = [BCR_ROW_3_4, BCR_ROW_2_4, BCR_ROW_1_4, BCR_ENCODER_GRP_1_4, BCR_ENCODER_GRP_2_4, BCR_ENCODER_GRP_3_4, BCR_ENCODER_GRP_4_4, BCR_BTN_1_4, BCR_BTN_2_4];
   DRUM_COL_5 = [BCR_ROW_3_5, BCR_ROW_2_5, BCR_ROW_1_5, BCR_ENCODER_GRP_1_5, BCR_ENCODER_GRP_2_5, BCR_ENCODER_GRP_3_5, BCR_ENCODER_GRP_4_5, BCR_BTN_1_5, BCR_BTN_2_5];
   DRUM_COL_6 = [BCR_ROW_3_6, BCR_ROW_2_6, BCR_ROW_1_6, BCR_ENCODER_GRP_1_6, BCR_ENCODER_GRP_2_6, BCR_ENCODER_GRP_3_6, BCR_ENCODER_GRP_4_6, BCR_BTN_1_6, BCR_BTN_2_6];
   DRUM_COL_7 = [BCR_ROW_3_7, BCR_ROW_2_7, BCR_ROW_1_7, BCR_ENCODER_GRP_1_7, BCR_ENCODER_GRP_2_7, BCR_ENCODER_GRP_3_7, BCR_ENCODER_GRP_4_7, BCR_BTN_1_7, BCR_BTN_2_7];
   DRUM_COL_8 = [BCR_ROW_3_8, BCR_ROW_2_8, BCR_ROW_1_8, BCR_ENCODER_GRP_1_8, BCR_ENCODER_GRP_2_8, BCR_ENCODER_GRP_3_8, BCR_ENCODER_GRP_4_8, BCR_BTN_1_8, BCR_BTN_2_8];
   
   this.controls = [DRUM_COL_1, DRUM_COL_2, DRUM_COL_3, DRUM_COL_3, DRUM_COL_4, DRUM_COL_5, DRUM_COL_6, DRUM_COL_7, DRUM_COL_8];

   this.hardware_knobs = [];

   for(var col=0;col<this.controls.length;col++){
      var drum_col = this.controls.length;
      
      var knob_col = [];
      for(var row=0;row<drum_col.length;row++){
         var knob_name = 'KNOB_' + midi_channel + '_' + col + '_' + row;
         var knob = this.hardwareSurface.createAbsoluteHardwareKnob(knob_name);
         knob.setAdjustValueMatcher(inputPort.createAbsoluteCCValueMatcher, midi_channel, this.controls[col][row]);
         knob_col.push(knob);
      }
      this.hardware_knobs[col].push(knob_col);
   }

}