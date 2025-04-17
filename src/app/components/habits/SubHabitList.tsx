"use client";

import { useState, useEffect } from 'react';
import { Habit } from '@/app/models/Habit';
import { useHabitStore } from '@/app/store/habitStore';
import { FiPlus, FiChevronDown, FiChevronUp, FiClock, FiCheck, FiX } from 'react-icons/fi';
import { format } from 'date-fns';
import AddSubHabitModal from './AddSubHabitModal';

interface SubHabitListProps {
  parentHabit: Habit;
  showSubHabitsInline?: boolean;
}

export default function SubHabitList({ parentHabit, showSubHabitsInline = false }: SubHabitListProps) {
  const { getSubHabits, completeSubHabit, undoSubHabitCompletion, deleteHabit } = useHabitStore();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [subHabits, setSubHabits] = useState<Habit[]>([]);
  const [isClient, setIsClient] = useState(false);
  
  // Set client-side rendering flag
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Fetch sub-habits when component mounts or parent habit changes
  useEffect(() => {
    if (isClient && parentHabit) {
      const subs = getSubHabits(parentHabit.id);
      setSubHabits(subs);
    }
  }, [isClient, parentHabit, getSubHabits]);
  
  // Get today's date for completions
  const today = isClient ? format(new Date(), 'yyyy-MM-dd') : '';
  
  // Calculate total duration and progress
  const totalDuration = subHabits.reduce((sum, subHabit) => sum + (subHabit.duration || 0), 0);
  const totalHoursCompleted = isClient ? subHabits.reduce((sum, subHabit) => {
    const todayCompletions = subHabit.completions.filter(c => c.date.split('T')[0] === today);
    return sum + todayCompletions.reduce((s, c) => s + (c.count || 0), 0);
  }, 0) : 0;
  
  // Handle sub-habit completion
  const handleCompleteSubHabit = (subHabit: Habit) => {
    // Check if already completed today
    const completedToday = subHabit.completions.some(c => c.date.split('T')[0] === today);
    
    if (completedToday) {
      // Undo completion
      undoSubHabitCompletion(parentHabit.id, subHabit.id, today);
    } else {
      // Complete it (add 1 hour by default or remaining duration)
      const completedHours = subHabit.completions
        .filter(c => c.date.split('T')[0] === today)
        .reduce((sum, c) => sum + (c.count || 0), 0);
      
      const remaining = (subHabit.duration || 0) - completedHours;
      const hoursToAdd = Math.min(1, Math.max(0.1, remaining));
      
      completeSubHabit(parentHabit.id, subHabit.id, {
        date: today + 'T' + new Date().toISOString().split('T')[1],
        count: hoursToAdd
      });
    }
    
    // Refresh the sub-habits list
    setSubHabits(getSubHabits(parentHabit.id));
  };
  
  // Handle sub-habit deletion
  const handleDeleteSubHabit = (subHabitId: string) => {
    if (confirm('Are you sure you want to delete this sub-habit?')) {
      deleteHabit(subHabitId);
      // Refresh the sub-habits list
      setSubHabits(getSubHabits(parentHabit.id));
    }
  };
  
  // Get category color for progress bars
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'study':
        return 'bg-gradient-to-r from-blue-600 to-blue-400';
      case 'health':
        return 'bg-gradient-to-r from-green-600 to-green-400';
      case 'personal':
        return 'bg-gradient-to-r from-yellow-600 to-yellow-400';
      case 'work':
        return 'bg-gradient-to-r from-red-600 to-red-400';
      case 'creative':
        return 'bg-gradient-to-r from-purple-600 to-purple-400';
      default:
        return 'bg-gradient-to-r from-primary-600 to-primary-400';
    }
  };
  
  const progressBarColor = getCategoryColor(parentHabit.category);
  
  return (
    <>
      {/* Always render the AddSubHabitModal so it can be opened */}
      <AddSubHabitModal 
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        parentHabit={parentHabit}
      />
      
      {/* Only render the UI if not showing sub-habits inline */}
      {!showSubHabitsInline && (
        <div className="mt-3 bg-black/20 rounded-lg p-3">
          <div 
            className="flex justify-between items-center cursor-pointer"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <h4 className="text-sm text-white font-medium flex items-center">
              <FiClock className="mr-2 opacity-70" />
              Sub-Habits ({subHabits.length})
            </h4>
            <div className="flex items-center">
              <button 
                className="ml-2 p-1.5 rounded-full bg-black/20 hover:bg-black/30 text-white/80"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsAddModalOpen(true);
                }}
              >
                <FiPlus className="w-3.5 h-3.5" />
              </button>
              <button className="ml-1 p-1 text-white/70">
                {isExpanded ? <FiChevronUp className="w-4 h-4" /> : <FiChevronDown className="w-4 h-4" />}
              </button>
            </div>
          </div>
          
          {/* Show total progress for all sub-habits */}
          <div className="mt-2">
            <div className="flex justify-between text-xs text-white/70 mb-1">
              <span>{totalHoursCompleted.toFixed(1)} hrs completed</span>
              <span>{(totalDuration - totalHoursCompleted).toFixed(1)} hrs remaining</span>
            </div>
            <div className="bg-black/30 rounded-full h-1.5 overflow-hidden">
              <div 
                className={`${progressBarColor} h-full rounded-full transition-all duration-1000 ease-out`}
                style={{ width: `${totalDuration > 0 ? (totalHoursCompleted / totalDuration) * 100 : 0}%` }}
              />
            </div>
          </div>
          
          {/* Sub-habits list */}
          {isExpanded && (
            <div className="mt-3 space-y-2">
              {subHabits.length > 0 ? (
                subHabits.map((subHabit) => {
                  // Calculate completion for this sub-habit
                  const completedHours = subHabit.completions
                    .filter(c => c.date.split('T')[0] === today)
                    .reduce((sum, c) => sum + (c.count || 0), 0);
                  
                  const completionPercentage = subHabit.duration 
                    ? (completedHours / subHabit.duration) * 100 
                    : 0;
                  
                  const isCompleted = completionPercentage >= 100;
                  
                  return (
                    <div 
                      key={subHabit.id} 
                      className="p-2 bg-black/20 rounded-lg border border-white/10 flex items-center"
                    >
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <h5 className="text-sm text-white font-medium">{subHabit.name}</h5>
                          <span className="text-xs text-white/80">
                            {completedHours.toFixed(1)}/{subHabit.duration?.toFixed(1)} hrs
                          </span>
                        </div>
                        
                        <div className="mt-1 bg-black/30 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className={`${progressBarColor} h-full rounded-full transition-all duration-1000 ease-out`}
                            style={{ width: `${completionPercentage}%` }}
                          />
                        </div>
                      </div>
                      
                      <div className="flex ml-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCompleteSubHabit(subHabit);
                          }}
                          className={`w-8 h-8 flex items-center justify-center rounded-full focus:outline-none ${
                            isCompleted
                              ? `bg-${parentHabit.category}-500/40 text-white`
                              : 'bg-white/10 text-white/70 hover:bg-white/20'
                          }`}
                        >
                          <FiCheck className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSubHabit(subHabit.id);
                          }}
                          className="ml-2 w-8 h-8 flex items-center justify-center rounded-full text-white/60 hover:text-red-400 hover:bg-white/10 focus:outline-none"
                          aria-label="Delete sub-habit"
                        >
                          <FiX className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-3 text-white/60 text-sm">
                  No sub-habits yet. Add some to track your progress in detail.
                </div>
              )}
            </div>
          )}
        </div>
      )}
      
      {/* Add a button to add sub-habits if showing inline */}
      {showSubHabitsInline && !isAddModalOpen && (
        <div className="mt-2 flex justify-center">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-3 py-1.5 rounded-full text-xs bg-black/20 hover:bg-black/30 text-white/80 flex items-center"
          >
            <FiPlus className="mr-1 w-3.5 h-3.5" /> Add Sub-Habit
          </button>
        </div>
      )}
    </>
  );
} 