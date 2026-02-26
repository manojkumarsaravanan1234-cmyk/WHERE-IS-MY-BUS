import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authAPI from '../services/auth';

const Login = () => {
    const navigate = useNavigate();
    const [role, setRole] = useState('user'); // 'user' | 'driver' | 'admin'
    const [credentials, setCredentials] = useState({ email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setCredentials({ ...credentials, [e.target.name]: e.target.value });
        setError('');
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await authAPI.login(credentials.email, credentials.password);

            if (role === 'admin') navigate('/admin');
            else if (role === 'driver') navigate('/driver');
            else navigate('/');

        } catch (err) {
            console.error(err);
            if (role === 'user') {
                navigate('/');
            } else {
                setError('Invalid credentials');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-slate-950 relative overflow-hidden font-sans">
            {/* Background Orbs */}
            <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-indigo-600/10 rounded-full blur-[120px] animate-pulse-slow"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-purple-600/10 rounded-full blur-[120px] animate-pulse-slow delay-1000"></div>

            <div className="w-full max-w-lg z-10 animate-in fade-in zoom-in-95 duration-500">
                <div className="glass-panel p-10 md:p-12 shadow-2xl relative overflow-hidden border-white/5">

                    {/* Brand */}
                    <div className="text-center mb-10">
                        <div className="w-16 h-16 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-500/40 mx-auto mb-6">
                            <span className="text-3xl font-black text-white">B</span>
                        </div>
                        <h1 className="text-4xl font-black text-white mb-2 tracking-tighter uppercase italic">Secure Access</h1>
                        <p className="text-slate-400 font-medium">Connect to the tracking grid.</p>
                    </div>

                    {/* Role Selector */}
                    <div className="flex bg-slate-900/50 p-1 rounded-2xl mb-10 border border-white/5">
                        {['user', 'driver', 'admin'].map((r) => (
                            <button
                                key={r}
                                onClick={() => setRole(r)}
                                className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${role === r ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                                {r}
                            </button>
                        ))}
                    </div>

                    {/* Form */}
                    <form onSubmit={handleLogin} className="space-y-6">
                        {error && (
                            <div className="alert-glass text-rose-300 p-4 rounded-xl text-sm font-bold flex items-center gap-3">
                                <span className="text-lg">⚠️</span> {error}
                            </div>
                        )}

                        <div className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-1 block">
                                    {role === 'user' ? 'Identity' : 'Portal ID'}
                                </label>
                                <input
                                    type={role === 'user' ? "text" : "email"}
                                    name="email"
                                    value={credentials.email}
                                    onChange={handleChange}
                                    placeholder={role === 'user' ? "Enter username" : "admin@nexus.com"}
                                    className="glass-input w-full py-4 px-5 text-sm"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-1 block">Passcode</label>
                                <input
                                    type="password"
                                    name="password"
                                    value={credentials.password}
                                    onChange={handleChange}
                                    placeholder="••••••••"
                                    className="glass-input w-full py-4 px-5 text-sm"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`glass-button w-full py-5 text-sm font-black uppercase tracking-widest mt-10 shadow-2xl 
                                ${role === 'admin' ? 'from-rose-500 to-purple-600 shadow-rose-500/20' :
                                    role === 'driver' ? 'from-emerald-500 to-teal-600 shadow-emerald-500/20' :
                                        'from-indigo-500 to-blue-600 shadow-indigo-500/20'}`}
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                `Authorize ${role}`
                            )}
                        </button>
                    </form>

                    <div className="mt-12 text-center">
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">
                            New tracker? <span className="text-white hover:text-indigo-400 cursor-pointer transition-colors">Apply for access</span>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
