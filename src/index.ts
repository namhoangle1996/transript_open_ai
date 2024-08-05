import {
  init,
  injectExtractTranscriptButton,
  injectTranslation,
} from "./youtube";
import { injectChatGPT } from "./chatgpt";

if (window.location.hostname === "www.youtube.com") {
  document.addEventListener("yt-navigate-finish", async function () {
    await init();
    await injectTranslation();
    injectExtractTranscriptButton();
  });
}

window.onload = async () => {
  if (window.location.hostname === "chatgpt.com") {
    injectChatGPT();
  }

  if (window.location.hostname === "claude.ai") {
  }
};
