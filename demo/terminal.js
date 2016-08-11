
var worker;
var sampleImageData;
var sampleVideoData;
var outputElement;
var filesElement;
var running = false;
var isWorkerLoaded = false;
var isSupported = (function() {
  return document.querySelector && window.URL && window.Worker;
})();

function isReady() {
  return !running && isWorkerLoaded && sampleImageData && sampleVideoData;
}

function startRunning() {
  document.querySelector("#image-loader").style.visibility = "visible";
  outputElement.className = "";
  filesElement.innerHTML = "";
  running = true;
}
function stopRunning() {
  document.querySelector("#image-loader").style.visibility = "hidden";
  running = false;
}


$(function(){
  
  // For example purposes only
  function msg(txt){
    $('.message').text(txt);
  }
  
  window.input = new oTinput({
    element: document.querySelector('.example-input'),
    onFileChange: function(file){
      console.log(file);
      msg('File is: '+file.name);
      var audio = new Audio('/Users/Rawan/Downloads/dd/Dutty.mp3');
      audio.play();
    },
    onFileError: function(err){
      console.log(err);
      msg('Error: '+err.message);
    },
    onURLSubmit: function(url){
      msg('URL submitted: '+url);
    },
    onURLError: function(err, url){
      msg('Bad URL: '+url);
    },
    onDragover: function(){
      msg('Drop file now to input');
    },
    onDragleave: function(){
      msg('');
    }
  });
});


function retrieveSampleImage() {
  var oReq = new XMLHttpRequest();
  oReq.open("GET", "file:///Users/Rawan/Desktop/testpic.png", true);
  oReq.responseType = "arraybuffer";

  oReq.onload = function (oEvent) {
    var arrayBuffer = oReq.response;
    if (arrayBuffer) {
      sampleImageData = new Uint8Array(arrayBuffer);
    }
  };

  oReq.send(null);
}

function retrieveSampleVideo() {
  var oReq = new XMLHttpRequest();
  oReq.open("GET", "bigbuckbunny.webm", true);
  oReq.responseType = "arraybuffer";

  oReq.onload = function (oEvent) {
    var arrayBuffer = oReq.response;
    if (arrayBuffer) {
      sampleVideoData = new Uint8Array(arrayBuffer);
    }
  };

  oReq.send(null);
}

function parseArguments(text) {
  text = text.replace(/\s+/g, ' ');
  var args = [];
  // Allow double quotes to not split args.
  text.split('"').forEach(function(t, i) {
    t = t.trim();
    if ((i % 2) === 1) {
      args.push(t);
    } else {
      args = args.concat(t.split(" "));
    }
  });
  return args;
}


function runCommand(text) {
  if (isReady()) {
    startRunning();
    var args = parseArguments(text);
    console.log(args);
    worker.postMessage({
      type: "command",
      arguments: args,
      files: [
        {
          "name": "input.png",
          "data": sampleImageData
        },
        {
          "name": "input.webm",
          "data": sampleVideoData
        }
      ]
    });
  }
}

function getDownloadLink(fileData, fileName) {
  if (fileName.match(/\.jpeg|\.gif|\.jpg|\.png/)) {
    var blob = new Blob([fileData]);
    var src = window.URL.createObjectURL(blob);
    var img = document.createElement('img');

    img.src = src;
    return img;
  }
  else {
    var a = document.createElement('a');
    a.download = fileName;
    var blob = new Blob([fileData]);
    var src = window.URL.createObjectURL(blob);
    a.href = src;
    a.textContent = 'Click here to download ' + fileName + "!";
    return a;
  }
}

function initWorker() {
  worker = new Worker("worker-asm.js");
  worker.onmessage = function (event) {
    var message = event.data;
    if (message.type == "ready") {
      isWorkerLoaded = true;
      worker.postMessage({
        type: "command",
        arguments: ["-help"]
      });
    } else if (message.type == "stdout") {
      outputElement.textContent += message.data + "\n";
    } else if (message.type == "start") {
      outputElement.textContent = "Worker has received command\n";
    } else if (message.type == "done") {
      stopRunning();
      var buffers = message.data;
      if (buffers.length) {
        outputElement.className = "closed";
      }
      buffers.forEach(function(file) {
        filesElement.appendChild(getDownloadLink(file.data, file.name));
      });
    }
  };
}

document.addEventListener("DOMContentLoaded", function() {

  initWorker();
  retrieveSampleVideo();
  retrieveSampleImage();

  var inputElement = document.querySelector("#input");
  outputElement = document.querySelector("#output");
  filesElement = document.querySelector("#files");

  inputElement.addEventListener("keydown", function(e) {
    if (e.keyCode === 13) {
      runCommand(inputElement.value);
    }
  }, false);
  document.querySelector("#run").addEventListener("click", function() {
    runCommand(inputElement.value);
  });

  [].forEach.call(document.querySelectorAll(".sample"), function(link) {
    link.addEventListener("click", function(e) {
      inputElement.value = this.getAttribute("data-command");
      runCommand(inputElement.value);
      e.preventDefault();
    });
  });

});