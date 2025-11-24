// src/store/dogStore.ts – FIXED VERSION
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Dog, NewDog, Litter } from '@/types/dog';
import { v4 as uuidv4 } from 'uuid';
import { addDays } from 'date-fns';

type Store = {
  dogs: Dog[];
  litters: Litter[];
  addDog: (dog: NewDog) => void; // ← comma was missing!
  updateDog: (id: string, updates: Partial<Dog>) => void;
  deleteDog: (id: string) => void;
  addLitter: (litter: Omit<Litter, 'id'>) => void;
  updateLitter: (id: string, updates: Partial<Litter>) => void;
  deleteLitter: (id: string) => void;
};

export const useDogStore = create<Store>()(
  persist(
    (set) => ({
      dogs: [],
      litters: [],
      addDog: (dog) =>
        set((state) => ({
          dogs: [
            ...state.dogs,
            {
              ...dog,
              id: uuidv4(),
              photos: dog.photos || [],
              healthTests: dog.healthTests || [],
              shotRecords: dog.shotRecords || [],
              reminders: dog.reminders || [],
            },
          ],
        })),
      updateDog: (id, updates) =>
        set((state) => ({
          dogs: state.dogs.map((d) => (d.id === id ? { ...d, ...updates } : d)),
        })),
      deleteDog: (id) =>
        set((state) => ({
          dogs: state.dogs.filter((d) => d.id !== id),
        })),
      addLitter: (litter) =>
        set((state) => ({
          litters: [...state.litters, { ...litter, id: uuidv4() }],
        })),
      updateLitter: (id, updates) =>
        set((state) => ({
          litters: state.litters.map((l) =>
            l.id === id ? { ...l, ...updates } : l
          ),
        })),
      deleteLitter: (id) =>
        set((state) => ({
          litters: state.litters.filter((l) => l.id !== id),
        })),
    }),
    {
      name: 'breeder-dogs', // ← THIS IS THE ORIGINAL KEY FROM WEEK 1
    }
  )
);
