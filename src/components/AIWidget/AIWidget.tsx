import React, { useEffect, useState, useRef } from 'react';

type Props = { lat: number; lon: number };

export default function AIWidget({ lat, lon }: Props) {
  const [summary, setSummary] = useState('');
  const [answer, setAnswer] = useState('');
  const [question, setQuestion] = useState('');
  const [alerts, setAlerts] = useState<any[]>([]);
  const [nowcast, setNowcast] = useState<any>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => { fetchSummary(); fetchAlerts(); fetchNowcast(); }, [lat, lon]);

  async function fetchSummary() {
    const res = await fetch(`/api/forecast?lat=${lat}&lon=${lon}`);
    const j = await res.json();
    setSummary(j.summary || '');
  }

  async function fetchAlerts() {
    const res = await fetch(`/api/alerts?lat=${lat}&lon=${lon}`);
    const j = await res.json();
    setAlerts(j.alerts || []);
  }

  async function fetchNowcast() {
    const res = await fetch(`/api/nowcast?lat=${lat}&lon=${lon}`);
    const j = await res.json();
    setNowcast(j.nowcast);
  }

  async function askQuestion() {
    setAnswer('Thinking...');
    const res = await fetch('/api/qa', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lat, lon, question }) });
    const j = await res.json();
    setAnswer(j.answer || 'No answer');
    speakText(j.answer || 'No answer');
  }

  function startVoice() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return alert('SpeechRecognition not supported in this browser');
    const r = new SpeechRecognition();
    r.lang = 'en-US';
    r.interimResults = false;
    r.onresult = (ev: any) => { setQuestion(ev.results[0][0].transcript); };
    r.start();
    recognitionRef.current = r;
  }

  function stopVoice() { if (recognitionRef.current) recognitionRef.current.stop(); }

  function speakText(text: string) {
    if (!('speechSynthesis' in window)) return;
    const s = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(s);
  }

  return (
    <div className="p-4 bg-white rounded shadow max-w-md">
      <h3 className="font-bold">AI Weather</h3>
      <div className="mt-2">
        <strong>Summary:</strong>
        <p className="mt-1">{summary}</p>
      </div>

      <div className="mt-3">
        <strong>Nowcast:</strong>
        <p className="mt-1">{nowcast ? `${nowcast.description} (confidence: ${nowcast.confidence})` : 'Loading...'}</p>
      </div>

      <div className="mt-3">
        <strong>Alerts:</strong>
        <ul>
          {alerts.length === 0 && <li>None</li>}
          {alerts.map((a, i) => <li key={i}>{a.message}</li>)}
        </ul>
      </div>

      <div className="mt-4">
        <strong>Ask a question</strong>
        <div className="flex gap-2 mt-2">
          <input className="flex-1 border p-2 rounded" value={question} onChange={e => setQuestion(e.target.value)} placeholder="Will it rain this evening?" />
          <button className="px-3 py-2 bg-blue-600 text-white rounded" onClick={askQuestion}>Ask</button>
        </div>
        <div className="mt-2 flex gap-2">
          <button className="px-2 py-1 border" onClick={startVoice}>🎤 Start</button>
          <button className="px-2 py-1 border" onClick={stopVoice}>⛔ Stop</button>
        </div>
        <div className="mt-2"><em>Answer:</em>
          <p className="mt-1">{answer}</p>
        </div>
      </div>
    </div>
  );
}
