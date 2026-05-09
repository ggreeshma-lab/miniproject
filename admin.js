let adminToken = localStorage.getItem('adminToken');
let adminEvents = [];
let adminBookings = [];

document.addEventListener('DOMContentLoaded', () => {
    if (adminToken) {
        showDashboard();
    }

    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;

            try {
                const response = await fetch('/api/admin/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });

                if (response.ok) {
                    const data = await response.json();
                    adminToken = data.token;
                    localStorage.setItem('adminToken', adminToken);
                    showDashboard();
                } else {
                    alert('Invalid credentials');
                }
            } catch (err) {
                console.error(err);
                alert('Login failed');
            }
        });
    }

    const eventForm = document.getElementById('event-form');
    if (eventForm) {
        eventForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const editId = document.getElementById('edit-id').value;
            
            const eventData = {
                title: document.getElementById('ev-title').value,
                date: document.getElementById('ev-date').value,
                time: document.getElementById('ev-time').value,
                location: document.getElementById('ev-location').value,
                price: parseFloat(document.getElementById('ev-price').value),
                capacity: parseInt(document.getElementById('ev-capacity').value),
                image: document.getElementById('ev-image').value,
                description: document.getElementById('ev-desc').value
            };

            const url = editId ? `/api/admin/events/${editId}` : '/api/admin/events';
            const method = editId ? 'PUT' : 'POST';

            if (!editId) {
                // Generate a random ID for new events
                eventData.id = Math.floor(Math.random() * 10000);
            }

            try {
                const response = await fetch(url, {
                    method,
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${adminToken}`
                    },
                    body: JSON.stringify(eventData)
                });

                if (response.ok) {
                    hideForm();
                    loadAdminEvents();
                } else {
                    const error = await response.json();
                    alert(`Failed to save event: ${error.error || 'Unknown error'}`);
                }
            } catch (err) {
                console.error(err);
                alert('Failed to save event');
            }
        });
    }
});

function showDashboard() {
    document.getElementById('login-section').classList.add('hidden');
    document.getElementById('dashboard-section').classList.remove('hidden');
    document.getElementById('logout-btn').style.display = 'inline-block';
    loadAdminEvents();
    loadAdminBookings();
}

function logout() {
    localStorage.removeItem('adminToken');
    adminToken = null;
    document.getElementById('dashboard-section').classList.add('hidden');
    document.getElementById('login-section').classList.remove('hidden');
    document.getElementById('logout-btn').style.display = 'none';
}

async function loadAdminEvents() {
    try {
        const response = await fetch('/api/events');
        if (response.ok) {
            adminEvents = await response.json();
            renderAdminEvents();
        } else {
            document.getElementById('admin-events-list').innerHTML = '<tr><td colspan="7" style="text-align:center;">Failed to load events.</td></tr>';
        }
    } catch (err) {
        console.error('Failed to load events', err);
        document.getElementById('admin-events-list').innerHTML = '<tr><td colspan="7" style="text-align:center;">Error connecting to server.</td></tr>';
    }
}

function renderAdminEvents() {
    const tbody = document.getElementById('admin-events-list');
    
    if (adminEvents.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">No events found. Click "Add New Event" to create one.</td></tr>';
        return;
    }

    tbody.innerHTML = adminEvents.map(ev => `
        <tr>
            <td>${ev.id}</td>
            <td>${ev.title}</td>
            <td>${ev.date}</td>
            <td>$${ev.price}</td>
            <td>${ev.capacity}</td>
            <td>${ev.bookedCount}</td>
            <td>
                <button class="btn btn-small" style="background-color: var(--primary); color: white; border: none; cursor: pointer; border-radius: 4px;" onclick="editEvent(${ev.id})">Edit</button>
                <button class="btn btn-small btn-danger" style="border: none; cursor: pointer; border-radius: 4px;" onclick="deleteEvent(${ev.id})">Delete</button>
            </td>
        </tr>
    `).join('');
}

function showAddForm() {
    document.getElementById('event-form-container').classList.remove('hidden');
    document.getElementById('form-title').innerText = 'Add New Event';
    document.getElementById('event-form').reset();
    document.getElementById('edit-id').value = '';
}

function hideForm() {
    document.getElementById('event-form-container').classList.add('hidden');
}

function editEvent(id) {
    const ev = adminEvents.find(e => e.id === id);
    if (!ev) return;

    document.getElementById('event-form-container').classList.remove('hidden');
    document.getElementById('form-title').innerText = 'Edit Event';
    
    document.getElementById('edit-id').value = ev.id;
    document.getElementById('ev-title').value = ev.title;
    document.getElementById('ev-date').value = ev.date;
    document.getElementById('ev-time').value = ev.time;
    document.getElementById('ev-location').value = ev.location;
    document.getElementById('ev-price').value = ev.price;
    document.getElementById('ev-capacity').value = ev.capacity || 50;
    document.getElementById('ev-image').value = ev.image;
    document.getElementById('ev-desc').value = ev.description;
    
    // Scroll to form
    document.getElementById('event-form-container').scrollIntoView({ behavior: 'smooth' });
}

async function deleteEvent(id) {
    if (!confirm('Are you sure you want to delete this event?')) return;

    try {
        const response = await fetch(`/api/admin/events/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${adminToken}`
            }
        });

        if (response.ok) {
            loadAdminEvents();
        } else {
            alert('Failed to delete event');
        }
    } catch (err) {
        console.error(err);
        alert('Failed to delete event');
    }
}

function switchTab(tab) {
    if (tab === 'events') {
        document.getElementById('events-table-container').classList.remove('hidden');
        document.getElementById('bookings-table-container').classList.add('hidden');
        document.getElementById('add-event-btn').classList.remove('hidden');
        document.getElementById('tab-events').style.backgroundColor = 'var(--primary)';
        document.getElementById('tab-bookings').style.backgroundColor = 'var(--secondary)';
    } else {
        document.getElementById('events-table-container').classList.add('hidden');
        document.getElementById('bookings-table-container').classList.remove('hidden');
        document.getElementById('event-form-container').classList.add('hidden');
        document.getElementById('add-event-btn').classList.add('hidden');
        document.getElementById('tab-events').style.backgroundColor = 'var(--secondary)';
        document.getElementById('tab-bookings').style.backgroundColor = 'var(--primary)';
    }
}

async function loadAdminBookings() {
    try {
        const response = await fetch('/api/admin/bookings', {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        if (response.ok) {
            adminBookings = await response.json();
            renderAdminBookings();
        } else {
            document.getElementById('admin-bookings-list').innerHTML = '<tr><td colspan="7" style="text-align:center;">Failed to load bookings.</td></tr>';
        }
    } catch (err) {
        console.error('Failed to load bookings', err);
        document.getElementById('admin-bookings-list').innerHTML = '<tr><td colspan="7" style="text-align:center;">Error connecting to server.</td></tr>';
    }
}

function renderAdminBookings() {
    const tbody = document.getElementById('admin-bookings-list');
    
    if (adminBookings.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">No bookings found.</td></tr>';
        return;
    }

    tbody.innerHTML = adminBookings.map(b => `
        <tr>
            <td>${b.receiptId}</td>
            <td>${b.name}</td>
            <td>${b.email}</td>
            <td>${b.eventTitle}</td>
            <td>${b.eventDate}</td>
            <td>$${b.amountDue || 0}</td>
            <td>
                <button class="btn btn-small btn-danger" style="border: none; cursor: pointer; border-radius: 4px;" onclick="deleteBooking('${b.receiptId}')">Delete</button>
            </td>
        </tr>
    `).join('');
}

async function deleteBooking(receiptId) {
    if (!confirm('Are you sure you want to delete this booking? The event capacity will be updated.')) return;

    try {
        const response = await fetch(`/api/admin/bookings/${receiptId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });

        if (response.ok) {
            loadAdminBookings();
            loadAdminEvents(); // Refresh event capacities
        } else {
            alert('Failed to delete booking');
        }
    } catch (err) {
        console.error(err);
        alert('Failed to delete booking');
    }
}
