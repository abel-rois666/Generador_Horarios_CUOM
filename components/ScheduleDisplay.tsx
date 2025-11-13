
import React from 'react';
import { ScheduleEntry, Group, Subject, Teacher, Shift } from '../types';

interface ScheduleDisplayProps {
    schedule: ScheduleEntry[];
    groups: Group[];
    subjects: Subject[];
    teachers: Teacher[];
    shifts: Shift[];
}

const generateHours = (start: string, end: string): string[] => {
    const hours: string[] = [];
    let currentHour = parseInt(start.split(':')[0]);
    const endHour = parseInt(end.split(':')[0]);

    while(currentHour < endHour) {
        hours.push(`${currentHour.toString().padStart(2, '0')}:00`);
        currentHour++;
    }
    return hours;
}

const COLOR_PALETTE = [
    'bg-blue-200 border-blue-400', 'bg-green-200 border-green-400', 'bg-yellow-200 border-yellow-400',
    'bg-purple-200 border-purple-400', 'bg-pink-200 border-pink-400', 'bg-indigo-200 border-indigo-400',
    'bg-teal-200 border-teal-400', 'bg-orange-200 border-orange-400'
];

const getSubjectColor = (subjectId: string, allSubjects: Subject[]): string => {
    const index = allSubjects.findIndex(s => s.id === subjectId);
    return COLOR_PALETTE[index % COLOR_PALETTE.length];
};

const ScheduleDisplay: React.FC<ScheduleDisplayProps> = ({ schedule, groups, subjects, teachers, shifts }) => {

    const findEntity = <T extends { id: string }>(id: string, entities: T[]): T | undefined => {
        return entities.find(e => e.id === id);
    };
    
    const findEntityName = <T extends { id: string; name: string }>(id: string, entities: T[]): string => {
        return findEntity(id, entities)?.name || 'Desconocido';
    };

    return (
        <div className="space-y-8 animate-fade-in">
            {groups.map(group => {
                const groupSchedule = schedule.filter(entry => entry.groupId === group.id);
                const groupShift = findEntity(group.shiftId, shifts);
                
                if (!groupShift) {
                    return <div key={group.id} className="p-4 bg-red-100 text-red-700 rounded-lg">Error: Turno no encontrado para el grupo {group.name}</div>;
                }
                
                const relevantDays = groupShift.days;
                const hours = generateHours(groupShift.start, groupShift.end);

                return (
                    <div key={group.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
                        <div className="p-4 bg-slate-800 text-white">
                            <h3 className="text-xl font-bold">{group.name}</h3>
                            <p className="text-sm opacity-80">Turno: {groupShift.name}</p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-slate-100">
                                        <th className="p-2 border text-xs sm:text-sm font-semibold text-slate-600 w-24">Hora</th>
                                        {relevantDays.map(day => (
                                            <th key={day} className="p-2 border text-xs sm:text-sm font-semibold text-slate-600">{day}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {hours.map(hour => (
                                        <tr key={hour}>
                                            <td className="p-2 border text-center text-xs sm:text-sm font-mono bg-slate-50 text-slate-500">{hour}</td>
                                            {relevantDays.map(day => {
                                                const entry = groupSchedule.find(e => e.day === day && e.start === hour);
                                                if (entry) {
                                                    const subjectName = findEntityName(entry.subjectId, subjects);
                                                    const teacherName = findEntityName(entry.teacherId, teachers);
                                                    const colorClass = getSubjectColor(entry.subjectId, subjects);
                                                    return (
                                                        <td key={`${day}-${hour}`} className={`p-2 border ${colorClass} text-slate-800`}>
                                                            <p className="font-bold text-xs sm:text-sm">{subjectName}</p>
                                                            <p className="text-xs opacity-80">{teacherName}</p>
                                                        </td>
                                                    );
                                                }
                                                return <td key={`${day}-${hour}`} className="p-2 border h-16 hover:bg-slate-50 transition-colors"></td>;
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default ScheduleDisplay;
