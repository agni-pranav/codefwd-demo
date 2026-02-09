const video = document.getElementById("video");
const markersContainer = document.getElementById("timelineMarkers");
const segmentsContainer = document.getElementById("timelineSegments");
const timelineOverlay = document.getElementById("timelineOverlay");
const timelineTrack = document.getElementById("timelineTrack");
const chaptersContainer = document.getElementById("chapters");
const durationLabel = document.getElementById("durationLabel");
const chapterCountLabel = document.getElementById("chapterCount");

let currentActiveIndex = -1;
let timelineMarkers = [];
let timelineSegments = [];
let isScrubbing = false;

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
  if (!Number.isFinite(seconds)) return "0:00";
  const total = Math.floor(seconds);
  const s = total % 60;
  const m = Math.floor((total / 60) % 60);
  const h = Math.floor(total / 3600);

  if (h > 0) {
    return `${h}:${m.toString().padStart(2, "0")}:${s
      .toString()
      .padStart(2, "0")}`;
  }

  return `${m}:${s.toString().padStart(2, "0")}`;
}

/* -------------------- Render Chapter Slider -------------------- */

chapters.forEach((chapter, index) => {
  const div = document.createElement("div");
  div.className = "chapter";
  div.dataset.index = index;

  div.innerHTML = `
<div class="chapter-time">${formatTime(chapter.time)}</div>
<div class="chapter-title">${chapter.title}</div>
`;

  div.onclick = () => {
    video.currentTime = chapter.time;
    video.play();
    setActiveChapter(index);
  };

  chaptersContainer.appendChild(div);
});

/* -------------------- Timeline Overlay -------------------- */

function updateOverlayPosition() {
  if (!timelineOverlay) return;
  const controlsHeight = video.offsetHeight - video.clientHeight;
  const fallback = Math.max(10, Math.round(video.offsetHeight * 0.035));
  const bottom = controlsHeight > 0 ? Math.max(6, controlsHeight - 10) : fallback;
  timelineOverlay.style.bottom = `${bottom}px`;
}

function renderTimeline() {
  markersContainer.innerHTML = "";
  segmentsContainer.innerHTML = "";
  timelineMarkers = [];
  timelineSegments = [];

  if (!video.duration) return;

  const trackWidth =
    timelineTrack?.getBoundingClientRect().width || video.clientWidth || 1;
  const MIN_SEGMENT_PX = 8;
  const minSegmentPercent = (MIN_SEGMENT_PX / trackWidth) * 100;
  const SAFE_EDGE_PERCENT = Math.max(0.6, minSegmentPercent / 2);

  chapters.forEach((chapter, index) => {
    const nextTime = chapters[index + 1]?.time ?? video.duration;
    const startPercent = (chapter.time / video.duration) * 100;
    const endPercent = (nextTime / video.duration) * 100;
    const width = Math.min(
      100 - startPercent,
      Math.max(endPercent - startPercent, minSegmentPercent)
    );

    const segment = document.createElement("button");
    segment.type = "button";
    segment.className = "timeline-segment";
    segment.style.left = `${startPercent}%`;
    segment.style.width = `${width}%`;
    segment.dataset.label = `${formatTime(chapter.time)} · ${chapter.title}`;

    segment.onclick = (e) => {
      e.stopPropagation();
      video.currentTime = chapter.time;
      video.play();
      setActiveChapter(index);
    };

    segmentsContainer.appendChild(segment);
    timelineSegments[index] = segment;

    const marker = document.createElement("button");
    marker.type = "button";
    marker.className = "timeline-marker";

    let percent = (chapter.time / video.duration) * 100;
    percent = Math.max(SAFE_EDGE_PERCENT, percent);
    percent = Math.min(100 - SAFE_EDGE_PERCENT, percent);

    marker.style.left = percent + "%";
    marker.dataset.title = chapter.title;
    marker.innerHTML = `<span class="marker-time">${formatTime(
      chapter.time
    )}</span>`;

    marker.onclick = (e) => {
      e.stopPropagation();
      video.currentTime = chapter.time;
      setActiveChapter(index);
    };

    markersContainer.appendChild(marker);
    timelineMarkers[index] = marker;
  });
}

/* -------------------- Active Chapter Highlight -------------------- */

function setActiveChapter(index) {
  if (index === currentActiveIndex) return;

  const chapterDivs = document.querySelectorAll(".chapter");
  chapterDivs.forEach((el) => el.classList.remove("active"));
  timelineMarkers.forEach((el) => el && el.classList.remove("active"));
  timelineSegments.forEach((el) => el && el.classList.remove("active"));

  if (chapterDivs[index]) {
    chapterDivs[index].classList.add("active");
    chapterDivs[index].scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  }

  if (timelineMarkers[index]) {
    timelineMarkers[index].classList.add("active");
  }

  if (timelineSegments[index]) {
    timelineSegments[index].classList.add("active");
  }

  currentActiveIndex = index;
}

function findActiveChapterIndex(time) {
  return chapters.findIndex((chapter, i) => {
    const next = chapters[i + 1]?.time || video.duration;
    return time >= chapter.time && time < next;
  });
}

function updateDuration() {
  const duration = video.duration || 0;
  const formatted = formatTime(duration);

  if (durationLabel) {
    durationLabel.textContent = formatted;
  }

  if (chapterCountLabel) {
    chapterCountLabel.textContent = chapters.length.toString();
  }
}

/* -------------------- Events -------------------- */

video.addEventListener("loadedmetadata", () => {
  updateDuration();
  updateOverlayPosition();
  requestAnimationFrame(renderTimeline);
  setActiveChapter(0);
});

video.addEventListener("durationchange", () => {
  updateDuration();
  updateOverlayPosition();
  renderTimeline();
});

window.addEventListener("resize", () => {
  updateOverlayPosition();
  renderTimeline();
});

video.addEventListener("timeupdate", () => {
  const newIndex = findActiveChapterIndex(video.currentTime);
  if (newIndex !== -1) setActiveChapter(newIndex);
});

if (timelineTrack) {
  const seekToClientX = (clientX) => {
    if (!video.duration) return;
    const rect = timelineTrack.getBoundingClientRect();
    if (!rect.width) return;
    const percent = (clientX - rect.left) / rect.width;
    const clamped = Math.max(0, Math.min(1, percent));
    video.currentTime = clamped * video.duration;
  };

  timelineTrack.addEventListener("pointerdown", (e) => {
    isScrubbing = true;
    timelineTrack.setPointerCapture(e.pointerId);
    seekToClientX(e.clientX);
  });

  timelineTrack.addEventListener("pointermove", (e) => {
    if (!isScrubbing) return;
    seekToClientX(e.clientX);
  });

  timelineTrack.addEventListener("pointerup", (e) => {
    if (!isScrubbing) return;
    seekToClientX(e.clientX);
    isScrubbing = false;
    timelineTrack.releasePointerCapture(e.pointerId);
  });

  timelineTrack.addEventListener("pointercancel", () => {
    isScrubbing = false;
  });
}

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
