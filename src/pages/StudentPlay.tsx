import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Timer, Star, CheckCircle2, XCircle, X, Layers, Grid } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { useStore } from '@/store/useStore';

export function StudentPlay() {
  const navigate = useNavigate();
  const location = useLocation();
  const { tests, draftTest, addReport } = useStore();
  
  const { name, phone, testId, previewTest: statePreviewTest } = location.state || {};
  
  const isPreviewMode = location.pathname === '/preview';
  const previewTest = statePreviewTest || (isPreviewMode && draftTest ? {
    id: draftTest.id || 'preview',
    name: draftTest.name || 'معاينة',
    questions: draftTest.questions,
    settings: {}
  } : null);

  const test = previewTest || tests.find(t => t.id === testId);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(test?.questions[0]?.timer || 30);
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<number[]>([]);
  const [isAnswered, setIsAnswered] = useState(false);
  const [details, setDetails] = useState<any[]>([]);
  const [startTime] = useState(Date.now());
  const [fillBlanksAnswers, setFillBlanksAnswers] = useState<string[]>([]);
  const [reportId] = useState(Date.now().toString() + Math.random().toString(36).substring(7));
  const { submitReportAPI, updateReportAPI } = useStore();

  // Auto-save initial report
  useEffect(() => {
    if (!previewTest && test) {
      submitReportAPI({
        id: reportId,
        testId: test.id,
        name: name || 'طالب مجهول',
        phone: phone || 'غير محدد',
        score: 0,
        time: '00:00',
        date: new Date().toISOString(),
        status: 'قيد التنفيذ',
        details: []
      }).catch(console.error);
    }
  }, []);

  // Auto-save on details change
  useEffect(() => {
    if (!previewTest && test && details.length > 0) {
      const totalPoints = test.questions.reduce((acc: number, curr: any) => acc + (curr.points || 100), 0);
      const percentage = Math.round((score / totalPoints) * 100) || 0;
      const timeSpentMs = Date.now() - startTime;
      const minutes = Math.floor(timeSpentMs / 60000);
      const seconds = Math.floor((timeSpentMs % 60000) / 1000);
      const timeSpentStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

      updateReportAPI(reportId, {
        score: percentage,
        time: timeSpentStr,
        details: details,
        status: currentQuestionIndex >= test.questions.length - 1 ? 'مكتمل' : 'قيد التنفيذ'
      }).catch(console.error);
    }
  }, [details, score]);
  
  // Group Sort state
  const [groupSortAnswers, setGroupSortAnswers] = useState<Record<number, number>>({});
  const [selectedSortOption, setSelectedSortOption] = useState<number | null>(null);
  
  // Find Match state
  const [matchCards, setMatchCards] = useState<any[]>([]);
  const [selectedMatchCards, setSelectedMatchCards] = useState<number[]>([]);
  const [matchedPairs, setMatchedPairs] = useState<number>(0);
  const [matchUpPairs, setMatchUpPairs] = useState<{ [key: number]: number }>({});

  // Complete Sentence state
  const [completeSentenceAnswers, setCompleteSentenceAnswers] = useState<(string | null)[]>([]);
  const [completeSentenceOptions, setCompleteSentenceOptions] = useState<string[]>([]);
  const [selectedCompleteSentenceOption, setSelectedCompleteSentenceOption] = useState<string | null>(null);

  // Speaking Cards state
  const [speakingCardsPhase, setSpeakingCardsPhase] = useState<'memorize' | 'sort'>('memorize');
  const [speakingCardsStack, setSpeakingCardsStack] = useState<any[]>([]);
  const [speakingCardsViewed, setSpeakingCardsViewed] = useState<any[]>([]);
  const [speakingCardsCurrent, setSpeakingCardsCurrent] = useState<any | null>(null);
  const [speakingCardsSortOrder, setSpeakingCardsSortOrder] = useState<number[]>([]);
  const [speakingCardsShuffled, setSpeakingCardsShuffled] = useState<any[]>([]);

  // Find Match state
  const [findMatchQueue, setFindMatchQueue] = useState<any[]>([]);
  const [findMatchCurrent, setFindMatchCurrent] = useState<any | null>(null);
  const [findMatchOptions, setFindMatchOptions] = useState<any[]>([]);
  const [findMatchWrongAttempts, setFindMatchWrongAttempts] = useState(0);

  // Unjumble / Anagram state
  const [jumbleItems, setJumbleItems] = useState<any[]>([]);
  const [jumbleAnswers, setJumbleAnswers] = useState<(any | null)[]>([]);

  // Flash Cards state
  const [flashCardsQueue, setFlashCardsQueue] = useState<any[]>([]);
  const [flashCardCurrent, setFlashCardCurrent] = useState<any | null>(null);
  const [flashCardFlipped, setFlashCardFlipped] = useState(false);
  const [flashCardResults, setFlashCardResults] = useState<{id: string, isCorrect: boolean}[]>([]);
  const [flashCardFeedback, setFlashCardFeedback] = useState<'correct' | 'wrong' | null>(null);

  // Labelled Diagram state
  const [diagramPoints, setDiagramPoints] = useState<any[]>([]);
  const [diagramCurrentPoint, setDiagramCurrentPoint] = useState<any | null>(null);
  const [diagramAnswers, setDiagramAnswers] = useState<{id: string, x: number, y: number}[]>([]);

  // Maze Chase state
  const [mazePath, setMazePath] = useState<{x: number, y: number}[]>([]);
  const [isDrawingMaze, setIsDrawingMaze] = useState(false);

  useEffect(() => {
    if (!test) {
      navigate('/student');
    }
  }, [test, navigate]);

  if (!test) return null;

  const questions = test.questions;
  const q = questions[currentQuestionIndex];

  useEffect(() => {
    if (timeLeft > 0 && !isAnswered) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !isAnswered) {
      handleTimeOut();
    }
  }, [timeLeft, isAnswered]);

  useEffect(() => {
    // Reset state for new question
    if (q.type === 'fill_blanks') {
      const matches = (q.text || '').match(/\[(.*?)\]/g) || [];
      setFillBlanksAnswers(new Array(matches.length).fill(''));
    } else if (q.type === 'complete_sentence') {
      const matches = (q.text || '').match(/\[(.*?)\]/g) || [];
      const answers = matches.map((m: string) => m.replace(/\[|\]/g, '').trim());
      setCompleteSentenceAnswers(new Array(matches.length).fill(null));
      setCompleteSentenceOptions([...answers].sort(() => Math.random() - 0.5));
      setSelectedCompleteSentenceOption(null);
    } else if (q.type === 'speaking_cards') {
      setSpeakingCardsPhase('memorize');
      const cards = (q.options || []).map((opt: any, index: number) => ({ ...opt, originalIndex: index }));
      setSpeakingCardsStack([...cards].reverse()); // Stacked, so first is on top
      setSpeakingCardsViewed([]);
      setSpeakingCardsCurrent(null);
      setSpeakingCardsSortOrder([]);
      setSpeakingCardsShuffled([...cards].sort(() => Math.random() - 0.5));
    } else if (q.type === 'find_match') {
      const queue: any[] = [];
      const options: any[] = [];
      (q.options || []).forEach((opt: any, index: number) => {
        if (opt.text || opt.image) queue.push({ id: `opt-${index}`, text: opt.text, image: opt.image, matchId: index, type: 'option' });
        if (opt.matchText || opt.matchImage) options.push({ id: `match-${index}`, text: opt.matchText, image: opt.matchImage, matchId: index, type: 'match', matched: false });
      });
      const shuffledQueue = queue.sort(() => Math.random() - 0.5);
      setFindMatchQueue(shuffledQueue);
      setFindMatchCurrent(shuffledQueue[0] || null);
      setFindMatchOptions(options.sort(() => Math.random() - 0.5));
      setMatchedPairs(0);
      setFindMatchWrongAttempts(0);
    } else if (q.type === 'unjumble' || q.type === 'anagram') {
      const answerText = q.options?.[0]?.text || '';
      let items: string[] = [];
      if (q.type === 'unjumble') {
        items = answerText.split(' ').filter((w: string) => w.trim() !== '');
      } else {
        items = answerText.split('').filter((c: string) => c.trim() !== '');
      }
      const shuffled = items.map((text, index) => ({ id: `item-${index}`, text, originalIndex: index })).sort(() => Math.random() - 0.5);
      setJumbleItems(shuffled);
      setJumbleAnswers(new Array(items.length).fill(null));
    } else if (q.type === 'flash_cards') {
      setFlashCardsQueue([...(q.options || [])]);
      setFlashCardCurrent(q.options?.[0] || null);
      setFlashCardFlipped(false);
      setFlashCardResults([]);
      setFlashCardFeedback(null);
    } else if (q.type === 'labelled_diagram') {
      const points = (q.options || []).slice(1);
      setDiagramPoints(points);
      setDiagramCurrentPoint(points[0] || null);
      setDiagramAnswers([]);
    } else if (q.type === 'maze_chase') {
      setMazePath([]);
      setIsDrawingMaze(false);
    } else if (q.type === 'match_up' || q.type === 'matching_pairs') {
      const cards: any[] = [];
      (q.options || []).forEach((opt: any, index: number) => {
        if (opt.text || opt.image) cards.push({ id: `opt-${index}`, text: opt.text, image: opt.image, matchId: index, type: 'option', matched: false });
        if (opt.matchText || opt.matchImage) cards.push({ id: `match-${index}`, text: opt.matchText, image: opt.matchImage, matchId: index, type: 'match', matched: false });
      });
      setMatchCards(cards.sort(() => Math.random() - 0.5));
      setSelectedMatchCards([]);
      setMatchedPairs(0);
      setMatchUpPairs({});
    } else if (q.type === 'group_sort') {
      setGroupSortAnswers({});
    }
  }, [currentQuestionIndex, q]);

  const handleTimeOut = () => {
    setIsAnswered(true);
    recordAnswer(null, false, 'لم يتم الإجابة', 0);
    setTimeout(nextQuestion, 2000);
  };

  const handleOptionSelect = (optionId: number, isCorrect: boolean, optionText: string) => {
    if (isAnswered) return;
    
    const correctOptions = q.options?.filter((o: any) => o.isCorrect) || [];
    if (correctOptions.length > 1) {
      // Toggle selection for multiple correct answers
      setSelectedOptions(prev => 
        prev.includes(optionId) ? prev.filter(id => id !== optionId) : [...prev, optionId]
      );
    } else {
      // Single correct option
      setSelectedOptions([optionId]);
      setIsAnswered(true);
      
      const pointsEarned = isCorrect ? (q.points || 100) : 0;
      setScore(score + pointsEarned);

      recordAnswer([optionId], isCorrect, optionText, pointsEarned);
      setTimeout(nextQuestion, 2000);
    }
  };

  const handleMultipleChoiceSubmit = () => {
    if (isAnswered) return;
    setIsAnswered(true);
    
    const correctOptions = q.options?.filter((o: any) => o.isCorrect) || [];
    const correctIds = correctOptions.map((o: any) => o.id);
    
    let correctCount = 0;
    selectedOptions.forEach(id => {
      if (correctIds.includes(id)) correctCount++;
    });
    
    const wrongCount = selectedOptions.length - correctCount;
    const netCorrect = Math.max(0, correctCount - wrongCount);
    
    const isFullyCorrect = correctCount === correctIds.length && selectedOptions.length === correctIds.length;
    const pointsEarned = correctIds.length > 0 ? Math.round((netCorrect / correctIds.length) * (q.points || 100)) : 0;
    
    setScore(score + pointsEarned);
    
    const studentAnswerText = selectedOptions.map(id => q.options?.find((o: any) => o.id === id)?.text).join('، ');
    
    recordAnswer(selectedOptions, isFullyCorrect, studentAnswerText, pointsEarned);
    setTimeout(nextQuestion, 2000);
  };

  const handleCompleteSentenceSubmit = () => {
    if (isAnswered) return;
    setIsAnswered(true);

    const matches = (q.text || '').match(/\[(.*?)\]/g) || [];
    const correctAnswers = matches.map((m: string) => m.replace(/\[|\]/g, '').trim());
    
    let correctCount = 0;
    for (let i = 0; i < correctAnswers.length; i++) {
      if (completeSentenceAnswers[i]?.trim().toLowerCase() === correctAnswers[i].toLowerCase()) {
        correctCount++;
      }
    }

    const isFullyCorrect = correctCount === correctAnswers.length;
    const pointsEarned = correctAnswers.length > 0 ? Math.round((correctCount / correctAnswers.length) * (q.points || 100)) : 0;

    setScore(score + pointsEarned);

    recordAnswer(null, isFullyCorrect, completeSentenceAnswers.join('، '), pointsEarned);
    setTimeout(nextQuestion, 2000);
  };

  const handleSpeakingCardsSubmit = () => {
    if (isAnswered) return;
    setIsAnswered(true);

    let correctCount = 0;
    for (let i = 0; i < speakingCardsSortOrder.length; i++) {
      const cardId = speakingCardsSortOrder[i];
      const card = speakingCardsShuffled.find(c => c.id === cardId);
      if (card.originalIndex === i) {
        correctCount++;
      }
    }

    const isFullyCorrect = correctCount === (q.options?.length || 0);
    const pointsEarned = (q.options?.length || 0) > 0 ? Math.round((correctCount / (q.options?.length || 1)) * (q.points || 100)) : 0;

    setScore(score + pointsEarned);

    const studentAnswerText = speakingCardsSortOrder.map(id => speakingCardsShuffled.find(c => c.id === id)?.text).join('، ');
    recordAnswer(null, isFullyCorrect, studentAnswerText, pointsEarned);
    setTimeout(nextQuestion, 3000); // Give more time to see correct order
  };

  const handleFillBlanksSubmit = () => {
    if (isAnswered) return;
    setIsAnswered(true);

    const matches = (q.text || '').match(/\[(.*?)\]/g) || [];
    const correctAnswers = matches.map((m: string) => m.replace(/\[|\]/g, '').trim());
    
    let correctCount = 0;
    for (let i = 0; i < correctAnswers.length; i++) {
      if (fillBlanksAnswers[i]?.trim().toLowerCase() === correctAnswers[i].toLowerCase()) {
        correctCount++;
      }
    }

    const isFullyCorrect = correctCount === correctAnswers.length;
    const pointsEarned = correctAnswers.length > 0 ? Math.round((correctCount / correctAnswers.length) * (q.points || 100)) : 0;

    setScore(score + pointsEarned);

    recordAnswer(null, isFullyCorrect, fillBlanksAnswers.join('، '), pointsEarned);
    setTimeout(nextQuestion, 2000);
  };

  const handleGroupSortSubmit = () => {
    if (isAnswered) return;
    setIsAnswered(true);

    let correctCount = 0;
    (q.options || []).forEach((opt: any) => {
      if (groupSortAnswers[opt.id] === opt.groupId) {
        correctCount++;
      }
    });

    const isFullyCorrect = correctCount === (q.options?.length || 0);
    const pointsEarned = (q.options?.length || 0) > 0 ? Math.round((correctCount / (q.options?.length || 1)) * (q.points || 100)) : 0;

    setScore(score + pointsEarned);

    recordAnswer(null, isFullyCorrect, 'تصنيف العناصر', pointsEarned);
    setTimeout(nextQuestion, 2000);
  };

  const handleFindMatchSelect = (matchId: number) => {
    if (isAnswered || !findMatchCurrent) return;

    if (findMatchCurrent.matchId === matchId) {
      // Correct match
      const newOptions = [...findMatchOptions];
      const optionIndex = newOptions.findIndex(o => o.matchId === matchId);
      if (optionIndex !== -1) {
        newOptions[optionIndex].matched = true;
        setFindMatchOptions(newOptions);
      }

      const newQueue = findMatchQueue.slice(1);
      setFindMatchQueue(newQueue);
      setMatchedPairs(prev => prev + 1);

      if (newQueue.length === 0) {
        setIsAnswered(true);
        const totalPairs = q.options?.length || 0;
        const correctCount = Math.max(0, totalPairs - findMatchWrongAttempts);
        const isFullyCorrect = findMatchWrongAttempts === 0;
        const pointsEarned = totalPairs > 0 ? Math.round((correctCount / totalPairs) * (q.points || 100)) : 0;
        
        setScore(score + pointsEarned);
        recordAnswer(null, isFullyCorrect, 'تمت المطابقة بنجاح', pointsEarned);
        setTimeout(nextQuestion, 2000);
      } else {
        setFindMatchCurrent(newQueue[0]);
      }
    } else {
      // Wrong match - put current item at the end of the queue
      const newQueue = [...findMatchQueue.slice(1), findMatchCurrent];
      setFindMatchQueue(newQueue);
      setFindMatchCurrent(newQueue[0]);
      setFindMatchWrongAttempts(prev => prev + 1);
    }
  };

  const handleJumbleSubmit = () => {
    if (isAnswered) return;
    setIsAnswered(true);

    const correctAnswerText = q.options?.[0]?.text || '';
    const studentAnswerText = jumbleAnswers.map(a => a?.text || '').join(q.type === 'unjumble' ? ' ' : '');

    let correctCount = 0;
    const expectedItems = q.type === 'unjumble' 
      ? correctAnswerText.split(' ')
      : correctAnswerText.split('');

    for (let i = 0; i < expectedItems.length; i++) {
      if (jumbleAnswers[i]?.text === expectedItems[i]) {
        correctCount++;
      }
    }

    const isFullyCorrect = correctCount === expectedItems.length;
    const pointsEarned = expectedItems.length > 0 ? Math.round((correctCount / expectedItems.length) * (q.points || 100)) : 0;

    setScore(score + pointsEarned);

    recordAnswer(null, isFullyCorrect, studentAnswerText, pointsEarned);
    setTimeout(nextQuestion, 2000);
  };

  const handleFlashCardAnswer = (studentSaysCorrect: boolean) => {
    if (!flashCardCurrent || flashCardFeedback) return;

    const isActuallyCorrect = !!flashCardCurrent.isCorrect;
    const isCorrect = studentSaysCorrect === isActuallyCorrect;

    setFlashCardFeedback(isCorrect ? 'correct' : 'wrong');

    const newResults = [...flashCardResults, { id: flashCardCurrent.id, isCorrect }];
    setFlashCardResults(newResults);

    setTimeout(() => {
      setFlashCardFeedback(null);
      const newQueue = flashCardsQueue.slice(1);
      setFlashCardsQueue(newQueue);

      if (newQueue.length === 0) {
        setIsAnswered(true);
        const correctCount = newResults.filter(r => r.isCorrect).length;
        const totalCards = q.options?.length || 0;
        const isFullyCorrect = correctCount === totalCards;
        const pointsEarned = totalCards > 0 ? Math.round((correctCount / totalCards) * (q.points || 100)) : 0;

        setScore(score + pointsEarned);
        recordAnswer(null, isFullyCorrect, 'إجابات البطاقات التعليمية', pointsEarned);
        setTimeout(nextQuestion, 2000);
      } else {
        setFlashCardFlipped(false);
        setFlashCardCurrent(newQueue[0]);
      }
    }, 1500);
  };

  const handleDiagramClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isAnswered || !diagramCurrentPoint) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const newAnswers = [...diagramAnswers, { id: diagramCurrentPoint.id, x, y }];
    setDiagramAnswers(newAnswers);

    const nextIndex = diagramPoints.findIndex(p => p.id === diagramCurrentPoint.id) + 1;
    if (nextIndex < diagramPoints.length) {
      setDiagramCurrentPoint(diagramPoints[nextIndex]);
    } else {
      setIsAnswered(true);
      // Check answers (simple distance check)
      let correctCount = 0;
      newAnswers.forEach(ans => {
        const point = diagramPoints.find(p => p.id === ans.id);
        if (point) {
          const dist = Math.sqrt(Math.pow(ans.x - (point.x || 0), 2) + Math.pow(ans.y - (point.y || 0), 2));
          if (dist < 10) correctCount++; // 10% tolerance
        }
      });
      
      const isFullyCorrect = correctCount === diagramPoints.length;
      const pointsEarned = diagramPoints.length > 0 ? Math.round((correctCount / diagramPoints.length) * (q.points || 100)) : 0;
      
      setScore(score + pointsEarned);
      recordAnswer(null, isFullyCorrect, `تم تحديد ${correctCount} من ${diagramPoints.length} نقطة`, pointsEarned);
      setTimeout(nextQuestion, 2000);
    }
  };

  const handleMazeSubmit = () => {
    if (isAnswered) return;
    setIsAnswered(true);

    let isCorrect = false;
    try {
      const teacherPath = JSON.parse(q.options?.[0]?.text || '[]');
      if (teacherPath.length > 0 && mazePath.length > 0) {
        const tStart = teacherPath[0];
        const tEnd = teacherPath[teacherPath.length - 1];
        const sStart = mazePath[0];
        const sEnd = mazePath[mazePath.length - 1];

        const dist = (p1: {x: number, y: number}, p2: {x: number, y: number}) => 
          Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));

        const startMatch = dist(tStart, sStart) < 15;
        const endMatch = dist(tEnd, sEnd) < 15;

        let pathMatch = true;
        for (const s of mazePath) {
          let minD = Infinity;
          for (const t of teacherPath) {
            const d = dist(s, t);
            if (d < minD) minD = d;
          }
          if (minD > 20) {
            pathMatch = false;
            break;
          }
        }

        isCorrect = startMatch && endMatch && pathMatch;
      } else {
        isCorrect = mazePath.length > 10;
      }
    } catch (e) {
      isCorrect = mazePath.length > 10;
    }

    const pointsEarned = isCorrect ? (q.points || 100) : 0;
    setScore(score + pointsEarned);
    recordAnswer(null, isCorrect, isCorrect ? 'تم حل المتاهة بشكل صحيح' : 'حل المتاهة غير صحيح', pointsEarned);
    setTimeout(nextQuestion, 2000);
  };

  const handleMatchCardClick = (index: number) => {
    if (isAnswered || matchCards[index].matched) return;

    if (q.type === 'match_up') {
      if (matchUpPairs[index] !== undefined) return; // Already paired

      const newSelected = [...selectedMatchCards];
      if (newSelected.includes(index)) {
        newSelected.splice(newSelected.indexOf(index), 1);
        setSelectedMatchCards(newSelected);
        return;
      }

      newSelected.push(index);
      setSelectedMatchCards(newSelected);

      if (newSelected.length === 2) {
        const idx1 = newSelected[0];
        const idx2 = newSelected[1];
        
        // Ensure they are of different types (option and match)
        if (matchCards[idx1].type !== matchCards[idx2].type) {
          setMatchUpPairs(prev => ({ ...prev, [idx1]: idx2, [idx2]: idx1 }));
          setMatchedPairs(prev => prev + 1);
          
          const totalPairs = (q.options || []).filter((o: any) => (o.text || o.image) && (o.matchText || o.matchImage)).length;
          if (matchedPairs + 1 === totalPairs) {
            // Evaluate all pairs
            setIsAnswered(true);
            let correctCount = 0;
            const newPairs = { ...matchUpPairs, [idx1]: idx2, [idx2]: idx1 };
            
            for (let i = 0; i < matchCards.length; i++) {
              if (matchCards[i].type === 'option') {
                const pairedIdx = newPairs[i];
                if (pairedIdx !== undefined && matchCards[i].matchId === matchCards[pairedIdx].matchId) {
                  correctCount++;
                }
              }
            }
            
            const isFullyCorrect = correctCount === totalPairs;
            const pointsEarned = totalPairs > 0 ? Math.round((correctCount / totalPairs) * (q.points || 100)) : 0;
            
            setScore(score + pointsEarned);
            recordAnswer(null, isFullyCorrect, 'تمت المطابقة', pointsEarned);
            setTimeout(nextQuestion, 3000);
          }
        }
        setSelectedMatchCards([]);
      }
      return;
    }

    const newSelected = [...selectedMatchCards];
    if (newSelected.includes(index)) {
      newSelected.splice(newSelected.indexOf(index), 1);
      setSelectedMatchCards(newSelected);
      return;
    }

    newSelected.push(index);
    setSelectedMatchCards(newSelected);

    if (newSelected.length === 2) {
      const card1 = matchCards[newSelected[0]];
      const card2 = matchCards[newSelected[1]];

      if (card1.matchId === card2.matchId && card1.type !== card2.type) {
        // Match found
        setTimeout(() => {
          setMatchCards(prevCards => {
            const newCards = [...prevCards];
            newCards[newSelected[0]].matched = true;
            newCards[newSelected[1]].matched = true;
            return newCards;
          });
          setMatchedPairs(prev => prev + 1);
          setSelectedMatchCards([]);

          // Check if all matched
          const totalPairs = (q.options || []).filter((o: any) => (o.text || o.image) && (o.matchText || o.matchImage)).length;
          if (matchedPairs + 1 === totalPairs) {
            setIsAnswered(true);
            const correctCount = Math.max(0, totalPairs - findMatchWrongAttempts);
            const isFullyCorrect = findMatchWrongAttempts === 0;
            const pointsEarned = totalPairs > 0 ? Math.round((correctCount / totalPairs) * (q.points || 100)) : 0;
            
            setScore(score + pointsEarned);
            recordAnswer(null, isFullyCorrect, 'تمت المطابقة بنجاح', pointsEarned);
            setTimeout(nextQuestion, 2000);
          }
        }, 1000);
      } else {
        // No match
        setFindMatchWrongAttempts(prev => prev + 1);
        setTimeout(() => {
          setSelectedMatchCards([]);
        }, 1000);
      }
    }
  };

  const recordAnswer = (optionIds: number[] | null, isFullyCorrect: boolean, studentAnswer: string, pointsEarned?: number) => {
    let correctAnswerText = '';
    if (q.type === 'fill_blanks' || q.type === 'complete_sentence') {
      const matches = (q.text || '').match(/\[(.*?)\]/g) || [];
      correctAnswerText = matches.map((m: string) => m.replace(/\[|\]/g, '')).join('، ');
    } else if (q.type === 'speaking_cards') {
      correctAnswerText = (q.options || []).map((o: any) => o.text).join('، ');
    } else if (q.type === 'unjumble' || q.type === 'anagram') {
      correctAnswerText = q.options?.[0]?.text || '';
    } else if (q.type === 'flash_cards') {
      correctAnswerText = 'إجابة جميع البطاقات بشكل صحيح';
    } else if (q.type === 'labelled_diagram') {
      correctAnswerText = 'تحديد جميع النقاط بشكل صحيح';
    } else if (q.type === 'maze_chase') {
      correctAnswerText = 'حل المتاهة بشكل صحيح';
    } else if (q.type === 'find_match' || q.type === 'match_up' || q.type === 'matching_pairs') {
      correctAnswerText = 'مطابقة جميع العناصر بشكل صحيح';
    } else if (q.type === 'group_sort') {
      correctAnswerText = 'تصنيف جميع العناصر بشكل صحيح';
    } else {
      const correctOptions = q.options?.filter((o: any) => o.isCorrect);
      correctAnswerText = correctOptions ? correctOptions.map((o: any) => o.text).join('، ') : '';
    }

    const earned = pointsEarned !== undefined ? pointsEarned : (isFullyCorrect ? (q.points || 100) : 0);

    setDetails(prev => [...prev, {
      questionId: q.id,
      questionText: q.text,
      studentAnswer: studentAnswer,
      correctAnswer: correctAnswerText,
      isCorrect: isFullyCorrect,
      pointsEarned: earned
    }]);
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setTimeLeft(questions[currentQuestionIndex + 1].timer || 30);
      setSelectedOption(null);
      setSelectedOptions([]);
      setIsAnswered(false);
    } else {
      finishTest();
    }
  };

  const finishTest = () => {
    const totalPoints = questions.reduce((acc, curr) => acc + (curr.points || 100), 0);
    const correctAnswers = details.filter(d => d.isCorrect).length;
    const wrongAnswers = details.length - correctAnswers;
    const timeSpentMs = Date.now() - startTime;
    const minutes = Math.floor(timeSpentMs / 60000);
    const seconds = Math.floor((timeSpentMs % 60000) / 1000);
    const timeSpentStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    const percentage = Math.round((score / totalPoints) * 100) || 0;

    if (!previewTest) {
      updateReportAPI(reportId, {
        score: percentage,
        time: timeSpentStr,
        status: 'مكتمل',
        details: details
      }).catch(console.error);
    }

    navigate('/student/result', { 
      state: { 
        score, 
        total: totalPoints,
        correct: correctAnswers,
        wrong: wrongAnswers,
        timeSpent: timeSpentStr,
        rank: Math.floor(Math.random() * 10) + 1, // Mock rank
        testId: test.id,
        previewTest: previewTest
      } 
    });
  };

  const renderQuestionContent = () => {
    if (q.type === 'speaking_cards') {
      return (
        <div className="space-y-8">
          <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-8 leading-tight">
            {q.text || 'احفظ الجمل ثم رتبها'}
          </h2>

          {speakingCardsPhase === 'memorize' && (
            <div className="flex flex-col items-center gap-8">
              <div className="flex gap-8 items-center justify-center w-full min-h-[200px]">
                {/* Stack */}
                <div 
                  className="relative w-48 h-64 cursor-pointer group"
                  onClick={() => {
                    if (speakingCardsStack.length > 0) {
                      const newStack = [...speakingCardsStack];
                      const topCard = newStack.pop();
                      setSpeakingCardsStack(newStack);
                      setSpeakingCardsCurrent(topCard);
                      if (!speakingCardsViewed.find(c => c.id === topCard.id)) {
                        setSpeakingCardsViewed([...speakingCardsViewed, topCard]);
                      }
                    }
                  }}
                >
                  {speakingCardsStack.map((card, i) => (
                    <div 
                      key={card.id}
                      className="absolute inset-0 bg-primary/20 border-2 border-primary rounded-2xl shadow-xl transition-transform group-hover:-translate-y-2"
                      style={{ 
                        transform: `translateY(${i * -4}px) translateX(${i * 2}px)`,
                        zIndex: i
                      }}
                    >
                      <div className="w-full h-full flex items-center justify-center opacity-50">
                        <Layers size={48} className="text-primary" />
                      </div>
                    </div>
                  ))}
                  {speakingCardsStack.length === 0 && (
                    <div className="absolute inset-0 border-2 border-dashed border-white/20 rounded-2xl flex items-center justify-center text-white/50">
                      فارغ
                    </div>
                  )}
                </div>

                {/* Viewing Area */}
                <div className="w-64 h-64">
                  {speakingCardsCurrent ? (
                    <div className="w-full h-full bg-white text-slate-900 rounded-2xl p-6 shadow-2xl flex items-center justify-center text-center font-bold text-xl border-4 border-primary animate-in zoom-in duration-300">
                      {speakingCardsCurrent.text}
                    </div>
                  ) : (
                    <div className="w-full h-full border-2 border-dashed border-white/20 rounded-2xl flex items-center justify-center text-white/50 text-center p-4">
                      اضغط على الرزمة لعرض البطاقة
                    </div>
                  )}
                </div>
              </div>

              {/* Viewed Cards Review */}
              {speakingCardsViewed.length > 0 && (
                <div className="w-full max-w-2xl">
                  <p className="text-white/70 text-sm mb-4 text-center">البطاقات التي تمت مشاهدتها (اضغط للمراجعة):</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {speakingCardsViewed.map((card, i) => (
                      <button
                        key={card.id}
                        onClick={() => setSpeakingCardsCurrent(card)}
                        className="w-10 h-10 rounded-lg bg-white/10 border border-white/20 text-white hover:bg-primary/20 hover:border-primary transition-colors flex items-center justify-center font-bold"
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={() => setSpeakingCardsPhase('sort')}
                disabled={speakingCardsStack.length > 0}
                className="w-full max-w-md py-4 bg-primary text-white rounded-2xl font-bold text-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-8"
              >
                تم الحفظ (انتقل للترتيب)
              </button>
            </div>
          )}

          {speakingCardsPhase === 'sort' && (
            <div className="flex flex-col items-center gap-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-3xl">
                {speakingCardsShuffled.map((card) => {
                  const orderIndex = speakingCardsSortOrder.indexOf(card.id);
                  const isSelected = orderIndex !== -1;
                  
                  let cardClass = "bg-background-dark border-white/10 text-white hover:border-primary/50";
                  if (isSelected) {
                    cardClass = "bg-primary/20 border-primary text-primary";
                  }
                  
                  if (isAnswered) {
                    const isCorrectPos = card.originalIndex === orderIndex;
                    cardClass = isCorrectPos 
                      ? "bg-green-500/20 border-green-500 text-green-400" 
                      : "bg-red-500/20 border-red-500 text-red-400";
                  }

                  return (
                    <button
                      key={card.id}
                      disabled={isAnswered}
                      onClick={() => {
                        if (isSelected) {
                          setSpeakingCardsSortOrder(speakingCardsSortOrder.filter(id => id !== card.id));
                        } else {
                          setSpeakingCardsSortOrder([...speakingCardsSortOrder, card.id]);
                        }
                      }}
                      className={cn(
                        "p-4 rounded-xl border-2 transition-all duration-300 flex items-center gap-4 text-right min-h-[80px] relative",
                        cardClass
                      )}
                    >
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0 border-2",
                        isSelected ? "border-primary bg-primary text-white" : "border-white/20 text-transparent",
                        isAnswered && (card.originalIndex === orderIndex ? "border-green-500 bg-green-500" : "border-red-500 bg-red-500")
                      )}>
                        {isSelected ? orderIndex + 1 : ''}
                      </div>
                      <span className="font-bold flex-1">{card.text}</span>
                      
                      {isAnswered && (
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white text-slate-900 flex items-center justify-center font-bold text-sm shadow-lg">
                          {card.originalIndex + 1}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {!isAnswered && (
                <button
                  onClick={handleSpeakingCardsSubmit}
                  disabled={speakingCardsSortOrder.length !== (q.options?.length || 0)}
                  className="w-full max-w-md py-4 bg-primary text-white rounded-2xl font-bold text-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-8"
                >
                  تأكيد الترتيب
                </button>
              )}
            </div>
          )}
        </div>
      );
    }

    if (q.type === 'complete_sentence') {
      const parts = (q.text || '').split(/\[.*?\]/);
      const matches = (q.text || '').match(/\[(.*?)\]/g) || [];

      return (
        <div className="space-y-8">
          <div className="text-2xl md:text-3xl font-bold text-white text-center leading-loose flex flex-wrap items-center justify-center gap-2">
            {parts.map((part: string, index: number) => (
              <span key={index} className="flex items-center gap-2">
                <span>{part}</span>
                {index < matches.length && (
                  <button
                    disabled={isAnswered}
                    onClick={() => {
                      if (selectedCompleteSentenceOption) {
                        const newAnswers = [...completeSentenceAnswers];
                        newAnswers[index] = selectedCompleteSentenceOption;
                        setCompleteSentenceAnswers(newAnswers);
                        setSelectedCompleteSentenceOption(null);
                      } else if (completeSentenceAnswers[index]) {
                        // Remove answer
                        const newAnswers = [...completeSentenceAnswers];
                        newAnswers[index] = null;
                        setCompleteSentenceAnswers(newAnswers);
                      }
                    }}
                    className={cn(
                      "min-w-[100px] h-10 border-b-2 px-4 flex items-center justify-center transition-colors",
                      completeSentenceAnswers[index] ? "border-primary text-primary" : "border-white/20 text-transparent",
                      selectedCompleteSentenceOption && !completeSentenceAnswers[index] && "hover:border-primary/50 cursor-pointer",
                      isAnswered && (
                        completeSentenceAnswers[index]?.trim().toLowerCase() === matches[index].replace(/\[|\]/g, '').trim().toLowerCase()
                          ? "border-green-500 text-green-400"
                          : "border-red-500 text-red-400"
                      )
                    )}
                  >
                    {completeSentenceAnswers[index] || '...'}
                  </button>
                )}
              </span>
            ))}
          </div>

          {!isAnswered && (
            <div className="flex flex-wrap justify-center gap-3 mt-8">
              {completeSentenceOptions.map((opt, idx) => {
                const isUsed = completeSentenceAnswers.includes(opt);
                return (
                  <button
                    key={idx}
                    onClick={() => !isUsed && setSelectedCompleteSentenceOption(selectedCompleteSentenceOption === opt ? null : opt)}
                    disabled={isUsed}
                    className={cn(
                      "px-4 py-2 rounded-xl border-2 transition-all duration-300 font-bold",
                      isUsed ? "opacity-30 cursor-not-allowed border-white/10 bg-white/5 text-white/50" :
                      selectedCompleteSentenceOption === opt 
                        ? "bg-primary/20 border-primary text-primary scale-105" 
                        : "bg-background-dark border-white/10 text-white hover:border-primary/50"
                    )}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          )}
          
          {isAnswered && (
            <div className="mt-6 p-4 rounded-xl bg-background-dark border border-white/10 text-center">
              <p className="text-slate-400 text-sm mb-2">الإجابة الصحيحة:</p>
              <p className="text-green-400 font-bold text-lg">
                {matches.map((m: string) => m.replace(/\[|\]/g, '')).join('، ')}
              </p>
            </div>
          )}

          {!isAnswered && (
            <button
              onClick={handleCompleteSentenceSubmit}
              disabled={completeSentenceAnswers.some(a => !a)}
              className="w-full py-4 bg-primary text-white rounded-2xl font-bold text-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-8"
            >
              تأكيد الإجابة
            </button>
          )}
        </div>
      );
    }

    if (q.type === 'fill_blanks') {
      const parts = (q.text || '').split(/\[.*?\]/);
      const matches = (q.text || '').match(/\[(.*?)\]/g) || [];

      return (
        <div className="space-y-8">
          <div className="text-2xl md:text-3xl font-bold text-white text-center leading-loose flex flex-wrap items-center justify-center gap-2">
            {parts.map((part: string, index: number) => (
              <span key={index} className="flex items-center gap-2">
                <span>{part}</span>
                {index < matches.length && (
                  <input
                    type="text"
                    disabled={isAnswered}
                    value={fillBlanksAnswers[index] || ''}
                    onChange={(e) => {
                      const newAnswers = [...fillBlanksAnswers];
                      newAnswers[index] = e.target.value;
                      setFillBlanksAnswers(newAnswers);
                    }}
                    className={cn(
                      "w-32 bg-background-dark border-b-2 border-white/20 px-2 py-1 text-center text-primary focus:border-primary outline-none transition-colors",
                      isAnswered && (
                        fillBlanksAnswers[index]?.trim().toLowerCase() === matches[index].replace(/\[|\]/g, '').trim().toLowerCase()
                          ? "border-green-500 text-green-400"
                          : "border-red-500 text-red-400"
                      )
                    )}
                  />
                )}
              </span>
            ))}
          </div>
          
          {isAnswered && (
            <div className="mt-6 p-4 rounded-xl bg-background-dark border border-white/10 text-center">
              <p className="text-slate-400 text-sm mb-2">الإجابة الصحيحة:</p>
              <p className="text-green-400 font-bold text-lg">
                {matches.map((m: string) => m.replace(/\[|\]/g, '')).join('، ')}
              </p>
            </div>
          )}

          {!isAnswered && (
            <button
              onClick={handleFillBlanksSubmit}
              disabled={fillBlanksAnswers.some(a => !a.trim())}
              className="w-full py-4 bg-primary text-white rounded-2xl font-bold text-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-8"
            >
              تأكيد الإجابة
            </button>
          )}
        </div>
      );
    }

    if (q.type === 'labelled_diagram') {
      return (
        <div className="space-y-8">
          <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-8 leading-tight">
            {q.text || 'حدد النقاط على الصورة'}
          </h2>

          <div className="flex flex-col items-center gap-8">
            {!isAnswered && diagramCurrentPoint && (
              <div className="bg-primary/20 border border-primary text-primary px-6 py-3 rounded-full font-bold text-xl animate-pulse">
                حدد: {diagramCurrentPoint.text}
              </div>
            )}

            <div className="relative inline-block w-full max-w-3xl bg-white/5 p-4 rounded-2xl border border-white/10">
              <div 
                className="relative cursor-crosshair"
                onClick={handleDiagramClick}
              >
                <img src={q.options?.[0]?.image} alt="" className="w-full rounded-lg" />
                
                {/* Student Answers */}
                {diagramAnswers.map((ans, idx) => (
                  <div 
                    key={`ans-${idx}`}
                    className="absolute w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold -translate-x-1/2 -translate-y-1/2 shadow-lg shadow-primary/50"
                    style={{ left: `${ans.x}%`, top: `${ans.y}%` }}
                  >
                    {idx + 1}
                  </div>
                ))}

                {/* Correct Answers (shown after answering) */}
                {isAnswered && diagramPoints.map((point, idx) => (
                  <div 
                    key={`correct-${idx}`}
                    className="absolute w-8 h-8 bg-green-500/80 text-white rounded-full flex items-center justify-center text-sm font-bold -translate-x-1/2 -translate-y-1/2 border-2 border-white shadow-lg"
                    style={{ left: `${point.x}%`, top: `${point.y}%` }}
                  >
                    {idx + 1}
                  </div>
                ))}
              </div>
            </div>

            {isAnswered && (
              <div className="w-full max-w-md bg-background-dark border border-white/10 rounded-xl p-4">
                <h4 className="text-white font-bold mb-4 text-center">النقاط الصحيحة</h4>
                <div className="space-y-2">
                  {diagramPoints.map((point, idx) => (
                    <div key={point.id} className="flex items-center gap-3 text-slate-300">
                      <span className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                        {idx + 1}
                      </span>
                      <span>{point.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    if (q.type === 'maze_chase') {
      return (
        <div className="space-y-8">
          <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-8 leading-tight">
            {q.text || 'حل المتاهة'}
          </h2>

          <div className="flex flex-col items-center gap-8">
            <div className="relative inline-block w-full max-w-3xl bg-white/5 p-4 rounded-2xl border border-white/10">
              <div 
                className="relative touch-none"
                onPointerDown={(e) => {
                  if (isAnswered) return;
                  setIsDrawingMaze(true);
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = ((e.clientX - rect.left) / rect.width) * 100;
                  const y = ((e.clientY - rect.top) / rect.height) * 100;
                  setMazePath([{x, y}]);
                }}
                onPointerMove={(e) => {
                  if (!isDrawingMaze || isAnswered) return;
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = ((e.clientX - rect.left) / rect.width) * 100;
                  const y = ((e.clientY - rect.top) / rect.height) * 100;
                  setMazePath(prev => [...prev, {x, y}]);
                }}
                onPointerUp={() => setIsDrawingMaze(false)}
                onPointerLeave={() => setIsDrawingMaze(false)}
              >
                <img src={q.options?.[0]?.image} alt="" className="w-full rounded-lg pointer-events-none" />
                
                {/* Teacher Path (Correct Answer) */}
                {isAnswered && (
                  <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                    {(() => {
                      try {
                        const teacherPath = JSON.parse(q.options?.[0]?.text || '[]');
                        if (teacherPath.length > 1) {
                          return (
                            <polyline
                              points={teacherPath.map((p: any) => `${p.x}%,${p.y}%`).join(' ')}
                              fill="none"
                              stroke="red"
                              strokeWidth="6"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="drop-shadow-md opacity-80"
                            />
                          );
                        }
                      } catch (e) {}
                      return null;
                    })()}
                  </svg>
                )}

                {/* Student Path */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-20">
                  {mazePath.length > 1 && (
                    <polyline
                      points={mazePath.map(p => `${p.x}%,${p.y}%`).join(' ')}
                      fill="none"
                      stroke={isAnswered ? (score > 0 ? "var(--color-primary)" : "gray") : "var(--color-primary)"}
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="drop-shadow-md"
                    />
                  )}
                </svg>
              </div>
            </div>

            {!isAnswered && (
              <div className="flex gap-4 w-full max-w-md">
                <button
                  onClick={() => setMazePath([])}
                  className="flex-1 py-4 bg-white/10 text-white rounded-2xl font-bold text-xl hover:bg-white/20 transition-colors"
                >
                  مسح
                </button>
                <button
                  onClick={handleMazeSubmit}
                  disabled={mazePath.length === 0}
                  className="flex-1 py-4 bg-primary text-white rounded-2xl font-bold text-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  تأكيد
                </button>
              </div>
            )}
          </div>
        </div>
      );
    }

    if (q.type === 'flash_cards') {
      return (
        <div className="space-y-8">
          <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-8 leading-tight">
            {q.text || 'البطاقات التعليمية'}
          </h2>

          <div className="flex flex-col items-center gap-8">
            {flashCardCurrent ? (
              <div key={flashCardCurrent.id} className="w-full max-w-md perspective-1000">
                <div 
                  className={cn(
                    "relative w-full h-64 transition-transform duration-500 transform-style-3d cursor-pointer",
                    flashCardFlipped ? "rotate-y-180" : ""
                  )}
                  onClick={() => !isAnswered && setFlashCardFlipped(!flashCardFlipped)}
                >
                  {/* Front */}
                  <div className="absolute w-full h-full backface-hidden bg-sky-400 border-4 border-sky-500 rounded-2xl flex flex-col items-center justify-center p-6 shadow-xl shadow-sky-400/20">
                    <div className="text-center text-white/90 font-medium mb-4 text-lg">
                      {q.text || 'هل هذه البطاقة صحيحة؟ yes or not'}
                    </div>
                    <div className="text-center flex-1 flex flex-col items-center justify-center">
                      {flashCardCurrent.image && (
                        <img src={flashCardCurrent.image} alt="" className="h-32 object-contain mx-auto mb-4 rounded-lg" />
                      )}
                      {flashCardCurrent.text && (
                        <span className="font-bold text-3xl text-white">{flashCardCurrent.text}</span>
                      )}
                    </div>
                  </div>

                  {/* Back */}
                  <div className="absolute w-full h-full backface-hidden rotate-y-180 bg-sky-400 border-4 border-sky-500 rounded-2xl flex flex-col items-center justify-center p-6 shadow-xl shadow-sky-400/20">
                    <div className="text-center text-white/90 font-medium mb-4 text-lg">
                      {q.text || 'هل هذه البطاقة صحيحة؟ yes or not'}
                    </div>
                    <div className="text-center flex-1 flex flex-col items-center justify-center">
                      {flashCardCurrent.matchImage && (
                        <img src={flashCardCurrent.matchImage} alt="" className="h-32 object-contain mx-auto mb-4 rounded-lg" />
                      )}
                      {flashCardCurrent.matchText && (
                        <span className="font-bold text-3xl text-white">{flashCardCurrent.matchText}</span>
                      )}
                    </div>
                  </div>
                </div>

                {flashCardFlipped && !isAnswered && !flashCardFeedback && (
                  <div className="flex flex-col gap-4 mt-8 animate-in fade-in slide-in-from-bottom-4">
                    <div className="text-center text-white font-bold text-xl mb-2">هل هذا متطابق؟</div>
                    <div className="flex gap-4">
                      <button
                        onClick={() => handleFlashCardAnswer(true)}
                        className="flex-1 py-4 bg-green-500/20 border-2 border-green-500 text-green-400 rounded-xl font-bold text-xl hover:bg-green-500 hover:text-white transition-all"
                      >
                        نعم
                      </button>
                      <button
                        onClick={() => handleFlashCardAnswer(false)}
                        className="flex-1 py-4 bg-red-500/20 border-2 border-red-500 text-red-400 rounded-xl font-bold text-xl hover:bg-red-500 hover:text-white transition-all"
                      >
                        لا
                      </button>
                    </div>
                  </div>
                )}
                {flashCardFeedback && (
                  <div className={cn(
                    "mt-8 py-4 rounded-xl font-bold text-xl text-center animate-in fade-in slide-in-from-bottom-4",
                    flashCardFeedback === 'correct' ? "bg-green-500/20 text-green-400 border-2 border-green-500" : "bg-red-500/20 text-red-400 border-2 border-red-500"
                  )}>
                    {flashCardFeedback === 'correct' ? 'إجابة صحيحة!' : 'إجابة خاطئة!'}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center space-y-4">
                <span className="font-bold text-2xl text-green-400 flex items-center justify-center gap-2">
                  <CheckCircle2 size={32} />
                  اكتملت البطاقات
                </span>
                <div className="text-slate-300">
                  النتيجة: {flashCardResults.filter(r => r.isCorrect).length} من {flashCardResults.length}
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    if (q.type === 'unjumble' || q.type === 'anagram') {
      const isArabic = /[\u0600-\u06FF]/.test(q.options?.[0]?.text || '');
      const dir = isArabic ? 'rtl' : 'ltr';
      const expectedItems = q.type === 'unjumble' 
        ? (q.options?.[0]?.text || '').split(' ').filter((w: string) => w.trim() !== '')
        : (q.options?.[0]?.text || '').split('').filter((c: string) => c.trim() !== '');

      return (
        <div className="space-y-8" dir={dir}>
          <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-8 leading-tight">
            {q.text || (q.type === 'unjumble' ? 'رتب الكلمات لتكوين جملة مفيدة' : 'رتب الحروف لتكوين الكلمة الصحيحة')}
          </h2>

          <div className="flex flex-col items-center gap-8">
            {/* Answer Area */}
            <div className="flex flex-wrap justify-center gap-2 min-h-[60px] p-4 bg-background-dark/50 rounded-2xl border border-white/10 w-full max-w-3xl">
              {jumbleAnswers.map((item, index) => (
                <button
                  key={`answer-${index}`}
                  disabled={isAnswered || !item}
                  onClick={() => {
                    const newAnswers = [...jumbleAnswers];
                    newAnswers[index] = null;
                    setJumbleAnswers(newAnswers);
                  }}
                  className={cn(
                    "h-12 min-w-[3rem] px-4 rounded-xl flex items-center justify-center font-bold text-lg transition-all",
                    item 
                      ? "bg-primary/20 border-2 border-primary text-primary hover:bg-red-500/20 hover:border-red-500 hover:text-red-400" 
                      : "border-2 border-dashed border-white/20 text-transparent",
                    isAnswered && item && (
                      item.text === expectedItems[index]
                        ? "bg-green-500/20 border-green-500 text-green-400"
                        : "bg-red-500/20 border-red-500 text-red-400"
                    )
                  )}
                >
                  {item ? item.text : ''}
                </button>
              ))}
            </div>

            {/* Items Pool */}
            {!isAnswered && (
              <div className="flex flex-wrap justify-center gap-3 w-full max-w-3xl">
                {jumbleItems.map((item) => {
                  const isUsed = jumbleAnswers.some(a => a?.id === item.id);
                  return (
                    <button
                      key={item.id}
                      disabled={isUsed}
                      onClick={() => {
                        const emptyIndex = jumbleAnswers.findIndex(a => a === null);
                        if (emptyIndex !== -1) {
                          const newAnswers = [...jumbleAnswers];
                          newAnswers[emptyIndex] = item;
                          setJumbleAnswers(newAnswers);
                        }
                      }}
                      className={cn(
                        "h-12 px-4 rounded-xl border-2 font-bold text-lg transition-all duration-300",
                        isUsed 
                          ? "opacity-30 cursor-not-allowed border-white/10 bg-white/5 text-white/50" 
                          : "bg-background-dark border-white/10 text-white hover:border-primary/50 hover:bg-primary/5 hover:-translate-y-1"
                      )}
                    >
                      {item.text}
                    </button>
                  );
                })}
              </div>
            )}

            {isAnswered && (
              <div className="mt-6 p-4 rounded-xl bg-background-dark border border-white/10 text-center w-full max-w-md">
                <p className="text-slate-400 text-sm mb-2">الإجابة الصحيحة:</p>
                <p className="text-green-400 font-bold text-xl">
                  {q.options?.[0]?.text}
                </p>
              </div>
            )}

            {!isAnswered && (
              <button
                onClick={handleJumbleSubmit}
                disabled={jumbleAnswers.some(a => a === null)}
                className="w-full max-w-md py-4 bg-primary text-white rounded-2xl font-bold text-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-8"
              >
                تأكيد الإجابة
              </button>
            )}
          </div>
        </div>
      );
    }

    if (q.type === 'find_match') {
      return (
        <div className="space-y-8">
          <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-8 leading-tight">
            {q.text || 'طابق بين العناصر التالية'}
          </h2>
          
          <div className="flex flex-col items-center gap-8">
            {/* Current Item to Match (Moving Piece) */}
            <div className="w-full h-32 relative overflow-hidden bg-white/5 border border-white/10 rounded-2xl flex items-center shadow-inner">
              {findMatchCurrent ? (
                <motion.div
                  key={`${findMatchCurrent.id}-${findMatchWrongAttempts}`}
                  initial={{ left: '100%' }}
                  animate={{ left: '-100%' }}
                  transition={{ 
                    duration: Math.max(2, 12 - (q.speed || 5)), 
                    ease: "linear"
                  }}
                  onAnimationComplete={() => {
                    // If it finishes moving without being clicked, put it at the end of the queue
                    if (!isAnswered) {
                      const newQueue = [...findMatchQueue.slice(1), findMatchCurrent];
                      setFindMatchQueue(newQueue);
                      setFindMatchCurrent(newQueue[0]);
                      setFindMatchWrongAttempts(prev => prev + 1);
                    }
                  }}
                  className="absolute whitespace-nowrap bg-primary/20 border-2 border-primary rounded-xl p-4 shadow-xl shadow-primary/20 flex items-center gap-4"
                >
                  {findMatchCurrent.image && (
                    <img src={findMatchCurrent.image} alt="" className="h-16 object-contain rounded-lg" />
                  )}
                  {findMatchCurrent.text && (
                    <span className="font-bold text-2xl text-white">{findMatchCurrent.text}</span>
                  )}
                </motion.div>
              ) : (
                <div className="w-full text-center">
                  <span className="font-bold text-2xl text-green-400 flex items-center justify-center gap-2">
                    <CheckCircle2 size={32} />
                    اكتملت المطابقة
                  </span>
                </div>
              )}
            </div>

            {/* Options Grid (Random Papers) */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full">
              {findMatchOptions.map((opt) => {
                const isMatched = opt.matched;
                
                return (
                  <button
                    key={opt.id}
                    onClick={() => handleFindMatchSelect(opt.matchId)}
                    disabled={isAnswered || isMatched || !findMatchCurrent}
                    className={cn(
                      "p-6 rounded-2xl border-2 transition-all duration-300 flex flex-col items-center justify-center gap-4 text-center min-h-[120px]",
                      isMatched 
                        ? "opacity-0 pointer-events-none scale-95" 
                        : "bg-background-dark border-white/10 text-white hover:border-primary/50 hover:bg-primary/5 hover:scale-105"
                    )}
                  >
                    {opt.image && (
                      <img src={opt.image} alt="" className="w-16 h-16 object-cover rounded-xl" />
                    )}
                    {opt.text && <span className="font-bold text-lg">{opt.text}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      );
    }

    if (q.type === 'match_up' || (q.type === 'matching_pairs' && test.settings?.limitOneResponse)) {
      return (
        <div className="space-y-8">
          <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-8 leading-tight">
            {q.text || 'طابق بين العناصر التالية'}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {matchCards.map((card, index) => {
              const isSelected = selectedMatchCards.includes(index);
              const isMatched = card.matched || matchUpPairs[index] !== undefined;
              const isCorrectlyMatched = isAnswered && matchUpPairs[index] !== undefined && matchCards[index].matchId === matchCards[matchUpPairs[index]].matchId;
              const isIncorrectlyMatched = isAnswered && matchUpPairs[index] !== undefined && matchCards[index].matchId !== matchCards[matchUpPairs[index]].matchId;
              
              let cardClass = "bg-background-dark border-white/10 text-white hover:border-primary/50 hover:bg-primary/5";
              if (isCorrectlyMatched) {
                cardClass = "bg-green-500/20 border-green-500 text-green-400 opacity-50 cursor-not-allowed";
              } else if (isIncorrectlyMatched) {
                cardClass = "bg-red-500/20 border-red-500 text-red-400 opacity-50 cursor-not-allowed";
              } else if (isMatched) {
                cardClass = "bg-primary/20 border-primary text-primary opacity-50 cursor-not-allowed";
              } else if (isSelected) {
                cardClass = "bg-primary/20 border-primary text-primary scale-105 shadow-lg shadow-primary/20";
              }

              return (
                <button
                  key={card.id}
                  onClick={() => handleMatchCardClick(index)}
                  disabled={isAnswered || isMatched}
                  className={cn(
                    "p-6 rounded-2xl border-2 transition-all duration-300 flex flex-col items-center justify-center gap-4 text-center min-h-[120px]",
                    cardClass
                  )}
                >
                  {card.image && (
                    <img src={card.image} alt="" className="w-16 h-16 object-cover rounded-xl" />
                  )}
                  {card.text && <span className="font-bold text-lg">{card.text}</span>}
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    if (q.type === 'matching_pairs' && !test.settings?.limitOneResponse) {
      return (
        <div className="space-y-8">
          <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-8 leading-tight">
            {q.text || 'ابحث عن الأزواج المتطابقة'}
          </h2>
          <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
            {matchCards.map((card, index) => {
              const isSelected = selectedMatchCards.includes(index);
              const isMatched = card.matched;
              const isFlipped = isSelected || isMatched;
              
              return (
                <button
                  key={card.id}
                  onClick={() => handleMatchCardClick(index)}
                  disabled={isAnswered || isMatched || isSelected || selectedMatchCards.length >= 2}
                  className={cn(
                    "relative w-full aspect-square rounded-2xl transition-all duration-500 transform-style-3d",
                    isFlipped ? "rotate-y-180" : "hover:scale-105",
                    isMatched && "opacity-0 pointer-events-none"
                  )}
                  style={{ perspective: '1000px' }}
                >
                  {/* Front side (Logo) */}
                  <div className={cn(
                    "absolute inset-0 w-full h-full rounded-2xl border-2 backface-hidden flex flex-col items-center justify-center gap-2 p-4 text-center bg-primary/20 border-primary/50 text-primary"
                  )}>
                    <img src="/logo.png" alt="Nebras Logo" className="w-16 h-16 object-contain opacity-80" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                    <span className="font-bold text-sm">Nebras</span>
                  </div>

                  {/* Back side (Content) */}
                  <div className={cn(
                    "absolute inset-0 w-full h-full rounded-2xl border-2 backface-hidden flex flex-col items-center justify-center gap-2 p-4 text-center bg-background-dark border-primary text-white rotate-y-180"
                  )}>
                    {card.image && <img src={card.image} alt="" className="w-12 h-12 object-cover rounded-lg" />}
                    {card.text && <span className="font-bold text-sm">{card.text}</span>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    if (q.type === 'group_sort') {
      return (
        <div className="space-y-8">
          <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-8 leading-tight">
            {q.text || 'صنف العناصر التالية في المجموعات المناسبة'}
          </h2>
          
          {/* Options to sort */}
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            {(q.options || []).filter((opt: any) => !groupSortAnswers[opt.id]).map((opt: any) => (
              <button
                key={opt.id}
                onClick={() => setSelectedSortOption(selectedSortOption === opt.id ? null : opt.id)}
                disabled={isAnswered}
                className={cn(
                  "px-4 py-2 rounded-xl border-2 transition-all duration-300 flex items-center gap-2",
                  selectedSortOption === opt.id 
                    ? "bg-primary/20 border-primary text-primary scale-105" 
                    : "bg-background-dark border-white/10 text-white hover:border-primary/50"
                )}
              >
                {opt.image && <img src={opt.image} alt="" className="w-8 h-8 rounded object-cover" />}
                <span>{opt.text}</span>
              </button>
            ))}
          </div>

          {/* Groups */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {q.groups?.map((group: any) => (
              <div 
                key={group.id}
                onClick={() => {
                  if (selectedSortOption && !isAnswered) {
                    setGroupSortAnswers(prev => ({ ...prev, [selectedSortOption]: group.id }));
                    setSelectedSortOption(null);
                  }
                }}
                className={cn(
                  "p-4 rounded-2xl border-2 min-h-[150px] transition-all duration-300",
                  selectedSortOption && !isAnswered
                    ? "border-primary/50 bg-primary/5 cursor-pointer hover:bg-primary/10" 
                    : "border-white/10 bg-background-dark/50"
                )}
              >
                <h3 className="text-lg font-bold text-white text-center mb-4 pb-2 border-b border-white/10">
                  {group.title}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {(q.options || []).filter((opt: any) => groupSortAnswers[opt.id] === group.id).map((opt: any) => {
                    let itemClass = "bg-surface-dark border-white/10 text-white";
                    if (isAnswered) {
                      itemClass = opt.groupId === group.id 
                        ? "bg-green-500/20 border-green-500 text-green-400" 
                        : "bg-red-500/20 border-red-500 text-red-400";
                    }

                    return (
                      <button
                        key={opt.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isAnswered) {
                            const newAnswers = { ...groupSortAnswers };
                            delete newAnswers[opt.id];
                            setGroupSortAnswers(newAnswers);
                          }
                        }}
                        disabled={isAnswered}
                        className={cn(
                          "px-3 py-1.5 rounded-lg border flex items-center gap-2 text-sm transition-all",
                          itemClass,
                          !isAnswered && "hover:border-red-500/50 hover:bg-red-500/10"
                        )}
                      >
                        {opt.image && <img src={opt.image} alt="" className="w-6 h-6 rounded object-cover" />}
                        <span>{opt.text}</span>
                        {!isAnswered && <X size={14} className="opacity-50" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {!isAnswered && (
            <button
              onClick={handleGroupSortSubmit}
              disabled={Object.keys(groupSortAnswers).length !== (q.options?.length || 0)}
              className="w-full py-4 bg-primary text-white rounded-2xl font-bold text-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-8"
            >
              تأكيد الإجابة
            </button>
          )}
        </div>
      );
    }

    return (
      <>
        <h2 className="text-2xl md:text-4xl font-bold text-white text-center mb-12 leading-tight">
          {q.text}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {q.options?.map((option: any) => {
            let optionStateClass = "bg-background-dark border-white/10 text-white hover:border-primary/50 hover:bg-primary/5";
            let Icon = null;

            if (isAnswered) {
              if (option.isCorrect) {
                optionStateClass = "bg-green-500/20 border-green-500 text-green-400";
                Icon = CheckCircle2;
              } else if (selectedOptions.includes(option.id) || selectedOption === option.id) {
                optionStateClass = "bg-red-500/20 border-red-500 text-red-400";
                Icon = XCircle;
              } else {
                optionStateClass = "bg-background-dark border-white/5 text-slate-500 opacity-50";
              }
            } else if (selectedOptions.includes(option.id)) {
              optionStateClass = "bg-primary/20 border-primary text-white";
            }

            return (
              <button
                key={option.id}
                disabled={isAnswered}
                onClick={() => handleOptionSelect(option.id, option.isCorrect, option.text)}
                className={cn(
                  "relative p-6 rounded-2xl border-2 text-xl font-medium transition-all duration-300 flex items-center justify-center min-h-[100px] gap-3",
                  optionStateClass,
                  !isAnswered && "active:scale-95"
                )}
              >
                {option.image && <img src={option.image} alt="" className="w-10 h-10 rounded object-cover" />}
                {option.text}
                {Icon && (
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute left-4"
                  >
                    <Icon size={28} />
                  </motion.div>
                )}
              </button>
            );
          })}
        </div>
        
        {(q.options?.filter((o: any) => o.isCorrect)?.length || 0) > 1 && !isAnswered && (
          <button
            onClick={handleMultipleChoiceSubmit}
            disabled={selectedOptions.length === 0}
            className="w-full py-4 bg-primary text-white rounded-2xl font-bold text-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-8"
          >
            تأكيد الإجابة
          </button>
        )}
      </>
    );
  };

  return (
    <div className="min-h-screen flex flex-col islamic-pattern relative" style={{
      backgroundColor: test.settings?.theme?.background || '#020617',
      backgroundImage: test.settings?.theme?.backgroundImage ? `url(${test.settings?.theme?.backgroundImage})` : undefined,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed'
    }}>
      {/* Overlay to ensure text readability if background image is used */}
      {test.settings?.theme?.backgroundImage && (
        <div className="absolute inset-0 bg-black/50 z-0"></div>
      )}
      
      {/* Top Bar */}
      <header className="bg-surface-dark/80 backdrop-blur-md p-4 border-b border-white/10 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-2 bg-background-dark px-4 py-2 rounded-full border border-white/5">
          <Star className="text-accent-gold fill-accent-gold" size={20} />
          <span className="text-white font-bold text-lg">{score}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-medium">السؤال {currentQuestionIndex + 1} من {questions.length}</span>
        </div>

        <div className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-full border transition-colors",
          timeLeft <= 5 ? "bg-red-500/20 border-red-500/50 text-red-500" : "bg-background-dark border-white/5 text-white"
        )}>
          <Timer size={20} />
          <span className="font-bold text-lg font-mono">{timeLeft}</span>
        </div>
      </header>

      {/* Main Play Area */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-3xl">
          {/* Question Card */}
          <motion.div 
            key={currentQuestionIndex}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-surface-dark/90 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 md:p-12 shadow-2xl relative overflow-hidden"
          >
            {/* Progress bar */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-background-dark">
              <motion.div 
                className="h-full bg-primary"
                style={{ backgroundColor: test.settings?.theme?.color || '#3b82f6' }}
                initial={{ width: '100%' }}
                animate={{ width: `${(timeLeft / (q.timer || 30)) * 100}%` }}
                transition={{ duration: 1, ease: "linear" }}
              />
            </div>

            {q.image && (
              <img src={q.image} alt="Question" className="w-full h-48 object-cover rounded-2xl mb-6 border border-white/10" />
            )}

            {renderQuestionContent()}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
