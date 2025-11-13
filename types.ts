
export type Day = 'Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes' | 'Sábado';

export interface TimeSlot {
    day: Day;
    start: string; // HH:mm format
    end: string;   // HH:mm format
}

export interface Degree {
    id: string;
    name: string;
}

export interface Shift {
    id: string;
    name: string;
    start: string; // HH:mm
    end: string;   // HH:mm
    days: Day[];
}

export interface Teacher {
    id: string;
    name: string;
    availability: TimeSlot[];
    canTeach: string[]; // Array of Subject IDs
}

export interface Subject {
    id: string;
    name: string;
    hoursPerWeek: number;
    degreeId: string;
    semester: number;
}

export interface Group {
    id: string;
    name: string;
    shiftId: string;
    degreeId: string;
    subjects: string[]; // Array of Subject IDs
}

export interface ScheduleEntry {
    subjectId: string;
    teacherId: string;
    groupId: string;
    day: Day;
    start: string; // HH:mm format
    end: string;   // HH:mm format
}
