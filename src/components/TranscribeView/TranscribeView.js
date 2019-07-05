import React, { Component } from 'react';
import PropTypes from 'prop-types';

class TranscribeView extends Component {
  render() {
    return <div></div>;
  }
}

TranscribeView.propTypes = {};

var puncRGEX = /[?\.!,]/;

var transcriptObj;
var lastWordIndex = 0;

function myLoadFunc() {
  var jsonfileInput = document.getElementById('JsonfileInput');
  jsonfileInput.addEventListener('change', function(e) {
    var file = jsonfileInput.files[0];
    var reader = new FileReader();
    reader.onload = function(e) {
      var transcriptString = reader.result; // JSON.parse(reader.result)
      transcriptObj = JSON.parse(transcriptString);
      createPageFromJson();
    };
    reader.readAsText(file);
  });

  var audioFileInput = document.getElementById('AudioFileInput');
  var audioControl = document.getElementById('AudioControl');

  audioControl.addEventListener('seeked', resetTracking, false);

  audioFileInput.addEventListener('change', function(e) {
    var file = URL.createObjectURL(audioFileInput.files[0]);
    audioControl.src = file;
    resetTracking();
  });

  setInterval(wordTracker, 180);
}

var nextSegment = 0;
var nextSpeakerItem = -1;
function getNextSpeakerLabel() {
  nextSpeakerItem = nextSpeakerItem + 1;
  if (
    nextSpeakerItem >=
    transcriptObj.results.speaker_labels.segments[nextSegment].items.length
  ) {
    nextSegment = nextSegment + 1;
    nextSpeakerItem = 0;
  }
  return transcriptObj.results.speaker_labels.segments[nextSegment].items[
    nextSpeakerItem
  ].speaker_label;
}
function createPageFromJson() {
  // this is the main function for injecting html into page based on json file
  var page = document.getElementById('transcriptItems');

  var page = document.getElementById('transcriptItems');
  while (page.hasChildNodes()) {
    page.removeChild(page.lastChild);
  }

  if (typeof transcriptObj.results.speaker_labels != 'undefined') {
    nextSegment = 0;
    nextSpeakerItem = -1;
  }

  var items = transcriptObj.results.items;
  for (i in items) {
    var item = items[i];
    var vbox = document.createElement('a');
    vbox.id = i; // number boxes for text-audio sync
    vbox.className = 'vbox';

    createVboxElement('content', item.alternatives[0].content, vbox);
    createVboxElement('confidence', item.alternatives[0].confidence, vbox);
    createVboxElement('start_time', item.start_time, vbox);
    createVboxElement('end_time', item.end_time, vbox);

    var speaker_label = '';
    if (
      typeof transcriptObj.results.speaker_labels != 'undefined' &&
      item.type === 'pronunciation'
    ) {
      speaker_label = getNextSpeakerLabel();
    }
    createVboxElement('speaker_label', speaker_label, vbox);

    var playButton = document.createElement('button');
    playButton.onclick = (function(i) {
      return function() {
        playWord(i);
      };
    })(i);
    playButton.appendChild(document.createTextNode('play'));
    vbox.appendChild(playButton);

    var deleteButton = document.createElement('button');
    deleteButton.onclick = (function(i) {
      return function() {
        deleteColumn(i);
      };
    })(i);
    deleteButton.appendChild(document.createTextNode('delete'));
    vbox.appendChild(deleteButton);

    var insertButton = document.createElement('button');
    insertButton.onclick = (function(i) {
      return function() {
        insertColumn(i);
      };
    })(i);
    insertButton.appendChild(document.createTextNode('insert'));
    vbox.appendChild(insertButton);

    page.appendChild(vbox);
  }
  updateTranscriptText();
}

function updateTranscriptObj(awsTranscription) {
  // this is the main function for updating the json based on what changes the user makes on the html page
  var page = document.getElementById('transcriptItems');

  var items = [];
  var newTranscript = '';

  // pull data from html for use in creating json
  var contents = page.getElementsByClassName('content');
  var start_times = page.getElementsByClassName('start_time');
  var end_times = page.getElementsByClassName('end_time');
  var confidences = page.getElementsByClassName('confidence');
  var speaker_labels = page.getElementsByClassName('speaker_label');

  var currSpeaker = null;
  let speakers = new Set();

  for (var i = 0; i < contents.length; i++) {
    var item = new Object();

    // create item in json
    var content = contents[i].value.trim();
    item.start_time =
      typeof start_times[i] != 'undefined' ? start_times[i].value.trim() : '';
    item.end_time =
      typeof end_times[i] != 'undefined' ? end_times[i].value.trim() : '';
    item.alternatives = [];
    item.alternatives[0] = new Object();
    item.alternatives[0].content = content;
    item.alternatives[0].confidence =
      typeof confidences[i] != 'undefined' ? confidences[i].value.trim() : '';

    // set type of item and append content to transcript based on type
    if (puncRGEX.test(content) !== false) {
      item.type = 'punctuation';
      newTranscript = newTranscript.concat(content);
    } else {
      item.type = 'pronunciation';
      newTranscript = newTranscript.concat(' ');
      newTranscript = newTranscript.concat(content);
    }

    // monitor speaker label usage for creating speaker labels if necessary
    if (currSpeaker === null) {
      if (typeof speaker_labels[i] != 'undefined')
        // first time we see a speaker, record that speaker_label.
        currSpeaker = speaker_labels[i].value;
    } else if (
      typeof speaker_labels[i] != 'undefined' &&
      speaker_labels[i].value != '' &&
      speaker_labels[i].value != currSpeaker
    ) {
      // new speaker => new segment
      currSpeaker = speaker_labels[i].value;
      speakers.add(currSpeaker); // add any potential new speakers, to speaker set to record # speakers
    }

    items[i] = item;
  }
  if (speakers.size > 0) {
    // if speakers labels are used, create the speaker label structure
    awsTranscription.results.speaker_labels = createSpeakerLabels(
      speakers.size,
      speaker_labels,
      items
    );
  }
  awsTranscription.results.items = items;
  awsTranscription.results.transcripts[0].transcript = newTranscript.trim();
  updateTranscriptText();
}

function createSpeakerLabels(numSpeakers, gui_speaker_labels, items) {
  speaker_labels = new Object();

  speaker_labels.speakers = numSpeakers;
  speaker_labels.segments = [];
  var seg_index = -1;
  var seg_item_index = 0;
  var currSpeaker = null;
  for (var i = 0; i < gui_speaker_labels.length; i++) {
    var end_time = items[i].end_time; // get items end time, it might or might not be segment endtime....
    var start_time = items[i].start_time; // only set start time and speaker_label when creating new segment, but update end_time until new segment
    var speaker_label = gui_speaker_labels[i].value;
    var type = items[i].type;

    if (type != 'pronunciation') continue;

    if (currSpeaker === null || currSpeaker != speaker_label) {
      // if we have a new speaker in this transcript_item, then we have a new segment
      seg_index = seg_index + 1;
      currSpeaker = speaker_label;

      currSegment = new Object();
      currSegment.speaker_label = currSpeaker;
      currSegment.start_time = start_time;
      currSegment.end_time = end_time;
      currSegment.items = [];
      speaker_labels.segments[seg_index] = currSegment;

      seg_item_idx = 0;
    } else {
      // not a new segment, so same speaker, but update segment end_time
      currSegment.end_time = end_time;
    }
    var speaker_item = new Object();
    speaker_item.start_time = start_time;
    speaker_item.end_time = end_time;
    speaker_item.speaker_label = speaker_label;
    currSegment.items[seg_item_idx] = speaker_item;
    seg_item_idx = seg_item_idx + 1;
  }
  return speaker_labels;
}

function saveJsonFile() {
  var a = document.createElement('a');
  a.href =
    'data:attachment/json,' + encodeURIComponent(JSON.stringify(transcriptObj));
  a.target = '_blank';
  a.download = 'myFile.json';

  document.body.appendChild(a);
  a.click();
}

function updateTranscriptText() {
  // notice how this function mimics updateTranscriptObj function
  var transcriptText = document.getElementById('transcriptText');
  var contents = document.getElementsByClassName('content');
  var speaker_labels = document.getElementsByClassName('speaker_label');
  var currSpeaker = null;

  while (transcriptText.hasChildNodes()) {
    transcriptText.removeChild(transcriptText.lastChild);
  }

  for (var i = 0; i < contents.length; i++) {
    var content = contents[i].value.trim();
    var speaker_label = speaker_labels[i].value;

    var wordspan = document.createElement('span');
    wordspan.id = 'w' + i; // label word with id for audio tracking, note words and vbox with their content have ids like "wi" and "i" respectively, this should make it easy to sync the two with audio

    if (
      (currSpeaker === null && speaker_label != '') ||
      (currSpeaker != null &&
        currSpeaker != speaker_label &&
        speaker_label != '')
    ) {
      currSpeaker = speaker_label;
      var speakerIndicator = document.createElement('span');
      speakerIndicator.style = 'font-weight: bold;';
      speakerIndicator.innerHTML = currSpeaker + ' -: ';
      transcriptText.appendChild(document.createElement('br'));
      transcriptText.appendChild(speakerIndicator);
      transcriptText.appendChild(document.createElement('br'));
    }
    if (puncRGEX.test(content) !== false) {
      wordspan.innerHTML = content;
    } else {
      wordspan.innerHTML = ' '.concat(content);
    }
    transcriptText.appendChild(wordspan);
  }
}

//function updateTranscriptText(){
//	var fileDisplayArea = document.getElementById('transcriptText');
//	fileDisplayArea.innerText = transcriptObj.results.transcripts[0].transcript;
//}

function updateOnKeyUP(e) {
  //if (e.keyCode === 13) d //checks whether the pressed key is "Enter"
  updateTranscriptObj(transcriptObj);
}

function createVboxElement(className, valueSource, vbox) {
  var element = document.createElement('Input');
  element.className = className;
  element.value = typeof valueSource != 'undefined' ? valueSource : '';
  element.addEventListener(
    'contextmenu',
    function(event) {
      event.preventDefault();
    },
    false
  );
  vbox.appendChild(element);
  vbox.appendChild(document.createElement('br'));
  element.addEventListener('keyup', updateOnKeyUP);
}

function pauseAfterPlayingWord(i, intervalCalling) {
  var audioControl = document.getElementById('AudioControl');
  var item = document.getElementById(i); // this is not fast enough for accurate playing the selected word, use a manual timer instead....
  var end_times = item.getElementsByClassName('end_time');
  //	console.log("end: " + end_times[0].value.trim())
  if (audioControl.currentTime >= parseFloat(end_times[0].value.trim())) {
    audioControl.pause();
    clearInterval(intervalCalling);
  }
}

function playWord(i) {
  var audioControl = document.getElementById('AudioControl');
  var item = document.getElementById(i);
  var start_times = item.getElementsByClassName('start_time');
  //	console.log("start: " + start_times[0].value.trim())
  audioControl.currentTime = parseFloat(start_times[0].value.trim());
  audioControl.play();

  var intervalCalling = null; // call this function every millsec to check if we have reached the end of the word.
  intervalCalling = setInterval(function() {
    pauseAfterPlayingWord(i, intervalCalling);
  }, 1);
}

function createEmptyItem() {
  var item = new Object();
  item.start_time = '';
  item.end_time = '';
  item.alternatives = [];
  item.alternatives[0] = new Object();
  item.alternatives[0].content = '';
  item.alternatives[0].confidence = 1;
  item.type = 'pronunciation'; // assumed type is pronunciation , this will be updated as the user types, based on what they type
  return item;
}

function insertColumn(i) {
  // put new item in json Obj
  var j = parseInt(i) + 1;
  var items = transcriptObj.results.items;
  items.splice(j, 0, createEmptyItem());
  createPageFromJson();
}

function deleteColumn(i) {
  var items = transcriptObj.results.items;
  items.splice(i, 1);
  createPageFromJson();
}

function selectWord(i) {
  var doc = document;
  var wordSpan = doc.getElementById('w' + i);
  var vbox = doc.getElementById(i);

  if (doc.body.createTextRange) {
    // ms
    var range = doc.body.createTextRange();
    range.moveToElementText(wordSpan);
    range.select();
  } else if (window.getSelection) {
    // moz, opera, webkit
    var selection = window.getSelection();
    selection.removeAllRanges();

    wordSpan.scrollIntoView({ inline: 'center' });
    var wordSpanRange = doc.createRange();
    wordSpanRange.selectNodeContents(wordSpan);
    selection.addRange(wordSpanRange);

    //vbox.style.background = '#777';
    vbox.scrollIntoView({ inline: 'center' });
    var vboxRange = doc.createRange();
    vboxRange.selectNode(vbox);
    selection.addRange(vboxRange);
  }
}

function resetTracking() {
  lastWordIndex = 0;
}
function wordTracker() {
  var audioControl = document.getElementById('AudioControl');
  if (audioControl.paused) return;

  var currPlayTime = audioControl.currentTime;
  var start_times = document.getElementsByClassName('start_time');
  for (var i = lastWordIndex; i < start_times.length; i++) {
    if (typeof start_times[i] != 'undefined') {
      var start_time = parseFloat(start_times[i].value.trim());
      if (isNaN(start_time)) {
        //selectWord(i)
        continue;
      }
      if (start_time < currPlayTime && !audioControl.paused) {
        selectWord(i);
        lastWordIndex = i;
      } else return;
    }
  }
}

export default TranscribeView;
