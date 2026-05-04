import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { adminAPI } from '../../../utils/adminApi';
import { 
    CheckSquare, Clock, AlertCircle, Plus, Search, 
    X, Trash2, User, Calendar, Layout, List as ListIcon,
    MoreHorizontal, ArrowRight, Filter, RefreshCw
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import PageShell, { SectionCard, FilterBar, SearchBox, StatusTabs, EmptyState, PageLoader } from '../components/PageShell';

const COLUMNS = [
    { id: 'pending',     title: 'Backlog',       dot: 'bg-slate-300',   bg: 'bg-slate-50/50',   border: 'border-slate-100' },
    { id: 'in_progress', title: 'Operational',   dot: 'bg-amber-500',   bg: 'bg-amber-50/20',   border: 'border-amber-100/50' },
    { id: 'review',      title: 'Verification',  dot: 'bg-blue-500',    bg: 'bg-blue-50/20',    border: 'border-blue-100/50' },
    { id: 'completed',   title: 'Neutralized',   dot: 'bg-emerald-500', bg: 'bg-emerald-50/20', border: 'border-emerald-100/50' },
];

const PRIORITY_MAP = {
    high:   { cls: 'adm-badge adm-badge-error',   label: 'Critical' },
    medium: { cls: 'adm-badge adm-badge-warning',  label: 'Steady' },
    low:    { cls: 'adm-badge adm-badge-info',     label: 'Minimal' },
};

const AdminTaskManager = () => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('board');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [newTask, setNewTask] = useState({
        title: '', description: '', priority: 'medium', category: 'Operational', dueDate: ''
    });

    const fetchTasks = async () => {
        try { 
            setLoading(true); 
            const res = await adminAPI.getTasks(); 
            if (res.status === 'success') setTasks(res.data); 
        }
        catch { toast.error("Task synchronization failed"); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchTasks(); }, []);

    const handleCreateTask = async (e) => {
        e.preventDefault();
        try {
            const res = await adminAPI.createTask(newTask);
            if (res.status === 'success') {
                toast.success("Task deployed to grid");
                setIsModalOpen(false);
                setNewTask({ title: '', description: '', priority: 'medium', category: 'Operational', dueDate: '' });
                fetchTasks();
            }
        } catch (err) { toast.error(err.message || "Deployment failed"); }
    };

    const handleUpdateStatus = async (taskId, newStatus) => {
        try {
            const res = await adminAPI.updateTask(taskId, { status: newStatus });
            if (res.status === 'success') {
                setTasks(prev => prev.map(t => t._id === taskId ? { ...t, status: newStatus } : t));
                toast.success(`Task shifted to ${newStatus.replace('_', ' ')}`);
            }
        } catch { toast.error("Protocol update failed"); }
    };

    const handleDeleteTask = async (taskId) => {
        if (!window.confirm("Neutralize this task registry?")) return;
        try {
            const res = await adminAPI.deleteTask(taskId);
            if (res.status === 'success') { 
                toast.success("Entry purged"); 
                setTasks(prev => prev.filter(t => t._id !== taskId)); 
            }
        } catch { toast.error("Purge failed"); }
    };

    const filtered = tasks.filter(t =>
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const byStatus = (s) => filtered.filter(t => t.status === s);

    const totalStats = [
        { label: 'Grid Total',   count: tasks.length,               color: 'bg-white border-slate-100 text-slate-800' },
        { label: 'Backlog',     count: byStatus('pending').length,  color: 'bg-white border-slate-100 text-slate-400' },
        { label: 'Active',      count: byStatus('in_progress').length, color: 'bg-amber-50 border-amber-100 text-amber-700' },
        { label: 'Completed',   count: byStatus('completed').length,   color: 'bg-emerald-50 border-emerald-100 text-emerald-700' },
    ];

    return (
        <PageShell
            title="Task Command"
            subtitle="Operational grid management and task distribution"
            icon={CheckSquare}
            accent="navy"
            badge="Grid-V1"
            actions={
                <div className="flex items-center gap-4">
                    <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                        <button 
                            onClick={() => setView('board')} 
                            className={`p-2 rounded-lg transition-all ${view === 'board' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                            title="Kanban Grid"
                        >
                            <Layout size={18} />
                        </button>
                        <button 
                            onClick={() => setView('list')}  
                            className={`p-2 rounded-lg transition-all ${view === 'list'  ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                            title="Linear List"
                        >
                            <ListIcon size={18} />
                        </button>
                    </div>
                    <button onClick={() => setIsModalOpen(true)} className="adm-btn adm-btn-amber flex items-center gap-2 h-11 px-5">
                        <Plus size={16} /> Deploy Task
                    </button>
                </div>
            }
        >
            {/* Control Panel Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {totalStats.map(s => (
                    <div key={s.label} className={`${s.color} border rounded-2xl p-6 flex flex-col gap-1 shadow-sm`}>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">{s.label}</span>
                        <span className="text-3xl font-black tracking-tighter">{s.count}</span>
                    </div>
                ))}
            </div>

            <FilterBar>
                <SearchBox value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Locate task entity..." />
                <div className="ml-auto flex items-center gap-3">
                    <button onClick={fetchTasks} className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all shadow-sm">
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button className="adm-btn adm-btn-ghost h-10 px-4 text-[10px] uppercase font-black tracking-widest flex items-center gap-2">
                        <Filter size={14} /> Refine Grid
                    </button>
                </div>
            </FilterBar>

            {loading ? <PageLoader /> : view === 'board' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
                    {COLUMNS.map(col => (
                        <div key={col.id} className="flex flex-col gap-4">
                            <div className="flex items-center justify-between px-2">
                                <div className="flex items-center gap-2.5">
                                    <div className={`w-2 h-2 rounded-full ${col.dot} shadow-[0_0_8px_rgba(0,0,0,0.1)]`} />
                                    <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest">{col.title}</h3>
                                </div>
                                <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200/50">{byStatus(col.id).length}</span>
                            </div>
                            <div className={`flex-1 min-h-[500px] rounded-[2rem] ${col.bg} border ${col.border} p-4 space-y-4`}>
                                {byStatus(col.id).map(task => (
                                    <TaskCard key={task._id} task={task} onStatusUpdate={handleUpdateStatus} onDelete={handleDeleteTask} />
                                ))}
                                {byStatus(col.id).length === 0 && (
                                    <div className="h-24 flex items-center justify-center border-2 border-dashed border-slate-200/40 rounded-[1.5rem] opacity-30">
                                        <Plus size={20} className="text-slate-400" />
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <SectionCard title="Task Registry" className="mt-8" noPad>
                    <div className="overflow-x-auto">
                        <table className="adm-table">
                            <thead>
                                <tr>
                                    <th>Task Specification</th>
                                    <th>Protocol Status</th>
                                    <th>Priority Index</th>
                                    <th>Deadline</th>
                                    <th className="text-right">Operations</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(task => (
                                    <tr key={task._id} className="group">
                                        <td>
                                            <div className="flex flex-col">
                                                <span className="font-black text-slate-800 text-sm uppercase tracking-tight leading-none mb-1.5">{task.title}</span>
                                                <span className="text-[11px] text-slate-400 font-medium truncate max-w-sm">{task.description || 'No descriptive data'}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="relative w-fit">
                                                <select 
                                                    value={task.status} 
                                                    onChange={e => handleUpdateStatus(task._id, e.target.value)}
                                                    className="adm-input h-9 pl-3 pr-8 text-[10px] font-black uppercase w-auto bg-slate-50 border-slate-100 appearance-none"
                                                >
                                                    {COLUMNS.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                                                </select>
                                                <ArrowRight size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none rotate-90" />
                                            </div>
                                        </td>
                                        <td><span className={PRIORITY_MAP[task.priority]?.cls || 'adm-badge'}>{task.priority}</span></td>
                                        <td>
                                            <div className="flex items-center gap-2">
                                                <Calendar size={12} className="text-slate-300" />
                                                <span className="text-[11px] font-black text-slate-500 uppercase">{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '—'}</span>
                                            </div>
                                        </td>
                                        <td className="text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                                <button onClick={() => handleDeleteTask(task._id)} className="w-9 h-9 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all border border-rose-100">
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {filtered.length === 0 && <EmptyState icon={CheckSquare} title="No task logs identified" />}
                </SectionCard>
            )}

            {/* Deploy Task Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
                        <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden border border-slate-100">
                            <div className="px-8 py-7 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                                <div>
                                    <h3 className="text-lg font-black text-slate-800 uppercase tracking-tighter">New Task Entry</h3>
                                    <p className="text-[10px] text-amber-500 font-black uppercase tracking-widest mt-1">Operational grid deployment</p>
                                </div>
                                <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all"><X size={20} /></button>
                            </div>
                            <form onSubmit={handleCreateTask} className="p-8 space-y-5">
                                <div>
                                    <label className="adm-label mb-2">Task Specification</label>
                                    <input required value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})}
                                        className="adm-input h-12" placeholder="e.g. Protocol-99 Verification" />
                                </div>
                                <div>
                                    <label className="adm-label mb-2">Detailed Log</label>
                                    <textarea rows="3" value={newTask.description} onChange={e => setNewTask({...newTask, description: e.target.value})}
                                        className="adm-input resize-none p-4" placeholder="Enter task context..." />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="adm-label mb-2">Priority Level</label>
                                        <select value={newTask.priority} onChange={e => setNewTask({...newTask, priority: e.target.value})} className="adm-input h-12">
                                            <option value="low">Minimal</option>
                                            <option value="medium">Steady</option>
                                            <option value="high">Critical</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="adm-label mb-2">Deadline</label>
                                        <input type="date" value={newTask.dueDate} onChange={e => setNewTask({...newTask, dueDate: e.target.value})} className="adm-input h-12" />
                                    </div>
                                </div>
                                <button type="submit" className="adm-btn adm-btn-primary w-full h-14 text-sm font-black uppercase tracking-widest mt-4">Execute Deployment</button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </PageShell>
    );
};

const TaskCard = ({ task, onStatusUpdate, onDelete }) => (
    <motion.div layout
        className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-xl hover:border-amber-300 transition-all group relative overflow-hidden cursor-default"
    >
        <div className="flex items-start justify-between mb-3">
            <span className={PRIORITY_MAP[task.priority]?.cls || 'adm-badge'}>{task.priority}</span>
            <button onClick={() => onDelete(task._id)} className="w-7 h-7 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all border border-rose-100 opacity-0 group-hover:opacity-100">
                <Trash2 size={12} />
            </button>
        </div>
        <h4 className="text-sm font-black text-slate-800 tracking-tight leading-snug mb-2">{task.title}</h4>
        {task.description && <p className="text-[11px] text-slate-400 font-medium line-clamp-2 leading-relaxed mb-4">{task.description}</p>}
        
        <div className="flex items-center justify-between pt-4 border-t border-slate-50">
            <div className="flex -space-x-2">
                <div className="w-7 h-7 rounded-full bg-slate-900 border-2 border-white flex items-center justify-center shadow-sm">
                    <User size={12} className="text-amber-500" />
                </div>
            </div>
            <div className="flex items-center gap-1.5">
                <Clock size={11} className="text-slate-300" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'Static'}
                </span>
            </div>
        </div>

        {/* Rapid Deployment Overlay */}
        <div className="absolute inset-x-0 bottom-0 p-2 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
            <div className="bg-slate-900/95 backdrop-blur-md rounded-xl p-2 flex items-center justify-around gap-1 shadow-2xl">
                {COLUMNS.filter(s => s.id !== task.status).map(s => (
                    <button 
                        key={s.id} 
                        onClick={() => onStatusUpdate(task._id, s.id)}
                        className="text-[9px] font-black text-white/60 hover:text-amber-500 uppercase px-2 py-1 transition-all"
                    >
                        {s.id === 'in_progress' ? 'Run' : s.id === 'review' ? 'Log' : s.id === 'completed' ? 'End' : 'Init'}
                    </button>
                ))}
            </div>
        </div>
    </motion.div>
);

export default AdminTaskManager;
