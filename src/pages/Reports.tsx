import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Download, FileSpreadsheet, FileText, Search, Filter, ChevronDown, User, Star, Clock, Phone, X, CheckCircle2, XCircle, Trash2, Edit2, Save } from 'lucide-react';
import { exportToExcel, exportReportsToExcel, exportToPDF, exportStudentReportToPDF, exportStudentReportToExcel } from '@/lib/exportUtils';
import { useStore, Report } from '@/store/useStore';

export function Reports() {
  const [searchParams] = useSearchParams();
  const testIdParam = searchParams.get('id');
  
  const { reports, tests, deleteReport, deleteReports, updateReport } = useStore();
  const [selectedStudent, setSelectedStudent] = useState<Report | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTestId, setFilterTestId] = useState<string>(testIdParam || 'all');
  const [sortBy, setSortBy] = useState<'highest' | 'lowest' | 'newest'>('newest');
  const [editingScoreId, setEditingScoreId] = useState<string | null>(null);
  const [editScoreValue, setEditScoreValue] = useState<string>('');
  const [selectedReports, setSelectedReports] = useState<string[]>([]);

  const toggleReportSelection = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedReports(prev => 
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = () => {
    if (window.confirm(`هل أنت متأكد من حذف ${selectedReports.length} تقرير؟`)) {
      deleteReports(selectedReports);
      setSelectedReports([]);
      if (selectedStudent && selectedReports.includes(selectedStudent.id)) {
        setSelectedStudent(null);
      }
    }
  };

  useEffect(() => {
    if (testIdParam) {
      setFilterTestId(testIdParam);
    }
  }, [testIdParam]);

  const filteredAndSortedReports = useMemo(() => {
    // Deduplicate reports by ID to prevent React key errors
    const uniqueReportsMap = new Map();
    reports.forEach(r => uniqueReportsMap.set(r.id, r));
    let result = Array.from(uniqueReportsMap.values());

    // Filter by test
    if (filterTestId !== 'all') {
      result = result.filter(r => r.testId === filterTestId);
    }

    // Search
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(r => 
        r.name.toLowerCase().includes(lowerSearch) || 
        r.phone.includes(lowerSearch) ||
        tests.find(t => t.id === r.testId)?.name.toLowerCase().includes(lowerSearch)
      );
    }

    // Sort
    if (sortBy === 'highest') {
      result.sort((a, b) => b.score - a.score);
    } else if (sortBy === 'lowest') {
      result.sort((a, b) => a.score - b.score);
    } else {
      result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }

    return result;
  }, [reports, filterTestId, searchTerm, sortBy, tests]);

  const handleExportExcel = () => {
    const testName = filterTestId === 'all' ? 'جميع_التقارير' : (tests.find(t => t.id === filterTestId)?.name || 'اختبار');
    const dataToExport = selectedReports.length > 0 
      ? filteredAndSortedReports.filter(r => selectedReports.includes(r.id))
      : filteredAndSortedReports;
    exportReportsToExcel(dataToExport, tests, `reports_${testName}`);
  };

  const handleExportPDF = () => {
    const title = filterTestId === 'all' ? 'تقارير جميع الطلاب' : `تقارير اختبار: ${tests.find(t => t.id === filterTestId)?.name || ''}`;
    const dataToExport = selectedReports.length > 0 
      ? filteredAndSortedReports.filter(r => selectedReports.includes(r.id))
      : filteredAndSortedReports;
    exportToPDF(dataToExport, ['name', 'phone', 'score', 'time', 'date', 'status'], 'reports', title);
  };

  const handleExportStudentExcel = () => {
    if (selectedStudent) {
      const test = tests.find(t => t.id === selectedStudent.testId);
      exportStudentReportToExcel(selectedStudent, test, `student_${selectedStudent.name}_report`);
    }
  };

  const handleExportStudentPDF = () => {
    if (selectedStudent) {
      const test = tests.find(t => t.id === selectedStudent.testId);
      exportStudentReportToPDF(selectedStudent, test, `student_${selectedStudent.name}_report`, `تقرير الطالب: ${selectedStudent.name}`);
    }
  };

  const handleSaveScore = (id: string) => {
    const newScore = parseInt(editScoreValue);
    if (!isNaN(newScore) && newScore >= 0 && newScore <= 100) {
      updateReport(id, { score: newScore });
    }
    setEditingScoreId(null);
  };

  const handleDeleteReport = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('هل أنت متأكد من حذف هذا التقرير؟')) {
      deleteReport(id);
      if (selectedStudent?.id === id) setSelectedStudent(null);
    }
  };

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">تقارير الطلاب</h1>
          <p className="text-slate-400">نظرة عامة على أداء الطلاب ونتائج الاختبارات</p>
        </div>
        
        <div className="flex gap-3 w-full md:w-auto flex-wrap justify-end">
          {selectedReports.length > 0 && (
            <button 
              onClick={handleBulkDelete}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl hover:bg-red-500/30 transition-colors font-medium text-sm"
            >
              <Trash2 size={18} />
              حذف المحدد ({selectedReports.length})
            </button>
          )}
          <button 
            onClick={handleExportExcel}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600/20 text-green-500 border border-green-600/30 rounded-xl hover:bg-green-600/30 transition-colors font-medium text-sm"
          >
            <FileSpreadsheet size={18} />
            تصدير Excel
          </button>
          <button 
            onClick={handleExportPDF}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600/20 text-red-500 border border-red-600/30 rounded-xl hover:bg-red-600/30 transition-colors font-medium text-sm"
          >
            <FileText size={18} />
            تصدير PDF
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-surface-dark border border-white/5 rounded-2xl p-6 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <User size={28} />
          </div>
          <div>
            <p className="text-slate-400 text-sm mb-1">إجمالي الطلاب</p>
            <h3 className="text-3xl font-bold text-white">{filteredAndSortedReports.length}</h3>
          </div>
        </div>
        <div className="bg-surface-dark border border-white/5 rounded-2xl p-6 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-accent-gold/10 flex items-center justify-center text-accent-gold">
            <Star size={28} />
          </div>
          <div>
            <p className="text-slate-400 text-sm mb-1">متوسط الدرجات</p>
            <h3 className="text-3xl font-bold text-white">
              {filteredAndSortedReports.length > 0 ? Math.round(filteredAndSortedReports.reduce((acc, curr) => acc + curr.score, 0) / filteredAndSortedReports.length) : 0}%
            </h3>
          </div>
        </div>
        <div className="bg-surface-dark border border-white/5 rounded-2xl p-6 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400">
            <Clock size={28} />
          </div>
          <div>
            <p className="text-slate-400 text-sm mb-1">متوسط الوقت</p>
            <h3 className="text-3xl font-bold text-white">03:22</h3>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-surface-dark border border-white/5 rounded-3xl overflow-hidden">
        <div className="p-6 border-b border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="ابحث عن طالب، رقم، أو اختبار..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-background-dark border border-white/10 rounded-xl pr-12 pl-4 py-2.5 text-white focus:border-primary outline-none text-sm"
            />
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <select 
              value={filterTestId}
              onChange={(e) => setFilterTestId(e.target.value)}
              className="px-4 py-2.5 bg-background-dark border border-white/10 rounded-xl text-slate-300 focus:outline-none focus:border-primary text-sm"
            >
              <option value="all">جميع الاختبارات</option>
              {tests.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-2.5 bg-background-dark border border-white/10 rounded-xl text-slate-300 focus:outline-none focus:border-primary text-sm"
            >
              <option value="newest">الأحدث</option>
              <option value="highest">الأعلى درجة</option>
              <option value="lowest">الأقل درجة</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-background-dark/50 text-slate-400 text-sm">
              <tr>
                <th className="px-6 py-4 font-medium w-10"></th>
                <th className="px-6 py-4 font-medium">اسم الطالب</th>
                <th className="px-6 py-4 font-medium">الاختبار</th>
                <th className="px-6 py-4 font-medium">الدرجة</th>
                <th className="px-6 py-4 font-medium">الوقت المستغرق</th>
                <th className="px-6 py-4 font-medium">تاريخ الاختبار</th>
                <th className="px-6 py-4 font-medium text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredAndSortedReports.map((student) => (
                <tr key={student.id} className="hover:bg-white/[0.02] transition-colors cursor-pointer" onClick={() => setSelectedStudent(student)}>
                  <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                    <input 
                      type="checkbox" 
                      checked={selectedReports.includes(student.id)}
                      onChange={(e) => toggleReportSelection(student.id, e as any)}
                      className="w-5 h-5 rounded border-white/20 bg-background-dark text-primary focus:ring-primary focus:ring-offset-background-dark"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs">
                        {student.name.charAt(0)}
                      </div>
                      <div>
                        <span className="font-medium text-white block">{student.name}</span>
                        <div className="flex items-center gap-1 text-slate-400 text-xs mt-1">
                          <Phone size={10} />
                          <span dir="ltr">{student.phone}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-300 text-sm">
                    {tests.find(t => t.id === student.testId)?.name || 'اختبار محذوف'}
                  </td>
                  <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                    {editingScoreId === student.id ? (
                      <div className="flex items-center gap-2">
                        <input 
                          type="number" 
                          min="0" max="100"
                          value={editScoreValue}
                          onChange={(e) => setEditScoreValue(e.target.value)}
                          className="w-16 bg-background-dark border border-white/10 rounded px-2 py-1 text-white text-sm"
                        />
                        <button onClick={() => handleSaveScore(student.id)} className="text-green-400 hover:text-green-300">
                          <Save size={16} />
                        </button>
                        <button onClick={() => setEditingScoreId(null)} className="text-slate-400 hover:text-white">
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 group">
                        <div className="w-full bg-background-dark rounded-full h-2 max-w-[80px]">
                          <div 
                            className="bg-primary h-2 rounded-full" 
                            style={{ width: `${student.score}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-bold text-white">{student.score}%</span>
                        <button 
                          onClick={() => {
                            setEditingScoreId(student.id);
                            setEditScoreValue(student.score.toString());
                          }} 
                          className="text-slate-500 hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Edit2 size={14} />
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-slate-300 text-sm">{student.time}</td>
                  <td className="px-6 py-4 text-slate-300 text-sm">{new Date(student.date).toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-3">
                      <button className="text-primary hover:text-primary/80 text-sm font-medium">
                        التفاصيل
                      </button>
                      <button 
                        onClick={(e) => handleDeleteReport(student.id, e)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredAndSortedReports.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    لا توجد تقارير مطابقة للبحث.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detailed Answers Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-surface-dark border border-white/10 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-white/10 flex justify-between items-start bg-background-dark/50">
              <div className="flex flex-col gap-2">
                <h2 className="text-2xl font-bold text-white mb-2">تقرير الطالب</h2>
                <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm text-slate-300">
                  <div className="flex gap-2">
                    <span className="text-slate-500 font-medium w-24">اسم الطالب:</span>
                    <span className="text-white font-bold">{selectedStudent.name}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-slate-500 font-medium w-24">الاختبار:</span>
                    <span className="text-white font-bold">{tests.find(t => t.id === selectedStudent.testId)?.name || 'غير معروف'}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-slate-500 font-medium w-24">الدرجة:</span>
                    <span className="text-white font-bold">{selectedStudent.score}%</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-slate-500 font-medium w-24">الوقت المستغرق:</span>
                    <span className="text-white font-bold">{selectedStudent.time}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-slate-500 font-medium w-24">تاريخ الاختبار:</span>
                    <span className="text-white font-bold">{new Date(selectedStudent.date).toLocaleDateString('ar-EG')}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-slate-500 font-medium w-24">وقت الاختبار:</span>
                    <span className="text-white font-bold">{new Date(selectedStudent.date).toLocaleTimeString('ar-EG')}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedStudent(null)} className="text-slate-400 hover:text-white p-2 bg-white/5 rounded-full">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar space-y-4">
              <h3 className="text-lg font-bold text-white mb-4">الأسئلة</h3>

              {(selectedStudent.details && selectedStudent.details.length > 0) ? selectedStudent.details.map((detail, i) => (
                <div key={i} className="bg-background-dark border border-white/5 rounded-xl p-4">
                  <div className="flex gap-3 items-start">
                    <div className="mt-1">
                      {!detail.isCorrect ? (
                        <XCircle className="text-red-500" size={20} />
                      ) : (
                        <CheckCircle2 className="text-green-500" size={20} />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium mb-3">{detail.questionText}</p>
                      
                      {detail.isCorrect ? (
                        <div className="p-2 rounded-lg text-sm border bg-green-500/10 border-green-500/30 text-green-400 inline-block">
                          {detail.studentAnswer}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex gap-2 text-sm">
                            <span className="text-slate-500 w-24">إجابة الطالب:</span>
                            <span className="text-red-400 font-medium">{detail.studentAnswer || 'لم يجب'}</span>
                          </div>
                          <div className="flex gap-2 text-sm">
                            <span className="text-slate-500 w-24">الإجابة الصحيحة:</span>
                            <span className="text-green-400 font-medium">{detail.correctAnswer}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )) : (
                <div className="text-center text-slate-500 py-8">لا توجد تفاصيل إجابات متاحة.</div>
              )}
            </div>
            
            <div className="p-4 border-t border-white/10 bg-background-dark/50 flex justify-between items-center">
              <div className="flex gap-2">
                <button 
                  onClick={handleExportStudentExcel}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600/20 text-green-500 border border-green-600/30 rounded-xl hover:bg-green-600/30 transition-colors font-medium text-sm"
                >
                  <FileSpreadsheet size={16} />
                  تصدير Excel
                </button>
                <button 
                  onClick={handleExportStudentPDF}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600/20 text-red-500 border border-red-600/30 rounded-xl hover:bg-red-600/30 transition-colors font-medium text-sm"
                >
                  <FileText size={16} />
                  تصدير PDF
                </button>
              </div>
              <button onClick={() => setSelectedStudent(null)} className="px-6 py-2 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors font-medium">
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
