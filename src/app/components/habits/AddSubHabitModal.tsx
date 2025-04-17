"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiPlus, FiCalendar, FiClock, FiTag, FiInfo, FiBook, FiHeart, FiCoffee, FiZap, FiEdit3, FiAlertCircle } from 'react-icons/fi';
import { useHabitStore } from '@/app/store/habitStore';
import { DAYS_OF_WEEK, Habit } from '@/app/models/Habit';

// Animation variants
const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } }
};

const modalVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { type: "spring", stiffness: 400, damping: 30 }
  },
  exit: { opacity: 0, y: -20, scale: 0.95, transition: { duration: 0.2 } }
};

interface AddSubHabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  parentHabit: Habit | null;
}

const categoryOptions = [
  { id: 'study', name: 'Study', color: 'study', icon: <FiBook className="w-5 h-5" /> },
  { id: 'health', name: 'Health', color: 'health', icon: <FiHeart className="w-5 h-5" /> },
  { id: 'personal', name: 'Personal', color: 'personal', icon: <FiCoffee className="w-5 h-5" /> },
  { id: 'work', name: 'Work', color: 'work', icon: <FiZap className="w-5 h-5" /> },
  { id: 'creative', name: 'Creative', color: 'creative', icon: <FiEdit3 className="w-5 h-5" /> },
];

export default function AddSubHabitModal({ isOpen, onClose, parentHabit }: AddSubHabitModalProps) {
  const { addSubHabit, getSubHabits } = useHabitStore();
  
  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState<number>(1); // Default to 1 hour
  const [availableDuration, setAvailableDuration] = useState<number>(0);
  const [durationError, setDurationError] = useState<string>('');
  const [existingSubHabits, setExistingSubHabits] = useState<Habit[]>([]);
  
  // Calculate available duration
  useEffect(() => {
    if (parentHabit) {
      const subHabits = getSubHabits(parentHabit.id);
      setExistingSubHabits(subHabits);
      
      const totalSubHabitDuration = subHabits.reduce((sum, habit) => sum + (habit.duration || 0), 0);
      const available = Math.max(0, (parentHabit.duration || 0) - totalSubHabitDuration);
      setAvailableDuration(available);
      
      // If default duration is more than available, set to available
      if (duration > available) {
        setDuration(Math.max(0.5, available));
      }
    }
  }, [parentHabit, getSubHabits]);
  
  // Validate duration when it changes
  useEffect(() => {
    if (duration > availableDuration) {
      setDurationError(`Duration cannot exceed ${availableDuration.toFixed(1)} hours (parent habit limit)`);
    } else {
      setDurationError('');
    }
  }, [duration, availableDuration]);
  
  // Reset form
  const resetForm = () => {
    setName('');
    setDescription('');
    setDuration(Math.min(1, availableDuration));
    setDurationError('');
  };
  
  // Close modal and reset form
  const handleClose = () => {
    resetForm();
    onClose();
  };
  
  // Get the selected category theme based on parent habit
  const getCategoryClasses = (category: string) => {
    switch (category) {
      case 'study':
        return {
          headerBg: 'from-blue-600/40 to-blue-700/40',
          selectedBg: 'bg-blue-500/40',
          button: 'bg-blue-500 hover:bg-blue-600',
          text: 'text-blue-400',
          lightText: 'text-blue-300',
          iconBg: 'bg-blue-500/20',
        };
      case 'health':
        return {
          headerBg: 'from-green-600/40 to-green-700/40',
          selectedBg: 'bg-green-500/40',
          button: 'bg-green-500 hover:bg-green-600',
          text: 'text-green-400',
          lightText: 'text-green-300',
          iconBg: 'bg-green-500/20',
        };
      case 'personal':
        return {
          headerBg: 'from-yellow-600/40 to-yellow-700/40',
          selectedBg: 'bg-yellow-500/40',
          button: 'bg-yellow-500 hover:bg-yellow-600',
          text: 'text-yellow-400',
          lightText: 'text-yellow-300',
          iconBg: 'bg-yellow-500/20',
        };
      case 'work':
        return {
          headerBg: 'from-red-600/40 to-red-700/40',
          selectedBg: 'bg-red-500/40',
          button: 'bg-red-500 hover:bg-red-600',
          text: 'text-red-400',
          lightText: 'text-red-300',
          iconBg: 'bg-red-500/20',
        };
      case 'creative':
        return {
          headerBg: 'from-purple-600/40 to-purple-700/40',
          selectedBg: 'bg-purple-500/40',
          button: 'bg-purple-500 hover:bg-purple-600',
          text: 'text-purple-400',
          lightText: 'text-purple-300',
          iconBg: 'bg-purple-500/20',
        };
      default:
        return {
          headerBg: 'from-primary-600/40 to-primary-700/40',
          selectedBg: 'bg-primary-500/40',
          button: 'bg-primary-500 hover:bg-primary-600',
          text: 'text-primary-400',
          lightText: 'text-primary-300',
          iconBg: 'bg-primary-500/20',
        };
    }
  };
  
  // Handle form submission
  const handleSubmit = () => {
    if (!parentHabit) return;
    
    // Validate duration doesn't exceed available duration
    if (duration > availableDuration) {
      setDurationError(`Duration cannot exceed ${availableDuration.toFixed(1)} hours (parent habit limit)`);
      return;
    }
    
    // Add the sub-habit to the store
    addSubHabit(parentHabit.id, {
      name,
      description,
      icon: 'star', // Use same icon as parent or default to star
      category: parentHabit.category, // Sub-habit inherits parent's category
      tags: [...(parentHabit.tags || [])], // Inherit parent's tags
      frequency: {
        // Sub-habit inherits parent's frequency
        type: parentHabit.frequency.type,
        days: parentHabit.frequency.days,
        repetitions: parentHabit.frequency.repetitions,
      },
      schedule: {
        times: parentHabit.schedule.times,
        sound: 'bell',
        vibration: true,
      },
      duration: duration, // Add the duration in hours
    });
    
    // Close the modal and reset form
    handleClose();
  };
  
  if (!isOpen || !parentHabit) return null;
  
  // Get the selected category theme based on parent habit
  const selectedCategoryClasses = getCategoryClasses(parentHabit.category);
  
  return (
    <AnimatePresence>
      <motion.div 
        className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        initial="hidden"
        animate="visible"
        exit="hidden"
        variants={backdropVariants}
      >
        <motion.div 
          className="relative bg-dark w-full max-w-md rounded-xl shadow-xl overflow-hidden border border-white/10"
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {/* Header */}
          <div className={`p-5 ${
            parentHabit.category === 'study' ? 'bg-gradient-to-r from-study-dark to-study-primary/40 border-b border-study-primary/30' :
            parentHabit.category === 'health' ? 'bg-gradient-to-r from-health-dark to-health-primary/40 border-b border-health-primary/30' :
            parentHabit.category === 'personal' ? 'bg-gradient-to-r from-personal-dark to-personal-primary/40 border-b border-personal-primary/30' :
            parentHabit.category === 'work' ? 'bg-gradient-to-r from-work-dark to-work-primary/40 border-b border-work-primary/30' :
            'bg-gradient-to-r from-creative-dark to-creative-primary/40 border-b border-creative-primary/30'
          }`}>
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-display font-bold text-white">
                Add Sub-Habit to {parentHabit.name}
              </h2>
              <motion.button 
                className="p-1 rounded-full bg-black/20 text-white/80 hover:bg-black/30 hover:text-white"
                onClick={handleClose}
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
              >
                <FiX className="w-5 h-5" />
              </motion.button>
            </div>
          </div>
          
          {/* Form content */}
          <div className="p-5 bg-black/60">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <div>
                <label htmlFor="subName" className="block text-sm font-medium text-white/90 mb-1">
                  Sub-Habit Name
                </label>
                <motion.input
                  id="subName"
                  type="text"
                  className="input w-full"
                  placeholder="E.g., Read Chapter 1"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  initial={{ y: 5, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                />
              </div>
              
              <div>
                <label htmlFor="subDescription" className="block text-sm font-medium text-white/90 mb-1">
                  Description (optional)
                </label>
                <motion.textarea
                  id="subDescription"
                  className="input w-full min-h-[80px]"
                  placeholder="Describe what this sub-habit involves"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  initial={{ y: 5, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                />
              </div>
              
              <div>
                <label htmlFor="subDuration" className="block text-sm font-medium text-white/90 mb-1">
                  Duration (hours)
                </label>
                <div className="flex items-center">
                  <motion.input
                    id="subDuration"
                    type="number"
                    className={`input w-full ${durationError ? 'border-red-500' : ''}`}
                    min="0.1"
                    step="0.1"
                    value={duration}
                    onChange={(e) => setDuration(Math.max(0.1, parseFloat(e.target.value) || 0))}
                    initial={{ y: 5, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  />
                  <span className="ml-2 text-white/70">hrs</span>
                </div>
                {durationError ? (
                  <motion.p
                    className="mt-1 text-xs text-red-500 flex items-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <FiAlertCircle className="mr-1" /> {durationError}
                  </motion.p>
                ) : (
                  <p className="mt-1 text-xs text-white/60">
                    Available: {availableDuration.toFixed(1)} hours from parent habit
                  </p>
                )}
              </div>
              
              {availableDuration === 0 && (
                <motion.div
                  className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-sm text-white/90"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="flex items-start">
                    <FiAlertCircle className="mt-0.5 mr-2 flex-shrink-0 text-red-400" />
                    <p>
                      The parent habit's duration is already fully allocated to existing sub-habits. 
                      Consider increasing the parent habit's duration to add more sub-habits.
                    </p>
                  </div>
                </motion.div>
              )}
              
              {existingSubHabits.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-white/90 mb-2">Existing Sub-Habits</h4>
                  <div className="space-y-2 max-h-36 overflow-y-auto pr-2">
                    {existingSubHabits.map(subHabit => (
                      <motion.div
                        key={subHabit.id}
                        className="p-2 bg-black/20 rounded-lg border border-white/10"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <div className="flex justify-between">
                          <span className="text-sm text-white/90">{subHabit.name}</span>
                          <span className="text-xs text-white/70">{subHabit.duration}h</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="pt-4 flex justify-end space-x-3">
                <motion.button
                  type="button"
                  className="px-4 py-2 rounded-lg bg-black/30 text-white/80 border border-white/20"
                  onClick={handleClose}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  type="button"
                  className={`px-4 py-2 rounded-lg text-white ${
                    parentHabit.category === 'study' ? 'bg-study-primary hover:bg-study-primary/90' :
                    parentHabit.category === 'health' ? 'bg-health-primary hover:bg-health-primary/90' :
                    parentHabit.category === 'personal' ? 'bg-personal-primary hover:bg-personal-primary/90' :
                    parentHabit.category === 'work' ? 'bg-work-primary hover:bg-work-primary/90' :
                    'bg-creative-primary hover:bg-creative-primary/90'
                  }`}
                  onClick={handleSubmit}
                  disabled={!name.trim() || duration <= 0 || duration > availableDuration}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Add Sub-Habit
                </motion.button>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
} 