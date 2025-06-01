document.getElementById('loginForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();

    const loginBtn = document.querySelector('.login-btn');
    const spinner = document.getElementById('loadingSpinner');

    // Clear previous error messages
    document.getElementById('name-error').style.display = 'none';
    document.getElementById('email-error').style.display = 'none';
    document.getElementById('password-error').style.display = 'none';

    // Show spinner and disable login button
    spinner.style.display = 'inline-block';  // or 'block' depending on your styling
    loginBtn.disabled = true;

    try {
        // Step 1: Get tokens
        const response = await fetch('http://127.0.0.1:8000/api/token/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, password, email })
        });

        if (!response.ok) {
            throw new Error('Invalid credentials');
        }

        const data = await response.json();
        const accessToken = data.access;
        const refreshToken = data.refresh;

        // Save tokens
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);

        // Step 2: Fetch current user info
        const userResponse = await fetch('http://127.0.0.1:8000/api/users/me/', {
            headers: {
                'Authorization': 'Bearer ' + accessToken
            }
        });

        if (!userResponse.ok) {
            throw new Error('Failed to fetch user info');
        }

        const user = await userResponse.json();
        const role = user.role;

        // Step 3: Redirect based on role
        if (role === 'employee') {
            window.location.href = 'employee.html';
        } else if (role === 'department_head') {
            window.location.href = 'department.html';
        } else if (role === 'security_head') {
            window.location.href = 'security.html';
        } else {
            alert("Unknown role: access denied");
        }

    } catch (error) {
        console.error('Login error:', error);
        document.getElementById('name-error').style.display = 'block';
        document.getElementById('email-error').style.display = 'block';
        document.getElementById('password-error').style.display = 'block';
    } finally {
        // Hide spinner and enable login button (run no matter success or failure)
        spinner.style.display = 'none';
        loginBtn.disabled = false;
    }
});


