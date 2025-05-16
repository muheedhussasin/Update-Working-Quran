

document.addEventListener("DOMContentLoaded", function () {
  // Main containers and elements
  const blogContainer = document.getElementById("blog-container");
  const surahDetail = document.getElementById("surah-detail");
  const ayahList = document.getElementById("ayah-list");
  const surahTitle = document.getElementById("surah-title");

  // Audio player elements
  const audio = document.querySelector(".quranplayer");
  const ayah = document.querySelector(".ayah");
  const next = document.querySelector(".next");
  const prev = document.querySelector(".prev");
  const play = document.querySelector(".play");
  const sajdaNotice = document.querySelector(".sajdaNotice");
  const surahsContainer = document.querySelector(".surahs");

  // Pagination vars for Surah reading
  let fullAyahs = [];
  let currentPage = 0;
  const pageSize = 16;

  // Audio player vars
  let verses = [];
  let currentVerse = 0;

  // Load Surah cards on page load
  loadSurahs();

  // Load surahs for audio sidebar if present
  if (surahsContainer) {
    loadSurahsForAudio();
  }

  // ========== FUNCTIONS ==========

  async function loadSurahs() {
    blogContainer.innerHTML = ""; // clear previous cards if any
    const res = await fetch("https://api.alquran.cloud/v1/surah");
    const data = await res.json();

    data.data.forEach((surah) => {
      const card = document.createElement("div");
      card.className = "blog-card";
      card.innerHTML = `
        <h2>${surah.number}. (${surah.name})</h2>
        <p>Total Ayahs: ${surah.numberOfAyahs}</p>
      `;
      card.addEventListener("click", () => loadAyahs(surah.number, surah.name));
      blogContainer.appendChild(card);
    });

    // Show Surah cards, hide detail on initial load
    blogContainer.style.display = "grid";
    surahDetail.style.display = "none";
  }

  async function loadAyahs(number, arabicName) {
    blogContainer.style.display = "none";
    surahDetail.style.display = "block";
    surahTitle.innerHTML = `<h2>${arabicName}</h2>`;
    ayahList.innerHTML = "Loading...";

    const res = await fetch(`https://api.alquran.cloud/v1/surah/${number}`);
    const data = await res.json();

    fullAyahs = data.data.ayahs.map((ayah, i) => `آیت ${i + 1}: ${ayah.text}`);
    currentPage = 0;
    renderAyahPage();
  }

  function renderAyahPage() {
    ayahList.innerHTML = "";
    const start = currentPage * pageSize;
    const end = Math.min(start + pageSize, fullAyahs.length);

    for (let i = start; i < end; i++) {
      const p = document.createElement("p");
      p.textContent = fullAyahs[i];
      ayahList.appendChild(p);
    }

    // Navigation buttons container
    const navDiv = document.createElement("div");
    navDiv.style.textAlign = "center";
    navDiv.style.marginTop = "1rem";

    if (currentPage > 0) {
      const prevBtn = document.createElement("button");
      prevBtn.textContent = "⬅ پچھلا صفحہ";
      prevBtn.onclick = () => {
        currentPage--;
        renderAyahPage();
      };
      navDiv.appendChild(prevBtn);
    }

    if ((currentPage + 1) * pageSize < fullAyahs.length) {
      const nextBtn = document.createElement("button");
      nextBtn.textContent = "اگلا صفحہ ➡";
      nextBtn.onclick = () => {
        currentPage++;
        renderAyahPage();
      };
      navDiv.appendChild(nextBtn);
    }

    ayahList.appendChild(navDiv);
  }

  window.goBack = function () {
    blogContainer.style.display = "grid";
    surahDetail.style.display = "none";
    ayahList.innerHTML = "";
  };

  // Audio Player: load Surahs in sidebar for audio
  function loadSurahsForAudio() {
    fetch("https://api.alquran.cloud/v1/surah")
      .then((response) => response.json())
      .then((data) => {
        data.data.forEach((surah) => {
          const surahDiv = document.createElement("div");
          surahDiv.classList.add("surah");
          surahDiv.setAttribute("data-id", surah.number);
          surahDiv.innerHTML = `
            <h2>${surah.number}. ${surah.name}</h2>
            <p>${surah.englishName}</p>
          `;
          surahsContainer.appendChild(surahDiv);
        });
        addSurahListeners();
      });
  }

  function addSurahListeners() {
    const allSurahs = document.querySelectorAll(".surah");
    allSurahs.forEach((surah) => {
      surah.addEventListener("click", () => {
        const surahId = surah.getAttribute("data-id");
        allSurahs.forEach((s) => s.classList.remove("active"));
        surah.classList.add("active");
        fetchAyahs(surahId);
      });
    });
  }

  function updateActiveSurah(surahNumber) {
    document.querySelectorAll(".surah").forEach((s) => {
      if (s.getAttribute("data-id") == surahNumber) {
        s.classList.add("active");
      } else {
        s.classList.remove("active");
      }
    });
  }

  function fetchAyahs(surahNumber) {
    Promise.all([
      fetch(`https://api.alquran.cloud/v1/surah/${surahNumber}`),
      fetch(`https://api.alquran.cloud/v1/surah/${surahNumber}/ur.jalandhry`),
    ])
      .then((responses) => Promise.all(responses.map((res) => res.json())))
      .then(([arabicData, urduData]) => {
        verses = arabicData.data.ayahs.map((ayah, index) => ({
          arabic: ayah.text,
          number: ayah.number,
          ayahNumber: ayah.numberInSurah,
          ruku: ayah.ruku,
          sajda: ayah.sajda,
          urdu: urduData.data.ayahs[index].text,
        }));

        currentVerse = 0;
        updateActiveSurah(surahNumber);
        checkSajda(arabicData.data.ayahs);
        playVerse();
      });
  }

  function checkSajda(ayahs) {
    const hasSajda = ayahs.some((ayah) => ayah.sajda);
    if (sajdaNotice) {
      sajdaNotice.innerHTML = hasSajda ? " This surah contains a Sajda ayah." : "";
    }
  }

  function playVerse() {
    if (!verses[currentVerse]) return;

    const ayahData = verses[currentVerse];
    if (ayah) {
      ayah.innerHTML = `
        <p style="font-size: 22px; color: #fff; margin-bottom: 5px;">
          ${ayahData.arabic} <span style="color: yellow;">(${ayahData.ayahNumber})</span>
        </p>
        <p style="font-size: 18px; color: #fff;">${ayahData.urdu}</p>
        <p style="font-size: 14px; color: #ccc;">Ruku: ${ayahData.ruku} ${
        ayahData.sajda ? " Sajda Ayah" : ""
      }</p>
      `;
    }
    if (audio) {
      audio.src = `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${ayahData.number}.mp3`;
      audio.play().catch((err) => {
        console.warn("Audio playback error:", err);
      });
    }
  }

  if (audio) {
    audio.addEventListener("loadeddata", () => {
      if (audio.src && audio.src !== "") {
        audio.play();
      }
    });

    audio.addEventListener("ended", () => {
      if (currentVerse < verses.length - 1) {
        currentVerse++;
        playVerse();
      }
    });
  }

  if (next) {
    next.addEventListener("click", () => {
      if (currentVerse < verses.length - 1) {
        currentVerse++;
        playVerse();
      }
    });
  }

  if (prev) {
    prev.addEventListener("click", () => {
      if (currentVerse > 0) {
        currentVerse--;
        playVerse();
      }
    });
  }

  if (play) {
    play.addEventListener("click", () => {
      if (audio.paused) {
        audio.play();
        play.innerHTML = `<i class="fas fa-pause"></i>`;
      } else {
        audio.pause();
        play.innerHTML = `<i class="fas fa-play"></i>`;
      }
    });
  }
});

