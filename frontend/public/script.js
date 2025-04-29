window.subjectsData = {};
window.documentsData = {};

// On load: insert subject filter, fetch subjects and tags
window.addEventListener('DOMContentLoaded', () => {
  let subjSelect = document.getElementById('subject-filter');
  if (!subjSelect) {
    const tagFilter = document.getElementById('tag-filter');
    subjSelect = document.createElement('select');
    subjSelect.id = 'subject-filter';
    subjSelect.style = tagFilter.style.cssText;
    subjSelect.style.marginRight = '1em';
    tagFilter.parentNode.insertBefore(subjSelect, tagFilter);
  }
  fetchSubjectsForFilter();
  fetchTags();
});

async function fetchSubjectsForFilter() {
  const subjSelect = document.getElementById('subject-filter');
  if (!subjSelect) return;
  try {
    const res = await fetch('/subjects');
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const subjects = await res.json();

    subjSelect.innerHTML = '<option value="all">All Subjects</option>';
    window.subjectsData = {};
    subjects.forEach(s => {
      window.subjectsData[s.$id] = s;
      const opt = document.createElement('option');
      opt.value = s.$id;
      opt.textContent = s.name || s.code;
      subjSelect.appendChild(opt);
    });
  } catch (err) {
    console.error('Error fetching subjects for filter:', err);
  }
}

document.getElementById('search-button').addEventListener('click', async () => {
  const query = document.getElementById('search-input').value.trim();
  const searchType = document.getElementById('search-type').value;
  const selectedTag = $('#tag-filter').val() || [];
  const selectedSubj = document.getElementById('subject-filter').value;

  if (searchType === 'subjects') {
    document.getElementById('document-result-container').style.display = 'none';
    const cardContainer = document.querySelector('.card-container');
    cardContainer.style.display = 'flex';

    if (!query) {
      try {
        const res = await fetch('/subjects');
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const subjects = await res.json();
        cardContainer.innerHTML = '';
        window.subjectsData = {};
        subjects.forEach(subject => {
          window.subjectsData[subject.$id] = subject;
          const card = document.createElement('div');
          card.className = 'card';
          card.style.cssText = `font-family:'Poppins',sans-serif; padding:32px; width:100%;max-width:400px; aspect-ratio:4/3; display:flex;flex-direction:column;justify-content:space-between;align-items:flex-start;gap:8px; line-height:1; background:rgba(255,255,255,0.2); backdrop-filter:blur(10px); border:1px solid transparent;border-radius:20px; border-image:linear-gradient(to right,#6a11cb,#2575fc) 1; box-shadow:0 8px 32px rgba(0,0,0,0.1); filter:drop-shadow(0 4px 8px rgba(0,0,0,0.05)); transition:transform .4s ease,box-shadow .4s ease,filter .4s ease; cursor:pointer;`;
          card.innerHTML = `<h3>${subject.name||'Môn chưa xác định'}</h3> <p><strong>Mã môn:</strong> ${subject.code||'Chưa cập nhật'}</p>`;
          cardContainer.appendChild(card);
        });
      } catch (err) {
        console.error('Error fetching all subjects:', err);
        cardContainer.innerHTML = '<p>Không thể tải danh sách môn.</p>';
      }
      return;
    }

    try {
      const response = await fetch(`/search?query=${encodeURIComponent(query)}&tag=${encodeURIComponent(selectedTag)}`);
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      const subjects = await response.json();
      cardContainer.innerHTML = '';
      window.subjectsData = {};
      if (subjects.length) {
        subjects.forEach(subject => {
          const card = document.createElement('div');
          // render each subject card
          cardContainer.appendChild(card);
        });
      } else {
        cardContainer.innerHTML = '<p>Không tìm thấy kết quả.</p>';
      }
    } catch (error) {
      console.error('Lỗi khi tìm kiếm:', error);
    }
  }
  else if (searchType === 'documents') {
    document.querySelector('.card-container').style.display = 'none';
    const docContainer = document.getElementById('document-result-container');
    docContainer.style.display = 'flex';

    try {
      let documents;
      if ((!selectedTag.length || selectedTag.includes('all')) && selectedSubj && selectedSubj !== 'all') {
        const res = await fetch(`/documents?subjectId=${encodeURIComponent(selectedSubj)}`);
        if (!res.ok) throw new Error(`Status ${res.status}`);
        documents = await res.json();
      } else if (selectedTag.length && !selectedTag.includes('all')) {
        const res = await fetch(`/documents?tag=${encodeURIComponent(selectedTag.join(','))}`);
        if (!res.ok) throw new Error(`Status ${res.status}`);
        documents = await res.json();
      } else {
        const res = await fetch('/documents?tag=all');
        if (!res.ok) throw new Error(`Status ${res.status}`);
        documents = await res.json();
      }
      renderDocumentSearchResults(documents);
    } catch (err) {
      console.error('Lỗi khi tìm tài liệu:', err);
      docContainer.innerHTML = '<p>Có lỗi xảy ra khi tìm kiếm tài liệu.</p>';
    }
  }
});

// Fetch tags
async function fetchTags() {
  const tagSelect = document.getElementById('tag-filter');
  if (!tagSelect) return;
  const prev = $('#tag-filter').val() || [];
  try {
    const res = await fetch('/documents/tags');
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const uniqueTags = await res.json();
    updateTagOptions(uniqueTags);
    $('#tag-filter').val(prev).trigger('change');
  } catch (e) {
    console.error('Error fetching tags:', e);
  }
}

// Initialize Select2
$(document).ready(function() {
  $('#tag-filter').select2({ placeholder: 'Chọn tag', allowClear: true });
});

// Update tag <select>
function updateTagOptions(uniqueTags) {
  const $select = $('#tag-filter');
  $select.empty();
  $select.append('<option value="all">All</option>');
  uniqueTags.forEach(tag => $select.append(`<option value="${tag}">${tag}</option>`));
  $select.trigger('change.select2');
}

// Render documents
async function renderDocumentSearchResults(documents) {
  const docContainer = document.getElementById('document-result-container');
  docContainer.innerHTML = '';
  Object.assign(docContainer.style, { display:'flex', flexWrap:'wrap', justifyContent:'center', gap:'20px' });

  const selectedTags = $('#tag-filter').val() || [];
  let filtered = documents;
  if (selectedTags.length && !selectedTags.includes('all')) {
    filtered = documents.filter(doc => Array.isArray(doc.tags) && selectedTags.some(tag => doc.tags.includes(tag)));
  }

  if (!filtered.length) {
    docContainer.innerHTML = '<p style="text-align:center;font-size:16px;color:#777;font-weight:500;">📄 Không tìm thấy tài liệu phù hợp với bộ lọc tag.</p>';
    return;
  }

  filtered.forEach(doc => {
    const div = document.createElement('div');
    div.style.cssText = `font-family:'Poppins',sans-serif;padding:32px;width:100%;max-width:400px;display:flex;flex-direction:column;justify-content:space-between;align-items:flex-start;gap:8px;line-height:1.3;background:rgba(255,255,255,0.2);backdrop-filter:blur(10px);border:1px solid transparent;border-radius:20px;border-image:linear-gradient(to right,#6a11cb,#2575fc) 1;box-shadow:0 8px 32px rgba(0,0,0,0.1);filter:drop-shadow(0 4px 8px rgba(0,0,0,0.05));transition:transform .4s ease,box-shadow .4s ease,filter .4s ease;cursor:pointer;`;
    div.onmouseover = () => { div.style.transform='scale(1.05)'; div.style.boxShadow='0 6px 16px rgba(0,0,0,0.18)'; };
    div.onmouseleave = () => { div.style.transform=''; div.style.boxShadow=''; };
    div.innerHTML = `
      <h3 style="color:#007bff;margin:0;">${doc.name||'N/A'}</h3>
      <p><strong>Link:</strong> ${doc.URL?`<a href="${doc.URL}" target="_blank">Xem tài liệu</a>`:'N/A'}</p>
      <p><strong>Ngày tải lên:</strong> ${doc['upload-date']?(() => { const [y,m,d]=doc['upload-date'].split('T')[0].split('-'); return `${d}-${m}-${y}`; })():'N/A'}</p>
      <p><strong>Học kỳ:</strong> ${doc.semester||'Chưa cập nhật'}</p>
      <p><strong>Năm học:</strong> ${doc['academic-year']||'Chưa cập nhật'}</p>
      <p><strong>Tags:</strong> ${doc.tags?doc.tags.join(', '):'Chưa cập nhật'}</p>
    `;
    docContainer.appendChild(div);
  });
}
