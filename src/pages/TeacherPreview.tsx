import { StudentPlay } from './StudentPlay';
import { ArrowRight } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useStore } from '@/store/useStore';

export function TeacherPreview() {
  const navigate = useNavigate();
  const location = useLocation();
  const { draftTest } = useStore();
  
  const previewTest = location.state?.previewTest || (draftTest ? {
    id: draftTest.id || 'preview',
    name: draftTest.name || 'معاينة',
    questions: draftTest.questions,
    settings: {}
  } : null);

  if (!previewTest) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-dark text-white">
        <p>لا توجد بيانات للمعاينة</p>
        <button onClick={() => navigate(-1)} className="mr-4 text-primary underline">العودة</button>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      <div className="absolute top-4 left-4 z-[100] flex items-center gap-4">
        <div className="bg-primary text-white px-4 py-2 rounded-full font-bold shadow-lg flex items-center gap-2 animate-pulse">
          <span className="w-2 h-2 bg-white rounded-full"></span>
          وضع المعاينة
        </div>
        <button 
          onClick={() => navigate(-1)}
          className="bg-surface-dark/80 backdrop-blur-md text-white px-4 py-2 rounded-full font-bold shadow-lg flex items-center gap-2 hover:bg-surface-dark transition-colors border border-white/10"
        >
          <ArrowRight size={18} />
          العودة للإعدادات
        </button>
      </div>
      <StudentPlay />
    </div>
  );
}
