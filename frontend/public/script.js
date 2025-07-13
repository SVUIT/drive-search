function getSelectedType() {
  const selectedType = document.querySelector('input[name="type"]:checked');
  return selectedType ? selectedType.value : 'subjects';
}

function getSelectedTags() {
  const checkboxes = document.querySelectorAll('#tags-container input[type="checkbox"]:checked');
  return Array.from(checkboxes).map(cb => cb.value);
}

function updateSelectedTags() {
  const tagsSelected = document.getElementById('tags-selected');
  const selectedTags = getSelectedTags();
  if (tagsSelected) {
    if (selectedTags.length === 0) {
      tagsSelected.textContent = 'Chọn tags';
    } else if (selectedTags.length === 1) {
      tagsSelected.textContent = selectedTags[0];
    } else {
      tagsSelected.textContent = `${selectedTags.length} đã chọn`;
    }
  }
}

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

function createSubjectCard(subject) {
  const card = document.createElement('div');
  card.className = 'card';
  card.innerHTML = `
    <h3>${subject.name || 'Môn chưa xác định'}</h3>
    <p><strong>Mã môn:</strong> ${subject.code || 'Chưa cập nhật'}</p>
    <p><strong>Tín chỉ lý thuyết:</strong> ${subject['theory-credits'] || '0'}</p>
    <p><strong>Tín chỉ thực hành:</strong> ${subject['practice-credits'] || '0'}</p>
    <p><strong>Loại:</strong> ${subject.type || 'Chưa cập nhật'}</p>
    <p><strong>Khoa:</strong> ${subject.management || 'Chưa cập nhật'}</p>
    <p><strong>Tài liệu:</strong> ${subject.URL ? `<a href="${subject.URL}" target="_blank">Link</a>` : 'Chưa cập nhật'}</p>
  `;
  return card;
}

async function viewSubjectDetails(subjectId) {
  const response = await fetch(`/documents?subjectId=${subjectId}`);
  const documents = await response.json();
  renderDocumentSearchResults(documents);
  await fetchTags(subjectId);
}

function renderDocumentSearchResults(documents) {
  const container = document.getElementById('document-result-container');
  if (!container) return;
  container.innerHTML = `
    <div class="bg-white rounded-lg shadow-md overflow-hidden">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên tài liệu</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loại</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tags</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          ${documents.map(doc => `
            <tr>
              <td class="px-6 py-4 whitespace-nowrap"><div class="text-sm font-medium text-gray-900">${doc.name}</div></td>
              <td class="px-6 py-4 whitespace-nowrap"><span class="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">${doc.type}</span></td>
              <td class="px-6 py-4"><div class="flex flex-wrap gap-1">${doc.tags.map(tag => `<span class="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">${tag}</span>`).join('')}</div></td>
              <td class="px-6 py-4 whitespace-nowrap text-sm">${doc.URL ? `<a href="${doc.URL}" target="_blank" class="text-blue-600 hover:text-blue-900">Xem</a>` : 'Chưa có link'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

// Hàm load danh sách môn học từ backend
async function loadSubjects() {
  try {
    const res = await fetch('/subjects');
    const subjects = await res.json();
    const subjectSelect = document.getElementById("subject-select");
    subjectSelect.innerHTML = '<option value="">-- Chọn môn học --</option>';
    subjects.forEach(subject => {
      const option = document.createElement("option");
      option.value = subject.$id;
      option.textContent = subject.name || subject.title || subject['Tên môn']; // Tùy tên trường trong DB
      subjectSelect.appendChild(option);
    });
  } catch (err) {
    alert("Không thể tải danh sách môn học!");
    console.error(err);
  }
}

// Hàm load tag khi chọn môn học
async function loadTagsBySubject(subjectId) {
  try {
    const res = await fetch(`/documents/tags?subjectId=${subjectId}`);
    const tags = await res.json();
    const tagSelect = document.getElementById("tag-select");
    tagSelect.innerHTML = '<option value="">-- Chọn tag --</option>';
    tags.forEach(tag => {
      const option = document.createElement("option");
      option.value = tag;
      option.textContent = tag;
      tagSelect.appendChild(option);
    });
    // Hiện box tag nếu có tag
    document.getElementById("tag-container").style.display = tags.length > 0 ? "block" : "none";
  } catch (err) {
    alert("Không thể tải danh sách tag!");
    console.error(err);
  }
}

// Gọi khi trang load xong
document.addEventListener('DOMContentLoaded', () => {
  loadSubjects();
  searchInput = document.getElementById('search-input');
  cardContainer = document.querySelector('.card-container');
  documentContainer = document.getElementById('document-result-container');
  const searchButton = document.getElementById('search-button');
  const clearBtn = document.getElementById('clear-tags-btn');
  const subjectSelect = document.getElementById("subject-select");

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

  subjectSelect.addEventListener("change", function () {
    const subjectId = this.value;
    if (subjectId) {
      loadTagsBySubject(subjectId);
    } else {
      document.getElementById("tag-container").style.display = "none";
      document.getElementById("tag-select").innerHTML = '<option value="">-- Chọn tag --</option>';
    }
  });
});
