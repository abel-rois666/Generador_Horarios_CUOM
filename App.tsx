

import React, { useState, useCallback, useMemo } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Teacher, Subject, Group, ScheduleEntry, Shift, Degree, Day } from './types';
import { MOCK_TEACHERS, MOCK_SUBJECTS, MOCK_GROUPS, MOCK_DEGREES, MOCK_SHIFTS, DAYS } from './constants';
import { generateSchedulePrompt } from './services/geminiService';
import { PlusIcon, TrashIcon, BrainCircuitIcon, ChevronDownIcon, ChevronUpIcon, PencilIcon, SettingsIcon, CloseIcon } from './components/Icons';
import ScheduleDisplay from './components/ScheduleDisplay';
import AvailabilityEditor from './components/AvailabilityEditor';

// --- Helper Types ---
interface DeletionConfirmation {
    message: string;
    onConfirm: () => void;
}

const App: React.FC = () => {
    const [teachers, setTeachers] = useState<Teacher[]>(MOCK_TEACHERS);
    const [subjects, setSubjects] = useState<Subject[]>(MOCK_SUBJECTS);
    const [groups, setGroups] = useState<Group[]>(MOCK_GROUPS);
    const [degrees, setDegrees] = useState<Degree[]>(MOCK_DEGREES);
    const [shifts, setShifts] = useState<Shift[]>(MOCK_SHIFTS);
    
    const [schedule, setSchedule] = useState<ScheduleEntry[] | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    
    const [activeSection, setActiveSection] = useState<string | null>('docentes');

    // Modal state
    const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
    const [editingGroup, setEditingGroup] = useState<Group | null>(null);
    const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
    const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
    const [editingShift, setEditingShift] = useState<Shift | null>(null);
    const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
    const [editingDegree, setEditingDegree] = useState<Degree | null>(null);
    const [isDegreeModalOpen, setIsDegreeModalOpen] = useState(false);
    const [deletionConfirmation, setDeletionConfirmation] = useState<DeletionConfirmation | null>(null);
    const [infoModalMessage, setInfoModalMessage] = useState<string | null>(null);


    const handleGenerateSchedule = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        setSchedule(null);

        try {
            const result = await generateSchedulePrompt(teachers, subjects, groups, shifts, degrees);
            setSchedule(result);
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : 'Ocurrió un error inesperado al generar el horario.');
        } finally {
            setIsLoading(false);
        }
    }, [teachers, subjects, groups, shifts, degrees]);

    const Section: React.FC<{ title: string; id: string; icon?: React.ReactNode; children: React.ReactNode }> = ({ title, id, icon, children }) => {
        const isOpen = activeSection === id;
        return (
            <div className="bg-white rounded-lg shadow-md mb-6 overflow-hidden">
                <button
                    onClick={() => setActiveSection(isOpen ? null : id)}
                    className="w-full text-left p-4 flex justify-between items-center bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        {icon}
                        <h2 className="text-xl font-bold text-slate-700">{title}</h2>
                    </div>
                    {isOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
                </button>
                {isOpen && <div className="p-6">{children}</div>}
            </div>
        );
    };
    
    // --- Data Management Handlers ---

    const addTeacher = () => setTeachers(prev => [...prev, {id: `T${Date.now()}`, name: `Nuevo Docente`, availability: [], canTeach: []}]);
    
    const handleRemoveTeacher = (id: string) => {
        const teacher = teachers.find(t => t.id === id);
        if (!teacher) return;
        setDeletionConfirmation({
            message: `¿Estás seguro de que quieres eliminar a ${teacher.name}?`,
            onConfirm: () => {
                setTeachers(prev => prev.filter(t => t.id !== id));
                setDeletionConfirmation(null);
            }
        });
    };
    
    const updateTeacher = (updatedTeacher: Teacher) => {
        setTeachers(prev => prev.map(t => t.id === updatedTeacher.id ? updatedTeacher : t));
        setEditingTeacher(null);
    };
    
    const openSubjectModal = (subject: Subject | null = null) => {
        setEditingSubject(subject);
        setIsSubjectModalOpen(true);
    };
    const closeSubjectModal = () => {
        setIsSubjectModalOpen(false);
        setEditingSubject(null);
    };
    const saveSubject = (subjectToSave: Subject) => {
        if (editingSubject) {
            setSubjects(subjects.map(s => s.id === subjectToSave.id ? subjectToSave : s));
        } else {
            setSubjects([...subjects, { ...subjectToSave, id: `S${Date.now()}` }]);
        }
        closeSubjectModal();
    };
    
    const handleRemoveSubject = (id: string) => {
        const subject = subjects.find(s => s.id === id);
        if (!subject) return;

        const isUsedByGroups = groups.some(g => g.subjects.includes(id));
        const isUsedByTeachers = teachers.some(t => t.canTeach.includes(id));
        
        if (isUsedByGroups || isUsedByTeachers) {
            setInfoModalMessage(`No se puede eliminar la materia "${subject.name}" porque está asignada a grupos o docentes. Por favor, reasigna o elimina esas dependencias primero.`);
            return;
        }

        setDeletionConfirmation({
            message: `¿Estás seguro de que quieres eliminar la materia "${subject.name}"?`,
            onConfirm: () => {
                setSubjects(prev => prev.filter(s => s.id !== id));
                setDeletionConfirmation(null);
            }
        });
    };
    
    const addGroup = () => setGroups(prev => [...prev, {id: `G${Date.now()}`, name: `Nuevo Grupo`, shiftId: shifts[0]?.id || '', degreeId: degrees[0]?.id || '', subjects: []}]);
    
    const handleRemoveGroup = (id: string) => {
        const group = groups.find(g => g.id === id);
        if (!group) return;
        setDeletionConfirmation({
            message: `¿Estás seguro de que quieres eliminar el grupo "${group.name}"?`,
            onConfirm: () => {
                setGroups(prev => prev.filter(g => g.id !== id));
                setDeletionConfirmation(null);
            }
        });
    };

    const updateGroup = (updatedGroup: Group) => {
        setGroups(prev => prev.map(g => g.id === updatedGroup.id ? updatedGroup : g));
        setEditingGroup(null);
    };
    
    const openShiftModal = (shift: Shift | null = null) => {
        setEditingShift(shift);
        setIsShiftModalOpen(true);
    };
    
    const closeShiftModal = () => {
        setIsShiftModalOpen(false);
        setEditingShift(null);
    };
    
    const saveShift = (shiftToSave: Shift) => {
        if (editingShift) {
            setShifts(shifts.map(s => s.id === shiftToSave.id ? shiftToSave : s));
        } else {
            setShifts([...shifts, { ...shiftToSave, id: `Shift${Date.now()}` }]);
        }
        closeShiftModal();
    };
    
    const handleRemoveShift = (id: string) => {
        const shift = shifts.find(s => s.id === id);
        if (!shift) return;

        const isUsed = groups.some(g => g.shiftId === id);
        if (isUsed) {
            setInfoModalMessage(`No se puede eliminar el turno "${shift.name}" porque está asignado a uno o más grupos.`);
            return;
        }

        setDeletionConfirmation({
            message: `¿Estás seguro de que quieres eliminar el turno "${shift.name}"?`,
            onConfirm: () => {
                setShifts(prev => prev.filter(s => s.id !== id));
                setDeletionConfirmation(null);
            }
        });
    }
    
    const openDegreeModal = (degree: Degree | null = null) => {
        setEditingDegree(degree);
        setIsDegreeModalOpen(true);
    };

    const closeDegreeModal = () => {
        setEditingDegree(null);
        setIsDegreeModalOpen(false);
    };

    const saveDegree = (degreeToSave: { id?: string, name: string }) => {
        if (!degreeToSave.name.trim()) {
            return;
        }
        if (degreeToSave.id) { // Editing
            setDegrees(prev => prev.map(d => d.id === degreeToSave.id ? { ...d, name: degreeToSave.name.trim() } : d));
        } else { // Adding
            setDegrees(prev => [...prev, { id: `D${Date.now()}`, name: degreeToSave.name.trim() }]);
        }
        closeDegreeModal();
    };
    
    const handleRemoveDegree = (id: string) => {
        const degree = degrees.find(d => d.id === id);
        if (!degree) return;

        const isUsedBySubjects = subjects.some(s => s.degreeId === id);
        const isUsedByGroups = groups.some(g => g.degreeId === id);
        if (isUsedBySubjects || isUsedByGroups) {
            setInfoModalMessage(`No se puede eliminar la licenciatura "${degree.name}" porque está siendo utilizada por materias o grupos. Por favor, reasigna o elimina esas dependencias primero.`);
            return;
        }

        setDeletionConfirmation({
            message: `¿Estás seguro de que quieres eliminar la licenciatura "${degree.name}"? Esta acción no se puede deshacer.`,
            onConfirm: () => {
                setDegrees(prev => prev.filter(d => d.id !== id));
                setDeletionConfirmation(null);
            }
        });
    };

    const findEntityName = <T extends { id: string; name: string }>(id: string, entities: T[]): string => {
        return entities.find(e => e.id === id)?.name || 'N/A';
    };


    return (
        <DndProvider backend={HTML5Backend}>
            <div className="min-h-screen bg-slate-100 font-sans">
                <header className="bg-white shadow-md">
                    <div className="container mx-auto px-4 py-6">
                        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-800">
                            Generador de Horarios con IA
                        </h1>
                        <p className="text-slate-600 mt-1">
                            Optimiza la planificación académica utilizando la disponibilidad de docentes y los requerimientos de cada grupo.
                        </p>
                    </div>
                </header>

                <main className="container mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1 space-y-6">
                        <Section title="Configuración General" id="config" icon={<SettingsIcon/>}>
                             <h3 className="text-lg font-semibold mb-2 text-slate-600">Turnos</h3>
                            {shifts.map(shift => (
                                <div key={shift.id} className="flex justify-between items-center p-2 border-b">
                                    <div>
                                        <p className="font-medium">{shift.name}</p>
                                        <p className="text-xs text-slate-500">{shift.days.join(', ')} ({shift.start} - {shift.end})</p>
                                    </div>
                                    <div>
                                         <button onClick={() => openShiftModal(shift)} className="text-slate-500 hover:text-blue-600 p-1"><PencilIcon /></button>
                                         <button onClick={() => handleRemoveShift(shift.id)} className="text-slate-500 hover:text-red-600 p-1"><TrashIcon /></button>
                                    </div>
                                </div>
                            ))}
                             <button onClick={() => openShiftModal()} className="mt-2 text-blue-600 font-semibold flex items-center gap-1 hover:text-blue-800"><PlusIcon/> Añadir Turno</button>
                            
                             <h3 className="text-lg font-semibold mt-6 mb-2 text-slate-600">Licenciaturas</h3>
                             {degrees.map(degree => (
                                <div key={degree.id} className="flex justify-between items-center p-2 border-b">
                                   <p className="font-medium">{degree.name}</p>
                                   <div>
                                     <button onClick={() => openDegreeModal(degree)} className="text-slate-500 hover:text-blue-600 p-1"><PencilIcon /></button>
                                     <button onClick={() => handleRemoveDegree(degree.id)} className="text-slate-500 hover:text-red-600 p-1"><TrashIcon /></button>
                                   </div>
                                </div>
                             ))}
                              <button onClick={() => openDegreeModal()} className="mt-2 text-blue-600 font-semibold flex items-center gap-1 hover:text-blue-800"><PlusIcon/> Añadir Licenciatura</button>
                        </Section>

                        <Section title="1. Docentes" id="docentes">
                            {teachers.map(teacher => (
                                <div key={teacher.id} className="p-3 border rounded-md mb-2 bg-slate-50">
                                    <div className="flex justify-between items-center">
                                       <div>
                                           <p className="font-semibold">{teacher.name}</p>
                                           <p className="text-xs text-slate-500">Puede enseñar {teacher.canTeach.length} materia(s)</p>
                                       </div>
                                       <div>
                                            <button onClick={() => setEditingTeacher(teacher)} className="text-slate-500 hover:text-blue-600 p-1"><PencilIcon/></button>
                                            <button onClick={() => handleRemoveTeacher(teacher.id)} className="text-slate-500 hover:text-red-700 p-1"><TrashIcon /></button>
                                       </div>
                                    </div>
                                </div>
                            ))}
                            <button onClick={addTeacher} className="mt-2 text-blue-600 font-semibold flex items-center gap-1 hover:text-blue-800"><PlusIcon/> Añadir Docente</button>
                        </Section>

                        <Section title="2. Materias" id="materias">
                             {subjects.map(subject => (
                                <div key={subject.id} className="p-3 border rounded-md mb-2 bg-slate-50">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="font-semibold">{subject.name} <span className="font-normal text-slate-500">({subject.hoursPerWeek}h/sem)</span></p>
                                            <p className="text-xs text-indigo-600">{findEntityName(subject.degreeId, degrees)} - Semestre {subject.semester}</p>
                                        </div>
                                         <div>
                                            <button onClick={() => openSubjectModal(subject)} className="text-slate-500 hover:text-blue-600 p-1"><PencilIcon/></button>
                                            <button onClick={() => handleRemoveSubject(subject.id)} className="text-slate-500 hover:text-red-700 p-1"><TrashIcon /></button>
                                       </div>
                                    </div>
                                </div>
                            ))}
                            <button onClick={() => openSubjectModal()} className="mt-2 text-blue-600 font-semibold flex items-center gap-1 hover:text-blue-800"><PlusIcon/> Añadir Materia</button>
                        </Section>
                        
                        <Section title="3. Grupos" id="grupos">
                             {groups.map(group => (
                                <div key={group.id} className="p-3 border rounded-md mb-2 bg-slate-50">
                                    <div className="flex justify-between items-center">
                                       <div>
                                            <p className="font-semibold">{group.name}</p>
                                            <p className="text-xs text-indigo-600">{findEntityName(group.degreeId, degrees)}</p>
                                            <p className="text-xs text-slate-500">{findEntityName(group.shiftId, shifts)} | {group.subjects.length} materia(s)</p>
                                       </div>
                                       <div>
                                            <button onClick={() => setEditingGroup(group)} className="text-slate-500 hover:text-blue-600 p-1"><PencilIcon/></button>
                                            <button onClick={() => handleRemoveGroup(group.id)} className="text-slate-500 hover:text-red-700 p-1"><TrashIcon /></button>
                                       </div>
                                    </div>
                                </div>
                            ))}
                            <button onClick={addGroup} className="mt-2 text-blue-600 font-semibold flex items-center gap-1 hover:text-blue-800"><PlusIcon/> Añadir Grupo</button>
                        </Section>
                    </div>

                    <div className="lg:col-span-2">
                        <div className="sticky top-8">
                             <div className="bg-white rounded-lg shadow-lg p-6">
                                <h2 className="text-2xl font-bold text-slate-800 mb-4">4. Generar Horario</h2>
                                <p className="text-slate-600 mb-6">
                                    Una vez configurados los docentes, materias y grupos, presiona el botón para que la IA genere la mejor combinación de horarios posible.
                                </p>
                                <button
                                    onClick={handleGenerateSchedule}
                                    disabled={isLoading}
                                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-3"
                                >
                                    {isLoading ? 'Generando...' : <><BrainCircuitIcon/> Generar Horario con IA</>}
                                </button>
                            </div>

                            <div className="mt-8">
                                {isLoading && (
                                    <div className="flex justify-center items-center p-10 bg-white rounded-lg shadow-md">
                                        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
                                        <p className="ml-4 text-slate-600">Optimizando horarios...</p>
                                    </div>
                                )}
                                {error && (
                                    <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg shadow-md">
                                        <strong>Error:</strong> {error}
                                    </div>
                                )}
                                {schedule && (
                                    <ScheduleDisplay 
                                        schedule={schedule} 
                                        groups={groups} 
                                        subjects={subjects} 
                                        teachers={teachers}
                                        shifts={shifts} 
                                    />
                                )}
                                {!schedule && !isLoading && !error && (
                                     <div className="p-10 text-center bg-white/70 backdrop-blur-sm border border-dashed rounded-lg shadow-sm">
                                        <p className="text-slate-500">El horario generado aparecerá aquí.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </main>
            </div>
            {editingTeacher && <TeacherEditModal teacher={editingTeacher} allSubjects={subjects} degrees={degrees} onClose={() => setEditingTeacher(null)} onSave={updateTeacher} />}
            {editingGroup && <GroupEditModal group={editingGroup} shifts={shifts} degrees={degrees} allSubjects={subjects} onClose={() => setEditingGroup(null)} onSave={updateGroup} />}
            {/* FIX: Pass `setInfoModalMessage` to child components to allow them to display info modals. */}
            {isSubjectModalOpen && <SubjectEditModal subject={editingSubject} degrees={degrees} onClose={closeSubjectModal} onSave={saveSubject} setInfoModalMessage={setInfoModalMessage} />}
            {isShiftModalOpen && <ShiftEditModal shift={editingShift} onClose={closeShiftModal} onSave={saveShift} />}
            {isDegreeModalOpen && <DegreeEditModal degree={editingDegree} onClose={closeDegreeModal} onSave={saveDegree} setInfoModalMessage={setInfoModalMessage} />}
            {deletionConfirmation && <ConfirmationModal confirmation={deletionConfirmation} onCancel={() => setDeletionConfirmation(null)} />}
            {infoModalMessage && <InfoModal message={infoModalMessage} onClose={() => setInfoModalMessage(null)} />}
        </DndProvider>
    );
};

// --- MODAL COMPONENTS ---

interface ModalProps {
    title: string;
    onClose: () => void;
    children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ title, onClose, children }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
        <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col animate-fade-in-up">
            <header className="flex justify-between items-center p-4 border-b">
                <h2 className="text-xl font-bold text-slate-800">{title}</h2>
                <button onClick={onClose} className="text-slate-500 hover:text-slate-800"><CloseIcon/></button>
            </header>
            <main className="p-6 overflow-y-auto">
                {children}
            </main>
        </div>
    </div>
);

const ConfirmationModal: React.FC<{ confirmation: DeletionConfirmation, onCancel: () => void }> = ({ confirmation, onCancel }) => (
      <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
        <div className="bg-white rounded-lg shadow-2xl max-w-sm w-full animate-fade-in-up">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-slate-800">Confirmar Eliminación</h3>
            <p className="mt-2 text-slate-600">{confirmation.message}</p>
          </div>
          <footer className="flex justify-end gap-3 p-4 bg-slate-50 rounded-b-lg">
            <button onClick={onCancel} className="px-4 py-2 rounded-md text-slate-700 bg-slate-200 hover:bg-slate-300 font-semibold">Cancelar</button>
            <button onClick={confirmation.onConfirm} className="px-4 py-2 rounded-md text-white bg-red-600 hover:bg-red-700 font-semibold">Eliminar</button>
          </footer>
        </div>
      </div>
);

const InfoModal: React.FC<{ message: string, onClose: () => void }> = ({ message, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
        <div className="bg-white rounded-lg shadow-2xl max-w-sm w-full animate-fade-in-up">
            <div className="p-6">
                <h3 className="text-lg font-semibold text-slate-800">Aviso</h3>
                <p className="mt-2 text-slate-600">{message}</p>
            </div>
            <footer className="flex justify-end gap-3 p-4 bg-slate-50 rounded-b-lg">
                <button onClick={onClose} className="px-4 py-2 rounded-md text-white bg-blue-600 hover:bg-blue-700 font-semibold">Entendido</button>
            </footer>
        </div>
    </div>
);


const TeacherEditModal: React.FC<{ teacher: Teacher, allSubjects: Subject[], degrees: Degree[], onClose: () => void, onSave: (teacher: Teacher) => void }> = ({ teacher, allSubjects, degrees, onClose, onSave }) => {
    const [currentTeacher, setCurrentTeacher] = useState(teacher);

    const groupedSubjects = useMemo(() => {
        const byDegree: Record<string, Subject[]> = {};
        for(const subject of allSubjects) {
            if(!byDegree[subject.degreeId]) {
                byDegree[subject.degreeId] = [];
            }
            byDegree[subject.degreeId].push(subject);
        }
        
        const result = [];
        for(const degreeId in byDegree) {
            const bySemester: Record<number, Subject[]> = {};
            for (const subject of byDegree[degreeId]) {
                if(!bySemester[subject.semester]) {
                    bySemester[subject.semester] = [];
                }
                bySemester[subject.semester].push(subject);
            }
            result.push({
                degree: degrees.find(d => d.id === degreeId),
                semesters: Object.entries(bySemester).sort(([a], [b]) => Number(a) - Number(b)).map(([semester, subjects]) => ({ semester: Number(semester), subjects: subjects.sort((a,b) => a.name.localeCompare(b.name)) }))
            });
        }
        return result.sort((a,b) => a.degree?.name.localeCompare(b.degree?.name || '') || 0);
    }, [allSubjects, degrees]);

    const handleSubjectToggle = (subjectId: string) => {
        const canTeach = currentTeacher.canTeach.includes(subjectId)
            ? currentTeacher.canTeach.filter(id => id !== subjectId)
            : [...currentTeacher.canTeach, subjectId];
        setCurrentTeacher({ ...currentTeacher, canTeach });
    };

    return (
        <Modal title={`Editar Docente: ${teacher.name}`} onClose={onClose}>
             <div className="space-y-6">
                <div>
                    <label htmlFor="teacherName" className="block text-sm font-medium text-slate-700">Nombre</label>
                    <input type="text" id="teacherName" value={currentTeacher.name} onChange={e => setCurrentTeacher({...currentTeacher, name: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"/>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Disponibilidad Horaria</label>
                    <AvailabilityEditor 
                        availability={currentTeacher.availability}
                        onChange={newAvailability => setCurrentTeacher({...currentTeacher, availability: newAvailability})}
                    />
                </div>
                <div>
                     <label className="block text-sm font-medium text-slate-700 mb-2">Materias que puede impartir</label>
                     <div className="space-y-4 max-h-60 overflow-y-auto p-3 border rounded-md bg-slate-50">
                         {groupedSubjects.map(({ degree, semesters }) => (
                            <div key={degree?.id}>
                                <h3 className="font-bold text-indigo-700 sticky top-0 bg-slate-50 py-1">{degree?.name}</h3>
                                {semesters.map(({ semester, subjects }) => (
                                    <div key={semester} className="ml-2 mt-1">
                                        <h4 className="font-semibold text-slate-600">Semestre {semester}</h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-2">
                                            {subjects.map(subject => (
                                                <label key={subject.id} className="flex items-center space-x-2 cursor-pointer">
                                                    <input type="checkbox" checked={currentTeacher.canTeach.includes(subject.id)} onChange={() => handleSubjectToggle(subject.id)} className="rounded text-blue-600" />
                                                    <span className="text-sm">{subject.name}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                         ))}
                     </div>
                </div>
             </div>
              <footer className="flex justify-end gap-3 mt-6 pt-4 border-t">
                <button onClick={onClose} className="px-4 py-2 rounded-md text-slate-700 bg-slate-100 hover:bg-slate-200">Cancelar</button>
                <button onClick={() => onSave(currentTeacher)} className="px-4 py-2 rounded-md text-white bg-blue-600 hover:bg-blue-700">Guardar Cambios</button>
            </footer>
        </Modal>
    );
}

const GroupEditModal: React.FC<{ group: Group, shifts: Shift[], degrees: Degree[], allSubjects: Subject[], onClose: () => void, onSave: (group: Group) => void }> = ({ group, shifts, degrees, allSubjects, onClose, onSave }) => {
    const [currentGroup, setCurrentGroup] = useState(group);
    
    const subjectsForDegree = useMemo(() => {
        const bySemester: Record<number, Subject[]> = {};
        allSubjects
            .filter(s => s.degreeId === currentGroup.degreeId)
            .forEach(subject => {
                if(!bySemester[subject.semester]) {
                    bySemester[subject.semester] = [];
                }
                bySemester[subject.semester].push(subject);
            });
        return Object.entries(bySemester).sort(([a], [b]) => Number(a) - Number(b)).map(([semester, subjects]) => ({ semester: Number(semester), subjects: subjects.sort((a,b) => a.name.localeCompare(b.name)) }));
    }, [allSubjects, currentGroup.degreeId]);

    const handleSubjectToggle = (subjectId: string) => {
        const subjects = currentGroup.subjects.includes(subjectId)
            ? currentGroup.subjects.filter(id => id !== subjectId)
            : [...currentGroup.subjects, subjectId];
        setCurrentGroup({ ...currentGroup, subjects });
    };

    return(
        <Modal title={`Editar Grupo: ${group.name}`} onClose={onClose}>
            <div className="space-y-6">
                 <div>
                    <label htmlFor="groupName" className="block text-sm font-medium text-slate-700">Nombre / Clave del Grupo</label>
                    <input type="text" id="groupName" value={currentGroup.name} onChange={e => setCurrentGroup({...currentGroup, name: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"/>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="groupDegree" className="block text-sm font-medium text-slate-700">Licenciatura</label>
                        <select id="groupDegree" value={currentGroup.degreeId} onChange={e => setCurrentGroup({...currentGroup, degreeId: e.target.value, subjects: []})} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                            {degrees.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                    </div>
                     <div>
                        <label htmlFor="groupShift" className="block text-sm font-medium text-slate-700">Turno</label>
                        <select id="groupShift" value={currentGroup.shiftId} onChange={e => setCurrentGroup({...currentGroup, shiftId: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                            {shifts.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                </div>
                 <div>
                     <label className="block text-sm font-medium text-slate-700 mb-2">Materias del Grupo</label>
                     <div className="space-y-3 max-h-60 overflow-y-auto p-3 border rounded-md bg-slate-50">
                        {subjectsForDegree.length === 0 ? (
                            <p className="text-slate-500 text-sm">No hay materias para esta licenciatura. Añade materias en la sección correspondiente.</p>
                        ) : subjectsForDegree.map(({ semester, subjects }) => (
                            <div key={semester}>
                                <h4 className="font-semibold text-slate-600">Semestre {semester}</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-2">
                                    {subjects.map(subject => (
                                        <label key={subject.id} className="flex items-center space-x-2 cursor-pointer">
                                            <input type="checkbox" checked={currentGroup.subjects.includes(subject.id)} onChange={() => handleSubjectToggle(subject.id)} className="rounded text-green-600" />
                                            <span className="text-sm">{subject.name}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        ))}
                     </div>
                 </div>
            </div>
            <footer className="flex justify-end gap-3 mt-6 pt-4 border-t">
                <button onClick={onClose} className="px-4 py-2 rounded-md text-slate-700 bg-slate-100 hover:bg-slate-200">Cancelar</button>
                <button onClick={() => onSave(currentGroup)} className="px-4 py-2 rounded-md text-white bg-blue-600 hover:bg-blue-700">Guardar Cambios</button>
            </footer>
        </Modal>
    );
}

// FIX: Added setInfoModalMessage to props to allow displaying info modals from this component.
interface SubjectEditModalProps {
    subject: Subject | null;
    degrees: Degree[];
    onClose: () => void;
    onSave: (subject: Subject) => void;
    setInfoModalMessage: (message: string) => void;
}
const SubjectEditModal: React.FC<SubjectEditModalProps> = ({ subject, degrees, onClose, onSave, setInfoModalMessage }) => {
    const [currentSubject, setCurrentSubject] = useState<Omit<Subject, 'id'> & { id?: string }>(subject || { name: '', hoursPerWeek: 3, semester: 1, degreeId: degrees[0]?.id || ''});

    const handleSave = () => {
        if (!currentSubject.name || !currentSubject.degreeId) {
            setInfoModalMessage("Por favor, complete todos los campos.");
            return;
        }
        onSave(currentSubject as Subject);
    };

    return (
        <Modal title={subject ? 'Editar Materia' : 'Añadir Materia'} onClose={onClose}>
            <div className="space-y-4">
                 <div>
                    <label htmlFor="subjectName" className="block text-sm font-medium text-slate-700">Nombre</label>
                    <input type="text" id="subjectName" value={currentSubject.name} onChange={e => setCurrentSubject({...currentSubject, name: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"/>
                </div>
                 <div>
                    <label htmlFor="subjectDegree" className="block text-sm font-medium text-slate-700">Licenciatura</label>
                    <select id="subjectDegree" value={currentSubject.degreeId} onChange={e => setCurrentSubject({...currentSubject, degreeId: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                        {degrees.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="subjectHours" className="block text-sm font-medium text-slate-700">Horas por Semana</label>
                        <input type="number" id="subjectHours" min="1" max="10" value={currentSubject.hoursPerWeek} onChange={e => setCurrentSubject({...currentSubject, hoursPerWeek: parseInt(e.target.value) || 1})} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm"/>
                    </div>
                     <div>
                        <label htmlFor="subjectSemester" className="block text-sm font-medium text-slate-700">Semestre</label>
                        <input type="number" id="subjectSemester" min="1" max="12" value={currentSubject.semester} onChange={e => setCurrentSubject({...currentSubject, semester: parseInt(e.target.value) || 1})} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm"/>
                    </div>
                </div>
            </div>
             <footer className="flex justify-end gap-3 mt-6 pt-4 border-t">
                <button onClick={onClose} className="px-4 py-2 rounded-md text-slate-700 bg-slate-100 hover:bg-slate-200">Cancelar</button>
                <button onClick={handleSave} className="px-4 py-2 rounded-md text-white bg-blue-600 hover:bg-blue-700">Guardar Cambios</button>
            </footer>
        </Modal>
    );
}

const ShiftEditModal: React.FC<{ shift: Shift | null, onClose: () => void, onSave: (shift: Shift) => void }> = ({ shift, onClose, onSave }) => {
    const [currentShift, setCurrentShift] = useState<Shift>(shift || { id: '', name: '', start: '07:00', end: '13:00', days: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes']});
    
    const handleDayChange = (day: Day) => {
        const days = currentShift.days.includes(day)
            ? currentShift.days.filter(d => d !== day)
            : [...currentShift.days, day];
        setCurrentShift({...currentShift, days});
    }

    return (
        <Modal title={shift ? `Editar Turno: ${shift.name}` : 'Añadir Nuevo Turno'} onClose={onClose}>
            <div className="space-y-4">
                 <div>
                    <label htmlFor="shiftName" className="block text-sm font-medium text-slate-700">Nombre del Turno</label>
                    <input type="text" id="shiftName" value={currentShift.name} onChange={e => setCurrentShift({...currentShift, name: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"/>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="startTime" className="block text-sm font-medium text-slate-700">Hora de Inicio</label>
                        <input type="time" id="startTime" value={currentShift.start} onChange={e => setCurrentShift({...currentShift, start: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm"/>
                    </div>
                    <div>
                        <label htmlFor="endTime" className="block text-sm font-medium text-slate-700">Hora de Fin</label>
                        <input type="time" id="endTime" value={currentShift.end} onChange={e => setCurrentShift({...currentShift, end: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm"/>
                    </div>
                </div>
                <div>
                     <label className="block text-sm font-medium text-slate-700">Días de la Semana</label>
                     <div className="mt-2 flex flex-wrap gap-2">
                         {DAYS.map(day => (
                            <label key={day} className="flex items-center space-x-2">
                                <input type="checkbox" checked={currentShift.days.includes(day)} onChange={() => handleDayChange(day)} className="rounded text-indigo-600"/>
                                <span>{day}</span>
                            </label>
                         ))}
                     </div>
                </div>
            </div>
             <footer className="flex justify-end gap-3 mt-6 pt-4 border-t">
                <button onClick={onClose} className="px-4 py-2 rounded-md text-slate-700 bg-slate-100 hover:bg-slate-200">Cancelar</button>
                <button onClick={() => onSave(currentShift)} className="px-4 py-2 rounded-md text-white bg-blue-600 hover:bg-blue-700">Guardar Cambios</button>
            </footer>
        </Modal>
    );
}

// FIX: Added setInfoModalMessage to props to allow displaying info modals from this component.
interface DegreeEditModalProps {
    degree: Degree | null;
    onClose: () => void;
    onSave: (degree: { id?: string, name: string }) => void;
    setInfoModalMessage: (message: string) => void;
}
const DegreeEditModal: React.FC<DegreeEditModalProps> = ({ degree, onClose, onSave, setInfoModalMessage }) => {
    const [name, setName] = useState(degree?.name || '');

    const handleSave = () => {
        if (!name.trim()) {
            setInfoModalMessage("El nombre de la licenciatura no puede estar vacío.");
            return;
        }
        onSave({ id: degree?.id, name: name.trim() });
    };

    return (
        <Modal title={degree ? 'Editar Licenciatura' : 'Añadir Licenciatura'} onClose={onClose}>
            <div className="space-y-4">
                 <div>
                    <label htmlFor="degreeName" className="block text-sm font-medium text-slate-700">Nombre de la Licenciatura</label>
                    <input
                        type="text"
                        id="degreeName"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        placeholder="Ej: Ingeniería en Sistemas Computacionales"
                    />
                </div>
            </div>
             <footer className="flex justify-end gap-3 mt-6 pt-4 border-t">
                <button onClick={onClose} className="px-4 py-2 rounded-md text-slate-700 bg-slate-100 hover:bg-slate-200">Cancelar</button>
                <button onClick={handleSave} className="px-4 py-2 rounded-md text-white bg-blue-600 hover:bg-blue-700">Guardar</button>
            </footer>
        </Modal>
    );
}

export default App;