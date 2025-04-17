"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Habit } from '@/app/models/Habit';
import { useHabitStore } from '@/app/store/habitStore';
import { useTimerStore } from '@/app/store/timerStore';
import { format } from 'date-fns';
import { FiCheck, FiChevronRight, FiFlag, FiBook, FiHeart, FiCoffee, FiZap, FiClock, FiStar, FiEdit3, FiTrash2, FiEdit, FiMoreVertical, FiX, FiChevronDown, FiChevronUp, FiPlus } from 'react-icons/fi';
import AddSubHabitModal from './AddSubHabitModal';

// Animation variants
const cardVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { 
    opacity: 1, 
    y: 0, 
    transition: { type: "spring", stiffness: 260, damping: 20 } 
  },
  exit: { 
    opacity: 0, 
    y: -20, 
    transition: { duration: 0.2 } 
  },
  hover: { 
    y: -8,
    boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
    transition: { duration: 0.3 }
  }
};

const subHabitsVariants = {
  hidden: { opacity: 0, height: 0 },
  visible: { 
    opacity: 1,
    height: "auto",
    transition: { 
      duration: 0.3,
      type: "spring",
      stiffness: 300,
      damping: 24
    }
  }
};

interface HabitCardProps {
  habit: Habit;
  onClick: () => void;
  onEdit?: (habit: Habit) => void;
}

const getCategoryIcon = (category: string) => {
  switch (category.toLowerCase()) {
    case 'study':
      return <FiBook className="w-5 h-5" />;
    case 'health':
      return <FiHeart className="w-5 h-5" />;
    case 'personal':
      return <FiCoffee className="w-5 h-5" />;
    case 'work':
      return <FiZap className="w-5 h-5" />;
    default:
      return <FiFlag className="w-5 h-5" />;
  }
};

export default function HabitCard({ habit, onClick, onEdit }: HabitCardProps) {
  const [isClient, setIsClient] = useState(false);
  const { completeHabit, deleteHabit, undoHabitCompletion, getSubHabits } = useHabitStore();
  const { getActiveHabitProgress } = useTimerStore();
  const [isCompleting, setIsCompleting] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState(Date.now());
  const [showSubHabits, setShowSubHabits] = useState(true); // Default to showing sub-habits
  const [subHabits, setSubHabits] = useState<Habit[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // Set client-side rendering flag
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Load sub-habits when component mounts or updates
  useEffect(() => {
    if (isClient && habit && habit.subHabits && habit.subHabits.length > 0) {
      const subs = getSubHabits(habit.id);
      setSubHabits(subs);
    }
  }, [isClient, habit, getSubHabits, lastUpdateTime]);
  
  // Check if the habit is completed for today
  const today = isClient ? format(new Date(), 'yyyy-MM-dd') : '';
  
  // Force re-render on updates
  useEffect(() => {
    // Add a small delay to ensure the store has updated
    const refreshTimer = setTimeout(() => {
      // Update any calculated values based on habit completions
      if (isClient) {
        // This empty effect will cause a re-render after a short delay
        // which will recalculate completedToday, completionCount, etc.
      }
    }, 50);
    
    return () => clearTimeout(refreshTimer);
  }, [lastUpdateTime, isClient, habit]);
  
  // Initialize completion status
  let completedToday = isClient && habit.completions.some(c => c.date.split('T')[0] === today);
  let completionCount = isClient ? habit.completions.filter(c => c.date.split('T')[0] === today).reduce((sum, c) => sum + c.count, 0) : 0;
  
  // Get target repetitions
  const repetitionTarget = habit.frequency.repetitions || 1;
  
  // Calculate progress for normal habits
  const progress = (completionCount / repetitionTarget) * 100;
  
  // Calculate study progress for parent habits with duration and sub-habits
  let studyProgress = null;
  let subHabitsProgress = null;

  if (isClient && (habit.category === 'study' || habit.category === 'work') && habit.duration) {
    // For parent habits with sub-habits, calculate from sub-habits
    if (habit.subHabits && habit.subHabits.length > 0 && subHabits.length > 0) {
      let totalCompletedHours = 0;
      let totalDuration = 0;
      let allSubHabitsComplete = true;
      
      // Calculate total completed hours across all sub-habits
      subHabits.forEach(subHabit => {
        const subHabitCompletedHours = subHabit.completions
          .filter(c => c.date.split('T')[0] === today)
          .reduce((sum, c) => sum + c.count, 0);
        
        const subHabitDuration = subHabit.duration || 0;
        const subHabitPercentComplete = subHabitDuration > 0 
          ? (subHabitCompletedHours / subHabitDuration) * 100
          : 0;
          
        if (subHabitPercentComplete < 100) {
          allSubHabitsComplete = false;
        }
        
        totalCompletedHours += subHabitCompletedHours;
        totalDuration += subHabitDuration;
      });
      
      // Calculate percentage based on proportion of hours completed vs total hours
      const percentComplete = totalDuration > 0 ? Math.min(100, (totalCompletedHours / totalDuration) * 100) : 0;
      
      // A parent habit is considered complete ONLY when ALL sub-habits are complete
      const isCompleted = allSubHabitsComplete && subHabits.length > 0;
      
      subHabitsProgress = {
        completedHours: totalCompletedHours,
        totalHours: totalDuration,
        percentComplete,
        isCompleted
      };
      
      // Use sub-habits progress for the parent
      studyProgress = {
        hoursSpent: totalCompletedHours,
        percentComplete,
        isCompleted
      };
      
      // For parent habits with sub-habits, always use the all-complete status for completedToday
      completedToday = isCompleted;
    } else {
      // For habits without sub-habits, calculate normally
      const todayCompletions = habit.completions.filter(c => c.date.split('T')[0] === today);
      const hoursSpent = todayCompletions.reduce((sum, c) => sum + c.count, 0);
      const percentComplete = habit.duration ? Math.min(100, (hoursSpent / habit.duration) * 100) : 0;
      const isCompleted = percentComplete >= 100;
      
      studyProgress = {
        hoursSpent,
        percentComplete,
        isCompleted
      };
      
      // For habits with duration but no sub-habits, completedToday is based on 100% progress
      completedToday = isCompleted;
    }
  }
  
  // Add effect to refresh study progress when lastUpdateTime changes
  useEffect(() => {
    if (isClient && (habit.category === 'study' || habit.category === 'work') && habit.duration) {
      // This will re-render the component when lastUpdateTime changes
      // The studyProgress calculation will run again with fresh data
    }
  }, [isClient, habit, lastUpdateTime]);
  
  // Get the correct category color
  const getCategoryColor = () => {
    switch (habit.category) {
      case 'study':
        return {
          bgClass: 'from-blue-600/30 to-blue-400/10 border-blue-500/30',
          glowClass: 'glow-card blue',
          iconBg: 'bg-blue-500/40',
          iconShadow: 'shadow-[0_0_10px_rgba(59,130,246,0.4)]',
          textColor: 'text-blue-400',
          progressBg: 'bg-gradient-to-r from-blue-600 to-blue-400'
        };
      case 'health':
        return {
          bgClass: 'from-green-600/30 to-green-400/10 border-green-500/30',
          glowClass: 'glow-card green',
          iconBg: 'bg-green-500/40',
          iconShadow: 'shadow-[0_0_10px_rgba(34,197,94,0.4)]',
          textColor: 'text-green-400',
          progressBg: 'bg-gradient-to-r from-green-600 to-green-400'
        };
      case 'personal':
        return {
          bgClass: 'from-yellow-600/30 to-yellow-400/10 border-yellow-500/30',
          glowClass: 'glow-card yellow',
          iconBg: 'bg-yellow-500/40',
          iconShadow: 'shadow-[0_0_10px_rgba(234,179,8,0.4)]',
          textColor: 'text-yellow-400',
          progressBg: 'bg-gradient-to-r from-yellow-600 to-yellow-400'
        };
      case 'work':
        return {
          bgClass: 'from-red-600/30 to-red-400/10 border-red-500/30',
          glowClass: 'glow-card red',
          iconBg: 'bg-red-500/40',
          iconShadow: 'shadow-[0_0_10px_rgba(239,68,68,0.4)]',
          textColor: 'text-red-400',
          progressBg: 'bg-gradient-to-r from-red-600 to-red-400'
        };
      case 'creative':
        return {
          bgClass: 'from-purple-600/30 to-purple-400/10 border-purple-500/30',
          glowClass: 'glow-card purple',
          iconBg: 'bg-purple-500/40',
          iconShadow: 'shadow-[0_0_10px_rgba(168,85,247,0.4)]',
          textColor: 'text-purple-400',
          progressBg: 'bg-gradient-to-r from-purple-600 to-purple-400'
        };
      default:
        return {
          bgClass: 'from-primary-600/30 to-primary-400/10 border-primary-500/30',
          glowClass: 'glow-card orange',
          iconBg: 'bg-primary-500/40',
          iconShadow: 'shadow-[0_0_10px_rgba(249,115,22,0.4)]',
          textColor: 'text-primary-400',
          progressBg: 'bg-gradient-to-r from-primary-600 to-primary-400'
        };
    }
  };
  
  const categoryColor = getCategoryColor();
  
  const handleComplete = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Set completing state to prevent double-clicks
    setIsCompleting(true);
    
    // For parent habits with sub-habits and duration, handle differently
    if (habit.duration && habit.subHabits && habit.subHabits.length > 0 && subHabits.length > 0) {
      if (completedToday) {
        // If parent is already marked as completed, undo all sub-habits too
        undoHabitCompletion(habit.id, today);
        
        // Also undo all sub-habits
        subHabits.forEach(subHabit => {
          undoHabitCompletion(subHabit.id, today);
        });
      } else {
        // Complete ALL sub-habits
        subHabits.forEach(subHabit => {
          // First undo any existing completions
          undoHabitCompletion(subHabit.id, today);
          
          // Then mark the sub-habit as fully complete
          completeHabit({
            habitId: subHabit.id,
            date: today + 'T' + new Date().toISOString().split('T')[1],
            count: subHabit.duration || 0,
            notes: 'Completed via parent habit'
          });
        });
        
        // The parent's progress will be updated automatically when sub-habits are completed
      }
      
      // Trigger UI refresh
      setTimeout(() => {
        setLastUpdateTime(Date.now());
        setIsCompleting(false);
      }, 300);
    } 
    // Handle other habit types as before
    else if (habit.duration) {
      if (completedToday) {
        undoHabitCompletion(habit.id, today);
      } else {
        const currentHoursSpent = studyProgress ? studyProgress.hoursSpent : 0;
        const hoursToComplete = habit.duration;
        const isNearlyComplete = currentHoursSpent >= (hoursToComplete * 0.8);
        
        if (isNearlyComplete) {
          const remainingHours = hoursToComplete - currentHoursSpent;
          completeHabit({
            habitId: habit.id,
            date: today + 'T' + new Date().toISOString().split('T')[1],
            count: Math.max(0.1, remainingHours),
            notes: `Manually completed ${Math.round(remainingHours * 10) / 10} hours`
          });
        } else {
          completeHabit({
            habitId: habit.id,
            date: today + 'T' + new Date().toISOString().split('T')[1],
            count: 1,
            notes: `Manually added 1 hour`
          });
        }
      }
      
      // Trigger UI refresh
      setTimeout(() => {
        setLastUpdateTime(Date.now());
        setIsCompleting(false);
      }, 300);
    } else {
      // For regular habits without duration
      if (completedToday && completionCount > 0) {
        undoHabitCompletion(habit.id, today);
      } else {
        completeHabit({
          habitId: habit.id,
          date: today + 'T' + new Date().toISOString().split('T')[1],
          count: 1
        });
      }
      
      // Trigger UI refresh
      setTimeout(() => {
        setLastUpdateTime(Date.now());
        setIsCompleting(false);
      }, 300);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this habit?')) {
      deleteHabit(habit.id);
    }
    setShowActionMenu(false);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit(habit);
    }
    setShowActionMenu(false);
  };
  
  // Get frequency text in a readable format
  function getFrequencyText(frequency: Habit['frequency']) {
    if (frequency.type === 'daily') {
      return 'Daily';
    } else if (frequency.type === 'weekly') {
      return `${frequency.days?.length || 0} days/week`;
    }
    return 'Custom';
  }
  
  // Handle sub-habit completion directly from HabitCard
  const handleSubHabitComplete = (subHabit: Habit, e: React.MouseEvent) => {
    e.stopPropagation();
    
    setIsCompleting(true);
    
    // Check if already completed today
    const completedHours = subHabit.completions
      .filter(c => c.date.split('T')[0] === today)
      .reduce((sum, c) => sum + (c.count || 0), 0);
    
    const completionPercentage = subHabit.duration 
      ? (completedHours / subHabit.duration) * 100 
      : 0;
    
    const isCompleted = completionPercentage >= 100;
    
    if (isCompleted) {
      // If already completed, undo the completion
      undoHabitCompletion(subHabit.id, today);
    } else {
      // Complete this sub-habit
      const remainingHours = (subHabit.duration || 0) - completedHours;
      
      // Complete this sub-habit
      completeHabit({
        habitId: subHabit.id,
        date: today + 'T' + new Date().toISOString().split('T')[1],
        count: subHabit.duration || 0, // Always complete fully
        notes: `Completed from sub-habit`
      });
    }
    
    // Trigger UI refresh
    setTimeout(() => {
      setLastUpdateTime(Date.now());
      setIsCompleting(false);
    }, 300);
  };
  
  return (
    <motion.div
      className={`p-3 sm:p-4 rounded-xl bg-gradient-to-br ${categoryColor.bgClass} border cursor-pointer relative`}
      onClick={() => onEdit && onEdit(habit)}
      initial="initial"
      animate="animate"
      exit="exit"
      whileHover="hover"
      variants={cardVariants}
      layout
    >
      <div className="flex flex-col sm:flex-row">
        <div className="flex items-center">
          <motion.div 
            className={`w-9 h-9 sm:w-10 sm:h-12 rounded-full ${categoryColor.iconBg} flex items-center justify-center text-white mr-3 sm:mr-4`}
            whileHover={{ rotate: 10, scale: 1.1 }}
          >
            {getCategoryIcon(habit.category)}
          </motion.div>
          <div className="flex-1">
            <h3 className="font-medium text-white text-sm sm:text-base">
              {habit.name}
              {habit.subHabits && habit.subHabits.length > 0 && (
                <motion.button 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    setShowSubHabits(!showSubHabits); 
                  }}
                  className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-black/30 text-white/80"
                  whileTap={{ scale: 0.95 }}
                  whileHover={{ backgroundColor: "rgba(0,0,0,0.4)" }}
                >
                  {habit.subHabits.length} sub
                  <motion.div
                    animate={{ rotate: showSubHabits ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <FiChevronDown className="ml-1 w-3 h-3" />
                  </motion.div>
                </motion.button>
              )}
            </h3>
            <div className="flex flex-wrap items-center text-xs sm:text-sm text-white/80 mt-1">
              <div className="flex items-center mr-4 mb-1 sm:mb-0">
                <FiClock className="mr-1 w-3 h-3" />
                <span>{getFrequencyText(habit.frequency)}</span>
              </div>
              <div className="flex items-center">
                <FiStar className="mr-1 w-3 h-3" />
                <span>
                  <span className={`font-medium ${categoryColor.textColor}`}>{habit.streak.current}</span> day streak
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex justify-between items-center mt-2 sm:mt-0 sm:ml-auto">
          <div className="flex-1 sm:flex-none mr-2 sm:mr-0">
            {/* Display duration if specified */}
            {habit.duration && (
              <div className="flex flex-col sm:items-end">
                <div className="text-xs text-white/70 mb-1 sm:mb-0">
                  <span className={`font-medium ${categoryColor.textColor}`}>{habit.duration}</span> 
                  hr{habit.duration !== 1 ? 's' : ''}
                </div>
                
                {studyProgress && (
                  <motion.div 
                    className="text-xs text-white/90 font-medium bg-white/10 px-2 py-0.5 rounded-full inline-block mt-1 sm:mt-2"
                    whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.15)" }}
                  >
                    {studyProgress.percentComplete.toFixed(0)}%
                  </motion.div>
                )}
              </div>
            )}
          </div>
          
          <div className="flex items-center">
            <motion.button
              onClick={handleComplete}
              className={`w-8 h-8 sm:w-9 sm:h-10 flex items-center justify-center rounded-full focus:outline-none ${
                completedToday
                  ? `${categoryColor.iconBg} text-white`
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              } ${isCompleting ? 'pointer-events-none opacity-70' : ''}`}
              disabled={isCompleting}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <FiCheck className={`w-4 h-4 sm:w-5 sm:h-5 ${completedToday ? 'text-white' : 'text-white/70'}`} />
            </motion.button>
            
            <motion.button
              onClick={handleDelete}
              className="ml-2 w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-full text-white/60 hover:text-red-400 hover:bg-white/10 focus:outline-none"
              aria-label="Delete habit"
              whileHover={{ scale: 1.1, backgroundColor: "rgba(255,255,255,0.15)" }}
              whileTap={{ scale: 0.9 }}
            >
              <FiX className="w-4 h-4 sm:w-5 sm:h-5" />
            </motion.button>
          </div>
        </div>
      </div>
      
      {/* Progress bar for study and work habits with duration */}
      {studyProgress && (
        <div className="mt-2 sm:mt-3">
          <div className="flex justify-between text-xs text-white/70 mb-1">
            {subHabitsProgress ? (
              <>
                <span>{subHabitsProgress.completedHours.toFixed(1)} hrs</span>
                <span>{(subHabitsProgress.totalHours - subHabitsProgress.completedHours).toFixed(1)} left</span>
              </>
            ) : (
              <>
                <span>{studyProgress.hoursSpent.toFixed(1)} hrs</span>
                <span>{((habit.duration || 0) - studyProgress.hoursSpent).toFixed(1)} left</span>
              </>
            )}
          </div>
          <div className="bg-black/30 rounded-full h-1.5 sm:h-2 overflow-hidden">
            <motion.div 
              className={`${categoryColor.progressBg} h-full rounded-full`}
              initial={{ width: 0 }}
              animate={{ width: `${studyProgress.percentComplete}%` }}
              transition={{ duration: 1, type: "spring", stiffness: 60, damping: 20 }}
            />
          </div>
        </div>
      )}
      
      {/* Progress bar for habits with more than 1 repetition */}
      {isClient && habit.frequency.repetitions && habit.frequency.repetitions > 1 && !studyProgress && (
        <div className="mt-2 sm:mt-3">
          <div className="text-xs text-white/70 mb-1">
            {completionCount}/{habit.frequency.repetitions} today
          </div>
          <div className="bg-black/30 rounded-full h-1.5 sm:h-2 overflow-hidden">
            <motion.div 
              className={`${categoryColor.progressBg} h-full rounded-full`}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, type: "spring", stiffness: 60, damping: 20 }}
            />
          </div>
        </div>
      )}
      
      {/* Sub-habits section */}
      {habit.subHabits && habit.subHabits.length > 0 && (
        <AnimatePresence>
          {showSubHabits && (
            <motion.div 
              className="mt-3 pt-2 border-t border-white/10"
              variants={subHabitsVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              layout
            >
              <div className="flex justify-between items-center mb-2">
                <h5 className="text-xs text-white/80 font-medium">Sub-Habits</h5>
                <motion.button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsAddModalOpen(true);
                  }}
                  className="text-xs bg-black/20 hover:bg-black/30 p-1 rounded-full text-white/70 flex items-center"
                  whileHover={{ scale: 1.1, backgroundColor: "rgba(0,0,0,0.4)" }}
                  whileTap={{ scale: 0.95 }}
                >
                  <FiPlus className="w-3 h-3" />
                </motion.button>
              </div>
              
              <motion.div 
                className="space-y-2"
                variants={{
                  visible: {
                    transition: {
                      staggerChildren: 0.05
                    }
                  }
                }}
              >
                {subHabits.map(subHabit => {
                  // Calculate completion for this sub-habit
                  const completedHours = subHabit.completions
                    .filter(c => c.date.split('T')[0] === today)
                    .reduce((sum, c) => sum + (c.count || 0), 0);
                  
                  const completionPercentage = subHabit.duration 
                    ? (completedHours / subHabit.duration) * 100 
                    : 0;
                  
                  const isCompleted = completionPercentage >= 100;
                  
                  return (
                    <motion.div 
                      key={subHabit.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onEdit) onEdit(subHabit);
                      }} 
                      className="p-2 bg-black/20 rounded-lg border border-white/10 flex items-center"
                      variants={cardVariants}
                      whileHover={{ scale: 1.02, backgroundColor: "rgba(0,0,0,0.25)" }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <h5 className="text-xs sm:text-sm text-white font-medium">{subHabit.name}</h5>
                          <span className="text-xs text-white/80">
                            {completedHours.toFixed(1)}/{subHabit.duration?.toFixed(1)} hrs
                          </span>
                        </div>
                        
                        <div className="mt-1 bg-black/30 rounded-full h-1.5 overflow-hidden">
                          <motion.div 
                            className={`${categoryColor.progressBg} h-full rounded-full`}
                            initial={{ width: 0 }}
                            animate={{ width: `${completionPercentage}%` }}
                            transition={{ duration: 0.8, type: "spring", stiffness: 60, damping: 20 }}
                          />
                        </div>
                      </div>
                      
                      <div className="flex ml-3">
                        <motion.button
                          onClick={(e) => handleSubHabitComplete(subHabit, e)}
                          className={`w-7 h-7 flex items-center justify-center rounded-full focus:outline-none ${
                            isCompleted
                              ? `${categoryColor.iconBg} text-white`
                              : 'bg-white/10 text-white/70 hover:bg-white/20'
                          }`}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <FiCheck className="w-3.5 h-3.5" />
                        </motion.button>
                      </div>
                    </motion.div>
                  );
                })}
                
                {subHabits.length === 0 && (
                  <motion.div 
                    className="text-center py-2 text-xs text-white/60"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    No sub-habits yet
                  </motion.div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
      
      {/* Add Sub-Habit Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <AddSubHabitModal 
            isOpen={isAddModalOpen}
            onClose={() => setIsAddModalOpen(false)}
            parentHabit={habit}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Helper function to convert category to icon
function categoryToIcon(category: string) {
  switch (category) {
    case 'study':
      return <FiBook className="w-6 h-6" />;
    case 'health':
      return <FiHeart className="w-6 h-6" />;
    case 'personal':
      return <FiCoffee className="w-6 h-6" />;
    case 'work':
      return <FiZap className="w-6 h-6" />;
    case 'creative':
      return <FiEdit3 className="w-6 h-6" />;
    default:
      return <FiStar className="w-6 h-6" />;
  }
}

// ... existing code ... 