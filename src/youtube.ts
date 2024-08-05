import {
  getSearchParam,
  getLangOptionsWithLink,
  getRawTranscript,
  getTranscript,
} from "./transcript";
import { chunkTranslation, translateTranscript } from "./translate";
import {
  OpenTabMessage,
  RawTranscript,
  Translation,
  YTTimeCurrentChangeEvent,
} from "./types";
import { observeVideoCurrentTime } from "./video";

let rawTranscript: RawTranscript[] = [];

export async function init() {
  // load transcript
  const videoId = getSearchParam(window.location.href).v;
  const langOptionsWithLink = await getLangOptionsWithLink(videoId);
  if (!langOptionsWithLink) {
    console.error("no transcription found, should handle");
    return;
  }
  rawTranscript = await getRawTranscript(langOptionsWithLink[0].link);

  observeVideoCurrentTime();
}

export async function injectTranslation() {
  let translations = await translateTranscript(rawTranscript);
  if (!translations) {
    return;
  }

  const chunkSize = 2;
  translations = chunkTranslation(translations, chunkSize);
  console.log("translations: ", translations);

  // create translation box
  createTranscriptionContainer();

  document.addEventListener("yt-time-current-change", function (event) {
    if (isYTTimeCurrentChangeEvent(event)) {
      const currentTime = event.detail.time;
      const translation = getClosestTranslation(translations, currentTime);
      updateTranscriptionContent(
        translation?.text || "",
        translation?.translated || ""
      );
    }
  });
}

// Type guard function to check if an event is a YTTimeCurrentChangeEvent
function isYTTimeCurrentChangeEvent(
  event: Event
): event is YTTimeCurrentChangeEvent {
  return (
    event.type === "yt-time-current-change" &&
    "detail" in event &&
    "time" in (event as any).detail
  );
}

function createTranscriptionContainer() {
  const existingContainers = document.getElementsByClassName("yse-transcription-container");
  if (existingContainers.length > 0) {
    return;
  }

  // Create the main container
  const container = document.createElement("div");
  container.className = "yse-transcription-container";

  // Create the transcript box
  const transcriptBox = document.createElement("div");
  transcriptBox.className =
    "yse-transcription-text-box yse-transcription-transcript";
  transcriptBox.setAttribute("style", "z-index: 59;");

  // Create the translation box
  const translationBox = document.createElement("div");
  translationBox.className =
    "yse-transcription-text-box yse-transcription-translate";
  translationBox.setAttribute("style", "z-index: 59;");

  // Append the boxes to the container
  container.appendChild(transcriptBox);
  container.appendChild(translationBox);

  // Add the styles
  const style = document.createElement("style");
  style.textContent = `
      .yse-transcription-container {
          position: absolute;
          bottom: 64px;
          left: 0;
          right: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          font-size: 18px;
      }
      .yse-transcription-text-box {
          background-color: rgba(0, 0, 0, 0.7);
          color: white;
          padding: 10px 20px;
          border-radius: 5px;
          text-align: center;
          display: inline-block;
          max-width: 80%;
          word-wrap: break-word;
      }
      .yse-transcription-transcript {
          font-weight: bold;
      }
  `;
  document.head.appendChild(style);

  const videoPlayer = document.getElementsByClassName("html5-video-player")[0];
  videoPlayer.appendChild(container);
}

function updateTranscriptionContent(
  newTranscript: string,
  newTranslation: string
) {
  // Find the transcript and translation elements
  const transcriptElement = document.getElementsByClassName(
    "yse-transcription-transcript"
  )[0];
  const translationElement = document.getElementsByClassName(
    "yse-transcription-translate"
  )[0];

  // Update the content if the elements exist
  if (transcriptElement) {
    transcriptElement.textContent = newTranscript;
  } else {
    console.warn("Transcript element not found in the container");
  }

  if (translationElement) {
    translationElement.textContent = newTranslation;
  } else {
    console.warn("Translation element not found in the container");
  }
}

function getClosestTranslation(
  translations: Translation[],
  currentTime: number
): Translation | null {
  if (translations.length < 2) {
    return null;
  }

  for (let i = translations.length - 1; i >= 0; i--) {
    const t = translations[i];
    if (t.start && Number(t.start) <= currentTime) {
      return t;
    }
  }

  return null;
}

export async function injectExtractTranscriptButton() {
  const relatedDiv = document.querySelector(
    "#related.style-scope.ytd-watch-flexy"
  );

  if (!relatedDiv || document.getElementById("extract-transcript")) {
    return;
  }

  const button = document.createElement("button");
  button.id = "extract-transcript";
  button.textContent = "Extract Transcription";
  button.style.cssText =
    "margin: 10px 0; padding: 10px; background-color: #cc0000; color: white; border: none; border-radius: 2px; cursor: pointer;";

  relatedDiv.insertAdjacentElement("afterbegin", button);

  button.addEventListener("click", async () => {
    const { targetUrl } = await chrome.storage.sync.get("targetUrl");
    const { prompt } = await chrome.storage.sync.get("prompt");

    // send the message to service worker to open new tab and inject transcript to it
    if (targetUrl && prompt) {
      const message: OpenTabMessage = {
        action: "openNewTab",
        url: targetUrl,
        title: document.title,
        transcript: getTranscript(rawTranscript),
        prompt: prompt,
      };
      chrome.runtime.sendMessage(message);
    } else {
      console.error("targetUrl or prompt is not set");
    }
  });
}
