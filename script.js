const video = document.getElementById("video");
const markersContainer = document.getElementById("timelineMarkers");
const chaptersContainer = document.getElementById("chapters");

let currentActiveIndex = -1;

const chapters = [
  { title: "Introduction", time: 0 },
  { title: "Legacy VB.NET Inventory App", time: 72 },
  { title: "Legacy application repository & pain points", time: 357 },
  { title: "Solution: Controlled modernization", time: 474 },
  { title: "Execution plan", time: 575 },
  { title: "CodeFWD and CodeFWD demo", time: 626 },
  { title: "Microservice API visualization", time: 1006 },
  { title: "Product vision", time: 1086 },
  { title: "What it solves?", time: 1187 },
  { title: "Coexistence with VB.NET", time: 1278 },
  { title: "Closing", time: 1359 },
];

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/* -------------------- Render Chapter Slider -------------------- */

chapters.forEach((chapter, index) => {
  const div = document.createElement("div");
  div.className = "chapter";

  div.innerHTML = `
<div class="chapter-time">${formatTime(chapter.time)}</div>
<div class="chapter-title">${chapter.title}</div>
`;

  div.onclick = () => {
    video.currentTime = chapter.time;
    video.play();
  };

  chaptersContainer.appendChild(div);
});

/* -------------------- Timeline Marker Placement -------------------- */

function placeMarkers() {
  markersContainer.innerHTML = "";

  /* Detect control bar height */
  const controlsHeight = video.offsetHeight - video.clientHeight;

  /* Position markers inside timeline */
  markersContainer.style.bottom = controlsHeight - 4 + "px";

  /* Prevent edge overflow */
  const SAFE_EDGE_PERCENT = 0.6;

  chapters.forEach((chapter) => {
    const marker = document.createElement("div");
    marker.className = "timeline-marker";

    let percent = (chapter.time / video.duration) * 100;

    /* Clamp markers inside edges */
    percent = Math.max(SAFE_EDGE_PERCENT, percent);
    percent = Math.min(100 - SAFE_EDGE_PERCENT, percent);

    marker.style.left = percent + "%";

    marker.dataset.title = `${formatTime(chapter.time)} - ${chapter.title}`;

    marker.onclick = (e) => {
      e.stopPropagation();
      video.currentTime = chapter.time;
    };

    markersContainer.appendChild(marker);
  });
}

video.addEventListener("loadedmetadata", placeMarkers);
window.addEventListener("resize", placeMarkers);

/* -------------------- Active Chapter Highlight -------------------- */

video.addEventListener("timeupdate", () => {
  const current = video.currentTime;
  const chapterDivs = document.querySelectorAll(".chapter");

  let newIndex = chapters.findIndex((c, i) => {
    const next = chapters[i + 1]?.time || video.duration;
    return current >= c.time && current < next;
  });

  if (newIndex !== currentActiveIndex) {
    chapterDivs.forEach((el) => el.classList.remove("active"));

    if (chapterDivs[newIndex]) {
      chapterDivs[newIndex].classList.add("active");
      chapterDivs[newIndex].scrollIntoView({
        behavior: "smooth",
        inline: "center",
      });
    }

    currentActiveIndex = newIndex;
  }
});

/* -------------------- Arrow Navigation -------------------- */

document.addEventListener("keydown", (e) => {
  const SKIP = 10;

  if (e.key === "ArrowRight")
    video.currentTime = Math.min(video.currentTime + SKIP, video.duration);

  if (e.key === "ArrowLeft")
    video.currentTime = Math.max(video.currentTime - SKIP, 0);
});

/* -------------------- Mobile Double Tap -------------------- */

let lastTap = 0;

video.addEventListener("touchend", (e) => {
  const now = Date.now();
  const diff = now - lastTap;

  if (diff < 300) {
    const x = e.changedTouches[0].clientX;
    const half = window.innerWidth / 2;

    if (x > half) video.currentTime += 10;
    else video.currentTime -= 10;
  }

  lastTap = now;
});
