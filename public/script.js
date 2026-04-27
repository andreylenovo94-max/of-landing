const form = document.getElementById("lead-form");
const messageEl = document.getElementById("form-message");
const anchors = document.querySelectorAll(".scroll-to-form");
const formSection = document.getElementById("application-form");
const fadeInNodes = document.querySelectorAll(".fade-in");
const submitButton = form.querySelector("button[type='submit']");

const formData = {
  name: "",
  age: "",
  telegram: "",
  location: "",
  experience: ""
};

function setFormData(nextState) {
  const prevState = { ...formData };
  const partialState = typeof nextState === "function" ? nextState(prevState) : nextState;
  Object.assign(formData, partialState);
}

anchors.forEach((anchor) => {
  anchor.addEventListener("click", (event) => {
    event.preventDefault();
    formSection.scrollIntoView({ behavior: "smooth", block: "start" });
  });
});

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12 }
);

fadeInNodes.forEach((node) => observer.observe(node));

function setMessage(text, type) {
  messageEl.textContent = text;
  messageEl.className = `form-message ${type}`;
}

form.elements.name?.addEventListener("input", (e) => {
  setFormData({ name: String(e.target.value || "").trim() });
});

form.elements.age?.addEventListener("input", (e) => {
  setFormData({ age: String(e.target.value || "").trim() });
});

form.elements.telegram?.addEventListener("input", (e) => {
  setFormData({ telegram: String(e.target.value || "").trim() });
});

form.elements.location?.addEventListener("input", (e) => {
  setFormData({ location: String(e.target.value || "").trim() });
});

form.querySelectorAll("input[name='experience']").forEach((radio) => {
  radio.addEventListener("change", (e) => {
    setFormData((prev) => ({
      ...prev,
      experience: e.target.value
    }));
  });
});

function validateFormData() {
  const newErrors = {};

  if (formData.name.length < 2) newErrors.name = "Введите имя";
  if (!formData.age || Number.isNaN(Number(formData.age))) newErrors.age = "Введите корректный возраст";
  if (!formData.telegram.startsWith("@")) newErrors.telegram = "Укажи Telegram в формате @username";
  if (formData.location.length < 2) newErrors.location = "Укажи город / страну";
  if (!formData.experience) newErrors.experience = "Выберите опыт";

  return newErrors;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  setMessage("", "");

  const payload = {
    name: formData.name,
    age: Number(formData.age),
    telegram: formData.telegram,
    location: formData.location,
    experience: formData.experience
  };

  const errors = validateFormData();
  const firstError = Object.values(errors)[0] || "";
  if (firstError) {
    setMessage(firstError, "error");
    return;
  }

  submitButton.disabled = true;
  submitButton.style.opacity = "0.75";

  try {
    const response = await fetch("/api/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    if (!response.ok || !result.ok) {
      const errorText =
        result.errors?.[0] ||
        result.error ||
        result.message ||
        "Не удалось отправить заявку. Попробуй ещё раз.";
      setMessage(errorText, "error");
      return;
    }

    form.reset();
    Object.keys(formData).forEach((key) => {
      formData[key] = "";
    });
    setMessage("Спасибо! Мы скоро свяжемся с тобой в Telegram", "success");
  } catch (error) {
    setMessage("Ошибка сети. Проверь интернет и попробуй снова.", "error");
  } finally {
    submitButton.disabled = false;
    submitButton.style.opacity = "1";
  }
});
