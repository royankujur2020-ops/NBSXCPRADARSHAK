import React, { useState, useRef, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import { Camera, RefreshCw, BookOpen, Languages, Loader2, X, Sparkles, ArrowRight, History, Trash2, Lightbulb } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { analyzeProblem } from './lib/gemini';
import { cn } from './lib/utils';

const LANGUAGES = [
  { label: 'Bengali', value: 'Bengali' },
  { label: 'Nepali', value: 'Nepali' },
  { label: 'Hindi', value: 'Hindi' },
  { label: 'English', value: 'English' },
];

interface HistoryItem {
  id: string;
  image: string;
  explanation: string;
  language: string;
  timestamp: number;
}

type View = 'scan' | 'library' | 'tips';

export default function App() {
  const [currentView, setCurrentView] = useState<View>('scan');
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [selectedLang, setSelectedLang] = useState('Bengali');
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<HistoryItem | null>(null);
  
  const webcamRef = useRef<Webcam>(null);

  // Load history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('pradarshak_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  // Save history to localStorage
  const saveHistory = (newHistory: HistoryItem[]) => {
    setHistory(newHistory);
    localStorage.setItem('pradarshak_history', JSON.stringify(newHistory));
  };

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setImage(imageSrc);
      handleAnalyze(imageSrc);
    }
  }, [webcamRef, selectedLang, history]);

  const handleAnalyze = async (imgBase64: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await analyzeProblem(imgBase64, selectedLang);
      if (result) {
        setExplanation(result);
        // Add to history
        const newItem: HistoryItem = {
          id: Date.now().toString(),
          image: imgBase64,
          explanation: result,
          language: selectedLang,
          timestamp: Date.now(),
        };
        saveHistory([newItem, ...history]);
      } else {
        setError("Could not generate explanation. Please try again.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to connect to the AI mentor. Please check your connection.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setImage(null);
    setExplanation(null);
    setError(null);
    setSelectedHistoryItem(null);
  };

  const deleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newHistory = history.filter(item => item.id !== id);
    saveHistory(newHistory);
  };

  const renderScanView = () => (
    <AnimatePresence mode="wait">
      {!image ? (
        <motion.div 
          key="camera"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="space-y-6"
        >
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-stone-800">Hello, Student!</h2>
            <p className="text-stone-500">Point your camera at a textbook problem or your notes to get help.</p>
          </div>

          <div className="relative aspect-[3/4] bg-black rounded-3xl overflow-hidden shadow-2xl border-4 border-white">
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              videoConstraints={{ facingMode: 'environment' }}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 border-2 border-dashed border-white/30 m-8 rounded-xl pointer-events-none flex items-center justify-center">
              <div className="w-12 h-12 border-t-2 border-l-2 border-white absolute top-0 left-0 rounded-tl-lg" />
              <div className="w-12 h-12 border-t-2 border-r-2 border-white absolute top-0 right-0 rounded-tr-lg" />
              <div className="w-12 h-12 border-b-2 border-l-2 border-white absolute bottom-0 left-0 rounded-bl-lg" />
              <div className="w-12 h-12 border-b-2 border-r-2 border-white absolute bottom-0 right-0 rounded-br-lg" />
            </div>
          </div>

          <button
            onClick={capture}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-emerald-200 flex items-center justify-center gap-3 transition-all active:scale-95"
          >
            <Camera className="w-6 h-6" />
            Capture & Learn
          </button>
        </motion.div>
      ) : (
        <motion.div 
          key="result"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-6"
        >
          <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-lg border-2 border-white">
            <img src={image} alt="Captured" className="w-full h-full object-cover" />
            <button 
              onClick={reset}
              className="absolute top-3 right-3 bg-black/50 text-white p-2 rounded-full backdrop-blur-sm hover:bg-black/70"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {loading ? (
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-stone-100 flex flex-col items-center justify-center gap-4 min-h-[300px]">
              <Loader2 className="w-12 h-12 text-emerald-600 animate-spin" />
              <div className="text-center">
                <p className="font-bold text-lg text-emerald-900">Pradarshak is thinking...</p>
                <p className="text-stone-400 text-sm">Analyzing your problem with local metaphors</p>
              </div>
            </div>
          ) : error ? (
            <div className="bg-red-50 rounded-3xl p-8 border border-red-100 text-center space-y-4">
              <p className="text-red-600 font-medium">{error}</p>
              <button 
                onClick={() => handleAnalyze(image)}
                className="flex items-center gap-2 mx-auto text-red-700 font-bold"
              >
                <RefreshCw className="w-4 h-4" /> Retry
              </button>
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl p-6 shadow-sm border border-stone-100 space-y-4"
            >
              <div className="flex items-center gap-2 text-emerald-600 mb-2">
                <Sparkles className="w-5 h-5" />
                <span className="font-bold uppercase tracking-wider text-xs">Mentor's Explanation</span>
              </div>
              
              <div className="prose prose-stone max-w-none prose-headings:text-emerald-900 prose-strong:text-emerald-800">
                <ReactMarkdown>{explanation || ''}</ReactMarkdown>
              </div>

              <button
                onClick={reset}
                className="w-full mt-6 bg-stone-100 hover:bg-stone-200 text-stone-600 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                Scan Another Problem
              </button>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );

  const renderLibraryView = () => (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-stone-800">Your Library</h2>
        <span className="text-sm text-stone-500 bg-stone-200 px-2 py-0.5 rounded-full">{history.length} items</span>
      </div>

      {selectedHistoryItem ? (
        <div className="space-y-6">
          <button 
            onClick={() => setSelectedHistoryItem(null)}
            className="flex items-center gap-2 text-emerald-600 font-bold text-sm"
          >
            <ArrowRight className="w-4 h-4 rotate-180" /> Back to Library
          </button>
          
          <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-lg border-2 border-white">
            <img src={selectedHistoryItem.image} alt="Captured" className="w-full h-full object-cover" />
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-100 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-emerald-600">
                <Sparkles className="w-5 h-5" />
                <span className="font-bold uppercase tracking-wider text-xs">Saved Explanation</span>
              </div>
              <span className="text-[10px] bg-stone-100 text-stone-500 px-2 py-0.5 rounded-full uppercase font-bold">
                {selectedHistoryItem.language}
              </span>
            </div>
            
            <div className="prose prose-stone max-w-none">
              <ReactMarkdown>{selectedHistoryItem.explanation}</ReactMarkdown>
            </div>
          </div>
        </div>
      ) : history.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 shadow-sm border border-stone-100 text-center space-y-4">
          <div className="bg-stone-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
            <History className="w-8 h-8 text-stone-300" />
          </div>
          <div className="space-y-2">
            <p className="font-bold text-stone-800">No history yet</p>
            <p className="text-stone-500 text-sm">Your scanned problems and explanations will appear here.</p>
          </div>
          <button 
            onClick={() => setCurrentView('scan')}
            className="bg-emerald-600 text-white px-6 py-2 rounded-full font-bold text-sm shadow-lg shadow-emerald-100"
          >
            Start Scanning
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {history.map((item) => (
            <motion.div 
              key={item.id}
              layoutId={item.id}
              onClick={() => setSelectedHistoryItem(item)}
              className="bg-white p-3 rounded-2xl shadow-sm border border-stone-100 flex gap-4 items-center cursor-pointer hover:border-emerald-200 transition-colors group"
            >
              <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-stone-100">
                <img src={item.image} alt="Scan" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">{item.language}</span>
                  <span className="text-[10px] text-stone-400">{new Date(item.timestamp).toLocaleDateString()}</span>
                </div>
                <p className="text-sm font-bold text-stone-800 truncate">
                  {item.explanation.replace(/[#*`]/g, '').substring(0, 50)}...
                </p>
                <p className="text-xs text-stone-500 line-clamp-1 mt-1">
                  Tap to view full explanation
                </p>
              </div>
              <button 
                onClick={(e) => deleteHistoryItem(item.id, e)}
                className="p-2 text-stone-300 hover:text-red-500 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );

  const renderTipsView = () => (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-stone-800">Learning Tips</h2>
        <p className="text-stone-500">How to get the best out of Pradarshak</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {[
          {
            icon: <Camera className="w-6 h-6" />,
            title: "Steady Hands",
            desc: "Hold your phone steady and ensure the text is in focus for the best results.",
            color: "bg-blue-50 text-blue-600"
          },
          {
            icon: <Lightbulb className="w-6 h-6" />,
            title: "Good Lighting",
            desc: "Try to scan in a well-lit room. Shadows can make it hard for the AI to read.",
            color: "bg-yellow-50 text-yellow-600"
          },
          {
            icon: <Languages className="w-6 h-6" />,
            title: "Language Choice",
            desc: "Switch languages from the top menu to get explanations in your mother tongue.",
            color: "bg-purple-50 text-purple-600"
          },
          {
            icon: <Sparkles className="w-6 h-6" />,
            title: "One at a Time",
            desc: "Focus on one specific problem or diagram at a time for a clearer explanation.",
            color: "bg-emerald-50 text-emerald-600"
          },
          {
            icon: <BookOpen className="w-6 h-6" />,
            title: "Review Often",
            desc: "Check your Library to review old problems. Repetition is the key to learning!",
            color: "bg-orange-50 text-orange-600"
          }
        ].map((tip, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-5 rounded-3xl shadow-sm border border-stone-100 flex gap-4 items-start"
          >
            <div className={cn("p-3 rounded-2xl flex-shrink-0", tip.color)}>
              {tip.icon}
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-stone-800">{tip.title}</h3>
              <p className="text-sm text-stone-500 leading-relaxed">{tip.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="bg-emerald-900 text-white p-6 rounded-3xl space-y-3 shadow-xl shadow-emerald-100">
        <h3 className="font-bold text-lg flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-emerald-400" />
          Did you know?
        </h3>
        <p className="text-emerald-100 text-sm leading-relaxed">
          Pradarshak uses local metaphors like "tea gardens" and "mangoes" because your brain remembers stories better than dry facts!
        </p>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-20">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => { setCurrentView('scan'); reset(); }}>
            <div className="bg-emerald-600 p-1.5 rounded-lg">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <h1 className="font-bold text-xl tracking-tight text-emerald-900">Pradarshak</h1>
          </div>
          
          {currentView === 'scan' && (
            <div className="flex items-center gap-2">
              <Languages className="w-4 h-4 text-stone-400" />
              <select 
                value={selectedLang}
                onChange={(e) => setSelectedLang(e.target.value)}
                className="text-sm font-medium bg-stone-100 border-none rounded-full px-3 py-1 focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                {LANGUAGES.map(lang => (
                  <option key={lang.value} value={lang.value}>{lang.label}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-md mx-auto p-4 pb-24">
        {currentView === 'scan' && renderScanView()}
        {currentView === 'library' && renderLibraryView()}
        {currentView === 'tips' && renderTipsView()}
      </main>

      {/* Bottom Nav for mobile feel */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-stone-200 px-6 py-3 flex justify-around items-center max-w-md mx-auto z-20">
        <button 
          onClick={() => { setCurrentView('scan'); reset(); }}
          className={cn("flex flex-col items-center gap-1 transition-colors", currentView === 'scan' ? "text-emerald-600" : "text-stone-400")}
        >
          <div className={cn("p-2 rounded-xl transition-colors", currentView === 'scan' ? "bg-emerald-50" : "")}>
            <Camera className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-bold uppercase">Scan</span>
        </button>
        <button 
          onClick={() => { setCurrentView('library'); setSelectedHistoryItem(null); }}
          className={cn("flex flex-col items-center gap-1 transition-colors", currentView === 'library' ? "text-emerald-600" : "text-stone-400")}
        >
          <div className={cn("p-2 rounded-xl transition-colors", currentView === 'library' ? "bg-emerald-50" : "")}>
            <BookOpen className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-bold uppercase">Library</span>
        </button>
        <button 
          onClick={() => setCurrentView('tips')}
          className={cn("flex flex-col items-center gap-1 transition-colors", currentView === 'tips' ? "text-emerald-600" : "text-stone-400")}
        >
          <div className={cn("p-2 rounded-xl transition-colors", currentView === 'tips' ? "bg-emerald-50" : "")}>
            <Sparkles className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-bold uppercase">Tips</span>
        </button>
      </nav>
    </div>
  );
}
