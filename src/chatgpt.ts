import { InjectTranscriptMessage } from "./types";

export function injectChatGPT(): void {
  chrome.runtime.onMessage.addListener(
    (request: InjectTranscriptMessage, sender, sendResponse) => {
      if (request.action === "injectTranscript") {
        console.log("request", request);
        chat(request.prompt + request.title + ": " + request.transcript);
        showSuggestionOnReplyFinish();
      }
    }
  );
}

function chat(content: string) {
  const textarea = document.getElementById(
    "prompt-textarea"
  ) as HTMLTextAreaElement;
  if (textarea) {
    textarea.value = content;

    // Trigger an input event to notify any listeners that the value has changed
    const inputEvent = new Event("input", {
      bubbles: true,
      cancelable: true,
    });
    textarea.dispatchEvent(inputEvent);
  }
}

// Function to show the suggestions for the next prompts for user to choose.
// Suggestions will be showed right after LLM finish their answer.
function showSuggestionOnReplyFinish() {
  const targetNode = document.body; // We'll observe the entire body to ensure we catch the button
  const config = { attributes: true, childList: true, subtree: true };

  let lastState = "";
  let isInjecting = false; // TODO @San need better solution to avoid multiple fire.

  const callback = async function (
    mutationsList: MutationRecord[],
    observer: MutationObserver
  ) {
    if (isInjecting) return;
    for (let mutation of mutationsList) {
      if (mutation.type === "attributes" || mutation.type === "childList") {
        const button = document.querySelector(
          'button[data-testid="send-button"], button[data-testid="stop-button"]'
        );
        if (button) {
          const currentState = button.getAttribute("data-testid");
          if (lastState === "stop-button" && currentState === "send-button") {
            isInjecting = true;
            console.log("change state, mutation", mutation);
            await injectSuggestion();
            isInjecting = false;
          }
          lastState = currentState ?? "";
        }
      }
    }
  };

  const observer = new MutationObserver(callback);
  observer.observe(targetNode, config);
}

async function injectSuggestion(): Promise<void> {
  const conversationTurns = document.querySelectorAll(
    '[data-testid^="conversation-turn-"]'
  );

  if (conversationTurns.length > 0) {
    const lastTurn = conversationTurns[conversationTurns.length - 1];

    const choiceDiv = document.createElement("div");

    choiceDiv.className = lastTurn.className;
    choiceDiv.removeAttribute("data-testid");

    const { followUpPrompts } = await chrome.storage.sync.get(
      "followUpPrompts"
    );
    const uniqueId = Date.now();
    const choiceBoxesHTML = createChoiceBoxesHTML(followUpPrompts, uniqueId);

    choiceDiv.innerHTML = `<div class="text-base py-[18px] px-3 md:px-4 m-auto md:px-5 lg:px-1 xl:px-5"><div class="mx-auto flex flex-1 gap-4 text-base md:gap-5 lg:gap-6 md:max-w-3xl lg:max-w-[40rem] xl:max-w-[48rem]"><div class="flex-shrink-0 flex flex-col relative items-end">${choiceBoxesHTML}</div></div>`;

    // Insert the new turn after the last turn
    lastTurn.parentNode?.insertBefore(choiceDiv, lastTurn.nextSibling);

    addChoiceBoxListeners(uniqueId);
  } else {
    console.log("No conversation turns found.");
  }
}

function createChoiceBoxesHTML(choices: string[], uniqueId: number) {
  let html = `<div id="choiceContainer_${uniqueId}" class="choice-container">`;

  choices.slice(0, 3).forEach((choice, index) => {
    html += `<button class="choice-button" data-choice="${choice}">${choice}</button>`;
  });

  if (choices.length > 3) {
    html += '<div class="dropdown">';
    html += `<button id="dropdownToggle_${uniqueId}" class="toggle-button">...</button>`;
    html += `<div id="moreChoices_${uniqueId}" class="dropdown-content">`;
    choices.slice(3).forEach((choice) => {
      html += `<button class="choice-button" data-choice="${choice}">${choice}</button>`;
    });
    html += "</div></div>";
  }

  html += "</div>";

  const style = `
    <style>
      .choice-container { display: flex; align-items: center; gap: 5px; flex-wrap: wrap; }
      .choice-button, .toggle-button { 
        padding: 5px 10px; 
        margin: 2px; 
        border: 1px solid #ccc; 
        border-radius: 4px; 
        background-color: #f8f8f8;
        cursor: pointer;
        transition: background-color 0.3s;
      }
      .choice-button:hover, .toggle-button:hover {
        background-color: #e8e8e8;
      }
      .dropdown { position: relative; display: inline-block; }
      .dropdown-content { 
        display: none; 
        position: absolute; 
        background-color: #fff; 
        min-width: 120px; 
        box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.2); 
        z-index: 1; 
        border: 1px solid #ddd;
        border-radius: 4px;
      }
      .dropdown-content .choice-button { 
        display: block; 
        width: 100%; 
        text-align: left;
        border: none;
        border-radius: 0;
      }
      .dropdown-content .choice-button:not(:last-child) {
        border-bottom: 1px solid #eee;
      }
    </style>
  `;

  return style + html;
}

function addChoiceBoxListeners(uniqueId: number) {
  const container = document.getElementById(`choiceContainer_${uniqueId}`);
  const moreChoices = document.getElementById(`moreChoices_${uniqueId}`);
  const dropdownToggle = document.getElementById(`dropdownToggle_${uniqueId}`);

  if (container) {
    container.addEventListener("click", function (event) {
      const target = event.target as HTMLElement;
      chat(target.getAttribute("data-choice") || "");
    });
  }

  if (dropdownToggle && moreChoices) {
    dropdownToggle.addEventListener("click", function () {
      moreChoices.style.display =
        moreChoices.style.display === "block" ? "none" : "block";
    });
  }
}
