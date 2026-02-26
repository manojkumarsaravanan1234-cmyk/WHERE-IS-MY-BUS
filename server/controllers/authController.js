/**
 * @desc    Authenticate admin
 * @route   POST /api/auth/login
 * @access  Public
 */
exports.loginAdmin = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check against environment variables for simplicity & security
        const adminEmail = process.env.ADMIN_EMAIL || 'universeboss333@gmail.com';
        const adminPassword = process.env.ADMIN_PASSWORD || 'universeboss6374';

        if (email === adminEmail && password === adminPassword) {
            // In a real app, generate a JWT token here
            // For now, return a simple success flag and user data
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
