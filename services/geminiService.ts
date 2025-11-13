
import { GoogleGenAI, Type } from "@google/genai";
import { Teacher, Subject, Group, ScheduleEntry, Shift, Degree } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const scheduleSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            subjectId: { type: Type.STRING },
            teacherId: { type: Type.STRING },
            groupId: { type: Type.STRING },
            day: { type: Type.STRING },
            start: { type: Type.STRING },
            end: { type: Type.STRING },
        },
        required: ['subjectId', 'teacherId', 'groupId', 'day', 'start', 'end'],
    },
};

export const generateSchedulePrompt = async (
    teachers: Teacher[],
    subjects: Subject[],
    groups: Group[],
    shifts: Shift[],
    degrees: Degree[],
): Promise<ScheduleEntry[]> => {
    const prompt = `
Eres un experto en logística y planificación académica universitaria. Tu tarea es generar un horario de clases semanal sin conflictos.

Aquí están las reglas y restricciones:
1.  **Sin Conflictos**: Un docente no puede impartir dos clases al mismo tiempo. Un grupo no puede tomar dos clases al mismo tiempo.
2.  **Disponibilidad del Docente**: Las clases asignadas a un docente DEBEN estar dentro de su horario de disponibilidad. La disponibilidad se define por rangos; una clase puede empezar a cualquier hora dentro de ese rango.
3.  **Horario del Grupo (Turno)**: Las clases de un grupo DEBEN respetar el rango horario y los días de su turno asignado (referenciado por 'shiftId').
4.  **Especialización del Docente**: Asigna a los docentes únicamente a las materias que pueden impartir (campo 'canTeach'). Un docente puede impartir materias de diferentes licenciaturas si está en su lista 'canTeach'.
5.  **Duración de Clases**: Todas las sesiones de clase duran exactamente 1 hora. Las clases deben empezar en horas en punto (ej. 07:00, 08:00, 16:00).
6.  **Horas por Semana**: La cantidad de sesiones de 1 hora para una materia en un grupo debe coincidir con el campo 'hoursPerWeek' de esa materia. Por ejemplo, si 'hoursPerWeek' es 3, debe haber 3 sesiones de 1 hora en la semana para esa materia en ese grupo.
7.  **Consistencia de Licenciatura del Grupo**: Un grupo (definido por 'degreeId') solo puede tomar materias de su propia licenciatura. Los docentes asignados deben poder impartir esas materias.

DATOS DE ENTRADA:

**Licenciaturas:**
${JSON.stringify(degrees, null, 2)}

**Turnos (definen los rangos horarios para los grupos):**
${JSON.stringify(shifts, null, 2)}

**Docentes (con su disponibilidad y materias que pueden impartir):**
${JSON.stringify(teachers, null, 2)}

**Materias (con su 'degreeId' y 'semester'):**
${JSON.stringify(subjects, null, 2)}

**Grupos (con su 'shiftId' que enlaza al turno y su 'degreeId'):**
${JSON.stringify(groups, null, 2)}

Basado en TODAS estas reglas y datos, genera el horario. La salida debe ser exclusivamente un objeto JSON que se valide con el esquema proporcionado, sin texto introductorio, explicaciones o comentarios adicionales.
`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: scheduleSchema,
                temperature: 0.2,
            },
        });
        
        const jsonText = response.text.trim();
        if (!jsonText) {
            throw new Error("La API de Gemini devolvió una respuesta vacía. No se pudo generar un horario con las restricciones dadas.");
        }
        
        const schedule = JSON.parse(jsonText) as ScheduleEntry[];
        return schedule;

    } catch (error) {
        console.error("Error calling Gemini API:", error);
        throw new Error("No se pudo comunicar con la IA para generar el horario. Revisa las restricciones e inténtalo de nuevo.");
    }
};
