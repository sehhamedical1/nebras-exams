import React, { useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, Eye, Save, Gamepad2, Edit3, Check, Trash2, PlusCircle, Timer, Star, Plus, Smartphone, RefreshCw, User, Image as ImageIcon, X, Link as LinkIcon, Copy, List, CheckSquare, Type, Search, Grid, LayoutGrid, Type as TypeIcon, Hash, Box, Shuffle, HelpCircle, MapPin, Search as SearchIcon, Scissors, SpellCheck, Layers, Play, Apple, FastForward, Plane, Target, Copy as CopyIcon, ListOrdered, MousePointer2, Magnet, Zap, Map as MapIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStore, Test } from '@/store/useStore';

type QuestionType = 'multiple_choice' | 'true_false' | 'fill_blanks' | 'find_match' | 'complete_sentence' | 'speaking_cards' | 'flash_cards' | 'match_up' | 'group_sort' | 'unjumble' | 'matching_pairs' | 'open_box' | 'anagram' | 'gameshow' | 'labelled_diagram' | 'wordsearch' | 'hangman' | 'crossword' | 'spell' | 'flip_tiles' | 'maze_chase' | 'maze' | 'fruit' | 'true_false_speed' | 'airplane' | 'whack_mole' | 'pair_no_pair' | 'rank_order' | 'balloon_pop' | 'word_magnets' | 'speed_sorting';

const QUESTION_TYPES: { id: QuestionType; name: string; desc: string; icon: any }[] = [
  { id: 'multiple_choice', name: 'Multiple Choice', desc: 'سؤال متعدد الخيارات', icon: List },
  { id: 'true_false', name: 'True / False', desc: 'سؤال بصيغة صح أو خطأ', icon: CheckSquare },
  { id: 'group_sort', name: 'Group Sort', desc: 'صنف العناصر في مجموعات', icon: LayoutGrid },
  { id: 'fill_blanks', name: 'Fill in the blanks (أكمل مكان النقط)', desc: 'املأ الفراغات بالكلمة المناسبة', icon: Type },
  { id: 'complete_sentence', name: 'Complete the sentence', desc: 'اسحب وأفلت الكلمات في الفراغات', icon: TypeIcon },
  { id: 'speaking_cards', name: 'Memory Cards (بطاقات الحفظ)', desc: 'بطاقات عشوائية للحفظ والترتيب', icon: Layers },
  { id: 'match_up', name: 'Match Up', desc: 'اسحب الكلمة لتعريفها', icon: LinkIcon },
  { id: 'flash_cards', name: 'Flash Cards', desc: 'بطاقات تعليمية بوجهين', icon: CopyIcon },
  { id: 'matching_pairs', name: 'Matching Pairs', desc: 'ابحث عن الأزواج المتطابقة', icon: Grid },
  { id: 'find_match', name: 'Find the Match', desc: 'انقر على الإجابة المطابقة لإزالتها', icon: Search },
  { id: 'unjumble', name: 'Unjumble', desc: 'أعد ترتيب الكلمات لتكوين جملة', icon: Shuffle },
  { id: 'anagram', name: 'Anagram', desc: 'أعد ترتيب الحروف لتكوين كلمة', icon: SpellCheck },
  { id: 'labelled_diagram', name: 'Labelled Diagram', desc: 'ضع الدبابيس في مكانها على الصورة', icon: MapPin },
  { id: 'maze_chase', name: 'Maze Chase', desc: 'ارسم المسار الصحيح', icon: MapIcon },
];

interface Option {
  id: number;
  text: string;
  image?: string;
  isCorrect?: boolean;
  matchText?: string;
  matchImage?: string;
  groupId?: number;
  x?: number;
  y?: number;
}

interface Group {
  id: number;
  title: string;
}

interface Question {
  id: string;
  type: QuestionType;
  text: string;
  image?: string;
  options: Option[];
  groups?: Group[];
  timer: number;
  points: number;
  speed?: number;
}

export function CreateGame() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { addTest, updateTest, tests, draftTest, setDraftTest } = useStore();
  
  const editId = searchParams.get('id');
  const existingTest = editId ? tests.find(t => t.id === editId) : null;

  // Use draft if it matches the current edit mode (or if creating new and draft has no id)
  const useDraft = draftTest && (editId ? draftTest.id === editId : !draftTest.id);

  const [questions, setQuestions] = useState<Question[]>(
    useDraft ? draftTest.questions : existingTest?.questions || [
      {
        id: '1',
        type: 'multiple_choice',
        text: 'ما هو الركن الثاني من أركان الإسلام؟',
        options: [
          { id: 1, text: 'الصلاة', isCorrect: true },
          { id: 2, text: 'الصيام', isCorrect: false },
          { id: 3, text: 'الزكاة', isCorrect: false },
        ],
        timer: 30,
        points: 100
      }
    ]
  );
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const currentQuestion = questions[currentQuestionIndex];

  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [testName, setTestName] = useState(useDraft ? draftTest.name : existingTest?.name || '');
  const [savedTest, setSavedTest] = useState<{link: string, code: string} | null>(null);

  // Auto-save to draft
  React.useEffect(() => {
    setDraftTest({ id: editId || undefined, name: testName, questions });
  }, [testName, questions, editId, setDraftTest]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadTarget, setUploadTarget] = useState<{type: 'question' | 'option' | 'matchOption', id?: number} | null>(null);
  const [isDrawingMaze, setIsDrawingMaze] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && uploadTarget) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        if (uploadTarget.type === 'question') {
          updateCurrentQuestion({ image: base64String });
        } else if (uploadTarget.type === 'option' && uploadTarget.id) {
          updateOption(uploadTarget.id, { image: base64String });
        } else if (uploadTarget.type === 'matchOption' && uploadTarget.id) {
          updateOption(uploadTarget.id, { matchImage: base64String });
        }
      };
      reader.readAsDataURL(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const triggerImageUpload = (type: 'question' | 'option' | 'matchOption', id?: number) => {
    setUploadTarget({ type, id });
    fileInputRef.current?.click();
  };

  const updateCurrentQuestion = (updates: Partial<Question>) => {
    const newQuestions = [...questions];
    newQuestions[currentQuestionIndex] = { ...currentQuestion, ...updates };
    setQuestions(newQuestions);
  };

  const addOption = (initialData?: Partial<Option> | React.MouseEvent) => {
    const data = initialData && !('nativeEvent' in initialData) ? initialData : {};
    const newId = Date.now() + Math.random();
    updateCurrentQuestion({
      options: [...currentQuestion.options, { id: newId, text: '', isCorrect: false, matchText: '', groupId: currentQuestion.groups?.[0]?.id, ...data }]
    });
    return newId;
  };

  const removeOption = (id: number) => {
    updateCurrentQuestion({
      options: currentQuestion.options.filter(o => o.id !== id)
    });
  };

  const updateOption = (id: number, updates: Partial<Option>) => {
    updateCurrentQuestion({
      options: currentQuestion.options.map(o => o.id === id ? { ...o, ...updates } : o)
    });
  };

  const setCorrectOption = (id: number) => {
    if (currentQuestion.type === 'true_false') {
      updateCurrentQuestion({
        options: currentQuestion.options.map(o => ({ ...o, isCorrect: o.id === id }))
      });
    } else {
      updateOption(id, { isCorrect: !currentQuestion.options.find(o => o.id === id)?.isCorrect });
    }
  };

  const addGroup = () => {
    const newGroups = [...(currentQuestion.groups || []), { id: Date.now() + Math.random(), title: 'مجموعة جديدة' }];
    updateCurrentQuestion({ groups: newGroups });
  };

  const updateGroup = (id: number, title: string) => {
    updateCurrentQuestion({
      groups: currentQuestion.groups?.map(g => g.id === id ? { ...g, title } : g)
    });
  };

  const removeGroup = (id: number) => {
    updateCurrentQuestion({
      groups: currentQuestion.groups?.filter(g => g.id !== id),
      options: currentQuestion.options.filter(o => o.groupId !== id)
    });
  };

  const addNewQuestion = (type: QuestionType) => {
    const newQuestion: Question = {
      id: Date.now().toString() + Math.random().toString(36).substring(7),
      type,
      text: '',
      options: type === 'true_false' 
        ? [{ id: 1, text: 'صح', isCorrect: true }, { id: 2, text: 'خطأ', isCorrect: false }]
        : type === 'find_match' || type === 'match_up'
        ? [{ id: 1, text: '', matchText: '' }, { id: 2, text: '', matchText: '' }]
        : type === 'group_sort'
        ? [{ id: 1, text: '', groupId: 1 }]
        : [{ id: 1, text: '', isCorrect: true }, { id: 2, text: '', isCorrect: false }],
      groups: type === 'group_sort' ? [{ id: 1, title: 'المجموعة الأولى' }, { id: 2, title: 'المجموعة الثانية' }] : undefined,
      timer: 30,
      points: 100
    };
    setQuestions([...questions, newQuestion]);
    setCurrentQuestionIndex(questions.length);
    setShowTypeModal(false);
  };

  const handleSave = () => {
    // Validation: Any field is empty except: Question text. Everything else must be filled: Options, Cards, Pairs, Images, Answers
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      
      // SECTION 1: QUESTION COMPLETION RULES
      if (q.type === 'fill_blanks' || q.type === 'complete_sentence') {
        const matches = (q.text || '').match(/\[(.*?)\]/g) || [];
        if (matches.length > 0) continue; // COMPLETE
      }
      if (q.type === 'unjumble' || q.type === 'anagram') {
        if (q.options[0]?.text?.trim()) continue; // COMPLETE
      }
      if (q.type === 'maze_chase') {
        if (q.options[0]?.text?.trim() && q.options[0]?.text !== '[]') continue; // COMPLETE (path drawn)
      }

      for (const opt of q.options) {
        if (q.type === 'find_match' || q.type === 'match_up' || q.type === 'matching_pairs') {
          if (!opt.text && !opt.image) {
            alert(`يرجى إكمال جميع الخيارات في السؤال رقم ${i + 1}`);
            setCurrentQuestionIndex(i);
            return;
          }
          if (!opt.matchText && !opt.matchImage) {
            alert(`يرجى إكمال جميع الأزواج/المطابقات في السؤال رقم ${i + 1}`);
            setCurrentQuestionIndex(i);
            return;
          }
        } else if (q.type === 'flash_cards' || q.type === 'speaking_cards') {
          if (!opt.text && !opt.image) {
            alert(`يرجى إكمال جميع البطاقات في السؤال رقم ${i + 1}`);
            setCurrentQuestionIndex(i);
            return;
          }
        } else {
          if (!opt.text && !opt.image) {
            alert(`يرجى إكمال جميع الخيارات/الإجابات في السؤال رقم ${i + 1}`);
            setCurrentQuestionIndex(i);
            return;
          }
        }
      }
      // Check answers
      if (['multiple_choice', 'true_false', 'fruit', 'airplane', 'whack_mole', 'balloon_pop', 'true_false_speed'].includes(q.type)) {
        const hasCorrect = q.options.some(o => o.isCorrect);
        if (!hasCorrect) {
          alert(`يرجى تحديد إجابة صحيحة واحدة على الأقل في السؤال رقم ${i + 1}`);
          setCurrentQuestionIndex(i);
          return;
        }
      }
    }

    if (testName.trim()) {
      let finalQuestions = questions;
      let finalSettings = existingTest?.settings || {};

      if (finalSettings.limitOneResponse) {
        const incompatibleTypes = ['find_match', 'anagram', 'unjumble', 'speaking_cards'];
        const hasIncompatible = questions.some(q => incompatibleTypes.includes(q.type));
        
        if (hasIncompatible) {
          if (window.confirm('تنبيه: هذا الاختبار يحتوي على أسئلة لا تدعم خاصية "التقيد برد واحد" المفعلة في الإعدادات. هل تريد الاستمرار وإلغاء هذه الأسئلة من الاختبار؟ (اختر "إلغاء" لتعطيل خاصية التقيد برد واحد بدلاً من ذلك)')) {
            finalQuestions = questions.filter(q => !incompatibleTypes.includes(q.type));
          } else {
            finalSettings = { ...finalSettings, limitOneResponse: false };
          }
        }
      }

      const code = existingTest?.code || Math.random().toString(36).substring(2, 7).toUpperCase();
      const testData: Test = {
        id: existingTest?.id || Date.now().toString() + Math.random().toString(36).substring(7),
        name: testName,
        questions: finalQuestions,
        students: existingTest?.students || 0,
        date: existingTest?.date || new Date().toISOString().split('T')[0],
        status: 'نشط',
        code: code,
        settings: finalSettings
      };

      if (existingTest) {
        updateTest(existingTest.id, testData);
      } else {
        addTest(testData);
      }

      setDraftTest(null);

      setSavedTest({
        link: `${window.location.origin}/exam/${code}`,
        code: code
      });
    }
  };

  const renderEditor = () => {
    switch (currentQuestion.type) {
      case 'find_match':
      case 'match_up':
      case 'matching_pairs':
        return (
          <div className="space-y-4">
            <label className="text-slate-400 text-sm block">الأزواج المتطابقة (الكلمة وما يطابقها)</label>
            <div className="grid gap-3">
              {currentQuestion.options.map((option, idx) => (
                <div key={option.id} className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/10">
                  <div className="flex-1 space-y-2">
                    <div className="relative flex gap-2">
                      <div className="relative flex-1">
                        <input 
                          type="text" 
                          value={option.text}
                          onChange={(e) => updateOption(option.id, { text: e.target.value })}
                          placeholder="العنصر الأول (مثال: عاصمة السعودية)"
                          className="w-full bg-background-dark border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white focus:border-primary outline-none text-sm"
                        />
                        <button onClick={() => triggerImageUpload('option', option.id)} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors">
                          <ImageIcon size={16} />
                        </button>
                      </div>
                      {option.image && (
                        <div className="w-10 h-10 rounded bg-black/50 overflow-hidden relative group">
                          <img src={option.image} alt="" className="w-full h-full object-cover" />
                          <button onClick={() => updateOption(option.id, { image: undefined })} className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <X size={14} className="text-white" />
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="relative flex gap-2">
                      <div className="relative flex-1">
                        <input 
                          type="text" 
                          value={option.matchText || ''}
                          onChange={(e) => updateOption(option.id, { matchText: e.target.value })}
                          placeholder="العنصر المطابق (مثال: الرياض)"
                          className="w-full bg-primary/10 border border-primary/30 rounded-lg pl-10 pr-4 py-2 text-white focus:border-primary outline-none text-sm"
                        />
                        <button onClick={() => triggerImageUpload('matchOption', option.id)} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors">
                          <ImageIcon size={16} />
                        </button>
                      </div>
                      {option.matchImage && (
                        <div className="w-10 h-10 rounded bg-black/50 overflow-hidden relative group">
                          <img src={option.matchImage} alt="" className="w-full h-full object-cover" />
                          <button onClick={() => updateOption(option.id, { matchImage: undefined })} className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <X size={14} className="text-white" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <button 
                    onClick={() => removeOption(option.id)}
                    className="text-slate-500 hover:text-red-400 transition-colors p-2 shrink-0"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
            <button 
              onClick={addOption}
              className="w-full py-3 border-2 border-dashed border-white/10 rounded-xl text-slate-400 hover:border-primary/50 hover:text-primary transition-all flex items-center justify-center gap-2"
            >
              <PlusCircle size={20} />
              إضافة زوج جديد
            </button>
            {(currentQuestion.type === 'find_match' || currentQuestion.type === 'multiple_choice') && (
              <div className="space-y-4 mt-4 bg-white/5 p-4 rounded-xl border border-white/10">
                <div className="flex justify-between items-center">
                  <label className="text-slate-400 text-sm block">سرعة حركة العنصر</label>
                  <span className="text-primary font-bold bg-primary/10 px-3 py-1 rounded-lg">{currentQuestion.speed || 5}</span>
                </div>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => {
                      const newQuestions = [...questions];
                      newQuestions[currentQuestionIndex].speed = Math.max(1, (currentQuestion.speed || 5) - 1);
                      setQuestions(newQuestions);
                    }}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                  >
                    -
                  </button>
                  <input 
                    type="range" 
                    min="1" 
                    max="10" 
                    value={currentQuestion.speed || 5} 
                    onChange={(e) => {
                      const newQuestions = [...questions];
                      newQuestions[currentQuestionIndex].speed = parseInt(e.target.value);
                      setQuestions(newQuestions);
                    }}
                    className="flex-1 accent-primary"
                  />
                  <button 
                    onClick={() => {
                      const newQuestions = [...questions];
                      newQuestions[currentQuestionIndex].speed = Math.min(10, (currentQuestion.speed || 5) + 1);
                      setQuestions(newQuestions);
                    }}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                  >
                    +
                  </button>
                </div>
                <div className="flex justify-between text-xs text-slate-500 px-10">
                  <span>بطيء</span>
                  <span>سريع</span>
                </div>
              </div>
            )}
          </div>
        );
      case 'group_sort':
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-slate-400 text-sm block">المجموعات</label>
                <button onClick={addGroup} className="text-primary text-sm flex items-center gap-1 hover:text-primary/80">
                  <Plus size={16} /> إضافة مجموعة
                </button>
              </div>
              <div className="grid gap-3">
                {currentQuestion.groups?.map(group => (
                  <div key={group.id} className="flex items-center gap-2">
                    <input 
                      type="text" 
                      value={group.title}
                      onChange={(e) => updateGroup(group.id, e.target.value)}
                      className="flex-1 bg-background-dark border border-white/10 rounded-lg px-4 py-2 text-white focus:border-primary outline-none text-sm font-bold"
                    />
                    <button onClick={() => removeGroup(group.id)} className="text-slate-500 hover:text-red-400 p-2">
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-slate-400 text-sm block">العناصر وتصنيفها</label>
              <div className="grid gap-3">
                {currentQuestion.options.map(option => (
                  <div key={option.id} className="flex items-center gap-2 bg-white/5 p-2 rounded-xl">
                    <div className="flex-1 relative">
                      <input 
                        type="text" 
                        value={option.text}
                        onChange={(e) => updateOption(option.id, { text: e.target.value })}
                        placeholder="اسم العنصر"
                        className="w-full bg-background-dark border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white focus:border-primary outline-none text-sm"
                      />
                      <button onClick={() => triggerImageUpload('option', option.id)} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary">
                        <ImageIcon size={16} />
                      </button>
                    </div>
                    {option.image && (
                      <div className="w-10 h-10 rounded bg-black/50 overflow-hidden relative group shrink-0">
                        <img src={option.image} alt="" className="w-full h-full object-cover" />
                        <button onClick={() => updateOption(option.id, { image: undefined })} className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <X size={14} className="text-white" />
                        </button>
                      </div>
                    )}
                    <select 
                      value={option.groupId || ''}
                      onChange={(e) => updateOption(option.id, { groupId: Number(e.target.value) })}
                      className="bg-background-dark border border-white/10 rounded-lg px-3 py-2 text-white outline-none text-sm w-1/3"
                    >
                      {currentQuestion.groups?.map(g => (
                        <option key={g.id} value={g.id}>{g.title}</option>
                      ))}
                    </select>
                    <button onClick={() => removeOption(option.id)} className="text-slate-500 hover:text-red-400 p-2">
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
              <button 
                onClick={() => addOption()}
                className="w-full py-3 border-2 border-dashed border-white/10 rounded-xl text-slate-400 hover:border-primary/50 hover:text-primary transition-all flex items-center justify-center gap-2"
              >
                <PlusCircle size={20} />
                إضافة عنصر جديد
              </button>
            </div>
          </div>
        );
      case 'fill_blanks':
      case 'complete_sentence':
        return (
          <div className="space-y-4">
            <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 text-sm text-primary mb-4">
              اكتب الجملة كاملة في مربع "نص السؤال" بالأعلى. ثم حدد الكلمات التي تريد إخفاءها وضعها بين قوسين مربعين. مثال: "عاصمة السعودية هي [الرياض]"
            </div>
            <div className="space-y-2">
              <label className="text-slate-400 text-sm block">الكلمات المخفية (تستخرج تلقائياً)</label>
              <div className="flex flex-wrap gap-2">
                {(currentQuestion.text.match(/\[(.*?)\]/g) || []).map((match, i) => (
                  <span key={i} className="bg-primary/20 text-primary px-3 py-1 rounded-lg text-sm font-bold border border-primary/30">
                    {match.replace(/\[|\]/g, '')}
                  </span>
                ))}
                {!(currentQuestion.text.match(/\[(.*?)\]/g) || []).length && (
                  <span className="text-slate-500 text-sm">لم يتم تحديد كلمات مخفية بعد.</span>
                )}
              </div>
            </div>
          </div>
        );
      case 'maze':
        return (
          <div className="space-y-4">
            <label className="text-slate-400 text-sm block">صورة المتاهة والاتجاه الصحيح</label>
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center">
              {currentQuestion.image ? (
                <div className="relative inline-block">
                  <img src={currentQuestion.image} alt="Maze" className="max-h-48 rounded-lg border border-white/20" />
                  <button onClick={() => updateCurrentQuestion({ image: undefined })} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600">
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <button onClick={() => triggerImageUpload('question')} className="flex flex-col items-center justify-center w-full py-8 text-slate-400 hover:text-primary transition-colors">
                  <ImageIcon size={48} className="mb-2 opacity-50" />
                  <span>اضغط لرفع صورة المتاهة</span>
                </button>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-slate-400 text-sm block">الاتجاه الصحيح (مثال: يمين، أعلى، يسار)</label>
              <input 
                type="text" 
                value={currentQuestion.options[0]?.text || ''}
                onChange={(e) => {
                  if (currentQuestion.options.length === 0) {
                    updateCurrentQuestion({ options: [{ id: 1, text: e.target.value, isCorrect: true }] });
                  } else {
                    updateOption(currentQuestion.options[0].id, { text: e.target.value });
                  }
                }}
                className="w-full bg-background-dark border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary outline-none"
                placeholder="اكتب مسار الحل الصحيح..."
              />
            </div>
          </div>
        );
      case 'true_false':
        return (
          <div className="space-y-4">
            <label className="text-slate-400 text-sm block">الخيارات (اختر الإجابة الصحيحة)</label>
            <div className="grid grid-cols-2 gap-4">
              {currentQuestion.options.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setCorrectOption(option.id)}
                  className={cn(
                    "p-4 rounded-xl border-2 flex items-center justify-center gap-2 font-bold transition-all",
                    option.isCorrect 
                      ? "bg-green-500/20 border-green-500 text-green-400" 
                      : "bg-surface-dark border-white/10 text-slate-400 hover:border-white/30"
                  )}
                >
                  {option.isCorrect && <Check size={18} />}
                  {option.text}
                </button>
              ))}
            </div>
          </div>
        );
      case 'labelled_diagram':
      case 'maze_chase':
        return (
          <div className="space-y-4">
            <label className="text-slate-400 text-sm block">
              {currentQuestion.type === 'labelled_diagram' ? 'صورة المخطط والنقاط' : 'صورة المتاهة'}
            </label>
            <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-4">
              <div className="relative">
                {currentQuestion.options[0]?.image ? (
                  <div className="relative inline-block w-full">
                    <div 
                      className={cn("relative w-full", currentQuestion.type === 'maze_chase' && "touch-none")}
                      onPointerDown={(e) => {
                        if (currentQuestion.type !== 'maze_chase') return;
                        setIsDrawingMaze(true);
                        const rect = e.currentTarget.getBoundingClientRect();
                        const x = ((e.clientX - rect.left) / rect.width) * 100;
                        const y = ((e.clientY - rect.top) / rect.height) * 100;
                        updateOption(currentQuestion.options[0].id, { text: JSON.stringify([{x, y}]) });
                      }}
                      onPointerMove={(e) => {
                        if (!isDrawingMaze || currentQuestion.type !== 'maze_chase') return;
                        const rect = e.currentTarget.getBoundingClientRect();
                        const x = ((e.clientX - rect.left) / rect.width) * 100;
                        const y = ((e.clientY - rect.top) / rect.height) * 100;
                        try {
                          const currentPath = JSON.parse(currentQuestion.options[0].text || '[]');
                          updateOption(currentQuestion.options[0].id, { text: JSON.stringify([...currentPath, {x, y}]) });
                        } catch (err) {
                          // Ignore parse errors
                        }
                      }}
                      onPointerUp={() => setIsDrawingMaze(false)}
                      onPointerLeave={() => setIsDrawingMaze(false)}
                    >
                      <img src={currentQuestion.options[0].image} alt="" className="w-full rounded-lg object-contain pointer-events-none" />
                      
                      {currentQuestion.type === 'maze_chase' && currentQuestion.options[0].text && (
                        <svg className="absolute inset-0 w-full h-full pointer-events-none">
                          {(() => {
                            try {
                              const path = JSON.parse(currentQuestion.options[0].text);
                              if (path.length > 1) {
                                return (
                                  <g>
                                    <polyline
                                      points={path.map((p: any) => `${p.x}%,${p.y}%`).join(' ')}
                                      fill="none"
                                      stroke="white"
                                      strokeWidth="8"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      className="drop-shadow-xl"
                                    />
                                    <polyline
                                      points={path.map((p: any) => `${p.x}%,${p.y}%`).join(' ')}
                                      fill="none"
                                      stroke="red"
                                      strokeWidth="4"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                  </g>
                                );
                              }
                            } catch (e) {}
                            return null;
                          })()}
                        </svg>
                      )}
                    </div>
                    <button 
                      onClick={() => updateOption(currentQuestion.options[0].id, { image: undefined, text: '' })} 
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors z-10"
                    >
                      <X size={16} />
                    </button>
                    {currentQuestion.type === 'labelled_diagram' && currentQuestion.options.slice(1).map((opt, idx) => (
                      <div 
                        key={opt.id} 
                        className="absolute w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold -translate-x-1/2 -translate-y-1/2 cursor-move z-10"
                        style={{ left: `${opt.x || 50}%`, top: `${opt.y || 50}%` }}
                        draggable
                        onDragEnd={(e) => {
                          const rect = (e.target as HTMLElement).parentElement!.getBoundingClientRect();
                          const x = ((e.clientX - rect.left) / rect.width) * 100;
                          const y = ((e.clientY - rect.top) / rect.height) * 100;
                          updateOption(opt.id, { x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
                        }}
                      >
                        {idx + 1}
                      </div>
                    ))}
                  </div>
                ) : (
                  <button 
                    onClick={() => {
                      let optionId = currentQuestion.options[0]?.id;
                      if (currentQuestion.options.length === 0) {
                        optionId = addOption();
                      }
                      triggerImageUpload('option', optionId || Date.now());
                    }}
                    className="w-full py-8 border-2 border-dashed border-white/10 rounded-xl text-slate-400 hover:border-primary/50 hover:text-primary transition-all flex flex-col items-center justify-center gap-2"
                  >
                    <ImageIcon size={32} />
                    <span>رفع صورة</span>
                  </button>
                )}
              </div>

              {currentQuestion.type === 'labelled_diagram' && currentQuestion.options[0]?.image && (
                <div className="space-y-3 mt-6">
                  <h4 className="text-white font-bold">النقاط المحددة</h4>
                  {currentQuestion.options.slice(1).map((opt, idx) => (
                    <div key={opt.id} className="flex items-center gap-3">
                      <span className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                        {idx + 1}
                      </span>
                      <input 
                        type="text" 
                        value={opt.text || ''}
                        onChange={(e) => updateOption(opt.id, { text: e.target.value })}
                        placeholder="اسم النقطة"
                        className="flex-1 bg-background-dark border border-white/10 rounded-lg px-4 py-2 text-white focus:border-primary outline-none text-sm"
                      />
                      <button 
                        onClick={() => removeOption(opt.id)}
                        className="text-slate-500 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                  <button 
                    onClick={() => addOption({ x: 50, y: 50 })}
                    className="w-full py-2 border border-dashed border-white/20 rounded-lg text-slate-400 hover:border-primary hover:text-primary transition-all text-sm"
                  >
                    إضافة نقطة جديدة
                  </button>
                </div>
              )}
              {currentQuestion.type === 'maze_chase' && currentQuestion.options[0]?.image && (
                <div className="mt-4 text-center">
                  <p className="text-sm text-slate-400 mb-2">ارسم المسار الصحيح على الصورة أعلاه</p>
                  <button
                    onClick={() => updateOption(currentQuestion.options[0].id, { text: '' })}
                    className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg text-sm hover:bg-red-500 hover:text-white transition-colors"
                  >
                    مسح المسار
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      case 'flash_cards':
        return (
          <div className="space-y-4">
            <label className="text-slate-400 text-sm block">البطاقات التعليمية (وجهين)</label>
            <div className="grid gap-4">
              {currentQuestion.options.map((option, index) => (
                <div key={option.id} className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-primary font-bold">البطاقة {index + 1}</span>
                    <button 
                      onClick={() => removeOption(option.id)}
                      className="text-slate-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs text-slate-400">الوجه الأمامي</label>
                      <div className="relative">
                        <input 
                          type="text" 
                          value={option.text}
                          onChange={(e) => updateOption(option.id, { text: e.target.value })}
                          placeholder="نص الوجه الأمامي"
                          className="w-full bg-background-dark border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white focus:border-primary outline-none text-sm"
                        />
                        <button onClick={() => triggerImageUpload('option', option.id)} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors">
                          <ImageIcon size={16} />
                        </button>
                      </div>
                      {option.image && (
                        <div className="relative inline-block">
                          <img src={option.image} alt="" className="h-16 rounded-lg object-cover" />
                          <button onClick={() => updateOption(option.id, { image: undefined })} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1">
                            <X size={12} />
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-slate-400">الوجه الخلفي</label>
                      <div className="relative">
                        <input 
                          type="text" 
                          value={option.matchText || ''}
                          onChange={(e) => updateOption(option.id, { matchText: e.target.value })}
                          placeholder="نص الوجه الخلفي"
                          className="w-full bg-background-dark border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white focus:border-primary outline-none text-sm"
                        />
                        <button onClick={() => triggerImageUpload('matchOption', option.id)} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors">
                          <ImageIcon size={16} />
                        </button>
                      </div>
                      {option.matchImage && (
                        <div className="relative inline-block">
                          <img src={option.matchImage} alt="" className="h-16 rounded-lg object-cover" />
                          <button onClick={() => updateOption(option.id, { matchImage: undefined })} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1">
                            <X size={12} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="checkbox"
                      checked={option.isCorrect || false}
                      onChange={(e) => updateOption(option.id, { isCorrect: e.target.checked })}
                      className="w-4 h-4 rounded border-white/20 bg-background-dark text-primary focus:ring-primary focus:ring-offset-background-dark"
                    />
                    <span className="text-sm text-slate-300">هل هذه البطاقة صحيحة؟</span>
                  </div>
                </div>
              ))}
            </div>
            
            <button 
              onClick={addOption}
              className="w-full py-3 border-2 border-dashed border-white/10 rounded-xl text-slate-400 hover:border-primary/50 hover:text-primary transition-all flex items-center justify-center gap-2"
            >
              <PlusCircle size={20} />
              إضافة بطاقة جديدة
            </button>
          </div>
        );
      case 'unjumble':
      case 'anagram':
        return (
          <div className="space-y-4">
            <label className="text-slate-400 text-sm block">
              {currentQuestion.type === 'unjumble' ? 'الجملة الصحيحة' : 'الكلمة الصحيحة'}
            </label>
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <input 
                  type="text" 
                  value={currentQuestion.options[0]?.text || ''}
                  onChange={(e) => {
                    if (currentQuestion.options.length === 0) {
                      addOption({ text: e.target.value, isCorrect: true });
                    } else {
                      updateOption(currentQuestion.options[0].id, { text: e.target.value, isCorrect: true });
                    }
                  }}
                  placeholder={currentQuestion.type === 'unjumble' ? 'أدخل الجملة هنا...' : 'أدخل الكلمة هنا...'}
                  className="w-full bg-background-dark border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary outline-none transition-colors"
                />
              </div>
            </div>
          </div>
        );
      case 'speaking_cards':
        return (
          <div className="space-y-4">
            <label className="text-slate-400 text-sm block">الجمل بالترتيب الصحيح</label>
            <div className="grid gap-3">
              {currentQuestion.options.map((option, index) => (
                <div key={option.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold shrink-0">
                    {index + 1}
                  </div>
                  <div className="flex-1 relative">
                    <input 
                      type="text" 
                      value={option.text}
                      onChange={(e) => updateOption(option.id, { text: e.target.value })}
                      placeholder={`الجملة رقم ${index + 1}`}
                      className="w-full bg-background-dark border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary outline-none transition-colors"
                    />
                  </div>
                  <button 
                    onClick={() => removeOption(option.id)}
                    className="text-slate-500 hover:text-red-400 transition-colors p-2"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
            
            <button 
              onClick={addOption}
              className="w-full py-3 border-2 border-dashed border-white/10 rounded-xl text-slate-400 hover:border-primary/50 hover:text-primary transition-all flex items-center justify-center gap-2"
            >
              <PlusCircle size={20} />
              إضافة جملة جديدة
            </button>
          </div>
        );
      default:
        return (
          <div className="space-y-4">
            <label className="text-slate-400 text-sm block">الخيارات</label>
            <div className="grid gap-3">
              {currentQuestion.options.map((option) => (
                <div key={option.id} className="flex items-center gap-3">
                  <button 
                    onClick={() => setCorrectOption(option.id)}
                    className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors",
                      option.isCorrect 
                        ? "bg-green-500/20 border border-green-500/50 text-green-500" 
                        : "bg-white/5 border border-white/20 text-transparent hover:border-white/40"
                    )}
                  >
                    <Check size={14} />
                  </button>
                  <div className="flex-1 relative flex gap-2">
                    <div className="relative flex-1">
                      <input 
                        type="text" 
                        value={option.text}
                        onChange={(e) => updateOption(option.id, { text: e.target.value })}
                        placeholder="أضف خياراً..."
                        className={cn(
                          "w-full bg-background-dark border rounded-xl pl-12 pr-4 py-3 text-white focus:border-primary outline-none transition-colors",
                          option.isCorrect ? "border-green-500/30" : "border-white/10"
                        )}
                      />
                      <button onClick={() => triggerImageUpload('option', option.id)} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors">
                        <ImageIcon size={18} />
                      </button>
                    </div>
                    {option.image && (
                      <div className="w-12 h-12 rounded-lg bg-black/50 overflow-hidden relative group shrink-0">
                        <img src={option.image} alt="" className="w-full h-full object-cover" />
                        <button onClick={() => updateOption(option.id, { image: undefined })} className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <X size={16} className="text-white" />
                        </button>
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={() => removeOption(option.id)}
                    className="text-slate-500 hover:text-red-400 transition-colors p-2"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
            
            <button 
              onClick={addOption}
              className="w-full py-3 border-2 border-dashed border-white/10 rounded-xl text-slate-400 hover:border-primary/50 hover:text-primary transition-all flex items-center justify-center gap-2"
            >
              <PlusCircle size={20} />
              إضافة خيار جديد
            </button>
          </div>
        );
    }
  };

  const renderPreview = () => {
    if (currentQuestion.type === 'find_match' || currentQuestion.type === 'match_up') {
      const items = currentQuestion.options.flatMap(o => [
        { text: o.text, image: o.image, id: `q-${o.id}`, isMatch: false },
        { text: o.matchText, image: o.matchImage, id: `a-${o.id}`, isMatch: true }
      ]).filter(i => i.text?.trim() !== '' || i.image);

      const shuffled = [...items].sort(() => Math.random() - 0.5);

      return (
        <div className="w-full bg-surface-dark/95 p-5 rounded-2xl border border-primary/30 shadow-xl mt-auto backdrop-blur-md">
          <p className="text-white text-center font-bold text-lg mb-5 leading-snug">
            {currentQuestion.text || (currentQuestion.type === 'find_match' ? 'صل كل بطاقة بما يطابقها' : 'ابحث عن الأزواج المتطابقة')}
          </p>
          <div className="grid grid-cols-2 gap-3">
            {shuffled.map((item, idx) => (
              <div 
                key={idx}
                className={cn(
                  "bg-white/5 border border-white/10 text-slate-300 p-3 rounded-xl text-center text-sm font-medium hover:bg-primary/20 hover:border-primary/50 transition-all cursor-pointer flex flex-col items-center justify-center min-h-[80px] gap-2",
                  currentQuestion.type === 'match_up' && "bg-primary/10 border-primary/30"
                )}
              >
                {currentQuestion.type === 'match_up' ? (
                  <div className="w-full h-full flex items-center justify-center text-primary/50">
                    <HelpCircle size={24} />
                  </div>
                ) : (
                  <>
                    {item.image && <img src={item.image} alt="" className="w-12 h-12 object-cover rounded-lg" />}
                    {item.text && <span>{item.text}</span>}
                  </>
                )}
              </div>
            ))}
            {items.length === 0 && (
              <div className="col-span-2 bg-white/5 border border-white/10 text-slate-500 p-3 rounded-xl text-center text-sm">
                أضف أزواجاً للسؤال
              </div>
            )}
          </div>
        </div>
      );
    }

    if (currentQuestion.type === 'group_sort') {
      return (
        <div className="w-full bg-surface-dark/95 p-5 rounded-2xl border border-primary/30 shadow-xl mt-auto backdrop-blur-md flex flex-col h-[400px]">
          <p className="text-white text-center font-bold text-lg mb-4 leading-snug shrink-0">
            {currentQuestion.text || 'صنف العناصر في المجموعات الصحيحة'}
          </p>
          
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2 shrink-0">
            {currentQuestion.groups?.map(g => (
              <div key={g.id} className="flex-1 min-w-[100px] bg-white/5 border border-white/20 rounded-xl p-2 text-center">
                <h4 className="text-white font-bold text-xs mb-2 border-b border-white/10 pb-1">{g.title}</h4>
                <div className="min-h-[60px] flex flex-col gap-1">
                  {/* Drop zone mock */}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-auto pt-4 border-t border-white/10">
            <p className="text-slate-400 text-xs text-center mb-2">اسحب العناصر للأعلى</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {currentQuestion.options.filter(o => o.text || o.image).map(o => (
                <div key={o.id} className="bg-primary text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-md cursor-grab flex items-center gap-1">
                  {o.image && <img src={o.image} alt="" className="w-4 h-4 rounded-sm object-cover" />}
                  {o.text}
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (currentQuestion.type === 'fill_blanks') {
      const parts = currentQuestion.text.split(/(\[.*?\])/g);
      return (
        <div className="w-full bg-surface-dark/95 p-5 rounded-2xl border border-primary/30 shadow-xl mt-auto backdrop-blur-md">
          <p className="text-white text-center font-bold text-lg mb-5 leading-snug">
            أكمل الفراغات في الجملة التالية:
          </p>
          <div className="bg-white/5 p-4 rounded-xl text-center leading-loose text-lg text-slate-200">
            {parts.map((part, i) => {
              if (part.startsWith('[') && part.endsWith(']')) {
                return (
                  <span key={i} className="inline-block mx-1 px-3 py-1 min-w-[60px] border-b-2 border-primary bg-primary/10 text-transparent rounded-t-md">
                    {part}
                  </span>
                );
              }
              return <span key={i}>{part}</span>;
            })}
            {parts.length <= 1 && <span className="text-slate-500 text-sm">اكتب جملة مع كلمات بين [أقواس]</span>}
          </div>
        </div>
      );
    }

    if (currentQuestion.type === 'maze') {
      return (
        <div className="w-full bg-surface-dark/95 p-5 rounded-2xl border border-primary/30 shadow-xl mt-auto backdrop-blur-md text-center">
          <p className="text-white font-bold text-lg mb-4 leading-snug">
            {currentQuestion.text || 'أوجد الطريق الصحيح'}
          </p>
          {currentQuestion.image ? (
            <img src={currentQuestion.image} alt="Maze Preview" className="w-full rounded-xl border border-white/10 mb-4" />
          ) : (
            <div className="w-full aspect-square bg-white/5 rounded-xl border border-white/10 flex items-center justify-center mb-4">
              <MapPin size={32} className="text-slate-500" />
            </div>
          )}
          <div className="bg-primary/20 text-primary py-2 rounded-xl font-bold text-sm">
            المسار: {currentQuestion.options[0]?.text || '...'}
          </div>
        </div>
      );
    }

    if (currentQuestion.type === 'find_match' || currentQuestion.type === 'match_up') {
      const allCards = currentQuestion.options.flatMap(o => [
        { text: o.text, image: o.image },
        { text: o.matchText, image: o.matchImage }
      ]).filter(c => c.text || c.image).slice(0, 4); // Show up to 4 cards in preview

      return (
        <div className="w-full bg-surface-dark/95 p-5 rounded-2xl border border-primary/30 shadow-xl mt-auto backdrop-blur-md">
          <p className="text-white text-center font-bold text-lg mb-5 leading-snug">
            {currentQuestion.text || 'طابق بين العناصر التالية'}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {allCards.map((card, idx) => (
              <div key={idx} className="bg-white/5 border border-white/10 p-3 rounded-xl text-center flex flex-col items-center justify-center gap-2 min-h-[80px]">
                {card.image && <img src={card.image} alt="" className="w-8 h-8 object-cover rounded" />}
                <span className="text-xs text-slate-300 font-medium">{card.text}</span>
              </div>
            ))}
            {allCards.length === 0 && (
              <div className="col-span-2 text-center text-slate-500 text-sm py-4">
                أضف أزواج للمطابقة
              </div>
            )}
          </div>
        </div>
      );
    }

    // Default preview (Multiple Choice / True False)
    return (
      <div className="w-full bg-surface-dark/95 p-5 rounded-2xl border border-primary/30 shadow-xl mt-auto backdrop-blur-md">
        {currentQuestion.image && (
          <img src={currentQuestion.image} alt="Question" className="w-full h-32 object-cover rounded-xl mb-4 border border-white/10" />
        )}
        <p className="text-white text-center font-bold text-lg mb-5 leading-snug">
          {currentQuestion.text || 'اكتب سؤالك هنا...'}
        </p>
        <div className="grid gap-2.5">
          {currentQuestion.options.filter(o => o.text.trim() !== '' || o.image).map((option, idx) => (
            <div 
              key={option.id}
              className={cn(
                "p-3 rounded-xl text-center text-sm font-medium transition-all flex items-center justify-center gap-2",
                idx === 0 
                  ? "bg-primary text-white shadow-md shadow-primary/20" 
                  : "bg-white/5 border border-white/10 text-slate-300"
              )}
            >
              {option.image && <img src={option.image} alt="" className="w-6 h-6 rounded object-cover" />}
              {option.text}
            </div>
          ))}
          {currentQuestion.options.filter(o => o.text.trim() !== '' || o.image).length === 0 && (
            <div className="bg-white/5 border border-white/10 text-slate-500 p-3 rounded-xl text-center text-sm">
              أضف خيارات للسؤال
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      <input 
        type="file" 
        accept="image/*" 
        className="hidden" 
        ref={fileInputRef} 
        onChange={handleImageUpload} 
      />
      {/* Header */}
      <header className="flex items-center bg-surface-dark/80 backdrop-blur-md sticky top-0 z-50 p-4 border-b border-primary/20 justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="text-primary flex w-10 h-10 shrink-0 items-center justify-center rounded-full bg-primary/10 hover:bg-primary/20 transition-colors">
            <ArrowRight size={20} />
          </button>
          <div>
            <h1 className="text-white text-lg font-bold leading-tight tracking-tight">نبراس - إعداد الاختبار</h1>
            <p className="text-primary text-xs">تخصيص تجربة التعلم التفاعلية</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => navigate('/preview', { 
              state: { 
                previewTest: {
                  id: existingTest?.id || 'preview',
                  name: testName || 'معاينة',
                  questions,
                  settings: existingTest?.settings || {}
                }
              } 
            })} 
            className="hidden sm:flex items-center justify-center rounded-xl h-10 px-4 bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all font-bold text-sm"
          >
            <Eye size={16} className="ml-2" />
            معاينة اللعبة
          </button>
          <button onClick={() => setShowSaveModal(true)} className="flex items-center justify-center rounded-xl h-10 px-4 bg-primary text-white hover:bg-primary/90 transition-all font-bold text-sm shadow-lg shadow-primary/20">
            <Save size={16} className="ml-2" />
            حفظ اللعبة
          </button>
        </div>
      </header>

      <div className="p-4 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-7xl mx-auto w-full">
        {/* Left Column: Configuration */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* Questions List Navigation */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
            {questions.map((q, idx) => (
              <button
                key={q.id}
                onClick={() => setCurrentQuestionIndex(idx)}
                className={cn(
                  "shrink-0 px-4 py-2 rounded-xl text-sm font-bold transition-all border flex items-center gap-2",
                  currentQuestionIndex === idx
                    ? "bg-primary text-white border-primary shadow-lg shadow-primary/20"
                    : "bg-surface-dark text-slate-400 border-white/10 hover:border-white/30"
                )}
              >
                {q.image && <ImageIcon size={14} />}
                سؤال {idx + 1}
              </button>
            ))}
            <button
              onClick={() => setShowTypeModal(true)}
              className="shrink-0 w-10 h-10 flex items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 transition-all"
            >
              <Plus size={20} />
            </button>
          </div>

          {/* Question Editor */}
          <section className="bg-surface-dark/50 p-6 rounded-3xl border border-white/5 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-32 h-32 bg-primary/5 rounded-full -translate-x-16 -translate-y-16"></div>
            
            <div className="flex items-center justify-between mb-6 relative z-10">
              <div className="flex items-center gap-2">
                <Edit3 className="text-primary" size={24} />
                <h2 className="text-white text-xl font-bold flex items-center gap-2">
                  تفاصيل السؤال {currentQuestionIndex + 1}
                  <span className="text-sm font-normal text-slate-400 mr-2 bg-white/5 px-2 py-1 rounded-md">
                    {QUESTION_TYPES.find(t => t.id === currentQuestion.type)?.name}
                  </span>
                </h2>
              </div>
              {questions.length > 1 && (
                <button 
                  onClick={() => {
                    const newQs = questions.filter((_, i) => i !== currentQuestionIndex);
                    setQuestions(newQs);
                    setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1));
                  }}
                  className="text-red-400 hover:text-red-300 bg-red-400/10 p-2 rounded-lg transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>

            <div className="space-y-6 relative z-10">
              {/* Question Input */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-slate-400 text-sm block">نص السؤال</label>
                  <button onClick={() => triggerImageUpload('question')} className="text-primary hover:text-primary/80 text-sm flex items-center gap-1">
                    <ImageIcon size={16} /> إضافة صورة للسؤال
                  </button>
                </div>
                {currentQuestion.image && (
                  <div className="relative w-full h-32 mb-2 rounded-xl overflow-hidden border border-white/10">
                    <img src={currentQuestion.image} alt="Question" className="w-full h-full object-cover" />
                    <button 
                      onClick={() => updateCurrentQuestion({ image: undefined })}
                      className="absolute top-2 right-2 bg-black/50 text-white p-1.5 rounded-lg hover:bg-red-500 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
                <textarea 
                  value={currentQuestion.text}
                  onChange={(e) => updateCurrentQuestion({ text: e.target.value })}
                  className="w-full bg-background-dark border border-white/10 rounded-xl p-4 text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-lg resize-none" 
                  placeholder="اكتب سؤالك هنا باللغة العربية..." 
                  rows={3}
                />
              </div>

              {/* Dynamic Options Editor */}
              {renderEditor()}

              {/* Settings Row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-slate-400 text-sm block">المؤقت (ثواني)</label>
                  <div className="relative">
                    <Timer className="absolute right-3 top-1/2 -translate-y-1/2 text-primary" size={18} />
                    <input 
                      type="number" 
                      value={currentQuestion.timer}
                      onChange={(e) => updateCurrentQuestion({ timer: Number(e.target.value) })}
                      className="w-full bg-background-dark border border-white/10 rounded-xl pr-10 pl-4 py-3 text-white focus:border-primary outline-none" 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-slate-400 text-sm block">النقاط</label>
                  <div className="relative">
                    <Star className="absolute right-3 top-1/2 -translate-y-1/2 text-accent-gold" size={18} />
                    <input 
                      type="number" 
                      value={currentQuestion.points}
                      onChange={(e) => updateCurrentQuestion({ points: Number(e.target.value) })}
                      className="w-full bg-background-dark border border-white/10 rounded-xl pr-10 pl-4 py-3 text-white focus:border-primary outline-none" 
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-white/5 relative z-10 flex flex-col gap-3">
              <button 
                onClick={() => addNewQuestion(currentQuestion.type)}
                className="bg-surface-dark hover:bg-white/5 text-white w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all border border-white/10"
              >
                <Copy size={20} />
                إضافة سؤال من نفس النوع
              </button>
              <button 
                onClick={() => setShowTypeModal(true)}
                className="bg-primary/10 hover:bg-primary/20 text-primary w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
              >
                <Plus size={20} />
                إضافة سؤال جديد للقائمة
              </button>
            </div>
          </section>
        </div>

        {/* Right Column: Live Preview */}
        <div className="lg:col-span-5 space-y-6">
          <div className="sticky top-24">
            <div className="flex items-center gap-2 mb-4">
              <Eye className="text-primary" size={24} />
              <h2 className="text-white text-xl font-bold">معاينة مباشرة</h2>
            </div>
            
            {/* Preview Card */}
            <div className="aspect-[9/16] max-h-[700px] w-full max-w-sm mx-auto bg-background-dark rounded-[2.5rem] border-[8px] border-surface-dark shadow-2xl overflow-hidden relative group">
              {/* Game UI Mockup */}
              <div className="absolute inset-0 bg-gradient-to-b from-primary/20 to-background-dark p-6 flex flex-col items-center">
                
                {/* Top Stats */}
                <div className="w-full flex justify-between items-center mb-8 shrink-0">
                  <div className="bg-black/40 px-3 py-1.5 rounded-full text-white text-xs flex items-center gap-1 font-mono">
                    <Star size={14} className="text-accent-gold fill-accent-gold" /> {currentQuestion.points * 25}
                  </div>
                  <div className="w-12 h-12 rounded-full border-4 border-primary bg-background-dark flex items-center justify-center shadow-lg shadow-primary/20">
                    <span className="text-white font-bold text-lg">{currentQuestion.timer}</span>
                  </div>
                  <div className="bg-black/40 px-3 py-1.5 rounded-full text-white text-xs flex items-center gap-1 font-mono">
                    <User size={14} className="text-primary" /> {currentQuestionIndex + 1}/{questions.length}
                  </div>
                </div>

                {/* Dynamic Preview Overlay */}
                {renderPreview()}
              </div>
              
              {/* Decorative Overlay */}
              <div className="absolute inset-0 pointer-events-none border border-primary/20 rounded-[2rem]"></div>
            </div>

            <div className="mt-6 flex items-center justify-center gap-4 text-slate-500 text-xs">
              <div className="flex items-center gap-1.5">
                <Smartphone size={16} /> وضع الجوال
              </div>
              <div className="w-px h-4 bg-white/10"></div>
              <button className="flex items-center gap-1.5 hover:text-primary transition-colors">
                <RefreshCw size={16} /> تحديث المعاينة
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Select Question Type Modal */}
      {showTypeModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-surface-dark border border-white/10 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
            <div className="p-6 border-b border-white/10 flex justify-between items-center shrink-0">
              <div>
                <h2 className="text-xl font-bold text-white">اختر نوع السؤال</h2>
                <p className="text-slate-400 text-sm mt-1">اختر القالب المناسب لسؤالك الجديد</p>
              </div>
              <button onClick={() => setShowTypeModal(false)} className="text-slate-400 hover:text-white bg-white/5 p-2 rounded-full">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {QUESTION_TYPES.map((type) => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.id}
                      onClick={() => addNewQuestion(type.id)}
                      className="flex items-start gap-4 p-4 rounded-2xl bg-background-dark border border-white/5 hover:border-primary/50 hover:bg-primary/5 transition-all text-right group"
                    >
                      <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                        <Icon size={24} />
                      </div>
                      <div>
                        <h3 className="text-white font-bold mb-1">{type.name}</h3>
                        <p className="text-slate-400 text-xs leading-relaxed">{type.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-surface-dark border border-white/10 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">حفظ الاختبار</h2>
              <button onClick={() => {setShowSaveModal(false); setSavedTest(null);}} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {!savedTest ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-slate-300 text-sm font-medium block">اسم الاختبار</label>
                    <input 
                      type="text" 
                      value={testName}
                      onChange={(e) => setTestName(e.target.value)}
                      className="w-full bg-background-dark border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary outline-none transition-all"
                      placeholder="مثال: اختبار السيرة النبوية"
                    />
                  </div>
                  <button 
                    onClick={handleSave}
                    disabled={!testName.trim()}
                    className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl shadow-lg shadow-primary/20 transition-all"
                  >
                    حفظ ونشر
                  </button>
                </div>
              ) : (
                <div className="space-y-6 text-center">
                  <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-white">تم حفظ الاختبار بنجاح!</h3>
                  
                  <div className="space-y-3 text-right">
                    <div className="space-y-1">
                      <label className="text-slate-400 text-xs">رابط الاختبار</label>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          readOnly 
                          value={savedTest.link}
                          className="flex-1 bg-background-dark border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                          dir="ltr"
                        />
                        <button 
                          onClick={() => navigator.clipboard.writeText(savedTest.link)}
                          className="p-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
                        >
                          <Copy size={18} />
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-400 text-xs">كود الدخول</label>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          readOnly 
                          value={savedTest.code}
                          className="flex-1 bg-background-dark border border-white/10 rounded-lg px-3 py-2 text-white text-sm font-mono text-center tracking-widest"
                          dir="ltr"
                        />
                        <button 
                          onClick={() => navigator.clipboard.writeText(savedTest.code)}
                          className="p-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
                        >
                          <Copy size={18} />
                        </button>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => navigate('/')}
                    className="w-full bg-surface-dark border border-white/10 hover:bg-white/5 text-white font-bold py-3 rounded-xl transition-all"
                  >
                    العودة للوحة التحكم
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
