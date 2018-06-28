var Tracks = {
  load: function(trackName = ''){

    var self = this;
    if ( !trackName ) { return false; }
    var XHR = new XMLHttpRequest();
    XHR.open('GET', '/lib/' + trackName + '.trk');
    XHR.onreadystatechange = function(){
      if (this.readyState == 4 && this.status == 200) {
          self.prepareTrack(XHR.responseText);
      }
    }
    XHR.send();
  },
  currentTrack: [], // keep current track here
  prepareTrack: function(data){
    var self = this;
    // this functions converts the text file into track data
    var tmp = data.split("\n");
    var data = [];
    for(var line in tmp){
      var lineData = tmp[line];
      var row = [];
      var t;
      for(t = 0; t < 7; t++){
        if(lineData[t] && lineData[t] != ' '){
          row[t] = lineData[t];
        } else {
          row[t] = null;
        }
      }
      data.push(row);
    }
    self.currentTrack = data;
    main();
  }
};

Tracks.load('track-2');
