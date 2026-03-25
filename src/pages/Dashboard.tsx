import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Upload, FileText, Users, Calendar, Settings, Copy, Link as LinkIcon, FileSpreadsheet, File as FileWord, MoreVertical, Edit, Trash2, BarChart2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStore, Test, TestSettings } from '@/store/useStore';
import { exportToExcel, exportToPDF, exportQuestionsToPDF, exportToWord, importFromExcel } from '@/lib/exportUtils';

export function Dashboard() {
  const navigate = useNavigate();
  const { tests, deleteTest, deleteTests, updateTest, addTest } = useStore();
  
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedTest, setSelectedTest] = useState<Test | null>(null);
  const [settingsState, setSettingsState] = useState<TestSettings>({});
  const [testName, setTestName] = useState('');
  const [settingsWarning, setSettingsWarning] = useState('');
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleTestSelection = (id: string) => {
    setSelectedTests(prev => 
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = () => {
    if (window.confirm(`هل أنت متأكد من حذف ${selectedTests.length} اختبار؟`)) {
      deleteTests(selectedTests);
      setSelectedTests([]);
    }
  };

  const toggleMenu = (id: string) => {
    if (activeMenu === id) setActiveMenu(null);
    else setActiveMenu(id);
  };

  const openSettings = (test: Test) => {
    setSelectedTest(test);
    setTestName(test.name);
    setSettingsState(test.settings || {});
    setSettingsWarning('');
    setShowSettings(true);
    setActiveMenu(null);
  };

  const saveSettings = () => {
    if (selectedTest) {
      let finalQuestions = selectedTest.questions;
      
      // Check for incompatible questions if limitOneResponse is true
      if (settingsState.limitOneResponse) {
        const incompatibleTypes = ['find_match', 'anagram', 'unjumble', 'speaking_cards'];
        const hasIncompatible = selectedTest.questions.some(q => incompatibleTypes.includes(q.type));
        
        if (hasIncompatible) {
          if (window.confirm('تنبيه: هذا الاختبار يحتوي على أسئلة لا تدعم خاصية "التقيد برد واحد". هل تريد الاستمرار وحذف هذه الأسئلة من الاختبار؟')) {
            finalQuestions = selectedTest.questions.filter(q => !incompatibleTypes.includes(q.type));
          } else {
            return; // Cancel save
          }
        }
      }

      updateTest(selectedTest.id, { 
        name: testName,
        settings: settingsState,
        questions: finalQuestions
      });
      setShowSettings(false);
    }
  };

  const handleExport = async (test: Test, format: 'excel' | 'pdf' | 'word') => {
    const safeImageString = (img: string | undefined) => {
      if (!img) return '';
      if (img.length > 32000) return '[صورة مضمنة]';
      return img;
    };

    const data = test.questions.map(q => {
      const row: any = {
        'نوع السؤال': q.type,
        'نص السؤال': q.text,
        'الوقت': q.timer,
        'النقاط': q.points,
      };

      if (q.image) {
        row['صورة السؤال'] = safeImageString(q.image);
      }

      if (q.speed) {
        row['السرعة'] = q.speed;
      }

      if (q.type === 'multiple_choice' || q.type === 'true_false_speed' || q.type === 'true_false' || q.type === 'fill_blanks') {
        q.options?.forEach((o: any, i: number) => {
          row[`خيار ${i + 1}`] = o.text || '';
          if (o.image) row[`صورة خيار ${i + 1}`] = safeImageString(o.image);
          row[`صحيح ${i + 1}`] = o.isCorrect ? 'نعم' : 'لا';
        });
      } else if (q.type === 'group_sort') {
        row['المجموعات'] = q.groups?.map((g: any) => `${g.id}:${g.title}`).join('|') || '';
        q.options?.forEach((o: any, i: number) => {
          row[`عنصر ${i + 1}`] = o.text || '';
          row[`مجموعة ${i + 1}`] = o.groupId || '';
          if (o.image) row[`صورة عنصر ${i + 1}`] = safeImageString(o.image);
        });
      } else if (q.type === 'maze_chase') {
        const opt = q.options?.[0] || {};
        row['صورة المتاهة'] = safeImageString(opt.image);
        row['مسار المتاهة'] = opt.text || ''; // JSON string of coordinates
      } else if (q.type === 'labelled_diagram') {
        const opt = q.options?.[0] || {};
        row['صورة المخطط'] = safeImageString(opt.image);
        
        // Extract domain and filename if possible
        if (opt.image) {
          try {
            const url = new URL(opt.image);
            row['نطاق الصورة'] = url.hostname;
            row['اسم ملف الصورة'] = url.pathname.split('/').pop() || '';
          } catch (e) {
            row['نطاق الصورة'] = '';
            row['اسم ملف الصورة'] = '';
          }
        }
        
        q.options?.slice(1).forEach((o: any, i: number) => {
          row[`معرف النقطة ${i + 1}`] = o.id;
          row[`اسم النقطة ${i + 1}`] = o.text || '';
          row[`إحداثيات النقطة ${i + 1}`] = `${o.x}, ${o.y}`;
        });
      } else {
        // find_match, flash_cards, match_up, matching_pairs, etc.
        q.options?.forEach((o: any, i: number) => {
          row[`عنصر ${i + 1}`] = o.text || '';
          row[`مطابق ${i + 1}`] = o.matchText || '';
          if (o.image) row[`صورة عنصر ${i + 1}`] = safeImageString(o.image);
          if (o.matchImage) row[`صورة مطابق ${i + 1}`] = safeImageString(o.matchImage);
          if (q.type === 'flash_cards') {
            row[`صحيح ${i + 1}`] = o.isCorrect ? 'نعم' : 'لا';
          }
        });
      }

      return row;
    });

    const title = `أسئلة اختبار: ${test.name}`;
    const filename = `test_${test.id}_questions`;

    if (format === 'excel') {
      exportToExcel(data, filename);
    } else if (format === 'pdf') {
      exportQuestionsToPDF(test.questions, filename, title, test.settings?.theme);
    } else if (format === 'word') {
      await exportToWord(test.questions, filename, title);
    }
    setActiveMenu(null);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const data = await importFromExcel(file);
        // Map imported data to questions format
        const questions = data.map((row: any, index: number) => {
          const type = row['نوع السؤال'] || row['Type'] || 'multiple_choice';
          const q: any = {
            id: Date.now().toString() + index,
            type: type,
            text: row['نص السؤال'] || row['Question'] || '',
            image: row['صورة السؤال'] || row['Question Image'] || undefined,
            timer: row['الوقت'] || row['Timer'] || 30,
            points: row['النقاط'] || row['Points'] || 100,
            speed: row['السرعة'] || row['Speed'] || undefined,
            options: []
          };

          if (type === 'multiple_choice' || type === 'true_false_speed' || type === 'true_false' || type === 'fill_blanks') {
            let i = 1;
            while (row[`خيار ${i}`] !== undefined || row[`Option ${i}`] !== undefined) {
              q.options.push({
                id: i,
                text: row[`خيار ${i}`] || row[`Option ${i}`] || '',
                image: row[`صورة خيار ${i}`] || row[`Option Image ${i}`] || undefined,
                isCorrect: (row[`صحيح ${i}`] || row[`Correct ${i}`]) === 'نعم' || (row[`صحيح ${i}`] || row[`Correct ${i}`]) === 'Yes'
              });
              i++;
            }
            // Fallback for old format
            if (q.options.length === 0) {
              const optionsStr = row['الخيارات'] || row['Options'] || '';
              const correctStr = row['الإجابة الصحيحة'] || row['Correct Answer'] || '';
              q.options = optionsStr.split(',').map((opt: string, i: number) => ({
                id: i + 1,
                text: opt.trim(),
                isCorrect: correctStr.includes(opt.trim())
              }));
            }
          } else if (type === 'group_sort') {
            const groupsStr = row['المجموعات'] || row['Groups'] || '';
            q.groups = groupsStr.split('|').filter(Boolean).map((g: string) => {
              const [id, title] = g.split(':');
              return { id: Number(id), title };
            });
            
            let i = 1;
            while (row[`عنصر ${i}`] !== undefined || row[`Item${i}`] !== undefined) {
              q.options.push({
                id: i,
                text: row[`عنصر ${i}`] || row[`Item${i}`] || '',
                groupId: Number(row[`مجموعة ${i}`] || row[`Group${i}`]) || undefined,
                image: row[`صورة عنصر ${i}`] || row[`صورة ${i}`] || row[`Image${i}`] || undefined
              });
              i++;
            }
          } else if (type === 'maze_chase') {
            q.options.push({
              id: 1,
              image: row['صورة المتاهة'] || row['صورة'] || row['Image URL'] || row['Image Source'] || row['Image'] || undefined,
              text: row['مسار المتاهة'] || row['مسار'] || row['Drawn Path Coordinates'] || row['Path'] || ''
            });
          } else if (type === 'labelled_diagram') {
            q.options.push({
              id: 1,
              image: row['صورة المخطط'] || row['صورة'] || row['Image URL'] || row['Image Source'] || row['Image'] || undefined,
              text: ''
            });
            let i = 1;
            while (row[`اسم النقطة ${i}`] !== undefined || row[`نقطة ${i}`] !== undefined || row[`Point Names ${i}`] || row[`Point${i}`] !== undefined) {
              let coords = { x: 50, y: 50 };
              const coordsStr = row[`إحداثيات النقطة ${i}`] || row[`إحداثيات ${i}`] || row[`Point Coordinates ${i}`] || row[`Coordinates${i}`];
              if (coordsStr) {
                if (typeof coordsStr === 'string' && coordsStr.includes(',')) {
                  const [x, y] = coordsStr.split(',').map(s => parseFloat(s.trim()));
                  if (!isNaN(x) && !isNaN(y)) {
                    coords = { x, y };
                  }
                } else {
                  try {
                    coords = JSON.parse(coordsStr);
                  } catch (e) {}
                }
              }
              q.options.push({
                id: row[`معرف النقطة ${i}`] || i + 1,
                text: row[`اسم النقطة ${i}`] || row[`نقطة ${i}`] || row[`Point Names ${i}`] || row[`Point${i}`] || '',
                x: coords.x,
                y: coords.y
              });
              i++;
            }
          } else {
            // find_match, flash_cards, match_up, matching_pairs
            let i = 1;
            while (
              row[`عنصر ${i}`] !== undefined || 
              row[`مطابق ${i}`] !== undefined || 
              row[`MovingCard${i}`] !== undefined || 
              row[`Answer${i}`] !== undefined ||
              row[`FrontCard${i}`] !== undefined ||
              row[`BackCard${i}`] !== undefined ||
              row[`ColumnA${i}`] !== undefined ||
              row[`ColumnB${i}`] !== undefined
            ) {
              q.options.push({
                id: i,
                text: row[`عنصر ${i}`] || row[`MovingCard${i}`] || row[`FrontCard${i}`] || row[`ColumnA${i}`] || '',
                matchText: row[`مطابق ${i}`] || row[`Answer${i}`] || row[`BackCard${i}`] || row[`ColumnB${i}`] || '',
                image: row[`صورة عنصر ${i}`] || row[`صورة ${i}`] || row[`Image${i}`] || undefined,
                matchImage: row[`صورة مطابق ${i}`] || row[`MatchImage${i}`] || undefined,
                isCorrect: (row[`صحيح ${i}`] || row[`IsCorrect${i}`]) === 'نعم' || (row[`صحيح ${i}`] || row[`IsCorrect${i}`]) === 'True' || (row[`صحيح ${i}`] || row[`IsCorrect${i}`]) === true
              });
              i++;
            }
          }

          return q;
        });

        const newTest: Test = {
          id: Date.now().toString(),
          name: file.name.replace(/\.[^/.]+$/, ""),
          questions,
          students: 0,
          date: new Date().toISOString().split('T')[0],
          status: 'نشط',
          code: Math.random().toString(36).substring(2, 7).toUpperCase(),
          settings: {}
        };

        addTest(newTest);
        alert('تم استيراد الأسئلة بنجاح!');
      } catch (error) {
        alert('حدث خطأ أثناء استيراد الملف.');
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold text-primary mb-2">لوحة التحكم</h1>
          <p className="text-slate-400 text-lg">إدارة الاختبارات والألعاب التعليمية</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto flex-wrap justify-end">
          {selectedTests.length > 0 && (
            <button 
              onClick={handleBulkDelete}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl hover:bg-red-500/30 transition-colors font-bold text-sm"
            >
              <Trash2 size={18} />
              حذف المحدد ({selectedTests.length})
            </button>
          )}
          <input 
            type="file" 
            accept=".xlsx, .xls" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleImport} 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-surface-dark border border-white/10 rounded-xl hover:bg-white/5 transition-colors font-bold text-sm"
          >
            <Upload size={18} />
            استيراد من Excel
          </button>
          <Link to="/create" className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors font-bold text-sm shadow-lg shadow-primary/20">
            <Plus size={18} />
            إنشاء اختبار جديد
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {Array.from(new Map(tests.map(t => [t.id, t])).values()).map((test) => (
          <div key={test.id} className={cn("bg-surface-dark/60 border hover:border-primary/30 rounded-3xl p-6 transition-all relative group", selectedTests.includes(test.id) ? "border-primary/50" : "border-white/5")}>
            <div className="absolute top-4 right-4 z-10">
              <input 
                type="checkbox" 
                checked={selectedTests.includes(test.id)}
                onChange={() => toggleTestSelection(test.id)}
                className="w-5 h-5 rounded border-white/20 bg-background-dark text-primary focus:ring-primary focus:ring-offset-background-dark"
              />
            </div>
            <div className="flex justify-between items-start mb-4 pr-8">
              <h3 className="text-xl font-bold text-white">{test.name}</h3>
              <div className="relative">
                <button onClick={() => toggleMenu(test.id)} className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                  <MoreVertical size={20} />
                </button>
                
                {activeMenu === test.id && (
                  <div className="absolute left-0 top-full mt-2 w-56 bg-surface-dark border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden py-2">
                    <button onClick={() => navigate(`/create?id=${test.id}`)} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors">
                      <Edit size={16} /> تعديل الاختبار
                    </button>
                    <button onClick={() => navigate(`/reports?id=${test.id}`)} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors">
                      <BarChart2 size={16} /> تقارير الاختبار
                    </button>
                    <button onClick={() => openSettings(test)} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors">
                      <Settings size={16} /> الإعدادات
                    </button>
                    <div className="h-px bg-white/10 my-2"></div>
                    <button onClick={() => handleExport(test, 'pdf')} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors">
                      <FileText size={16} /> تصدير PDF
                    </button>
                    <button onClick={() => handleExport(test, 'excel')} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors">
                      <FileSpreadsheet size={16} /> تصدير Excel
                    </button>
                    <button onClick={() => handleExport(test, 'word')} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors">
                      <FileWord size={16} /> تصدير Word
                    </button>
                    <div className="h-px bg-white/10 my-2"></div>
                    <button onClick={() => deleteTest(test.id)} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors">
                      <Trash2 size={16} /> حذف الاختبار
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <FileText size={16} className="text-primary" />
                <span>{test.questions?.length || 0} سؤال</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <Users size={16} className="text-accent-gold" />
                <span>{test.students} طالب</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400 text-sm col-span-2">
                <Calendar size={16} className="text-purple-400" />
                <span>تاريخ الإنشاء: {test.date}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(test.code);
                  alert('تم نسخ الكود!');
                }}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-background-dark border border-white/5 rounded-lg text-slate-300 hover:text-white hover:border-primary/30 transition-colors text-sm font-medium"
              >
                <Copy size={16} />
                كود: {test.code}
              </button>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/student/login`);
                  alert('تم نسخ الرابط!');
                }}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-background-dark border border-white/5 rounded-lg text-slate-300 hover:text-white hover:border-primary/30 transition-colors text-sm font-medium"
              >
                <LinkIcon size={16} />
                نسخ الرابط
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-surface-dark border border-white/10 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">إعدادات الاختبار</h2>
              <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-white">
                <Trash2 size={20} className="rotate-45" />
              </button>
            </div>
            
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
              {settingsWarning && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-start gap-3">
                  <AlertCircle size={20} className="shrink-0 mt-0.5" />
                  <p className="text-sm leading-relaxed">{settingsWarning}</p>
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-slate-400 text-sm">اسم الاختبار</label>
                  <input 
                    type="text" 
                    value={testName}
                    onChange={(e) => setTestName(e.target.value)}
                    className="w-full bg-background-dark border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-primary outline-none text-sm" 
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-slate-400 text-sm">لون الاختبار</label>
                    <input 
                      type="color" 
                      value={settingsState.theme?.color || '#3b82f6'}
                      onChange={(e) => setSettingsState({...settingsState, theme: {...settingsState.theme, color: e.target.value}})}
                      className="w-full h-10 bg-background-dark border border-white/10 rounded-xl px-2 py-1 cursor-pointer" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-slate-400 text-sm">لون الخلفية</label>
                    <input 
                      type="color" 
                      value={settingsState.theme?.background || '#020617'}
                      onChange={(e) => setSettingsState({...settingsState, theme: {...settingsState.theme, background: e.target.value}})}
                      className="w-full h-10 bg-background-dark border border-white/10 rounded-xl px-2 py-1 cursor-pointer" 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-slate-400 text-sm">صورة الخلفية (رابط)</label>
                  <input 
                    type="text" 
                    placeholder="https://example.com/image.jpg"
                    value={settingsState.theme?.backgroundImage || ''}
                    onChange={(e) => setSettingsState({...settingsState, theme: {...settingsState.theme, backgroundImage: e.target.value}})}
                    className="w-full bg-background-dark border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-primary outline-none text-sm" 
                  />
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                  <div>
                    <h4 className="text-white font-medium">متاح دائماً</h4>
                    <p className="text-slate-400 text-xs mt-1">يمكن للطلاب الدخول في أي وقت</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={settingsState.isAlwaysOpen !== false}
                      onChange={(e) => setSettingsState({...settingsState, isAlwaysOpen: e.target.checked})}
                    />
                    <div className="w-11 h-6 bg-background-dark peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>

                {settingsState.isAlwaysOpen === false && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-slate-400 text-sm">وقت الفتح</label>
                      <input 
                        type="datetime-local" 
                        value={settingsState.openTime || ''}
                        onChange={(e) => setSettingsState({...settingsState, openTime: e.target.value})}
                        className="w-full bg-background-dark border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-primary outline-none text-sm" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-slate-400 text-sm">وقت الإغلاق</label>
                      <input 
                        type="datetime-local" 
                        value={settingsState.closeTime || ''}
                        onChange={(e) => setSettingsState({...settingsState, closeTime: e.target.value})}
                        className="w-full bg-background-dark border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-primary outline-none text-sm" 
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                  <div>
                    <h4 className="text-white font-medium">إغلاق الاختبار يدوياً</h4>
                    <p className="text-slate-400 text-xs mt-1">إيقاف استقبال الردود فوراً</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={settingsState.manualClose || false}
                      onChange={(e) => setSettingsState({...settingsState, manualClose: e.target.checked})}
                    />
                    <div className="w-11 h-6 bg-background-dark peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                  <div>
                    <h4 className="text-white font-medium">إظهار الإجابات الصحيحة</h4>
                    <p className="text-slate-400 text-xs mt-1">بعد انتهاء الطالب من الاختبار</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={settingsState.showAnswers !== false}
                      onChange={(e) => setSettingsState({...settingsState, showAnswers: e.target.checked})}
                    />
                    <div className="w-11 h-6 bg-background-dark peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                  <div>
                    <h4 className="text-white font-medium">التقيد برد واحد</h4>
                    <p className="text-slate-400 text-xs mt-1">يسمح للطالب باختبار واحد فقط</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={settingsState.limitOneResponse || false}
                      onChange={(e) => {
                        setSettingsWarning('');
                        setSettingsState({...settingsState, limitOneResponse: e.target.checked});
                      }}
                    />
                    <div className="w-11 h-6 bg-background-dark peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                  <div>
                    <h4 className="text-white font-medium">ترتيب عشوائي للأسئلة</h4>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={settingsState.randomizeQuestions !== false}
                      onChange={(e) => setSettingsState({...settingsState, randomizeQuestions: e.target.checked})}
                    />
                    <div className="w-11 h-6 bg-background-dark peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                  <div>
                    <h4 className="text-white font-medium">ترتيب عشوائي للإجابات</h4>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={settingsState.randomizeOptions !== false}
                      onChange={(e) => setSettingsState({...settingsState, randomizeOptions: e.target.checked})}
                    />
                    <div className="w-11 h-6 bg-background-dark peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>

                <div className="pt-4 border-t border-white/5 space-y-4">
                  <h4 className="text-white font-medium">مظهر الاختبار</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-slate-400 text-sm">لون الاختبار (الأساسي)</label>
                      <div className="flex items-center gap-2">
                        <input 
                          type="color" 
                          value={settingsState.theme?.color || '#00d2ff'}
                          onChange={(e) => setSettingsState({
                            ...settingsState, 
                            theme: { ...settingsState.theme, color: e.target.value }
                          })}
                          className="w-10 h-10 rounded cursor-pointer bg-transparent border-0 p-0" 
                        />
                        <span className="text-white text-sm" dir="ltr">{settingsState.theme?.color || '#00d2ff'}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-slate-400 text-sm">لون الخلفية</label>
                      <div className="flex items-center gap-2">
                        <input 
                          type="color" 
                          value={settingsState.theme?.background || '#0a0a0a'}
                          onChange={(e) => setSettingsState({
                            ...settingsState, 
                            theme: { ...settingsState.theme, background: e.target.value }
                          })}
                          className="w-10 h-10 rounded cursor-pointer bg-transparent border-0 p-0" 
                        />
                        <span className="text-white text-sm" dir="ltr">{settingsState.theme?.background || '#0a0a0a'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-slate-400 text-sm">صورة الخلفية (رابط)</label>
                    <input 
                      type="text" 
                      value={settingsState.theme?.backgroundImage || ''}
                      onChange={(e) => setSettingsState({
                        ...settingsState, 
                        theme: { ...settingsState.theme, backgroundImage: e.target.value }
                      })}
                      placeholder="https://example.com/image.jpg"
                      className="w-full bg-background-dark border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-primary outline-none text-sm" dir="ltr"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-white/10 flex gap-3">
              <button onClick={() => setShowSettings(false)} className="flex-1 py-3 bg-background-dark text-white rounded-xl hover:bg-white/5 transition-colors font-bold">
                إلغاء
              </button>
              <button onClick={saveSettings} className="flex-1 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors font-bold shadow-lg shadow-primary/20">
                حفظ الإعدادات
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
