import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Habit, HabitCompletion } from '../models/Habit';
import { format } from 'date-fns';

interface HabitState {
  habits: Habit[];
  addHabit: (habit: Omit<Habit, 'id' | 'createdAt' | 'updatedAt' | 'streak' | 'completions'>, selectedDate?: Date) => void;
  addSubHabit: (parentId: string, habit: Omit<Habit, 'id' | 'createdAt' | 'updatedAt' | 'streak' | 'completions' | 'parentId' | 'isSubHabit'>) => void;
  updateHabit: (id: string, updates: Partial<Habit>) => void;
  deleteHabit: (id: string) => void;
  completeHabit: (completion: HabitCompletion) => void;
  completeSubHabit: (parentId: string, subHabitId: string, completion: Omit<HabitCompletion, 'habitId' | 'subHabitId'>) => void;
  undoHabitCompletion: (habitId: string, date: string) => void;
  undoSubHabitCompletion: (parentId: string, subHabitId: string, date: string) => void;
  getSubHabits: (parentId: string) => Habit[];
  resetHabits: () => void;
}

// Empty initial state - no sample habits
const initialHabits: Habit[] = [];

export const useHabitStore = create<HabitState>()(
  persist(
    (set, get) => ({
      habits: initialHabits,
      addHabit: (habit, selectedDate) => {
        // Create date objects in the correct format
        const now = selectedDate || new Date();
        const formattedDate = format(now, 'yyyy-MM-dd');
        const isoTime = new Date().toISOString().split('T')[1];
        const fullIsoString = `${formattedDate}T${isoTime}`;
        
        const newHabit: Habit = {
          ...habit,
          id: Date.now().toString(),
          createdAt: fullIsoString, // Use formatted date string to avoid timezone issues
          updatedAt: fullIsoString,
          streak: {
            current: 0,
            longest: 0,
          },
          completions: [],
          subHabits: [],
        };
        
        set((state) => ({ habits: [...state.habits, newHabit] }));
      },
      addSubHabit: (parentId, habit) => {
        const now = new Date();
        const formattedDate = format(now, 'yyyy-MM-dd');
        const isoTime = new Date().toISOString().split('T')[1];
        const fullIsoString = `${formattedDate}T${isoTime}`;
        
        const subHabitId = `${parentId}-sub-${Date.now()}`;
        
        const newSubHabit: Habit = {
          ...habit,
          id: subHabitId,
          parentId: parentId,
          isSubHabit: true,
          createdAt: fullIsoString,
          updatedAt: fullIsoString,
          streak: {
            current: 0,
            longest: 0,
          },
          completions: [],
        };
        
        set((state) => {
          // First add the new sub-habit to the habits array
          const updatedHabits = [...state.habits, newSubHabit];
          
          // Then update the parent habit to include the sub-habit ID
          return {
            habits: updatedHabits.map(habit => 
              habit.id === parentId 
                ? { 
                    ...habit, 
                    subHabits: [...(habit.subHabits || []), subHabitId],
                    updatedAt: fullIsoString
                  }
                : habit
            )
          };
        });
      },
      updateHabit: (id, updates) => {
        const now = new Date();
        const updatedAt = now.toISOString();

        set((state) => {
          const updatedHabits = state.habits.map((habit) =>
            habit.id === id
              ? { ...habit, ...updates, updatedAt }
              : habit
          );

          // If this is a sub-habit and the duration changed, we may need to update parent's duration
          const updatedHabit = updatedHabits.find(h => h.id === id);
          if (updatedHabit?.isSubHabit && updatedHabit?.parentId && 'duration' in updates) {
            const parentHabit = updatedHabits.find(h => h.id === updatedHabit.parentId);
            if (parentHabit) {
              // Calculate new total duration based on all sub-habits
              const allSubHabits = updatedHabits.filter(h => 
                h.isSubHabit && h.parentId === parentHabit.id);
              
              const totalSubHabitsDuration = allSubHabits.reduce(
                (sum, subHabit) => sum + (subHabit.duration || 0), 0);
              
              // Update parent's duration
              return {
                habits: updatedHabits.map(h => 
                  h.id === parentHabit.id 
                    ? { ...h, duration: totalSubHabitsDuration, updatedAt } 
                    : h)
              };
            }
          }
          
          return { habits: updatedHabits };
        });
      },
      deleteHabit: (id) => {
        set((state) => {
          const habitToDelete = state.habits.find(h => h.id === id);
          
          // If this is a parent habit, also delete all sub-habits
          if (habitToDelete && habitToDelete.subHabits && habitToDelete.subHabits.length > 0) {
            const subHabitIds = habitToDelete.subHabits;
            return {
              habits: state.habits.filter(h => h.id !== id && !subHabitIds.includes(h.id))
            };
          }
          
          // If this is a sub-habit, update the parent's subHabits array
          if (habitToDelete && habitToDelete.isSubHabit && habitToDelete.parentId) {
            const parentId = habitToDelete.parentId;
            
            return {
              habits: state.habits
                .filter(h => h.id !== id) // Remove the sub-habit
                .map(h => h.id === parentId 
                  ? { 
                      ...h, 
                      subHabits: (h.subHabits || []).filter(subId => subId !== id),
                      updatedAt: new Date().toISOString()
                    } 
                  : h)
            };
          }
          
          // Regular habit deletion
          return {
            habits: state.habits.filter((habit) => habit.id !== id),
          };
        });
      },
      completeHabit: (completion) => {
        const today = format(new Date(), 'yyyy-MM-dd');
        const completionDate = completion.date ? completion.date.split('T')[0] : today;
        
        set((state) => {
          // Find the habit to update
          const habitIndex = state.habits.findIndex(h => h.id === completion.habitId);
          if (habitIndex === -1) return state;
          
          const habit = state.habits[habitIndex];
          
          // Find any existing completion for today
          const existingCompletionIndex = habit.completions.findIndex(
            c => c.date.split('T')[0] === completionDate
          );
          
          let updatedCompletions: HabitCompletion[] = [];
          
          if (existingCompletionIndex >= 0) {
            // For habits with duration, we should accumulate hours rather than replace
            if (habit.duration) {
              // Update existing completion by adding to the count (accumulate hours)
              const existingCompletion = habit.completions[existingCompletionIndex];
              const updatedCount = (existingCompletion.count || 0) + (completion.count || 1);
              
              updatedCompletions = [...habit.completions];
              updatedCompletions[existingCompletionIndex] = {
                ...existingCompletion,
                count: updatedCount,
                notes: completion.notes || existingCompletion.notes,
              };
            } else {
              // For regular habits, just update the existing completion
              updatedCompletions = [...habit.completions];
              updatedCompletions[existingCompletionIndex] = {
                ...updatedCompletions[existingCompletionIndex],
                count: completion.count || 1,
                notes: completion.notes,
              };
            }
          } else {
            // Add new completion with the proper date
            const completionDateTime = completion.date || 
              completionDate + 'T' + new Date().toISOString().split('T')[1];
              
            updatedCompletions = [
              ...habit.completions, 
              { 
                date: completionDateTime,
                count: completion.count || 1,
                notes: completion.notes,
                habitId: habit.id
              }
            ];
          }
          
          // Calculate new streak
          let currentStreak = habit.streak.current;
          const longestStreak = Math.max(habit.streak.longest, currentStreak);

          // Update the current streak based on completions
          // This will need to be refined in a real app with more robust streak logic
          currentStreak = 1; // At minimum, completing today gives a streak of 1
          
          // Update habit with new completions and streak
          const updatedHabit = {
            ...habit,
            completions: updatedCompletions,
            streak: {
              current: currentStreak,
              longest: longestStreak
            },
            updatedAt: new Date().toISOString()
          };
          
          // Create a new habits array with the updated habit
          const updatedHabits = [...state.habits];
          updatedHabits[habitIndex] = updatedHabit;
          
          return { habits: updatedHabits };
        });
      },
      completeSubHabit: (parentId, subHabitId, completion) => {
        const { completeHabit } = get();
        
        // First complete the sub-habit
        completeHabit({
          ...completion,
          habitId: subHabitId,
          subHabitId // Mark that this completion is for a sub-habit
        });
        
        // Get the updated sub-habit after completion
        const state = get();
        const subHabit = state.habits.find(h => h.id === subHabitId);
        const parentHabit = state.habits.find(h => h.id === parentId);
        
        if (subHabit && parentHabit) {
          // Get all sub-habits for this parent
          const allSubHabits = state.habits.filter(h => 
            h.isSubHabit && h.parentId === parentId);
          
          // Calculate total progress across all sub-habits for today
          const today = format(new Date(), 'yyyy-MM-dd');
          
          let totalProgress = 0;
          let totalDuration = 0;
          
          allSubHabits.forEach(subHabit => {
            const subHabitCompletions = subHabit.completions.filter(
              c => c.date.split('T')[0] === today
            );
            const completedHours = subHabitCompletions.reduce(
              (sum, comp) => sum + (comp.count || 0), 0);
            
            totalProgress += completedHours;
            totalDuration += (subHabit.duration || 0);
          });
          
          // Always update parent habit progress to match sub-habits
          // First, remove any existing completions for today on the parent
          const parentCompletions = parentHabit.completions.filter(
            c => c.date.split('T')[0] !== today
          );
          
          // Then create a new completion with the total progress from sub-habits
          if (totalProgress > 0) {
            set((state) => {
              const parentIndex = state.habits.findIndex(h => h.id === parentId);
              if (parentIndex === -1) return state;
              
              // Update the parent with new completions
              const updatedHabits = [...state.habits];
              updatedHabits[parentIndex] = {
                ...parentHabit,
                completions: [
                  ...parentCompletions,
                  {
                    date: today + 'T' + new Date().toISOString().split('T')[1],
                    count: totalProgress,
                    notes: `Updated from sub-habits progress`,
                    habitId: parentId
                  }
                ],
                updatedAt: new Date().toISOString()
              };
              
              return { habits: updatedHabits };
            });
          } else {
            // If no progress in sub-habits, ensure parent has no completions for today
            set((state) => {
              const parentIndex = state.habits.findIndex(h => h.id === parentId);
              if (parentIndex === -1) return state;
              
              // Update the parent with new completions (without today)
              const updatedHabits = [...state.habits];
              updatedHabits[parentIndex] = {
                ...parentHabit,
                completions: parentCompletions,
                updatedAt: new Date().toISOString()
              };
              
              return { habits: updatedHabits };
            });
          }
        }
      },
      undoHabitCompletion: (habitId, date) => {
        set((state) => {
          const habitIndex = state.habits.findIndex(h => h.id === habitId);
          if (habitIndex === -1) return state;
          
          const habit = state.habits[habitIndex];
          
          // Remove all completions for the specified date
          const updatedCompletions = habit.completions.filter(
            c => c.date.split('T')[0] !== date
          );
          
          // Update habit with new completions
          const updatedHabit = {
            ...habit,
            completions: updatedCompletions,
            updatedAt: new Date().toISOString()
          };
          
          // Create a new habits array with the updated habit
          const updatedHabits = [...state.habits];
          updatedHabits[habitIndex] = updatedHabit;
          
          return { habits: updatedHabits };
        });
      },
      undoSubHabitCompletion: (parentId, subHabitId, date) => {
        const { undoHabitCompletion } = get();
        
        // First undo the sub-habit completion
        undoHabitCompletion(subHabitId, date);
        
        // Get the updated state
        const state = get();
        const parentHabit = state.habits.find(h => h.id === parentId);
        
        if (parentHabit) {
          // Get all sub-habits for this parent
          const allSubHabits = state.habits.filter(h => 
            h.isSubHabit && h.parentId === parentId);
          
          // Calculate total progress across all sub-habits for the date
          let totalProgress = 0;
          
          allSubHabits.forEach(subHabit => {
            const subHabitCompletions = subHabit.completions.filter(
              c => c.date.split('T')[0] === date
            );
            const completedHours = subHabitCompletions.reduce(
              (sum, comp) => sum + (comp.count || 0), 0);
            
            totalProgress += completedHours;
          });
          
          // Always update parent with current total from sub-habits
          // First remove any existing completions for the date
          const parentCompletionsToKeep = parentHabit.completions.filter(
            c => c.date.split('T')[0] !== date
          );
          
          set((state) => {
            const parentIndex = state.habits.findIndex(h => h.id === parentId);
            if (parentIndex === -1) return state;
            
            const updatedHabits = [...state.habits];
            
            // If there's still progress, add a completion with the updated total
            if (totalProgress > 0) {
              updatedHabits[parentIndex] = {
                ...parentHabit,
                completions: [
                  ...parentCompletionsToKeep,
                  {
                    date: date + 'T' + new Date().toISOString().split('T')[1],
                    count: totalProgress,
                    notes: `Updated from sub-habits progress`,
                    habitId: parentId
                  }
                ],
                updatedAt: new Date().toISOString()
              };
            } else {
              // If no progress left, just remove all completions for the date
              updatedHabits[parentIndex] = {
                ...parentHabit,
                completions: parentCompletionsToKeep,
                updatedAt: new Date().toISOString()
              };
            }
            
            return { habits: updatedHabits };
          });
        }
      },
      getSubHabits: (parentId) => {
        const state = get();
        return state.habits.filter(h => h.isSubHabit && h.parentId === parentId);
      },
      resetHabits: () => {
        set({ habits: [] });
      },
    }),
    {
      name: 'ascend-habits-storage'
    }
  )
);
