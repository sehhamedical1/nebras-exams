import * as XLSX from 'xlsx';
import { Document, Packer, Paragraph, TextRun, ImageRun } from 'docx';
import { saveAs } from 'file-saver';
import html2pdf from 'html2pdf.js';

const formatAnswerStr = (answer: any): string => {
  if (answer === null || answer === undefined) return 'لم يتم الإجابة';
  if (Array.isArray(answer)) {
    return answer.map(a => formatAnswerStr(a)).join(' | ');
  }
  if (typeof answer === 'object') {
    const cleanObj = { ...answer };
    if (cleanObj.image) delete cleanObj.image;
    if (cleanObj.matchImage) delete cleanObj.matchImage;
    const str = JSON.stringify(cleanObj);
    return str.length > 32000 ? str.substring(0, 32000) + '...' : str;
  }
  const str = String(answer);
  return str.length > 32000 ? str.substring(0, 32000) + '...' : str;
};

export const exportToExcel = (data: any[], filename: string) => {
  const formattedData = data.map(item => {
    const newItem = { ...item };
    if (newItem.date) {
      try {
        newItem.date = new Date(newItem.date).toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
      } catch (e) {}
    }
    return newItem;
  });
  const ws = XLSX.utils.json_to_sheet(formattedData);
  if (!ws['!views']) ws['!views'] = [];
  ws['!views'].push({ rightToLeft: true });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  XLSX.writeFile(wb, `${filename}.xlsx`);
};

export const exportStudentReportToExcel = (student: any, test: any, filename: string) => {
  let formattedDate = student.date;
  let formattedTime = '';
  try {
    const d = new Date(student.date);
    formattedDate = d.toLocaleDateString('ar-EG');
    formattedTime = d.toLocaleTimeString('ar-EG');
  } catch (e) {}

  const rowData: any = {
    'اسم الطالب': student.name,
    'الاختبار': test?.name || 'غير معروف',
    'الدرجة': `${student.score}%`,
    'الوقت المستغرق': student.time,
    'تاريخ الاختبار': formattedDate,
    'وقت الاختبار': formattedTime,
  };

  student.details?.forEach((detail: any, index: number) => {
    const qNum = index + 1;
    rowData[`السؤال ${qNum}`] = detail.questionText;
    
    rowData[`إجابة الطالب ${qNum}`] = formatAnswerStr(detail.studentAnswer);

    if (!detail.isCorrect) {
      rowData[`الإجابة الصحيحة ${qNum}`] = formatAnswerStr(detail.correctAnswer);
    }
    
    rowData[`النتيجة ${qNum}`] = detail.isCorrect ? 'صحيحة' : 'خاطئة';
  });

  const ws = XLSX.utils.json_to_sheet([rowData]);
  if (!ws['!views']) ws['!views'] = [];
  ws['!views'].push({ rightToLeft: true });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "تقرير الطالب");
  XLSX.writeFile(wb, `${filename}.xlsx`);
};
export const exportReportsToExcel = (reports: any[], tests: any[], filename: string) => {
  const formattedData = reports.map(r => {
    let formattedDate = r.date;
    let formattedTime = '';
    try {
      const d = new Date(r.date);
      formattedDate = d.toLocaleDateString('ar-EG');
      formattedTime = d.toLocaleTimeString('ar-EG');
    } catch (e) {}

    const testName = tests.find(t => t.id === r.testId)?.name || 'غير معروف';

    const rowData: any = {
      'اسم الطالب': r.name,
      'الاختبار': testName,
      'الدرجة': `${r.score}%`,
      'الوقت المستغرق': r.time,
      'تاريخ الاختبار': formattedDate,
      'وقت الاختبار': formattedTime,
    };

    r.details?.forEach((detail: any, index: number) => {
      const qNum = index + 1;
      rowData[`السؤال ${qNum}`] = detail.questionText;
      
      rowData[`إجابة الطالب ${qNum}`] = formatAnswerStr(detail.studentAnswer);

      if (!detail.isCorrect) {
        rowData[`الإجابة الصحيحة ${qNum}`] = formatAnswerStr(detail.correctAnswer);
      }
      
      rowData[`النتيجة ${qNum}`] = detail.isCorrect ? 'صحيحة' : 'خاطئة';
    });

    return rowData;
  });

  const ws = XLSX.utils.json_to_sheet(formattedData);
  if (!ws['!views']) ws['!views'] = [];
  ws['!views'].push({ rightToLeft: true });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "التقارير");
  XLSX.writeFile(wb, `${filename}.xlsx`);
};

export const exportStudentReportToPDF = (student: any, test: any, filename: string, title: string) => {
  const container = document.createElement('div');
  container.style.padding = '40px';
  container.style.fontFamily = 'Arial, sans-serif';
  container.style.direction = 'rtl';
  
  const theme = test?.settings?.theme;
  container.style.color = theme?.color || '#000';
  container.style.backgroundColor = theme?.background || '#fff';
  if (theme?.backgroundImage) {
    container.style.backgroundImage = `url(${theme.backgroundImage})`;
    container.style.backgroundSize = 'cover';
    container.style.backgroundPosition = 'center';
    container.style.backgroundRepeat = 'no-repeat';
  }
  
  const heading = document.createElement('h1');
  heading.textContent = title;
  heading.style.textAlign = 'center';
  heading.style.marginBottom = '20px';
  heading.style.fontSize = '24px';
  heading.style.color = theme?.color || '#000';
  container.appendChild(heading);

  const infoDiv = document.createElement('div');
  infoDiv.style.marginBottom = '30px';
  infoDiv.style.padding = '20px';
  infoDiv.style.border = `1px solid ${theme?.color || '#ccc'}`;
  infoDiv.style.borderRadius = '8px';
  infoDiv.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
  
  let formattedDate = student.date;
  let formattedTime = '';
  try {
    const d = new Date(student.date);
    formattedDate = d.toLocaleDateString('ar-EG');
    formattedTime = d.toLocaleTimeString('ar-EG');
  } catch (e) {}

  infoDiv.innerHTML = `
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
      <div><strong>اسم الطالب:</strong> ${student.name}</div>
      <div><strong>الاختبار:</strong> ${test?.name || 'غير معروف'}</div>
      <div><strong>الدرجة:</strong> ${student.score}%</div>
      <div><strong>الوقت المستغرق:</strong> ${student.time}</div>
      <div><strong>تاريخ الاختبار:</strong> ${formattedDate}</div>
      <div><strong>وقت الاختبار:</strong> ${formattedTime}</div>
    </div>
  `;
  container.appendChild(infoDiv);

  student.details?.forEach((detail: any, index: number) => {
    const qDiv = document.createElement('div');
    qDiv.style.marginBottom = '20px';
    qDiv.style.padding = '15px';
    qDiv.style.border = `1px solid ${theme?.color || '#eee'}`;
    qDiv.style.borderRadius = '8px';
    qDiv.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
    
    const isCorrect = detail.isCorrect;

    let studentAnswerHtml = formatAnswerStr(detail.studentAnswer);
    let correctAnswerHtml = formatAnswerStr(detail.correctAnswer);

    let answersHtml = '';
    if (isCorrect) {
      answersHtml = `
        <div style="margin-bottom: 8px; color: #10b981; font-weight: bold;">
          ${studentAnswerHtml}
        </div>
      `;
    } else {
      answersHtml = `
        <div style="margin-bottom: 8px; color: ${theme?.color || '#444'};">
          <strong>إجابة الطالب:</strong> <span style="color: #ef4444;">${studentAnswerHtml}</span>
        </div>
        <div style="margin-bottom: 8px; color: ${theme?.color || '#444'};">
          <strong>الإجابة الصحيحة:</strong> <span style="color: #10b981;">${correctAnswerHtml}</span>
        </div>
      `;
    }

    qDiv.innerHTML = `
      <div style="margin-bottom: 10px; font-size: 16px; font-weight: bold;">
        ${index + 1}. ${detail.questionText || 'سؤال'}
      </div>
      ${answersHtml}
    `;
    
    container.appendChild(qDiv);
  });
  
  document.body.appendChild(container);
  
  const opt: any = {
    margin:       15,
    filename:     `${filename}.pdf`,
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2, useCORS: true },
    jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };
  
  html2pdf().set(opt).from(container).save().then(() => {
    document.body.removeChild(container);
  });
};

export const exportToPDF = (data: any[], columns: string[], filename: string, title: string) => {
  const container = document.createElement('div');
  container.style.padding = '20px';
  container.style.fontFamily = 'Arial, sans-serif';
  container.style.direction = 'rtl';
  
  const heading = document.createElement('h1');
  heading.textContent = title;
  heading.style.textAlign = 'center';
  heading.style.marginBottom = '20px';
  container.appendChild(heading);
  
  const table = document.createElement('table');
  table.style.width = '100%';
  table.style.borderCollapse = 'collapse';
  table.style.marginBottom = '20px';
  
  const thead = document.createElement('thead');
  const trHead = document.createElement('tr');
  columns.forEach(col => {
    const th = document.createElement('th');
    th.textContent = col;
    th.style.border = '1px solid #ddd';
    th.style.padding = '8px';
    th.style.backgroundColor = '#f2f2f2';
    th.style.textAlign = 'right';
    trHead.appendChild(th);
  });
  thead.appendChild(trHead);
  table.appendChild(thead);
  
  const tbody = document.createElement('tbody');
  data.forEach(item => {
    const tr = document.createElement('tr');
    columns.forEach(col => {
      const td = document.createElement('td');
      if (col === 'date' && item[col]) {
        try {
          td.textContent = new Date(item[col]).toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        } catch (e) {
          td.textContent = item[col];
        }
      } else {
        td.textContent = item[col] || '';
      }
      td.style.border = '1px solid #ddd';
      td.style.padding = '8px';
      td.style.textAlign = 'right';
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  container.appendChild(table);
  
  document.body.appendChild(container);
  
  const opt: any = {
    margin:       10,
    filename:     `${filename}.pdf`,
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2, useCORS: true },
    jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };
  
  html2pdf().set(opt).from(container).save().then(() => {
    document.body.removeChild(container);
  });
};

export const exportQuestionsToPDF = (questions: any[], filename: string, title: string, theme?: any) => {
  const container = document.createElement('div');
  container.style.padding = '40px';
  container.style.fontFamily = 'Arial, sans-serif';
  container.style.direction = 'rtl';
  
  // Apply theme
  container.style.color = theme?.color || '#000';
  container.style.backgroundColor = theme?.background || '#fff';
  if (theme?.backgroundImage) {
    container.style.backgroundImage = `url(${theme.backgroundImage})`;
    container.style.backgroundSize = 'cover';
    container.style.backgroundPosition = 'center';
    container.style.backgroundRepeat = 'no-repeat';
  }
  
  const heading = document.createElement('h1');
  heading.textContent = title;
  heading.style.textAlign = 'center';
  heading.style.marginBottom = '40px';
  heading.style.fontSize = '24px';
  heading.style.color = theme?.color || '#000';
  container.appendChild(heading);
  
  questions.forEach((q, index) => {
    const qDiv = document.createElement('div');
    qDiv.style.marginBottom = '30px';
    
    let typeInstruction = '';
    let contentHtml = '';

    switch (q.type) {
      case 'multiple_choice':
        typeInstruction = '(اختر الإجابة الصحيحة)';
        contentHtml = `
          <div style="margin-bottom: 10px; font-size: 18px;">${index + 1}. ${q.text}</div>
          <div style="display: flex; flex-direction: column; gap: 8px; padding-right: 20px;">
            ${q.options.map((opt: any) => `<div>○ ${opt.text}</div>`).join('')}
          </div>
        `;
        break;
      case 'true_false_speed':
        typeInstruction = '(صح أم خطأ - سرعة)';
        contentHtml = `
          <div style="margin-bottom: 10px; font-size: 18px;">${index + 1}. ${q.text}</div>
          <div style="display: flex; flex-direction: column; gap: 8px; padding-right: 20px;">
            ${q.options.map((opt: any) => `<div>○ ${opt.text}</div>`).join('')}
          </div>
        `;
        break;
      case 'true_false':
        typeInstruction = '(حدد صح أو خطأ)';
        contentHtml = `
          <div style="margin-bottom: 10px; font-size: 18px;">${index + 1}. ${q.text}</div>
          <div style="padding-right: 20px;">○ صح &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ○ خطأ</div>
        `;
        break;
      case 'fill_blanks':
        typeInstruction = '(أكمل مكان النقط)';
        const blankText = q.text.replace(/\[(.*?)\]/g, '....................');
        contentHtml = `<div style="margin-bottom: 10px; font-size: 18px;">${index + 1}. ${blankText}</div>`;
        break;
      case 'find_match':
      case 'match_up':
      case 'matching_pairs':
        typeInstruction = '(صل كل عمود من أ بما يناسبه من ب)';
        
        const pairs = q.options?.filter((o: any) => (o.text || o.image) && (o.matchText || o.matchImage)) || [];
        
        if (pairs.length === 0) {
           contentHtml = `<div style="margin-bottom: 10px; font-size: 18px;">${index + 1}. ${q.text}</div>`;
           break;
        }

        const colA = pairs.map((p: any, i: number) => ({ id: i, content: p.image ? `<img src="${p.image}" style="max-height: 60px; max-width: 100%; border-radius: 4px;" />` : (p.text || '[صورة]') }));
        let colB = pairs.map((p: any, i: number) => ({ id: i, content: p.matchImage ? `<img src="${p.matchImage}" style="max-height: 60px; max-width: 100%; border-radius: 4px;" />` : (p.matchText || '[صورة]') }));
        
        // Shuffle colB ensuring no item is directly opposite its pair
        let shuffled = false;
        let attempts = 0;
        while (!shuffled && attempts < 20) {
          colB = colB.sort(() => Math.random() - 0.5);
          shuffled = true;
          for (let i = 0; i < colA.length; i++) {
            if (colA[i].id === colB[i].id && colA.length > 1) {
              shuffled = false;
              break;
            }
          }
          attempts++;
        }

        contentHtml = `
          <div style="margin-bottom: 10px; font-size: 18px;">${index + 1}. ${q.text || 'صل كل عمود من أ بما يناسبه من ب'}</div>
          <div style="display: flex; justify-content: space-between; padding: 0 40px; margin-top: 20px; margin-bottom: 20px;">
            <div style="display: flex; flex-direction: column; gap: 25px; align-items: center; width: 40%;">
              <div style="font-weight: bold; margin-bottom: 10px; font-size: 16px;">العمود (أ)</div>
              ${colA.map((item: any) => `<div style="padding: 10px 15px; border: 1px solid #ccc; border-radius: 8px; width: 100%; text-align: center; background-color: rgba(255,255,255,0.05);">${item.content}</div>`).join('')}
            </div>
            <div style="display: flex; flex-direction: column; gap: 25px; align-items: center; width: 40%;">
              <div style="font-weight: bold; margin-bottom: 10px; font-size: 16px;">العمود (ب)</div>
              ${colB.map((item: any) => `<div style="padding: 10px 15px; border: 1px solid #ccc; border-radius: 8px; width: 100%; text-align: center; background-color: rgba(255,255,255,0.05);">${item.content}</div>`).join('')}
            </div>
          </div>
        `;
        break;
      case 'group_sort':
        typeInstruction = '(ضع في المجموعة ما يندرج تحتها)';
        contentHtml = `
          <div style="margin-bottom: 10px; font-size: 18px;">${index + 1}. ${q.text}</div>
          <div style="font-weight: bold; margin-bottom: 10px;">${q.groups?.map((g: any) => g.title || g.name).join(' | ') || ''}</div>
          <div>${q.options?.map((o: any) => o.text).sort(() => Math.random() - 0.5).join(' - ') || ''}</div>
        `;
        break;
      case 'complete_sentence':
        typeInstruction = '(أكمل مكان النقط بالخيارات الآتية)';
        const sentenceText = q.text.replace(/\[(.*?)\]/g, '....................');
        const words = [...q.text.matchAll(/\[(.*?)\]/g)].map(m => m[1]).sort(() => Math.random() - 0.5);
        contentHtml = `
          <div style="margin-bottom: 10px; font-size: 18px;">${index + 1}. ${sentenceText}</div>
          <div style="font-weight: bold;">${words.join(' - ')}</div>
        `;
        break;
      case 'anagram':
        typeInstruction = '(كون الكلمة المناسبة)';
        const scrambledWord = (q.options?.[0]?.text || '').split('').sort(() => Math.random() - 0.5).join(' ');
        contentHtml = `
          <div style="margin-bottom: 10px; font-size: 18px;">${index + 1}. ${q.text}</div>
          <div style="font-weight: bold; margin-bottom: 10px;">${scrambledWord}</div>
          <div>....................</div>
        `;
        break;
      case 'unjumble':
        typeInstruction = '(كون الجملة المناسبة)';
        const scrambledSentence = (q.options?.[0]?.text || '').split(' ').sort(() => Math.random() - 0.5).join(' - ');
        contentHtml = `
          <div style="margin-bottom: 10px; font-size: 18px;">${index + 1}. ${q.text}</div>
          <div style="font-weight: bold; margin-bottom: 10px;">${scrambledSentence}</div>
          <div>........................................</div>
        `;
        break;
      case 'labelled_diagram':
        typeInstruction = '(حدد النقطة المحددة في الصورة)';
        contentHtml = `
          <div style="margin-bottom: 10px; font-size: 18px;">${index + 1}. ${q.text}</div>
          ${q.options[0]?.image ? `
            <div style="position: relative; display: inline-block; margin-bottom: 20px; max-width: 100%;">
              <img src="${q.options[0].image}" style="max-width: 100%; max-height: 400px; border-radius: 8px;" />
              ${q.options.slice(1).map((opt: any, i: number) => `
                <div style="position: absolute; left: ${opt.x || 50}%; top: ${opt.y || 50}%; transform: translate(-50%, -50%); width: 24px; height: 24px; background-color: #6366f1; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; border: 2px solid white;">
                  ${i + 1}
                </div>
              `).join('')}
            </div>
          ` : '<div style="font-style: italic; margin-bottom: 10px;">[صورة المخطط]</div>'}
          <div style="display: flex; flex-direction: column; gap: 8px; padding-right: 20px;">
            ${q.options?.slice(1).map((opt: any, i: number) => `<div>${i + 1}. ....................</div>`).join('') || ''}
          </div>
        `;
        break;
      case 'maze_chase':
        typeInstruction = '(تتبع المسار الصحيح)';
        contentHtml = `
          <div style="margin-bottom: 10px; font-size: 18px;">${index + 1}. ${q.text}</div>
          ${q.options[0]?.image ? `
            <div style="margin-bottom: 20px; max-width: 100%;">
              <img src="${q.options[0].image}" style="max-width: 100%; max-height: 400px; border-radius: 8px;" />
            </div>
          ` : '<div style="font-style: italic;">[صورة المتاهة]</div>'}
        `;
        break;
      case 'speaking_cards':
        return; // Do not print speaking cards
      default:
        contentHtml = `<div style="margin-bottom: 10px; font-size: 18px;">${index + 1}. ${q.text}</div>`;
    }

    if (typeInstruction) {
      const instDiv = document.createElement('div');
      instDiv.style.fontWeight = 'bold';
      instDiv.style.marginBottom = '10px';
      instDiv.textContent = typeInstruction;
      qDiv.appendChild(instDiv);
    }
    
    const contentWrapper = document.createElement('div');
    contentWrapper.innerHTML = contentHtml;
    qDiv.appendChild(contentWrapper);
    
    container.appendChild(qDiv);
  });
  
  document.body.appendChild(container);
  
  const opt: any = {
    margin:       15,
    filename:     `${filename}.pdf`,
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2, useCORS: true },
    jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };
  
  html2pdf().set(opt).from(container).save().then(() => {
    document.body.removeChild(container);
  });
};

const base64ToUint8Array = (base64: string) => {
  try {
    const binaryString = window.atob(base64.split(',')[1]);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  } catch (e) {
    return new Uint8Array(0);
  }
};

export const exportToWord = async (questions: any[], filename: string, title: string) => {
  const children: any[] = [
    new Paragraph({
      children: [new TextRun({ text: title, bold: true, size: 32 })],
      spacing: { after: 400 },
    }),
  ];

  questions.forEach((q, index) => {
    let typeInstruction = '';
    let contentParagraphs: any[] = [];

    switch (q.type) {
      case 'multiple_choice':
        typeInstruction = '(اختر الإجابة الصحيحة)';
        contentParagraphs = [
          new Paragraph({ children: [new TextRun({ text: `${index + 1}. ${q.text}`, size: 28 })], spacing: { before: 200, after: 100 } }),
          ...q.options.map((opt: any) => new Paragraph({ children: [new TextRun({ text: `○ ${opt.text}`, size: 24 })], spacing: { before: 50 } }))
        ];
        break;
      case 'true_false_speed':
        typeInstruction = '(صح أم خطأ - سرعة)';
        contentParagraphs = [
          new Paragraph({ children: [new TextRun({ text: `${index + 1}. ${q.text}`, size: 28 })], spacing: { before: 200, after: 100 } }),
          ...q.options.map((opt: any) => new Paragraph({ children: [new TextRun({ text: `○ ${opt.text}`, size: 24 })], spacing: { before: 50 } }))
        ];
        break;
      case 'true_false':
        typeInstruction = '(حدد صح أو خطأ)';
        contentParagraphs = [
          new Paragraph({ children: [new TextRun({ text: `${index + 1}. ${q.text}`, size: 28 })], spacing: { before: 200, after: 100 } }),
          new Paragraph({ children: [new TextRun({ text: '○ صح          ○ خطأ', size: 24 })], spacing: { before: 50 } })
        ];
        break;
      case 'fill_blanks':
        typeInstruction = '(أكمل مكان النقط)';
        const blankText = q.text.replace(/\[(.*?)\]/g, '....................');
        contentParagraphs = [
          new Paragraph({ children: [new TextRun({ text: `${index + 1}. ${blankText}`, size: 28 })], spacing: { before: 200, after: 100 } }),
        ];
        break;
      case 'find_match':
      case 'match_up':
      case 'matching_pairs':
        typeInstruction = '(صل كل عمود من أ بما يناسبه من ب)';
        const pairs = q.options?.filter((o: any) => (o.text || o.image) && (o.matchText || o.matchImage)) || [];
        
        if (pairs.length === 0) {
           contentParagraphs = [
             new Paragraph({ children: [new TextRun({ text: `${index + 1}. ${q.text}`, size: 28 })], spacing: { before: 200, after: 100 } })
           ];
           break;
        }

        const colA = pairs.map((p: any, i: number) => ({ id: i, content: p.text || '[صورة]', image: p.image }));
        let colB = pairs.map((p: any, i: number) => ({ id: i, content: p.matchText || '[صورة]', image: p.matchImage }));
        
        let shuffled = false;
        let attempts = 0;
        while (!shuffled && attempts < 20) {
          colB = colB.sort(() => Math.random() - 0.5);
          shuffled = true;
          for (let i = 0; i < colA.length; i++) {
            if (colA[i].id === colB[i].id && colA.length > 1) {
              shuffled = false;
              break;
            }
          }
          attempts++;
        }

        contentParagraphs = [
          new Paragraph({ children: [new TextRun({ text: `${index + 1}. ${q.text || 'صل كل عمود من أ بما يناسبه من ب'}`, size: 28 })], spacing: { before: 200, after: 100 } }),
          ...colA.map((item: any, i: number) => {
             const children: any[] = [];
             if (item.image && item.image.startsWith('data:image')) {
                children.push(new ImageRun({ data: base64ToUint8Array(item.image), transformation: { width: 50, height: 50 }, type: 'png' }));
             } else {
                children.push(new TextRun({ text: item.content, size: 24 }));
             }
             children.push(new TextRun({ text: '                                        ', size: 24 }));
             if (colB[i]?.image && colB[i].image.startsWith('data:image')) {
                children.push(new ImageRun({ data: base64ToUint8Array(colB[i].image), transformation: { width: 50, height: 50 }, type: 'png' }));
             } else {
                children.push(new TextRun({ text: colB[i]?.content || '', size: 24 }));
             }
             return new Paragraph({ children, spacing: { before: 100 } });
          })
        ];
        break;
      case 'group_sort':
        typeInstruction = '(ضع في المجموعة ما يندرج تحتها)';
        contentParagraphs = [
          new Paragraph({ children: [new TextRun({ text: `${index + 1}. ${q.text}`, size: 28 })], spacing: { before: 200, after: 100 } }),
          new Paragraph({ children: [new TextRun({ text: q.groups?.map((g: any) => g.title || g.name).join(' | ') || '', size: 24, bold: true })], spacing: { before: 100, after: 100 } }),
          new Paragraph({ children: [new TextRun({ text: q.options?.map((o: any) => o.text).sort(() => Math.random() - 0.5).join(' - ') || '', size: 24 })], spacing: { before: 50 } })
        ];
        break;
      case 'flash_cards':
      case 'speaking_cards':
        return; // Skip completely
      case 'complete_sentence':
        typeInstruction = '(أكمل مكان النقط بالخيارات الآتية)';
        const sentenceText = q.text.replace(/\[(.*?)\]/g, '....................');
        const words = [...q.text.matchAll(/\[(.*?)\]/g)].map(m => m[1]).sort(() => Math.random() - 0.5);
        contentParagraphs = [
          new Paragraph({ children: [new TextRun({ text: `${index + 1}. ${sentenceText}`, size: 28 })], spacing: { before: 200, after: 100 } }),
          new Paragraph({ children: [new TextRun({ text: words.join(' - '), size: 24, bold: true })], spacing: { before: 100 } })
        ];
        break;
      case 'anagram':
        typeInstruction = '(كون الكلمة المناسبة)';
        const scrambledWord = (q.options?.[0]?.text || '').split('').sort(() => Math.random() - 0.5).join(' ');
        contentParagraphs = [
          new Paragraph({ children: [new TextRun({ text: `${index + 1}. ${q.text}`, size: 28 })], spacing: { before: 200, after: 100 } }),
          new Paragraph({ children: [new TextRun({ text: scrambledWord, size: 24, bold: true })], spacing: { before: 50, after: 100 } }),
          new Paragraph({ children: [new TextRun({ text: '....................', size: 24 })], spacing: { before: 50 } })
        ];
        break;
      case 'unjumble':
        typeInstruction = '(كون الجملة المناسبة)';
        const scrambledSentence = (q.options?.[0]?.text || '').split(' ').sort(() => Math.random() - 0.5).join(' - ');
        contentParagraphs = [
          new Paragraph({ children: [new TextRun({ text: `${index + 1}. ${q.text}`, size: 28 })], spacing: { before: 200, after: 100 } }),
          new Paragraph({ children: [new TextRun({ text: scrambledSentence, size: 24, bold: true })], spacing: { before: 50, after: 100 } }),
          new Paragraph({ children: [new TextRun({ text: '........................................', size: 24 })], spacing: { before: 50 } })
        ];
        break;
      case 'labelled_diagram':
        typeInstruction = '(حدد النقطة المحددة في الصورة)';
        contentParagraphs = [
          new Paragraph({ children: [new TextRun({ text: `${index + 1}. ${q.text}`, size: 28 })], spacing: { before: 200, after: 100 } }),
          new Paragraph({ children: [new TextRun({ text: '[صورة المخطط]', size: 24, italics: true })], spacing: { before: 50, after: 50 } }),
          ...q.options?.slice(1).map((opt: any, i: number) => new Paragraph({ children: [new TextRun({ text: `${i + 1}. ....................`, size: 24 })], spacing: { before: 50 } })) || []
        ];
        break;
      case 'maze_chase':
        typeInstruction = '(تتبع المسار الصحيح)';
        contentParagraphs = [
          new Paragraph({ children: [new TextRun({ text: `${index + 1}. ${q.text}`, size: 28 })], spacing: { before: 200, after: 100 } }),
          new Paragraph({ children: [new TextRun({ text: '[صورة المتاهة]', size: 24, italics: true })], spacing: { before: 50 } })
        ];
        break;
      case 'speaking_cards':
        // Do not print speaking cards
        return;
      default:
        contentParagraphs = [
          new Paragraph({ children: [new TextRun({ text: `${index + 1}. ${q.text}`, size: 28 })], spacing: { before: 200, after: 100 } })
        ];
    }

    if (typeInstruction) {
      children.push(new Paragraph({ children: [new TextRun({ text: typeInstruction, size: 24, bold: true })], spacing: { before: 200 } }));
    }
    children.push(...contentParagraphs);
  });

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${filename}.docx`);
};

export const importFromExcel = (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);
        resolve(json);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
};
