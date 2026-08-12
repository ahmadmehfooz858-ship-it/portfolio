/**
 * Project Dashboard — Supabase Auth + Storage + Database
 */
(function () {
  'use strict';

  var loginScreen = document.getElementById('loginScreen');
  var dashboard = document.getElementById('dashboard');
  var loginForm = document.getElementById('loginForm');
  var loginError = document.getElementById('loginError');
  var togglePass = document.getElementById('togglePass');
  var logoutBtn = document.getElementById('logoutBtn');
  var uploadForm = document.getElementById('uploadForm');
  var fileInput = document.getElementById('fileInput');
  var dropZone = document.getElementById('dropZone');
  var fileListEl = document.getElementById('fileList');
  var projectsList = document.getElementById('projectsList');
  var emptyState = document.getElementById('emptyState');
  var projCount = document.getElementById('projCount');
  var clearFormBtn = document.getElementById('clearFormBtn');
  var clearAllBtn = document.getElementById('clearAllBtn');
  var uploadBtn = document.getElementById('uploadBtn');

  var selectedFiles = [];
  var sb = null; // supabase client

  var MAX_FILE = 50 * 1024 * 1024; // 50 MB (Supabase free limit)


  // Custom confirm modal (replaces window.confirm)
  var confirmModal = document.getElementById('confirmModal');
  var confirmTitle = document.getElementById('confirmTitle');
  var confirmMessage = document.getElementById('confirmMessage');
  var confirmCancel = document.getElementById('confirmCancel');
  var confirmOk = document.getElementById('confirmOk');
  var _confirmResolve = null;

  function openConfirm(title, message) {
    return new Promise(function (resolve) {
      _confirmResolve = resolve;
      if (confirmTitle) confirmTitle.textContent = title || 'Are you sure?';
      if (confirmMessage) confirmMessage.textContent = message || 'This action cannot be undone.';
      if (confirmModal) {
        confirmModal.hidden = false;
        confirmModal.classList.add('is-open');
      }
    });
  }

  function closeConfirm(result) {
    if (confirmModal) {
      confirmModal.classList.remove('is-open');
      confirmModal.hidden = true;
    }
    if (_confirmResolve) {
      _confirmResolve(!!result);
      _confirmResolve = null;
    }
  }

  if (confirmCancel) confirmCancel.addEventListener('click', function () { closeConfirm(false); });
  if (confirmOk) confirmOk.addEventListener('click', function () { closeConfirm(true); });
  if (confirmModal) {
    confirmModal.addEventListener('click', function (e) {
      if (e.target === confirmModal) closeConfirm(false);
    });
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && confirmModal && confirmModal.classList.contains('is-open')) {
      closeConfirm(false);
    }
  });


  function showDashboard() {
    if (loginScreen) {
      loginScreen.hidden = true;
      loginScreen.classList.add('is-hidden');
      loginScreen.style.display = 'none';
    }
    if (dashboard) {
      dashboard.hidden = false;
      dashboard.classList.remove('is-hidden');
      dashboard.style.display = '';
    }
    loadProjects();
  }

  function showLogin() {
    if (dashboard) {
      dashboard.hidden = true;
      dashboard.classList.add('is-hidden');
      dashboard.style.display = 'none';
    }
    if (loginScreen) {
      loginScreen.hidden = false;
      loginScreen.classList.remove('is-hidden');
      loginScreen.style.display = '';
    }
  }

  function showLoginError(msg) {
    if (!loginError) return;
    loginError.hidden = false;
    loginError.textContent = msg || 'Invalid email or password';
  }

  function hideLoginError() {
    if (loginError) loginError.hidden = true;
  }

  function escapeHtml(str) {
    var d = document.createElement('div');
    d.textContent = str || '';
    return d.innerHTML;
  }

  function formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  function fileIcon(type, name) {
    if (type && type.indexOf('image/') === 0) return 'fa-image';
    if (type && type.indexOf('video/') === 0) return 'fa-video';
    if (type && type.indexOf('audio/') === 0) return 'fa-music';
    if (type === 'application/pdf' || (name && /\.pdf$/i.test(name))) return 'fa-file-pdf';
    if (name && /\.(doc|docx)$/i.test(name)) return 'fa-file-word';
    if (name && /\.(txt|md|rtf)$/i.test(name)) return 'fa-file-lines';
    if (name && /\.(zip|rar|7z)$/i.test(name)) return 'fa-file-zipper';
    return 'fa-file';
  }

  // ----- Auth -----
  if (loginForm) {
    loginForm.addEventListener('submit', function (e) {
      e.preventDefault();
      hideLoginError();
      var email = (document.getElementById('username') || {}).value || '';
      var pass = (document.getElementById('password') || {}).value || '';
      email = email.trim();
      if (!email || !pass) {
        showLoginError('Enter email and password');
        return;
      }
      if (!sb) {
        showLoginError('Supabase not configured — see SETUP_SUPABASE.txt');
        return;
      }
      var submitBtn = loginForm.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Signing in…';
      }
      sb.auth.signInWithPassword({ email: email, password: pass })
        .then(function (res) {
          if (res.error) {
            var msg = res.error.message || 'Login failed';
            if (/invalid login/i.test(msg)) msg = 'Invalid email or password';
            if (/email not confirmed/i.test(msg)) msg = 'Confirm your email first (check inbox), or disable email confirm in Supabase Auth settings.';
            showLoginError(msg);
            return;
          }
          // onAuthStateChange will open dashboard
        })
        .catch(function (err) {
          showLoginError(err.message || 'Login failed');
        })
        .finally(function () {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> Sign In';
          }
        });
    });
  }

  if (togglePass) {
    togglePass.addEventListener('click', function () {
      var input = document.getElementById('password');
      var icon = togglePass.querySelector('i');
      if (!input) return;
      if (input.type === 'password') {
        input.type = 'text';
        if (icon) icon.className = 'fa-solid fa-eye-slash';
      } else {
        input.type = 'password';
        if (icon) icon.className = 'fa-solid fa-eye';
      }
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', function () {
      if (sb) {
        sb.auth.signOut().then(function () {
          showLogin();
          if (loginForm) loginForm.reset();
        });
      } else showLogin();
    });
  }

  // ----- Files UI -----
  function renderFileList() {
    if (!fileListEl) return;
    fileListEl.innerHTML = '';
    selectedFiles.forEach(function (file, idx) {
      var item = document.createElement('div');
      item.className = 'file-item';
      item.innerHTML =
        '<i class="fa-solid ' + fileIcon(file.type, file.name) + '"></i>' +
        '<span class="file-name">' + escapeHtml(file.name) + '</span>' +
        '<span class="file-size">' + formatSize(file.size) + '</span>' +
        '<button type="button" class="remove-file" data-idx="' + idx +
        '" aria-label="Remove"><i class="fa-solid fa-xmark"></i></button>';
      fileListEl.appendChild(item);
    });
    fileListEl.querySelectorAll('.remove-file').forEach(function (btn) {
      btn.addEventListener('click', function () {
        selectedFiles.splice(Number(btn.dataset.idx), 1);
        renderFileList();
      });
    });
  }

  function addFiles(files) {
    files.forEach(function (f) {
      if (f.size > MAX_FILE) {
        alert('"' + f.name + '" is over 50 MB (Supabase free limit) and was skipped.');
        return;
      }
      selectedFiles.push(f);
    });
    renderFileList();
  }

  if (dropZone) {
    ['dragenter', 'dragover'].forEach(function (ev) {
      dropZone.addEventListener(ev, function (e) {
        e.preventDefault();
        dropZone.classList.add('drag-over');
      });
    });
    ['dragleave', 'drop'].forEach(function (ev) {
      dropZone.addEventListener(ev, function (e) {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
      });
    });
    dropZone.addEventListener('drop', function (e) {
      addFiles(Array.prototype.slice.call(e.dataTransfer.files || []));
    });
  }

  if (fileInput) {
    fileInput.addEventListener('change', function () {
      addFiles(Array.prototype.slice.call(fileInput.files || []));
      fileInput.value = '';
    });
  }

  var categorySelect = document.getElementById('projCategory');
  var customCategoryGroup = document.getElementById('customCategoryGroup');
  var customCategoryInput = document.getElementById('customCategory');

  function toggleCustomCategory() {
    if (!categorySelect || !customCategoryGroup) return;
    if (categorySelect.value === 'Other') {
      customCategoryGroup.hidden = false;
      if (customCategoryInput) customCategoryInput.focus();
    } else {
      customCategoryGroup.hidden = true;
      if (customCategoryInput) customCategoryInput.value = '';
    }
  }
  if (categorySelect) categorySelect.addEventListener('change', toggleCustomCategory);

  if (clearFormBtn) {
    clearFormBtn.addEventListener('click', function () {
      if (uploadForm) uploadForm.reset();
      selectedFiles = [];
      renderFileList();
      if (customCategoryGroup) customCategoryGroup.hidden = true;
      if (customCategoryInput) customCategoryInput.value = '';
    });
  }

  function safeFileName(name) {
    return name.replace(/[^\w.\-()+ ]/g, '_');
  }

  async function uploadFile(projectId, file) {
    var path = projectId + '/' + Date.now() + '_' + safeFileName(file.name);
    var { error } = await sb.storage.from('projects').upload(path, file, {
      cacheControl: '3600',
      upsert: false
    });
    if (error) throw error;
    var { data } = sb.storage.from('projects').getPublicUrl(path);
    return {
      name: file.name,
      type: file.type || 'application/octet-stream',
      size: file.size,
      url: data.publicUrl,
      path: path
    };
  }

  if (uploadForm) {
    uploadForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var title = ((document.getElementById('projTitle') || {}).value || '').trim();
      if (!title) return;
      if (!sb) {
        alert('Supabase not configured.');
        return;
      }

      if (uploadBtn) {
        uploadBtn.disabled = true;
        uploadBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Uploading…';
      }

      var categoryEl = document.getElementById('projCategory');
      var descEl = document.getElementById('projDesc');
      var catValue = categoryEl ? categoryEl.value : 'Other';
      if (catValue === 'Other' && customCategoryInput) {
        var custom = customCategoryInput.value.trim();
        if (custom) catValue = custom;
      }

      var projectId = 'proj_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);

      (async function () {
        try {
          var session = (await sb.auth.getSession()).data.session;
          if (!session) {
            alert('Please sign in first.');
            showLogin();
            return;
          }

          var filesMeta = [];
          for (var i = 0; i < selectedFiles.length; i++) {
            if (uploadBtn) {
              uploadBtn.innerHTML =
                '<i class="fa-solid fa-spinner fa-spin"></i> Uploading ' +
                (i + 1) + '/' + selectedFiles.length + '…';
            }
            filesMeta.push(await uploadFile(projectId, selectedFiles[i]));
          }

          var row = {
            id: projectId,
            title: title,
            category: catValue,
            description: (descEl && descEl.value ? descEl.value.trim() : '') || '',
            files: filesMeta,
            created_at_ms: Date.now(),
            sort_order: Date.now()
          };

          var { error } = await sb.from('projects').insert(row);
          if (error) throw error;

          if (uploadForm) uploadForm.reset();
          selectedFiles = [];
          renderFileList();
          if (customCategoryGroup) customCategoryGroup.hidden = true;
          if (customCategoryInput) customCategoryInput.value = '';
          await loadProjects();
        } catch (err) {
          console.error(err);
          var msg = err.message || 'Upload failed';
          if (/row-level security/i.test(msg) || /RLS/i.test(msg)) {
            msg = 'Permission denied. Check Supabase table/storage policies (SETUP_SUPABASE.txt).';
          }
          if (/Bucket not found/i.test(msg)) {
            msg = 'Storage bucket "projects" not found. Create it in Supabase Storage.';
          }
          alert(msg);
        } finally {
          if (uploadBtn) {
            uploadBtn.disabled = false;
            uploadBtn.innerHTML = '<i class="fa-solid fa-plus"></i> Add Project';
          }
        }
      })();
    });
  }

  function sortProjectsList(list) {
    return (list || []).slice().sort(function (a, b) {
      var ao = a.sort_order != null ? Number(a.sort_order) : Number(a.created_at_ms || 0);
      var bo = b.sort_order != null ? Number(b.sort_order) : Number(b.created_at_ms || 0);
      if (ao !== bo) return ao - bo; // ascending = user order (lower first)
      return Number(b.created_at_ms || 0) - Number(a.created_at_ms || 0);
    });
  }

  async function loadProjects() {
    if (!sb || !projectsList) return;
    try {
      var { data, error } = await sb
        .from('projects')
        .select('*');
      if (error) throw error;
      var projects = sortProjectsList(data || []);

      if (projCount) projCount.textContent = String(projects.length);
      projectsList.querySelectorAll('.project-card-dash').forEach(function (el) { el.remove(); });

      if (!projects.length) {
        if (emptyState) emptyState.hidden = false;
        return;
      }
      if (emptyState) emptyState.hidden = true;

      projects.forEach(function (p, pIndex) {
        var card = document.createElement('div');
        card.className = 'project-card-dash';
        card.dataset.id = p.id;

        var thumbHtml = '<div class="proj-thumb"><i class="fa-solid fa-folder"></i></div>';
        if (p.files && p.files.length) {
          function isImage(f) {
            if (f.type && f.type.indexOf('image/') === 0) return true;
            return f.name && /\.(jpe?g|png|gif|webp|bmp|svg)$/i.test(f.name);
          }
          function isVideo(f) {
            if (f.type && f.type.indexOf('video/') === 0) return true;
            return f.name && /\.(mp4|webm|mov|mkv|avi)$/i.test(f.name);
          }
          var imgFile = null, vidFile = null;
          for (var fi = 0; fi < p.files.length; fi++) {
            if (!imgFile && isImage(p.files[fi]) && p.files[fi].url) imgFile = p.files[fi];
            if (!vidFile && isVideo(p.files[fi]) && p.files[fi].url) vidFile = p.files[fi];
          }
          if (imgFile) {
            thumbHtml = '<div class="proj-thumb"><img src="' + imgFile.url + '" alt="" loading="lazy" /></div>';
          } else if (vidFile) {
            thumbHtml = '<div class="proj-thumb"><video src="' + vidFile.url + '" muted preload="metadata"></video></div>';
          } else {
            var first = p.files[0];
            thumbHtml = '<div class="proj-thumb"><i class="fa-solid ' + fileIcon(first.type, first.name) + '"></i></div>';
          }
        }

        var dateStr = p.created_at_ms
          ? new Date(p.created_at_ms).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
          : '';

        card.innerHTML =
          thumbHtml +
          '<div class="proj-info">' +
          '<h3>' + escapeHtml(p.title) + '</h3>' +
          '<div class="proj-meta"><span class="cat">' + escapeHtml(p.category || 'Other') +
          '</span><span>' + dateStr + '</span></div>' +
          (p.description ? '<p class="proj-desc">' + escapeHtml(p.description) + '</p>' : '') +
          '<p class="proj-files-count">' + (p.files || []).length + ' file(s)</p></div>' +
          '<div class="proj-actions">' +
          '<button type="button" class="move-up" title="Move up" aria-label="Move up"><i class="fa-solid fa-arrow-up"></i></button>' +
          '<button type="button" class="move-down" title="Move down" aria-label="Move down"><i class="fa-solid fa-arrow-down"></i></button>' +
          '<button type="button" class="delete-proj" title="Delete"><i class="fa-solid fa-trash"></i></button></div>';

        (function (project, index, all) {
          var upBtn = card.querySelector('.move-up');
          var downBtn = card.querySelector('.move-down');
          if (index === 0) upBtn.disabled = true;
          if (index === all.length - 1) downBtn.disabled = true;

          upBtn.addEventListener('click', function () {
            if (index <= 0) return;
            reorderProjects(all, index, index - 1);
          });
          downBtn.addEventListener('click', function () {
            if (index >= all.length - 1) return;
            reorderProjects(all, index, index + 1);
          });
          card.querySelector('.delete-proj').addEventListener('click', function () {
            openConfirm('Delete project?', 'Remove "' + project.title + '"? This cannot be undone.').then(function (ok) {
              if (!ok) return;
              deleteProject(project).then(loadProjects);
            });
          });
        })(p, pIndex, projects);

        projectsList.appendChild(card);
      });
    } catch (err) {
      console.error(err);
      alert('Could not load projects: ' + (err.message || ''));
    }
  }

  async function reorderProjects(list, fromIndex, toIndex) {
    if (!sb || fromIndex === toIndex) return;
    var arr = list.slice();
    var item = arr.splice(fromIndex, 1)[0];
    arr.splice(toIndex, 0, item);
    // Assign sequential sort_order so the sequence is stable
    var updates = arr.map(function (p, i) {
      return { id: p.id, sort_order: (i + 1) * 1000 };
    });
    try {
      for (var i = 0; i < updates.length; i++) {
        var u = updates[i];
        var { error } = await sb.from('projects').update({ sort_order: u.sort_order }).eq('id', u.id);
        if (error) {
          // Helpful message if column is missing
          if (/sort_order/i.test(error.message || '') || /column/i.test(error.message || '')) {
            alert('Add a "sort_order" column (bigint) to your projects table in Supabase to enable manual ordering.\n\nSQL:\nALTER TABLE projects ADD COLUMN IF NOT EXISTS sort_order bigint DEFAULT 0;');
          }
          throw error;
        }
      }
      await loadProjects();
    } catch (err) {
      console.error(err);
      if (!/sort_order/i.test(err.message || '')) {
        alert('Could not reorder: ' + (err.message || ''));
      }
    }
  }

  async function deleteProject(p) {
    try {
      if (p.files && p.files.length) {
        var paths = p.files.map(function (f) { return f.path; }).filter(Boolean);
        if (paths.length) {
          await sb.storage.from('projects').remove(paths);
        }
      }
      var { error } = await sb.from('projects').delete().eq('id', p.id);
      if (error) throw error;
    } catch (err) {
      console.error(err);
      alert('Delete failed: ' + (err.message || ''));
    }
  }

  if (clearAllBtn) {
    clearAllBtn.addEventListener('click', function () {
      openConfirm('Delete all projects?', 'Every project will be permanently removed. This cannot be undone.').then(function (ok) {
        if (!ok) return;
        (async function () {
          var { data } = await sb.from('projects').select('*');
          if (data) {
            for (var i = 0; i < data.length; i++) {
              await deleteProject(data[i]);
            }
          }
          await loadProjects();
        })();
      });
    });
  }

  showLogin();

  function initSupabase() {
    var cfg = window.SUPABASE_CONFIG;
    if (!cfg || !cfg.url || cfg.url === 'YOUR_SUPABASE_URL' || !cfg.anonKey || cfg.anonKey === 'YOUR_SUPABASE_ANON_KEY') {
      showLoginError('Supabase not configured — open SETUP_SUPABASE.txt');
      return;
    }
    if (typeof supabase === 'undefined' || !supabase.createClient) {
      showLoginError('Supabase SDK failed to load. Check internet connection.');
      return;
    }
    try {
      sb = supabase.createClient(cfg.url, cfg.anonKey);
      sb.auth.getSession().then(function (res) {
        if (res.data && res.data.session) showDashboard();
        else showLogin();
      });
      sb.auth.onAuthStateChange(function (event, session) {
        if (session) {
          hideLoginError();
          showDashboard();
        } else {
          showLogin();
        }
      });
    } catch (err) {
      console.error(err);
      showLoginError('Supabase init failed: ' + err.message);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSupabase);
  } else {
    setTimeout(initSupabase, 0);
  }
})();
