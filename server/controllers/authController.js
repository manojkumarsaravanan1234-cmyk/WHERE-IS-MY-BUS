/**
 * @desc    Authenticate admin
 * @route   POST /api/auth/login
 * @access  Public
 */
exports.loginAdmin = async (req, res) => {
    try {
        let { email, password } = req.body;

        // Trim inputs to avoid accidental spaces
        email = email ? email.trim() : '';
        password = password ? password.trim() : '';

        // Check against environment variables
        const adminEmail = (process.env.ADMIN_EMAIL || 'universeboss333@gmail.com').trim();
        const adminPassword = (process.env.ADMIN_PASSWORD || 'universeboss6374').trim();

        console.log(`🔐 Login attempt for: ${email}`);

        if (email.toLowerCase() === adminEmail.toLowerCase() && password === adminPassword) {
            console.log('✅ Login successful');
            res.status(200).json({
                success: true,
                message: 'Login successful',
                user: {
                    name: 'Admin User',
                    email: adminEmail,
                    role: 'admin'
                }
            });
        } else {
            console.log('❌ Login failed: Invalid credentials');
            res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during login'
        });
    }
};
