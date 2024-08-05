// import { translate } from "@vitalets/google-translate-api";
import translate from 'google-translate-api-x';
import { InjectTranscriptMessage, OpenTabMessage, TranslateRequest, TranslateResponse } from './types';

chrome.runtime.onInstalled.addListener(function (details) {
  if (details.reason === "install") {
    initStorage();
  }
});

chrome.runtime.onMessage.addListener(
  (request: OpenTabMessage, sender, sendResponse) => {
    if (request.action === "openNewTab") {
      chrome.tabs.create({ url: request.url }, (newTab) => {
        chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
          if (tabId === newTab.id && info.status === "complete") {
            chrome.tabs.onUpdated.removeListener(listener);
            const message: InjectTranscriptMessage = {
              action: "injectTranscript",
              transcript: request.transcript,
              title: request.title,
              prompt: request.prompt,
            };
            chrome.tabs.sendMessage(tabId, message);
          }
        });
      });
    }
  }
);

chrome.runtime.onMessage.addListener(
  (request: TranslateRequest, sender, sendResponse) => {
    if (request.action === "translate") {
      translate(request.text, { to: request.language}).then(sendResponse);
      return true; // TODO @San why need to return?!
    }
  }
);

function initStorage() {
  const targetUrl = "https://chatgpt.com/";
  const prompt = "Summarize this video\n";
  const followUpPrompts: string[] = [];
  chrome.storage.sync.set({ targetUrl });
  chrome.storage.sync.set({ prompt });
  chrome.storage.sync.set({ followUpPrompts });
}
