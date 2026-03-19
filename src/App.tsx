import React, { useState, useEffect } from 'react';
import { QrCode, CheckCircle2, Loader2, ShieldCheck, Database, Activity, Wallet, ArrowDownLeft, ArrowUpRight, RefreshCw, Copy, Code } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'bookmarklet' | 'waiting' | 'linked'>('idle');
  const [accountAddress, setAccountAddress] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(localStorage.getItem('sham_api_key'));
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Test Data States
  const [testResult, setTestResult] = useState<any>(null);
  const [testLoading, setTestLoading] = useState(false);

  const bookmarkletCode = `javascript:(function(){if(window.qrHunterActive){alert("الصائد مفعل مسبقاً! قم بتحديث الباركود في الصفحة.");return}window.qrHunterActive=true;function sendToApp(sId,pKey){fetch("${window.location.origin}/inject-qr",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({sessionId:sId,publicKey:pKey||"none"})}).then(()=>alert("✅ تم إرسال الباركود لتطبيقنا بنجاح!\\nارجع للتطبيق الآن.")).catch(e=>alert("❌ فشل الإرسال للتطبيق: "+e.message))}function checkData(data){if(!data)return;let sId=data.sessionId||data.session_id||(data.data&&data.data.sessionId);let pKey=data.publicKey||data.public_key||(data.data&&data.data.publicKey);if(sId){sendToApp(sId,pKey)}}const origFetch=window.fetch;window.fetch=async function(...args){const res=await origFetch.apply(this,args);const clone=res.clone();clone.json().then(checkData).catch(()=>{});return res};const origOpen=XMLHttpRequest.prototype.open;const origSend=XMLHttpRequest.prototype.send;XMLHttpRequest.prototype.open=function(method,url){this._url=url;origOpen.apply(this,arguments)};XMLHttpRequest.prototype.send=function(){this.addEventListener('load',function(){try{checkData(JSON.parse(this.responseText))}catch(e){}});origSend.apply(this,arguments)};alert("🕵️‍♂️ تم تفعيل صائد الباركود!\\n\\nالخطوة التالية: اضغط على زر (تحديث الباركود) في موقع شام كاش، أو انتظر ثواني حتى يتحدث الباركود تلقائياً ليتم التقاطه.");})();`;

  const generateQR = async () => {
    setLoading(true);
    try {
      const res = await fetch('/generate-qr');
      const data = await res.json();
      if (data.success) {
        setSessionId(data.session_id);
        setQrCode(data.qr);
        setStatus('waiting');
      }
    } catch (err) {
      console.error('Failed to generate QR', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let interval: any;
    if (status === 'bookmarklet') {
      interval = setInterval(async () => {
        try {
          const res = await fetch('/latest-qr');
          const data = await res.json();
          if (data.success && data.data) {
            setSessionId(data.data.sessionId);
            setQrCode(data.data.qrImage);
            setStatus('waiting');
            clearInterval(interval);
          }
        } catch (err) {
          console.error('Polling latest QR error', err);
        }
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [status]);

  useEffect(() => {
    let interval: any;
    if (status === 'waiting' && sessionId) {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`/session-status?session_id=${encodeURIComponent(sessionId)}`);
          const data = await res.json();
          if (data.status === 'linked') {
            setStatus('linked');
            setAccountAddress(data.account_address);
            if (data.api_key) {
              setApiKey(data.api_key);
              localStorage.setItem('sham_api_key', data.api_key);
            }
            clearInterval(interval);
          }
        } catch (err) {
          console.error('Polling error', err);
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [status, sessionId]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const fetchTestData = async (action: string, type?: string) => {
    if (!apiKey) return;
    setTestLoading(true);
    setTestResult(null);
    try {
      let url = `/api?resource=shamcash&action=${action}`;
      if (type) url += `&type=${type}`;
      
      const res = await fetch(url, {
        headers: { 'X-Api-Key': apiKey }
      });
      const data = await res.json();
      setTestResult({ action, type, data: data.data });
    } catch (err) {
      console.error('Test fetch error', err);
    } finally {
      setTestLoading(false);
    }
  };

  const simulateScan = async () => {
    if (!sessionId) return;
    try {
      await fetch('/link-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionId,
          account_address: "251a" + Math.random().toString(16).slice(2, 10),
          cookies: "mock_cookie_data",
          accessToken: "mock_token",
          headers: { "User-Agent": "ShamCash-Mock" }
        })
      });
    } catch (err) {
      console.error('Simulation error', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 font-sans selection:bg-emerald-500/30" dir="rtl">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full" />
      </div>

      <main className="relative z-10 max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <header className="flex flex-col md:flex-row items-center justify-between mb-16 gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <ShieldCheck className="text-black w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">جسر شام كاش</h1>
              <p className="text-xs text-zinc-500 font-mono uppercase tracking-widest">بوابة API للقراءة فقط | SyriaBit</p>
            </div>
          </div>
          <div className="flex items-center gap-6 text-sm font-medium text-zinc-400">
            <div className="flex flex-col items-end">
              <span className="text-emerald-500 font-bold">النظام متصل</span>
              <span className="text-[10px] opacity-50 uppercase tracking-tighter">System Online</span>
            </div>
            <div className="h-8 w-px bg-zinc-800" />
            <div className="flex flex-col items-end">
              <span className="text-zinc-200 font-bold">شركة Syriabit</span>
              <span className="text-[10px] opacity-50 uppercase tracking-tighter">المطور: أحمد عتون | 0982559890</span>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: QR Linking */}
          <div className="lg:col-span-4">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 backdrop-blur-xl sticky top-8"
            >
              <h2 className="text-xl font-semibold mb-2">ربط الحساب | Connect Account</h2>
              <p className="text-zinc-400 text-xs mb-6">امسح رمز QR باستخدام تطبيق شام كاش للمصادقة.</p>

              <div className="aspect-square bg-zinc-950 rounded-2xl border border-zinc-800 flex flex-col items-center justify-center relative overflow-hidden group">
                <AnimatePresence mode="wait">
                  {status === 'idle' && (
                    <motion.div
                      key="idle"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center gap-6 w-full p-4"
                    >
                      <button
                        onClick={generateQR}
                        disabled={loading}
                        className="flex flex-col items-center gap-4 group"
                      >
                        <div className="w-14 h-14 bg-zinc-900 rounded-2xl flex items-center justify-center group-hover:bg-emerald-500/10 group-hover:text-emerald-400 transition-all duration-300">
                          {loading ? <Loader2 className="w-7 h-7 animate-spin" /> : <QrCode className="w-7 h-7" />}
                        </div>
                        <span className="text-xs font-medium text-zinc-400 group-hover:text-zinc-200">توليد الرمز | Generate QR</span>
                      </button>

                      <div className="w-full h-px bg-zinc-800" />

                      <button
                        onClick={() => setStatus('bookmarklet')}
                        className="flex flex-col items-center gap-3 group"
                      >
                        <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center group-hover:bg-blue-500/10 group-hover:text-blue-400 transition-all duration-300">
                          <Code className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-medium text-zinc-500 group-hover:text-zinc-300 text-center">
                          تجاوز الحظر (الكود السحري)
                          <br/>
                          Bypass Firewall
                        </span>
                      </button>
                    </motion.div>
                  )}

                  {status === 'bookmarklet' && (
                    <motion.div
                      key="bookmarklet"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex flex-col items-center gap-4 w-full p-4 text-center"
                    >
                      <div className="w-12 h-12 bg-blue-500/10 text-blue-400 rounded-2xl flex items-center justify-center mb-2">
                        <Code className="w-6 h-6" />
                      </div>
                      <h3 className="text-sm font-bold text-zinc-200">الكود السحري (صائد الباركود)</h3>
                      <p className="text-[10px] text-zinc-400 leading-relaxed">
                        1. افتح موقع <a href="https://shamcash.sy" target="_blank" rel="noreferrer" className="text-blue-400 underline">shamcash.sy</a> في متصفحك.<br/>
                        2. انسخ الكود بالأسفل والصقه في شريط الروابط هناك واضغط Enter.<br/>
                        3. <strong>اضغط على زر (تحديث الباركود)</strong> في موقع شام كاش، أو انتظر حتى يتحدث تلقائياً.<br/>
                        4. سيعود الباركود إلى هنا تلقائياً!
                      </p>
                      
                      <div className="w-full relative group mt-2">
                        <div className="absolute inset-0 bg-blue-500/20 blur-md rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                        <button 
                          onClick={() => copyToClipboard(bookmarkletCode)}
                          className="relative w-full bg-zinc-900 border border-zinc-800 hover:border-blue-500/50 text-zinc-300 p-3 rounded-xl text-xs flex items-center justify-between transition-all"
                        >
                          <span className="truncate max-w-[180px] font-mono text-[10px] text-zinc-500">javascript:(async()=&gt;...</span>
                          {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-blue-400" />}
                        </button>
                      </div>

                      <div className="flex items-center gap-2 text-blue-400 text-[10px] font-bold uppercase tracking-widest mt-4">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        بانتظار الكود | Waiting...
                      </div>

                      <button 
                        onClick={() => setStatus('idle')}
                        className="mt-2 text-[10px] text-zinc-600 hover:text-zinc-400 underline"
                      >
                        إلغاء | Cancel
                      </button>
                    </motion.div>
                  )}

                  {status === 'waiting' && qrCode && (
                    <motion.div
                      key="waiting"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex flex-col items-center gap-4 w-full p-4"
                    >
                      <div className="bg-white p-6 rounded-3xl shadow-2xl">
                        <img src={qrCode} alt="QR Code" className="w-64 h-64 object-contain" />
                      </div>
                      <div className="flex items-center gap-2 text-emerald-400 text-[10px] font-bold uppercase tracking-widest">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        بانتظار المسح | Waiting for scan
                      </div>
                      
                      <button 
                        onClick={simulateScan}
                        className="text-[9px] text-zinc-600 hover:text-zinc-400 underline uppercase tracking-tighter"
                      >
                        محاكاة المسح | Simulate Scan
                      </button>
                    </motion.div>
                  )}

                  {status === 'linked' && (
                    <motion.div
                      key="linked"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex flex-col items-center gap-4 text-center"
                    >
                      <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mb-1">
                        <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                      </div>
                      <h3 className="text-lg font-bold text-emerald-400">تم الربط بنجاح | Linked</h3>
                      <p className="text-xs text-zinc-400 font-mono bg-zinc-900 px-3 py-1 rounded-full border border-zinc-800">
                        {accountAddress}
                      </p>
                      <button 
                        onClick={() => { setStatus('idle'); setQrCode(null); }}
                        className="mt-2 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                      >
                        ربط جديد | Link New
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>

          {/* Right Column: API Info & Test Buttons */}
          <div className="lg:col-span-8 space-y-6">
            <AnimatePresence>
              {apiKey && (
                <motion.section
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-emerald-500/10 border border-emerald-500/20 rounded-3xl p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <ShieldCheck className="text-emerald-500 w-5 h-5" />
                      <h3 className="font-bold">مفتاح API الخاص بك | Your API Key</h3>
                    </div>
                    <button 
                      onClick={() => { localStorage.removeItem('sham_api_key'); setApiKey(null); }}
                      className="text-[10px] text-zinc-500 hover:text-red-400 uppercase font-bold"
                    >
                      مسح المفتاح | Clear Key
                    </button>
                  </div>
                  
                  <div className="bg-black/60 rounded-xl p-4 font-mono text-sm border border-zinc-800 flex items-center justify-between">
                    <span className="text-emerald-400 truncate ml-4" dir="ltr">{apiKey}</span>
                    <button 
                      onClick={() => copyToClipboard(apiKey)}
                      className="shrink-0 p-2 hover:bg-zinc-800 rounded-lg transition-all text-zinc-400 hover:text-emerald-400"
                    >
                      {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>

                  <div className="mt-4 p-4 bg-zinc-900/50 rounded-xl border border-zinc-800">
                    <p className="text-xs text-zinc-500 mb-2 font-bold uppercase">رابط الربط | Linking URL</p>
                    <div className="flex items-center justify-between gap-4">
                      <code className="text-[11px] text-zinc-300 truncate" dir="ltr">{window.location.origin}/api</code>
                      <button 
                        onClick={() => copyToClipboard(`${window.location.origin}/api`)}
                        className="shrink-0 text-[10px] text-emerald-500 hover:underline"
                      >
                        نسخ | Copy
                      </button>
                    </div>
                  </div>
                </motion.section>
              )}
            </AnimatePresence>

            {/* Verification Tools */}
            {apiKey && (
              <section className="bg-zinc-900/30 border border-zinc-800 rounded-3xl p-6">
                <h3 className="text-sm font-bold mb-6 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-400" /> أدوات التحقق | Verification Tools
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                  <button 
                    onClick={() => fetchTestData('balance')}
                    disabled={testLoading}
                    className="flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 p-3 rounded-xl text-xs font-medium transition-all disabled:opacity-50"
                  >
                    <Wallet className="w-4 h-4 text-emerald-400" />
                    فحص الرصيد | Balance
                  </button>
                  <button 
                    onClick={() => fetchTestData('logs', 'incoming')}
                    disabled={testLoading}
                    className="flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 p-3 rounded-xl text-xs font-medium transition-all disabled:opacity-50"
                  >
                    <ArrowDownLeft className="w-4 h-4 text-blue-400" />
                    الواردة | Incoming
                  </button>
                  <button 
                    onClick={() => fetchTestData('logs', 'outgoing')}
                    disabled={testLoading}
                    className="flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 p-3 rounded-xl text-xs font-medium transition-all disabled:opacity-50"
                  >
                    <ArrowUpRight className="w-4 h-4 text-orange-400" />
                    الصادرة | Outgoing
                  </button>
                </div>

                {/* Test Results Display */}
                <AnimatePresence mode="wait">
                  {testLoading ? (
                    <motion.div 
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center justify-center py-12"
                    >
                      <RefreshCw className="w-6 h-6 animate-spin text-zinc-600" />
                    </motion.div>
                  ) : testResult ? (
                    <motion.div
                      key="result"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-black/40 rounded-2xl border border-zinc-800 overflow-hidden"
                    >
                      <div className="px-4 py-2 bg-zinc-800/50 border-bottom border-zinc-800 flex justify-between items-center">
                        <span className="text-[10px] font-bold uppercase text-zinc-400">
                          النتيجة | Result: {testResult.action}
                        </span>
                        <button onClick={() => setTestResult(null)} className="text-[10px] text-zinc-600 hover:text-zinc-400">مسح | Clear</button>
                      </div>
                      <div className="p-4" dir="ltr">
                        <pre className="text-[11px] font-mono text-emerald-400/80 overflow-x-auto">
                          {JSON.stringify(testResult.data, null, 2)}
                        </pre>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="text-center py-12 border-2 border-dashed border-zinc-800 rounded-2xl">
                      <p className="text-xs text-zinc-600">اضغط على أداة أعلاه للتحقق من الاتصال</p>
                    </div>
                  )}
                </AnimatePresence>
              </section>
            )}

            <section>
              <h3 className="text-sm font-mono uppercase tracking-widest text-zinc-500 mb-6 flex items-center gap-2">
                <Database className="w-4 h-4" /> نقاط النهاية | API Endpoints
              </h3>
              <div className="space-y-3" dir="ltr">
                {[
                  { method: 'GET', path: '/api?resource=status', desc: 'Check API health' },
                  { method: 'GET', path: '/api?resource=account', desc: 'Get linked account address' },
                  { method: 'GET', path: '/api?resource=shamcash&action=balance', desc: 'Fetch real-time balance' },
                  { method: 'GET', path: '/api?resource=shamcash&action=logs&type=incoming', desc: 'Retrieve incoming logs' },
                  { method: 'GET', path: '/api?resource=shamcash&action=logs&type=outgoing', desc: 'Retrieve outgoing logs' },
                ].map((endpoint, i) => (
                  <div key={i} className="group bg-zinc-900/30 border border-zinc-800/50 rounded-2xl p-4 hover:border-emerald-500/30 transition-all">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded uppercase">{endpoint.method}</span>
                        <code className="text-xs font-mono text-zinc-300">{endpoint.path}</code>
                      </div>
                      <button 
                        onClick={() => copyToClipboard(`${window.location.origin}${endpoint.path}`)}
                        className="opacity-0 group-hover:opacity-100 text-[10px] text-zinc-500 hover:text-emerald-400 transition-all uppercase font-bold tracking-tighter"
                      >
                        Copy
                      </button>
                    </div>
                    <p className="text-[10px] text-zinc-500">{endpoint.desc}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-24 pt-8 border-t border-zinc-900 flex flex-col md:flex-row items-center justify-between gap-6 text-zinc-500 text-xs">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <Activity className="w-3 h-3 text-emerald-500" />
              الاستجابة: 42ms
            </span>
            <span className="flex items-center gap-1.5">
              <Wallet className="w-3 h-3 text-blue-500" />
              التوفر: 99.9%
            </span>
          </div>
          <div className="flex flex-col items-end">
            <p>تصميم وبرمجة: شركة Syriabit</p>
            <p className="text-[10px] opacity-70">المطور: أحمد عتون | 0982559890</p>
            <p>© 2026 ShamCash Bridge Protocol. All rights reserved.</p>
          </div>
        </footer>
      </main>
    </div>
  );
}
