const grid = document.querySelector('.grid');
let msnry;

function parseFilename(filename) {
  const base = filename.replace('.png', '');
  const parts = base.split('-');
  return {
    date: parts[0],
    group: parts[1] || '1',
    index: parts[2] || '1',
  };
}

photoFiles.sort((a, b) => b.localeCompare(a));

const groups = {};
photoFiles.forEach(filename => {
  const { date, group } = parseFilename(filename);
  const groupKey = `${date}-${group}`;
  if (!groups[groupKey]) groups[groupKey] = [];
  groups[groupKey].push(filename);
});

Object.values(groups).forEach(photoList => {
  photoList.sort((a, b) => {
    const indexA = parseInt(parseFilename(a).index) || 0;
    const indexB = parseInt(parseFilename(b).index) || 0;
    return indexA - indexB;
  });
});

const sortedGroupEntries = Object.entries(groups).sort((a, b) => {
  const dateA = parseFilename(a[0]).date;
  const dateB = parseFilename(b[0]).date;
  return dateB.localeCompare(dateA);
});

function loadPhotos() {
  const gridSizer = document.createElement('div');
  gridSizer.className = 'grid-sizer';
  grid.appendChild(gridSizer);

  sortedGroupEntries.forEach(([groupKey, photos]) => {
    const firstPhoto = photos[0];
    const item = document.createElement('div');
    item.className = 'grid-item';

    const inner = document.createElement('div');
    inner.className = 'grid-item-inner';

    const img = document.createElement('img');
    img.src = `photos/thumbs/${firstPhoto}`;
    img.alt = `照片 ${firstPhoto}`;
    img.loading = 'lazy';

    img.addEventListener('load', () => {
      img.classList.add('loaded');
      adjustItemHeights();
      if (msnry) msnry.layout();
    });

    inner.appendChild(img);
    item.appendChild(inner);

    inner.addEventListener('click', () => {
      openLightbox(groupKey, 0);
    });

    grid.appendChild(item);
  });
}

function getColumnCount() {
  const width = window.innerWidth;
  if (width > 1200) return 3;
  if (width > 800) return 2;
  return 1;
}

function adjustItemHeights() {
  const columnCount = getColumnCount();
  const containerWidth = grid.clientWidth;
  const colWidth = containerWidth / columnCount;

  document.querySelectorAll('.grid-item').forEach(item => {
    const img = item.querySelector('img');
    if (!img || !img.naturalWidth || !img.naturalHeight) return;
    const ratio = img.naturalWidth / img.naturalHeight;
    const height = colWidth / ratio;
    item.style.width = colWidth + 'px';
    item.style.height = height + 'px';
  });

  const gridSizer = document.querySelector('.grid-sizer');
  if (gridSizer) gridSizer.style.width = colWidth + 'px';

  if (msnry) msnry.layout();
}

const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const lightboxDate = document.getElementById('lightbox-date');
const prevBtn = document.getElementById('lightbox-prev');
const nextBtn = document.getElementById('lightbox-next');

let currentGroupKey = null;
let currentIndex = 0;

function openLightbox(groupKey, index) {
  currentGroupKey = groupKey;
  currentIndex = index;
  updateLightboxImage();
  lightbox.classList.add('show');
  document.body.style.overflow = 'hidden';
}

function updateLightboxImage() {
  const photos = groups[currentGroupKey];
  if (!photos) return;

  const filename = photos[currentIndex];
  const src = `photos/${filename}`;
  lightboxImg.alt = filename;

  // 捕获当前箭头位置，便于制作布局变化的平移动画
  const prevRectBefore = prevBtn.getBoundingClientRect();
  const nextRectBefore = nextBtn.getBoundingClientRect();

  lightboxImg.onload = () => {
    const isVertical = lightboxImg.naturalHeight > lightboxImg.naturalWidth;
    lightboxImg.classList.toggle('vertical', isVertical);

    // 请求下一帧，计算新位置并用 GSAP 平滑过渡
    requestAnimationFrame(() => {
      const prevRectAfter = prevBtn.getBoundingClientRect();
      const nextRectAfter = nextBtn.getBoundingClientRect();

      const deltaPrevX = prevRectBefore.left - prevRectAfter.left;
      const deltaPrevY = prevRectBefore.top - prevRectAfter.top;
      const deltaNextX = nextRectBefore.left - nextRectAfter.left;
      const deltaNextY = nextRectBefore.top - nextRectAfter.top;

      gsap.fromTo(prevBtn,
        { x: deltaPrevX, y: deltaPrevY },
        { x: 0, y: 0, duration: 0.2, ease: "back.out(4)" }
      );
      gsap.fromTo(nextBtn,
        { x: deltaNextX, y: deltaNextY },
        { x: 0, y: 0, duration: 0.2, ease: "back.out(4)" }
      );
    });
  };

  lightboxImg.src = src;

  const dateStr = parseFilename(filename).date;
  const formattedDate = `${dateStr.slice(0, 4)}.${dateStr.slice(4, 6)}.${dateStr.slice(6, 8)}`;
  if (lightboxDate) lightboxDate.textContent = formattedDate;

  if (photos.length > 1) {
    if (currentIndex === 0) {
      prevBtn.classList.add('hidden');
    } else {
      prevBtn.classList.remove('hidden');
    }
    if (currentIndex === photos.length - 1) {
      nextBtn.classList.add('hidden');
    } else {
      nextBtn.classList.remove('hidden');
    }
  } else {
    prevBtn.classList.add('hidden');
    nextBtn.classList.add('hidden');
  }
}

function closeLightbox() {
  lightbox.classList.remove('show');
  document.body.style.overflow = '';
}

function showPrev() {
  if (!currentGroupKey) return;
  const photos = groups[currentGroupKey];
  currentIndex = (currentIndex - 1 + photos.length) % photos.length;
  updateLightboxImage();
}

function showNext() {
  if (!currentGroupKey) return;
  const photos = groups[currentGroupKey];
  currentIndex = (currentIndex + 1) % photos.length;
  updateLightboxImage();
}

loadPhotos();

imagesLoaded(grid, () => {
  adjustItemHeights();
  msnry = new Masonry(grid, {
    itemSelector: '.grid-item',
    columnWidth: '.grid-sizer',
    percentPosition: true,
    gutter: 0,
  });
});

window.addEventListener('resize', adjustItemHeights);

lightbox.addEventListener('click', e => {
  if (e.target === lightbox) closeLightbox();
});

window.addEventListener('keydown', e => {
  if (e.key === 'Escape' && lightbox.classList.contains('show')) {
    closeLightbox();
  }
});

prevBtn.addEventListener('click', showPrev);
nextBtn.addEventListener('click', showNext);
