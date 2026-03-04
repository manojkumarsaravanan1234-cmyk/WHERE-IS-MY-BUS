import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authAPI from '../services/auth';

const Login = () => {
    const navigate = useNavigate();
    const [isLogin, setIsLogin] = useState(true);
    const [role, setRole] = useState('user'); // 'user' | 'driver' | 'admin'
    const [formData, setFormData] = useState({ name: '', email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (isLogin) {
                const response = await authAPI.login(formData.email, formData.password);
                if (response.user.role === 'admin') navigate('/admin');
                else if (response.user.role === 'driver') navigate('/driver');
                else navigate('/');
            } else {
                await authAPI.signup({ ...formData, role });
                setIsLogin(true);
                setError('Registration successful! Please login.');
                // Clear password for security
                setFormData({ ...formData, password: '' });
            }
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || 'Authentication failed');
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
                        <h1 className="text-4xl font-black text-white mb-2 tracking-tighter uppercase italic">
                            {isLogin ? 'Secure Access' : 'Create Identity'}
                        </h1>
                        <p className="text-slate-400 font-medium">Connect to the tracking grid.</p>
                    </div>

                    {/* Role Selector (Only for Signup) */}
                    {!isLogin && (
                        <div className="flex bg-slate-900/50 p-1 rounded-2xl mb-10 border border-white/5">
                            {['user', 'driver'].map((r) => (
                                <button
                                    key={r}
                                    type="button"
                                    onClick={() => setRole(r)}
                                    className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${role === r ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20' : 'text-slate-500 hover:text-slate-300'}`}
                                >
                                    {r}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className={`p-4 rounded-xl text-sm font-bold flex items-center gap-3 ${error.includes('successful') ? 'bg-emerald-500/10 text-emerald-400' : 'alert-glass text-rose-300'}`}>
                                <span className="text-lg">{error.includes('successful') ? '✅' : '⚠️'}</span> {error}
                            </div>
                        )}

                        <div className="space-y-5">
                            {!isLogin && (
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-1 block">Display Name</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        placeholder="Major Tom"
                                        className="glass-input w-full py-4 px-5 text-sm"
                                        required
                                    />
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-1 block">Email Address</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="operator@nexus.com"
                                    className="glass-input w-full py-4 px-5 text-sm"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-1 block">Passcode</label>
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
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
                            className={`glass-button w-full py-5 text-sm font-black uppercase tracking-widest mt-10 shadow-2xl from-indigo-500 to-blue-600 shadow-indigo-500/20`}
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                isLogin ? 'Authorize Entry' : `Initialize ${role}`
                            )}
                        </button>
                    </form>

                    <div className="mt-12 text-center">
                        <button
                            type="button"
                            onClick={() => setIsLogin(!isLogin)}
                            className="text-slate-500 text-xs font-bold uppercase tracking-widest"
                        >
                            {isLogin ? "New tracker? " : "Already registered? "}
                            <span className="text-white hover:text-indigo-400 transition-colors uppercase">
                                {isLogin ? "Apply for Access" : "Secure Entry"}
                            </span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
