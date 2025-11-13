
import { Teacher, Subject, Group, Day, Degree, Shift } from './types';

export const DAYS: Day[] = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export const MOCK_DEGREES: Degree[] = [
    { id: 'D1', name: 'Ingeniería en Sistemas Computacionales' },
    { id: 'D2', name: 'Licenciatura en Diseño Gráfico' }
];

export const MOCK_SHIFTS: Shift[] = [
    { id: 'Shift1', name: 'Matutino', start: '07:00', end: '13:00', days: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'] },
    { id: 'Shift2', name: 'Vespertino', start: '16:00', end: '21:00', days: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'] },
    { id: 'Shift3', name: 'Mixto (Sabatino)', start: '07:00', end: '15:00', days: ['Sábado'] },
];

export const MOCK_TEACHERS: Teacher[] = [
    {
        id: 'T1',
        name: 'Dr. Alan Turing',
        availability: [
            { day: 'Lunes', start: '16:00', end: '21:00' },
            { day: 'Miércoles', start: '16:00', end: '21:00' },
            { day: 'Viernes', start: '16:00', end: '21:00' },
        ],
        canTeach: ['S1', 'S2', 'S5', 'S7'] // Puede enseñar en Sistemas y Diseño
    },
    {
        id: 'T2',
        name: 'Dra. Ada Lovelace',
        availability: [
            { day: 'Martes', start: '07:00', end: '13:00' },
            { day: 'Jueves', start: '07:00', end: '13:00' },
        ],
        canTeach: ['S3', 'S4']
    },
    {
        id: 'T3',
        name: 'Ing. Grace Hopper',
        availability: [
            { day: 'Sábado', start: '07:00', end: '15:00' },
        ],
        canTeach: ['S1', 'S6']
    },
     {
        id: 'T4',
        name: 'Mtro. Tim Berners-Lee',
        availability: [
            { day: 'Lunes', start: '07:00', end: '13:00' },
            { day: 'Martes', start: '16:00', end: '21:00' },
            { day: 'Miércoles', start: '07:00', end: '13:00' },
            { day: 'Jueves', start: '16:00', end: '21:00' },
        ],
        canTeach: ['S2', 'S3', 'S4', 'S5']
    }
];

export const MOCK_SUBJECTS: Subject[] = [
    { id: 'S1', name: 'Algoritmos', hoursPerWeek: 3, degreeId: 'D1', semester: 1 },
    { id: 'S2', name: 'Estructura de Datos', hoursPerWeek: 4, degreeId: 'D1', semester: 2 },
    { id: 'S3', name: 'Bases de Datos', hoursPerWeek: 4, degreeId: 'D1', semester: 3 },
    { id: 'S4', name: 'Redes de Computadoras', hoursPerWeek: 3, degreeId: 'D1', semester: 4 },
    { id: 'S5', name: 'Inteligencia Artificial', hoursPerWeek: 2, degreeId: 'D1', semester: 5 },
    { id: 'S6', name: 'Programación Web', hoursPerWeek: 5, degreeId: 'D1', semester: 6 },
    { id: 'S7', name: 'Teoría del Color', hoursPerWeek: 3, degreeId: 'D2', semester: 1 },
];

export const MOCK_GROUPS: Group[] = [
    {
        id: 'G1',
        name: 'ISC 1A',
        shiftId: 'Shift1',
        degreeId: 'D1',
        subjects: ['S1']
    },
    {
        id: 'G2',
        name: 'ISC 3B',
        shiftId: 'Shift2',
        degreeId: 'D1',
        subjects: ['S2', 'S3', 'S5']
    },
    {
        id: 'G3',
        name: 'ISC 5C Sabatino',
        shiftId: 'Shift3',
        degreeId: 'D1',
        subjects: ['S6']
    },
];
