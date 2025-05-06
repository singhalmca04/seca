
// Campus location configuration

const campusConfig = {
    // Default coordinates (replace with your actual campus coordinates)
    lat: 28.79781315704049, // Campus latitude
    lon: 77.54159751397992, // Campus longitude
    radius: 0.5    // 0.5 km radius
};


// Function to update campus location settings
function setCampusLocation(lat, lon, radius) {
    campusConfig.lat = lat;
    campusConfig.lon = lon;
    if (radius) campusConfig.radius = radius;
}

// Function to get CSRF token
function getCSRFToken() {
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'csrftoken') {
            return value;
        }
    }
    return '';
}

// Function to check location with backend
async function checkLocationWithBackend(locationData) {
    try {
        const response = await fetch('/check-location/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCSRFToken(),
            },
            body: JSON.stringify({
                latitude: locationData.latitude,
                longitude: locationData.longitude
            })
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error checking location:', error);
        throw error;
    }
}

// Function to get location
function getLocation() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            console.log('Geolocation not supported');
            reject(new Error('Geolocation is not supported by this browser'));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    location: `${position.coords.latitude}, ${position.coords.longitude}`
                });
            },
            (error) => {
                console.error('Geolocation error:', error);

                // Reject the promise when permission is denied
                if (error.code === 1) { // PERMISSION_DENIED
                    reject(new Error('Location permission denied. You must allow location access to submit attendance.'));
                } else if (error.code === 2) { // POSITION_UNAVAILABLE
                    reject(new Error('Location information is unavailable. Please try again.'));
                } else if (error.code === 3) { // TIMEOUT
                    reject(new Error('Location request timed out. Please try again.'));
                } else {
                    reject(new Error('An unknown error occurred while getting location.'));
                }
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    });
}

// JavaScript for handling the attendance submission with location
document.addEventListener('DOMContentLoaded', function () {
    // Function to handle attendance submission
    async function handleAttendance(event) {
        event.preventDefault();

        // Determine which button was clicked
        const button = event.target;
        const form = button.closest('form');
        const formType = form.getAttribute('data-type');
        const actionText = formType === 'clock_in' ? 'Clock In' : 'Clock Out';

        try {
            // Get location data
            const locationData = await getLocation();

            // Ensure location data is present
            if (!locationData || !locationData.latitude || !locationData.longitude) {
                throw new Error('Location data is missing. Location access is required to submit attendance.');
            }

            // Check location with backend
            const locationCheck = await checkLocationWithBackend(locationData);

            // Set form values
            form.querySelector('input[name="latitude"]').value = locationData.latitude;
            form.querySelector('input[name="longitude"]').value = locationData.longitude;
            form.querySelector('input[name="location"]').value = locationData.location;

            if (!locationCheck.is_within_radius) {
                // Show warning for out of campus location
                const result = await Swal.fire({
                    title: `Out of ${locationCheck.campus_name} Campus Warning`,
                    html: `
                                <div class="text-left">
                                    <p class="mb-3">Your current location appears to be <strong>${locationCheck.distance} km</strong> away from campus.</p>
                                    <p class="mb-3">Campus radius is set to <strong>${locationCheck.campus_radius} km</strong>.</p>
                                    <p class="mb-3 text-red-600 font-semibold">Attendance from outside the ${locationCheck.campus_name} campus area may be flagged for review by administrators.</p>
                                    <p>Do you still want to proceed?</p>
                                </div>
                            `,
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonText: `Continue with ${actionText}`,
                    cancelButtonText: 'Cancel',
                    confirmButtonColor: '#f97316',
                    cancelButtonColor: '#718096',
                    customClass: {
                        htmlContainer: 'swal-wide',
                        title: 'text-xl font-bold text-red-600'
                    }
                });

                if (result.isConfirmed) {
                    // Proceed with confirmation
                    showConfirmationDialog(form, formType, actionText);
                }
            } else {
                // Location is within campus, proceed directly to confirmation
                showConfirmationDialog(form, formType, actionText);
            }
        } catch (error) {
            console.error('Error:', error);
            // Show error message
            Swal.fire({
                title: 'Location Required',
                text: error.message || 'Error capturing location. Location access is required to submit attendance.',
                icon: 'error',
                confirmButtonColor: '#9061F9'
            });
        }
    }

    // Function to show the confirmation dialog
    async function showConfirmationDialog(form, formType, actionText) {
        let confirmText = `Your location has been captured. Are you sure you want to ${actionText.toLowerCase()}?`;

        // Add device restriction message for clock out
        if (formType === 'clock_out') {
            confirmText += ' Note: You must use the same device you used to clock in.';
        }

        const result = await Swal.fire({
            title: `Confirm ${actionText}?`,
            text: confirmText,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: formType === 'clock_in' ? '#9061F9' : '#E02424',
            cancelButtonColor: '#718096',
            confirmButtonText: `Yes, ${actionText}`
        });

        if (result.isConfirmed) {
            try {
                // Submit the form using fetch
                const formData = new FormData(form);
                const response = await fetch(form.action, {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest',
                        'X-CSRFToken': getCSRFToken()
                    }
                });

                if (response.ok) {
                    window.location.reload();
                } else {
                    const errorText = await response.text();
                    console.error('Server error:', errorText);
                    Swal.fire({
                        title: 'Error',
                        text: 'Server error occurred. Please try again.',
                        icon: 'error',
                        confirmButtonText: 'OK'
                    });
                }
            } catch (error) {
                console.error('Error submitting form:', error);
                Swal.fire({
                    title: 'Error',
                    text: 'Failed to submit attendance. Please try again.',
                    icon: 'error',
                    confirmButtonText: 'OK'
                });
            }
        }
    }

    // Add event listeners to buttons
    const clockInBtn = document.getElementById('clockInBtn');
    const clockOutBtn = document.getElementById('clockOutBtn');

    if (clockInBtn) {
        clockInBtn.addEventListener('click', handleAttendance);
    }

    if (clockOutBtn) {
        clockOutBtn.addEventListener('click', handleAttendance);
    }
});
