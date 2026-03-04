const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { supabase } = require('../config/database');

/**
 * @desc    Login for all roles
 * @route   POST /api/auth/login
 * @access  Public
 */
exports.login = async (req, res) => {
    try {
        let { email, password } = req.body;
        email = email ? email.trim() : '';
        password = password ? password.trim() : '';

        // 1. Check Hardcoded Admin Credentials (from .env)
        const adminEmail = (process.env.ADMIN_EMAIL || 'universeboss333@gmail.com').trim();
        const adminPassword = (process.env.ADMIN_PASSWORD || 'universeboss6374').trim();

        if (email.toLowerCase() === adminEmail.toLowerCase() && password === adminPassword) {
            const token = jwt.sign(
                { email: adminEmail, role: 'admin' },
                process.env.JWT_SECRET || 'secret',
                { expiresIn: '24h' }
            );

            return res.status(200).json({
                success: true,
                message: 'Admin Login Successful',
                token,
                user: { name: 'Admin', email: adminEmail, role: 'admin' }
            });
        }

        // 2. Check Supabase 'users' table (for Users and Drivers)
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        if (error) {
            if (error.code === 'PGRST116') { // Not found
                return res.status(401).json({ success: false, message: 'Invalid credentials' });
            }
            if (error.code === '42P01' || error.message.includes('not found')) {
                return res.status(500).json({ success: false, message: 'Database Setup Error: "users" table is missing in Supabase.' });
            }
            throw error;
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '24h' }
        );

        res.status(200).json({
            success: true,
            token,
            user: { id: user.id, name: user.name, email: user.email, role: user.role }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Server error during login' });
    }
};

/**
 * @desc    Register a new user or driver
 * @route   POST /api/auth/signup
 * @access  Public
 */
exports.signup = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const { data, error } = await supabase
            .from('users')
            .insert([{ name, email, password: hashedPassword, role: role || 'user' }])
            .select()
            .single();

        if (error) {
            if (error.code === '23505') return res.status(400).json({ success: false, message: 'Email already exists' });
            if (error.code === '42P01' || error.message.includes('not found')) {
                return res.status(500).json({ success: false, message: 'Database Setup Error: "users" table is missing. Please create it in Supabase dashboard.' });
            }
            throw error;
        }

        const token = jwt.sign(
            { id: data.id, role: data.role },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '24h' }
        );

        res.status(201).json({
            success: true,
            token,
            user: { id: data.id, name: data.name, email: data.email, role: data.role }
        });

    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ success: false, message: 'Server error during registration' });
    }
};
