const API_BASE = '/api';
let currentPassword = '';

// Show status messages
function showStatus(message, isError = false) {
    const status = document.getElementById('status');
    status.className = `mt-4 p-3 rounded-md ${isError ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`;
    status.textContent = message;
    status.classList.remove('hidden');
    
    setTimeout(() => {
        status.classList.add('hidden');
    }, 5000);
}

// Upload functionality
if (document.getElementById('uploadForm')) {
    document.getElementById('uploadForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const password = document.getElementById('password').value;
        const fileInput = document.getElementById('fileInput');
        const file = fileInput.files[0];
        
        if (!file) {
            showStatus('Please select a file', true);
            return;
        }
        
        const formData = new FormData();
        formData.append('file', file);
        formData.append('password', password);
        
        try {
            const response = await fetch(`${API_BASE}/upload`, {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            if (response.ok) {
                showStatus(`File "${file.name}" uploaded successfully!`);
                fileInput.value = '';
                document.getElementById('password').value = '';
            } else {
                showStatus(result.error || 'Upload failed', true);
            }
        } catch (error) {
            showStatus('Network error during upload', true);
        }
    });
}

// File management functionality
if (document.getElementById('authBtn')) {
    document.getElementById('authBtn').addEventListener('click', authenticateAndLoadFiles);
    document.getElementById('refreshBtn').addEventListener('click', loadFiles);
}

async function authenticateAndLoadFiles() {
    const password = document.getElementById('authPassword').value;
    
    if (!password) {
        showStatus('Please enter password', true);
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/auth/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password })
        });
        
        if (response.ok) {
            currentPassword = password;
            document.getElementById('authSection').classList.add('hidden');
            document.getElementById('filesSection').classList.remove('hidden');
            loadFiles();
        } else {
            showStatus('Invalid password', true);
        }
    } catch (error) {
        showStatus('Authentication failed', true);
    }
}

async function loadFiles() {
    try {
        const response = await fetch(`${API_BASE}/files/list`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: currentPassword })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            displayFiles(result.files);
        } else {
            showStatus('Failed to load files', true);
        }
    } catch (error) {
        showStatus('Network error loading files', true);
    }
}

function displayFiles(files) {
    const filesList = document.getElementById('filesList');
    
    if (files.length === 0) {
        filesList.innerHTML = '<p class="text-gray-500 text-center">No files uploaded yet</p>';
        return;
    }
    
    filesList.innerHTML = files.map(file => `
        <div class="flex items-center justify-between p-3 border border-gray-200 rounded-md">
            <div class="flex-1">
                <div class="font-medium">${file.filename}</div>
                <div class="text-sm text-gray-500">
                    ${formatFileSize(file.size)} • ${formatDate(file.uploadedAt)}
                </div>
            </div>
            <div class="flex space-x-2">
                <button 
                    class="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 download-btn"
                    data-file-id="${file._id}"
                    data-filename="${file.filename}"
                >
                    Download
                </button>
                <button 
                    class="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 delete-btn"
                    data-file-id="${file._id}"
                    data-filename="${file.filename}"
                >
                    Delete
                </button>
            </div>
        </div>
    `).join('');

    // Add event listeners for download and delete buttons
    document.querySelectorAll('.download-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            downloadFile(this.getAttribute('data-file-id'), this.getAttribute('data-filename'));
        });
    });
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            deleteFile(this.getAttribute('data-file-id'), this.getAttribute('data-filename'));
        });
    });
}

async function downloadFile(fileId, filename) {
    try {
        const response = await fetch(`${API_BASE}/files/download/${fileId}?password=${encodeURIComponent(currentPassword)}`);
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            showStatus(`Downloaded "${filename}"`);
        } else {
            showStatus('Download failed', true);
        }
    } catch (error) {
        showStatus('Network error during download', true);
    }
}

async function deleteFile(fileId, filename) {
    if (!confirm(`Are you sure you want to delete "${filename}"?`)) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/delete/${fileId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: currentPassword })
        });
        
        if (response.ok) {
            showStatus(`Deleted "${filename}"`);
            loadFiles(); // Refresh the list
        } else {
            showStatus('Delete failed', true);
        }
    } catch (error) {
        showStatus('Network error during delete', true);
    }
}

// Utility functions
function formatFileSize(bytes) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString() + ' ' + 
           new Date(dateString).toLocaleTimeString();
}
