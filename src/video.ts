import { TimeChange } from "./types";

let lastFlooredTime = -1;
let intervalId: NodeJS.Timeout | null = null;
let video: HTMLVideoElement;

function checkTime() {
  const currentFlooredTime = Math.floor(video.currentTime);
  if (currentFlooredTime !== lastFlooredTime) {
    lastFlooredTime = currentFlooredTime;

    const detail: TimeChange = {
      time: currentFlooredTime,
    };
    const event = new CustomEvent("yt-time-current-change", {
      bubbles: true,
      cancelable: true,
      detail: detail,
    });
    video.dispatchEvent(event);
  }
}

function startObserving() {
  if (!intervalId) {
    intervalId = setInterval(checkTime, 300);
  }
}

function stopObserving() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

// TODO @San might need to add seek https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/seeking_event

export function observeVideoCurrentTime() {
  video = document.querySelector("video.html5-main-video") as HTMLVideoElement;

  if (!video) {
    console.error("Video element not found");
    return;
  }

  // Listen for timeupdate events
  video.addEventListener("timeupdate", startObserving);

  // Stop observing when the video pauses
  video.addEventListener("pause", stopObserving);

  // Restart observing when the video plays
  video.addEventListener("play", startObserving);

  // Initial start if the video is already playing
  if (!video.paused && !video.ended) {
    startObserving();
  }
}
