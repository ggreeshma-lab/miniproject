// Global events array to store fetched data
let events = [];

// Utilities
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
};

// Page Logic
document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;

    if (path.includes('events.html')) {
        fetchEvents();
    } else if (path.includes('register.html')) {
        setupRegistration();
    } else if (path.includes('receipt.html')) {
        renderReceipt();
    }
});

// Fetch Events from Backend (MongoDB)
async function fetchEvents() {
    try {
        const response = await fetch('/api/events');
        if (!response.ok) throw new Error('Failed to fetch events');
        events = await response.json();
        renderEvents();
    } catch (error) {
        console.error('Error loading events:', error);
        document.getElementById('events-grid').innerHTML = '<p style="text-align:center; color: var(--secondary);">Failed to load events. Please try again later.</p>';
    }
}

// Render Events
function renderEvents() {
    const grid = document.getElementById('events-grid');
    if (!grid) return;

    if (events.length === 0) {
        grid.innerHTML = '<p style="text-align:center;">No events found.</p>';
        return;
    }

    grid.innerHTML = events.map(event => `
        <div class="card">
            <div class="card-image">
                <img src="${event.image}" alt="${event.title}">
            </div>
            <div class="card-content">
                <h3 class="card-title">${event.title}</h3>
                <div class="card-date">
                    <span>📅 ${event.date}</span>
                    <span>⏰ ${event.time}</span>
                </div>
                <p class="card-desc">${event.description}</p>
                <div style="margin-top: auto; display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 1.25rem; font-weight: 700; color: var(--primary);">${formatCurrency(event.price)}</span>
                    ${event.bookedCount >= event.capacity ? 
                        '<button class="btn" style="background-color: var(--secondary); cursor: not-allowed;" disabled>Sold Out</button>' : 
                        `<button onclick="selectEvent(${event.id})" class="btn btn-primary">Select Event</button>`
                    }
                </div>
            </div>
        </div>
    `).join('');
}

function selectEvent(eventId) {
    const event = events.find(e => e.id === eventId);
    if (!event) return;

    // Store selection and redirect
    localStorage.setItem('selectedEvent', JSON.stringify(event));
    window.location.href = 'register.html';
}

// Registration Page
function setupRegistration() {
    const eventData = JSON.parse(localStorage.getItem('selectedEvent'));
    if (!eventData) {
        window.location.href = 'events.html';
        return;
    }

    document.getElementById('selected-event-title').innerText = `Registering for: ${eventData.title}`;

    const form = document.getElementById('registration-form');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const btn = form.querySelector('button[type="submit"]');
        btn.innerText = "Sending OTP...";
        btn.disabled = true;

        try {
            const response = await fetch('/api/otp/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to send OTP');
            }

            // Show OTP Modal
            document.getElementById('otp-modal').classList.remove('hidden');
        } catch (error) {
            console.error(error);
            alert(`Error: ${error.message}`);
        } finally {
            btn.innerText = "Register & Get Receipt";
            btn.disabled = false;
        }
    });

    const otpForm = document.getElementById('otp-form');
    if (otpForm) {
        otpForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const otpInput = document.getElementById('otp-input').value;
            
            const btn = document.querySelector('#otp-form button[type="submit"]');
            btn.innerText = "Processing...";
            btn.disabled = true;

            const formData = {
                name: document.getElementById('name').value,
                email: document.getElementById('email').value,
                phone: document.getElementById('phone').value,
                event: eventData
            };

            const receiptId = 'RCPT-' + Math.random().toString(36).substr(2, 9).toUpperCase();

            const bookingData = {
                receiptId: receiptId,
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                eventId: formData.event.id,
                eventTitle: formData.event.title,
                eventDate: formData.event.date,
                amountDue: formData.event.price,
                otp: otpInput
            };

            try {
                const response = await fetch('/api/bookings', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(bookingData)
                });

                if (response.ok) {
                    window.location.href = `receipt.html?id=${receiptId}`;
                } else {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Server failed to save booking');
                }
            } catch (error) {
                console.error(error);
                alert(`Registration failed: ${error.message}`);
                btn.innerText = "Verify & Complete";
                btn.disabled = false;
            }
        });
    }
}

window.closeOtpModal = function() {
    document.getElementById('otp-modal').classList.add('hidden');
    document.getElementById('otp-form').reset();
    const btn = document.querySelector('#registration-form button[type="submit"]');
    btn.innerText = "Register & Get Receipt";
    btn.disabled = false;
};

// Receipt Page
async function renderReceipt() {
    const urlParams = new URLSearchParams(window.location.search);
    const receiptId = urlParams.get('id');

    if (!receiptId) {
        window.location.href = 'events.html';
        return;
    }

    try {
        const response = await fetch(`/api/bookings/${receiptId}`);
        if (!response.ok) throw new Error('Receipt not found');
        const data = await response.json();

        document.getElementById('receipt-id').innerText = data.receiptId;
        document.getElementById('participant-name').innerText = data.name;
        document.getElementById('event-name').innerText = data.eventTitle;
        document.getElementById('event-date').innerText = data.eventDate;
        document.getElementById('total-due').innerText = formatCurrency(data.amountDue);

        // Generate QR Code
        const qrContainer = document.getElementById("qrcode");
        if (qrContainer) {
            qrContainer.innerHTML = ""; // Clear previous if any
            if (typeof QRCode !== 'undefined') {
                new QRCode(qrContainer, {
                    text: data.receiptId,
                    width: 128,
                    height: 128,
                    colorDark: "#000000",
                    colorLight: "#ffffff",
                    correctLevel: QRCode.CorrectLevel.H
                });
            }
        }
    } catch (error) {
        console.error(error);
        alert("Could not load receipt.");
        window.location.href = 'events.html';
    }
}
