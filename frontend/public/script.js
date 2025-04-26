// Cache for documents per query
window.documentsCache = {};
window.subjectsData = {};
window.currentDocuments = [];  // last fetched documents

// === SETUP EVENT LISTENERS ===
document.getElementById('search-button').addEventListener('click', onSearch);
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('detail-button')) {
    const sub = window.subjectsData[e.target.dataset.id];
    if (sub) openDetailModal(sub);
  }
});
window.addEventListener('DOMContentLoaded', () => {
  fetchTags();
});

// === MAIN SEARCH HANDLER ===
async function onSearch() {
  const query = document.getElementById('search-input').value.trim();
  if (!query) return alert('Vui lòng nhập từ khóa tìm kiếm.');

  const type = document.getElementById('search-type').value;
  const enableTags = document.getElementById('enable-tag-filter').checked;
  const checkedTags = Array.from(document.querySelectorAll('.tag-checkbox:checked')).map(cb => cb.value);

  if (type === 'subjects') {
    document.getElementById('document-result-container').style.display = 'none';
    document.querySelector('.card-container').style.display = 'flex';
    await fetchAndRenderSubjects(query);
  } else {
    document.querySelector('.card-container').style.display = 'none';
    document.getElementById('document-result-container').style.display = 'block';
    await fetchAndRenderDocuments(query, enableTags ? checkedTags : []);
  }
}

// === SUBJECTS ===
async function fetchAndRenderSubjects(q) {
  try {
    const res = await fetch(`/search?query=${encodeURIComponent(q)}`);
    if (!res.ok) throw new Error(res.status);
    const subs = await res.json();
    const cont = document.querySelector('.card-container');
    cont.innerHTML = '';
    window.subjectsData = {};
    if (subs.length) {
      subs.forEach(s => {
        window.subjectsData[s.$id] = s;
        const card = document.createElement('div');
        card.className = 'card';
        card.style.cssText = cssCardBase;
        card.innerHTML = `
          <h3>${s.name||'Môn chưa xác định'}</h3>
          <p><strong>Mã môn:</strong> ${s.code||'Chưa cập nhật'}</p>
          <p><strong>TCLT:</strong> ${s['theory-credits']||0}</p>
          <p><strong>TCTH:</strong> ${s['practice-credits']||0}</p>
          <p><strong>Tổng TC:</strong> ${(s['theory-credits']||0)+(s['practice-credits']||0)}</p>
          <p><strong>Loại:</strong> ${s.type||'Chưa'}</p>
          <p><strong>Khoa:</strong> ${s.management||'Chưa'}</p>
          <p><strong>Tài liệu:</strong> ${s.URL?`<a href="${s.URL}" target="_blank">Link</a>`:'Chưa'}</p>
          <button class="detail-button" data-id="${s.$id}">Xem chi tiết</button>`;
        cont.appendChild(card);
      });
    } else cont.innerHTML = '<p>Không tìm thấy kết quả.</p>';
  } catch (e) { console.error(e); }
}

// === DOCUMENTS ===
async function fetchAndRenderDocuments(q, tags=[]) {
  const cacheKey = q + '|' + tags.sort().join(',');
  if (window.documentsCache[cacheKey]) {
    renderDocumentSearchResults(window.documentsCache[cacheKey]);
    return;
  }
  try {
    const res = await fetch(`/documents/search?query=${encodeURIComponent(q)}`);
    if (!res.ok) throw new Error(res.status);
    const docs = await res.json();
    window.currentDocuments = docs;
    const filtered = tags.length
      ? docs.filter(d => Array.isArray(d.tags) && tags.every(t=>d.tags.includes(t)))
      : docs;
    window.documentsCache[cacheKey] = filtered;
    renderDocumentSearchResults(filtered);
  } catch (e) {
    console.error(e);
    document.getElementById('document-result-container').innerHTML =
      '<p>Có lỗi xảy ra khi tìm kiếm tài liệu.</p>';
  }
}

function renderDocumentSearchResults(docs) {
  const cont = document.getElementById('document-result-container');
  cont.innerHTML = '';
  cont.style.cssText = cssDocContainer;
  if (!docs.length) {
    cont.innerHTML = '<p style="text-align:center;color:#777;">📄 Không tìm thấy tài liệu.</p>';
    return;
  }
  docs.forEach(d => {
    const div = document.createElement('div');
    div.style.cssText = cssCardBase.replace('width: 20%;', 'width:17%;');
    div.addEventListener('mouseover', hoverIn);
    div.addEventListener('mouseleave', hoverOut);
    div.innerHTML = `
      <h3>${d.name||'N/A'}</h3>
      <p><strong>Link:</strong> ${d.URL?`<a href="${d.URL}" target="_blank">Xem tài liệu</a>`:'N/A'}</p>
      <p><strong>Ngày:</strong> ${d['upload-date']?d['upload-date'].split('T')[0]:'N/A'}</p>
      <p><strong>Học kỳ:</strong> ${d.semester||'Chưa'}</p>
      <p><strong>Năm:</strong> ${d['academic-year']||'Chưa'}</p>
      <p><strong>Tags:</strong> ${Array.isArray(d.tags)?d.tags.join(', '):'Chưa'}</p>`;
    cont.appendChild(div);
  });
}

// === TAGS UI & FETCH ===
async function fetchTags() {
  try {
    // get all docs once to collect tags
    const res = await fetch(`/documents/search?query=&tag=all`);
    if (!res.ok) throw new Error(res.status);
    const data = await res.json();
    const tags = [...new Set(data.flatMap(d=>d.tags||[]))];
    const container = document.getElementById('tag-filter-container');
    container.innerHTML = `
      <label><input type="checkbox" id="enable-tag-filter"> Lọc theo tag</label>
      <div id="tags-list" style="display:none;"></div>
    `;
    const list = container.querySelector('#tags-list');
    tags.forEach(t=>{
      const lbl = document.createElement('label');
      lbl.innerHTML = `<input type="checkbox" class="tag-checkbox" value="${t}"> ${t}`;
      list.appendChild(lbl);
    });
    // toggle show/hide tag checkboxes
    container.querySelector('#enable-tag-filter').addEventListener('change', e=>{
      list.style.display = e.target.checked ? 'block' : 'none';
    });
  } catch (e) { console.error('Error fetching tags', e); }
}

// === STYLES & HELPERS ===
const cssCardBase = `
  font-family:'Poppins',sans-serif;padding:16px;
  display:flex;flex-direction:column;justify-content:space-between;
  gap:8px;align-items:center;border:1px solid rgba(0,0,0,0.1);
  border-radius:12px;background:#fff;box-shadow:0 4px 12px rgba(0,0,0,0.12);
  transition:transform .3s,box-shadow .3s;width:20%;`;

const cssDocContainer = `
  display:flex;flex-wrap:wrap;justify-content:center;gap:20px;`;

function hoverIn(e) {
  e.currentTarget.style.transform = 'scale(1.05)';
  e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.18)';
}
function hoverOut(e) {
  e.currentTarget.style.transform = 'scale(1)';
  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)';
}
