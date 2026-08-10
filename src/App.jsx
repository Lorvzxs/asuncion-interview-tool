import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from './supabaseClient';
import SavedPositionInput from './components/SavedPositionInput';
import FloatingLabelField from './components/FloatingLabelField';
import RippleButton from './components/RippleButton';
import Modal from './components/Modal';
import Spinner from './components/Spinner';
import ToastContainer, { useToast } from './components/Toast';
import { toUpperCaseInput, normalizeStoredText } from './textUtils';
import { 
  BarChart3, 
  FileText, 
  Users, 
  Menu, 
  RefreshCw, 
  Search, 
  Eye, 
  X, 
  RotateCcw,
  Camera,
  Check
} from 'lucide-react';

const INTERVIEWER_NAME_STORAGE_KEY = 'bei_interviewer_name';

export default function App() {
  const [activeTab, setActiveTab] = useState('landing');
  const [records, setRecords] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { toasts, addToast, dismissToast } = useToast();
  
  // Search and Modal States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRecord, setSelectedRecord] = useState(null);

  // Avatar Edit Modal State
  const [editingAvatarUser, setEditingAvatarUser] = useState(null);
  const [avatarUrlInput, setAvatarUrlInput] = useState('');
  const [savingAvatar, setSavingAvatar] = useState(false);

  const initialFormData = {
    applicantName: '',
    position: '',
    interviewerName: '',
    date: new Date().toISOString().split('T')[0]
  };

  const initialScores = {
    comm: 0, 
    knowledge: 0, 
    experience: 0, 
    problem: 0, 
    ethics: 0, 
    teamwork: 0, 
    personality: 0
  };

  const [formData, setFormData] = useState(initialFormData);
  const [scores, setScores] = useState(initialScores);

  const criteriaList = [
    { id: 'comm', title: '1. Communication Skills', desc: 'Communicates ideas clearly, confidently, and persuasively; listens attentively and responds logically.' },
    { id: 'knowledge', title: '2. Job Knowledge / Technical Competence', desc: 'Demonstrates comprehensive understanding of job functions, laws, and procedures; provides insightful answers with practical applications.' },
    { id: 'experience', title: '3. Work Experience and Accomplishments', desc: 'Experience highly relevant; cites specific, measurable accomplishments applicable to the role.' },
    { id: 'problem', title: '4. Problem-Solving and Decision-Making', desc: 'Analyzes complex problems logically; proposes sound, ethical, and innovative solutions consistent with public policy.' },
    { id: 'ethics', title: '5. Commitment to Public Service and Ethical Standards', desc: 'Demonstrates strong sense of integrity, accountability, and genuine desire to serve the public; clearly aligns with RA 6713 values.' },
    { id: 'teamwork', title: '6. Interpersonal Relations and Teamwork', desc: 'Demonstrates exceptional ability to work harmoniously; shows respect, empathy, and leadership in collaboration.' },
    { id: 'personality', title: '7. Personality, Attitude, and Professional Demeanor', desc: 'Displays high confidence, enthusiasm, and professionalism; poised and composed throughout.' }
  ];

  useEffect(() => {
    const savedName = localStorage.getItem(INTERVIEWER_NAME_STORAGE_KEY);
    if (savedName) {
      const normalizedName = normalizeStoredText(savedName);
      setFormData((prev) => ({ ...prev, interviewerName: normalizedName }));
      if (normalizedName !== savedName) {
        localStorage.setItem(INTERVIEWER_NAME_STORAGE_KEY, normalizedName);
      }
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'records') fetchRecords();
    if (activeTab === 'users') fetchUsers();
  }, [activeTab]);

  const fetchRecords = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    let query = supabase.from('interview_records').select('*').order('created_at', { ascending: false });

    // Kung dili Admin, ang ilahang record ra ang makita para sa privacy
    if (user?.email !== 'lorvyesguera@gmail.com' && user?.email !== 'hrmolguasuncion@gmail.com') {
      query = query.eq('interviewer_id', user?.email || formData.interviewerName);
    }

    const { data, error } = await query;
    if (!error && data) setRecords(data);
    setLoading(false);
  };

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .neq('email', 'lorvyesguera@gmail.com');

    if (!error && data) setUsers(data);
    setLoading(false);
  };

  const finalScore = useMemo(() => {
    const total = Object.values(scores).reduce((a, b) => Number(a) + Number(b), 0);
    return (total / criteriaList.length).toFixed(2);
  }, [scores]);

  const handleInterviewerNameChange = (e) => {
    const value = toUpperCaseInput(e.target.value);
    setFormData((prev) => ({ ...prev, interviewerName: value }));
    const normalized = normalizeStoredText(value);
    if (normalized) {
      localStorage.setItem(INTERVIEWER_NAME_STORAGE_KEY, normalized);
    } else {
      localStorage.removeItem(INTERVIEWER_NAME_STORAGE_KEY);
    }
  };

  const handleClearSavedName = () => {
    localStorage.removeItem(INTERVIEWER_NAME_STORAGE_KEY);
    setFormData((prev) => ({ ...prev, interviewerName: '' }));
  };

  const handleResetForm = () => {
    const savedName = normalizeStoredText(localStorage.getItem(INTERVIEWER_NAME_STORAGE_KEY) || '');
    setScores(initialScores);
    setFormData({ ...initialFormData, interviewerName: savedName });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.applicantName || !formData.position || !formData.interviewerName) {
      addToast('Please complete applicant and interviewer details before saving.', 'error');
      return;
    }

    setSubmitting(true);
    setShowSuccess(false);

    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase.from('interview_records').insert([
      {
        applicant_name: normalizeStoredText(formData.applicantName),
        position_applied: normalizeStoredText(formData.position),
        interviewer_name: normalizeStoredText(formData.interviewerName),
        interviewer_id: user?.email || formData.interviewerName,
        interview_date: formData.date,
        scores: scores,
        final_rating_score: parseFloat(finalScore)
      }
    ]);

    setSubmitting(false);

    if (error) {
      addToast('Error saving record: ' + error.message, 'error');
    } else {
      setShowSuccess(true);
      addToast('Interview Assessment Saved Successfully!', 'success');
      setTimeout(() => {
        setShowSuccess(false);
        handleResetForm();
        setActiveTab('records');
      }, 1400);
    }
  };

  const handleSaveAvatar = async () => {
    if (!editingAvatarUser) return;
    setSavingAvatar(true);

    const { error } = await supabase
      .from('profiles')
      .update({ avatar_url: avatarUrlInput })
      .eq('id', editingAvatarUser.id);

    setSavingAvatar(false);

    if (error) {
      addToast('Error updating image: ' + error.message, 'error');
    } else {
      setUsers(users.map(u => u.id === editingAvatarUser.id ? { ...u, avatar_url: avatarUrlInput } : u));
      setEditingAvatarUser(null);
      setAvatarUrlInput('');
    }
  };

  const getUserAvatar = (u) => {
    if (u.avatar_url) return u.avatar_url;
    if (u.email === 'hrmolguasuncion@gmail.com') return '/hrmo-logo.png';
    if (u.email === 'lguasuncionweb@gmail.com') return '/lgu-seal.png';
    return null;
  };

  const filteredRecords = useMemo(() => {
    return records.filter((rec) => {
      const term = searchTerm.toLowerCase();
      return (
        rec.applicant_name?.toLowerCase().includes(term) ||
        rec.position_applied?.toLowerCase().includes(term) ||
        rec.interviewer_name?.toLowerCase().includes(term)
      );
    });
  }, [records, searchTerm]);

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  if (activeTab === 'landing') {
    return (
      <div
        className="min-h-screen flex flex-col justify-between text-white relative p-6 page-enter overflow-hidden"
        style={{
          backgroundImage: `
            linear-gradient(rgba(15,23,42,0.78), rgba(15,23,42,0.78)),
            url('/municipal hall.jpg')
          `,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="flex items-center gap-3 stagger-item" style={{ '--stagger-index': 0 }}>
          <div className="p-2 bg-blue-600 rounded-lg shadow-md">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-none">Behavioral Event Interview Rating Tool</h1>
            <p className="text-xs text-slate-300">Municipality of Asuncion</p>
          </div>
        </div>

        <div className="self-center my-auto stagger-item" style={{ '--stagger-index': 1 }}>
          <div className="glass-card-dark p-10 rounded-2xl max-w-md text-center">
            <img 
              src="/lgu-seal.png" 
              alt="LGU Seal" 
              className="w-28 h-28 mx-auto mb-6 object-contain drop-shadow-lg"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            <h2 className="text-2xl font-bold mb-6">Behavioral Event Interview Rating Tool</h2>
            <RippleButton
              onClick={() => setActiveTab('rating')}
              className="bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 px-8 rounded-full shadow-lg"
            >
              GET STARTED
            </RippleButton>
          </div>
        </div>

        <div className="text-center text-xs text-slate-400 stagger-item" style={{ '--stagger-index': 2 }}>
          © Local Government Unit of Asuncion. All rights reserved.
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800 page-enter">
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-indigo-900 text-white flex flex-col transition-all duration-300 ease-in-out shrink-0`}>
        <div className="p-4 flex items-center justify-between border-b border-indigo-800/50">
          <div className="flex items-center gap-2 overflow-hidden">
            <BarChart3 className="w-5 h-5 text-blue-400 shrink-0" />
            {sidebarOpen && (
              <div className="whitespace-nowrap">
                <p className="font-bold text-xs leading-tight">BEI Rating Tool</p>
                <p className="text-[10px] text-indigo-300">Municipality of Asuncion</p>
              </div>
            )}
          </div>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1 hover:bg-indigo-800 rounded cursor-pointer ui-transition">
            <Menu className="w-5 h-5 shrink-0" />
          </button>
        </div>

        {sidebarOpen && (
          <div className="p-3 text-[11px] font-semibold text-indigo-300 uppercase tracking-wider">Menu</div>
        )}

        <nav className="flex-1 px-2 space-y-1 mt-2">
          <button
            onClick={() => setActiveTab('rating')}
            className={`sidebar-nav-btn w-full flex items-center gap-3 px-3 py-3 rounded-md text-sm font-medium cursor-pointer ${
              activeTab === 'rating' ? 'sidebar-nav-btn-active bg-blue-600 text-white shadow' : 'text-indigo-200 hover:bg-indigo-800/60'
            }`}
          >
            <BarChart3 className="w-4 h-4 shrink-0" />
            {sidebarOpen && <span>Rating Tool</span>}
          </button>

          <button
            onClick={() => setActiveTab('records')}
            className={`sidebar-nav-btn w-full flex items-center gap-3 px-3 py-3 rounded-md text-sm font-medium cursor-pointer ${
              activeTab === 'records' ? 'sidebar-nav-btn-active bg-blue-600 text-white shadow' : 'text-indigo-200 hover:bg-indigo-800/60'
            }`}
          >
            <FileText className="w-4 h-4 shrink-0" />
            {sidebarOpen && <span>Records</span>}
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`sidebar-nav-btn w-full flex items-center gap-3 px-3 py-3 rounded-md text-sm font-medium cursor-pointer ${
              activeTab === 'users' ? 'sidebar-nav-btn-active bg-blue-600 text-white shadow' : 'text-indigo-200 hover:bg-indigo-800/60'
            }`}
          >
            <Users className="w-4 h-4 shrink-0" />
            {sidebarOpen && <span>User Management</span>}
          </button>
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-8 flex items-center justify-between shadow-xs ui-transition">
          <div></div>
          <div className="flex items-center gap-3">
            <img 
              src="/hrmo-logo.png" 
              alt="HRMO Asuncion" 
              className="w-9 h-9 rounded-full object-cover border border-slate-200 shadow-xs" 
              onError={(e) => { e.target.src = "/lgu-seal.png"; }}
            />
            <div>
              <p className="text-xs font-bold leading-none text-slate-800">HRMO ASUNCION</p>
              <span className="inline-block bg-blue-100 text-blue-700 text-[10px] px-1.5 py-0.5 rounded font-semibold mt-0.5">
                ADMINISTRATOR
              </span>
            </div>
          </div>
        </header>

        <main key={activeTab} className="p-8 flex-1 overflow-y-auto page-enter">
          {/* Assessment Form Tab */}
          {activeTab === 'rating' && (
            <div className="max-w-5xl mx-auto space-y-6">
              <div className="flex justify-between items-center stagger-item" style={{ '--stagger-index': 0 }}>
                <h1 className="text-2xl font-bold text-indigo-950">Interview Assessment</h1>
                <RippleButton
                  variant="light"
                  onClick={handleResetForm}
                  className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 font-medium bg-slate-200/60 hover:bg-slate-200 px-3 py-1.5 rounded-lg"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Reset Form
                </RippleButton>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="glass-card glass-card-hover p-6 rounded-xl space-y-6 stagger-item" style={{ '--stagger-index': 1 }}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="stagger-item" style={{ '--stagger-index': 2 }}>
                      <FloatingLabelField
                        id="applicant-name"
                        label="Applicant Name"
                        value={formData.applicantName}
                        onChange={(e) => setFormData({ ...formData, applicantName: toUpperCaseInput(e.target.value) })}
                        required
                      />
                    </div>
                    <div className="stagger-item" style={{ '--stagger-index': 3 }}>
                      <SavedPositionInput
                        value={formData.position}
                        onChange={(position) => setFormData({ ...formData, position })}
                        required
                      />
                    </div>
                    <div className="stagger-item" style={{ '--stagger-index': 4 }}>
                      <FloatingLabelField
                        id="interviewer-name"
                        label="Interviewer Name"
                        value={formData.interviewerName}
                        onChange={handleInterviewerNameChange}
                        required
                      />
                      {formData.interviewerName && (
                        <button
                          type="button"
                          onClick={handleClearSavedName}
                          className="mt-1.5 text-[11px] text-slate-500 hover:text-red-600 font-medium cursor-pointer ui-transition"
                        >
                          Clear Saved Name
                        </button>
                      )}
                    </div>
                    <div className="stagger-item" style={{ '--stagger-index': 5 }}>
                      <FloatingLabelField
                        id="interview-date"
                        label="Date"
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Criteria Evaluation List */}
                <div className="glass-card p-6 rounded-xl space-y-6 stagger-item" style={{ '--stagger-index': 6 }}>
                  <h2 className="text-lg font-bold text-slate-800 border-b border-slate-200/80 pb-3">Evaluation Criteria (Score: 1 - 5)</h2>
                  <div className="space-y-4">
                    {criteriaList.map((crit, index) => (
                      <div
                        key={crit.id}
                        className="criteria-card p-4 bg-slate-50/80 rounded-lg border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4 stagger-item"
                        style={{ '--stagger-index': 7 + index }}
                      >
                        <div className="space-y-1 max-w-2xl">
                          <h3 className="font-semibold text-sm text-slate-800">{crit.title}</h3>
                          <p className="text-xs text-slate-500 leading-relaxed">{crit.desc}</p>
                        </div>
                        <div className="flex items-center gap-1.5 self-start md:self-center">
                          {[1, 2, 3, 4, 5].map((num) => (
                            <button
                              key={num}
                              type="button"
                              onClick={() => setScores({ ...scores, [crit.id]: num })}
                              className={`score-btn w-9 h-9 rounded-lg font-bold text-xs cursor-pointer ${
                                scores[crit.id] === num
                                  ? 'score-btn-selected bg-blue-600 text-white shadow-md'
                                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              {num}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Rating Output Footer */}
                <div className="glass-card glass-card-hover p-6 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 stagger-item" style={{ '--stagger-index': 14 }}>
                  <div>
                    <span className="text-xs text-slate-500 font-semibold uppercase block">Final Rating Score</span>
                    <span className={`text-3xl font-black text-blue-600 ui-transition ${showSuccess ? 'score-success' : ''}`}>
                      {finalScore} / 5.00
                    </span>
                  </div>
                  <RippleButton
                    type="submit"
                    disabled={submitting || showSuccess}
                    className={`w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-300 text-white px-8 py-3 rounded-lg font-semibold shadow-md min-w-[220px] ${
                      showSuccess ? 'bg-emerald-600 hover:bg-emerald-600' : ''
                    }`}
                  >
                    {submitting ? (
                      <>
                        <Spinner />
                        <span>Saving Assessment...</span>
                      </>
                    ) : showSuccess ? (
                      <>
                        <Check className="w-5 h-5 success-pop" />
                        <span>Saved Successfully!</span>
                      </>
                    ) : (
                      'Save Assessment Record'
                    )}
                  </RippleButton>
                </div>
              </form>
            </div>
          )}

          {/* Records Tab */}
          {activeTab === 'records' && (
            <div className="max-w-6xl mx-auto space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 stagger-item" style={{ '--stagger-index': 0 }}>
                <h1 className="text-2xl font-bold text-indigo-950">Assessment Records</h1>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search records..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 pr-4 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white/90 ui-transition"
                    />
                  </div>
                  <RippleButton
                    variant="light"
                    onClick={fetchRecords}
                    className="p-2 border border-slate-300 rounded-lg hover:bg-slate-100 bg-white"
                  >
                    <RefreshCw className={`w-4 h-4 text-slate-600 ${loading ? 'animate-spin' : ''}`} />
                  </RippleButton>
                </div>
              </div>

              <div className="glass-card rounded-xl overflow-hidden stagger-item" style={{ '--stagger-index': 1 }}>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold text-xs uppercase">
                      <tr>
                        <th className="px-6 py-3">Applicant</th>
                        <th className="px-6 py-3">Position</th>
                        <th className="px-6 py-3">Interviewer</th>
                        <th className="px-6 py-3">Date</th>
                        <th className="px-6 py-3">Rating Score</th>
                        <th className="px-6 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/80">
                      {filteredRecords.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="px-6 py-8 text-center text-slate-400">
                            No records found.
                          </td>
                        </tr>
                      ) : (
                        filteredRecords.map((rec, index) => (
                          <tr
                            key={rec.id}
                            className="table-row-hover hover:bg-slate-50/80 stagger-item"
                            style={{ '--stagger-index': 2 + Math.min(index, 8) }}
                          >
                            <td className="px-6 py-4 font-semibold text-slate-800">{rec.applicant_name}</td>
                            <td className="px-6 py-4 text-slate-600">{rec.position_applied}</td>
                            <td className="px-6 py-4 text-slate-600">{rec.interviewer_name}</td>
                            <td className="px-6 py-4 text-slate-500">{rec.interview_date}</td>
                            <td className="px-6 py-4 font-bold text-blue-600">{rec.final_rating_score?.toFixed(2)}</td>
                            <td className="px-6 py-4 text-right">
                              <RippleButton
                                variant="light"
                                onClick={() => setSelectedRecord(rec)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md"
                              >
                                <Eye className="w-4 h-4" />
                              </RippleButton>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* User Management Tab */}
          {activeTab === 'users' && (
            <div className="max-w-6xl mx-auto space-y-6">
              <div className="flex items-center justify-between stagger-item" style={{ '--stagger-index': 0 }}>
                <h1 className="text-2xl font-bold text-indigo-950">User Management</h1>
                <RippleButton
                  variant="light"
                  onClick={fetchUsers}
                  className="p-2 border border-slate-300 rounded-lg hover:bg-slate-100 bg-white"
                >
                  <RefreshCw className={`w-4 h-4 text-slate-600 ${loading ? 'animate-spin' : ''}`} />
                </RippleButton>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {users.map((u, index) => {
                  const avatarSrc = getUserAvatar(u);
                  return (
                    <div
                      key={u.id}
                      className="glass-card glass-card-hover p-5 rounded-xl flex flex-col items-center text-center space-y-3 relative group stagger-item"
                      style={{ '--stagger-index': 1 + Math.min(index, 11) }}
                    >
                      <div className="relative">
                        {avatarSrc ? (
                          <img src={avatarSrc} alt={u.full_name} className="w-20 h-20 rounded-full object-cover border-2 border-indigo-100 shadow-xs ui-transition group-hover:scale-105" />
                        ) : (
                          <div className="w-20 h-20 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xl flex items-center justify-center border-2 border-indigo-200 ui-transition group-hover:scale-105">
                            {getInitials(u.full_name || u.email)}
                          </div>
                        )}
                        <RippleButton
                          onClick={() => {
                            setEditingAvatarUser(u);
                            setAvatarUrlInput(avatarSrc || '');
                          }}
                          className="absolute bottom-0 right-0 p-1.5 bg-blue-600 text-white rounded-full shadow-md hover:bg-blue-500"
                        >
                          <Camera className="w-3.5 h-3.5" />
                        </RippleButton>
                      </div>

                      <div>
                        <h3 className="font-bold text-slate-800 text-sm leading-tight">{u.full_name || 'Unnamed User'}</h3>
                        <p className="text-xs text-slate-400 mt-0.5">{u.email || 'No email registered'}</p>
                      </div>

                      <span className="inline-block bg-slate-100 text-slate-600 text-[10px] px-2 py-0.5 rounded font-medium">
                        {u.role || 'Administrator'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Record Inspection Modal */}
      <Modal open={!!selectedRecord} onClose={() => setSelectedRecord(null)}>
        <div className="space-y-6">
          {selectedRecord && (
            <>
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
                <h2 className="text-lg font-bold text-slate-800">Interview Evaluation Details</h2>
                <RippleButton
                  variant="light"
                  onClick={() => setSelectedRecord(null)}
                  className="p-1 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </RippleButton>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="stagger-item" style={{ '--stagger-index': 0 }}>
                  <span className="text-slate-400 font-semibold block">Applicant</span>
                  <span className="text-slate-800 font-bold text-sm">{selectedRecord.applicant_name}</span>
                </div>
                <div className="stagger-item" style={{ '--stagger-index': 1 }}>
                  <span className="text-slate-400 font-semibold block">Position</span>
                  <span className="text-slate-800 font-bold text-sm">{selectedRecord.position_applied}</span>
                </div>
                <div className="stagger-item" style={{ '--stagger-index': 2 }}>
                  <span className="text-slate-400 font-semibold block">Interviewer</span>
                  <span className="text-slate-700 font-medium">{selectedRecord.interviewer_name}</span>
                </div>
                <div className="stagger-item" style={{ '--stagger-index': 3 }}>
                  <span className="text-slate-400 font-semibold block">Date</span>
                  <span className="text-slate-700 font-medium">{selectedRecord.interview_date}</span>
                </div>
              </div>

              <div className="space-y-3 border-t border-slate-200/80 pt-4">
                <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider">Criteria Breakdown</h3>
                <div className="space-y-2">
                  {criteriaList.map((crit, index) => (
                    <div
                      key={crit.id}
                      className="flex items-center justify-between text-xs py-1.5 border-b border-slate-100 stagger-item"
                      style={{ '--stagger-index': 4 + index }}
                    >
                      <span className="text-slate-600 font-medium">{crit.title}</span>
                      <span className="font-bold text-indigo-900">{selectedRecord.scores?.[crit.id] || 0} / 5</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-slate-50/80 rounded-lg flex items-center justify-between border border-slate-200/80">
                <span className="text-sm font-bold text-slate-700">Final Rating Score</span>
                <span className="text-2xl font-black text-blue-600">{selectedRecord.final_rating_score?.toFixed(2)} / 5.00</span>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Avatar Edit Modal (Built-in Local Logos) */}
      <Modal open={!!editingAvatarUser} onClose={() => setEditingAvatarUser(null)} maxWidth="max-w-sm">
        {editingAvatarUser && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
              <h2 className="text-base font-bold text-slate-800">Select Profile Logo</h2>
              <RippleButton
                variant="light"
                onClick={() => setEditingAvatarUser(null)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </RippleButton>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-600">Choose from Project Logos:</label>
              <div className="grid grid-cols-2 gap-3 pt-1">
                <RippleButton
                  variant="light"
                  onClick={() => setAvatarUrlInput('/lgu-seal.png')}
                  className={`p-3 border rounded-lg flex flex-col items-center gap-2 hover:bg-slate-50 ${avatarUrlInput === '/lgu-seal.png' ? 'border-blue-600 bg-blue-50/50' : 'border-slate-200'}`}
                >
                  <img src="/lgu-seal.png" alt="LGU Seal" className="w-10 h-10 object-contain" />
                  <span className="text-[11px] font-medium text-slate-700">LGU Seal</span>
                </RippleButton>
                <RippleButton
                  variant="light"
                  onClick={() => setAvatarUrlInput('/hrmo-logo.png')}
                  className={`p-3 border rounded-lg flex flex-col items-center gap-2 hover:bg-slate-50 ${avatarUrlInput === '/hrmo-logo.png' ? 'border-blue-600 bg-blue-50/50' : 'border-slate-200'}`}
                >
                  <img src="/hrmo-logo.png" alt="HRMO Logo" className="w-10 h-10 object-contain rounded-full" />
                  <span className="text-[11px] font-medium text-slate-700">HRMO Logo</span>
                </RippleButton>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-600">Or Custom Image URL:</label>
              <input
                type="text"
                placeholder="https://example.com/avatar.png"
                value={avatarUrlInput}
                onChange={(e) => setAvatarUrlInput(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <RippleButton
                variant="light"
                onClick={() => setEditingAvatarUser(null)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-100"
              >
                Cancel
              </RippleButton>
              <RippleButton
                onClick={handleSaveAvatar}
                disabled={savingAvatar}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-500 shadow-sm flex items-center gap-2"
              >
                {savingAvatar ? (
                  <>
                    <Spinner />
                    <span>Saving...</span>
                  </>
                ) : (
                  'Save Changes'
                )}
              </RippleButton>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}