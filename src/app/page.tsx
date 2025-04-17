"use client";

/* eslint-disable @typescript-eslint/no-unused-vars */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { format, subDays, startOfDay, isSameDay, parseISO, isToday } from 'date-fns';
import { FiPlus, FiClock, FiBarChart2, FiChevronRight, FiStar, FiCalendar, FiSettings, FiX, FiZap, FiPlusCircle, FiChevronDown, FiEdit2, FiTrash2 } from 'react-icons/fi';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './components/layout/Navbar';
import HabitCard from './components/habits/HabitCard';
import AddHabitModal from './components/habits/AddHabitModal';
import EditHabitModal from './components/habits/EditHabitModal';
import HabitCalendar from './components/habits/HabitCalendar';
import { useHabitStore } from './store/habitStore';
import { useTimerStore } from './store/timerStore';
import { Habit } from './models/Habit';

// Animation variants
const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      type: "spring", 
      stiffness: 260, 
      damping: 20 
    } 
  },
  hover: { 
    y: -8,
    boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
    transition: { duration: 0.3 }
  }
};

// Motivational quotes for typewriter effect
const motivationalQuotes = [
  "Discipline is the bridge to goals.",
  "Consistency compounds.",
  "Show up today.",
  "Embrace the effort.",
  "Progress, not perfection.",
  "Do the work.",
  "Small steps, big results.",
  "Own the process.",
  "Focus fuels success.",
  "Keep going.",
  "Master the mundane.",
  "Action over inaction.",
  "Build your future self.",
  "One day at a time.",
  "Hard work pays off.",
  "Repetition builds mastery.",
  "Choose discipline over regret.",
  "Forge your habits.",
  "Make today count.",
  "The grind is the gift."
];

export default function Dashboard() {
  const { habits } = useHabitStore();
  const { studySessions } = useTimerStore();
  const [isClient, setIsClient] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [statCardIndex, setStatCardIndex] = useState(0);
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(true);
  
  // Format the selected date for display
  const selectedDateFormatted = format(selectedDate, 'EEEE, MMMM d');
  
  // Filter habits for the selected date - moved before conditional return
  const habitsForSelectedDate = useMemo(() => {
    // Filter habits that should be done on the selected date
    const filteredHabits = habits.filter(habit => {
      // Only show parent habits, not sub-habits
      if (habit.isSubHabit) {
        return false;
      }
      
      // For daily habits, include them every day
      if (habit.frequency.type === 'daily') {
        return true;
      }
      
      // For weekly habits, check if the selected day is in the frequency days
      if (habit.frequency.type === 'weekly' && habit.frequency.days) {
        const dayOfWeek = selectedDate.getDay(); // 0 for Sunday, 1 for Monday, etc.
        return habit.frequency.days.includes(dayOfWeek);
      }
      
      // For monthly habits, check if the selected date is in the frequency dates
      if (habit.frequency.type === 'monthly' && habit.frequency.dates) {
        const dayOfMonth = selectedDate.getDate(); // 1-31
        return habit.frequency.dates.includes(dayOfMonth);
      }
      
      return false;
    });
    
    return filteredHabits;
  }, [habits, selectedDate]);
  
  // Handle typewriter effect for motivational quotes
  useEffect(() => {
    if (!isClient) return;
    
    // Select a random quote when component mounts if none is selected
    if (currentQuoteIndex === 0 && displayedText === "") {
      const randomIndex = Math.floor(Math.random() * motivationalQuotes.length);
      setCurrentQuoteIndex(randomIndex);
      // Don't set the full text right away - we'll type it out
    }
    
    // Listen for visibility change to update quote when tab is refocused
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const randomIndex = Math.floor(Math.random() * motivationalQuotes.length);
        setCurrentQuoteIndex(randomIndex);
        setDisplayedText(""); // Reset text to trigger typing animation
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isClient]);
  
  // Handle typing animation for the current quote
  useEffect(() => {
    if (!isClient) return;
    
    const currentQuote = motivationalQuotes[currentQuoteIndex];
    
    // Only animate if we haven't displayed the full quote yet
    if (displayedText.length < currentQuote.length) {
      const timeoutId = setTimeout(() => {
        setDisplayedText(currentQuote.slice(0, displayedText.length + 1));
      }, 50); // Adjust speed of typing
      
      return () => clearTimeout(timeoutId);
    }
  }, [displayedText, currentQuoteIndex, isClient]);
  
  // Prevent hydration issues
  useEffect(() => {
    setIsClient(true);
    
    // Clear any previous localStorage data to ensure a clean start
    const storedVersion = localStorage.getItem('ascend-habits-storage-version');
    if (storedVersion !== '2') {
      localStorage.removeItem('ascend-habits-storage');
      localStorage.setItem('ascend-habits-storage-version', '2');
    }
  }, []);
  
  // Only show UI when the component has mounted
  if (!isClient) {
    return (
      <div className="flex flex-col min-h-screen bg-dark text-white">
        <Navbar />
        <div className="flex justify-center items-center flex-grow">
          <div className="animate-pulse space-y-4 w-full max-w-3xl px-4">
            <div className="h-8 bg-black/20 rounded w-1/3"></div>
            <div className="h-24 bg-black/20 rounded"></div>
            <div className="h-24 bg-black/20 rounded"></div>
            <div className="h-24 bg-black/20 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  // Calculate daily progress for selected date
  const totalHabits = habitsForSelectedDate.length;
  
  // Get the formatted date string for the selected date
  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
  
  // Calculate completed habits considering sub-habits
  const completedHabits = habitsForSelectedDate.filter(habit => {
    // For parent habits with sub-habits
    if (habit.subHabits && habit.subHabits.length > 0) {
      // Get all sub-habits
      const subHabits = habits.filter(h => h.parentId === habit.id);
      
      if (subHabits.length === 0) return false; // No sub-habits found
      
      // Check if ALL sub-habits are completed for the selected date
      const allSubHabitsComplete = subHabits.every(subHabit => {
        // For study/work habits with duration
        if ((subHabit.category === 'study' || subHabit.category === 'work') && subHabit.duration) {
          const completedHours = subHabit.completions
            .filter(c => c.date.split('T')[0] === selectedDateStr)
            .reduce((sum, c) => sum + c.count, 0);
          
          return subHabit.duration > 0 ? (completedHours / subHabit.duration) * 100 >= 100 : false;
        } 
        // For regular habits
        else {
          return subHabit.completions.some(c => c.date.split('T')[0] === selectedDateStr);
        }
      });
      
      return allSubHabitsComplete;
    } 
    // For regular habits without sub-habits
    else if ((habit.category === 'study' || habit.category === 'work') && habit.duration) {
      // For study/work habits with duration
      const completedHours = habit.completions
        .filter(c => c.date.split('T')[0] === selectedDateStr)
        .reduce((sum, c) => sum + c.count, 0);
      
      return habit.duration > 0 ? (completedHours / habit.duration) * 100 >= 100 : false;
    } 
    // For regular habits without duration
    else {
      return habit.completions.some(c => c.date.split('T')[0] === selectedDateStr);
    }
  }).length;
  
  const progress = totalHabits > 0 ? (completedHabits / totalHabits) * 100 : 0;
  
  // Calculate hours studied today
  const today = format(new Date(), 'yyyy-MM-dd');
  
  // Calculate total hours from study sessions (both study and work categories combined for consistency)
  const totalStudyHours = studySessions
    .filter(session => session.startTime.startsWith(today))
    .reduce((total, session) => {
      return total + (session.duration / 3600); // Convert seconds to hours
    }, 0);
  
  // Calculate hours from habit completions
  const habitStudyHours = habits
    .filter(habit => (habit.category === 'study' || habit.category === 'work') && habit.duration)
    .reduce((total, habit) => {
      // Sum up hours from today's completions
      const todayHours = habit.completions
        .filter(completion => completion.date.startsWith(today))
        .reduce((sum, completion) => {
          let hoursForCompletion = 0;
          
          if (completion.notes && completion.notes.includes('hours of study with timer')) {
            // This is a timer-tracked completion - extract hours from the notes
            const hoursMatch = completion.notes.match(/Completed (\d+(\.\d+)?) hours/);
            if (hoursMatch && hoursMatch[1]) {
              hoursForCompletion = parseFloat(hoursMatch[1]);
            } else {
              // Fallback to the count if we can't parse the notes
              hoursForCompletion = completion.count || 0;
            }
          } else {
            // This is a manually tracked completion
            hoursForCompletion = completion.count || 0;
          }
          
          return sum + hoursForCompletion;
        }, 0);
      
      return total + todayHours;
    }, 0);
  
  // Total hours studied today (from study sessions and habit completions)
  const totalHoursStudiedToday = totalStudyHours + habitStudyHours;
  
  // Calculate average daily study hours (over the last 7 days)
  const last7Days = Array.from({ length: 7 }, (_, i) => format(subDays(new Date(), i), 'yyyy-MM-dd'));
  
  const dailyStudyHours = last7Days.map(dayStr => {
    // Hours from sessions
    const sessionHours = studySessions
      .filter(session => session.startTime.startsWith(dayStr))
      .reduce((total, session) => {
        return total + (session.duration / 3600);
      }, 0);
      
    // Hours from habit completions
    const habitHours = habits
      .filter(habit => (habit.category === 'study' || habit.category === 'work') && habit.duration)
      .reduce((total, habit) => {
        return total + habit.completions
          .filter(completion => completion.date.startsWith(dayStr))
          .reduce((sum, completion) => {
            let hoursForCompletion = 0;
            
            if (completion.notes && completion.notes.includes('hours of study with timer')) {
              // This is a timer-tracked completion - extract hours from the notes
              const hoursMatch = completion.notes.match(/Completed (\d+(\.\d+)?) hours/);
              if (hoursMatch && hoursMatch[1]) {
                hoursForCompletion = parseFloat(hoursMatch[1]);
              } else {
                // Fallback to the count if we can't parse the notes
                hoursForCompletion = completion.count || 0;
              }
            } else {
              // This is a manually tracked completion
              hoursForCompletion = completion.count || 0;
            }
            
            return sum + hoursForCompletion;
          }, 0);
      }, 0);
    
    return sessionHours + habitHours;
  });
  
  const averageDailyStudyHours = dailyStudyHours.reduce((sum, hours) => sum + hours, 0) / 7;
  
  // Calculate total work hours
  const totalWorkHours = studySessions
    .filter(session => session.startTime.startsWith(today) && session.subject.toLowerCase().includes('work'))
    .reduce((total, session) => {
      return total + (session.duration / 3600);
    }, 0);
    
  // Add work hours from habit completions
  const workHoursFromHabits = habits
    .filter(habit => habit.category === 'work' && habit.duration)
    .reduce((total, habit) => {
      return total + habit.completions
        .filter(completion => completion.date.startsWith(today))
        .reduce((sum, completion) => {
          let hoursForCompletion = 0;
          
          if (completion.notes && completion.notes.includes('hours of work with timer')) {
            // This is a timer-tracked completion - extract hours from the notes
            const hoursMatch = completion.notes.match(/Completed (\d+(\.\d+)?) hours/);
            if (hoursMatch && hoursMatch[1]) {
              hoursForCompletion = parseFloat(hoursMatch[1]);
            } else {
              // Fallback to the count if we can't parse the notes
              hoursForCompletion = completion.count || 0;
            }
          } else {
            // This is a manually tracked completion
            hoursForCompletion = completion.count || 0;
          }
          
          return sum + hoursForCompletion;
        }, 0);
    }, 0);
  
  const totalWorkHoursToday = totalWorkHours + workHoursFromHabits;
  
  // Create an array of stat cards to cycle through
  const statCards = [
    {
      title: "Hours Studied Today",
      value: totalHoursStudiedToday.toFixed(1),
      unit: "hrs",
      icon: <FiClock className="w-6 h-6" />,
      description: "",
      color: "blue"
    },
    {
      title: "Average Daily Study",
      value: averageDailyStudyHours.toFixed(1),
      unit: "hrs",
      icon: <FiBarChart2 className="w-6 h-6" />,
      description: "7-day average",
      color: "cyan"
    },
    {
      title: "Work Hours Today",
      value: totalWorkHoursToday.toFixed(1),
      unit: "hrs",
      icon: <FiZap className="w-6 h-6" />,
      description: "",
      color: "red"
    }
  ];
  
  // Function to cycle through stat cards
  const cycleStatCard = () => {
    setStatCardIndex((prevIndex) => (prevIndex + 1) % statCards.length);
  };
  
  // Get streaks for the streak leader feature
  const habitsByStreak = [...habits].sort((a, b) => b.streak.current - a.streak.current);
  const longestStreak = habitsByStreak.length > 0 ? habitsByStreak[0] : null;
  
  // Handle habit edit
  const handleEditHabit = (habit: Habit) => {
    setSelectedHabit(habit);
    setIsEditModalOpen(true);
  };
  
  // Handle calendar date selection
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };
  
  // Handle closing the add modal - animate new habits
  const handleAddModalClose = () => {
    setIsAddModalOpen(false);
  };
  
  return (
    <>
      <Navbar />
      <motion.main 
        className="max-w-4xl mx-auto px-4 pt-2 pb-6 sm:py-6"
        initial="hidden"
        animate="visible"
        variants={fadeIn}
      >
        <motion.div 
          className="mb-5 sm:mb-8"
          variants={fadeIn}
        >
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-white mb-1 sm:mb-2">{selectedDateFormatted}</h1>
          <motion.h2 
            className="text-xl sm:text-2xl font-display font-bold text-primary-400"
            key={currentQuoteIndex}
          >
            <span className="inline-block min-h-[2rem] sm:min-h-[2.5rem]">
              {displayedText}
              <motion.span
                animate={{ opacity: [1, 0] }}
                transition={{ repeat: Infinity, duration: 0.7 }}
                className="inline-block w-0.5 h-5 sm:h-6 bg-primary-400 ml-0.5"
              />
            </span>
          </motion.h2>
        </motion.div>
        
        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Daily Progress Card - Purple theme */}
          <motion.div 
            className="p-4 sm:p-5 rounded-xl bg-gradient-to-br from-purple-600/30 to-purple-400/10 border border-purple-500/30"
            variants={cardVariants}
            whileHover="hover"
          >
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-base sm:text-lg font-medium text-white">Today's Progress</h2>
              <motion.span 
                className="px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm bg-purple-500/40 text-white font-medium"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
              >
                {completedHabits}/{totalHabits}
              </motion.span>
            </div>
            
            <div className="mb-3 bg-black/30 rounded-full h-2 sm:h-3 overflow-hidden">
              <motion.div
                className="bg-gradient-to-r from-purple-600 to-purple-400 h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1, type: "spring", stiffness: 50 }}
              />
            </div>
            
            <div className="flex text-xs sm:text-sm justify-between text-white/90">
              <span className="flex items-center">{completedHabits} completed</span>
              <span className="flex items-center">{totalHabits - completedHabits} remaining</span>
            </div>
          </motion.div>
          
          {/* Dynamic Stat Card that cycles on click */}
          <motion.div 
            onClick={cycleStatCard}
            className={`p-4 sm:p-5 rounded-xl bg-gradient-to-br from-${statCards[statCardIndex].color}-600/30 to-${statCards[statCardIndex].color}-400/10 border border-${statCards[statCardIndex].color}-500/30 cursor-pointer`}
            variants={cardVariants}
            whileHover="hover"
            whileTap={{ scale: 0.98 }}
          >
            <h2 className="text-base sm:text-lg font-medium text-white mb-3">{statCards[statCardIndex].title}</h2>
            
            <div className="flex items-center">
              <motion.div 
                className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-${statCards[statCardIndex].color}-500/40 flex items-center justify-center text-white mr-4`}
                whileHover={{ rotate: 10, scale: 1.05 }}
              >
                {statCards[statCardIndex].icon}
              </motion.div>
              <div className="flex-1">
                <AnimatePresence mode="wait">
                  <motion.div 
                    key={statCards[statCardIndex].title}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="text-xl sm:text-2xl font-bold text-white"
                  >
                    {statCards[statCardIndex].value}
                    <span className="text-base sm:text-lg font-normal text-white/70 ml-1">{statCards[statCardIndex].unit}</span>
                  </motion.div>
                </AnimatePresence>
                {statCards[statCardIndex].description && (
                  <div className="text-xs sm:text-sm text-white/90 mt-1">
                    {statCards[statCardIndex].description}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
        
        {/* Fixed Action Button - moved from bottom for better mobile reachability */}
        <motion.div 
          className="fixed-action-buttons flex flex-col gap-3 fixed bottom-6 right-4 sm:bottom-20 sm:right-6 z-50"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.5, type: "spring", stiffness: 260, damping: 20 }}
        >
          <motion.button
            className="action-button-primary w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-primary-600 to-primary-700 shadow-[0_0_10px_rgba(249,115,22,0.4)] flex items-center justify-center"
            onClick={() => setIsAddModalOpen(true)}
            whileHover={{ scale: 1.1, boxShadow: "0 0 20px rgba(249,115,22,0.6)" }}
            whileTap={{ scale: 0.95 }}
          >
            <FiPlus className="text-white text-xl" />
          </motion.button>
        </motion.div>
        
        {/* Habits List */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg sm:text-xl font-medium text-white">Your Habits</h2>
            <motion.button 
              className="text-xs sm:text-sm text-primary-400 flex items-center hover:text-primary-300 transition-colors duration-300"
              onClick={() => setIsCalendarOpen(true)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
            >
              <FiCalendar className="mr-1.5 w-3 h-3 sm:w-4 sm:h-4" />
              Select Date
            </motion.button>
          </div>
          
          <motion.div 
            className="space-y-3 sm:space-y-4"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {habitsForSelectedDate.length > 0 ? (
              habitsForSelectedDate.map((habit, index) => (
                <motion.div
                  key={habit.id}
                  variants={cardVariants}
                  custom={index}
                  transition={{ delay: index * 0.05 }}
                >
                  <HabitCard 
                    habit={habit} 
                    onClick={() => handleEditHabit(habit)} 
                    onEdit={() => handleEditHabit(habit)} 
                  />
                </motion.div>
              ))
            ) : (
              <motion.div 
                className="p-4 sm:p-6 rounded-xl bg-gradient-to-br from-black/50 to-black/30 border border-white/10 text-center shadow-xl"
                variants={cardVariants}
              >
                <motion.div 
                  className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary-600 to-primary-500 flex items-center justify-center text-white"
                  animate={{ 
                    scale: [1, 1.05, 1],
                    rotate: [0, 2, -2, 0]
                  }}
                  transition={{ 
                    repeat: Infinity, 
                    repeatType: "reverse", 
                    duration: 4
                  }}
                >
                  <FiCalendar className="w-6 h-6 sm:w-7 sm:h-7" />
                </motion.div>
                <h3 className="text-lg sm:text-xl font-medium text-white mb-2">No Habits Scheduled</h3>
                <p className="text-sm text-white/70 mb-4 sm:mb-5 max-w-md mx-auto">
                  You don't have any habits scheduled for {selectedDateFormatted}.
                </p>
                <motion.button 
                  className="px-3 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-br from-primary-600 to-primary-700 text-white rounded-lg text-sm"
                  onClick={() => setIsAddModalOpen(true)}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <FiPlus className="mr-1.5 inline-block" />
                  Add a New Habit
                </motion.button>
              </motion.div>
            )}
          </motion.div>
        </div>
      </motion.main>
      
      {/* Modals */}
      <AnimatePresence>
        {isAddModalOpen && (
          <AddHabitModal 
            isOpen={isAddModalOpen} 
            onClose={handleAddModalClose} 
            selectedDate={selectedDate}
          />
        )}
      </AnimatePresence>
      
      <AnimatePresence>
        {isEditModalOpen && (
          <EditHabitModal
            isOpen={isEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false);
              setSelectedHabit(null);
            }}
            habit={selectedHabit}
          />
        )}
      </AnimatePresence>
      
      <AnimatePresence>
        {isCalendarOpen && (
          <HabitCalendar
            isOpen={isCalendarOpen}
            onClose={() => setIsCalendarOpen(false)}
            onSelectDate={handleDateSelect}
          />
        )}
      </AnimatePresence>
    </>
  );
}
