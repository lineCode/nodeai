// Make modal window
function makeModal({
  title = "Message",
  text = "No text",
  type = "info",
  parent = null,
  stylePos = "fixed",
} = {}) {
  const overlay = document.createElement("div");
  Object.assign(overlay.style, {
    display: "none",
    position: stylePos,
    background: "rgba(0 0 0 / 0.8)",
    opacity: 0,
    top: "0",
    left: "0",
    right: "0",
    bottom: "0",
    zIndex: "500",
    transition: "all .8s",
    cursor: "pointer",
  });

  const boxModal = document.createElement("div");
  Object.assign(boxModal.style, {
    transition: "all 0.5s",
    opacity: 0,
    display: "none",
    position: stylePos,
    top: "50%",
    left: "50%",
    transform: "translate(-50%,-50%)",
    background: "#525252",
    minWidth: "300px",
    fontFamily: "sans-serif",
    zIndex: "501",
    border: "1px solid rgb(255 255 255 / 45%)",
  });

  boxModal.className = "alekpet_modal_window";

  const boxModalBody = document.createElement("div");
  Object.assign(boxModalBody.style, {
    display: "flex",
    flexDirection: "column",
    textAlign: "center",
  });

  boxModalBody.className = "alekpet_modal_body";

  const boxModalHtml = `
  <div class="alekpet_modal_header" style="display: flex;  align-items: center;  background: #222;  width: 100%;justify-content: center;">
  <div class="alekpet_modal_title" style="flex-basis: 85%; text-align: center;padding: 5px;">${title}</div>
  <div class="alekpet_modal_close">✕</div>
  </div>
  <div class="alekpet_modal_description" style="padding: 8px;">${text}</div>`;
  boxModalBody.innerHTML = boxModalHtml;

  const alekpet_modal_header = boxModalBody.querySelector(
    ".alekpet_modal_header"
  );
  Object.assign(alekpet_modal_header.style, {
    display: "flex",
    alignItems: "center",
  });

  const close = boxModalBody.querySelector(".alekpet_modal_close");
  Object.assign(close.style, {
    cursor: "pointer",
  });

  let parentElement = document.body;
  if (parent && parent.nodeType === 1) {
    parentElement = parent;
  }

  boxModal.append(boxModalBody);
  parentElement.append(overlay, boxModal);

  const removeEvent = new Event("removeElements");
  const remove = () => {
    animateTransitionProps(boxModal, { opacity: 0 }).then(() =>
      animateTransitionProps(overlay, { opacity: 0 }).then(() => {
        parentElement.removeChild(boxModal);
        parentElement.removeChild(overlay);
      })
    );
  };

  boxModal.addEventListener("removeElements", remove);
  overlay.addEventListener("removeElements", remove);

  animateTransitionProps(overlay)
    .then(() => {
      overlay.addEventListener("click", () => {
        overlay.dispatchEvent(removeEvent);
      });
      animateTransitionProps(boxModal);
    })
    .then(() =>
      boxModal
        .querySelector(".alekpet_modal_close")
        .addEventListener("click", () => boxModal.dispatchEvent(removeEvent))
    );
}

function animateTransitionProps(
  el,
  props = { opacity: 1 },
  preStyles = { display: "block" }
) {
  Object.assign(el.style, preStyles);
  return new Promise((res) => {
    setTimeout(() => {
      Object.assign(el.style, props);

      const transstart = () => (el.isAnimating = true);
      const transchancel = () => (el.isAnimating = false);
      el.addEventListener("transitionstart", transstart);
      el.addEventListener("transitioncancel", transchancel);

      el.addEventListener("transitionend", function transend() {
        el.isAnimating = false;
        el.removeEventListener("transitionend", transend);
        el.removeEventListener("transitionend", transchancel);
        el.removeEventListener("transitionend", transstart);
        res(el);
      });
    }, 100);
  });
}

function animateClick(target, opacityVal = 0.9) {
  if (target?.isAnimating) return;

  const hide = +target.style.opacity === 0;
  animateTransitionProps(target, {
    opacity: hide ? opacityVal : 0,
  }).then(() => showHide({ elements: [target], hide: !hide }));
}

function showHide({ elements = [], hide = null, displayProp = "block" } = {}) {
  Array.from(elements).forEach((el) => {
    if (hide !== null) {
      el.style.display = !hide ? displayProp : "none";
    } else {
      el.style.display =
        !el.style.display || el.style.display === "none" ? displayProp : "none";
    }
  });
}

function makeElement(tag, attrs = {}) {
  if (!tag) tag = "div";
  const element = document.createElement(tag);
  Object.keys(attrs).forEach((key) => {
    const currValue = attrs[key];
    if (key === "class") {
      if (Array.isArray(currValue)) {
        element.classList.add(...currValue);
      } else if (currValue instanceof String && typeof currValue === "string") {
        element.className = currValue;
      }
    } else if (key === "dataset") {
      try {
        if (Array.isArray(currValue)) {
          currValue.forEach((datasetArr) => {
            const [prop, propval] = Object.entries(datasetArr)[0];
            element.dataset[prop] = propval;
          });
        } else {
          const [prop, propval] = Object.entries(currValue)[0];
          element.dataset[prop] = propval;
        }
      } catch (err) {
        console.log(err);
      }
    } else {
      element[key] = currValue;
    }
  });
  return element;
}

async function getDataJSON(url) {
  try {
    const response = await fetch(url);
    const jsonData = await response.json();
    return jsonData;
  } catch (err) {
    return new Error(err);
  }
}

function createWindowModal({
  textTitle = "Message",
  textBody = "Hello world!",
  textFooter = null,
  classesWrapper = [],
  stylesWrapper = {},
  classesBox = [],
  stylesBox = {},
  classesTitle = [],
  stylesTitle = {},
  classesBody = [],
  stylesBody = {},
  classesClose = [],
  stylesClose = {},
  classesFooter = [],
  stylesFooter = {},
} = {}) {
  // Function past text(html)
  function addText(text, parent) {
    if (!parent) return;

    switch (typeof text) {
      case "string":
        if (/^\<*.\/?\>$/.test(text)) {
          parent.innerHTML(text);
        } else {
          parent.textContent = text;
        }
        break;
      case "object":
      default:
        if (Array.isArray(text)) {
          text.forEach((element) => parent.append(element));
        } else if (text.nodeType === 1 || text.nodeType === 3)
          parent.append(text);
    }
  }

  // Wrapper
  const wrapper_settings = makeElement("div", {
    class: ["alekpet__wrapper__window", ...classesWrapper],
  });

  Object.assign(wrapper_settings.style, {
    display: "none",
    opacity: 0,
    minWidth: "220px",
    position: "absolute",
    left: "50%",
    top: "50%",
    transform: "translate(-50%, -50%)",
    opacity: 0,
    transition: "all .8s",
    ...stylesWrapper,
  });

  // Box
  const box__settings = makeElement("div", {
    class: ["alekpet__window__box", ...classesBox],
  });
  Object.assign(box__settings.style, {
    display: "flex",
    flexDirection: "column",
    background: "#0e0e0e",
    padding: "10px",
    justifyContent: "center",
    alignItems: "center",
    gap: "10px",
    textAlign: "center",
    borderRadius: "6px",
    color: "white",
    border: "2px solid silver",
    fontFamily: "monospace",
    boxShadow: "2px 2px 4px silver",
    ...stylesBox,
  });

  // Title
  const box_settings_title = makeElement("div", {
    class: ["alekpet__window__title", , ...classesTitle],
  });
  Object.assign(box_settings_title.style, {
    ...stylesTitle,
  });
  // Add text (html) to title
  addText(textTitle, box_settings_title);

  // Body
  const box_settings_body = makeElement("div", {
    class: ["alekpet__window__body", ...classesBody],
  });
  Object.assign(box_settings_body.style, {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: "5px",
    ...stylesBody,
  });
  // Add text (html) to body
  addText(textBody, box_settings_body);

  // Close button
  const close__box__button = makeElement("div", {
    class: ["close__box__button", ...classesClose],
    textContent: "✖",
  });
  Object.assign(close__box__button.style, {
    position: "absolute",
    top: "-10px",
    right: "-10px",
    background: "silver",
    borderRadius: "50%",
    width: "20px",
    height: "20px",
    cursor: "pointer",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontSize: "0.8rem",
    ...stylesClose,
  });

  close__box__button.addEventListener("click", () =>
    animateTransitionProps(wrapper_settings, {
      opacity: 0,
    }).then(() => {
      showHide({ elements: [wrapper_settings] });
    })
  );

  close__box__button.onmouseenter = () => {
    close__box__button.style.opacity = 0.8;
  };

  close__box__button.onmouseleave = () => {
    close__box__button.style.opacity = 1;
  };

  box__settings.append(box_settings_title, box_settings_body);

  // Footer
  if (textFooter) {
    const box_settings_footer = makeElement("div", {
      class: [...classesFooter],
    });
    Object.assign(box_settings_footer.style, {
      ...stylesFooter,
    });

    // Add text (html) to body
    addText(textFooter, box_settings_footer);

    box__settings.append(box_settings_footer);
  }

  wrapper_settings.append(close__box__button, box__settings);

  return wrapper_settings;
}

export {
  makeModal,
  createWindowModal,
  animateTransitionProps,
  animateClick,
  showHide,
  makeElement,
  getDataJSON,
};
