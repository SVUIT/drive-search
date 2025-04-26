window.subjectsData = {};
window.documentsData = {};

document.addEventListener('DOMContentLoaded', () => {
  renderTagCheckboxes();
  document.getElementById('search-button')
          .addEventListener('click', onSearch);
  document.addEventListener('click', handleDetailClick);
});

// Lấy và render checkbox tag động từ API tài liệu
async function renderTagCheckboxes() {
  try {
    const res = await fetch('/documents/search?query=&tag=all');
    const data = await res.json();
    const tags = [...new Set(data.flatMap(d => d.tags || []))];
    const container = document.getElementById('tag-checkboxes');
    container.innerHTML = '<label><input type="checkbox" value="all" checked /> All</label>';
    tags.forEach(tag => {
      const lbl = document.createElement('label');
      lbl.style.marginRight = '8px';
      lbl.innerHTML = `<input type="checkbox" value="${tag}" /> ${tag}`;
      container.appendChild(lbl);
    });
  } catch (e) {
    console.error('Không thể load tags:', e);
  }
}

// Trả mảng tags được chọn
function getSelectedTags() {
  const boxes = Array.from(document.querySelectorAll('#tag-checkboxes input[type=checkbox]'));
  const allBox = boxes.find(b => b.value==='all');
  if (allBox.checked) return ['all'];
  return boxes.filter(b=>b.checked && b.value!=='all').map(b=>b.value);
}

// Xử lý khi nhấn Search
function onSearch() {
  const query = document.getElementById('search-input').value.trim();
  if (!query) { alert('Vui lòng nhập từ khóa.'); return; }
  const type = document.getElementById('search-type').value;
  const tags = getSelectedTags().join(',');
  if (type === 'subjects') showSubjects(query, tags);
  else showDocuments(query, tags);
}

// Hiển thị subjects
async function showSubjects(q, tags) {
  document.getElementById('document-result-container').style.display = 'none';
  const container = document.querySelector('.card-container');
  container.style.display = 'flex';
  try {
    const res = await fetch(`/search?query=${encodeURIComponent(q)}&tags=${encodeURIComponent(tags)}`);
    const subs = await res.json();
    container.innerHTML = '';
    subs.forEach(s => {
      window.subjectsData[s.$id] = s;
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `
        <h3>${s.name||'N/A'}</h3>
        <p><strong>Mã:</strong> ${s.code||'–'}</p>
        <p><strong>LT:</strong> ${s['theory-credits']||0}, TH: ${s['practice-credits']||0}</p>
        <p><strong>Khoa:</strong> ${s.management||'–'}</p>
        <button class="detail-button" data-id="${s.$id}">Xem chi tiết</button>
      `;
      container.appendChild(card);
    });
    if (subs.length===0) container.innerHTML='<p>Không tìm thấy môn học.</p>';
  } catch(e) {
    console.error('Lỗi tìm môn học:', e);
  }
}

// Hiển thị documents
async function showDocuments(q, tags) {
  document.querySelector('.card-container').style.display = 'none';
  const docC = document.getElementById('document-result-container');
  docC.style.display = 'flex';
  try {
    const res = await fetch(`/documents/search?query=${encodeURIComponent(q)}&tags=${encodeURIComponent(tags)}`);
    const docs = await res.json();
    renderDocumentSearchResults(docs);
  } catch(e) {
    console.error('Lỗi tìm tài liệu:', e);
    docC.innerHTML = '<p>Có lỗi xảy ra.</p>';
  }
}

// Render kết quả tài liệu
function renderDocumentSearchResults(docs) {
  const docC = document.getElementById('document-result-container');
  docC.innerHTML = '';
  if (!docs.length) { docC.innerHTML = '<p>Không tìm thấy tài liệu.</p>'; return; }
  docs.forEach(d => {
    const div = document.createElement('div');
    div.className = 'card';
    div.innerHTML = `
      <h3>${d.name||'N/A'}</h3>
      <p><a href="${d.URL}" target="_blank">Xem tài liệu</a></p>
      <p>Upload: ${d['upload-date']?.split('T')[0]||'–'}</p>
      <p>Học kỳ: ${d.semester||'–'}</p>
      <p>Năm: ${d['academic-year']||'–'}</p>
      <p>Tags: ${(d.tags||[]).join(', ')||'–'}</p>
    `;
    docC.appendChild(div);
  });
}

// Mở modal & show detail
function handleDetailClick(evt) {
  if (!evt.target.classList.contains('detail-button')) return;
  const id = evt.target.dataset.id;
  const subj = window.subjectsData[id];
  if (!subj) return;
  const modal = document.getElementById('detail-modal');
  document.getElementById('subject-details').innerHTML = `
    <h2>${subj.name}</h2>
    <p><strong>Code:</strong> ${subj.code}</p>
    <p><strong>Credits:</strong> ${subj['theory-credits']+subj['practice-credits']}</p>
    <p><strong>Type:</strong> ${subj.type}</p>
    <p><strong>Dept:</strong> ${subj.management}</p>
  `;
  modal.classList.add('active');
  modal.querySelector('.close-modal').onclick = () => modal.classList.remove('active');
}
