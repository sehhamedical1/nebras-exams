import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { User, BookOpen, ArrowLeft, Phone, Hash } from 'lucide-react';
import { motion } from 'motion/react';
import { useStore } from '@/store/useStore';

export function StudentLogin() {
  const navigate = useNavigate();
  const { code: urlCode } = useParams();
  const { tests } = useStore();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState(urlCode || '');
  const [error, setError] = useState('');

  useEffect(() => {
    if (urlCode) {
      setCode(urlCode);
    }
  }, [urlCode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validate name (only letters and spaces)
    if (!/^[\u0600-\u06FFa-zA-Z\s]+$/.test(name.trim())) {
      setError('الاسم يجب أن يحتوي على حروف فقط.');
      return;
    }

    // Validate phone (11 digits starting with 01)
    if (!/^01[0-9]{9}$/.test(phone.trim())) {
      setError('رقم الهاتف يجب أن يتكون من 11 رقماً ويبدأ بـ 01.');
      return;
    }

    if (name.trim() && phone.trim() && code.trim()) {
      const test = tests.find(t => t.code.toUpperCase() === code.toUpperCase());
      if (test) {
        // Check if limit one response is active and student already took it
        const hasTaken = useStore.getState().reports.some(r => r.testId === test.id && r.phone === phone);
        if (test.settings?.limitOneResponse && hasTaken) {
          setError('لقد قمت بأداء هذا الاختبار مسبقاً ولا يسمح بإعادته.');
          return;
        }
        navigate('/student/play', { state: { name, phone, testId: test.id } });
      } else {
        setError('كود الاختبار غير صحيح أو الاختبار غير متاح.');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 islamic-pattern relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl opacity-50"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-gold/10 rounded-full blur-3xl opacity-50"></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-surface-dark/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative z-10"
      >
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-primary/20">
            <BookOpen size={40} className="text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">أهلاً بك يا بطل!</h1>
          <p className="text-slate-400">أدخل بياناتك لتبدأ التحدي والمرح</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl text-sm text-center">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <label className="text-slate-300 text-sm font-medium block">كود الاختبار</label>
            <div className="relative">
              <Hash className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input 
                type="text" 
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full bg-background-dark border border-white/10 rounded-xl pr-12 pl-4 py-3.5 text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-lg font-mono tracking-widest uppercase"
                placeholder="مثال: A1B2C"
                dir="ltr"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-slate-300 text-sm font-medium block">الاسم الثلاثي</label>
            <div className="relative">
              <User className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input 
                type="text" 
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-background-dark border border-white/10 rounded-xl pr-12 pl-4 py-3.5 text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-lg"
                placeholder="اكتب اسمك هنا..."
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-slate-300 text-sm font-medium block">رقم الهاتف</label>
            <div className="relative">
              <Phone className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input 
                type="tel" 
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-background-dark border border-white/10 rounded-xl pr-12 pl-4 py-3.5 text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-lg text-left"
                placeholder="05X XXX XXXX"
                dir="ltr"
              />
            </div>
          </div>

          <button 
            type="submit"
            className="w-full bg-primary hover:bg-primary/90 text-white font-bold text-lg py-4 rounded-xl shadow-lg shadow-primary/25 transition-all flex items-center justify-center gap-2 mt-8"
          >
            ابدأ الاختبار
            <ArrowLeft size={20} />
          </button>
        </form>
      </motion.div>
    </div>
  );
}
