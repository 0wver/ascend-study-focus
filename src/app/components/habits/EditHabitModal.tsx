"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiCalendar, FiClock, FiTag, FiInfo, FiBook, FiHeart, FiCoffee, FiZap, FiEdit3, FiPlus } from 'react-icons/fi';
import { useHabitStore } from '@/app/store/habitStore';
import { DAYS_OF_WEEK, Habit } from '@/app/models/Habit';
import SubHabitList from './SubHabitList';
import AddSubHabitModal from './AddSubHabitModal';

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

const formStepVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 50 : -50,
    opacity: 0
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 400, damping: 30 }
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 50 : -50,
    opacity: 0,
    transition: { duration: 0.2 }
  })
};

interface EditHabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  habit: Habit | null;
}

const categoryOptions = [
  { id: 'study', name: 'Study', color: 'study', icon: <FiBook className="w-5 h-5" /> },
  { id: 'health', name: 'Health', color: 'health', icon: <FiHeart className="w-5 h-5" /> },
  { id: 'personal', name: 'Personal', color: 'personal', icon: <FiCoffee className="w-5 h-5" /> },
  { id: 'work', name: 'Work', color: 'work', icon: <FiZap className="w-5 h-5" /> },
  { id: 'creative', name: 'Creative', color: 'creative', icon: <FiEdit3 className="w-5 h-5" /> },
];

export default function EditHabitModal({ isOpen, onClose, habit }: EditHabitModalProps) {
  const { updateHabit } = useHabitStore();
  
  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'study' | 'health' | 'personal' | 'work' | 'creative'>('study');
  const [icon, setIcon] = useState('star');
  const [frequencyType, setFrequencyType] = useState<'daily' | 'weekly' | 'custom'>('daily');
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]); // Monday to Friday by default
  const [repetitions, setRepetitions] = useState(1);
  const [reminders, setReminders] = useState<string[]>([]);
  const [reminderTime, setReminderTime] = useState('09:00');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [duration, setDuration] = useState(1); // Default to 1 hour
  
  // State for sub-habit modal
  const [isSubHabitModalOpen, setIsSubHabitModalOpen] = useState(false);
  
  // Current step tracker for multi-step form
  const [step, setStep] = useState(1);
  const totalSteps = 3;
  
  // Direction for animation
  const [direction, setDirection] = useState(0);
  
  // Load habit data when opened
  useEffect(() => {
    if (habit && isOpen) {
      setName(habit.name);
      setDescription(habit.description || '');
      setCategory(habit.category);
      setIcon(habit.icon);
      setFrequencyType(habit.frequency.type === 'monthly' ? 'weekly' : habit.frequency.type);
      setSelectedDays(habit.frequency.days || [1, 2, 3, 4, 5]);
      setRepetitions(habit.frequency.repetitions);
      setReminders(habit.schedule.times || []);
      setTags(habit.tags || []);
      setDuration(habit.duration || 1); // Set duration from habit or default to 1
    }
  }, [habit, isOpen]);
  
  // Reset form
  const resetForm = () => {
    setName('');
    setDescription('');
    setCategory('study');
    setIcon('star');
    setFrequencyType('daily');
    setSelectedDays([1, 2, 3, 4, 5]);
    setRepetitions(1);
    setReminders([]);
    setReminderTime('09:00');
    setTags([]);
    setTagInput('');
    setDuration(1);
    setStep(1);
  };
  
  // Close modal and reset form
  const handleClose = () => {
    resetForm();
    onClose();
  };
  
  // Add a tag
  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };
  
  // Remove a tag
  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };
  
  // Add a reminder time
  const addReminder = () => {
    if (reminderTime && !reminders.includes(reminderTime)) {
      setReminders([...reminders, reminderTime]);
    }
  };
  
  // Remove a reminder time
  const removeReminder = (time: string) => {
    setReminders(reminders.filter(t => t !== time));
  };
  
  // Toggle day selection for weekly habits
  const toggleDay = (day: number) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter(d => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };
  
  // Get theme classes based on category
  const getCategoryClasses = (categoryId: string) => {
    switch (categoryId) {
      case 'study':
        return {
          bgColor: 'bg-study-dark/30',
          textColor: 'text-white',
          borderColor: 'border-study-primary/30',
          selectedBg: 'bg-study-primary',
        };
      case 'health':
        return {
          bgColor: 'bg-health-dark/30',
          textColor: 'text-white',
          borderColor: 'border-health-primary/30',
          selectedBg: 'bg-health-primary',
        };
      case 'personal':
        return {
          bgColor: 'bg-personal-dark/30',
          textColor: 'text-white',
          borderColor: 'border-personal-primary/30',
          selectedBg: 'bg-personal-primary',
        };
      case 'work':
        return {
          bgColor: 'bg-work-dark/30',
          textColor: 'text-white',
          borderColor: 'border-work-primary/30',
          selectedBg: 'bg-work-primary',
        };
      case 'creative':
        return {
          bgColor: 'bg-creative-dark/30',
          textColor: 'text-white',
          borderColor: 'border-creative-primary/30',
          selectedBg: 'bg-creative-primary',
        };
      default:
        return {
          bgColor: 'bg-primary-900/20',
          textColor: 'text-white',
          borderColor: 'border-primary-400/30',
          selectedBg: 'bg-primary-600',
        };
    }
  };
  
  // Next step with animation direction
  const nextStep = () => {
    if (step < totalSteps) {
      setDirection(1);
      setStep(step + 1);
    }
  };
  
  // Previous step with animation direction
  const prevStep = () => {
    if (step > 1) {
      setDirection(-1);
      setStep(step - 1);
    }
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!habit) return;
    
    // Validate frequency data to prevent errors
    let frequencyData = {};
    if (frequencyType === 'weekly') {
      frequencyData = {
        type: frequencyType,
        days: selectedDays,
        repetitions: repetitions,
      };
    } else {
      frequencyData = {
        type: 'daily',
        repetitions: repetitions,
      };
    }
    
    // Update the habit
    updateHabit(habit.id, {
      name,
      description,
      icon,
      category,
      tags,
      frequency: frequencyData as any,
      schedule: {
        times: reminders,
        sound: 'bell',
        vibration: true,
      },
      duration: duration, // Update the duration field
    });
    
    // Close the modal and reset form
    handleClose();
  };
  
  // Determine if current step is valid
  const isCurrentStepValid = () => {
    if (step === 1) {
      return name.trim().length > 0 && category;
    }
    if (step === 2) {
      return true; // Frequency settings are pre-populated with defaults
    }
    return true;
  };
  
  // Get the selected category theme
  const selectedCategoryClasses = getCategoryClasses(category);
  
  if (!isOpen || !habit) return null;
  
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-start sm:items-center justify-center"
          initial="hidden"
          animate="visible"
          exit="hidden"
          variants={backdropVariants}
          key="main-modal"
        >
          <motion.div 
            className="relative bg-dark w-full max-w-md rounded-xl shadow-xl overflow-hidden border border-white/10 my-2 sm:my-0"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            style={{ maxHeight: 'calc(100vh - 16px)' }}
        >
          {/* Header */}
            <div className={`p-4 sm:p-5 ${
              category === 'study' ? 'bg-gradient-to-r from-study-dark to-study-primary/40 border-b border-study-primary/30' :
              category === 'health' ? 'bg-gradient-to-r from-health-dark to-health-primary/40 border-b border-health-primary/30' :
              category === 'personal' ? 'bg-gradient-to-r from-personal-dark to-personal-primary/40 border-b border-personal-primary/30' :
              category === 'work' ? 'bg-gradient-to-r from-work-dark to-work-primary/40 border-b border-work-primary/30' :
              'bg-gradient-to-r from-creative-dark to-creative-primary/40 border-b border-creative-primary/30'
            }`}>
              <div className="flex justify-between items-center">
                <h2 className="text-lg sm:text-xl font-display font-bold text-white">
              Edit Habit
                </h2>
                <motion.button 
                  className="p-2 rounded-full bg-black/20 text-white/80 hover:bg-black/30 hover:text-white touch-manipulation"
              onClick={handleClose}
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
            >
                  <FiX className="w-5 h-5" />
                </motion.button>
          </div>
          
              {/* Progress indicator */}
              <div className="mt-2 sm:mt-3 flex space-x-1">
                {Array.from({ length: totalSteps }).map((_, index) => (
                  <motion.div 
                    key={index}
                    className={`h-1 rounded-full flex-1 ${
                      index + 1 === step 
                        ? (
                            category === 'study' ? 'bg-study-primary' :
                            category === 'health' ? 'bg-health-primary' :
                            category === 'personal' ? 'bg-personal-primary' :
                            category === 'work' ? 'bg-work-primary' :
                            'bg-creative-primary'
                          )
                        : index + 1 < step 
                        ? (
                            category === 'study' ? 'bg-study-primary/70' :
                            category === 'health' ? 'bg-health-primary/70' :
                            category === 'personal' ? 'bg-personal-primary/70' :
                            category === 'work' ? 'bg-work-primary/70' :
                            'bg-creative-primary/70'
                          )
                        : 'bg-white/20'
                    }`}
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  />
              ))}
            </div>
          </div>
          
            {/* Form content */}
            <div className="p-4 sm:p-5 bg-black/60 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 130px)' }}>
              <form onSubmit={handleSubmit}>
                <AnimatePresence custom={direction} mode="wait">
                  <motion.div
                    key={step}
                    custom={direction}
                    variants={formStepVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                  >
                    {/* Step 1: Basic Info */}
            {step === 1 && (
                <div>
                        <h3 className="text-white text-lg font-medium mb-4">Basic Information</h3>
                        
                        {/* Name */}
                        <div className="mb-4">
                          <label htmlFor="name" className="block text-sm font-medium text-white/90 mb-1">
                    Habit Name
                  </label>
                          <motion.input
                            id="name"
                    type="text"
                            className="input"
                            placeholder="e.g., Read a book"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                            required
                            initial={{ y: 10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.1 }}
                  />
                </div>
                
                        {/* Description */}
                        <div className="mb-4">
                          <label htmlFor="description" className="block text-sm font-medium text-white/90 mb-1">
                            Description (optional)
                  </label>
                          <motion.textarea
                    id="description"
                            className="input min-h-[80px]"
                            placeholder="What's your habit about?"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                            initial={{ y: 10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                  />
                </div>
                
                        {/* Category */}
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-white/90 mb-1">
                    Category
                  </label>
                          <motion.div 
                            className="grid grid-cols-3 gap-2"
                            initial={{ y: 10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                          >
                            {categoryOptions.map((option) => (
                              <motion.button
                                key={option.id}
                        type="button"
                                className={`flex flex-col items-center justify-center p-3 rounded-lg border ${
                                  category === option.id
                                    ? (
                                        option.id === 'study' ? 'bg-study-primary/30 border-study-primary/60' :
                                        option.id === 'health' ? 'bg-health-primary/30 border-health-primary/60' :
                                        option.id === 'personal' ? 'bg-personal-primary/30 border-personal-primary/60' :
                                        option.id === 'work' ? 'bg-work-primary/30 border-work-primary/60' :
                                        'bg-creative-primary/30 border-creative-primary/60'
                                      )
                                    : (
                                        option.id === 'study' ? 'bg-black/20 border-white/10 hover:bg-study-primary/10 hover:border-study-primary/30' :
                                        option.id === 'health' ? 'bg-black/20 border-white/10 hover:bg-health-primary/10 hover:border-health-primary/30' :
                                        option.id === 'personal' ? 'bg-black/20 border-white/10 hover:bg-personal-primary/10 hover:border-personal-primary/30' :
                                        option.id === 'work' ? 'bg-black/20 border-white/10 hover:bg-work-primary/10 hover:border-work-primary/30' :
                                        'bg-black/20 border-white/10 hover:bg-creative-primary/10 hover:border-creative-primary/30'
                                      )
                                }`}
                                onClick={() => setCategory(option.id as any)}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.98 }}
                              >
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${
                                  category === option.id 
                                    ? (
                                        option.id === 'study' ? 'bg-study-primary' :
                                        option.id === 'health' ? 'bg-health-primary' :
                                        option.id === 'personal' ? 'bg-personal-primary' :
                                        option.id === 'work' ? 'bg-work-primary' :
                                        'bg-creative-primary'
                                      )
                                    : 'bg-black/30'
                                }`}>
                                  {option.icon}
                          </div>
                                <span className="text-xs text-white">{option.name}</span>
                              </motion.button>
                            ))}
                          </motion.div>
                        </div>
                        
                        {/* Duration (for study/work habits) */}
                        {(category === 'study' || category === 'work') && (
                          <motion.div 
                            className="mb-4"
                            initial={{ y: 10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.4 }}
                          >
                            <label htmlFor="duration" className="block text-sm font-medium text-white/90 mb-1">
                              Duration (hours)
                            </label>
                            <div className="flex items-center">
                              <input
                                id="duration"
                                type="number"
                                className="input"
                                min="0.5"
                                step="0.5"
                                value={duration}
                                onChange={(e) => setDuration(parseFloat(e.target.value))}
                              />
                              <span className="ml-2 text-white/70">hours</span>
                            </div>
                            <p className="text-xs text-white/60 mt-1">
                              Total time needed to complete this habit
                            </p>
                          </motion.div>
                        )}
                        
                        {/* Sub-habits section - show existing and add option */}
                        <motion.div
                          className="mt-4 pt-4 border-t border-white/10"
                          initial={{ y: 10, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.5 }}
                        >
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="text-sm font-medium text-white/90">Sub-Habits</h4>
                            {habit && (
                              <button 
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  setIsSubHabitModalOpen(true);
                                }}
                                className={`px-2 py-1 rounded-md text-xs ${
                                  category === 'study' ? 'bg-study-primary/20 hover:bg-study-primary/30 text-study-primary' :
                                  category === 'health' ? 'bg-health-primary/20 hover:bg-health-primary/30 text-health-primary' :
                                  category === 'personal' ? 'bg-personal-primary/20 hover:bg-personal-primary/30 text-personal-primary' :
                                  category === 'work' ? 'bg-work-primary/20 hover:bg-work-primary/30 text-work-primary' :
                                  'bg-creative-primary/20 hover:bg-creative-primary/30 text-creative-primary'
                                }`}
                              >
                                <FiPlus className="inline-block mr-1 w-3 h-3" /> Add Sub-Habit
                      </button>
                            )}
                  </div>
                          {habit?.subHabits && habit.subHabits.length > 0 ? (
                            <SubHabitList parentHabit={habit} showSubHabitsInline={true} />
                          ) : (
                            <p className="text-xs text-white/50 italic">
                              No sub-habits yet. Sub-habits help break down larger tasks into manageable pieces.
                            </p>
                          )}
                        </motion.div>
              </div>
            )}
            
            {/* Step 2: Frequency */}
            {step === 2 && (
              <div className="space-y-4">
                <div>
                          <label className="block text-sm font-medium text-white mb-2">
                            <div className="flex items-center">
                              <FiCalendar className="mr-2" />
                              Frequency
                            </div>
                  </label>
                          <div className="grid grid-cols-2 gap-3">
                            <motion.button
                      type="button"
                      onClick={() => setFrequencyType('daily')}
                              className={`p-3 rounded-lg border ${
                        frequencyType === 'daily'
                                  ? (
                                      category === 'study' ? 'bg-study-primary border-transparent' :
                                      category === 'health' ? 'bg-health-primary border-transparent' :
                                      category === 'personal' ? 'bg-personal-primary border-transparent' :
                                      category === 'work' ? 'bg-work-primary border-transparent' :
                                      'bg-creative-primary border-transparent'
                                    )
                                  : 'border-white/20 bg-black/30 hover:bg-black/40'
                              } text-white transition-colors duration-200`}
                              whileHover={{ scale: 1.03 }}
                              whileTap={{ scale: 0.97 }}
                            >
                              Daily
                            </motion.button>
                            <motion.button
                      type="button"
                      onClick={() => setFrequencyType('weekly')}
                              className={`p-3 rounded-lg border ${
                        frequencyType === 'weekly'
                                  ? (
                                      category === 'study' ? 'bg-study-primary border-transparent' :
                                      category === 'health' ? 'bg-health-primary border-transparent' :
                                      category === 'personal' ? 'bg-personal-primary border-transparent' :
                                      category === 'work' ? 'bg-work-primary border-transparent' :
                                      'bg-creative-primary border-transparent'
                                    )
                                  : 'border-white/20 bg-black/30 hover:bg-black/40'
                              } text-white transition-colors duration-200`}
                              whileHover={{ scale: 1.03 }}
                              whileTap={{ scale: 0.97 }}
                            >
                              Weekly
                            </motion.button>
                  </div>
                </div>
                
                        {/* Weekly days selector */}
                {frequencyType === 'weekly' && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                          >
                            <label className="block text-sm font-medium text-white mb-2">
                      Select Days
                    </label>
                            <div className="grid grid-cols-7 gap-1">
                      {DAYS_OF_WEEK.map((day) => (
                                <motion.button
                          key={day.id}
                          type="button"
                          onClick={() => toggleDay(day.id)}
                                  className={`p-2 rounded-md text-sm ${
                            selectedDays.includes(day.id)
                                      ? (
                                          category === 'study' ? 'bg-study-primary text-white' :
                                          category === 'health' ? 'bg-health-primary text-white' :
                                          category === 'personal' ? 'bg-personal-primary text-white' :
                                          category === 'work' ? 'bg-work-primary text-white' :
                                          'bg-creative-primary text-white'
                                        )
                                      : 'bg-black/30 text-white/70 hover:bg-black/40'
                                  }`}
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.95 }}
                        >
                          {day.shortName}
                                </motion.button>
                      ))}
                    </div>
                          </motion.div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    <div className="flex items-center">
                      <FiInfo className="mr-2" />
                      Times per day
                    </div>
                  </label>
                          <motion.input
                    type="number"
                    min="1"
                    max="10"
                    value={repetitions}
                    onChange={(e) => setRepetitions(parseInt(e.target.value) || 1)}
                    className="input w-full text-white bg-black/30 border-white/20"
                            initial={{ y: 5, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.1 }}
                  />
                  <p className="mt-1 text-sm text-white/70">
                    How many times do you want to complete this habit each day?
                  </p>
                </div>
              </div>
            )}
            
            {/* Step 3: Reminders & Tags */}
            {step === 3 && (
                      <div className="space-y-5">
                <div>
                          <label className="block text-sm font-medium text-white mb-2">
                    <div className="flex items-center">
                              <FiClock className="mr-2" />
                              Reminders <span className="text-white/60">(optional)</span>
                    </div>
                  </label>
                          <div className="flex gap-2">
                            <motion.input
                      type="time"
                      value={reminderTime}
                      onChange={(e) => setReminderTime(e.target.value)}
                              className="input flex-1 text-white bg-black/30 border-white/20"
                              initial={{ x: -5, opacity: 0 }}
                              animate={{ x: 0, opacity: 1 }}
                              transition={{ delay: 0.1 }}
                    />
                            <motion.button
                      type="button"
                      onClick={addReminder}
                              className={`p-2 rounded-lg text-white ${
                                category === 'study' ? 'bg-study-primary shadow-[0_0_10px_rgba(79,70,229,0.3)]' :
                                category === 'health' ? 'bg-health-primary shadow-[0_0_10px_rgba(16,185,129,0.3)]' :
                                category === 'personal' ? 'bg-personal-primary shadow-[0_0_10px_rgba(245,158,11,0.3)]' :
                                category === 'work' ? 'bg-work-primary shadow-[0_0_10px_rgba(79,70,229,0.3)]' :
                                'bg-creative-primary shadow-[0_0_10px_rgba(139,92,246,0.3)]'
                              }`}
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <FiPlus />
                            </motion.button>
                  </div>
                          
                          {reminders.length > 0 && (
                            <motion.div 
                              className="mt-2 flex flex-wrap gap-2"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: 0.2 }}
                            >
                    {reminders.map((time) => (
                                <motion.div
                        key={time}
                                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm text-white ${
                                    category === 'study' ? 'bg-study-dark/30' :
                                    category === 'health' ? 'bg-health-dark/30' :
                                    category === 'personal' ? 'bg-personal-dark/30' :
                                    category === 'work' ? 'bg-work-dark/30' :
                                    'bg-creative-dark/30'
                                  }`}
                                  initial={{ scale: 0.8, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  exit={{ scale: 0.8, opacity: 0 }}
                                  layout
                                >
                                  {time}
                        <button
                          type="button"
                          onClick={() => removeReminder(time)}
                                    className="ml-2 text-white/60 hover:text-red-500"
                        >
                                    <FiX className="h-3 w-3" />
                        </button>
                                </motion.div>
                    ))}
                            </motion.div>
                    )}
                </div>
                
                <div>
                          <label className="block text-sm font-medium text-white mb-2">
                    <div className="flex items-center">
                              <FiTag className="mr-2" />
                              Tags <span className="text-white/60">(optional)</span>
                    </div>
                  </label>
                          <div className="flex gap-2">
                            <motion.input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                              className="input flex-1 text-white bg-black/30 border-white/20"
                              placeholder="Enter a tag"
                              initial={{ x: -5, opacity: 0 }}
                              animate={{ x: 0, opacity: 1 }}
                              transition={{ delay: 0.1 }}
                            />
                            <motion.button
                      type="button"
                      onClick={addTag}
                              className={`p-2 rounded-lg text-white ${
                                category === 'study' ? 'bg-study-primary shadow-[0_0_10px_rgba(79,70,229,0.3)]' :
                                category === 'health' ? 'bg-health-primary shadow-[0_0_10px_rgba(16,185,129,0.3)]' :
                                category === 'personal' ? 'bg-personal-primary shadow-[0_0_10px_rgba(245,158,11,0.3)]' :
                                category === 'work' ? 'bg-work-primary shadow-[0_0_10px_rgba(79,70,229,0.3)]' :
                                'bg-creative-primary shadow-[0_0_10px_rgba(139,92,246,0.3)]'
                              }`}
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <FiPlus />
                            </motion.button>
                  </div>
                          
                          {tags.length > 0 && (
                            <motion.div 
                              className="mt-2 flex flex-wrap gap-2"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: 0.2 }}
                            >
                    {tags.map((tag) => (
                                <motion.div
                        key={tag}
                                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm text-white ${
                                    category === 'study' ? 'bg-study-dark/30' :
                                    category === 'health' ? 'bg-health-dark/30' :
                                    category === 'personal' ? 'bg-personal-dark/30' :
                                    category === 'work' ? 'bg-work-dark/30' :
                                    'bg-creative-dark/30'
                                  }`}
                                  initial={{ scale: 0.8, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  exit={{ scale: 0.8, opacity: 0 }}
                                  layout
                                >
                                  {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                                    className="ml-2 text-white/60 hover:text-red-500"
                        >
                                    <FiX className="h-3 w-3" />
                        </button>
                                </motion.div>
                              ))}
                            </motion.div>
                          )}
                        </div>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
            
            {/* Navigation buttons */}
                <div className="mt-5 sm:mt-6 flex justify-between">
                  <motion.button
                  type="button"
                    className={`py-2.5 px-4 sm:px-5 rounded-lg text-white text-sm sm:text-base font-medium border border-white/20 min-w-[90px] sm:min-w-[100px] touch-manipulation ${step === 1 ? 'invisible' : ''}`}
                  onClick={prevStep}
                    disabled={step === 1}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                >
                  Back
                  </motion.button>
              
              {step < totalSteps ? (
                    <motion.button
                  type="button"
                      className={`py-2.5 px-4 sm:px-5 rounded-lg text-white text-sm sm:text-base font-medium min-w-[90px] sm:min-w-[100px] touch-manipulation ${
                        category === 'study' ? 'bg-study-primary hover:bg-study-primary/90' :
                        category === 'health' ? 'bg-health-primary hover:bg-health-primary/90' :
                        category === 'personal' ? 'bg-personal-primary hover:bg-personal-primary/90' :
                        category === 'work' ? 'bg-work-primary hover:bg-work-primary/90' :
                        'bg-creative-primary hover:bg-creative-primary/90'
                      }`}
                  onClick={nextStep}
                  disabled={!isCurrentStepValid()}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                >
                  Next
                    </motion.button>
              ) : (
                    <motion.button
                  type="submit"
                      className={`py-2.5 px-4 sm:px-5 rounded-lg text-white text-sm sm:text-base font-medium min-w-[90px] sm:min-w-[100px] touch-manipulation ${
                        category === 'study' ? 'bg-study-primary hover:bg-study-primary/90' :
                        category === 'health' ? 'bg-health-primary hover:bg-health-primary/90' :
                        category === 'personal' ? 'bg-personal-primary hover:bg-personal-primary/90' :
                        category === 'work' ? 'bg-work-primary hover:bg-work-primary/90' :
                        'bg-creative-primary hover:bg-creative-primary/90'
                      }`}
                  disabled={!isCurrentStepValid()}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                >
                  Save Changes
                    </motion.button>
              )}
            </div>
          </form>
        </div>
          </motion.div>
        </motion.div>
      )}
      
      {/* Sub-habit modal */}
      {habit && isSubHabitModalOpen && (
        <AddSubHabitModal 
          isOpen={isSubHabitModalOpen}
          onClose={() => setIsSubHabitModalOpen(false)}
          parentHabit={habit}
          key="sub-habit-modal"
        />
      )}
    </AnimatePresence>
  );
} 