let searchInput;
let cardContainer;
let documentContainer;

window.subjectsData = {};
window.documentsData = {};

async function performSearch() {
  const query = searchInput.value.trim();
  const type = getSelectedType();
  const selectedTags = getSelectedTags();

  try {
    if (type === 'subjects') {
      if (!query) {
        if (documentContainer) documentContainer.style.display = 'none';
        if (cardContainer) {
          cardContainer.style.display = 'flex';
          cardContainer.innerHTML = '';
        }
        const response = await fetch('/subjects');
        const subjects = await response.json();
        if (cardContainer) {
          if (Array.isArray(subjects) && subjects.length > 0) {
            subjects.forEach(subject => {
              const card = createSubjectCard(subject);
              card.addEventListener('click', () => viewSubjectDetails(subject.$id));
              cardContainer.appendChild(card);
            });
          } else {
            cardContainer.innerHTML = "<p>Không tìm thấy kết quả.</p>";
          }
        }
        return;
      }

      if (documentContainer) documentContainer.style.display = 'none';
      if (cardContainer) {
        cardContainer.style.display = 'flex';
        cardContainer.innerHTML = '';
      }

      const response = await fetch(`/search?query=${encodeURIComponent(query)}`);
      const subjects = await response.json();

      const seen = new Set();
      const uniqueSubjects = [];

      subjects.forEach(subject => {
        const key = (subject.code || subject.name || '').toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          uniqueSubjects.push(subject);
        }
      });

      if (uniqueSubjects.length > 0) {
        uniqueSubjects.forEach(subject => {
          const card = createSubjectCard(subject);
          card.addEventListener('click', () => viewSubjectDetails(subject.$id));
          cardContainer.appendChild(card);
        });
      } else {
        cardContainer.innerHTML = "<p>Không tìm thấy kết quả.</p>";
      }
    } else if (type === 'documents') {
      if (cardContainer) cardContainer.style.display = 'none';
      if (documentContainer) {
        documentContainer.style.display = 'block';
        documentContainer.innerHTML = '';

        let url = '/documents/search';
        const params = new URLSearchParams();
        if (query) params.append('query', query);
        if (selectedTags.length > 0) params.append('tags', selectedTags.join(','));
        if (params.toString()) url += '?' + params.toString();

        const response = await fetch(url);
        const documents = await response.json();
        renderDocumentSearchResults(documents);
        updateTagFilterFromDocuments(documents);
      }
    }
  } catch (error) {
    if (cardContainer) cardContainer.innerHTML = "<p>Có lỗi xảy ra khi tìm kiếm.</p>";
    if (documentContainer) documentContainer.innerHTML = "<p>Có lỗi xảy ra khi tìm kiếm tài liệu.</p>";
  }
}

function populateTags(tagArray) {
  const tagsContainer = document.getElementById('tags-container');
  const tagsSelected = document.getElementById('tags-selected');
  const searchBox = document.getElementById('tag-search-box');
  if (!tagsContainer) return;

  tagsContainer.innerHTML = '';
  const sortedTags = [...tagArray].sort();
  const showLimit = 10;
  let hiddenCount = sortedTags.length - showLimit;

  sortedTags.forEach((tag, i) => {
    const label = document.createElement('label');
    label.className = 'flex items-center gap-2 cursor-pointer';
    label.style.display = i < showLimit ? 'flex' : 'none';
    label.innerHTML = `
      <div class="relative w-4 h-4 flex items-center justify-center">
        <input type="checkbox" class="peer absolute opacity-0 w-full h-full cursor-pointer z-10" value="${tag}">
        <div class="w-4 h-4 border border-gray-300 rounded peer-checked:bg-primary peer-checked:border-primary"></div>
        <div class="absolute text-white w-3 h-3 flex items-center justify-center opacity-0 peer-checked:opacity-100">
          <i class="ri-check-line ri-xs"></i>
        </div>
      </div>
      <span class="text-sm">${tag}</span>
    `;
    label.querySelector('input').addEventListener('change', updateSelectedTags);
    tagsContainer.appendChild(label);
  });

  if (hiddenCount > 0) {
    const btn = document.createElement('button');
    btn.textContent = `Hiển thị thêm ${hiddenCount} tag`;
    btn.className = 'text-blue-600 hover:underline mt-2 text-sm';
    btn.addEventListener('click', () => {
      tagsContainer.querySelectorAll('label').forEach(l => l.style.display = 'flex');
      btn.remove();
    });
    tagsContainer.appendChild(btn);
  }

  if (searchBox) {
    searchBox.addEventListener('input', () => {
      const val = searchBox.value.trim().toLowerCase();
      tagsContainer.querySelectorAll('label').forEach(label => {
        const tagText = label.innerText.toLowerCase();
        label.style.display = tagText.includes(val) ? 'flex' : 'none';
      });
    });
  }

  tagsSelected.textContent = 'Chọn tags';
}

function updateTagFilterFromDocuments(documents) {
  const tagSet = new Set();
  documents.forEach(doc => {
    (doc.tags || []).forEach(tag => tagSet.add(tag));
  });
  populateTags(tagSet);
}

async function fetchTags(subjectId) {
  const response = await fetch(`/documents/tags?subjectId=${subjectId}`);
  const tags = await response.json();
  populateTags(tags);
}

document.addEventListener('DOMContentLoaded', () => {
  searchInput = document.getElementById('search-input');
  cardContainer = document.querySelector('.card-container');
  documentContainer = document.getElementById('document-result-container');
  const searchButton = document.getElementById('search-button');
  const clearBtn = document.getElementById('clear-tags-btn');

  if (searchButton) {
    searchButton.addEventListener('click', performSearch);
  }

  if (searchInput) {
    searchInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        performSearch();
      }
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      const checkboxes = document.querySelectorAll('#tags-container input[type="checkbox"]');
      checkboxes.forEach(cb => cb.checked = false);
      updateSelectedTags();
    });
  }
});
