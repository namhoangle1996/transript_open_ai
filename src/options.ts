const maxPrompt = 10;
const promptContainer = document.getElementById("promptContainer") as HTMLElement;
const promptCount = document.getElementById("promptCount") as HTMLElement;
const increaseBtn = document.getElementById("increasePrompts") as HTMLButtonElement;
const decreaseBtn = document.getElementById("decreasePrompts") as HTMLButtonElement;
const saveBtn = document.getElementById("savePrompts") as HTMLButtonElement;
const saveStatus = document.getElementById("saveStatus") as HTMLElement;
let currentPrompts = 0;
let followUpPrompts: string[] = [];

function initPrompts() {
  return new Promise<void>((resolve) => {
    chrome.storage.sync.get("followUpPrompts", (result) => {
      followUpPrompts = result.followUpPrompts;
      if (followUpPrompts.length === 0) {
        resolve();
      }

      for (let i = 0; i < followUpPrompts.length; i++) {
        promptContainer.appendChild(createPromptInput(followUpPrompts[i]));
        currentPrompts++;
        updatePromptCount();
      }

      resolve();
    });
  });
}

function createPromptInput(value = "") {
  const div = document.createElement("div");
  div.className = "prompt-item";
  div.innerHTML = `
        <input type="text" class="form-control" value="${value}">
        <button class="btn btn-outline-secondary remove-prompt">×</button>
    `;
  div.querySelector(".remove-prompt")?.addEventListener("click", () => {
    div.remove();
    currentPrompts--;
    updatePromptCount();
  });
  return div;
}

function updatePromptCount() {
  promptCount.textContent = String(currentPrompts);
  increaseBtn.disabled = Boolean(currentPrompts >= maxPrompt);
  decreaseBtn.disabled = Boolean(currentPrompts <= 1);
}

initPrompts()
  .then(() => {
    console.log("onload followUpPrompts: ", followUpPrompts);

    increaseBtn.addEventListener("click", () => {
      if (currentPrompts < maxPrompt) {
        promptContainer.appendChild(createPromptInput());
        currentPrompts++;
        updatePromptCount();
      }
    });

    decreaseBtn.addEventListener("click", () => {
      if (currentPrompts > 0) {
        if (promptContainer.lastChild) {
          promptContainer.removeChild(promptContainer.lastChild);
          currentPrompts--;
          updatePromptCount();
        }
      }
    });

    saveBtn.addEventListener("click", () => {
      followUpPrompts = Array.from(
        promptContainer.querySelectorAll("input")
      ).map((input) => input.value);
      saveStatus.textContent = "Saved!";
      setTimeout(() => {
        saveStatus.textContent = "";
      }, 2000);
      chrome.storage.sync.set({ followUpPrompts });
      console.log("Saved prompts:", followUpPrompts);
    });
  })
  .catch((error) => {
    console.error("Error initializing prompts:", error);
  });
