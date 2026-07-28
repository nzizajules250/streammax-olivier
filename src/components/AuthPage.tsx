import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, Lock, User as UserIcon, Shield, Film, Key, Eye, EyeOff, 
  ArrowRight, Sparkles, Fingerprint, Check, X, AlertCircle,
  Github, Twitter, Chrome, Zap, Crown, Star, Clock, Gift,
  ChevronRight, BadgeCheck, CreditCard, Users, TrendingUp
} from 'lucide-react';
import { User } from '../types';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';

interface AuthPageProps {
  onLoginSuccess: (user: User) => void;
  addToast: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

// Password strength checker
const checkPasswordStrength = (password: string): { score: number; label: string; color: string } => {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.match(/[A-Z]/)) score++;
  if (password.match(/[0-9]/)) score++;
  if (password.match(/[^A-Za-z0-9]/)) score++;
  
  const strengths = [
    { score: 0, label: 'Very Weak', color: 'bg-red-500' },
    { score: 1, label: 'Weak', color: 'bg-orange-500' },
    { score: 2, label: 'Fair', color: 'bg-yellow-500' },
    { score: 3, label: 'Good', color: 'bg-blue-500' },
    { score: 4, label: 'Strong', color: 'bg-green-500' },
  ];
  
  return strengths[score] || strengths[4];
};

// Animated background particles
const FloatingParticles = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-amber-400/20 rounded-full"
          initial={{
            x: Math.random() * 100 + '%',
            y: Math.random() * 100 + '%',
            scale: 0,
          }}
          animate={{
            y: [null, '-100%'],
            scale: [0, 1, 0],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: Math.random() * 3 + 2,
            repeat: Infinity,
            delay: Math.random() * 2,
          }}
        />
      ))}
    </div>
  );
};

// Trust badges component
const TrustBadges = () => (
  <div className="flex items-center justify-center gap-6 mt-8">
    {[
      { icon: Shield, text: '256-bit SSL' },
      { icon: BadgeCheck, text: 'Verified Platform' },
      { icon: CreditCard, text: 'Secure Payments' },
    ].map(({ icon: Icon, text }) => (
      <div key={text} className="flex items-center gap-2 text-xs text-gray-500">
        <Icon className="w-3.5 h-3.5 text-green-400" />
        <span>{text}</span>
      </div>
    ))}
  </div>
);

export default function AuthPage({ onLoginSuccess, addToast }: AuthPageProps) {
  // Form state
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [registerAsAdmin, setRegisterAsAdmin] = useState(false);
  const [secretCode, setSecretCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  
  // Animation states
  const [formStep, setFormStep] = useState(0);
  const [shakeError, setShakeError] = useState(false);
  
  // Refs
  const emailInputRef = useRef<HTMLInputElement>(null);
  
  // Focus email on mount
  useEffect(() => {
    emailInputRef.current?.focus();
  }, [isLogin]);

  // Password strength
  const passwordStrength = checkPasswordStrength(password);

  // Handle password reset
  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) {
      addToast('Please enter your email address', 'error');
      return;
    }
    
    setIsLoading(true);
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      addToast('Password reset link sent to your email!', 'success');
      setShowResetPassword(false);
      setResetEmail('');
    } catch (error: any) {
      addToast(error.message || 'Failed to send reset email', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Main form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password || (!isLogin && !username)) {
      addToast('Please fill out all required fields.', 'error');
      setShakeError(true);
      setTimeout(() => setShakeError(false), 500);
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      addToast('Please enter a valid email address', 'error');
      setShakeError(true);
      setTimeout(() => setShakeError(false), 500);
      return;
    }

    setIsLoading(true);

    if (isLogin) {
      // LOGIN
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const uid = userCredential.user.uid;
        
        // Remember me functionality
        if (rememberMe) {
          localStorage.setItem('rememberedEmail', email);
        } else {
          localStorage.removeItem('rememberedEmail');
        }
        
        // Fetch user profile
        let userDoc;
        try {
          userDoc = await getDoc(doc(db, 'users', uid));
        } catch (err) {
          handleFirestoreError(err, OperationType.GET, `users/${uid}`);
        }

        if (userDoc && userDoc.exists()) {
          const userData = userDoc.data() as User;
          addToast(`Welcome back, ${userData.username}! 🎬`, 'success');
          onLoginSuccess(userData);
        } else {
          // Create fallback profile
          const isEmailAdmin = email.toLowerCase() === 'admin@movie.com';
          const fallbackUser: User = {
            id: uid,
            email: email,
            username: email.split('@')[0],
            role: isEmailAdmin ? 'admin' : 'user',
            subscription: isEmailAdmin 
              ? { active: true, planId: 'premium', expiresAt: '2026-12-31T00:00:00Z' } 
              : { active: false },
            watchlist: [],
            history: [],
            createdAt: new Date().toISOString()
          };
          
          try {
            await setDoc(doc(db, 'users', uid), fallbackUser);
          } catch (err) {
            handleFirestoreError(err, OperationType.WRITE, `users/${uid}`);
          }
          
          addToast(`Welcome, ${fallbackUser.username}!`, 'success');
          onLoginSuccess(fallbackUser);
        }
      } catch (error: any) {
        console.error('Login error:', error);
        const errorMessage = error.code === 'auth/user-not-found' 
          ? 'No account found with this email'
          : error.code === 'auth/wrong-password'
          ? 'Incorrect password'
          : error.code === 'auth/too-many-requests'
          ? 'Too many attempts. Please try again later'
          : error.message || 'Login failed';
          
        addToast(errorMessage, 'error');
        setShakeError(true);
        setTimeout(() => setShakeError(false), 500);
      } finally {
        setIsLoading(false);
      }
    } else {
      // REGISTER
      if (registerAsAdmin && secretCode !== 'CINEMA2026') {
        addToast('Invalid Admin Secret Code! 🔑', 'error');
        setShakeError(true);
        setTimeout(() => setShakeError(false), 500);
        setIsLoading(false);
        return;
      }

      // Username validation
      if (username.length < 3) {
        addToast('Username must be at least 3 characters', 'error');
        setIsLoading(false);
        return;
      }

      if (passwordStrength.score < 2) {
        addToast('Please use a stronger password', 'error');
        setIsLoading(false);
        return;
      }

      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const uid = userCredential.user.uid;
        
        const isEmailAdmin = email.toLowerCase() === 'admin@movie.com' || registerAsAdmin;
        const newUser: User = {
          id: uid,
          email: email,
          username: username,
          role: isEmailAdmin ? 'admin' : 'user',
          subscription: isEmailAdmin 
            ? { active: true, planId: 'premium', expiresAt: new Date(Date.now() + 30*24*60*60*1000).toISOString() } 
            : { active: false },
          watchlist: [],
          history: [],
          createdAt: new Date().toISOString()
        };
        
        try {
          await setDoc(doc(db, 'users', uid), newUser);
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `users/${uid}`);
        }
        
        addToast(`Account created successfully! Welcome, ${username}! 🎉`, 'success');
        onLoginSuccess(newUser);
      } catch (error: any) {
        console.error('Registration error:', error);
        const errorMessage = error.code === 'auth/email-already-in-use'
          ? 'This email is already registered'
          : error.code === 'auth/weak-password'
          ? 'Password is too weak'
          : error.message || 'Registration failed';
          
        addToast(errorMessage, 'error');
        setShakeError(true);
        setTimeout(() => setShakeError(false), 500);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Load remembered email
  useEffect(() => {
    const remembered = localStorage.getItem('rememberedEmail');
    if (remembered) {
      setEmail(remembered);
      setRememberMe(true);
    }
  }, []);

  // Social login handlers (simulated)
  const handleSocialLogin = (provider: string) => {
    addToast(`${provider} login coming soon! 🚀`, 'info');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Effects */}
      <FloatingParticles />
      
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
      
      {/* Main Auth Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 mb-4"
          >
            <div className="relative">
              <Film className="w-8 h-8 text-amber-400" />
              <motion.div
                className="absolute -inset-2 bg-amber-400/20 rounded-full blur"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>
            <span className="text-2xl font-black text-white tracking-tight">StreamMax</span>
          </motion.div>
          
          <motion.p
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-gray-400 text-sm"
          >
            Your Premium Streaming Destination
          </motion.p>
        </div>

        {/* Auth Card */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className={`bg-gray-900/80 backdrop-blur-xl border border-gray-800/50 rounded-3xl shadow-2xl overflow-hidden ${
            shakeError ? 'animate-shake' : ''
          }`}
        >
          {/* VIP Banner */}
          {isLogin && (
            <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-b border-amber-500/10 px-6 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-amber-400">VIP Members</span>
              </div>
              <span className="text-xs text-gray-400">Ad-free • 4K • Exclusive</span>
            </div>
          )}

          <div className="p-6 md:p-8">
            {/* Tab Switcher */}
            <div className="flex bg-gray-800/50 rounded-2xl p-1.5 mb-8">
              {[
                { label: 'Sign In', value: true },
                { label: 'Create Account', value: false },
              ].map(({ label, value }) => (
                <button
                  key={label}
                  onClick={() => {
                    setIsLogin(value);
                    setFormStep(0);
                    setShowResetPassword(false);
                  }}
                  className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all relative ${
                    isLogin === value
                      ? 'text-white'
                      : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {isLogin === value && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl shadow-lg shadow-amber-500/20"
                    />
                  )}
                  <span className="relative z-10">{label}</span>
                </button>
              ))}
            </div>

            {/* Password Reset Form */}
            <AnimatePresence mode="wait">
              {showResetPassword ? (
                <motion.form
                  key="reset"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  onSubmit={handlePasswordReset}
                  className="space-y-4"
                >
                  <div className="text-center mb-6">
                    <Key className="w-12 h-12 text-amber-400 mx-auto mb-3" />
                    <h3 className="text-lg font-bold text-white">Reset Password</h3>
                    <p className="text-sm text-gray-400 mt-1">
                      Enter your email to receive a reset link
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input
                        type="email"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        className="w-full bg-gray-800/50 border border-gray-700/50 rounded-xl pl-12 pr-4 py-3.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 transition-all"
                        placeholder="you@example.com"
                        required
                      />
                    </div>
                  </div>
                  
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-bold rounded-xl hover:shadow-lg hover:shadow-amber-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isLoading ? 'Sending...' : 'Send Reset Link'}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setShowResetPassword(false)}
                    className="w-full text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    Back to Sign In
                  </button>
                </motion.form>
              ) : (
                <motion.form
                  key="main"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  onSubmit={handleSubmit}
                  className="space-y-5"
                >
                  {/* Username (Register only) */}
                  <AnimatePresence>
                    {!isLogin && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                          Username
                        </label>
                        <div className="relative group">
                          <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-amber-400 transition-colors" />
                          <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full bg-gray-800/50 border border-gray-700/50 rounded-xl pl-12 pr-4 py-3.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 transition-all"
                            placeholder="Choose a username"
                            required
                          />
                          {username.length >= 3 && (
                            <Check className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-green-400" />
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                      Email Address
                    </label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-amber-400 transition-colors" />
                      <input
                        ref={emailInputRef}
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-gray-800/50 border border-gray-700/50 rounded-xl pl-12 pr-4 py-3.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 transition-all"
                        placeholder="you@example.com"
                        required
                        autoComplete="email"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                      Password
                    </label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-amber-400 transition-colors" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-gray-800/50 border border-gray-700/50 rounded-xl pl-12 pr-12 py-3.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 transition-all"
                        placeholder="••••••••"
                        required
                        autoComplete={isLogin ? 'current-password' : 'new-password'}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    
                    {/* Password Strength (Register only) */}
                    {!isLogin && password && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-2 space-y-1"
                      >
                        <div className="flex gap-1">
                          {[1, 2, 3, 4].map((level) => (
                            <div
                              key={level}
                              className={`flex-1 h-1 rounded-full transition-all ${
                                passwordStrength.score >= level
                                  ? passwordStrength.color
                                  : 'bg-gray-700'
                              }`}
                            />
                          ))}
                        </div>
                        <p className="text-xs text-gray-500">
                          Password strength: <span className="font-bold text-gray-300">{passwordStrength.label}</span>
                        </p>
                      </motion.div>
                    )}
                  </div>

                  {/* Remember Me & Forgot Password (Login only) */}
                  {isLogin && (
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="w-4 h-4 rounded bg-gray-800 border-gray-700 text-amber-500 focus:ring-amber-500"
                        />
                        <span className="text-xs text-gray-400">Remember me</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowResetPassword(true)}
                        className="text-xs text-amber-400 hover:text-amber-300 font-semibold transition-colors"
                      >
                        Forgot Password?
                      </button>
                    </div>
                  )}

                  {/* Admin Registration (Register only) */}
                  <AnimatePresence>
                    {!isLogin && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-3"
                      >
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={registerAsAdmin}
                            onChange={(e) => {
                              setRegisterAsAdmin(e.target.checked);
                              if (!e.target.checked) setSecretCode('');
                            }}
                            className="w-4 h-4 rounded bg-gray-800 border-gray-700 text-amber-500 focus:ring-amber-500"
                          />
                          <div className="flex items-center gap-1.5">
                            <Shield className="w-3.5 h-3.5 text-amber-400" />
                            <span className="text-xs text-amber-400 font-bold">Register as Admin</span>
                          </div>
                        </label>

                        {registerAsAdmin && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                          >
                            <div className="relative group">
                              <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-amber-400 transition-colors" />
                              <input
                                type="password"
                                value={secretCode}
                                onChange={(e) => setSecretCode(e.target.value)}
                                className="w-full bg-gray-800/50 border border-gray-700/50 rounded-xl pl-12 pr-4 py-3.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 transition-all"
                                placeholder="Enter admin secret code"
                                required
                              />
                            </div>
                            <p className="text-[10px] text-gray-500 mt-1.5">
                              Hint: Use <code className="text-amber-400 bg-gray-800 px-1.5 py-0.5 rounded">CINEMA2026</code>
                            </p>
                          </motion.div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Submit Button */}
                  <motion.button
                    type="submit"
                    disabled={isLoading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-4 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-black font-black rounded-xl shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 relative overflow-hidden group"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      {isLoading ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          >
                            <Sparkles className="w-4 h-4" />
                          </motion.div>
                          Processing...
                        </>
                      ) : (
                        <>
                          {isLogin ? 'Sign In' : 'Create Account'}
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                  </motion.button>

                  {/* Social Login */}
                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-800" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-gray-900 px-4 text-gray-500">Or continue with</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { icon: Chrome, label: 'Google', color: 'hover:bg-red-500/10 hover:border-red-500/30' },
                      { icon: Github, label: 'GitHub', color: 'hover:bg-purple-500/10 hover:border-purple-500/30' },
                      { icon: Twitter, label: 'Twitter', color: 'hover:bg-blue-500/10 hover:border-blue-500/30' },
                    ].map(({ icon: Icon, label, color }) => (
                      <button
                        key={label}
                        type="button"
                        onClick={() => handleSocialLogin(label)}
                        className={`flex items-center justify-center gap-2 py-3 bg-gray-800/50 border border-gray-700/50 rounded-xl text-xs font-bold text-gray-400 hover:text-white transition-all ${color}`}
                      >
                        <Icon className="w-4 h-4" />
                        {label}
                      </button>
                    ))}
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            {/* Toggle Mode */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-400">
                {isLogin ? "Don't have an account?" : "Already have an account?"}
                <button
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setShowResetPassword(false);
                  }}
                  className="ml-1 text-amber-400 font-bold hover:text-amber-300 transition-colors"
                >
                  {isLogin ? 'Sign Up Free' : 'Sign In'}
                </button>
              </p>
            </div>
          </div>
        </motion.div>

        {/* Trust Badges */}
        <TrustBadges />

        {/* Demo Credentials */}
        {isLogin && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-6 bg-gray-900/50 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-4"
          >
            <div className="flex items-center gap-2 mb-3">
              <Key className="w-4 h-4 text-amber-400" />
              <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider">Demo Credentials</h4>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">Admin:</span>
                <code className="text-amber-400 bg-gray-800 px-2 py-1 rounded font-mono">admin@movie.com</code>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">Password:</span>
                <code className="text-gray-400 bg-gray-800 px-2 py-1 rounded font-mono">••••••••</code>
              </div>
              <p className="text-[10px] text-gray-500 mt-2">
                Use any password for demo accounts
              </p>
            </div>
          </motion.div>
        )}

        {/* Features Showcase */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-8 grid grid-cols-3 gap-4"
        >
          {[
            { icon: Zap, text: '4K Streaming', color: 'text-blue-400' },
            { icon: Star, text: 'No Ads', color: 'text-amber-400' },
            { icon: Gift, text: 'Free Trial', color: 'text-green-400' },
          ].map(({ icon: Icon, text, color }) => (
            <div key={text} className="text-center">
              <Icon className={`w-5 h-5 ${color} mx-auto mb-1`} />
              <p className="text-[10px] text-gray-500 font-semibold">{text}</p>
            </div>
          ))}
        </motion.div>
      </motion.div>

      {/* Custom Animations */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
        }
      `}</style>
    </div>
  );
}