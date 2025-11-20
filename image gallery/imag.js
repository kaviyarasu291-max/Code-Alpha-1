const fileInput = document.getElementById('fileInput');
const gallery = document.getElementById('gallery');
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const closeBtn = document.querySelector('.close');
const prevBtn = document.getElementById('prev');
const nextBtn = document.getElementById('next');
const filterSelect = document.getElementById('filterSelect');
const searchInput = document.getElementById('searchInput');
const editModal = document.getElementById('editModal');
const editTitle = document.getElementById('editTitle');
const editCategory = document.getElementById('editCategory');
const saveEdit = document.getElementById('saveEdit');
const cancelEdit = document.getElementById('cancelEdit');
const editBtn = document.getElementById('editBtn');
const deleteBtn = document.getElementById('deleteBtn');
const shareBtn = document.getElementById('shareBtn');

let images = [];
try {
  const raw = localStorage.getItem('galleryImages');
  if (raw) images = JSON.parse(raw) || [];
} catch (err) {
  console.warn('Could not parse galleryImages from localStorage, resetting.', err);
  images = [];
}

// Sanitize loaded images: keep only objects with a valid `src`
images = images.filter(img => img && typeof img.src === 'string' && img.src.length);
let currentIndex = 0;

// Add photo
fileInput.addEventListener('change', (e) => {
  const files = e.target.files;
  Array.from(files).forEach(file => {
    const reader = new FileReader();
    reader.onload = (event) => {
      images.push({
        src: event.target.result,
        title: file.name,
        category: "Uncategorized"
      });
      saveImages();
      renderGallery();
    };
    reader.readAsDataURL(file);
  });
});

function renderGallery() {
  gallery.innerHTML = "";
  const searchVal = (searchInput.value || '').toLowerCase();
  const visible = images.filter((img) => (img.title || '').toLowerCase().includes(searchVal));
  if (!visible.length) {
    gallery.innerHTML = `<div class="empty">No images yet. Use <strong>Add Photo</strong> or drag & drop images onto this page.</div>`;
    updateStatus();
    return;
  }

  visible.forEach((img, index) => {
    const card = document.createElement('div');
    card.className = 'card';

    const imgElem = document.createElement('img');
    imgElem.src = img.src;
    imgElem.alt = img.title || 'Gallery image';
    imgElem.loading = 'lazy';
    imgElem.style.filter = filterSelect.value;
    imgElem.addEventListener('click', () => openLightbox(images.indexOf(img)));

    const caption = document.createElement('div');
    caption.className = 'caption';
    const title = document.createElement('div');
    title.className = 'title';
    title.textContent = img.title || 'Untitled';
    caption.appendChild(title);

    card.appendChild(imgElem);
    card.appendChild(caption);
    gallery.appendChild(card);
  });
  updateStatus();
}

function saveImages() {
  localStorage.setItem('galleryImages', JSON.stringify(images));
}

function openLightbox(index) {
  currentIndex = index;
  if (!images[index]) return;
  lightboxImg.src = images[index].src;
  lightbox.style.display = 'flex';
  lightbox.setAttribute('tabindex', '-1');
  lightbox.focus?.();
}

closeBtn.onclick = () => lightbox.style.display = 'none';

nextBtn.onclick = () => {
  if (!images.length) return;
  currentIndex = (currentIndex + 1) % images.length;
  lightboxImg.src = images[currentIndex].src;
};

prevBtn.onclick = () => {
  if (!images.length) return;
  currentIndex = (currentIndex - 1 + images.length) % images.length;
  lightboxImg.src = images[currentIndex].src;
};

editBtn.onclick = () => {
  if (!images[currentIndex]) return;
  editTitle.value = images[currentIndex].title || '';
  editCategory.value = images[currentIndex].category || '';
  editModal.style.display = 'flex';
};

saveEdit.onclick = () => {
  if (!images[currentIndex]) return;
  images[currentIndex].title = editTitle.value;
  images[currentIndex].category = editCategory.value;
  saveImages();
  renderGallery();
  editModal.style.display = 'none';
};

cancelEdit.onclick = () => editModal.style.display = 'none';

deleteBtn.onclick = () => {
  if (!images[currentIndex]) return;
  if (confirm("Delete this image?")) {
    images.splice(currentIndex, 1);
    saveImages();
    renderGallery();
    lightbox.style.display = 'none';
  }
};

shareBtn.onclick = async () => {
  const img = images[currentIndex];
  if (!img) return;
  try {
    if (navigator.share) {
      await navigator.share({
        title: img.title,
        text: 'Check out this image!',
        url: img.src
      });
    } else if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(img.src);
      alert("Image link copied!");
    } else {
      // Fallback: open the image in a new tab
      window.open(img.src, '_blank');
    }
  } catch (err) {
    console.warn('Share/copy failed', err);
    alert('Unable to share or copy image link.');
  }
};

filterSelect.onchange = renderGallery;
searchInput.oninput = renderGallery;

// Status updater
const statusEl = document.getElementById('status');
function updateStatus(){
  if (!statusEl) return;
  const total = images.length;
  const shown = gallery.querySelectorAll('.card').length;
  statusEl.textContent = `${total} image${total===1? '':'s'} — ${shown} shown`;
}

// Drag & drop support
['dragenter','dragover'].forEach(evt => {
  window.addEventListener(evt, (e)=>{e.preventDefault(); e.stopPropagation();}, false);
});
window.addEventListener('drop', (e)=>{
  e.preventDefault(); e.stopPropagation();
  const files = e.dataTransfer.files;
  if (files && files.length) {
    Array.from(files).forEach(f=>{
      if (f.type && f.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (ev)=>{
          images.push({src: ev.target.result, title: f.name, category:'Uncategorized'});
          saveImages(); renderGallery();
        };
        reader.readAsDataURL(f);
      }
    });
  }
}, false);

// Keyboard navigation for lightbox
document.addEventListener('keydown', (e)=>{
  if (lightbox.style.display === 'flex'){
    if (e.key === 'Escape') { lightbox.style.display='none'; }
    if (e.key === 'ArrowLeft') { prevBtn.click(); }
    if (e.key === 'ArrowRight') { nextBtn.click(); }
  }
});

window.onclick = (e) => {
  if (e.target === editModal) editModal.style.display = 'none';
  if (e.target === lightbox) lightbox.style.display = 'none';
};

renderGallery();

console.log('Gallery initialized — images loaded:', images.length);