import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { collection, addDoc, updateDoc, deleteDoc, doc, query, where, getDocs, onSnapshot } from 'firebase/firestore'
import { db } from '@/firebase'
import { format, parseISO, isSameDay } from 'date-fns'

export const useTimeSlotStore = defineStore('timeSlot', () => {
  const slots = ref([])
  const loading = ref(false)
  const error = ref(null)

  // Computed properties
  const availableSlots = computed(() => {
    return slots.value.filter(slot => slot.status === 'available')
  })

  const blockedSlots = computed(() => {
    return slots.value.filter(slot => slot.status === 'blocked')
  })

  const bookedSlots = computed(() => {
    return slots.value.filter(slot => slot.status === 'booked')
  })

  // Methods
  function getSlotsForDate(date) {
    return slots.value.filter(slot => isSameDay(parseISO(slot.date), date))
  }

  function getAllSlots() {
    return slots.value
  }

  async function addSlot(slotData) {
    try {
      loading.value = true
      const slotRef = await addDoc(collection(db, 'time_slots'), {
        ...slotData,
        createdAt: new Date().toISOString()
      })
      return slotRef.id
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateSlot(slotId, slotData) {
    try {
      loading.value = true
      const slotRef = doc(db, 'time_slots', slotId)
      await updateDoc(slotRef, {
        ...slotData,
        updatedAt: new Date().toISOString()
      })
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteSlot(slotId) {
    try {
      loading.value = true
      const slotRef = doc(db, 'time_slots', slotId)
      await deleteDoc(slotRef)
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function bulkEditSlots(bulkData) {
    try {
      loading.value = true
      const { startDate, endDate, startTime, endTime, action } = bulkData
      
      // Create slots for each day in the range
      const start = parseISO(startDate)
      const end = parseISO(endDate)
      const slots = []
      
      for (let date = start; date <= end; date.setDate(date.getDate() + 1)) {
        const slotData = {
          date: format(date, 'yyyy-MM-dd'),
          startTime,
          endTime,
          status: action === 'block' ? 'blocked' : 'available',
          capacity: 1,
          createdAt: new Date().toISOString()
        }
        
        const slotRef = await addDoc(collection(db, 'time_slots'), slotData)
        slots.push(slotRef.id)
      }
      
      return slots
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  function exportSlots() {
    const data = slots.value.map(slot => ({
      date: slot.date,
      startTime: slot.startTime,
      endTime: slot.endTime,
      status: slot.status,
      capacity: slot.capacity
    }))
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `time-slots-${format(new Date(), 'yyyy-MM-dd')}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Initialize real-time listener
  function initializeListener() {
    const q = query(collection(db, 'time_slots'))
    return onSnapshot(q, (snapshot) => {
      slots.value = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
    }, (err) => {
      error.value = err.message
    })
  }

  return {
    slots,
    loading,
    error,
    availableSlots,
    blockedSlots,
    bookedSlots,
    getSlotsForDate,
    getAllSlots,
    addSlot,
    updateSlot,
    deleteSlot,
    bulkEditSlots,
    exportSlots,
    initializeListener
  }
}) 