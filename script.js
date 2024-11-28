let model;
let modelsLoaded = false;
let resultsData = [];
const notification = document.getElementById("notification");
const resultsDiv = document.getElementById("results");
const downloadButton = document.getElementById("downloadButton");
const fileInput = document.getElementById("fileInput");
const video = document.getElementById("video");
const image = document.getElementById("image");
const canvas = document.getElementById("trafficCanvas");
const ctx = canvas.getContext("2d");
let detectionColors = {};


        let cvReady = false;

        function onOpenCvReady() {
            cvReady = true;
            // document.getElementById('upload').disabled = false; // Enable the file input
            console.log("OpenCV.js is ready.");
        }
async function loadModel() {
  notification.style.display = "block";
  const startTime = performance.now();
  model = await cocoSsd.load();
  const endTime = performance.now();
  notification.textContent = `Model loaded in ${(endTime - startTime).toFixed(2)} ms. Let's begin!`;
  modelsLoaded = true;
  if (modelsLoaded) {
    fileInput.disabled=false;}
    
  setTimeout(() => {
    notification.style.display = "none";
  }, 3000);
}
    // fileInput.disabled="true";
const dropArea = document.getElementById("file-drop-area");

["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
  dropArea.addEventListener(eventName, preventDefaults, false);
});

["dragenter", "dragover"].forEach((eventName) => {
  dropArea.addEventListener(eventName, () => dropArea.classList.add("highlight"), false);
});

["dragleave", "drop"].forEach((eventName) => {
  dropArea.addEventListener(eventName, () => dropArea.classList.remove("highlight"), false);
});

dropArea.addEventListener("drop", (event) => {
  const files = event.dataTransfer.files;
  fileInput.files = files;
  handleFileUpload({ target: fileInput });
});
fileInput.addEventListener("change", handleFileUpload);

function handleFileUpload(event) {
  if (!modelsLoaded) {
    resultsDiv.textContent = "Please wait, models are still loading.";
    return;
  }
    
  const file = event.target.files[0];
  if (!file) return;

  const fileURL = URL.createObjectURL(file);
  video.src = "";  
  video.classList.add('hidden');
  image.classList.add('hidden');
  resultsDiv.innerHTML = "Processing... Please wait.";
  resultsData = [];

  if (file.type.startsWith("image/")) {
    processImage(fileURL);
  } else if (file.type.startsWith("video/")) {
    processVideo(fileURL);
  }
}

async function processImage(fileURL) {
  // const img = new Image();
  image.classList.remove('hidden');
  image.src = fileURL;
  image.onload = async () => {
    canvas.width = image.width;
    canvas.height = image.height;
    ctx.drawImage(image, 0, 0, image.width, image.height);
        // Draw the image on the canvas
  // canvas.width = img.width > 800 ? 800 : img.width;
  // canvas.height = img.height > 400 ? 400 : img.height;
  // ctx.drawImage(img, 0, 0, canvas.width, canvas.height);


    const predictions = await model.detect(canvas);
      resultData = predictions
    drawDetections(predictions);
    displayResults(predictions);
    logResultsToConsole(predictions, "image");
  };
}

// function processVideo(fileURL) {
//   const video = document.createElement("video");
//   video.src = fileURL;
//   video.autoplay = true;
//   video.muted = true;
//   video.loop = true;

//   video.onloadeddata = () => {
//     canvas.width = video.videoWidth;
//     canvas.height = video.videoHeight;

//     video.addEventListener("play", () => {
//       const interval = setInterval(() => {
//         if (video.paused || video.ended) {
//           clearInterval(interval);
//           logResultsToConsole(resultsData, "video");
//           return;
//         }
//         ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
//         model.detect(canvas).then((predictions) => {
//           drawDetections(predictions);
//           collectVideoResults(predictions, video.currentTime);
//         });
//       }, 1000); // Process every 1 second
//     });
//   };
// }
// Handle Video Processing
// const processVideo = (file) => {
//   video.src = file;
//   video.classList.remove('hidden');
//   video.addEventListener('play', processVideoFrame);
// };



// const processVideoFrame = () => {
//     let resultVideo= []
//   if (video.paused || video.ended) {
//           resultsData.forEach(Element =>{ t=Element.time;let donk=[]; Element.objects.forEach(e=>{donk.push(e.class)});resultVideo.push({t:donk.join()}) })
//     displayResults(resultVideo);
//           logResultsToConsole(resultsData, "video");
      
//       return;
//   }

//   canvas.width = video.videoWidth;
//   canvas.height = video.videoHeight;
//   ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

//   if (!model) {
//     console.error("AI model not loaded.");
//     return;
//   }

//   model.detect(canvas).then((predictions) => {
//     drawDetections(predictions);
//     collectVideoResults(predictions, video.currentTime);
    
//       requestAnimationFrame(processVideoFrame);
    
//   }).catch((error) => {
//     console.error("Error processing video frame:", error);
//   });
// };

const processVideo = (fileURL) => {
  video.src = fileURL;
  video.classList.remove('hidden');

  // Wait for the metadata to be loaded
  video.addEventListener('loadedmetadata', () => {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    video.play(); // Start playing the video after metadata is loaded
    video.addEventListener('play', processVideoFrame);
  });
};
const processVideoFrame = () => {
  if (video.paused || video.ended) {
    // Handle the end of video processing
    const resultVideo = resultsData.map(element => {
      const time = element.time;
      const classes = element.objects.map(e => e.class);
      return { t: time, classes: classes.join(", ") };
    });
    displayResults(resultVideo);
    logResultsToConsole(resultsData, "video");
    return;
  }

  // Ensure canvas dimensions are set
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  if (!model) {
    console.error("AI model not loaded.");
    return;
  }

  model.detect(canvas).then(predictions => {
    drawDetections(predictions);
    collectVideoResults(predictions, video.currentTime);
    requestAnimationFrame(processVideoFrame);
  }).catch(error => {
    console.error("Error processing video frame:", error);
  });
};

function drawDetections(predictions) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  predictions.forEach(({ bbox, class: objClass }) => {
    if (!detectionColors[objClass]) {
      detectionColors[objClass] = getRandomColor();
    }

    const [x, y, width, height] = bbox;
    ctx.strokeStyle = detectionColors[objClass];
    ctx.lineWidth = 2.7;
    ctx.strokeRect(x, y, width, height);
    ctx.fillStyle = detectionColors[objClass];
    ctx.font = "14px Arial";
    ctx.fillText(objClass, x, y > 20 ? y - 5 : y + 15);
  });
}

function displayResults(predictions) {
  const summary = predictions.reduce((acc, { class: objClass }) => {
    acc[objClass] = (acc[objClass] || 0) + 1;
    return acc;
  }, {});
  resultsDiv.innerHTML = `<h3>Analysis</h3>${Object.entries(summary)
    .map(([key, value]) => `<p>${key}: ${value}</p>`)
    .join("")}`;

  downloadButton.style.display = "block";
}

function collectVideoResults(predictions, currentTime) {
    // console.log(predictions);
  const frameData = {
    time: currentTime.toFixed(2),
    objects: predictions.map(({ class: objClass, bbox }) => ({
      class: objClass,
      bbox,
    })),
  };
  resultsData.push(frameData);
}

function logResultsToConsole(data, type) {
  console.log(`Processed ${type} data:`, JSON.stringify(data, null, 2));
}

function getRandomColor() {
  const letters = "0123456789ABCDEF";
  let color = "#";
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

loadModel();
  // if (modelsLoaded) {

// }
function preventDefaults(e) {
  e.preventDefault();
  e.stopPropagation();
}
function downloadJson() {
  const dataStr = JSON.stringify(resultsData, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = 'results.json';
  a.click();
  URL.revokeObjectURL(url);
}
function downloadExcel() {
  const ws = XLSX.utils.json_to_sheet(resultsData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Results");
  
  XLSX.writeFile(wb, "results.xlsx");
}
downloadButton.addEventListener('click', () => {
  downloadJson(); // Download JSON
  downloadExcel(); // Download Excel
});

