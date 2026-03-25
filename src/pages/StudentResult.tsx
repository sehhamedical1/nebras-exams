import { useLocation, useNavigate } from 'react-router-dom';
import { Trophy, RotateCcw, Home, Clock, CheckCircle2, XCircle, Medal } from 'lucide-react';
import { motion } from 'motion/react';
import Confetti from 'react-confetti';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useStore } from '@/store/useStore';

export function StudentResult() {
  const location = useLocation();
  const navigate = useNavigate();
  const { tests } = useStore();
  
  // Mock data for demonstration if no state is passed
  const { score = 150, total = 200, correct = 15, wrong = 5, timeSpent = '02:45', rank = 3, testId, previewTest } = location.state || {};
  const percentage = Math.round((score / total) * 100) || 0;
  
  const test = previewTest || tests.find(t => t.id === testId);
  const limitOneResponse = test?.settings?.limitOneResponse;

  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  let message = "أداء رائع!";
  let color = "text-green-400";
  if (percentage < 50) {
    message = "حاول مرة أخرى!";
    color = "text-orange-400";
  } else if (percentage === 100) {
    message = "ممتاز! علامة كاملة!";
    color = "text-accent-gold";
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 islamic-pattern relative overflow-hidden" style={{
      backgroundColor: test?.settings?.theme?.background || '#020617',
    }}>
      {percentage >= 50 && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={500}
          gravity={0.15}
        />
      )}

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl bg-surface-dark/90 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 md:p-12 shadow-2xl text-center relative z-10"
      >
        <motion.div 
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", bounce: 0.5, delay: 0.2 }}
          className="w-24 h-24 mx-auto bg-gradient-to-br from-accent-gold to-yellow-600 rounded-full flex items-center justify-center shadow-lg shadow-accent-gold/20 mb-6 border-4 border-surface-dark"
        >
          <Trophy size={48} className="text-white" />
        </motion.div>

        <h1 className="text-3xl font-bold text-white mb-2">انتهى الاختبار!</h1>
        <h2 className={`text-xl font-bold mb-8 ${color}`}>{message}</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-background-dark rounded-3xl p-6 border border-white/5 flex flex-col items-center justify-center">
            <p className="text-slate-400 mb-2 font-medium">النتيجة النهائية</p>
            <div className="flex items-end justify-center gap-2 mb-4">
              <span className="text-5xl font-bold text-white">{score}</span>
              <span className="text-xl text-slate-500 mb-1">/ {total}</span>
            </div>
            <div className="w-full bg-surface-dark rounded-full h-3 overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 1, delay: 0.5 }}
                className={cn("h-full rounded-full", percentage >= 50 ? 'bg-green-500' : 'bg-orange-500')}
              />
            </div>
            <p className="text-slate-400 mt-2 text-sm font-medium">{percentage}%</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-background-dark rounded-3xl p-4 border border-white/5 flex flex-col items-center justify-center">
              <CheckCircle2 size={28} className="text-green-500 mb-2" />
              <span className="text-2xl font-bold text-white">{correct}</span>
              <span className="text-slate-400 text-sm">إجابة صحيحة</span>
            </div>
            <div className="bg-background-dark rounded-3xl p-4 border border-white/5 flex flex-col items-center justify-center">
              <XCircle size={28} className="text-red-500 mb-2" />
              <span className="text-2xl font-bold text-white">{wrong}</span>
              <span className="text-slate-400 text-sm">إجابة خاطئة</span>
            </div>
            <div className="bg-background-dark rounded-3xl p-4 border border-white/5 flex flex-col items-center justify-center">
              <Clock size={28} className="text-primary mb-2" />
              <span className="text-xl font-bold text-white">{timeSpent}</span>
              <span className="text-slate-400 text-sm">الوقت المستغرق</span>
            </div>
            <div className="bg-background-dark rounded-3xl p-4 border border-white/5 flex flex-col items-center justify-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-accent-gold/10 rounded-bl-full"></div>
              <Medal size={28} className="text-accent-gold mb-2 relative z-10" />
              <span className="text-2xl font-bold text-white relative z-10">#{rank}</span>
              <span className="text-slate-400 text-sm relative z-10">ترتيبك</span>
            </div>
          </div>
        </div>

        <div className={cn("grid gap-4", (!limitOneResponse || previewTest) ? "grid-cols-2" : "grid-cols-1")}>
          {(!limitOneResponse || previewTest) && (
            <button 
              onClick={() => {
                if (previewTest) {
                  navigate('/preview', { state: { previewTest } });
                } else {
                  navigate('/student/login');
                }
              }}
              className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-bold transition-colors border border-white/10"
            >
              <RotateCcw size={20} />
              إعادة الاختبار
            </button>
          )}
          <button 
            onClick={() => {
              if (previewTest) {
                navigate(-2); // Go back to editor
              } else {
                navigate('/');
              }
            }}
            className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold transition-colors shadow-lg shadow-primary/20"
          >
            <Home size={20} />
            {previewTest ? 'العودة للإعدادات' : 'الرئيسية'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
