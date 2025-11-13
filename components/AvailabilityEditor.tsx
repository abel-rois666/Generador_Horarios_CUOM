
import React, { useMemo } from 'react';
import { TimeSlot, Day } from '../types';
import { DAYS } from '../constants';

interface AvailabilityEditorProps {
    availability: TimeSlot[];
    onChange: (newAvailability: TimeSlot[]) => void;
}

const HOURS = Array.from({ length: 16 }, (_, i) => `${(i + 7).toString().padStart(2, '0')}:00`); // 7:00 to 22:00

const AvailabilityEditor: React.FC<AvailabilityEditorProps> = ({ availability, onChange }) => {

    const availabilitySet = useMemo(() => {
        const set = new Set<string>();
        availability.forEach(slot => {
            const startHour = parseInt(slot.start.split(':')[0]);
            const endHour = parseInt(slot.end.split(':')[0]);
            for (let i = startHour; i < endHour; i++) {
                set.add(`${slot.day}-${i.toString().padStart(2, '0')}:00`);
            }
        });
        return set;
    }, [availability]);

    const handleTimeSlotClick = (day: Day, hour: string) => {
        const newAvailabilityMap = new Map<Day, number[]>();
        
        // Populate map with existing availability
        availability.forEach(slot => {
            const currentHours = newAvailabilityMap.get(slot.day) || [];
            const startHour = parseInt(slot.start.split(':')[0]);
            const endHour = parseInt(slot.end.split(':')[0]);
            for (let i = startHour; i < endHour; i++) {
                if (!currentHours.includes(i)) {
                    currentHours.push(i);
                }
            }
            newAvailabilityMap.set(slot.day, currentHours);
        });

        // Toggle the clicked hour
        const clickedHour = parseInt(hour.split(':')[0]);
        const dayHours = newAvailabilityMap.get(day) || [];
        if (dayHours.includes(clickedHour)) {
            const index = dayHours.indexOf(clickedHour);
            dayHours.splice(index, 1);
        } else {
            dayHours.push(clickedHour);
        }
        newAvailabilityMap.set(day, dayHours.sort((a,b) => a - b));

        // Convert map back to TimeSlot[]
        const newAvailability: TimeSlot[] = [];
        for (const [currentDay, hours] of newAvailabilityMap.entries()) {
            if (hours.length === 0) continue;
            
            let start = hours[0];
            let end = hours[0];

            for (let i = 1; i < hours.length; i++) {
                if (hours[i] === end + 1) {
                    end = hours[i];
                } else {
                    newAvailability.push({ day: currentDay, start: `${start.toString().padStart(2, '0')}:00`, end: `${(end + 1).toString().padStart(2, '0')}:00` });
                    start = hours[i];
                    end = hours[i];
                }
            }
            newAvailability.push({ day: currentDay, start: `${start.toString().padStart(2, '0')}:00`, end: `${(end + 1).toString().padStart(2, '0')}:00` });
        }
        onChange(newAvailability);
    };

    return (
        <div className="border rounded-lg overflow-x-auto">
            <table className="w-full text-center text-xs">
                <thead>
                    <tr className="bg-slate-50">
                        <th className="p-1 border-b border-r w-12"></th>
                        {DAYS.map(day => (
                            <th key={day} className="p-1 border-b font-semibold text-slate-600">{day.substring(0,3)}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {HOURS.map(hour => (
                        <tr key={hour}>
                            <td className="p-1 border-r font-mono text-slate-500">{hour}</td>
                            {DAYS.map(day => {
                                const isAvailable = availabilitySet.has(`${day}-${hour}`);
                                return (
                                    <td key={`${day}-${hour}`} className="p-0 border-r">
                                        <button 
                                            onClick={() => handleTimeSlotClick(day, hour)}
                                            className={`w-full h-6 transition-colors ${isAvailable ? 'bg-green-400 hover:bg-green-500' : 'bg-slate-100 hover:bg-slate-200'}`}
                                            aria-label={`Marcar ${day} a las ${hour} como ${isAvailable ? 'no disponible' : 'disponible'}`}
                                        />
                                    </td>
                                )
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default AvailabilityEditor;
