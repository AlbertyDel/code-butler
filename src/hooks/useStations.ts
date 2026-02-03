import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { mockStations } from '@/lib/mock-data';
import type { Station, ChargerStatus } from '@/types';

interface UseStationsReturn {
  stations: Station[];
  addStation: (stationData: Partial<Station>) => void;
  updateStation: (stationData: Partial<Station>) => void;
  deleteStation: (stationId: string) => void;
  startCharging: (stationId: string) => void;
  stopCharging: (stationId: string) => void;
}

export function useStations(): UseStationsReturn {
  const { toast } = useToast();
  const [stations, setStations] = useState<Station[]>(mockStations);

  const addStation = useCallback((stationData: Partial<Station>) => {
    const newStation = stationData as Station;
    setStations(prev => [...prev, newStation]);
    toast({
      title: "Станция добавлена",
      description: `${newStation.name} успешно добавлена`,
    });
  }, [toast]);

  const updateStation = useCallback((stationData: Partial<Station>) => {
    setStations(prev => prev.map(station =>
      station.id === stationData.id ? { ...station, ...stationData } : station
    ));
    toast({
      title: "Станция обновлена",
      description: "Изменения сохранены",
    });
  }, [toast]);

  const deleteStation = useCallback((stationId: string) => {
    setStations(prev => {
      const station = prev.find(s => s.id === stationId);
      if (station) {
        toast({
          title: "Станция удалена",
          description: `${station.name} была удалена`,
        });
      }
      return prev.filter(s => s.id !== stationId);
    });
  }, [toast]);

  const updateStationStatus = useCallback((stationId: string, status: ChargerStatus) => {
    setStations(prev => prev.map(station =>
      station.id === stationId
        ? { ...station, status }
        : station
    ));
  }, []);

  const startCharging = useCallback((stationId: string) => {
    updateStationStatus(stationId, 'charging');
    toast({
      title: "Зарядка запущена",
      description: "Сессия зарядки успешно начата",
    });
  }, [updateStationStatus, toast]);

  const stopCharging = useCallback((stationId: string) => {
    updateStationStatus(stationId, 'available');
    toast({
      title: "Зарядка остановлена",
      description: "Сессия зарядки завершена",
    });
  }, [updateStationStatus, toast]);

  return {
    stations,
    addStation,
    updateStation,
    deleteStation,
    startCharging,
    stopCharging,
  };
}
